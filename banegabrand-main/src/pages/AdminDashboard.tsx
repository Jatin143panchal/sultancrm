import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/StatCard";
import { useAdminQuery, useAllProfiles } from "@/hooks/useAdmin";
import { Users, Handshake, TrendingUp, IndianRupee, Target, Ban, CheckCircle2, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import LeadActivityFeed from "@/components/LeadActivityFeed";

const COLORS = ["hsl(210, 90%, 45%)", "hsl(170, 60%, 42%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(280, 60%, 50%)"];

const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

interface Lead {
  id: string;
  name: string;
  status: string;
  value: number | null;
  business_status: string | null;
  assigned_to: string | null;
}

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number | null;
  progress: number | null;
}

interface Activity {
  id: string;
  title: string;
  completed: boolean | null;
  task_status: string | null;
  assigned_to: string | null;
  due_date: string | null;
  employee_remarks: string | null;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
}

export default function AdminDashboard() {
  const { data: leads = [], isLoading: ll } = useAdminQuery<Lead>("leads");
  const { data: deals = [], isLoading: dl } = useAdminQuery<Deal>("deals");
  const { data: activities = [], isLoading: al } = useAdminQuery<Activity>("activities");
  const { data: profiles = [], isLoading: pl } = useAllProfiles();

  if (ll || dl || al || pl) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPipeline = deals
    .filter(d => !["closed_won", "closed_lost"].includes(d.stage))
    .reduce((s, d) => s + (d.value || 0), 0);

  const wonRevenue = deals
    .filter(d => d.stage === "closed_won")
    .reduce((s, d) => s + (d.value || 0), 0);

  const noGoLeads = leads.filter(l => l.business_status === "no-go").length;
  const doneLeads = leads.filter(l => l.business_status === "done").length;
  const totalActivities = activities.length;

  const getTaskStatus = (a: Activity) => {
    return a.task_status || (a.completed ? "completed" : "pending");
  };

  const completedActivities = activities.filter(a => getTaskStatus(a) === "completed").length;
  const workPercentage = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
  const assignedLeads = leads.filter(l => l.assigned_to).length;

  const getProfileName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const p = (profiles as Profile[]).find(p => p.user_id === userId);
    return p?.display_name || "Unknown";
  };

  const businessStatusData = [
    { 
      name: "Active", 
      value: leads.filter(l => !l.business_status || l.business_status === "active").length 
    },
    { name: "No-Go", value: noGoLeads },
    { name: "Done", value: doneLeads },
  ].filter(d => d.value > 0);

  const userStats = (profiles as Profile[])
    .map(p => {
      const userActs = activities.filter(a => a.assigned_to === p.user_id);
      const completed = userActs.filter(a => getTaskStatus(a) === "completed").length;
      const total = userActs.length;
      return {
        name: p.display_name || "Unknown",
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    })
    .filter(u => u.total > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overall business overview for BanegaBrand</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard 
          title="Total Pipeline" 
          value={formatCurrency(totalPipeline)} 
          icon={IndianRupee} 
        />
        <StatCard 
          title="Revenue Won" 
          value={formatCurrency(wonRevenue)} 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Team Members" 
          value={String(profiles.length)} 
          icon={Users} 
        />
        <StatCard 
          title="Leads Assigned" 
          value={`${assignedLeads}/${leads.length}`} 
          icon={Target} 
        />
        <StatCard 
          title="Open Deals" 
          value={String(deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage)).length)} 
          icon={Handshake} 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Work Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tasks completed: {completedActivities} / {totalActivities}
              </span>
              <span className="font-semibold">{workPercentage}%</span>
            </div>
            <Progress value={workPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Business Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">
                  {leads.filter(l => !l.business_status || l.business_status === "active").length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Ban className="h-5 w-5 mx-auto mb-1 text-destructive" />
                <p className="text-lg font-bold">{noGoLeads}</p>
                <p className="text-xs text-muted-foreground">No-Go</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{doneLeads}</p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
            </div>
            {businessStatusData.length > 0 && (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={businessStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                  >
                    {businessStatusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Work Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userStats.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No assigned tasks yet
              </p>
            )}
            {userStats.map(u => (
              <div key={u.name} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{u.name}</span>
                  <span className="text-muted-foreground">
                    {u.completed}/{u.total} ({u.percentage}%)
                  </span>
                </div>
                <Progress value={u.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Leads Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {leads.slice(0, 10).map(lead => (
            <div
              key={lead.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div>
                <p className="text-sm font-medium">{lead.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(lead.value || 0)} · {getProfileName(lead.assigned_to)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    lead.status === "qualified"
                      ? "default"
                      : lead.status === "lost"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {lead.status}
                </Badge>
                <Badge
                  variant={
                    lead.business_status === "no-go"
                      ? "destructive"
                      : lead.business_status === "done"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {lead.business_status || "active"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <LeadActivityFeed />
    </div>
  );
}
