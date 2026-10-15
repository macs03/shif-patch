BEGIN;

GRANT SELECT ON TABLE shiftpatch.agencies TO authenticated;
GRANT SELECT ON TABLE shiftpatch.shifts TO authenticated;

CREATE POLICY agencies_select_mapped ON shiftpatch.agencies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM shiftpatch.users AS u
      WHERE u.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY shifts_select_mapped ON shiftpatch.shifts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM shiftpatch.users AS u
      WHERE u.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE FUNCTION shiftpatch.create_shift(
  p_role text,
  p_date text,
  p_start_time text,
  p_end_time text
)
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
  v_role text;
  v_agency_id text;
  v_date date;
  v_shift_id text;
  v_attempt integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'shiftpatch_forbidden' USING ERRCODE = 'P0001';
  END IF;

  SELECT u.role, u.agency_id
  INTO v_role, v_agency_id
  FROM shiftpatch.users AS u
  WHERE u.auth_user_id = (SELECT auth.uid());

  IF NOT FOUND OR v_role IS DISTINCT FROM 'agency' OR v_agency_id IS NULL THEN
    RAISE EXCEPTION 'shiftpatch_forbidden' USING ERRCODE = 'P0001';
  END IF;

  IF p_role IS DISTINCT FROM 'RN' AND p_role IS DISTINCT FROM 'LPN' THEN
    RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
  END IF;

  IF p_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
     OR p_start_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     OR p_end_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     OR p_start_time = p_end_time THEN
    RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
  END IF;

  BEGIN
    v_date := p_date::date;
    IF to_char(v_date, 'YYYY-MM-DD') IS DISTINCT FROM p_date THEN
      RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
    END IF;
  EXCEPTION
    WHEN datetime_field_overflow OR invalid_datetime_format OR invalid_text_representation THEN
      RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
  END;

  FOR v_attempt IN 1..5 LOOP
    v_shift_id := 'shift-' || substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 16);
    BEGIN
      INSERT INTO shiftpatch.shifts (
        id, agency_id, role, date, start_time, end_time, status, claimed_by
      )
      VALUES (
        v_shift_id, v_agency_id, p_role, v_date, p_start_time::time, p_end_time::time, 'open', NULL
      );
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        IF v_attempt = 5 THEN
          RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
        END IF;
    END;
  END LOOP;

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
  WHERE s.id = v_shift_id;
END;
$$;

CREATE FUNCTION shiftpatch.claim_shift(p_id text)
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
  WHERE c.nurse_id = v_user_id;

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

CREATE FUNCTION shiftpatch.cancel_shift(p_id text, p_reason text)
RETURNS TABLE (
  id text,
  agency_id text,
  agency_name text,
  role text,
  shift_date text,
  start_time text,
  end_time text,
  status text,
  claimed_by text,
  previous_nurse_id text,
  cancellation_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id text;
  v_role text;
  v_agency_id text;
  v_status text;
  v_claimed_by text;
  v_shift_agency text;
  v_previous text;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'shiftpatch_forbidden' USING ERRCODE = 'P0001';
  END IF;

  SELECT u.id, u.role, u.agency_id
  INTO v_user_id, v_role, v_agency_id
  FROM shiftpatch.users AS u
  WHERE u.auth_user_id = (SELECT auth.uid());

  IF NOT FOUND OR v_role NOT IN ('nurse', 'agency') THEN
    RAISE EXCEPTION 'shiftpatch_forbidden' USING ERRCODE = 'P0001';
  END IF;

  IF p_reason IS DISTINCT FROM 'no-show' AND p_reason IS DISTINCT FROM 'advance' THEN
    RAISE EXCEPTION 'shiftpatch_invalid' USING ERRCODE = 'P0001';
  END IF;

  SELECT s.status, s.claimed_by, s.agency_id
  INTO v_status, v_claimed_by, v_shift_agency
  FROM shiftpatch.shifts AS s
  WHERE s.id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shiftpatch_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF NOT (
    (v_role = 'nurse' AND v_user_id = v_claimed_by)
    OR (v_role = 'agency' AND v_agency_id = v_shift_agency)
  ) THEN
    RAISE EXCEPTION 'shiftpatch_forbidden' USING ERRCODE = 'P0001';
  END IF;

  IF v_status IS DISTINCT FROM 'filled' OR v_claimed_by IS NULL THEN
    RAISE EXCEPTION 'shiftpatch_not_filled' USING ERRCODE = 'P0001';
  END IF;

  v_previous := v_claimed_by;

  UPDATE shiftpatch.shifts AS s
  SET status = 'open', claimed_by = NULL
  WHERE s.id = p_id AND s.status = 'filled' AND s.claimed_by = v_previous;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shiftpatch_not_filled' USING ERRCODE = 'P0001';
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
    s.claimed_by,
    v_previous,
    p_reason
  FROM shiftpatch.shifts AS s
  JOIN shiftpatch.agencies AS a ON a.id = s.agency_id
  WHERE s.id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION shiftpatch.create_shift(text, text, text, text) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION shiftpatch.claim_shift(text) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION shiftpatch.cancel_shift(text, text) FROM PUBLIC, anon, service_role;

GRANT EXECUTE ON FUNCTION shiftpatch.create_shift(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION shiftpatch.claim_shift(text) TO authenticated;
GRANT EXECUTE ON FUNCTION shiftpatch.cancel_shift(text, text) TO authenticated;

REVOKE SELECT ON TABLE shiftpatch.agencies, shiftpatch.shifts FROM service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
