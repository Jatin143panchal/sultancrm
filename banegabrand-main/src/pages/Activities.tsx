import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrmQuery, useCrmInsert, useCrmUpdate } from "@/hooks/useCrm";
import { Plus, Phone, Mail, Calendar, FileText, CheckCircle2, Loader2 } from "lucide-react";

interface DbActivity { id: string; type: string; title: string; description: string | null; contact_name: string | null; due_date: string | null; completed: boolean | null; created_at: string; }

const typeIcons: Record<string, any> = { call: Phone, email: Mail, meeting: Calendar, task: FileText, note: FileText };
const typeLabels: Record<string, string> = { call: "Call", email: "Email", meeting: "Meeting", task: "Task", note: "Note" };

export default function Activities() {
  const { data: activities = [], isLoading } = useCrmQuery<DbActivity>("activities");
  const insertAct = useCrmInsert("activities");
  const updateAct = useCrmUpdate("activities");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: "call", title: "", description: "", contact_name: "", due_date: "" });

  const toggleComplete = (act: DbActivity) => {
    updateAct.mutate({ id: act.id, completed: !act.completed } as any);
  };

  const handleAdd = async () => {
    if (!form.title) return;
    await insertAct.mutateAsync({
      type: form.type as any, title: form.title, description: form.description,
      contact_name: form.contact_name, due_date: form.due_date || null, completed: false,
    });
    setForm({ type: "call", title: "", description: "", contact_name: "", due_date: "" });
    setDialogOpen(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const renderList = (items: DbActivity[]) => (
    <div className="space-y-2">
      {items.map(act => {
        const Icon = typeIcons[act.type] || FileText;
        return (
          <Card key={act.id} className={act.completed ? "opacity-60" : ""}>
            <CardContent className="p-4 flex items-start gap-3">
              <Checkbox checked={act.completed || false} onCheckedChange={() => toggleComplete(act)} className="mt-1" />
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${act.completed ? "line-through" : ""}`}>{act.title}</p>
                  <Badge variant="outline" className="text-xs">{typeLabels[act.type] || act.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {act.contact_name && <span>{act.contact_name}</span>}
                  {act.due_date && <span>{act.due_date}</span>}
                </div>
              </div>
              {act.completed && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
            </CardContent>
          </Card>
        );
      })}
      {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No activities found</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Activities</h1><p className="text-muted-foreground">Track calls, emails, meetings and tasks</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Activity</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Activity</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["call","email","meeting","task","note"].map(t => <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Contact Name</Label><Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
              <Button onClick={handleAdd} disabled={insertAct.isPending} className="mt-2">{insertAct.isPending ? "Adding..." : "Add Activity"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderList(activities)}</TabsContent>
        <TabsContent value="pending" className="mt-4">{renderList(activities.filter(a => !a.completed))}</TabsContent>
        <TabsContent value="completed" className="mt-4">{renderList(activities.filter(a => a.completed))}</TabsContent>
      </Tabs>
    </div>
  );
}
