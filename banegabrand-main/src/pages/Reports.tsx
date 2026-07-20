import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrmQuery } from "@/hooks/useCrm";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

interface DbDeal { id: string; title: string; company: string | null; value: number | null; stage: string; probability: number | null; }
interface DbLead { id: string; name: string; status: string; source: string | null; value: number | null; }

const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

export default function Reports() {
  const { data: deals = [], isLoading: dl } = useCrmQuery<DbDeal>("deals");
  const { data: leads = [], isLoading: ll } = useCrmQuery<DbLead>("leads");

  if (dl || ll) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const sourceData = leads.reduce<Record<string, number>>((acc, l) => { acc[l.source || "Unknown"] = (acc[l.source || "Unknown"] || 0) + 1; return acc; }, {});
  const sourceChartData = Object.entries(sourceData).map(([name, count]) => ({ name, count }));

  const stageData = deals.reduce<Record<string, { count: number; value: number }>>((acc, d) => {
    const label = d.stage.replace("_", " ");
    if (!acc[label]) acc[label] = { count: 0, value: 0 };
    acc[label].count++;
    acc[label].value += d.value || 0;
    return acc;
  }, {});
  const stageChartData = Object.entries(stageData).map(([name, data]) => ({ name, ...data }));

  const closedDeals = deals.filter(d => d.stage.startsWith("closed"));
  const winRate = closedDeals.length > 0 ? ((deals.filter(d => d.stage === "closed_won").length / closedDeals.length) * 100).toFixed(0) : "0";
  const avgDealSize = deals.length > 0 ? formatCurrency(deals.reduce((s, d) => s + (d.value || 0), 0) / deals.length) : "₹0";

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Reports</h1><p className="text-muted-foreground">Sales analytics and insights</p></div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="stat-gradient"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Win Rate</p><p className="text-3xl font-bold">{winRate}%</p></CardContent></Card>
        <Card className="stat-gradient"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Avg Deal Size</p><p className="text-3xl font-bold">{avgDealSize}</p></CardContent></Card>
        <Card className="stat-gradient"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Leads</p><p className="text-3xl font-bold">{leads.length}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sourceChartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Leads by Source</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourceChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(170, 60%, 42%)" radius={[0,4,4,0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {stageChartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Deals by Stage</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stageChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis tickFormatter={v => `${(v/100000).toFixed(0)}L`} fontSize={12} />
                  <Tooltip formatter={(v: number, name: string) => name === "value" ? formatCurrency(v) : v} />
                  <Bar dataKey="value" fill="hsl(210, 90%, 45%)" radius={[4,4,0,0]} name="Value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {sourceChartData.length === 0 && stageChartData.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 lg:col-span-2">Add leads and deals to see analytics here</p>
        )}
      </div>
    </div>
  );
}
