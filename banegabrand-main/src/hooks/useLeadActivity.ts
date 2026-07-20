import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type LeadAction = "viewed" | "called" | "emailed" | "whatsapp" | "updated" | "note";

export async function logLeadActivity(
  leadId: string,
  userId: string,
  action: LeadAction,
  details?: string
) {
  await supabase.from("lead_activity_log").insert({
    lead_id: leadId,
    user_id: userId,
    action,
    details: details || null,
  });
}

export function useLeadActivityLogger() {
  const { user } = useAuth();

  return (leadId: string, action: LeadAction, details?: string) => {
    if (!user) return;
    logLeadActivity(leadId, user.id, action, details).catch(() => {});
  };
}
