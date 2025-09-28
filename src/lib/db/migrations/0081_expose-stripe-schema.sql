GRANT USAGE ON SCHEMA stripe TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA stripe TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA stripe TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA stripe TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA stripe GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA stripe GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA stripe GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;