BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    RAISE EXCEPTION 'storage schema is required';
  END IF;
END $$;

ALTER TABLE shiftpatch.nurse_credentials
  ADD COLUMN object_path text,
  ADD COLUMN document_name text,
  ADD COLUMN mime_type text,
  ADD COLUMN size_bytes bigint,
  ADD COLUMN uploaded_at timestamptz;

ALTER TABLE shiftpatch.nurse_credentials
  ADD CONSTRAINT nurse_credentials_document_complete CHECK (
    (
      object_path IS NULL
      AND document_name IS NULL
      AND mime_type IS NULL
      AND size_bytes IS NULL
      AND uploaded_at IS NULL
    )
    OR (
      object_path IS NOT NULL
      AND document_name IS NOT NULL
      AND mime_type IS NOT NULL
      AND size_bytes IS NOT NULL
      AND uploaded_at IS NOT NULL
    )
  ),
  ADD CONSTRAINT nurse_credentials_object_path_shape CHECK (
    object_path IS NULL
    OR object_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ),
  ADD CONSTRAINT nurse_credentials_mime CHECK (
    mime_type IS NULL OR mime_type IN ('application/pdf', 'image/jpeg', 'image/png')
  ),
  ADD CONSTRAINT nurse_credentials_size CHECK (
    size_bytes IS NULL OR (size_bytes > 0 AND size_bytes <= 2097152)
  );

CREATE UNIQUE INDEX nurse_credentials_object_path_key
  ON shiftpatch.nurse_credentials (object_path)
  WHERE object_path IS NOT NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'credentials',
  'credentials',
  false,
  2097152,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY credentials_insert_own ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'credentials'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1
      FROM shiftpatch.users AS u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.role = 'nurse'
    )
  );

CREATE POLICY credentials_select_own ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'credentials'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1
      FROM shiftpatch.users AS u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.role = 'nurse'
    )
  );

CREATE POLICY credentials_delete_own ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'credentials'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (
      SELECT 1
      FROM shiftpatch.users AS u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.role = 'nurse'
    )
  );

CREATE FUNCTION shiftpatch.read_credential()
RETURNS TABLE (
  expires_on text,
  document_name text,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz,
  object_path text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id text;
  v_role text;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'shiftpatch_forbidden' USING ERRCODE = 'P0001';
  END IF;

  SELECT u.id, u.role
  INTO v_user_id, v_role
  FROM shiftpatch.users AS u
  WHERE u.auth_user_id = (SELECT auth.uid());

  IF NOT FOUND OR v_role IS DISTINCT FROM 'nurse' THEN
    RAISE EXCEPTION 'shiftpatch_forbidden' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  SELECT
    to_char(c.expires_on, 'YYYY-MM-DD'),
    c.document_name,
    c.mime_type,
    c.size_bytes,
    c.uploaded_at,
    c.object_path
  FROM shiftpatch.nurse_credentials AS c
  WHERE c.nurse_id = v_user_id;
END;
$$;

CREATE FUNCTION shiftpatch.finalize_credential(
  p_expires_on text,
  p_object_path text,
  p_document_name text,
  p_mime_type text,
  p_size_bytes bigint
)
RETURNS TABLE (
  expires_on text,
  document_name text,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz,
  object_path text,
  previous_object_path text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id text;
  v_role text;
  v_auth text;
  v_date date;
  v_meta jsonb;
  v_stored_size bigint;
  v_stored_mime text;
  v_previous text;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'shiftpatch_forbidden' USING ERRCODE = 'P0001';
  END IF;

  v_auth := (SELECT auth.uid())::text;

  SELECT u.id, u.role
  INTO v_user_id, v_role
  FROM shiftpatch.users AS u
  WHERE u.auth_user_id = (SELECT auth.uid())
  FOR UPDATE;

  IF NOT FOUND OR v_role IS DISTINCT FROM 'nurse' THEN
    RAISE EXCEPTION 'shiftpatch_forbidden' USING ERRCODE = 'P0001';
  END IF;

  IF p_expires_on !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
     OR p_object_path !~ (
       '^' || v_auth || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     )
     OR p_document_name IS NULL
     OR char_length(p_document_name) < 1
     OR char_length(p_document_name) > 200
     OR p_mime_type NOT IN ('application/pdf', 'image/jpeg', 'image/png')
     OR p_size_bytes IS NULL
     OR p_size_bytes < 1
     OR p_size_bytes > 2097152 THEN
    RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
  END IF;

  BEGIN
    v_date := p_expires_on::date;
    IF to_char(v_date, 'YYYY-MM-DD') IS DISTINCT FROM p_expires_on THEN
      RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
    END IF;
  EXCEPTION
    WHEN datetime_field_overflow OR invalid_datetime_format OR invalid_text_representation THEN
      RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
  END;

  SELECT o.metadata
  INTO v_meta
  FROM storage.objects AS o
  WHERE o.bucket_id = 'credentials'
    AND o.name = p_object_path
    AND (
      o.owner = (SELECT auth.uid())
      OR o.owner_id = v_auth
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shiftpatch_object_missing' USING ERRCODE = 'P0001';
  END IF;

  BEGIN
    IF v_meta ? 'size' THEN
      v_stored_size := (v_meta->>'size')::bigint;
    ELSIF v_meta ? 'contentLength' THEN
      v_stored_size := (v_meta->>'contentLength')::bigint;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
  END;

  v_stored_mime := COALESCE(v_meta->>'mimetype', v_meta->>'mimeType');

  IF v_stored_size IS NOT NULL AND v_stored_size IS DISTINCT FROM p_size_bytes THEN
    RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
  END IF;

  IF v_stored_mime IS NOT NULL AND v_stored_mime IS DISTINCT FROM p_mime_type THEN
    RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
  END IF;

  SELECT c.object_path
  INTO v_previous
  FROM shiftpatch.nurse_credentials AS c
  WHERE c.nurse_id = v_user_id
  FOR UPDATE;

  IF FOUND THEN
    UPDATE shiftpatch.nurse_credentials AS c
    SET expires_on = v_date,
        object_path = p_object_path,
        document_name = p_document_name,
        mime_type = p_mime_type,
        size_bytes = p_size_bytes,
        uploaded_at = pg_catalog.clock_timestamp()
    WHERE c.nurse_id = v_user_id;
  ELSE
    INSERT INTO shiftpatch.nurse_credentials (
      nurse_id, user_role, expires_on, object_path, document_name, mime_type, size_bytes, uploaded_at
    )
    VALUES (
      v_user_id, 'nurse', v_date, p_object_path, p_document_name, p_mime_type, p_size_bytes, pg_catalog.clock_timestamp()
    );
  END IF;

  RETURN QUERY
  SELECT
    to_char(c.expires_on, 'YYYY-MM-DD'),
    c.document_name,
    c.mime_type,
    c.size_bytes,
    c.uploaded_at,
    c.object_path,
    v_previous
  FROM shiftpatch.nurse_credentials AS c
  WHERE c.nurse_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION shiftpatch.claim_shift(p_id text)
RETURNS TABLE (
  id text,
  agency_id text,
  agency_name text,
  role text,
  shift_date text,
  start_time text,
  end_time text,
  status text,
  claimed_by text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id text;
  v_role text;
  v_expires date;
  v_status text;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'shiftpatch_forbidden' USING ERRCODE = 'P0001';
  END IF;

  SELECT u.id, u.role
  INTO v_user_id, v_role
  FROM shiftpatch.users AS u
  WHERE u.auth_user_id = (SELECT auth.uid());

  IF NOT FOUND OR v_role IS DISTINCT FROM 'nurse' THEN
    RAISE EXCEPTION 'shiftpatch_forbidden' USING ERRCODE = 'P0001';
  END IF;

  SELECT c.expires_on
  INTO v_expires
  FROM shiftpatch.nurse_credentials AS c
  WHERE c.nurse_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_expires < (timezone('America/Bogota', pg_catalog.clock_timestamp()))::date THEN
    RAISE EXCEPTION 'shiftpatch_credential_expired' USING ERRCODE = 'P0001';
  END IF;

  SELECT s.status
  INTO v_status
  FROM shiftpatch.shifts AS s
  WHERE s.id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shiftpatch_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_status IS DISTINCT FROM 'open' THEN
    RAISE EXCEPTION 'shiftpatch_not_available' USING ERRCODE = 'P0001';
  END IF;

  UPDATE shiftpatch.shifts AS s
  SET status = 'filled', claimed_by = v_user_id
  WHERE s.id = p_id AND s.status = 'open' AND s.claimed_by IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shiftpatch_not_available' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.agency_id,
    a.name,
    s.role,
    to_char(s.date, 'YYYY-MM-DD'),
    to_char(s.start_time, 'HH24:MI'),
    to_char(s.end_time, 'HH24:MI'),
    s.status,
    s.claimed_by
  FROM shiftpatch.shifts AS s
  JOIN shiftpatch.agencies AS a ON a.id = s.agency_id
  WHERE s.id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION shiftpatch.read_credential() FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION shiftpatch.finalize_credential(text, text, text, text, bigint) FROM PUBLIC, anon, service_role;

GRANT EXECUTE ON FUNCTION shiftpatch.read_credential() TO authenticated;
GRANT EXECUTE ON FUNCTION shiftpatch.finalize_credential(text, text, text, text, bigint) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
