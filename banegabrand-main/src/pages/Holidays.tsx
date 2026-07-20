import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, CalendarDays, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Holiday {
  id: string;
  title: string;
  date: string;
  type: string;
  description: string | null;
  created_at: string;
}

const typeColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  public: "default",
  company: "secondary",
  optional: "outline",
  restricted: "destructive",
};

export default function Holidays() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", type: "public", description: "" });

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const { data, error } = await supabase.from("holidays").select("*").order("date", { ascending: true });
      if (error) throw error;
      return data as Holiday[];
    },
    enabled: !!user,
  });

  const addHoliday = useMutation({
    mutationFn: async (holiday: Omit<Holiday, "id" | "created_at">) => {
      const { error } = await supabase.from("holidays").insert({ ...holiday, created_by: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holidays"] }),
  });

  const deleteHoliday = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("holidays").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holidays"] }),
  });

  const handleAdd = async () => {
    if (!form.title || !form.date) return;
    await addHoliday.mutateAsync({ title: form.title, date: form.date, type: form.type, description: form.description || null });
    setForm({ title: "", date: "", type: "public", description: "" });
    setDialogOpen(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const upcoming = holidays.filter(h => h.date >= new Date().toISOString().slice(0, 10));
  const past = holidays.filter(h => h.date < new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holidays</h1>
          <p className="text-muted-foreground">Company holiday calendar</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Holiday</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Holiday name" /></div>
                <div className="grid gap-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public Holiday</SelectItem>
                      <SelectItem value="company">Company Holiday</SelectItem>
                      <SelectItem value="optional">Optional Holiday</SelectItem>
                      <SelectItem value="restricted">Restricted Holiday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" /></div>
                <Button onClick={handleAdd} disabled={addHoliday.isPending}>{addHoliday.isPending ? "Adding..." : "Add Holiday"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Upcoming Holidays ({upcoming.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No upcoming holidays</p>}
          {upcoming.map(h => (
            <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(h.date), "EEEE, MMMM d, yyyy")}</p>
                  {h.description && <p className="text-xs text-muted-foreground mt-0.5">{h.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={typeColors[h.type] || "outline"}>{h.type}</Badge>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => deleteHoliday.mutate(h.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Past Holidays ({past.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {past.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 opacity-60">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{h.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(h.date), "MMM d, yyyy")}</p>
                  </div>
                </div>
                <Badge variant={typeColors[h.type] || "outline"}>{h.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
