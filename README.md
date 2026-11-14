# Sultan CRM — Enterprise Telecalling & Sales CRM

A complete, role-based CRM suite designed for telecalling agencies, healthcare, wellness, and sales teams. Built with React 18, TypeScript, Tailwind CSS, Vite, and Supabase.

---

## ⚡ Quick Start & Database Setup

1. Open your Supabase SQL Editor:
   👉 **[Supabase SQL Editor](https://supabase.com/dashboard/project/gzvkbrkracajwizmnzgx/sql/new)**
2. Copy all SQL queries from:
   📄 [`SULTAN_CRM_COMPLETE_SETUP.sql`](file:///home/jatin/Downloads/sultancrm-main/SULTAN_CRM_COMPLETE_SETUP.sql)
3. Paste into the Supabase SQL editor and click **Run**.
4. Disable **Confirm email** in **Authentication → Providers → Email** so employee logins work immediately.
5. Create your initial Admin user or run:
   ```bash
   node banegabrand-main/scripts/setup-sultan-crm.mjs
   ```

---

## 🔐 Role-Based Access Control (RBAC)

### 👑 Admin / Owner:
- **Sole authority to create employee accounts** (Public signups are completely disabled).
- Sole authority to **Add, Import (CSV/Excel), and Assign Leads** to telecallers.
- Bulk Lead Assignment & Round-Robin allocation.
- Manage staff roles, active/inactive statuses, departments.
- Full access to sales pipeline, deals, reports, and attendance.

### 🎧 Telecallers / Employees:
- Log in and access only their **assigned leads** (`assigned_to = auth.uid()`).
- Cannot create leads, cannot delete leads, cannot reassign leads.
- Fast **Click-to-Call** (`tel:...`) and **Click-to-WhatsApp**.
- Complete Call Logging & Disposition modal:
  - Call Status (Connected, Ringing, Callback, Interested, Converted, Wrong Number)
  - Next Follow-up Date & Time Picker
  - Remarks & customer notes
- Daily calling targets & follow-up queue.

---

## 📁 Repository Structure
- `banegabrand-main/src/pages/Leads.tsx`: Core calling workspace and lead management.
- `banegabrand-main/src/pages/AllUsers.tsx`: Admin-only employee creation and role management.
- `banegabrand-main/src/pages/Auth.tsx`: Enterprise login portal (public registration disabled).
- `banegabrand-main/src/pages/Dashboard.tsx`: Dynamic role-based KPI dashboard.
- `SULTAN_CRM_COMPLETE_SETUP.sql`: Single unified database migration script.

---

## 🚀 Environment Variables

```env
VITE_SUPABASE_URL=https://gzvkbrkracajwizmnzgx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_bHCzjy6RP516IKSLgSYAbw_vfrITeUY
```
