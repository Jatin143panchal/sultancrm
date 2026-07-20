import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllProfiles } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function TeamTaskReport() {
  const { data: profiles = [] } = useAllProfiles();
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["team_tasks_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const nameOf = (uid: string | null) => (profiles as any[]).find(p => p.user_id === uid)?.display_name || "Unassigned";

  // Per-employee aggregation
  const perUser = (profiles as any[]).map(p => {
    const uTasks = tasks.filter(t => t.assigned_to === p.user_id);
    const completed = uTasks.filter(t => (t.task_status || (t.completed ? "completed" : "pending")) === "completed").length;
    const inProgress = uTasks.filter(t => t.task_status === "in_progress").length;
    const pending = uTasks.filter(t => !t.task_status || t.task_status === "pending").length;
    const blocked = uTasks.filter(t => t.task_status === "blocked").length;
    const total = uTasks.length;
    return { ...p, total, completed, inProgress, pending, blocked, pct: total ? Math.round((completed / total) * 100) : 0 };
  }).filter(p => p.total > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Task Report</h1>
        <p className="text-muted-foreground">Owner / HR / TL view of every team member's tasks</p>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Team Summary</TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader><CardTitle className="text-base">Per-Employee Performance</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Done</TableHead>
                    <TableHead>In Progress</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Blocked</TableHead>
                    <TableHead className="w-[180px]">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perUser.map(u => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                      <TableCell>{u.total}</TableCell>
                      <TableCell><Badge variant="secondary">{u.completed}</Badge></TableCell>
                      <TableCell>{u.inProgress}</TableCell>
                      <TableCell>{u.pending}</TableCell>
                      <TableCell>{u.blocked > 0 ? <Badge variant="destructive">{u.blocked}</Badge> : 0}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><Progress value={u.pct} className="flex-1" /><span className="text-xs">{u.pct}%</span></div></TableCell>
                    </TableRow>
                  ))}
                  {perUser.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No tasks yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader><CardTitle className="text-base">All Tasks ({tasks.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map(t => (
                    <TableRow key={t.id}>
                      <TableCell><p className="font-medium text-sm">{t.title}</p><p className="text-xs text-muted-foreground">{t.description}</p></TableCell>
                      <TableCell className="text-sm">{nameOf(t.assigned_to)}</TableCell>
                      <TableCell><Badge variant="outline">{(t.task_status || (t.completed ? "completed" : "pending")).replace("_", " ")}</Badge></TableCell>
                      <TableCell className="text-sm">{t.due_date || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs">{t.employee_remarks || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
