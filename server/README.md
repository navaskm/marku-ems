# Workline Django API

## PostgreSQL with Neon

The backend reads `DATABASE_URL` from the process environment or `server/.env`. Copy `.env.example` to `.env` and replace its placeholders with the connection string from Neon. Keep `.env` private; it is excluded by `.gitignore`. Use a Neon connection string with SSL enabled, commonly `?sslmode=require`.

The project uses `psycopg` (version 3) as its PostgreSQL driver. From the repository root, install the backend dependencies and initialize the schema with:

```powershell
python -m pip install -r server/requirements.txt
python server/manage.py check
python server/manage.py migrate
```

If `DATABASE_URL` is absent, settings retain the existing SQLite database so local development continues to work. In that case `migrate` affects SQLite only. Confirm the Neon URL is configured before running migrations when you intend to migrate PostgreSQL. Invalid URL schemes fail during Django startup; connection errors from Neon are reported by Django without printing the URL.

Run the backend from the repository root with:

```powershell
python server/manage.py runserver
```

The API is available at `http://localhost:8000/api/`. The existing Next.js client uses `NEXT_PUBLIC_API_URL` when set, and otherwise uses `http://localhost:8000/api`.

## Employee passwords and invitations

Employee accounts use Django's user model and password hashing. A manager-created employee receives an unusable password until they set a private one. The setup endpoint accepts a time-limited, single-use Django password token; it never returns the token in the API response. After setup, employees sign in with their email and password (the existing login form also checks their phone number). Password validators enforce Django's similarity, minimum-length, common-password, and numeric-password checks.

Only active Django user accounts with an active employee profile can sign in. Marking an employee inactive blocks login while preserving their account and records; reactivating the profile restores access if the Django user is still active.

For production invitations, configure SMTP values in `server/.env`: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`, and `FRONTEND_URL`. Set `DJANGO_DEBUG=false` and provide a strong `DJANGO_SECRET_KEY` in production. New-account creation will fail safely if production email delivery is not configured. Invitation links expire after Django's `PASSWORD_RESET_TIMEOUT` (three days by default). A manager can resend a setup link with `POST /api/employees/{employee_id}/password-setup/`; the employee's company scope is checked on the backend, and the link is delivered by email rather than included in the API response.

For local development without SMTP, create an employee while `DJANGO_DEBUG=true`; no setup link is printed or returned by the API. To manually deliver a link to that employee, run this explicit command in the `server` directory:

```powershell
python manage.py create_password_setup_link employee@example.test
```

The command prints a bearer link only to the invoking local terminal. Treat it as a secret: send it directly to the intended employee and do not paste it into logs, chat, source control, or screenshots. Password setup links are single-use and expire. Authenticated users can change their own passwords at `/api/auth/password/change/`; changing a password revokes existing tokens and returns one replacement token to the current client.

## Moving existing SQLite data

Running migrations creates the PostgreSQL tables; it does not copy records from SQLite. Keep `server/db.sqlite3` as a backup until the PostgreSQL copy has been verified. To copy data, first make a separate backup, then use this sequence from the repository root:

Run `dumpdata` while SQLite is explicitly selected. Since `.env` is auto-loaded, use `DJANGO_USE_SQLITE` to temporarily select the preserved local database, then remove that switch before loading into Neon:

```powershell
Copy-Item server/db.sqlite3 server/db.sqlite3.backup
$env:DJANGO_USE_SQLITE = "true"
python server/manage.py dumpdata --natural-foreign --natural-primary --exclude contenttypes --exclude auth.permission --indent 2 --output server/sqlite-data.json
Remove-Item Env:DJANGO_USE_SQLITE
python server/manage.py loaddata server/sqlite-data.json
```

Review the exported file before importing if it contains personal data, and keep it out of source control. Django serializes relational references across users, companies, departments, employees, tokens, attendance, leave requests, and announcements; load the complete fixture into an empty/new PostgreSQL schema after migrations. Verify record counts and logins before switching the application fully to Neon. Do not run `seed_demo` against an imported production dataset; it resets demo user passwords.

Demo data is available only in development and requires an explicit opt-in. The command never sets or overwrites a password; newly created demo accounts have unusable passwords until setup links are issued. From the `server` directory, opt in and seed the demo companies/accounts with:

```powershell
$env:ALLOW_DEMO_SEED = "true"
python manage.py seed_demo
Remove-Item Env:ALLOW_DEMO_SEED
```

The demo employee emails are:

- `manager@acme.demo` / `+1 (512) 555-0142`
- `employee@acme.demo` / `+1 (512) 555-0198`
- `manager@bright.demo` / `+1 (312) 555-0240`
- `employee@bright.demo` / `+1 (312) 555-0211`

Issue a separate setup link for each account using `create_password_setup_link`. Existing account passwords are never reset by the seed command. Do not set `ALLOW_DEMO_SEED=true` outside development/testing.

Implemented endpoints include token login, company read access, department CRUD, and company-scoped employee CRUD. Employee mutations require a manager account.
