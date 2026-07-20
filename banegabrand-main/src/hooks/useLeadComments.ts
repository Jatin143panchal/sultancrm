import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logLeadActivity } from "@/hooks/useLeadActivity";

export interface LeadComment {
  id: string;
  lead_id: string;
  user_id: string;
  comment: string;
  call_outcome: string | null;
  next_call_date: string | null;
  created_at: string;
}

export function useLeadComments(leadId: string | null) {
  return useQuery({
    queryKey: ["lead_comments", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_comments")
        .select("*")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LeadComment[];
    },
    enabled: !!leadId,
  });
}

export function useAddLeadComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      comment,
      callOutcome,
      nextCallDate,
    }: {
      leadId: string;
      comment: string;
      callOutcome?: string;
      nextCallDate?: string;
    }) => {
      const { data, error } = await supabase
        .from("lead_comments")
        .insert({
          lead_id: leadId,
          user_id: user!.id,
          comment,
          call_outcome: callOutcome || null,
          next_call_date: nextCallDate || null,
        })
        .select()
        .single();
      if (error) throw error;

      if (nextCallDate) {
        await supabase.from("leads").update({ next_call_date: nextCallDate }).eq("id", leadId);
      }

      await logLeadActivity(leadId, user!.id, "note", comment);
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["lead_comments", vars.leadId] });
      queryClient.invalidateQueries({ queryKey: ["crm", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead_activity_log"] });
    },
  });
}

export function useBulkAssignLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadIds, assignedTo }: { leadIds: string[]; assignedTo: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ assigned_to: assignedTo })
        .in("id", leadIds);
      if (error) throw error;
      return leadIds.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
    },
  });
}
