\echo 'Delete and recreate influenced db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE influenced;
CREATE DATABASE influenced;
\connect influenced

\i influenced-schema.sql
\i influenced-seed.sql

\echo 'Delete and recreate influenced_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE influenced_test;
CREATE DATABASE influenced_test;
\connect influenced_test

\i influenced-schema.sql
