import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { useIsOwnerOrAdmin, AppRole } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Pencil, Search, Users, Bell, UserPlus, ShieldAlert, KeyRound, Check, Copy, UserCheck, UserX } from "lucide-react";

const ROLES: AppRole[] = ["employee", "tl", "admin", "hr_manager", "owner"];
const DEPARTMENTS = ["Telecalling", "Sales", "Customer Support", "Operations", "Management"];
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
  const { data: canManage, isLoading: authLoading } = useIsOwnerOrAdmin();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Edit User State
  const [selected, setSelected] = useState<Profile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: "", phone: "", department: "", job_title: "",
    employee_status: "active", admin_notes: "", role: "employee" as AppRole,
  });

  // Create User State (Admin only)
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee" as AppRole,
    phone: "",
    department: "Telecalling",
    job_title: "Telecaller",
  });

  // Notification State
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      if (p.error) toast.error(p.error.message);
      if (r.error) toast.error(r.error.message);
      setProfiles((p.data ?? []) as Profile[]);
      setRoles((r.data ?? []) as Role[]);
    } catch (err: any) {
      toast.error(err.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      load();
    }
  }, [canManage]);

  const roleFor = (uid: string) => {
    const p = profiles.find((prof) => prof.user_id === uid);
    const em = (p?.email || "").toLowerCase().trim();
    if (em === "sultanwellness.owner@gmail.com" || em.includes("owner") || em.includes("admin")) {
      return "owner";
    }
    return roles.find(r => r.user_id === uid)?.role ?? "employee";
  };

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

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "Sultan@";
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += Math.floor(100 + Math.random() * 900);
    setCreateForm(prev => ({ ...prev, password: pass }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password || !createForm.name) {
      toast.error("Please fill in Name, Email and Password");
      return;
    }

    setCreateLoading(true);
    try {
      let createdUserId: string | null = null;

      // 1. Try DB RPC function first (creates with confirmed email automatically)
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc("admin_create_employee", {
          _email: createForm.email.trim().toLowerCase(),
          _password: createForm.password,
          _full_name: createForm.name.trim(),
          _phone: createForm.phone?.trim() || "",
          _role: createForm.role,
          _department: createForm.department || "Telecalling",
        });

        if (!rpcErr && rpcData?.user_id) {
          createdUserId = rpcData.user_id;
        }
      } catch (rpcCatch) {
        console.warn("RPC admin_create_employee not available, falling back to signUp:", rpcCatch);
      }

      // 2. Fallback: Secondary Supabase client without session persistence
      if (!createdUserId) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://gzvkbrkracajwizmnzgx.supabase.co";
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_bHCzjy6RP516IKSLgSYAbw_vfrITeUY";

        const secondaryClient = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });

        const { data: signUpData, error: signUpErr } = await secondaryClient.auth.signUp({
          email: createForm.email.trim(),
          password: createForm.password,
          options: {
            data: {
              full_name: createForm.name.trim(),
              role: createForm.role,
              phone: createForm.phone,
              department: createForm.department,
            }
          }
        });

        if (signUpErr) throw signUpErr;
        createdUserId = signUpData.user?.id || null;
      }

      if (createdUserId) {
        // Ensure profile is correctly set
        await supabase.from("profiles").upsert({
          id: createdUserId,
          user_id: createdUserId,
          display_name: createForm.name.trim(),
          full_name: createForm.name.trim(),
          email: createForm.email.trim().toLowerCase(),
          phone: createForm.phone || null,
          department: createForm.department || "Telecalling",
          job_title: createForm.job_title || "Telecaller",
          employee_status: "active",
        });

        // Ensure role is correctly set
        await supabase.from("user_roles").upsert({
          user_id: createdUserId,
          role: createForm.role,
        });

        setCreatedCredentials({
          email: createForm.email.trim(),
          pass: createForm.password,
        });

        toast.success(`Employee account created for ${createForm.name}!`);
        await load();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create employee account");
    } finally {
      setCreateLoading(false);
    }
  };

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
    try {
      const { error: profileError } = await supabase.from("profiles").update({
        display_name: editForm.display_name,
        phone: editForm.phone || null,
        department: editForm.department || null,
        job_title: editForm.job_title || null,
        employee_status: editForm.employee_status,
        admin_notes: editForm.admin_notes || null,
      }).eq("user_id", selected.user_id);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase.rpc("set_user_primary_role", {
        _user_id: selected.user_id,
        _role: editForm.role,
      });

      if (roleError) {
        await supabase.from("user_roles").delete().eq("user_id", selected.user_id);
        await supabase.from("user_roles").insert({ user_id: selected.user_id, role: editForm.role });
      }

      toast.success("Employee details updated successfully");
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update employee");
    }
  };

  const toggleStatus = async (p: Profile) => {
    const newStatus = p.employee_status === "active" ? "inactive" : "active";
    try {
      const { error } = await supabase.from("profiles").update({
        employee_status: newStatus,
      }).eq("user_id", p.user_id);

      if (error) throw error;
      toast.success(`Employee marked as ${newStatus}`);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status");
    }
  };

  const sendNotification = async () => {
    if (!selected || !notifTitle.trim()) return;
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: selected.user_id, title: notifTitle, message: notifMsg, type: "info",
      });
      if (error) throw error;
      toast.success("Notification sent to employee");
      setNotifTitle(""); setNotifMsg(""); setNotifOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <Card className="max-w-lg mx-auto mt-12 border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-8 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold">Admin Restricted Area</h2>
          <p className="text-sm text-muted-foreground">
            Only designated Administrators or Owners have authority to manage team members and issue login credentials.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Team & Employee Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Admin Portal — Create employee IDs, assign roles, manage telecallers
          </p>
        </div>
        <Button onClick={() => { setCreatedCredentials(null); generatePassword(); setCreateOpen(true); }} className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm">
          <UserPlus className="mr-2 h-4 w-4" /> + Add New Employee
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{profiles.length}</p>
            <p className="text-xs text-muted-foreground">Total Staff Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-600">
              {profiles.filter(p => (p.employee_status || "active") === "active").length}
            </p>
            <p className="text-xs text-muted-foreground">Active Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">
              {profiles.filter(p => roleFor(p.user_id) === "employee").length}
            </p>
            <p className="text-xs text-muted-foreground">Telecallers / Callers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-purple-600">
              {profiles.filter(p => roleFor(p.user_id) === "admin" || roleFor(p.user_id) === "owner").length}
            </p>
            <p className="text-xs text-muted-foreground">Admins / Leaders</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Filter by Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="employee">Telecaller (Employee)</SelectItem>
                <SelectItem value="tl">Team Lead (TL)</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="hr_manager">HR Manager</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => {
                    const role = roleFor(p.user_id);
                    const isActive = (p.employee_status || "active") === "active";
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-9 w-9 border border-primary/20">
                              {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {(p.display_name || "?").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm text-foreground">{p.display_name || "Unnamed Staff"}</p>
                              <p className="text-xs text-muted-foreground">{p.job_title || "Telecaller"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">{p.email || "—"}</TableCell>
                        <TableCell className="text-sm">{p.phone || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={role === "admin" || role === "owner" ? "default" : role === "tl" ? "secondary" : "outline"}
                            className="capitalize text-xs font-semibold"
                          >
                            {role === "employee" ? "Telecaller" : role === "tl" ? "Team Lead" : role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{p.department || "Telecalling"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={isActive ? "default" : "destructive"}
                            className="text-[11px] uppercase font-bold"
                          >
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Edit Member"
                              onClick={() => openEdit(p)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${isActive ? "text-emerald-600 hover:text-emerald-700" : "text-rose-500 hover:text-rose-600"}`}
                              title={isActive ? "Deactivate User" : "Activate User"}
                              onClick={() => toggleStatus(p)}
                            >
                              {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              title="Send In-App Notification"
                              onClick={() => { setSelected(p); setNotifOpen(true); }}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No team members found. Click "+ Add New Employee" to register staff accounts.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE EMPLOYEE DIALOG (ADMIN ONLY) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Create Employee Account
            </DialogTitle>
            <DialogDescription>
              Admin will generate login credentials for the employee. The employee can then sign in directly.
            </DialogDescription>
          </DialogHeader>

          {createdCredentials ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                <Check className="h-5 w-5 text-emerald-600" /> Account Created Successfully!
              </div>
              <p className="text-xs text-muted-foreground">
                Share these credentials with the team member to let them sign in:
              </p>
              <div className="p-3 bg-card border rounded font-mono text-sm space-y-1">
                <div><span className="text-muted-foreground text-xs font-sans">Email:</span> {createdCredentials.email}</div>
                <div><span className="text-muted-foreground text-xs font-sans">Password:</span> {createdCredentials.pass}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(`CRM Login:\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.pass}`);
                  toast.success("Credentials copied to clipboard!");
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Credentials
              </Button>
              <Button
                className="w-full mt-2"
                size="sm"
                onClick={() => { setCreatedCredentials(null); setCreateOpen(false); }}
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreateUser} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Full Name *</Label>
                <Input
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Login Email Address *</Label>
                <Input
                  required
                  type="email"
                  placeholder="rahul@sultancrm.com"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Login Password *</Label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Generate random
                  </button>
                </div>
                <Input
                  required
                  placeholder="••••••••"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">System Role *</Label>
                  <Select
                    value={createForm.role}
                    onValueChange={(r: AppRole) => setCreateForm({ ...createForm, role: r })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Telecaller / Caller</SelectItem>
                      <SelectItem value="tl">Team Lead (TL)</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="hr_manager">HR Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Department</Label>
                  <Select
                    value={createForm.department}
                    onValueChange={d => setCreateForm({ ...createForm, department: d })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Phone Number</Label>
                <Input
                  placeholder="9876543210"
                  value={createForm.phone}
                  onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Create Account
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT USER DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member — {selected?.display_name || selected?.email}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.display_name}
                onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Login Email (Cannot be changed directly)</Label>
              <Input value={selected?.email || ""} disabled className="bg-muted font-mono text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(r: AppRole) => setEditForm({ ...editForm, role: r })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Telecaller</SelectItem>
                    <SelectItem value="tl">Team Lead</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hr_manager">HR Manager</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Department</Label>
                <Select
                  value={editForm.department}
                  onValueChange={d => setEditForm({ ...editForm, department: d })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={editForm.employee_status}
                  onValueChange={s => setEditForm({ ...editForm, employee_status: s })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Admin Notes</Label>
              <Textarea
                rows={2}
                placeholder="Performance notes or remarks..."
                value={editForm.admin_notes}
                onChange={e => setEditForm({ ...editForm, admin_notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOTIFICATION DIALOG */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Alert to {selected?.display_name || "Employee"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input
                placeholder="e.g. New leads assigned to you"
                value={notifTitle}
                onChange={e => setNotifTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <Textarea
                rows={3}
                placeholder="Please check your calling queue..."
                value={notifMsg}
                onChange={e => setNotifMsg(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifOpen(false)}>Cancel</Button>
            <Button onClick={sendNotification}>Send Alert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
