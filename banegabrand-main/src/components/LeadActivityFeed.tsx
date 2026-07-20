import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllProfiles } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  lead_id: string;
  user_id: string;
  action: string;
  details: string | null;
  created_at: string;
}

interface Lead { id: string; name: string; }

const actionLabels: Record<string, string> = {
  viewed: "Viewed lead",
  called: "Clicked call",
  emailed: "Clicked email",
  whatsapp: "Opened WhatsApp",
  updated: "Updated lead",
  note: "Added note",
};

export default function LeadActivityFeed() {
  const { data: profiles = [] } = useAllProfiles();
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["lead_activity_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ActivityLog[];
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, name");
      if (error) throw error;
      return data as Lead[];
    },
  });

  const nameOf = (uid: string) =>
    (profiles as { user_id: string; display_name: string | null }[]).find((p) => p.user_id === uid)?.display_name || "Unknown";
  const leadName = (id: string) => leads.find((l) => l.id === id)?.name || "Lead";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Employee CRM Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {logs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No CRM activity yet. Employees will appear here when they view or interact with leads.
          </p>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50">
            <div className="min-w-0">
              <p className="text-sm font-medium">{nameOf(log.user_id)}</p>
              <p className="text-xs text-muted-foreground">
                {actionLabels[log.action] || log.action} — <span className="font-medium">{leadName(log.lead_id)}</span>
              </p>
              {log.details && <p className="text-xs text-muted-foreground mt-1 truncate">{log.details}</p>}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="outline" className="text-xs">{log.action}</Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
