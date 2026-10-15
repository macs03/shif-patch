BEGIN;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE SCHEMA shiftpatch;
REVOKE ALL ON SCHEMA shiftpatch FROM PUBLIC;
CREATE TABLE shiftpatch.agencies (
  id text PRIMARY KEY,
  name text NOT NULL
);
CREATE TABLE shiftpatch.users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL CHECK (password_hash LIKE '$2%'),
  role text NOT NULL CHECK (role IN ('nurse', 'agency', 'admin')),
  agency_id text UNIQUE REFERENCES shiftpatch.agencies(id),
  UNIQUE (id, role),
  CHECK ((role = 'agency' AND agency_id IS NOT NULL AND agency_id = id) OR (role <> 'agency' AND agency_id IS NULL))
);
CREATE TABLE shiftpatch.nurse_credentials (
  nurse_id text PRIMARY KEY,
  user_role text NOT NULL DEFAULT 'nurse' CHECK (user_role = 'nurse'),
  expires_on date NOT NULL,
  FOREIGN KEY (nurse_id, user_role) REFERENCES shiftpatch.users(id, role)
);
CREATE TABLE shiftpatch.shifts (
  id text PRIMARY KEY,
  agency_id text NOT NULL REFERENCES shiftpatch.agencies(id),
  role text NOT NULL CHECK (role IN ('RN', 'LPN')),
  date date NOT NULL,
  start_time time(0) WITHOUT TIME ZONE NOT NULL,
  end_time time(0) WITHOUT TIME ZONE NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled')),
  claimed_by text REFERENCES shiftpatch.nurse_credentials(nurse_id),
  CHECK ((status = 'open' AND claimed_by IS NULL) OR (status = 'filled' AND claimed_by IS NOT NULL)),
  CHECK (start_time <> end_time)
);
CREATE INDEX shifts_agency_id_idx ON shiftpatch.shifts(agency_id);
-- No browser access. Future API uses a server-only connection and checks JWT/ownership.
ALTER TABLE shiftpatch.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shiftpatch.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shiftpatch.nurse_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE shiftpatch.shifts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA shiftpatch FROM PUBLIC;
COMMIT;
