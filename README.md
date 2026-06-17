<div align="center">

<img src="docs/images/readme-banner.png" alt="Wooden letter tiles spelling CREDIT on a table" width="100%" />

<br />

# 💰 Loan Tracker

**A modern web app to digitize loan management — track clients, record payments, and monitor portfolio health in one place.**

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

<br />

[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](#-license)
[![i18n](https://img.shields.io/badge/i18n-EN·FR·AR-blue?style=flat-square)](#-internationalization)
[![Tests](https://img.shields.io/badge/Tests-Vitest-brightgreen?style=flat-square)](#-testing)

</div>

---

Loan Tracker replaces paper-based workflows with a lightweight, **multilingual** system built for loan managers and administrators. Managers handle day-to-day lending operations; administrators oversee users, audit activity, and view organization-wide metrics.

## 📑 Table of contents

- [✨ Features](#-features)
- [🛠 Tech stack](#-tech-stack)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Getting started](#-getting-started)
- [👑 First administrator](#-first-administrator)
- [🔐 Environment variables](#-environment-variables)
- [📜 Scripts](#-scripts)
- [📁 Project structure](#-project-structure)
- [📖 API documentation](#-api-documentation)
- [🌍 Internationalization](#-internationalization)
- [☁️ Deployment](#️-deployment)
- [🛡 Security](#-security)
- [🧪 Testing](#-testing)
- [📄 License](#-license)
- [👤 Author](#-author)

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 💳 Loan management

- ➕ Create, edit, and soft-delete loan records
- 💵 Partial payment history (add, edit, delete)
- 🔍 Search, sort, date filters, and pagination
- 📱 Expandable payment history (desktop & mobile)
- ♻️ Soft-deleted loans restorable within **30 days**

### 📊 Dashboard & analytics

- 📈 Portfolio KPIs (open & recovered loans)
- 📉 Trust distribution & recovery charts
- 🏢 Admin org-wide portfolio metrics

</td>
<td width="50%" valign="top">

### 🔒 User & access control

- 📝 Registration with admin approval workflow
- 🔑 Session-based auth (Auth.js / NextAuth v5)
- 👥 Role-based access: managers vs admins
- ⚙️ Per-user profile, password, locale & theme

### 🛡 Admin panel

- 👤 User management (approve, freeze, reset password)
- 📋 Activity audit log with filters
- 🟢 Online presence (last seen / last login)

### 🌐 Platform

- 🗣 **EN · FR · AR** with RTL for Arabic
- 🌓 Dark / light theme
- 📡 REST API + OpenAPI (`/docs`)
- 📊 Vercel Analytics & Speed Insights
- ⏰ Scheduled 30-day data retention purge

</td>
</tr>
</table>

---

## 🛠 Tech stack

<div align="center">

| | |
|:---:|:---:|
| ![Next.js](https://img.shields.io/badge/Framework-Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white) | ![React](https://img.shields.io/badge/UI-React_19-61DAFB?style=flat-square&logo=react&logoColor=black) |
| ![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | ![Tailwind](https://img.shields.io/badge/Styling-Tailwind_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) |
| ![Prisma](https://img.shields.io/badge/ORM-Prisma_7-2D3748?style=flat-square&logo=prisma&logoColor=white) | ![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) |
| ![Auth.js](https://img.shields.io/badge/Auth-Auth.js_v5-000000?style=flat-square&logo=auth0&logoColor=white) | ![shadcn/ui](https://img.shields.io/badge/Components-shadcn%2Fui-000000?style=flat-square) |
| ![next-intl](https://img.shields.io/badge/i18n-next--intl-000000?style=flat-square) | ![Recharts](https://img.shields.io/badge/Charts-Recharts-22B5BF?style=flat-square) |
| ![Zod](https://img.shields.io/badge/Validation-Zod-3E67B1?style=flat-square&logo=zod&logoColor=white) | ![Vitest](https://img.shields.io/badge/Testing-Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white) |

</div>

---

## 📋 Prerequisites

| | Requirement |
|---|-------------|
| 🟢 | **Node.js** 20+ |
| 🐘 | **PostgreSQL** 14+ ([Neon](https://neon.tech), Supabase, or local) |
| 📦 | **npm** 9+ |

---

## 🚀 Getting started

### 1️⃣ Clone and install

```bash
git clone https://github.com/msaouab/loantracker.git
cd loantracker
npm install
```

### 2️⃣ Configure environment

Create a `.env` file in the project root:

```bash
# 🗄 Database (required)
DATABASE_URL="postgresql://user:password@host:5432/loantracker?sslmode=require"

# 🔐 Auth (required)
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# 🏷 App (optional)
NEXT_PUBLIC_APP_NAME="Loan Tracker"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 🌱 Seed — demo manager (required for db:seed)
SEED_USER_EMAIL="manager@example.com"
SEED_USER_PASSWORD="change-me-in-production"
SEED_USER_NAME="Demo Manager"

# ⏰ Production cron (required on Vercel)
CRON_SECRET="generate-a-long-random-secret"
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

> ⚠️ **Never commit `.env`** — it contains secrets.

### 3️⃣ Run migrations

```bash
npx prisma migrate deploy
```

### 4️⃣ Seed demo data *(optional)*

```bash
npm run db:seed
```

Creates a **demo manager** (not an admin) with sample loans, payments, and activity logs.

### 5️⃣ Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000** 🎉

---

## 👑 First administrator

> The seed script does **not** create an admin account.

**Option A — SQL** *(recommended for fresh installs)*

```sql
UPDATE users
SET "isAdmin" = true, "isActivated" = true
WHERE email = 'your-admin@example.com';
```

**Option B — Admin UI**

Once an admin exists: **Admin → Users → Create user** → enable **Administrator**.

---

## 🔐 Environment variables

| Variable | | Description |
|----------|:--:|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | ⬜ | Direct URL for Prisma migrations |
| `AUTH_SECRET` | ✅ | Session signing secret |
| `NEXTAUTH_URL` | ✅ | Canonical app URL |
| `NEXT_PUBLIC_APP_NAME` | ⬜ | UI display name |
| `NEXT_PUBLIC_APP_URL` | ⬜ | Public app URL |
| `SEED_USER_EMAIL` | 🌱 | Demo manager email |
| `SEED_USER_PASSWORD` | 🌱 | Demo manager password |
| `SEED_USER_NAME` | ⬜ | Demo manager name |
| `CRON_SECRET` | 🚀 | Bearer token for purge cron |

✅ Required · ⬜ Optional · 🌱 Seed only · 🚀 Production

---

## 📜 Scripts

| Command | | Description |
|---------|:--:|-------------|
| `npm run dev` | 🖥 | Start development server |
| `npm run build` | 📦 | Migrate, generate client & build |
| `npm run start` | 🚀 | Start production server |
| `npm run lint` | 🔍 | Run ESLint |
| `npm test` | 🧪 | Run Vitest unit tests |
| `npm run db:seed` | 🌱 | Seed demo data |

---

## 📁 Project structure

```
loantracker/
├── 📂 app/                 # Next.js App Router (pages, layouts, API)
│   ├── (app)/              # Authenticated manager & admin pages
│   ├── auth/               # Login and registration
│   └── api/                # REST API endpoints
├── 🧩 components/          # React components (UI, forms, dashboards)
├── ⚙️ lib/                  # Business logic, services, validation
├── 🌍 messages/            # i18n translations (en, fr, ar)
├── 🗄 prisma/               # Schema, migrations, seed
├── 🔗 i18n/                # next-intl config
└── 🖼 public/               # Static assets
```

---

## 📖 API documentation

| Endpoint | Access | Description |
|----------|--------|-------------|
| `/api/openapi` | Admin | OpenAPI specification |
| `/docs` | Admin | Interactive Swagger UI |

**API areas:** Auth · Loans · Payments · Settings · Admin · Cron

```http
POST /api/cron/purge-loans
Authorization: Bearer <CRON_SECRET>
```

---

## 🌍 Internationalization

| Code | Language | Direction |
|:----:|----------|:---------:|
| `en` | 🇬🇧 English | LTR |
| `fr` | 🇫🇷 French | LTR |
| `ar` | 🇲🇦 Arabic | RTL |

Locale is persisted per user. Currency is formatted in **Moroccan Dirham (DH)**.

---

## ☁️ Deployment

### Vercel *(recommended)*

1. 📤 Push to GitHub and import in [Vercel](https://vercel.com)
2. 🐘 Add PostgreSQL ([Neon](https://neon.tech) via Marketplace)
3. 🔐 Set environment variables
4. 🚀 Deploy — `npm run build` runs migrations automatically

### ⏰ Scheduled purge

`vercel.json` runs daily at **03:00 UTC**:

| | Retention |
|---|-----------|
| 🗑 Soft-deleted loans | 30 days |
| ✅ Recovered loans | 30 days |
| 📋 Old activity logs | Pruned |

Set `CRON_SECRET` in Vercel — cron sends `Authorization: Bearer $CRON_SECRET` automatically.

---

## 🛡 Security

| | |
|---|---|
| 🔒 | Passwords hashed with **bcrypt** |
| 🍪 | HTTP-only session cookies (`__Host-` in production) |
| 🛂 | Server-side auth & role checks on all API routes |
| 🌐 | Anonymized IPs in activity logs (`/24` truncation) |
| 📊 | No PII in analytics providers |

---

## 🧪 Testing

```bash
npm test
```

Covers validations, dashboard calculations, activity queries, and API helpers.

---

## 📄 License

Private project. All rights reserved.

---

## 👤 Author

<div >

**Mohamed Saouab**

<br />

<a href="https://github.com/msaouab" title="GitHub — msaouab">
  <img src="docs/images/github.svg" width="36" height="36" alt="GitHub" />
</a>
&nbsp;&nbsp;
<a href="https://www.linkedin.com/in/msaouab" title="LinkedIn — Mohamed Saouab">
  <img src="docs/images/linkedin.svg" width="36" height="36" alt="LinkedIn" />
</a>

</div>
