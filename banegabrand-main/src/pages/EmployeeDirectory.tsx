import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { useIsOwnerOrAdmin, useHasRole } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Pencil, Bell, Eye, UserPlus, Trash2, Phone, Mail, Building, ShieldCheck, Copy, Check } from "lucide-react";

interface Profile {
  id?: string;
  user_id: string;
  display_name: string | null;
  full_name?: string | null;
  email: string | null;
  phone?: string | null;
  department: string | null;
  job_title: string | null;
  employee_status?: string | null;
  created_at?: string;
}

interface Role {
  user_id: string;
  role: string;
}

interface Attendance {
  id: string;
  user_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
}

interface DailyReport {
  id: string;
  user_id: string;
  report_date: string;
  tasks_completed: string | null;
  tasks_pending: string | null;
  blockers: string | null;
  hours_worked: number | null;
}

interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  summary: string | null;
  achievements: string | null;
  challenges: string | null;
  total_hours: number | null;
}

interface Activity {
  id: string;
  user_id: string;
  assigned_to: string | null;
  title: string;
  task_status: string;
  due_date: string | null;
}

export default function EmployeeDirectory() {
  const { data: isOwnerOrAdmin } = useIsOwnerOrAdmin();
  const isHR = useHasRole("hr_manager");
  const canView = isOwnerOrAdmin || isHR;
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);

  // Tabs inside dialog
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [daily, setDaily] = useState<DailyReport[]>([]);
  const [weekly, setWeekly] = useState<WeeklyReport[]>([]);
  const [tasks, setTasks] = useState<Activity[]>([]);

  // Edit employee state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editRole, setEditRole] = useState("employee");
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg] = useState("");

  // Add Employee state
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentPhone, setNewAgentPhone] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("employee");
  const [newAgentDept, setNewAgentDept] = useState("Telecalling");
  const [creatingAgent, setCreatingAgent] = useState(false);

  // Created credentials modal
  const [createdCreds, setCreatedCreds] = useState<{ email: string; pass: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete/Deactivate state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState(false);

  // Filter: all vs callers
  const [roleFilter, setRoleFilter] = useState<"all" | "caller">("all");

  const fetchProfilesAndRoles = async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const profList = (pRes.data ?? []).map((p: any) => ({
        ...p,
        user_id: p.user_id || p.id,
        display_name: p.display_name || p.full_name || p.email?.split("@")[0] || "Unnamed",
      })) as Profile[];

      setProfiles(profList);
      setRoles((rRes.data ?? []) as Role[]);
    } catch (err) {
      console.error("fetchProfilesAndRoles error:", err);
      toast.error("Employee data load karne me dikkat hui");
    }
  };

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    fetchProfilesAndRoles().finally(() => setLoading(false));
  }, [canView]);

  const roleFor = (uid: string) => {
    const p = profiles.find((prof) => prof.user_id === uid);
    const em = (p?.email || "").toLowerCase().trim();
    if (em === "sultanwellness.owner@gmail.com" || em.includes("owner") || em.includes("admin")) {
      return "owner";
    }
    const found = roles.find((r) => r.user_id === uid);
    return found?.role ?? "employee";
  };

  const callersList = profiles.filter((p) => {
    const r = roleFor(p.user_id);
    return r === "employee" || r === "caller" || r === "tl";
  });

  const visibleProfiles = roleFilter === "caller" ? callersList : profiles;

  const openEmployee = async (p: Profile) => {
    setSelected(p);
    setEditName(p.display_name || p.full_name || "");
    setEditPhone(p.phone || "");
    setEditDept(p.department || "Telecalling");
    setEditRole(roleFor(p.user_id));

    const [a, d, w, t] = await Promise.all([
      supabase.from("attendance").select("*").eq("user_id", p.user_id).order("date", { ascending: false }).limit(30),
      supabase.from("daily_reports").select("*").eq("user_id", p.user_id).order("report_date", { ascending: false }).limit(30),
      supabase.from("weekly_reports").select("*").eq("user_id", p.user_id).order("week_start", { ascending: false }).limit(12),
      supabase.from("activities").select("*").or(`assigned_to.eq.${p.user_id},user_id.eq.${p.user_id}`).order("created_at", { ascending: false }).limit(50),
    ]);

    setAttendance((a.data ?? []) as Attendance[]);
    setDaily((d.data ?? []) as DailyReport[]);
    setWeekly((w.data ?? []) as WeeklyReport[]);
    setTasks((t.data ?? []) as Activity[]);
  };

  const saveEmployee = async () => {
    if (!selected) return;
    setSavingEdit(true);
    try {
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          display_name: editName.trim(),
          full_name: editName.trim(),
          phone: editPhone.trim() || null,
          department: editDept,
        })
        .or(`user_id.eq.${selected.user_id},id.eq.${selected.user_id}`);

      if (profErr) throw profErr;

      // Update role if changed
      const currentRole = roleFor(selected.user_id);
      if (editRole !== currentRole) {
        await supabase.from("user_roles").delete().eq("user_id", selected.user_id);
        await supabase.from("user_roles").insert({ user_id: selected.user_id, role: editRole });
      }

      toast.success("Employee details update ho gayi");
      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === selected.user_id
            ? { ...p, display_name: editName.trim(), phone: editPhone.trim(), department: editDept }
            : p
        )
      );
      setRoles((prev) => [
        ...prev.filter((r) => r.user_id !== selected.user_id),
        { user_id: selected.user_id, role: editRole },
      ]);
      setSelected((prev) => (prev ? { ...prev, display_name: editName.trim(), phone: editPhone.trim(), department: editDept } : null));
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Update fail hua");
    } finally {
      setSavingEdit(false);
    }
  };

  const sendNotification = async () => {
    if (!selected || !notifTitle.trim()) return;
    const { error } = await supabase.from("notifications").insert({
      user_id: selected.user_id,
      title: notifTitle,
      message: notifMsg,
      type: "info",
    });
    if (error) return toast.error(error.message);
    toast.success("Notification bhej di gayi!");
    setNotifTitle("");
    setNotifMsg("");
    setNotifOpen(false);
  };

  // ── Create Employee / Agent ──
  const createEmployeeAccount = async () => {
    const email = newAgentEmail.trim().toLowerCase();
    const pass = newAgentPassword;
    const name = newAgentName.trim() || email.split("@")[0];

    if (!email || !pass || pass.length < 6) {
      toast.error("Email aur kam se kam 6 characters ka password zaroori hai");
      return;
    }

    setCreatingAgent(true);
    try {
      let createdUserId: string | null = null;

      // 1. Try DB RPC function first (creates with confirmed email automatically)
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc("admin_create_employee", {
          _email: email,
          _password: pass,
          _full_name: name,
          _phone: newAgentPhone.trim(),
          _role: newAgentRole,
          _department: newAgentDept,
        });

        if (!rpcErr && rpcData?.user_id) {
          createdUserId = rpcData.user_id;
        }
      } catch (rpcCatch) {
        console.warn("RPC admin_create_employee not available, falling back to signUp client:", rpcCatch);
      }

      // 2. Fallback: Secondary Supabase client without session persistence
      if (!createdUserId) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://gzvkbrkracajwizmnzgx.supabase.co";
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_bHCzjy6RP516IKSLgSYAbw_vfrITeUY";

        const secondaryClient = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: signUpData, error: signUpErr } = await secondaryClient.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              full_name: name,
              phone: newAgentPhone.trim(),
              role: newAgentRole,
              department: newAgentDept,
            },
          },
        });

        if (signUpErr) throw signUpErr;
        createdUserId = signUpData.user?.id || null;
      }

      // 3. Upsert profile and user_roles
      if (createdUserId) {
        await supabase.from("profiles").upsert({
          id: createdUserId,
          user_id: createdUserId,
          display_name: name,
          full_name: name,
          email: email,
          phone: newAgentPhone.trim() || null,
          department: newAgentDept,
          job_title: newAgentRole === "tl" ? "Team Leader" : newAgentRole === "admin" ? "Administrator" : "Telecaller",
          employee_status: "active",
        });

        await supabase.from("user_roles").upsert({
          user_id: createdUserId,
          role: newAgentRole,
        });
      }

      setCreatedCreds({ email, pass, name });
      toast.success(`Account create ho gaya: ${name}`);
      setNewAgentName("");
      setNewAgentEmail("");
      setNewAgentPassword("");
      setNewAgentPhone("");
      setAddAgentOpen(false);

      await fetchProfilesAndRoles();
    } catch (err: any) {
      console.error("Create employee error:", err);
      toast.error(err.message || "Employee create nahi ho paya");
    } finally {
      setCreatingAgent(false);
    }
  };

  // ── Delete / Deactivate Agent ──
  const deleteAgent = async () => {
    if (!selected) return;
    setDeletingAgent(true);
    try {
      // Mark inactive in profiles
      await supabase
        .from("profiles")
        .update({ employee_status: "inactive" })
        .or(`user_id.eq.${selected.user_id},id.eq.${selected.user_id}`);

      // Delete from user_roles
      await supabase.from("user_roles").delete().eq("user_id", selected.user_id);

      toast.success("Employee account deactivate kar diya gaya");
      setProfiles((prev) => prev.filter((p) => p.user_id !== selected.user_id));
      setDeleteConfirmOpen(false);
      setSelected(null);
    } catch (err: any) {
      toast.error(err.message || "Deactivation fail hua");
    } finally {
      setDeletingAgent(false);
    }
  };

  const copyCreds = () => {
    if (!createdCreds) return;
    const txt = `Sultan CRM Login Credentials:\nEmail: ${createdCreds.email}\nPassword: ${createdCreds.pass}\nURL: ${window.location.origin}/auth`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    toast.success("Login credentials clipboard me copy ho gaye!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!canView) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Access restricted. Only Admin, Owner and HR can view this page.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("emp.title", "Employee Directory")}</h1>
          <p className="text-muted-foreground text-sm">
            {isOwnerOrAdmin
              ? "Full access — naye employees/telecallers banayein aur unka data dekhein"
              : "Read-only view of employee details"}
          </p>
        </div>
        {isOwnerOrAdmin && (
          <Button onClick={() => setAddAgentOpen(true)} className="bg-primary hover:bg-primary/90">
            <UserPlus className="h-4 w-4 mr-2" /> {t("emp.add", "+ Add Employee / Agent")}
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={roleFilter === "all" ? "default" : "outline"}
          onClick={() => setRoleFilter("all")}
        >
          {t("emp.all", "All Staff")} ({profiles.length})
        </Button>
        <Button
          size="sm"
          variant={roleFilter === "caller" ? "default" : "outline"}
          onClick={() => setRoleFilter("caller")}
        >
          {t("emp.callers", "Telecallers Only")} ({callersList.length})
        </Button>
      </div>

      {/* Employee Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProfiles.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full py-8 text-center bg-card rounded-lg border">
            Koi employee nahi mila. Upar "Add Employee" button se naya account banayein.
          </p>
        )}
        {visibleProfiles.map((p) => {
          const role = roleFor(p.user_id);
          const initials = (p.display_name || p.email || "E").slice(0, 2).toUpperCase();
          const isAdminRole = role === "admin" || role === "owner";

          return (
            <Card
              key={p.user_id}
              className="cursor-pointer hover:border-primary transition group shadow-sm"
              onClick={() => openEmployee(p)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{p.display_name ?? "Unnamed"}</p>
                    {isAdminRole && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={isAdminRole ? "default" : "outline"} className="text-[11px] capitalize">
                      {role === "tl" ? "Team Leader" : role}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{p.department || "Telecalling"}</span>
                  </div>
                </div>
                <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 border">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {(selected.display_name ?? "??").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg">{selected.display_name ?? "Unnamed"}</DialogTitle>
                    <p className="text-xs text-muted-foreground">{selected.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{roleFor(selected.user_id)}</Badge>
                      <span className="text-xs text-muted-foreground">{selected.department || "Telecalling"}</span>
                      {selected.phone && <span className="text-xs text-muted-foreground">📞 {selected.phone}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isOwnerOrAdmin && (
                      <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    )}
                    {isOwnerOrAdmin && (
                      <Button size="sm" variant="secondary" onClick={() => setNotifOpen(true)}>
                        <Bell className="h-3.5 w-3.5 mr-1" /> Notify
                      </Button>
                    )}
                    {isOwnerOrAdmin && (
                      <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="attendance" className="mt-4">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="daily">Daily Reports</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="tasks">Assigned Tasks</TabsTrigger>
                </TabsList>
                <TabsContent value="attendance" className="space-y-2 pt-2">
                  {attendance.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Koi attendance record nahi mila.</p>}
                  {attendance.map((a) => (
                    <div key={a.id} className="flex justify-between items-center text-sm p-2 rounded bg-muted/50 border">
                      <span className="font-medium">{a.date}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"} →{" "}
                        {a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </span>
                      <Badge variant="outline" className="capitalize">{a.status}</Badge>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="daily" className="space-y-2 pt-2">
                  {daily.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Koi daily report nahi mila.</p>}
                  {daily.map((d) => (
                    <Card key={d.id}>
                      <CardContent className="p-3 text-sm space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>{d.report_date}</span>
                          <span className="text-muted-foreground">{d.hours_worked ?? 0}h worked</span>
                        </div>
                        {d.tasks_completed && <p><span className="text-muted-foreground">Completed:</span> {d.tasks_completed}</p>}
                        {d.tasks_pending && <p><span className="text-muted-foreground">Pending:</span> {d.tasks_pending}</p>}
                        {d.blockers && <p className="text-destructive"><span className="font-medium">Blockers:</span> {d.blockers}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="weekly" className="space-y-2 pt-2">
                  {weekly.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Koi weekly report nahi mila.</p>}
                  {weekly.map((w) => (
                    <Card key={w.id}>
                      <CardContent className="p-3 text-sm space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Week of {w.week_start}</span>
                          <span className="text-muted-foreground">{w.total_hours ?? 0}h</span>
                        </div>
                        {w.summary && <p>{w.summary}</p>}
                        {w.achievements && <p className="text-green-600">Wins: {w.achievements}</p>}
                        {w.challenges && <p className="text-amber-600">Challenges: {w.challenges}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="tasks" className="space-y-2 pt-2">
                  {tasks.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Koi tasks assigned nahi hain.</p>}
                  {tasks.map((t) => (
                    <div key={t.id} className="flex justify-between items-center text-sm p-2 rounded bg-muted/50 border">
                      <div>
                        <p className="font-medium">{t.title}</p>
                        {t.due_date && <p className="text-xs text-muted-foreground">Due: {t.due_date}</p>}
                      </div>
                      <Badge variant={t.task_status === "completed" ? "default" : "outline"}>{t.task_status}</Badge>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Employee Profile</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid gap-1.5">
              <Label>Full Name / Display Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone Number</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="grid gap-1.5">
              <Label>Department</Label>
              <Select value={editDept} onValueChange={setEditDept}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Telecalling">Telecalling</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Telecaller / Employee</SelectItem>
                  <SelectItem value="tl">Team Leader (TL)</SelectItem>
                  <SelectItem value="hr_manager">HR Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEmployee} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pencil className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Message to {selected?.display_name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Title</Label><Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="e.g. Lead update required" /></div>
            <div><Label>Message</Label><Textarea value={notifMsg} onChange={(e) => setNotifMsg(e.target.value)} rows={3} placeholder="Notification text..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifOpen(false)}>Cancel</Button>
            <Button onClick={sendNotification}>Send Notification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Employee Dialog */}
      <Dialog open={addAgentOpen} onOpenChange={setAddAgentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> + Add New Employee / Telecaller
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid gap-1.5">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="e.g. Rohit Kumar"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Email ID (Login Username) <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={newAgentEmail}
                onChange={(e) => setNewAgentEmail(e.target.value)}
                placeholder="rohit@sultancrm.com"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Password <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                value={newAgentPassword}
                onChange={(e) => setNewAgentPassword(e.target.value)}
                placeholder="Min 6 characters"
                minLength={6}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone Number</Label>
              <Input
                value={newAgentPhone}
                onChange={(e) => setNewAgentPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Role</Label>
                <Select value={newAgentRole} onValueChange={setNewAgentRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Telecaller</SelectItem>
                    <SelectItem value="tl">Team Leader</SelectItem>
                    <SelectItem value="hr_manager">HR Manager</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Department</Label>
                <Select value={newAgentDept} onValueChange={setNewAgentDept}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Telecalling">Telecalling</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAgentOpen(false)}>Cancel</Button>
            <Button onClick={createEmployeeAccount} disabled={creatingAgent} className="bg-primary hover:bg-primary/90">
              {creatingAgent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Create Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Created Success Dialog */}
      <Dialog open={!!createdCreds} onOpenChange={(o) => !o && setCreatedCreds(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" /> Account Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p className="text-muted-foreground">
              Naya employee account create ho gaya hai. Ye credentials employee ke sath share karein:
            </p>
            <div className="bg-muted p-3 rounded-md space-y-1 font-mono text-xs border">
              <div><strong className="text-foreground">Name:</strong> {createdCreds?.name}</div>
              <div><strong className="text-foreground">Email:</strong> {createdCreds?.email}</div>
              <div><strong className="text-foreground">Password:</strong> {createdCreds?.pass}</div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={copyCreds}>
              {copied ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Copy Details"}
            </Button>
            <Button onClick={() => setCreatedCreds(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account Deactivate karein?</AlertDialogTitle>
            <AlertDialogDescription>
              "{selected?.display_name ?? "Is employee"}" ka access suspend ho jayega aur unka status inactive mark ho jayega.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAgent}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAgent}
              disabled={deletingAgent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAgent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
