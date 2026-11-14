import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { useCrmQuery } from "@/hooks/useCrm";
import { useIsOwnerOrAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { 
  IndianRupee, Users, Handshake, TrendingUp, Phone, Mail, 
  Calendar, FileText, Loader2, PhoneCall, CheckCircle2, Clock, 
  UserPlus, ArrowRight, ShieldCheck, Zap 
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
const activityIcons: Record<string, any> = { call: Phone, email: Mail, meeting: Calendar, task: FileText, note: FileText };
const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

interface DbDeal { 
  id: string; title: string; company: string | null; value: number | null; 
  stage: string; probability: number | null; contact_name: string | null; 
  expected_close: string | null; created_at: string; 
}
interface DbActivity { 
  id: string; type: string; title: string; description: string | null; 
  contact_name: string | null; due_date: string | null; completed: boolean | null; 
  assigned_to: string | null; created_at: string; 
}
interface DbLead { 
  id: string; name: string; status: string; stage?: string; value: number | null; 
  assigned_to: string | null; call_status?: string | null; next_call_date?: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: isOwnerOrAdmin, isLoading: roleLoading } = useIsOwnerOrAdmin();
  const { data: deals = [], isLoading: dl } = useCrmQuery<DbDeal>("deals");
  const { data: activities = [], isLoading: al } = useCrmQuery<DbActivity>("activities");
  const { data: leads = [], isLoading: ll } = useCrmQuery<DbLead>("leads");

  if (dl || al || ll || roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter for employee view if not admin
  const userLeads = isOwnerOrAdmin 
    ? leads 
    : leads.filter(l => l.assigned_to === user?.id);

  const pendingCalls = userLeads.filter(l => 
    !l.call_status || l.call_status === "pending" || l.call_status === "ringing"
  ).length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const followupsToday = userLeads.filter(l => 
    l.next_call_date && l.next_call_date.startsWith(todayStr)
  ).length;

  const convertedLeads = userLeads.filter(l => 
    l.stage === "Converted" || l.call_status === "order_confirmed" || l.call_status === "converted"
  ).length;

  const totalPipeline = deals
    .filter(d => !["closed_won", "closed_lost"].includes(d.stage))
    .reduce((s, d) => s + (d.value || 0), 0);

  const wonDeals = deals
    .filter(d => d.stage === "closed_won")
    .reduce((s, d) => s + (d.value || 0), 0);

  const todayActivities = activities.filter(a => a.due_date === todayStr);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-indigo-500/10 p-5 rounded-xl border border-primary/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sultan CRM Dashboard</h1>
            <Badge variant={isOwnerOrAdmin ? "default" : "secondary"}>
              {isOwnerOrAdmin ? "Admin Control" : "Telecaller"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {isOwnerOrAdmin 
              ? "Full company lead distribution, caller analytics, and revenue metrics" 
              : "Your dedicated telecalling workspace — start making calls and update lead outcomes"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/leads">
            <Button className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm">
              <PhoneCall className="mr-2 h-4 w-4" />
              {isOwnerOrAdmin ? "Manage All Leads" : "Start Calling Leads"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          {isOwnerOrAdmin && (
            <Link to="/admin/users">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Team Staff
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={isOwnerOrAdmin ? "Total Leads" : "My Assigned Leads"} 
          value={String(userLeads.length)} 
          icon={Users} 
        />
        <StatCard 
          title="Calls Pending" 
          value={String(pendingCalls)} 
          icon={Phone} 
        />
        <StatCard 
          title="Today's Follow-ups" 
          value={String(followupsToday)} 
          icon={Clock} 
        />
        <StatCard 
          title="Conversions" 
          value={String(convertedLeads)} 
          icon={CheckCircle2} 
        />
      </div>

      {/* Employee Quick Calling Prompt */}
      {!isOwnerOrAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold flex items-center justify-center sm:justify-start gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Ready to dial your leads?
              </h3>
              <p className="text-sm text-muted-foreground">
                You have <span className="font-semibold text-foreground">{pendingCalls} pending leads</span> waiting in your calling queue. Click below to launch the auto-dialer or view your lead list.
              </p>
            </div>
            <Link to="/leads">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-md">
                <PhoneCall className="mr-2 h-5 w-5" /> Open My Calling Queue
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Admin Sales & Pipeline Overview */}
      {isOwnerOrAdmin && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Revenue & Pipeline</span>
                <Badge variant="outline">{formatCurrency(totalPipeline)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Open Deals Pipeline</span>
                <span className="font-semibold">{formatCurrency(totalPipeline)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Closed Won Revenue</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(wonDeals)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Unassigned Leads Pool</span>
                <span className="font-semibold text-amber-600">
                  {leads.filter(l => !l.assigned_to).length} Leads
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Admin Actions</CardTitle>
              <CardDescription>Direct shortcuts for team management</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link to="/admin/users">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <span className="text-xs font-semibold">Add Employee ID</span>
                </Button>
              </Link>
              <Link to="/leads">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1">
                  <PhoneCall className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs font-semibold">Upload & Assign Leads</span>
                </Button>
              </Link>
              <Link to="/admin/attendance">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-semibold">Team Attendance</span>
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1">
                  <ShieldCheck className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-semibold">System Analytics</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Activities */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Today's Activities</span>
              <Badge variant="outline">{todayActivities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayActivities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No tasks scheduled for today. Check your leads queue for calls.
              </p>
            )}
            {todayActivities.map(act => {
              const Icon = activityIcons[act.type] || FileText;
              return (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{act.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{act.description}</p>
                  </div>
                  <Badge variant={act.completed ? "secondary" : "outline"} className="shrink-0 text-xs">
                    {act.completed ? "Done" : "Pending"}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Calling / Leads Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userLeads.slice(0, 5).map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Call: {lead.call_status || "Pending"} • Stage: {lead.stage || "New"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge 
                    variant={lead.stage === "Converted" ? "default" : lead.stage === "Lost" ? "destructive" : "outline"} 
                    className="text-xs"
                  >
                    {lead.stage || "New"}
                  </Badge>
                </div>
              </div>
            ))}
            {userLeads.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No assigned leads found. Contact Admin to receive fresh leads.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
