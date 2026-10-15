BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    RAISE EXCEPTION 'service_role is required';
  END IF;
END $$;

GRANT USAGE ON SCHEMA shiftpatch TO service_role;
GRANT SELECT ON TABLE shiftpatch.agencies, shiftpatch.shifts TO service_role;

REVOKE ALL ON SCHEMA shiftpatch FROM anon, authenticated;
REVOKE ALL ON TABLE
  shiftpatch.agencies,
  shiftpatch.users,
  shiftpatch.nurse_credentials,
  shiftpatch.shifts
FROM anon, authenticated;

DO $$
DECLARE
  config text[];
  schemas text;
BEGIN
  SELECT rolconfig INTO config FROM pg_roles WHERE rolname = 'authenticator';
  SELECT split_part(item, '=', 2) INTO schemas
  FROM unnest(COALESCE(config, ARRAY[]::text[])) AS item
  WHERE item LIKE 'pgrst.db_schemas=%'
  LIMIT 1;
  IF schemas IS NOT NULL AND schemas <> '' AND position('shiftpatch' IN schemas) = 0 THEN
    EXECUTE format(
      'ALTER ROLE authenticator SET pgrst.db_schemas = %L',
      schemas || ', shiftpatch'
    );
  END IF;
END $$;

NOTIFY pgrst, 'reload config';

COMMIT;
