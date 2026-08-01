import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsOwnerOrAdmin, useHasRole } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
import { Loader2, Pencil, Bell, Eye, UserPlus, Trash2 } from "lucide-react";

interface Profile { user_id: string; display_name: string | null; email: string | null; department: string | null; job_title: string | null; }
interface Role { user_id: string; role: string; }
interface Attendance { id: string; user_id: string; date: string; check_in: string | null; check_out: string | null; status: string; }
interface DailyReport { id: string; user_id: string; report_date: string; tasks_completed: string | null; tasks_pending: string | null; blockers: string | null; hours_worked: number | null; }
interface WeeklyReport { id: string; user_id: string; week_start: string; summary: string | null; achievements: string | null; challenges: string | null; total_hours: number | null; }
interface Activity { id: string; user_id: string; assigned_to: string | null; title: string; task_status: string; due_date: string | null; }

export default function EmployeeDirectory() {
  const isOwnerOrAdmin = useIsOwnerOrAdmin();
  const isHR = useHasRole("hr_manager");
  const canView = isOwnerOrAdmin || isHR;
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [daily, setDaily] = useState<DailyReport[]>([]);
  const [weekly, setWeekly] = useState<WeeklyReport[]>([]);
  const [tasks, setTasks] = useState<Activity[]>([]);
  const [editName, setEditName] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg] = useState("");

  // ---- Add Agent state ----
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [creatingAgent, setCreatingAgent] = useState(false);

  // ---- Delete Agent state ----
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState(false);

  // ---- List filter: All Employees vs Agents Only ----
  const [roleFilter, setRoleFilter] = useState<"all" | "agent">("all");

  // ---- Agents fetched directly from DB (user_roles joined with profiles) ----
  const [agentProfiles, setAgentProfiles] = useState<Profile[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  const fetchProfilesAndRoles = async () => {
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles((p.data ?? []) as Profile[]);
    setRoles((r.data ?? []) as Role[]);
  };

  // Agents ko seedha DB se search karo: user_roles mai role = 'agent',
  // aur uske saath profiles table join karo. Ye general profiles fetch
  // se independent hai, isliye agar wahan koi issue ho to bhi ye chalega.
  const fetchAgents = async () => {
    setAgentsLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, profiles!inner(user_id, display_name, email, department, job_title)")
      .eq("role", "agent");

    if (error) {
      console.error("fetchAgents error:", error);
      toast.error("Agents load nahi ho paye: " + error.message);
      setAgentsLoading(false);
      return;
    }

    const rows: Profile[] = (data ?? []).map((r: any) => ({
      user_id: r.profiles.user_id,
      display_name: r.profiles.display_name,
      email: r.profiles.email,
      department: r.profiles.department,
      job_title: r.profiles.job_title,
    }));
    setAgentProfiles(rows);
    setAgentsLoading(false);
  };

  useEffect(() => {
    if (!canView) { setLoading(false); return; }
    (async () => {
      await Promise.all([fetchProfilesAndRoles(), fetchAgents()]);
      setLoading(false);
    })();
  }, [canView]);

  const openEmployee = async (p: Profile) => {
    setSelected(p);
    setEditName(p.display_name ?? "");
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

  const saveName = async () => {
    if (!selected) return;
    const { error } = await supabase.from("profiles").update({ display_name: editName }).eq("user_id", selected.user_id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    setProfiles(profiles.map(p => p.user_id === selected.user_id ? { ...p, display_name: editName } : p));
    setSelected({ ...selected, display_name: editName });
    setEditOpen(false);
  };

  const sendNotification = async () => {
    if (!selected || !notifTitle.trim()) return;
    const { error } = await supabase.from("notifications").insert({
      user_id: selected.user_id, title: notifTitle, message: notifMsg, type: "info",
    });
    if (error) return toast.error(error.message);
    toast.success("Notification sent");
    setNotifTitle(""); setNotifMsg(""); setNotifOpen(false);
  };

  // ---- Create a new agent (signup) — calls secure edge function ----
  const createAgent = async () => {
    if (!newAgentEmail || !newAgentPassword || newAgentPassword.length < 6) {
      toast.error("Email aur kam se kam 6 character ka password daalein");
      return;
    }
    setCreatingAgent(true);
    const { data, error } = await supabase.functions.invoke("manage-agents", {
      body: {
        action: "create",
        email: newAgentEmail,
        password: newAgentPassword,
        display_name: newAgentName || newAgentEmail.split("@")[0],
      },
    });
    setCreatingAgent(false);

    if (error || data?.error) {
      // Poora error console mai log karo taaki debug karna aasan ho
      console.error("manage-agents create error:", error, data);
      toast.error(data?.error || error?.message || "Agent create nahi hua — console check karein");
      return;
    }

    toast.success("Agent create ho gaya");
    setNewAgentName(""); setNewAgentEmail(""); setNewAgentPassword("");
    setAddAgentOpen(false);
    fetchProfilesAndRoles();
    fetchAgents();
  };

  // ---- Delete an agent — calls secure edge function ----
  const deleteAgent = async () => {
    if (!selected) return;
    setDeletingAgent(true);
    const { data, error } = await supabase.functions.invoke("manage-agents", {
      body: { action: "delete", user_id: selected.user_id },
    });
    setDeletingAgent(false);

    if (error || data?.error) {
      console.error("manage-agents delete error:", error, data);
      toast.error(data?.error || error?.message || "Agent delete nahi hua — console check karein");
      return;
    }

    toast.success("Agent delete ho gaya");
    setProfiles(profiles.filter(p => p.user_id !== selected.user_id));
    setAgentProfiles(agentProfiles.filter(a => a.user_id !== selected.user_id));
    setDeleteConfirmOpen(false);
    setSelected(null);
  };

  const roleFor = (uid: string) => roles.find(r => r.user_id === uid)?.role ?? "employee";

  const visibleProfiles = roleFilter === "agent" ? agentProfiles : profiles;
  const agentCount = agentProfiles.length;

  if (!canView) return <div className="p-8 text-center text-muted-foreground">Access restricted to Owner, Admin and HR.</div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Directory</h1>
          <p className="text-muted-foreground">{isOwnerOrAdmin ? "Full access — view & edit all employees" : "Read-only view of employee details & reports"}</p>
        </div>
        {isOwnerOrAdmin && (
          <Button onClick={() => setAddAgentOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Add Agent
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={roleFilter === "all" ? "default" : "outline"}
          onClick={() => setRoleFilter("all")}
        >
          All Employees ({profiles.length})
        </Button>
        <Button
          size="sm"
          variant={roleFilter === "agent" ? "default" : "outline"}
          onClick={() => setRoleFilter("agent")}
        >
          Agents Only ({agentCount})
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roleFilter === "agent" && agentsLoading && (
          <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Agents load ho rahe hain...
          </div>
        )}
        {!(roleFilter === "agent" && agentsLoading) && visibleProfiles.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full py-4">
            {roleFilter === "agent" ? "Abhi koi agent nahi hai." : "Koi employee nahi mila."}
          </p>
        )}
        {visibleProfiles.map(p => (
          <Card key={p.user_id} className="cursor-pointer hover:border-primary transition" onClick={() => openEmployee(p)}>
            <CardContent className="p-4 flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{(p.display_name ?? "??").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.display_name ?? "Unnamed"}</p>
                <p className="text-xs text-muted-foreground truncate">{p.job_title || p.department || ""}</p>
                <Badge variant="outline" className="mt-1 text-xs">{roleFor(p.user_id)}</Badge>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback>{(selected.display_name ?? "??").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle>{selected.display_name ?? "Unnamed"}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{selected.job_title || selected.department || selected.email}</p>
                    <Badge variant="outline" className="mt-1">{roleFor(selected.user_id)}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {isOwnerOrAdmin && (
                      <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    )}
                    {isOwnerOrAdmin && (
                      <Button size="sm" onClick={() => setNotifOpen(true)}>
                        <Bell className="h-4 w-4 mr-1" /> Notify
                      </Button>
                    )}
                    {isOwnerOrAdmin && (
                      <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="attendance">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>
                <TabsContent value="attendance" className="space-y-2">
                  {attendance.length === 0 && <p className="text-sm text-muted-foreground">No attendance records.</p>}
                  {attendance.map(a => (
                    <div key={a.id} className="flex justify-between text-sm p-2 rounded bg-muted/50">
                      <span>{a.date}</span>
                      <span className="text-muted-foreground">{a.check_in ? new Date(a.check_in).toLocaleTimeString() : "—"} → {a.check_out ? new Date(a.check_out).toLocaleTimeString() : "—"}</span>
                      <Badge variant="outline">{a.status}</Badge>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="daily" className="space-y-2">
                  {daily.length === 0 && <p className="text-sm text-muted-foreground">No daily reports.</p>}
                  {daily.map(d => (
                    <Card key={d.id}><CardContent className="p-3 text-sm space-y-1">
                      <div className="flex justify-between"><strong>{d.report_date}</strong><span className="text-muted-foreground">{d.hours_worked ?? 0}h</span></div>
                      {d.tasks_completed && <p><span className="text-muted-foreground">Done:</span> {d.tasks_completed}</p>}
                      {d.tasks_pending && <p><span className="text-muted-foreground">Pending:</span> {d.tasks_pending}</p>}
                      {d.blockers && <p className="text-destructive">Blockers: {d.blockers}</p>}
                    </CardContent></Card>
                  ))}
                </TabsContent>
                <TabsContent value="weekly" className="space-y-2">
                  {weekly.length === 0 && <p className="text-sm text-muted-foreground">No weekly reports.</p>}
                  {weekly.map(w => (
                    <Card key={w.id}><CardContent className="p-3 text-sm space-y-1">
                      <div className="flex justify-between"><strong>Week of {w.week_start}</strong><span className="text-muted-foreground">{w.total_hours ?? 0}h</span></div>
                      {w.summary && <p>{w.summary}</p>}
                      {w.achievements && <p><span className="text-muted-foreground">Wins:</span> {w.achievements}</p>}
                      {w.challenges && <p><span className="text-muted-foreground">Challenges:</span> {w.challenges}</p>}
                    </CardContent></Card>
                  ))}
                </TabsContent>
                <TabsContent value="tasks" className="space-y-2">
                  {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks.</p>}
                  {tasks.map(t => (
                    <div key={t.id} className="flex justify-between items-center text-sm p-2 rounded bg-muted/50">
                      <div>
                        <p className="font-medium">{t.title}</p>
                        {t.due_date && <p className="text-xs text-muted-foreground">Due {t.due_date}</p>}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Display name</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification to {selected?.display_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="e.g. Great work!" /></div>
            <div><Label>Message</Label><Textarea value={notifMsg} onChange={(e) => setNotifMsg(e.target.value)} rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifOpen(false)}>Cancel</Button>
            <Button onClick={sendNotification}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Agent dialog */}
      <Dialog open={addAgentOpen} onOpenChange={setAddAgentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Agent</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label>Agent Name</Label>
              <Input value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} placeholder="Agent ka naam" />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={newAgentEmail} onChange={(e) => setNewAgentEmail(e.target.value)} placeholder="agent@example.com" />
            </div>
            <div className="grid gap-2">
              <Label>Password</Label>
              <Input type="password" value={newAgentPassword} onChange={(e) => setNewAgentPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAgentOpen(false)}>Cancel</Button>
            <Button onClick={createAgent} disabled={creatingAgent}>
              {creatingAgent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Add Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Agent confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agent delete karein?</AlertDialogTitle>
            <AlertDialogDescription>
              "{selected?.display_name ?? "Is agent"}" ka account permanently delete ho jayega. Ye action wapas nahi ho sakta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAgent}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAgent} disabled={deletingAgent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingAgent ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
