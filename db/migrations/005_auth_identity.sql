BEGIN;

ALTER TABLE shiftpatch.users
  ADD COLUMN auth_user_id uuid,
  ADD CONSTRAINT users_auth_user_id_key UNIQUE (auth_user_id),
  ADD CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users (id);

GRANT USAGE ON SCHEMA shiftpatch TO authenticated;

GRANT SELECT (id, name, role, agency_id, auth_user_id) ON TABLE shiftpatch.users TO authenticated;

CREATE POLICY users_select_own ON shiftpatch.users
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id);

NOTIFY pgrst, 'reload schema';

COMMIT;
