# BanegaBrand CRM — Supabase setup

Project: **joxgjpkuwwalxhxugejg**  
Dashboard: https://supabase.com/dashboard/project/joxgjpkuwwalxhxugejg

## 1. Environment (already in `.env`)

```env
VITE_SUPABASE_URL=https://joxgjpkuwwalxhxugejg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_23lRl_2SZS5Fkxb7RoNQdQ_D9bUSIB_
```

Restart dev server after changing `.env`: `npm run dev`

## 2. Run database migrations

**Option A — Supabase CLI (recommended)**

```bash
npm install -g supabase
supabase login
cd ojasvin-crm-suite-main
supabase link --project-ref joxgjpkuwwalxhxugejg
supabase db push
```

**Option B — SQL Editor (one file, all migrations)**

```bash
npm run db:migrate:build
```

Then open [SQL Editor](https://supabase.com/dashboard/project/joxgjpkuwwalxhxugejg/sql/new), paste contents of `supabase/RUN_ALL_MIGRATIONS.sql`, and **Run**.

**Option C — SQL Editor (manual)**

Run each file in `supabase/migrations/` **in filename order** (oldest timestamp first).

## 3. Create login users (seed)

**Already done if you ran setup** — all 7 accounts created via signup API.

**Option A — Publishable key only (no service_role needed)**

```powershell
npm run db:seed:public
```

**Option B — Service role (admin API, reset passwords)**

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
npm run db:seed
```

**Option C — Edge function**

```bash
supabase functions deploy seed-users --project-ref joxgjpkuwwalxhxugejg
```

2. In Dashboard → **Project Settings → API**, copy **service_role** key (secret).

3. Run seed:

```bash
curl -X POST "https://joxgjpkuwwalxhxugejg.supabase.co/functions/v1/seed-users" ^
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

Or create the same users manually in **Authentication → Users** with the emails/passwords below.

## 4. Login accounts (Gmail-style)

| Role | Email | Password |
|------|--------|----------|
| **Owner** | banegabrand.owner@gmail.com | `BanegaBrand@Owner1` |
| **Admin** | banegabrand.admin@gmail.com | `BanegaBrand@Admin1` |
| **HR Manager** | banegabrand.hr@gmail.com | `BanegaBrand@Hr1` |
| **Team Lead** | banegabrand.tl@gmail.com | `BanegaBrand@Tl1` |
| **Employee** | banegabrand.amit@gmail.com | `BanegaBrand@Emp1` |
| **Employee** | banegabrand.priya@gmail.com | `BanegaBrand@Emp2` |
| **Employee** | banegabrand.raj@gmail.com | `BanegaBrand@Emp3` |

> These are **app login emails** for Supabase Auth. They do not need to be real Gmail inboxes unless you enable email confirmation. For production, replace with your team’s real Gmail addresses and re-run seed.

## 5. Auth settings (Dashboard)

- **Authentication → Providers → Email**: enable Email provider  
- For quick testing: disable **Confirm email** so logins work immediately  
- **URL configuration**: add `http://localhost:5173` to Site URL / Redirect URLs

## 6. Troubleshooting

- **Invalid API key**: confirm publishable key in `.env` matches Dashboard → API  
- **Role / permission errors**: run migration `20260604130000_banegabrand_gmail_roles.sql` and seed again  
- **Enum errors on lead status**: run `20260604120000_lead_status_extended.sql`
