import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useCrmQuery } from "@/hooks/useCrm";
import { useAllProfiles, useCanAssignTasks, useIsOwnerOrAdmin, useIsManager } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useBulkAssignLeads } from "@/hooks/useLeadComments";
import { useLeadActivityLogger } from "@/hooks/useLeadActivity";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Phone, Calendar, Sparkles, UserCheck, Clock, Loader2,
  Users, MessageSquare, CheckSquare, AlertCircle, X, Search,
  PieChart, TrendingUp, Flame, Snowflake, Sun, BarChart3
} from "lucide-react";
import { format, isToday, isPast, startOfDay, subDays } from "date-fns";
import { toast } from "sonner";
import { formatStageLabel } from "@/lib/leadStages";
import LeadCommentsPanel from "@/components/LeadCommentsPanel";
import LeadActivityFeed from "@/components/LeadActivityFeed";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

// ── Constants ──────────────────────────────────────────────────────────────
const LEAD_STAGES = [
  { value: "new",       label: "New",       color: "#3b82f6", bg: "#eff6ff", icon: "✨" },
  { value: "ringing",   label: "Ringing",   color: "#f97316", bg: "#fff7ed", icon: "📞" },
  { value: "callback",  label: "Callback",  color: "#3b82f6", bg: "#eff6ff", icon: "🔔" },
  { value: "dp",        label: "DP",        color: "#8b5cf6", bg: "#f5f3ff", icon: "📋" },
  { value: "vms",       label: "VMS",       color: "#06b6d4", bg: "#ecfeff", icon: "🎙" },
  { value: "pg",        label: "PG",        color: "#ec4899", bg: "#fdf2f8", icon: "👥" },
  { value: "converted", label: "Converted", color: "#10b981", bg: "#ecfdf5", icon: "✅" },
  { value: "lost",      label: "Lost",      color: "#ef4444", bg: "#fef2f2", icon: "❌" },
];

const LEAD_STATUSES = [
  { value: "Ringing",            label: "Ringing"           },
  { value: "Callback",           label: "Callback"          },
  { value: "DP",                 label: "DP"                },
  { value: "VMS",                label: "VMS"               },
  { value: "PG",                 label: "PG"                },
  { value: "Converted",          label: "Converted"         },
  { value: "Lost",               label: "Lost"              },
  { value: "Meeting Booked",     label: "Meeting Booked"    },
  { value: "Business Generated", label: "Business Generated"},
];

const LEAD_TEMPERATURE = [
  { value: "hot",   label: "Hot",   color: "#ef4444", bg: "#fef2f2", icon: "🔥" },
  { value: "warm",  label: "Warm",  color: "#f97316", bg: "#fff7ed", icon: "☀️" },
  { value: "cold",  label: "Cold",  color: "#3b82f6", bg: "#eff6ff", icon: "❄️" },
];

const AVATAR_COLORS = [
  "#3b82f6","#8b5cf6","#ec4899","#f97316","#10b981","#06b6d4","#f59e0b","#ef4444",
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

// ── Interfaces ──────────────────────────────────────────────────────────────
interface DbLead {
  id: string; name: string; email: string | null; phone: string | null; company: string | null;
  status: string; stage: string | null; sub_stage: string | null; assigned_to: string | null;
  created_at: string; next_call_date: string | null; business_status: string | null;
  cx_comment: string | null; temperature?: string | null;
}

interface Activity {
  id: string; title: string; type: string; assigned_to: string | null;
  due_date: string | null; task_status: string | null; completed: boolean | null;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default", contacted: "outline", answered: "outline", not_answered: "outline",
  qualified: "secondary", converted: "default", lost: "destructive",
};

// ── Chart Components ──
function DashboardCharts({ leads }: { leads: DbLead[] }) {
  // Stage distribution data
  const stageData = useMemo(() => {
    const counts = LEAD_STAGES.map(s => ({
      name: s.label,
      value: leads.filter(l => l.stage === s.value).length,
      color: s.color
    }));
    return counts.filter(d => d.value > 0);
  }, [leads]);

  // Temperature distribution
  const temperatureData = useMemo(() => {
    const counts = LEAD_TEMPERATURE.map(t => ({
      name: t.label,
      value: leads.filter(l => l.temperature === t.value).length,
      color: t.color,
      icon: t.icon
    }));
    return counts.filter(d => d.value > 0);
  }, [leads]);

  // Conversion status
  const conversionData = useMemo(() => {
    const converted = leads.filter(l => l.stage === "converted").length;
    const lost = leads.filter(l => l.stage === "lost").length;
    const active = leads.filter(l => l.stage !== "converted" && l.stage !== "lost").length;
    return [
      { name: "Active", value: active, color: "#3b82f6" },
      { name: "Converted", value: converted, color: "#10b981" },
      { name: "Lost", value: lost, color: "#ef4444" }
    ].filter(d => d.value > 0);
  }, [leads]);

  // Weekly trend
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const count = leads.filter(l => {
        const created = new Date(l.created_at);
        return created.toDateString() === d.toDateString();
      }).length;
      data.push({
        date: format(d, "dd MMM"),
        leads: count
      });
    }
    return data;
  }, [leads]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#f59e0b', '#ef4444'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Stage Distribution - Bar Chart */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Stage Distribution</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value">
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Temperature - Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Temperature</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={temperatureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {temperatureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Conversion - Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Conversion</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {conversionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend - Line Chart */}
      <Card className="col-span-1 lg:col-span-4">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Weekly Lead Trend</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Employee Filter Section ──────────────────────────────────────────────────
function EmployeeFilterSection({ 
  profiles, 
  leads, 
  onSelectEmployee, 
  selectedEmployee,
  onSelectStage,
  selectedStage,
  onSelectStatus,
  selectedStatus
}: {
  profiles: { user_id: string; display_name: string | null }[];
  leads: DbLead[];
  onSelectEmployee: (userId: string | null) => void;
  selectedEmployee: string | null;
  onSelectStage: (stage: string | null) => void;
  selectedStage: string | null;
  onSelectStatus: (status: string | null) => void;
  selectedStatus: string | null;
}) {
  const [searchEmployee, setSearchEmployee] = useState("");
  
  const filteredProfiles = profiles.filter(p => 
    (p.display_name || "").toLowerCase().includes(searchEmployee.toLowerCase())
  );
  
  const employeeStats = filteredProfiles.map(p => {
    const empLeads = leads.filter(l => l.assigned_to === p.user_id);
    const stageCounts = LEAD_STAGES.map(s => ({
      ...s,
      count: empLeads.filter(l => l.stage === s.value).length
    }));
    return {
      ...p,
      total: empLeads.length,
      converted: empLeads.filter(l => l.stage === "converted").length,
      lost: empLeads.filter(l => l.stage === "lost").length,
      stageCounts,
      hot: empLeads.filter(l => l.temperature === "hot").length,
      warm: empLeads.filter(l => l.temperature === "warm").length,
      cold: empLeads.filter(l => l.temperature === "cold").length,
    };
  }).sort((a, b) => b.total - a.total);
  
  const unassignedCount = leads.filter(l => !l.assigned_to).length;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Leads Overview
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and filter leads by employee, stage, and status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              Total: {leads.length}
            </Badge>
            {selectedEmployee && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onSelectEmployee(null)}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filter
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employee..."
            value={searchEmployee}
            onChange={(e) => setSearchEmployee(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
          {/* Unassigned Card */}
          <div 
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedEmployee === "unassigned" 
                ? "border-primary bg-primary/5" 
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onSelectEmployee(selectedEmployee === "unassigned" ? null : "unassigned")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                  ?
                </div>
                <div>
                  <p className="font-semibold text-sm">Unassigned</p>
                  <p className="text-xs text-muted-foreground">{unassignedCount} leads</p>
                </div>
              </div>
              <Badge variant={selectedEmployee === "unassigned" ? "default" : "outline"}>
                {unassignedCount}
              </Badge>
            </div>
          </div>
          
          {employeeStats.map(emp => {
            const color = avatarColor(emp.display_name || "?");
            const isActive = selectedEmployee === emp.user_id;
            return (
              <div 
                key={emp.user_id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isActive 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => onSelectEmployee(isActive ? null : emp.user_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: color }}
                    >
                      {getInitials(emp.display_name || "?")}
                    </div>
                    <div>
                      <p className="font-semibold text-sm truncate max-w-[80px]">{emp.display_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {emp.converted} converted / {emp.lost} lost
                      </p>
                    </div>
                  </div>
                  <Badge variant={isActive ? "default" : "outline"}>
                    {emp.total}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {emp.hot > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                      🔥 {emp.hot}
                    </span>
                  )}
                  {emp.warm > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                      ☀️ {emp.warm}
                    </span>
                  )}
                  {emp.cold > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      ❄️ {emp.cold}
                    </span>
                  )}
                </div>
                
                {emp.total > 0 && (
                  <div className="mt-2">
                    <Progress 
                      value={(emp.converted / emp.total) * 100} 
                      className="h-1" 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-wrap gap-2 items-center border-t pt-3">
          <span className="text-sm font-medium mr-2">Quick Filter:</span>
          
          <div className="flex flex-wrap gap-1">
            {LEAD_STAGES.map(s => {
              const count = leads.filter(l => l.stage === s.value).length;
              const isActive = selectedStage === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => onSelectStage(isActive ? null : s.value)}
                  className={`text-xs px-2 py-1 rounded-full transition-all ${
                    isActive ? "ring-2 ring-offset-1" : "hover:bg-gray-100"
                  }`}
                  style={{
                    background: isActive ? s.bg : "transparent",
                    color: isActive ? s.color : "#64748b",
                    border: `1px solid ${isActive ? s.color : "#e2e8f0"}`,
                  }}
                >
                  {s.icon} {s.label} ({count})
                </button>
              );
            })}
          </div>
          
          <span className="text-sm font-medium mx-2">|</span>
          
          <div className="flex flex-wrap gap-1">
            {LEAD_STATUSES.slice(0, 6).map(s => {
              const count = leads.filter(l => l.status === s.value).length;
              const isActive = selectedStatus === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => onSelectStatus(isActive ? null : s.value)}
                  className={`text-xs px-2 py-1 rounded-full transition-all ${
                    isActive ? "bg-primary text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {s.label} ({count})
                </button>
              );
            })}
          </div>
          
          {(selectedEmployee || selectedStage || selectedStatus) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                onSelectEmployee(null);
                onSelectStage(null);
                onSelectStatus(null);
              }}
              className="text-xs text-red-500"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Helper Functions ───────────────────────────────────────────────────────
function isFreshLead(lead: DbLead) {
  const created = new Date(lead.created_at);
  const threeDaysAgo = subDays(new Date(), 3);
  return (lead.status === "new" || lead.stage === "new") && created >= threeDaysAgo;
}

function isTodayLead(lead: DbLead) {
  return isToday(new Date(lead.created_at));
}

function isFollowUpDue(lead: DbLead) {
  if (!lead.next_call_date) return false;
  const d = startOfDay(new Date(lead.next_call_date));
  const today = startOfDay(new Date());
  return d <= today;
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function LeadDashboard() {
  const { user } = useAuth();
  const canAssign = useCanAssignTasks();
  const isLeader = useIsOwnerOrAdmin() || useIsManager();
  const { data: profiles = [] } = useAllProfiles();
  const { data: leads = [], isLoading } = useCrmQuery<DbLead>("leads");
  const bulkAssign = useBulkAssignLeads();
  const logActivity = useLeadActivityLogger();

  const [employeeFilter, setEmployeeFilter] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: myTasks = [] } = useQuery({
    queryKey: ["my_activities", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("assigned_to", user!.id)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAssignTo, setBulkAssignTo] = useState("");
  const [detailLead, setDetailLead] = useState<DbLead | null>(null);
  const [activeTab, setActiveTab] = useState("daily");

  const getProfileName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const p = (profiles as { user_id: string; display_name: string | null }[]).find((p) => p.user_id === userId);
    return p?.display_name || "Unknown";
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (employeeFilter === "unassigned" && l.assigned_to) return false;
      if (employeeFilter && employeeFilter !== "unassigned" && l.assigned_to !== employeeFilter) return false;
      if (stageFilter && l.stage !== stageFilter) return false;
      if (statusFilter && l.status !== statusFilter) return false;
      return true;
    });
  }, [leads, employeeFilter, stageFilter, statusFilter]);

  const myLeads = useMemo(() => filteredLeads.filter((l) => l.assigned_to === user?.id), [filteredLeads, user]);
  const todayLeads = useMemo(() => filteredLeads.filter(isTodayLead), [filteredLeads]);
  const freshLeads = useMemo(() => filteredLeads.filter(isFreshLead), [filteredLeads]);
  const followUpLeads = useMemo(() => filteredLeads.filter(isFollowUpDue), [filteredLeads]);
  const unassignedLeads = useMemo(() => filteredLeads.filter((l) => !l.assigned_to), [filteredLeads]);
  const todayTasks = useMemo(() =>
    myTasks.filter((t) => t.due_date && isToday(new Date(t.due_date)) && t.task_status !== "completed"),
    [myTasks]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (list: DbLead[]) => {
    const allSelected = list.every((l) => selectedIds.has(l.id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        list.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        list.forEach((l) => next.add(l.id));
        return next;
      });
    }
  };

  const handleBulkAssign = async () => {
    if (selectedIds.size === 0) { toast.error("Pehle leads select karo"); return; }
    if (!bulkAssignTo) { toast.error("Employee select karo"); return; }
    try {
      const count = await bulkAssign.mutateAsync({ leadIds: Array.from(selectedIds), assignedTo: bulkAssignTo });
      toast.success(`${count} leads assign ho gaye — ${getProfileName(bulkAssignTo)}`);
      setSelectedIds(new Set());
      setBulkAssignTo("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Assign nahi hua");
    }
  };

  const openLead = (lead: DbLead) => {
    setDetailLead(lead);
    logActivity(lead.id, "viewed", `Dashboard: ${lead.name}`);
  };

  const getTabLeads = (): DbLead[] => {
    switch (activeTab) {
      case "daily": return myLeads.filter(isFollowUpDue);
      case "today": return todayLeads;
      case "fresh": return freshLeads;
      case "mine": return myLeads;
      case "followup": return followUpLeads;
      case "unassigned": return unassignedLeads;
      default: return myLeads;
    }
  };

  const tabLeads = getTabLeads();

  const LeadTable = ({ list }: { list: DbLead[] }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {canAssign && (
              <TableHead className="w-10">
                <Checkbox
                  checked={list.length > 0 && list.every((l) => selectedIds.has(l.id))}
                  onCheckedChange={() => toggleSelectAll(list)}
                />
              </TableHead>
            )}
            <TableHead>Lead</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Next Call</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canAssign ? 7 : 6} className="text-center text-sm text-muted-foreground py-8">
                Koi lead nahi mili is filter mein
              </TableCell>
            </TableRow>
          ) : list.map((lead) => (
            <TableRow key={lead.id} className={isFollowUpDue(lead) ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}>
              {canAssign && (
                <TableCell>
                  <Checkbox checked={selectedIds.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
                </TableCell>
              )}
              <TableCell>
                <p className="font-medium text-sm">{lead.name}</p>
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    <Phone className="h-3 w-3" />{lead.phone}
                  </a>
                )}
                {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
              </TableCell>
              <TableCell><span className="text-xs">{formatStageLabel(lead.stage)}</span></TableCell>
              <TableCell><Badge variant={statusColors[lead.status] || "outline"} className="text-xs">{formatStageLabel(lead.status)}</Badge></TableCell>
              <TableCell className="text-xs">{getProfileName(lead.assigned_to)}</TableCell>
              <TableCell>
                {lead.next_call_date ? (
                  <span className={`text-xs flex items-center gap-1 ${isPast(new Date(lead.next_call_date)) && !isToday(new Date(lead.next_call_date)) ? "text-destructive font-medium" : ""}`}>
                    <Calendar className="h-3 w-3" />
                    {format(new Date(lead.next_call_date), "dd MMM yyyy")}
                  </span>
                ) : <span className="text-xs text-muted-foreground">—</span>}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openLead(lead)}>Open</Button>
                  {lead.phone && (
                    <Button size="sm" variant="ghost" className="h-7" asChild>
                      <a href={`tel:${lead.phone}`} onClick={() => logActivity(lead.id, "called", lead.phone || undefined)}>
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // Stats for cards
  const stats = {
    myLeads: myLeads.length,
    todayLeads: todayLeads.length,
    freshLeads: freshLeads.length,
    followUpLeads: followUpLeads.length,
    todayTasks: todayTasks.length,
    unassignedLeads: unassignedLeads.length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead Dashboard</h1>
        <p className="text-muted-foreground">Daily calls, follow-ups, comments aur bulk assignment — sab ek jagah</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Phone className="h-5 w-5 text-primary" /></div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{stats.myLeads}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Mere Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0"><Calendar className="h-5 w-5 text-blue-500" /></div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{stats.todayLeads}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Aaj ke Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0"><Sparkles className="h-5 w-5 text-green-500" /></div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{stats.freshLeads}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Fresh Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><AlertCircle className="h-5 w-5 text-amber-500" /></div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{stats.followUpLeads}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Follow-up Due</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0"><CheckSquare className="h-5 w-5 text-purple-500" /></div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{stats.todayTasks}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Aaj ke Tasks</p>
            </div>
          </CardContent>
        </Card>
        {canAssign && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0"><Users className="h-5 w-5 text-orange-500" /></div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{stats.unassignedLeads}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">Unassigned</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Section */}
      <DashboardCharts leads={leads} />

      {/* Employee Filter Section */}
      <EmployeeFilterSection
        profiles={profiles as { user_id: string; display_name: string | null }[]}
        leads={leads}
        onSelectEmployee={setEmployeeFilter}
        selectedEmployee={employeeFilter}
        onSelectStage={setStageFilter}
        selectedStage={stageFilter}
        onSelectStatus={setStatusFilter}
        selectedStatus={statusFilter}
      />

      {/* Daily Tasks */}
      {todayTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Aaj ke Daily Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <div key={task.id} className="flex flex-wrap items-center justify-between p-3 rounded-lg border gap-2">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <Badge variant="outline" className="text-xs mt-1">{task.type}</Badge>
                  </div>
                  <Badge>{task.task_status || "pending"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Assign Bar */}
      {canAssign && selectedIds.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <Badge variant="default"><CheckSquare className="h-3 w-3 mr-1" />{selectedIds.size} leads selected</Badge>
            <Select value={bulkAssignTo} onValueChange={setBulkAssignTo}>
              <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Employee select karo" /></SelectTrigger>
              <SelectContent>
                {(profiles as { user_id: string; display_name: string | null }[]).map((p) => (
                  <SelectItem key={p.user_id} value={p.user_id}>{p.display_name || "Unknown"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkAssign} disabled={bulkAssign.isPending}>
              {bulkAssign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserCheck className="mr-1 h-4 w-4" />Bulk Assign</>}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
          </CardContent>
        </Card>
      )}

      {/* Lead Tabs */}
      <Card>
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="daily" className="text-xs">Aaj Call Karo ({myLeads.filter(isFollowUpDue).length})</TabsTrigger>
              <TabsTrigger value="today" className="text-xs">Today's Leads ({todayLeads.length})</TabsTrigger>
              <TabsTrigger value="fresh" className="text-xs">Fresh Leads ({freshLeads.length})</TabsTrigger>
              <TabsTrigger value="mine" className="text-xs">Mere Leads ({myLeads.length})</TabsTrigger>
              <TabsTrigger value="followup" className="text-xs">Follow-ups ({followUpLeads.length})</TabsTrigger>
              {canAssign && <TabsTrigger value="unassigned" className="text-xs">Unassigned ({unassignedLeads.length})</TabsTrigger>}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-4">
          <LeadTable list={tabLeads} />
        </CardContent>
      </Card>

      {/* Activity feed for managers */}
      {isLeader && <LeadActivityFeed />}

      {/* Lead Detail + Comments Dialog */}
      <Dialog open={!!detailLead} onOpenChange={() => setDetailLead(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {detailLead?.name}
            </DialogTitle>
          </DialogHeader>
          {detailLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Phone</p><p className="font-medium">{detailLead.phone || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Company</p><p className="font-medium">{detailLead.company || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Stage</p><p className="font-medium">{formatStageLabel(detailLead.stage)}</p></div>
                <div><p className="text-muted-foreground text-xs">Assigned</p><p className="font-medium">{getProfileName(detailLead.assigned_to)}</p></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {detailLead.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${detailLead.phone}`} onClick={() => logActivity(detailLead.id, "called", detailLead.phone || undefined)}>
                      <Phone className="mr-1 h-4 w-4" />Call
                    </a>
                  </Button>
                )}
                {detailLead.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`https://wa.me/${detailLead.phone.replace(/[^0-9]/g, "")}`} target="_blank" onClick={() => logActivity(detailLead.id, "whatsapp", detailLead.phone || undefined)}>
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
              <LeadCommentsPanel leadId={detailLead.id} leadStage={detailLead.stage} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
