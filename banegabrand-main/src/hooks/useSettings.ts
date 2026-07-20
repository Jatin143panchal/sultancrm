import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type SettingsTable = "lead_sources" | "categories" | "expense_heads" | "templates" | "terms_conditions" | "custom_fields" | "services" | "modules" | "email_settings" | "dashboard_columns";

export function useSettingsQuery<T>(table: SettingsTable) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["settings", table, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as T[];
    },
    enabled: !!user,
  });
}

export function useSettingsInsert(table: SettingsTable) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { error } = await supabase.from(table as any).insert({ ...values, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", table] }); toast.success("Added successfully"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSettingsUpdate(table: SettingsTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Record<string, any>) => {
      const { error } = await supabase.from(table as any).update(values as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", table] }); toast.success("Updated successfully"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSettingsDelete(table: SettingsTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings", table] }); toast.success("Deleted successfully"); },
    onError: (e: any) => toast.error(e.message),
  });
}
