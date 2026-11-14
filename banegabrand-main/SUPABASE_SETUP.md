# Sultan CRM — Complete Setup & Architecture Guide

Project Ref: **gzvkbrkracajwizmnzgx**  
Supabase URL: `https://gzvkbrkracajwizmnzgx.supabase.co`  
Dashboard: https://supabase.com/dashboard/project/gzvkbrkracajwizmnzgx  

---

## 1. Quick Database Setup (1-Click SQL Migration)

1. Open your Supabase Dashboard:
   👉 **[SQL Editor in Supabase](https://supabase.com/dashboard/project/gzvkbrkracajwizmnzgx/sql/new)**
2. Copy the entire contents of:
   `SULTAN_CRM_COMPLETE_SETUP.sql` (or `banegabrand-main/supabase/SULTAN_CRM_COMPLETE_SETUP.sql`)
3. Paste it into the SQL editor and click **Run** (green button).

This single SQL script automatically creates:
- `profiles` table (staff full name, phone, department, active status)
- `user_roles` table (roles: `admin`, `tl`, `employee`, `owner`)
- `leads` table (with all telecalling fields: medicine, phone, stage, call_status, assigned_to, follow-up dates)
- `lead_activity_log` & `lead_activity` view (full call outcome history)
- `lead_comments` table
- `attendance` table
- `agents` compatibility view
- **Triggers**:
  - Automatically makes the **first user who signs up into the System Admin & Owner**!
  - When Admin creates new employees via the Admin panel, it automatically assigns their profile and selected role!
- **Strict Row Level Security (RLS)**:
  - **Admin**: Full access to create, assign, import, update, and delete all leads and team users.
  - **Employee / Telecaller**: Can only view and update their **assigned leads** (log calls, update stage, set next call date). Cannot create leads, cannot delete leads, and cannot access admin settings.

---

## 2. Supabase Auth Setting (Important for Immediate Logins)

In your Supabase Dashboard:
1. Go to **Authentication** → **Providers** → **Email**.
2. Make sure **Email** is **Enabled**.
3. (Recommended for employee onboarding) Turn **OFF** `Confirm email`.  
   *When turned off, accounts created by the Admin can log in immediately without waiting for an email verification link.*
4. Under **Authentication** → **URL Configuration**, add your Vercel URL and `http://localhost:5173` to **Redirect URLs**.

---

## 3. Creating Your First Admin Account

You can create your initial Admin account in any of these ways:

### Option A — Run the Setup Script
In your terminal:
```bash
cd banegabrand-main
node scripts/setup-sultan-crm.mjs "admin@sultancrm.com" "SultanAdmin@2026" "Sultan Admin"
```

### Option B — Supabase Dashboard
In Supabase Dashboard → **Authentication** → **Users** → **Add User** (Create user):
- Email: `admin@sultancrm.com` (or your preferred admin email)
- Password: your password
- Auto Confirm: Yes

Because our trigger checks if the role table is empty or email contains `admin`, this user is automatically granted full **Admin** and **Owner** privileges!

---

## 4. How the CRM Works

### 👑 Administrator Features:
1. **User / Employee Management (`/admin/users`)**:
   - Only Admin can create new staff IDs.
   - Click **"+ Add New Employee"**, enter Name, Email, Password, Department, and Role (`Telecaller`, `Team Lead`, `Admin`).
   - Copy credentials and hand them to your telecaller.
   - Deactivate or edit staff members at any time.
2. **Lead Management & Bulk Upload (`/leads`)**:
   - Single Lead Creation: Click **"+ Add Lead"** to add individual inquiries.
   - Excel / CSV Import: Click **"Import"** to upload hundreds of leads at once.
   - Lead Assignment:
     - Assign individual leads to any active caller from the dropdown.
     - Select multiple leads and bulk-assign to a telecaller.
3. **Analytics & Performance**:
   - Monitor total calls made, conversions, lost leads, and team attendance.

### 🎧 Telecaller / Employee Features:
1. **Protected Workspace**:
   - Telecallers only see leads where `assigned_to` matches their ID.
   - They cannot see unassigned leads, cannot create leads, and cannot delete leads.
2. **One-Click Calling & Outcome Logging**:
   - Click-to-Call: Dial customer directly with `tel:...`.
   - Click-to-WhatsApp: Send pre-filled message instantly.
   - Log Call Outcome:
     - Connected / Ringing / Callback Requested / Interested / Converted / Busy / Wrong Number
     - Set Next Follow-Up Date & Time
     - Add Call Notes & Remarks
3. **Daily Queue**:
   - See today's scheduled follow-ups and pending calls.

---

## 5. Environment Variables (`.env`)

```env
VITE_SUPABASE_URL=https://gzvkbrkracajwizmnzgx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_bHCzjy6RP516IKSLgSYAbw_vfrITeUY
```

*These are also configured in your Vercel Project Settings under Environment Variables.*
