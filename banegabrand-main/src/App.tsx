import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CrmLayout } from "@/components/CrmLayout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadDashboard from "./pages/LeadDashboard";
import Deals from "./pages/Deals";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import TaskAssignment from "./pages/TaskAssignment";
import TeamRoles from "./pages/TeamRoles";

import Profile from "./pages/Profile";
import Attendance from "./pages/Attendance";
import MyTasks from "./pages/MyTasks";
import TeamTaskReport from "./pages/TeamTaskReport";
import BroadcastNotifications from "./pages/BroadcastNotifications";
import EmployeeDirectory from "./pages/EmployeeDirectory";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import AllUsers from "./pages/AllUsers";
import { RoleGuard } from "@/components/RoleGuard";
import Projects from "./pages/Projects";
import TeamAttendance from "./pages/TeamAttendance";

const queryClient = new QueryClient();

const fullAccessRoles = ["owner"] as const;
const managerRoles = ["owner"] as const;
const hrRoles = ["owner"] as const;

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Landing />;

  return (
    <CrmLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        
        <Route path="/leads/dashboard" element={<LeadDashboard />} />
        <Route path="/deals" element={<Deals />} />
        
        <Route path="/projects" element={<Projects />} />
        
        <Route path="/profile" element={<Profile />} />
        
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/team-tasks" element={<RoleGuard allowed={[...managerRoles]}><TeamTaskReport /></RoleGuard>} />
        
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<RoleGuard allowed={[...fullAccessRoles]}><AdminDashboard /></RoleGuard>} />
        <Route path="/admin/tasks" element={<RoleGuard allowed={[...managerRoles]}><TaskAssignment /></RoleGuard>} />
        <Route path="/admin/users" element={<RoleGuard allowed={[...fullAccessRoles]}><AllUsers /></RoleGuard>} />
        <Route path="/admin/roles" element={<RoleGuard allowed={[...fullAccessRoles]}><TeamRoles /></RoleGuard>} />
        <Route path="/admin/attendance" element={<RoleGuard allowed={[...hrRoles]}><TeamAttendance/></RoleGuard>} />
       
        <Route path="/admin/notifications" element={<RoleGuard allowed={[...hrRoles]}><BroadcastNotifications /></RoleGuard>} />
        <Route path="/admin/employees" element={<RoleGuard allowed={[...hrRoles]}><EmployeeDirectory /></RoleGuard>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </CrmLayout>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
