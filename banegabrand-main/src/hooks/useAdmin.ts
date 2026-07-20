// hooks/useAdmin.ts

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "owner" | "admin" | "hr_manager" | "tl" | "employee" | "user";

export function useUserRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
    enabled: !!user,
    initialData: [],
  });
}

export function useIsAdmin() {
  const { data: roles = [], isLoading } = useUserRoles();
  return {
    data: roles.some((r) => r === "admin" || r === "owner"),
    isLoading,
  };
}

/** Owner or Admin — full CRM admin access */
export function useIsOwnerOrAdmin() {
  const { data: roles = [], isLoading } = useUserRoles();
  return {
    data: roles.some((r) => r === "owner" || r === "admin"),
    isLoading,
  };
}

/** Team Lead / Manager — assign & monitor tasks, not full admin */
export function useIsManager() {
  const { data: roles = [], isLoading } = useUserRoles();
  return {
    data: roles.some((r) => r === "tl"),
    isLoading,
  };
}

/** Can assign tasks/leads to employees */
export function useCanAssignTasks() {
  const { data: roles = [], isLoading } = useUserRoles();
  return {
    data: roles.some((r) => r === "owner" || r === "admin" || r === "tl"),
    isLoading,
  };
}

export function useHasRole(...allowed: AppRole[]) {
  const { data: roles = [], isLoading } = useUserRoles();
  return {
    data: roles.some((r) => allowed.includes(r)),
    isLoading,
  };
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ["all_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminQuery<T>(
  table: "leads" | "contacts" | "deals" | "activities" | "holidays" | "profiles" | "attendance"
) {
  return useQuery({
    queryKey: ["admin", table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as T[];
    },
  });
}
