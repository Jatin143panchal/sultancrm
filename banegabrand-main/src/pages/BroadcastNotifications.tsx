import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHasRole } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

interface Employee { user_id: string; display_name: string | null; avatar_url: string | null; }

export default function BroadcastNotifications() {
  const { user } = useAuth();
  const canSend = useHasRole("owner", "admin", "hr_manager");
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [sending, setSending] = useState(false);
  const [broadcastAll, setBroadcastAll] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("user_id, display_name, avatar_url").then(({ data }) => {
      setEmployees((data ?? []).filter((p) => p.user_id !== user?.id));
    });
  }, [user?.id]);

  if (!canSend) return <Navigate to="/" replace />;

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const send = async () => {
    if (!title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    const recipients = broadcastAll ? employees.map((e) => e.user_id) : Array.from(selected);
    if (recipients.length === 0) { toast({ title: "Select at least one recipient", variant: "destructive" }); return; }
    setSending(true);
    const rows = recipients.map((uid) => ({ user_id: uid, title, message: message || null, type }));
    const { error } = await supabase.from("notifications").insert(rows);
    setSending(false);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: `Sent to ${recipients.length} ${recipients.length === 1 ? "person" : "people"}` });
      setTitle(""); setMessage(""); setSelected(new Set());
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Send Notifications</h1>
          <p className="text-sm text-muted-foreground">Broadcast announcements to your team</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Compose</CardTitle><CardDescription>Notification details</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Team meeting at 3 PM" /></div>
            <div className="grid gap-2"><Label>Message</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} /></div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <select className="border rounded-md px-3 py-2 bg-background" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="all" checked={broadcastAll} onCheckedChange={(v) => setBroadcastAll(!!v)} />
              <Label htmlFor="all" className="cursor-pointer">Send to all employees</Label>
            </div>
            <Button onClick={send} disabled={sending} className="w-full">
              <Send className="h-4 w-4 mr-2" /> {sending ? "Sending..." : "Send Notification"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recipients ({broadcastAll ? employees.length : selected.size})</CardTitle>
            <CardDescription>{broadcastAll ? "All employees will receive this" : "Pick specific employees"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[420px] overflow-y-auto">
            {employees.map((e) => {
              const initials = (e.display_name || "U").slice(0, 2).toUpperCase();
              const isSel = broadcastAll || selected.has(e.user_id);
              return (
                <div key={e.user_id} className={`flex items-center gap-3 p-2 rounded-lg border ${isSel ? "bg-accent/40" : ""} ${broadcastAll ? "opacity-70" : "cursor-pointer"}`} onClick={() => !broadcastAll && toggle(e.user_id)}>
                  {!broadcastAll && <Checkbox checked={selected.has(e.user_id)} />}
                  <Avatar className="h-9 w-9">
                    {e.avatar_url && <AvatarImage src={e.avatar_url} />}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.display_name || "Unnamed"}</div>
                  </div>
                </div>
              );
            })}
            {employees.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No employees found</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
