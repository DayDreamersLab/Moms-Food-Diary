# Backend Security Notes

## SCRAM-SHA-256

SCRAM-SHA-256 is used for the PostgreSQL connection between this Express API and the database. It does not replace app-user password hashing. The app still stores end-user password hashes separately in the `users.password_hash` column.

Use both layers:

```text
End-user login password hash: bcrypt now, ideally argon2id later
Express-to-Postgres auth: SCRAM-SHA-256
```

The included `docker-compose.yml` configures local Postgres with:

```text
POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256 --auth-local=scram-sha-256
password_encryption=scram-sha-256
```

For a manually managed PostgreSQL server, set:

```sql
alter system set password_encryption = 'scram-sha-256';
select pg_reload_conf();
```

Then ensure `pg_hba.conf` uses `scram-sha-256` for this app role:

```text
host    moms_food_diary    moms_food_diary_app    127.0.0.1/32    scram-sha-256
host    moms_food_diary    moms_food_diary_app    ::1/128         scram-sha-256
```

In production, also use TLS for the database connection. SCRAM protects password authentication; TLS protects the rest of the connection contents.

## Dedicated Runtime Role

Do not run the API as the `postgres` superuser. The exemplar setup uses:

```text
DATABASE_ADMIN_URL: admin/migration connection
DATABASE_URL: least-privileged runtime app connection
```

Run migrations/schema setup with `DATABASE_ADMIN_URL`, then run:

```bash
set -a
. ./.env
set +a
npm run db:grant-app-role
```

After that, the API should use the `moms_food_diary_app` role in `DATABASE_URL`.

## PostgreSQL Database Secrets Engine

HashiCorp Vault's PostgreSQL database secrets engine can dynamically create short-lived database users for the application. This is strong security, but it adds operational complexity.

It is appropriate when:

- you already run Vault or a managed Vault-compatible service
- multiple services need dynamic database credentials
- you have production operations for token renewal, service identity, audit logs, and outage handling
- you want short-lived database users instead of a long-lived `DATABASE_URL`

It is probably not appropriate for this project yet if:

- this is a small single-service app
- you are still prototyping the backend
- there is no existing Vault infrastructure
- the team would be manually babysitting credential renewal

For this repo right now, the better default is:

```text
SCRAM-SHA-256 + dedicated least-privileged database role + strong secret storage in the deploy platform
```

Later, when the backend is productionized and you have real operations around secrets, Vault's database secrets engine would be a reasonable upgrade.

## Next Recommended Auth Upgrades

- Move JWTs from frontend storage to HttpOnly secure cookies.
- Add refresh token rotation with hashed refresh tokens in Postgres.
- Add login and signup rate limiting.
- Add email verification.
- Consider replacing bcrypt with argon2id.
