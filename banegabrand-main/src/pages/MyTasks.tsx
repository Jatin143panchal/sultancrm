import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const STATUSES = ["not_started", "in_progress", "review", "completed", "blocked"];

interface MyTask {
  id: string;
  project_id: string;
  task_name: string;
  description: string | null;
  department: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  assigned_to_email: string | null;
  assigned_to_name: string | null;
  employee_remarks: string | null;
  projects?: {
    name: string;
    brand_name: string | null;
    project_id: string;
  } | null;
}

export default function MyTasks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  // ── Fetch tasks assigned to the logged-in user (from Projects module) ──
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["my_tasks", user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tasks")
        .select(`
          *,
          projects (
            name,
            brand_name,
            project_id
          )
        `)
        .eq("assigned_to_email", user!.email)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as MyTask[];
    },
    enabled: !!user?.email,
  });

  // ── Update status and/or remarks ──
  const update = useMutation({
    mutationFn: async ({ id, status, remark }: { id: string; status?: string; remark?: string }) => {
      const patch: any = {};
      if (status) {
        patch.status = status;
        if (status === "completed") patch.completion_date = new Date().toISOString();
      }
      if (remark !== undefined) patch.employee_remarks = remark;
      const { error } = await supabase.from("project_tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_tasks"] });
      toast({ title: "Task updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  const counts = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: tasks.filter((t) => (t.status || "not_started") === s).length }),
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">Projects se assign kiye gaye tasks yahan dikhenge — status aur progress update karein</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUSES.map((s) => (
          <Card key={s}>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">{s.replace("_", " ")}</p>
              <p className="text-2xl font-bold">{counts[s] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress / Comment</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{t.task_name}</p>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    {t.department && <Badge variant="outline" className="mt-1 text-xs">{t.department}</Badge>}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{t.projects?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.projects?.project_id} {t.projects?.brand_name ? `• ${t.projects.brand_name}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.due_date ? format(new Date(t.due_date), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={t.status || "not_started"}
                      onValueChange={(v) => update.mutate({ id: t.id, status: v })}
                    >
                      <SelectTrigger className="w-36 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[220px]">
                    <Textarea
                      className="min-h-[60px]"
                      placeholder="Progress ya comment likhein..."
                      defaultValue={t.employee_remarks || ""}
                      onChange={(e) => setRemarks({ ...remarks, [t.id]: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        update.mutate({ id: t.id, remark: remarks[t.id] ?? t.employee_remarks ?? "" })
                      }
                    >
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                    Aapko koi task assign nahi hua hai
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
