import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Tables = "leads" | "contacts" | "deals" | "activities";

export function useCrmQuery<T>(table: Tables) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [table, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as T[];
    },
    enabled: !!user,
  });
}

export function useCrmInsert<T extends Record<string, unknown>>(table: Tables) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (item: Omit<T, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from(table).insert({ ...item, user_id: user!.id } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [table] }),
  });
}

export function useCrmUpdate<T extends Record<string, unknown>>(table: Tables) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<T>) => {
      const { data, error } = await supabase.from(table).update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [table] }),
  });
}

export function useCrmDelete(table: Tables) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [table] }),
  });
}
