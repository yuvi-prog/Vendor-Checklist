# Vendor Onboarding Checklist

Internal tool for tracking new franchisee/vendor onboarding: company & deal details, plus task checklists for Lina, Yuvi, Dor, and Jose. No login — anyone with the link can view and update.

Each vendor has its own **weekly email reminder toggle**. When a vendor is created, an office-wide "kickoff" email announces the new vendor loop. Both emails go out via SendGrid.

## Environment setup

Copy `.env.example` to `.env` and fill in:

- `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` — your SendGrid API key and a verified sender address. If left blank, the app still works fully — email sends are skipped with a console warning instead of failing.
- `OFFICE_RECIPIENTS` — comma-separated list that receives every kickoff + weekly reminder email (already pre-filled with the current office list).
- `APP_URL` — public URL of the deployed app, used to build links inside emails.
- `REMINDER_CRON` / `REMINDER_TIMEZONE` — when the weekly reminder job runs (default: Monday 8am Australia/Sydney).
- `DATA_DIR` — where the SQLite file lives (set to a mounted volume path in production).

## Run locally

```
npm start          # API + serves built client on :3002, loads .env automatically
```

For frontend dev with hot reload, run the client separately:

```
cd client
npx vite               # dev server on :5173, proxies /api to :3002
```

Before first run, build the client once so the server has something to serve at `/`:

```
cd client && npx vite build
```

## Deploy (Railway)

1. Push this repo to GitHub, create a Railway project from it.
2. Railway will use `railway.toml`: builds the client, then runs `node server/index.js`.
3. Mount a persistent volume at `/data` and set env var `DATA_DIR=/data` so the SQLite file survives redeploys.
4. Set the SendGrid + office recipient env vars listed above in Railway's dashboard (not committed to git).
5. Railway assigns a public URL — that's the link to share with the team, and also what you should set as `APP_URL`.

No auth required for using the app itself.
