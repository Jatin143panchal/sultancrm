import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin, AppRole } from "@/hooks/useAdmin";

const ROLES: AppRole[] = ["owner", "admin", "hr_manager", "tl", "employee", "user"];
const roleColor: Record<string, string> = {
  owner: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  admin: "bg-red-500/10 text-red-700 dark:text-red-300",
  hr_manager: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  tl: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  employee: "bg-green-500/10 text-green-700 dark:text-green-300",
  user: "bg-muted text-muted-foreground",
};

interface Profile { id: string; user_id: string; display_name: string | null; }
interface UserRole { id: string; user_id: string; role: AppRole; }

export default function TeamRoles() {
  const { data: isAdmin } = useIsAdmin();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Record<string, AppRole>>({});

  const { data: profiles = [], isLoading: pl } = useQuery({
    queryKey: ["all_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data as Profile[];
    },
    enabled: isAdmin,
  });

  const { data: roles = [], isLoading: rl } = useQuery({
    queryKey: ["all_user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: isAdmin,
  });

  const assign = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const exists = roles.find((r) => r.user_id === user_id && r.role === role);
      if (exists) throw new Error("Role already assigned");
      const { error } = await supabase.from("user_roles").insert({ user_id, role } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all_user_roles"] }); toast.success("Role assigned"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all_user_roles"] }); toast.success("Role removed"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <Card className="max-w-lg mx-auto mt-12">
        <CardContent className="p-8 text-center space-y-2">
          <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">Restricted</p>
          <p className="text-sm text-muted-foreground">Only Owners or Admins can manage team roles.</p>
        </CardContent>
      </Card>
    );
  }

  if (pl || rl) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const rolesByUser = (uid: string) => roles.filter((r) => r.user_id === uid);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Roles</h1>
        <p className="text-muted-foreground">Assign Owner, Admin, HR Manager, Team Lead and Employee roles.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Members ({profiles.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Current Roles</TableHead>
                <TableHead>Assign Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => {
                const userRoles = rolesByUser(p.user_id);
                return (
                  <TableRow key={p.user_id}>
                    <TableCell className="font-medium">{p.display_name || "Unnamed"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userRoles.length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
                        {userRoles.map((r) => (
                          <span key={r.id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${roleColor[r.role] || "bg-muted"}`}>
                            {r.role}
                            <button onClick={() => remove.mutate(r.id)} className="hover:opacity-70">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          value={selected[p.user_id] || ""}
                          onValueChange={(v) => setSelected({ ...selected, [p.user_id]: v as AppRole })}
                        >
                          <SelectTrigger className="w-36 h-8"><SelectValue placeholder="Pick role" /></SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          disabled={!selected[p.user_id] || assign.isPending}
                          onClick={() => assign.mutate({ user_id: p.user_id, role: selected[p.user_id] })}
                        >
                          Add
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Role Definitions</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><Badge className={roleColor.owner}>owner</Badge> Full access — owns the company workspace.</div>
          <div><Badge className={roleColor.admin}>admin</Badge> System admin — manage data, users, settings.</div>
          <div><Badge className={roleColor.hr_manager}>hr_manager</Badge> Manages attendance, leaves, holidays.</div>
          <div><Badge className={roleColor.tl}>tl</Badge> Team Lead — assigns tasks, oversees team work.</div>
          <div><Badge className={roleColor.employee}>employee</Badge> Standard employee with daily check-in/out.</div>
        </CardContent>
      </Card>
    </div>
  );
}
