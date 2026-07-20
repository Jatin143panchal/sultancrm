import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsOwnerOrAdmin, AppRole } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Pencil, Search, Users, Bell } from "lucide-react";

const ROLES: AppRole[] = ["owner", "admin", "hr_manager", "tl", "employee"];
const STATUSES = ["active", "inactive", "on_leave"];

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  job_title: string | null;
  employee_status: string | null;
  admin_notes: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Role { id: string; user_id: string; role: string; }

export default function AllUsers() {
  const canManage = useIsOwnerOrAdmin();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: "", phone: "", department: "", job_title: "",
    employee_status: "active", admin_notes: "", role: "employee" as AppRole,
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg] = useState("");

  const load = async () => {
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);
    if (p.error) toast.error(p.error.message);
    if (r.error) toast.error(r.error.message);
    setProfiles((p.data ?? []) as Profile[]);
    setRoles((r.data ?? []) as Role[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!canManage) { setLoading(false); return; }
    load();
  }, [canManage]);

  const roleFor = (uid: string) => roles.find(r => r.user_id === uid)?.role ?? "employee";

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    const matchSearch =
      (p.display_name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.phone || "").includes(q) ||
      (p.department || "").toLowerCase().includes(q);
    const matchRole = filterRole === "all" || roleFor(p.user_id) === filterRole;
    return matchSearch && matchRole;
  });

  const openEdit = (p: Profile) => {
    setSelected(p);
    setEditForm({
      display_name: p.display_name || "",
      phone: p.phone || "",
      department: p.department || "",
      job_title: p.job_title || "",
      employee_status: p.employee_status || "active",
      admin_notes: p.admin_notes || "",
      role: (roleFor(p.user_id) as AppRole) || "employee",
    });
    setEditOpen(true);
  };

  const saveUser = async () => {
    if (!selected) return;
    const { error: profileError } = await supabase.from("profiles").update({
      display_name: editForm.display_name,
      phone: editForm.phone || null,
      department: editForm.department || null,
      job_title: editForm.job_title || null,
      employee_status: editForm.employee_status,
      admin_notes: editForm.admin_notes || null,
    }).eq("user_id", selected.user_id);

    if (profileError) return toast.error(profileError.message);

    const { error: roleError } = await supabase.rpc("set_user_primary_role", {
      _user_id: selected.user_id,
      _role: editForm.role,
    });

    if (roleError) {
      // Fallback: manual role update if RPC not migrated yet
      await supabase.from("user_roles").delete().eq("user_id", selected.user_id);
      await supabase.from("user_roles").insert({ user_id: selected.user_id, role: editForm.role });
    }

    toast.success("User updated");
    setEditOpen(false);
    setSelected(null);
    load();
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

  if (!canManage) {
    return (
      <Card className="max-w-lg mx-auto mt-12">
        <CardContent className="p-8 text-center text-muted-foreground">
          Only Owner or Admin can view all users.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-7 w-7" /> All Users
        </h1>
        <p className="text-muted-foreground">
          Saare signup users dekho — naam, email, role, phone update karo
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{profiles.length}</p><p className="text-xs text-muted-foreground">Total Signups</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{profiles.filter(p => roleFor(p.user_id) === "employee").length}</p><p className="text-xs text-muted-foreground">Employees</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{profiles.filter(p => (p.employee_status || "active") === "active").length}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                        <AvatarFallback>{(p.display_name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{p.display_name || "Unnamed"}</p>
                        {p.job_title && <p className="text-xs text-muted-foreground">{p.job_title}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.email || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{roleFor(p.user_id)}</Badge></TableCell>
                  <TableCell className="text-sm">{p.department || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.employee_status === "active" ? "default" : "secondary"}>
                      {p.employee_status || "active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelected(p); setNotifOpen(true); }}>
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User — {selected?.email}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Display Name</Label>
              <Input value={editForm.display_name} onChange={e => setEditForm({ ...editForm, display_name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Email (signup)</Label>
              <Input value={selected?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v as AppRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Department</Label>
                <Input value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} placeholder="Sales, HR..." />
              </div>
              <div className="grid gap-2">
                <Label>Job Title</Label>
                <Input value={editForm.job_title} onChange={e => setEditForm({ ...editForm, job_title: e.target.value })} placeholder="Executive..." />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={editForm.employee_status} onValueChange={v => setEditForm({ ...editForm, employee_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Admin Notes</Label>
              <Textarea value={editForm.admin_notes} onChange={e => setEditForm({ ...editForm, admin_notes: e.target.value })} rows={3} placeholder="Internal notes about this user..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Notify {selected?.display_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} rows={4} /></div>
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
