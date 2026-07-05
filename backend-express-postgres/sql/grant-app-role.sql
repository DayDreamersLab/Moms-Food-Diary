\set ON_ERROR_STOP on

-- Run this with DATABASE_ADMIN_URL after sql/schema.sql has created the tables.
-- This creates a dedicated runtime user whose password is stored by Postgres as SCRAM-SHA-256
-- when password_encryption is set to scram-sha-256.

\if :{?app_password}
\else
  \echo 'Missing required psql variable: app_password'
  \quit 1
\endif

alter system set password_encryption = 'scram-sha-256';
select pg_reload_conf();

select format('create role moms_food_diary_app login password %L', :'app_password')
where not exists (select 1 from pg_roles where rolname = 'moms_food_diary_app')
\gexec

alter role moms_food_diary_app with login password :'app_password';

grant connect on database moms_food_diary to moms_food_diary_app;
grant usage on schema public to moms_food_diary_app;

grant select, insert, update, delete on all tables in schema public to moms_food_diary_app;
grant usage, select on all sequences in schema public to moms_food_diary_app;

alter default privileges in schema public
  grant select, insert, update, delete on tables to moms_food_diary_app;

alter default privileges in schema public
  grant usage, select on sequences to moms_food_diary_app;
