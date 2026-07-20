import { Navigate } from "react-router-dom";
import { useHasRole, AppRole } from "@/hooks/useAdmin";
import { Loader2 } from "lucide-react";
import { useUserRoles } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";

interface RoleGuardProps {
  allowed: AppRole[];
  children: React.ReactNode;
  fallback?: string;
}

// Owner emails that always get admin access even if DB roles are wrong
const OWNER_EMAILS = ["sultanwellness.owner@gmail.com", "banegabrand.owner@gmail.com"];

export function RoleGuard({ allowed, children, fallback = "/" }: RoleGuardProps) {
  const { data: roles, isLoading } = useUserRoles();
  const { data: hasAccess } = useHasRole(...allowed);
  const { user } = useAuth();

  const isOwnerByEmail = user?.email ? OWNER_EMAILS.includes(user.email.toLowerCase()) : false;
  const isAllowed = hasAccess || isOwnerByEmail;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!roles || !isAllowed) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
