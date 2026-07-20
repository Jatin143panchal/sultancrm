import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAllProfiles, useAdminQuery } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, UserCheck, Loader2 } from "lucide-react";

interface Activity { id: string; title: string; type: string; description: string | null; assigned_to: string | null; completed: boolean | null; due_date: string | null; contact_name: string | null; created_at: string; }
interface Lead { id: string; name: string; status: string; assigned_to: string | null; business_status: string | null; value: number | null; }
interface Profile { id: string; user_id: string; display_name: string | null; }

export default function TaskAssignment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profiles = [], isLoading: pl } = useAllProfiles();
  const { data: activities = [], isLoading: al } = useAdminQuery<Activity>("activities");
  const { data: leads = [], isLoading: ll } = useAdminQuery<Lead>("leads");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "task", description: "", assigned_to: "", due_date: "", contact_name: "" });

  const assignTask = useMutation({
    mutationFn: async (task: any) => {
      const { error } = await supabase.from("activities").insert({
        ...task,
        user_id: task.assigned_to || user!.id,
        completed: false,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "activities"] }),
  });

  const assignLead = useMutation({
    mutationFn: async ({ id, assigned_to }: { id: string; assigned_to: string }) => {
      const { error } = await supabase.from("leads").update({ assigned_to } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "leads"] }),
  });

  const updateBusinessStatus = useMutation({
    mutationFn: async ({ id, business_status }: { id: string; business_status: string }) => {
      const { error } = await supabase.from("leads").update({ business_status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "leads"] }),
  });

  const getProfileName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const p = (profiles as Profile[]).find(p => p.user_id === userId);
    return p?.display_name || "Unknown";
  };

  const handleAdd = async () => {
    if (!form.title) return;
    await assignTask.mutateAsync({
      title: form.title,
      type: form.type,
      description: form.description || null,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      contact_name: form.contact_name || null,
    });
    setForm({ title: "", type: "task", description: "", assigned_to: "", due_date: "", contact_name: "" });
    setDialogOpen(false);
  };

  if (pl || al || ll) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task & Lead Assignment</h1>
          <p className="text-muted-foreground">Assign tasks and leads to team members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Assign Task</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign New Task</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["call", "email", "meeting", "task", "note"].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assign To</Label>
                <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
                  <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                  <SelectContent>
                    {(profiles as Profile[]).map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.display_name || "Unknown"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Contact Name</Label><Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
              <Button onClick={handleAdd} disabled={assignTask.isPending}>{assignTask.isPending ? "Assigning..." : "Assign Task"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lead Assignment */}
      <Card>
        <CardHeader><CardTitle className="text-base">Lead Details & Assignment</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell><p className="font-medium">{lead.name}</p></TableCell>
                  <TableCell><Badge variant="outline">{lead.status}</Badge></TableCell>
                  <TableCell>
                    <Select value={lead.business_status || "active"} onValueChange={v => updateBusinessStatus.mutate({ id: lead.id, business_status: v })}>
                      <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="no-go">No-Go</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={lead.assigned_to || ""} onValueChange={v => assignLead.mutate({ id: lead.id, assigned_to: v })}>
                      <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Assign" /></SelectTrigger>
                      <SelectContent>
                        {(profiles as Profile[]).map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.display_name || "Unknown"}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lead.assigned_to ? "default" : "outline"} className="text-xs">
                      {lead.assigned_to ? <><UserCheck className="h-3 w-3 mr-1" />Assigned</> : "Unassigned"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No leads yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assigned Tasks */}
      <Card>
        <CardHeader><CardTitle className="text-base">All Tasks</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map(act => (
                <TableRow key={act.id}>
                  <TableCell><p className="font-medium text-sm">{act.title}</p><p className="text-xs text-muted-foreground">{act.description}</p></TableCell>
                  <TableCell><Badge variant="outline">{act.type}</Badge></TableCell>
                  <TableCell className="text-sm">{getProfileName(act.assigned_to)}</TableCell>
                  <TableCell className="text-sm">{act.due_date || "—"}</TableCell>
                  <TableCell><Badge variant={act.completed ? "secondary" : "default"}>{act.completed ? "Done" : "Pending"}</Badge></TableCell>
                </TableRow>
              ))}
              {activities.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No tasks yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
