import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CrmSidebar } from "@/components/CrmSidebar";
import { NotificationsBell } from "@/components/NotificationsBell";
import { Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface CrmLayoutProps { children: React.ReactNode; }

export function CrmLayout({ children }: CrmLayoutProps) {
  const { user, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setAvatarUrl(data.avatar_url); setName(data.display_name ?? ""); }
    });
    const ch = supabase
      .channel(`profile-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` }, (payload: any) => {
        setAvatarUrl(payload.new.avatar_url);
        setName(payload.new.display_name ?? "");
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const initials = (name || user?.email || "OG").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CrmSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search CRM..." className="pl-9 w-64 h-9 bg-muted/50 border-0" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationsBell />
              <Link to="/profile" title="My Profile">
                <Avatar className="h-8 w-8 cursor-pointer">
                  {avatarUrl && <AvatarImage src={avatarUrl} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
