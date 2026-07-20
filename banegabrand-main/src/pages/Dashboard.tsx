import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { useCrmQuery } from "@/hooks/useCrm";
import { IndianRupee, Users, Handshake, TrendingUp, Phone, Mail, Calendar, FileText, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(210, 90%, 45%)", "hsl(170, 60%, 42%)", "hsl(38, 92%, 50%)", "hsl(150, 60%, 40%)", "hsl(0, 72%, 51%)"];
const activityIcons: Record<string, any> = { call: Phone, email: Mail, meeting: Calendar, task: FileText, note: FileText };
const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

interface DbDeal { id: string; title: string; company: string | null; value: number | null; stage: string; probability: number | null; contact_name: string | null; expected_close: string | null; created_at: string; }
interface DbActivity { id: string; type: string; title: string; description: string | null; contact_name: string | null; due_date: string | null; completed: boolean | null; created_at: string; }
interface DbLead { id: string; name: string; status: string; value: number | null; }

export default function Dashboard() {
  const { data: deals = [], isLoading: dl } = useCrmQuery<DbDeal>("deals");
  const { data: activities = [], isLoading: al } = useCrmQuery<DbActivity>("activities");
  const { data: leads = [], isLoading: ll } = useCrmQuery<DbLead>("leads");

  if (dl || al || ll) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const openDeals = deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage));
  const totalPipeline = openDeals.reduce((s, d) => s + (d.value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === "closed_won").reduce((s, d) => s + (d.value || 0), 0);
  const activeLeads = leads.filter(l => l.status !== "lost").length;
  const today = new Date().toISOString().slice(0, 10);
  const todayActivities = activities.filter(a => a.due_date === today);

  const pipelineData = [
    { name: "Prospecting", value: deals.filter(d => d.stage === "prospecting").reduce((s, d) => s + (d.value || 0), 0) },
    { name: "Proposal", value: deals.filter(d => d.stage === "proposal").reduce((s, d) => s + (d.value || 0), 0) },
    { name: "Negotiation", value: deals.filter(d => d.stage === "negotiation").reduce((s, d) => s + (d.value || 0), 0) },
    { name: "Won", value: deals.filter(d => d.stage === "closed_won").reduce((s, d) => s + (d.value || 0), 0) },
    { name: "Lost", value: deals.filter(d => d.stage === "closed_lost").reduce((s, d) => s + (d.value || 0), 0) },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
<p className="text-muted-foreground">Welcome back to Sultan Wellness CRM</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Pipeline" value={formatCurrency(totalPipeline)} icon={IndianRupee} />
        <StatCard title="Revenue Won" value={formatCurrency(wonDeals)} icon={TrendingUp} />
        <StatCard title="Active Leads" value={String(activeLeads)} icon={Users} />
        <StatCard title="Open Deals" value={String(openDeals.length)} icon={Handshake} />
      </div>

      {pipelineData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Pipeline by Stage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" nameKey="name">
                  {pipelineData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pipelineData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Today's Activities ({todayActivities.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {todayActivities.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No activities scheduled for today</p>}
            {todayActivities.map(act => {
              const Icon = activityIcons[act.type] || FileText;
              return (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{act.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{act.description}</p>
                  </div>
                  <Badge variant={act.completed ? "secondary" : "outline"} className="shrink-0 text-xs">{act.completed ? "Done" : "Pending"}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Deals</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {deals.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No deals yet. Create your first deal!</p>}
            {deals.slice(0, 5).map(deal => (
              <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{deal.title}</p>
                  <p className="text-xs text-muted-foreground">{deal.company}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{formatCurrency(deal.value || 0)}</p>
                  <Badge variant={deal.stage === "closed_won" ? "default" : deal.stage === "closed_lost" ? "destructive" : "outline"} className="text-xs">
                    {deal.stage.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
