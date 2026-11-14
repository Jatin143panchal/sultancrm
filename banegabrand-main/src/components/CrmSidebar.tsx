import {
  LayoutDashboard,
  Users,
  UserPlus,
  Handshake,
  Settings,
  Building2,
  Shield,
  ClipboardList,
  Clock,
  UserCog,
  Users2,
  Phone,
  UserCircle,
  Briefcase,
  ListTodo,
  BarChart2,
  Megaphone as MegaphoneIcon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useIsOwnerOrAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

function SidebarNavGroup({
  label,
  items,
  collapsed,
  isActive,
}: {
  label: string;
  items: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }[];
  collapsed: boolean;
  isActive: (path: string) => boolean;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink 
                  to={item.url} 
                  end 
                  className="hover:bg-sidebar-accent/50" 
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function CrmSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + "/");
  
  const { data: isOwnerOrAdmin } = useIsOwnerOrAdmin();
  const showAdmin = !!isOwnerOrAdmin;
  const { t } = useLanguage();

  const mainItems = [
    { title: t("nav.leads", "Leads"), url: "/leads", icon: UserPlus },
    { title: t("nav.deals", "Deals"), url: "/deals", icon: Handshake },
    { title: t("nav.attendance", "Attendance"), url: "/attendance", icon: Clock },
    { title: t("nav.tasks", "My Tasks"), url: "/my-tasks", icon: ListTodo },
  ];

  const fullAdminItems = [
    { title: t("nav.employees", "Employee Directory"), url: "/admin/employees", icon: Users },
    { title: t("nav.users", "All Users"), url: "/admin/users", icon: Users2 },
    { title: t("nav.task_assign", "Task Assignment"), url: "/admin/tasks", icon: ClipboardList },
    { title: t("nav.roles", "Team Roles"), url: "/admin/roles", icon: UserCog },
    { title: t("nav.team_attendance", "Team Attendance"), url: "/admin/attendance", icon: Clock },
    { title: t("nav.team_report", "Team Task Report"), url: "/team-tasks", icon: BarChart2 },
    { title: t("nav.notifications", "Send Notifications"), url: "/admin/notifications", icon: MegaphoneIcon },
  ];

  const settingsItems = [
    { title: t("nav.profile", "My Profile"), url: "/profile", icon: UserCircle },
    { title: t("nav.settings", "Settings"), url: "/settings", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-accent-foreground">Sultan Wellness Pvt Ltd</span>
              <span className="text-xs text-sidebar-foreground/60">
                {isOwnerOrAdmin ? t("role.admin", "Admin Control") : t("role.caller", "Telecaller Portal")}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="hover:bg-sidebar-accent/50" 
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin section - only shows for owner */}
        {showAdmin && (
          <SidebarNavGroup 
            label="Admin" 
            items={fullAdminItems} 
            collapsed={collapsed} 
            isActive={isActive} 
          />
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {settingsItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink 
                  to={item.url} 
                  end 
                  className="hover:bg-sidebar-accent/50" 
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
