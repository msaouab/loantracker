# Loan Tracker

A simple web app to digitize loan management — track clients, payments, and financial KPIs in one place.

Loan Tracker replaces paper-based loan tracking with a lightweight digital system. Managers can register and log in, create and edit loan records, log partial payments, and monitor totals, recovery rates, and trends from a dashboard. An admin panel supports user management (activation, freeze, delete).

## Features

- User registration and login (session-based auth)
- Loan CRUD — client, amount, date, trust flag, notes
- Payment history per loan (add, edit, delete)
- Dashboard KPIs and charts
- Loan list with search, sort, and mobile layout
- Soft delete with a recovered-loans view
- Admin user management (create, activate, freeze, delete)
- Dark and light theme

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Auth:** Auth.js / NextAuth v5
- **Database:** PostgreSQL, Prisma 7
- **UI:** shadcn/ui, Tailwind CSS 4, Recharts
- **Validation:** Zod, React Hook Form

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (e.g. [Neon](https://neon.tech))

### Setup

```bash
git clone https://github.com/<your-username>/loantracker.git
cd loantracker
npm install

cp .env.example .env
# Fill in DATABASE_URL and AUTH_SECRET

npx prisma migrate deploy
npm run db:seed   # optional: demo data + admin account

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random secret for session signing |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME` | Display name in the UI |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `ADMIN_EMAIL` | Admin account email (seed script) |
| `ADMIN_PASSWORD` | Admin account password (seed script) |
| `ADMIN_NAME` | Admin display name (seed script) |
| `CRON_SECRET` | Bearer secret for scheduled cron routes (e.g. purge deleted loans). Required in production on Vercel; route returns 401 until set. |

Never commit `.env` — it contains secrets. Use `.env.example` as a template.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:seed` | Seed database with demo data |

## Deployment

Deploy on [Vercel](https://vercel.com) with a PostgreSQL provider such as Neon. Set all environment variables in your deployment settings and run migrations against the production database before going live.

Set `CRON_SECRET` in Vercel to enable the daily purge of expired loans (`/api/cron/purge-loans` at 03:00 UTC): soft-deleted loans and fully recovered loans are permanently removed after 30 days. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically. Off Vercel, call the same route from any scheduler with that header.
