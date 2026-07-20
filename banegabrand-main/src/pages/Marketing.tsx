import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, Users, Target, IndianRupee, Loader2, BarChart3, Mail, MessageSquare, Globe, Megaphone } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: number | null;
  spent: number | null;
  leads_generated: number | null;
  conversions: number | null;
  revenue: number | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  created_at: string;
}

const COLORS = ["hsl(210, 90%, 45%)", "hsl(170, 60%, 42%)", "hsl(38, 92%, 50%)", "hsl(340, 80%, 50%)"];
const typeIcons: Record<string, any> = { email: Mail, sms: MessageSquare, social: Globe, ads: Megaphone };
const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(1)}L`;

export default function Marketing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "email", budget: "", description: "", start_date: "", end_date: "" });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user,
  });

  const insertCampaign = useMutation({
    mutationFn: async (item: typeof form) => {
      const { error } = await supabase.from("campaigns").insert({
        ...item,
        budget: Number(item.budget) || 0,
        user_id: user!.id,
        status: "active",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created");
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign updated");
    },
  });

  const handleAdd = async () => {
    if (!form.name) return;
    await insertCampaign.mutateAsync(form);
    setForm({ name: "", type: "email", budget: "", description: "", start_date: "", end_date: "" });
    setDialogOpen(false);
  };

  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((s, c) => s + (c.spent || 0), 0);
  const totalLeads = campaigns.reduce((s, c) => s + (c.leads_generated || 0), 0);
  const totalConversions = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + (c.revenue || 0), 0);
  const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent * 100).toFixed(1) : "0";

  const typeData = ["email", "sms", "social", "ads"].map(t => ({
    name: t.toUpperCase(),
    leads: campaigns.filter(c => c.type === t).reduce((s, c) => s + (c.leads_generated || 0), 0),
    revenue: campaigns.filter(c => c.type === t).reduce((s, c) => s + (c.revenue || 0), 0),
  })).filter(d => d.leads > 0 || d.revenue > 0);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing 360° Analysis</h1>
          <p className="text-muted-foreground">Campaign ROI & sales boost tracking</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Campaign</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Campaign Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["email", "sms", "social", "ads"].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Budget (₹)</Label><Input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                <div className="grid gap-2"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={handleAdd} disabled={insertCampaign.isPending}>{insertCampaign.isPending ? "Creating..." : "Create Campaign"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ROI Stats inspired by StingoSales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">+{totalLeads}</p>
                <p className="text-xs text-muted-foreground">Leads Generated</p>
                <p className="text-xs font-medium text-green-600">+65% increase target</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{totalConversions}</p>
                <p className="text-xs text-muted-foreground">Conversions</p>
                <p className="text-xs font-medium text-green-600">+45% sales increase</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{roi}%</p>
                <p className="text-xs text-muted-foreground">Campaign ROI</p>
                <p className="text-xs font-medium text-orange-600">-35% operational cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <IndianRupee className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Revenue Generated</p>
                <p className="text-xs font-medium text-purple-600">Budget: {formatCurrency(totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {typeData.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Leads by Channel</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leads" fill="hsl(210, 90%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue by Channel</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="revenue" nameKey="name">
                    {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {typeData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">All Campaigns</CardTitle></CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No campaigns yet. Create your first campaign!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Budget</TableHead>
                  <TableHead className="hidden md:table-cell">Spent</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead className="hidden md:table-cell">Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(c => {
                  const Icon = typeIcons[c.type] || Mail;
                  const spentPct = (c.budget && c.budget > 0) ? Math.min(((c.spent || 0) / c.budget) * 100, 100) : 0;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            {c.start_date && <p className="text-xs text-muted-foreground">{c.start_date}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{c.type}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{formatCurrency(c.budget || 0)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          <p className="text-sm">{formatCurrency(c.spent || 0)}</p>
                          <Progress value={spentPct} className="h-1.5 w-16" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{c.leads_generated || 0}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{formatCurrency(c.revenue || 0)}</TableCell>
                      <TableCell>
                        <Select value={c.status} onValueChange={v => updateCampaign.mutate({ id: c.id, status: v })}>
                          <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["draft", "active", "paused", "completed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
