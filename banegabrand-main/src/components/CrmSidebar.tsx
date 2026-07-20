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
import { useHasRole } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
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

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Lead Dashboard", url: "/leads/dashboard", icon: Phone },
  { title: "Leads", url: "/leads", icon: UserPlus },
  { title: "Deals", url: "/deals", icon: Handshake },
  { title: "Attendance", url: "/attendance", icon: Clock },
  { title: "My Tasks", url: "/my-tasks", icon: ListTodo },
  { title: "Projects", url: "/projects", icon: Briefcase },
];

// Admin items - includes Team Roles
const fullAdminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "All Users", url: "/admin/users", icon: Users },
  { title: "Task Assignment", url: "/admin/tasks", icon: ClipboardList },
  { title: "Team Roles", url: "/admin/roles", icon: UserCog }, // This is here
  { title: "Team Attendance", url: "/admin/attendance", icon: Users2 },
  { title: "Team Task Report", url: "/team-tasks", icon: BarChart2 },
  { title: "Send Notifications", url: "/admin/notifications", icon: MegaphoneIcon },
  { title: "Employee Directory", url: "/admin/employees", icon: Users },
];

const settingsItems = [
  { title: "My Profile", url: "/profile", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

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
  
  const { data: isOwner } = useHasRole("owner");
  const { user } = useAuth();
  const isOwnerByEmail = user?.email ? ["sultanwellness.owner@gmail.com", "banegabrand.owner@gmail.com"].includes(user.email.toLowerCase()) : false;
  const showAdmin = isOwner || isOwnerByEmail;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-accent-foreground">Sultan Wellness Private Limited</span>

              <span className="text-xs text-sidebar-foreground/60">Sales CRM</span>
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
