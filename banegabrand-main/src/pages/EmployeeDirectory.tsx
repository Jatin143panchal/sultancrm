import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsOwnerOrAdmin, useHasRole } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Pencil, Bell, Eye } from "lucide-react";

interface Profile { id: string; user_id: string; display_name: string | null; avatar_url: string | null; }
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

  useEffect(() => {
    if (!canView) { setLoading(false); return; }
    (async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      setProfiles((p.data ?? []) as Profile[]);
      setRoles((r.data ?? []) as Role[]);
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

  const roleFor = (uid: string) => roles.find(r => r.user_id === uid)?.role ?? "employee";

  if (!canView) return <div className="p-8 text-center text-muted-foreground">Access restricted to Owner, Admin and HR.</div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employee Directory</h1>
        <p className="text-muted-foreground">{isOwnerOrAdmin ? "Full access — view & edit all employees" : "Read-only view of employee details & reports"}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map(p => (
          <Card key={p.id} className="cursor-pointer hover:border-primary transition" onClick={() => openEmployee(p)}>
            <CardContent className="p-4 flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                <AvatarFallback>{(p.display_name ?? "??").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.display_name ?? "Unnamed"}</p>
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
                    {selected.avatar_url && <AvatarImage src={selected.avatar_url} />}
                    <AvatarFallback>{(selected.display_name ?? "??").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle>{selected.display_name ?? "Unnamed"}</DialogTitle>
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
    </div>
  );
}
