
- [x] (1) Fix lead counting logic on Dashboard: Active Leads should exclude leads where `stage === "lost"`.
- [x] (2) Add auto refresh: update `useCrmQuery` to poll Supabase data periodically (e.g. every 30s) for crm tables.

- [ ] (3) Verify counts update live on Dashboard/Leads page after mutations.

- [x] Fix team attendance
  - [x] Clean/normalize `src/pages/Attendance.tsx` (removed duplicated TeamAttendance code that was appended)
  - [x] Fix App.tsx - added missing `/attendance` route (sidebar had link but no route)
  - [x] Fix App.tsx - corrected misspelled route `/admin/teamattendence` → `/admin/attendance`
  - [x] Fix App.tsx - fixed broken `import WeeklyReports` statement (missing `from`)
  - [x] Verify Attendance/TeamAttendance page compiles and renders

