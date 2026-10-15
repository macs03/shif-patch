BEGIN;

ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, shiftpatch';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

COMMIT;
