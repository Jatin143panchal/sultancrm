// src/components/Leads.tsx - Updated with Phone Hide, Call Status & Comments

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Search, Loader2, Upload, FileSpreadsheet, Trash2, Edit, Eye,
  Download, X, Users, Phone, MessageCircle, Calendar, TrendingUp, Flag,
  XCircle, Flame, Snowflake, Sun, ChevronLeft, ChevronRight, CheckCircle2,
  Radio, BarChart3, PieChartIcon, ChartColumn, Clock, Coffee, LogOut, Activity,
  Timer, ListTodo, PhoneCall, CalendarClock, AlertCircle, Camera, ShieldCheck,
  UserCheck, UserX, UserCog, Building2, Mail, MapPin, Award, Zap, 
  PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, MessageSquarePlus,
  Send, Save, History
} from "lucide-react";
import { isToday, subDays, format } from "date-fns";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

// ── Types ───────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  agent_code: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: "online" | "break" | "offline";
  login_time: string | null;
  break_time: string | null;
  logout_time: string | null;
  total_working_hours: number;
  total_breaks: number;
  created_at: string;
}

interface Attendance {
  id: string;
  user_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_photo_url: string | null;
  check_out_photo_url: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  status: string;
  type: string;
  notes: string | null;
}

interface LeadComment {
  id: string;
  lead_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_name?: string;
}

interface Lead {
  id: string;
  lead_code: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  medicine: string | null;
  disease: string | null;
  qty_days: number | null;
  value: number | null;
  lead_type: string | null;
  source: string | null;
  budget: string | null;
  stage: string;
  sub_stage: string | null;
  temperature: string | null;
  assigned_to: string | null;
  order_status: string | null;
  previous_history: string | null;
  remark: string | null;
  lost_reason: string | null;
  lost_date: string | null;
  business_status: string | null;
  next_call_date: string | null;
  call_status: string | null;  // ✅ New field
  created_at: string;
  updated_at: string;
}

// ── Config ───────────────────────────────────────────────────────────────

const STAGES = [
  { value: "New", label: "New", color: "#3b82f6", bg: "#eff6ff", icon: "✨" },
  { value: "Ringing", label: "Ringing", color: "#f97316", bg: "#fff7ed", icon: "📞" },
  { value: "Callback", label: "Callback", color: "#3b82f6", bg: "#eff6ff", icon: "🔔" },
  { value: "DP", label: "DP", color: "#8b5cf6", bg: "#f5f3ff", icon: "📋" },
  { value: "VMS", label: "VMS", color: "#06b6d4", bg: "#ecfeff", icon: "🎙" },
  { value: "PG", label: "PG", color: "#ec4899", bg: "#fdf2f8", icon: "👥" },
  { value: "Converted", label: "Converted", color: "#10b981", bg: "#ecfdf5", icon: "✅" },
  { value: "Lost", label: "Lost", color: "#ef4444", bg: "#fef2f2", icon: "❌" },
];

const CALL_STATUSES = [
  { value: "pending", label: "⏳ Pending", color: "#6b7280" },
  { value: "ringing", label: "📞 Ringing", color: "#f97316" },
  { value: "interested", label: "✅ Interested", color: "#10b981" },
  { value: "not_interested", label: "❌ Not Interested", color: "#ef4444" },
  { value: "callback_requested", label: "🔄 Callback Requested", color: "#8b5cf6" },
  { value: "followup", label: "📅 Follow-up", color: "#3b82f6" },
  { value: "converted", label: "🎉 Converted", color: "#10b981" },
];

const TEMPERATURES = [
  { value: "Hot", label: "🔥 Hot", color: "#ef4444", bg: "#fef2f2" },
  { value: "Warm", label: "☀️ Warm", color: "#f97316", bg: "#fff7ed" },
  { value: "Cold", label: "❄️ Cold", color: "#3b82f6", bg: "#eff6ff" },
];

const SUB_STAGES: Record<string, string[]> = {
  New: ["-"],
  Ringing: ["1st Ring", "2nd Ring", "3rd Ring"],
  Callback: ["Callback Scheduled", "Callback Done"],
  DP: ["DP Sent", "DP Reviewed"],
  VMS: ["VMS Left", "VMS Replied"],
  PG: ["PG Initiated", "PG Confirmed"],
  Converted: ["Meeting Booked", "Business Generated"],
  Lost: ["Not Interested", "No Response", "Budget Issue", "Competitor", "Wrong Number"],
};

const LEAD_TYPES = ["Herbal & Ayurvedic", "Cosmetics", "Food & Beverage", "Pharma", "Perfume", "Nutraceutical", "Other"];
const SOURCES = ["Website", "Referral", "Existing Customer", "WhatsApp", "Facebook Ads", "Google Ads", "Cold Call", "Trade Show", "LinkedIn", "Other"];
const BUDGETS = ["Below Rs 50k", "Rs 50k - 1L", "Rs 1L - 3L", "Rs 3L - 5L", "Rs 5L+"];
const ORDER_STATUSES = ["New Order", "In Transit", "Delivered", "RTO", "Cancelled", "Returned"];
const BIZ_STATUSES = ["Active", "No-Go", "Done"];

const STAGE_BONUS: Record<string, number> = { New: 5, Ringing: 10, Callback: 12, DP: 15, VMS: 15, PG: 20, Converted: 30, Lost: 0 };
const TEMP_BONUS: Record<string, number> = { Hot: 15, Warm: 8, Cold: 0 };

// ── Helpers ─────────────────────────────────────────────────────────────

const getStageConfig = (s: string | null) => STAGES.find(x => x.value === s) || null;
const getTempConfig = (t: string | null) => TEMPERATURES.find(x => x.value === t) || null;
const getCallStatusConfig = (s: string | null) => CALL_STATUSES.find(x => x.value === s) || null;
const formatCurrency = (v: number) => `Rs ${v.toLocaleString("en-IN")}`;

// ── Phone Number Hide Function ──────────────────────────────────────────
function hidePhoneNumber(phone: string | null): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  // Show first 4 and last 2 digits, hide middle with ****
  const first4 = digits.slice(0, 4);
  const last2 = digits.slice(-2);
  const hidden = digits.slice(4, -2).replace(/./g, "*");
  return `${first4}${hidden}${last2}`;
}

// ── Components ──────────────────────────────────────────────────────────

// ... (CameraDialog, EmployeeCard, MyAttendanceCard, TeamAttendanceTable components remain same)

// ── Comment Component ──────────────────────────────────────────────────
function LeadComments({ leadId, currentUser }: { leadId: string; currentUser: any }) {
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lead_comments")
        .select(`
          *,
          profiles:user_id (display_name)
        `)
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (err: any) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) fetchComments();
  }, [leadId, fetchComments]);

  // Add comment
  const addComment = useCallback(async () => {
    if (!newComment.trim() || !currentUser) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("lead_comments")
        .insert({
          lead_id: leadId,
          user_id: currentUser.id,
          comment: newComment.trim()
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setComments(prev => [data, ...prev]);
        setNewComment("");
        toast.success("💬 Comment added");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  }, [leadId, currentUser, newComment]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
        <h4 className="font-semibold text-sm">Comments ({comments.length})</h4>
      </div>

      {/* Add Comment */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 min-h-[60px] text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addComment();
            }
          }}
        />
        <Button
          size="sm"
          onClick={addComment}
          disabled={!newComment.trim() || submitting}
          className="self-end"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
      ) : (
        <div className="max-h-[300px] overflow-y-auto space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: avatarColor(comment.user_name || "User") }}>
                {getInitials(comment.user_name || "User")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{comment.user_name || "Unknown User"}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(comment.created_at), "dd MMM, hh:mm a")}</span>
                </div>
                <p className="text-sm break-words">{comment.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ── Search and Filters ──────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterTemperature, setFilterTemperature] = useState("all");
  const [filterLeadType, setFilterLeadType] = useState("all");
  const [filterBudget, setFilterBudget] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterCallStatus, setFilterCallStatus] = useState("all");
  const [filterPreset, setFilterPreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // ── Dialogs ──────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [lostLeadDialog, setLostLeadDialog] = useState<Lead | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importSummary, setImportSummary] = useState<{ imported: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportStage, setExportStage] = useState("all");

  // ── Form State ──────────────────────────────────────────────────────
  const emptyForm = {
    name: "", phone: "", email: "", address: "", medicine: "", disease: "",
    qty_days: "", value: "", lead_type: "Herbal & Ayurvedic", source: "Website",
    budget: "Below Rs 50k", stage: "New", sub_stage: "-", temperature: "Warm",
    order_status: "New Order", previous_history: "", remark: "", call_status: "pending",
  };
  const [form, setForm] = useState(emptyForm);

  // ── Get Current User ────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
      setIsAdmin(data.user?.email?.includes('admin') || false);
    });
  }, []);

  // ── Fetch Data ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { data: leadsData, error: leadsErr },
        { data: agentsData, error: agentsErr },
        { data: attendanceData, error: attendanceErr }
      ] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("agents").select("*").order("name"),
        supabase.from("attendance").select("*").order("date", { ascending: false }).limit(500)
      ]);

      if (leadsErr) throw leadsErr;
      if (agentsErr) throw agentsErr;
      if (attendanceErr) throw attendanceErr;

      setLeads((leadsData as Lead[]) || []);
      setAgents((agentsData as Agent[]) || []);
      setAttendance((attendanceData as Attendance[]) || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Realtime ──
  useEffect(() => {
    const channel = supabase.channel("leads-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, payload => {
        if (payload.eventType === "INSERT") {
          setLeads(prev => prev.some(l => l.id === (payload.new as Lead).id) ? prev : [payload.new as Lead, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setLeads(prev => prev.map(l => (l.id === (payload.new as Lead).id ? (payload.new as Lead) : l)));
        } else if (payload.eventType === "DELETE") {
          setLeads(prev => prev.filter(l => l.id !== (payload.old as Lead).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Helper Functions ──────────────────────────────────────────────
  const getAgentName = useCallback((id: string | null) => agents.find(a => a.id === id)?.name || "Unassigned", [agents]);

  const logActivity = useCallback(async (leadId: string, action: string, detail?: string) => {
    try {
      await supabase.from("lead_activity").insert({ lead_id: leadId, action, detail });
    } catch { /* non-critical */ }
  }, []);

  // ── Lead CRUD ──────────────────────────────────────────────────────
  const handleAddLead = useCallback(async () => {
    if (!form.name || !form.phone) {
      toast.error("Name and Phone are required");
      return;
    }
    try {
      const { error } = await supabase.from("leads").insert({
        name: form.name, phone: form.phone, email: form.email || null, address: form.address,
        medicine: form.medicine, disease: form.disease, qty_days: Number(form.qty_days) || 0,
        value: Number(form.value) || 0, lead_type: form.lead_type, source: form.source,
        budget: form.budget, stage: form.stage, sub_stage: form.sub_stage, temperature: form.temperature,
        order_status: form.order_status, previous_history: form.previous_history, remark: form.remark,
        call_status: form.call_status || "pending",
      });
      if (error) throw error;
      setForm(emptyForm);
      setDialogOpen(false);
      toast.success("✅ Lead added successfully");
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to add lead");
    }
  }, [form, fetchAll]);

  // ── Update Call Status ──────────────────────────────────────────────
  const handleUpdateCallStatus = useCallback(async (id: string, callStatus: string) => {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, call_status: callStatus } : l)));
    if (detailLead?.id === id) setDetailLead(prev => (prev ? { ...prev, call_status: callStatus } : prev));
    try {
      const { error } = await supabase.from("leads").update({ call_status: callStatus }).eq("id", id);
      if (error) throw error;
      logActivity(id, "call_status_updated", `Call Status: ${callStatus}`);
      toast.success(`📞 Call status updated to ${CALL_STATUSES.find(s => s.value === callStatus)?.label || callStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update call status");
      await fetchAll();
    }
  }, [detailLead, logActivity, fetchAll]);

  const handleUpdate = useCallback(async () => {
    if (!editLead) return;
    try {
      const { error } = await supabase.from("leads").update({
        name: editLead.name, phone: editLead.phone, email: editLead.email, address: editLead.address,
        medicine: editLead.medicine, disease: editLead.disease, qty_days: editLead.qty_days, value: editLead.value,
        lead_type: editLead.lead_type, source: editLead.source, budget: editLead.budget,
        stage: editLead.stage, sub_stage: editLead.sub_stage, temperature: editLead.temperature,
        assigned_to: editLead.assigned_to, order_status: editLead.order_status,
        previous_history: editLead.previous_history, remark: editLead.remark, business_status: editLead.business_status,
        call_status: editLead.call_status,
      }).eq("id", editLead.id);
      if (error) throw error;
      setLeads(prev => prev.map(l => (l.id === editLead.id ? { ...l, ...editLead } : l)));
      logActivity(editLead.id, "updated", `Stage: ${editLead.stage}`);
      setEditLead(null);
      toast.success("✅ Lead updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead");
    }
  }, [editLead, logActivity]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      setLeads(prev => prev.filter(l => l.id !== id));
      toast.success("🗑️ Lead deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  }, []);

  const handleAgentStatus = useCallback(async (id: string, status: Agent["status"]) => {
    const patch: Partial<Agent> =
      status === "online" ? { status, login_time: new Date().toISOString(), logout_time: null } :
        status === "break" ? { status, break_time: new Date().toISOString() } :
          { status, logout_time: new Date().toISOString() };
    setAgents(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)));
    try {
      const { error } = await supabase.from("agents").update(patch).eq("id", id);
      if (error) throw error;
      toast.success(`✅ Agent status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update agent status");
      await fetchAll();
    }
  }, [fetchAll]);

  const markLeadAsLost = useCallback(async (id: string, reason: string) => {
    const patch = { stage: "Lost", lost_reason: reason, lost_date: new Date().toISOString(), business_status: "No-Go" };
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
    if (detailLead?.id === id) setDetailLead(null);
    setLostLeadDialog(null);
    try {
      const { error } = await supabase.from("leads").update(patch).eq("id", id);
      if (error) throw error;
      logActivity(id, "lost", reason);
      toast.success("❌ Lead marked as lost");
    } catch (err: any) {
      toast.error(err.message || "Failed to mark lost");
      await fetchAll();
    }
  }, [detailLead, logActivity, fetchAll]);

  // ── Filters ──
  const filtered = useMemo(() => {
    return leads.filter(l => {
      const q = search.toLowerCase();
      const matchSearch = l.name.toLowerCase().includes(q) || (l.phone || "").includes(search) || (l.medicine || "").toLowerCase().includes(q);
      const matchStage = filterStage === "all" || l.stage === filterStage;
      const matchTemp = filterTemperature === "all" || l.temperature === filterTemperature;
      const matchType = filterLeadType === "all" || l.lead_type === filterLeadType;
      const matchBudget = filterBudget === "all" || l.budget === filterBudget;
      const matchAssignee = filterAssignee === "all" || (filterAssignee === "unassigned" ? !l.assigned_to : l.assigned_to === filterAssignee);
      const matchCallStatus = filterCallStatus === "all" || l.call_status === filterCallStatus;
      const matchPreset = filterPreset === "all" ||
        (filterPreset === "today" && isToday(new Date(l.created_at))) ||
        (filterPreset === "fresh" && l.stage === "New" && new Date(l.created_at) >= subDays(new Date(), 3)) ||
        (filterPreset === "followup" && l.next_call_date && new Date(l.next_call_date) <= new Date());
      const created = new Date(l.created_at);
      const matchFrom = !dateFrom || created >= new Date(dateFrom);
      const matchTo = !dateTo || created <= new Date(dateTo + "T23:59:59");
      return matchSearch && matchStage && matchTemp && matchType && matchBudget && matchAssignee && matchCallStatus && matchPreset && matchFrom && matchTo;
    });
  }, [leads, search, filterStage, filterTemperature, filterLeadType, filterBudget, filterAssignee, filterCallStatus, filterPreset, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = useMemo(() => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filtered, currentPage]);
  useEffect(() => { setCurrentPage(1); }, [filtered.length]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterStage("all");
    setFilterTemperature("all");
    setFilterLeadType("all");
    setFilterBudget("all");
    setFilterAssignee("all");
    setFilterCallStatus("all");
    setFilterPreset("all");
    setDateFrom("");
    setDateTo("");
  }, []);

  // ── Stats ──
  const stats = useMemo(() => ({
    total: leads.length,
    hot: leads.filter(l => l.temperature === "Hot").length,
    warm: leads.filter(l => l.temperature === "Warm").length,
    cold: leads.filter(l => l.temperature === "Cold").length,
    converted: leads.filter(l => l.stage === "Converted").length,
    active: leads.filter(l => l.stage !== "Converted" && l.stage !== "Lost").length,
    interested: leads.filter(l => l.call_status === "interested").length,
    ringing: leads.filter(l => l.call_status === "ringing").length,
  }), [leads]);

  // ── Import/Export ──
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportSummary(null);
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);
        const mapped = rows.map((r: any) => ({
          name: r.Name || r.name || "",
          phone: String(r.Number || r.Phone || r.phone || ""),
          address: r.Address || r.address || "",
          medicine: r.Medicine || r["Product / Medicine"] || r.medicine || "",
          qty_days: Number(r["Day's"] || r["Qty (Days)"] || r.qty_days || 0),
          value: Number(r.Price || r.Value || r.value || 0),
          previous_history: r["Previous History"] || r.previous_history || "",
          remark: r.Note || r.Remark || r.remark || "",
          disease: r.Disease || r.disease || "",
          temperature: r.Temperature || "Warm",
        })).filter((r: any) => r.name);
        setUploadPreview(mapped);
        if (mapped.length === 0) toast.error("No valid leads found");
      } catch {
        toast.error("Failed to parse file");
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const handleBulkImport = useCallback(async () => {
    if (uploadPreview.length === 0) return;
    setUploading(true);
    let success = 0;
    for (const lead of uploadPreview) {
      try {
        const { error } = await supabase.from("leads").insert({
          name: lead.name, phone: lead.phone, address: lead.address, medicine: lead.medicine,
          qty_days: lead.qty_days, value: lead.value, previous_history: lead.previous_history,
          remark: lead.remark, disease: lead.disease, temperature: lead.temperature,
          stage: "New", sub_stage: "-", source: "Existing Customer",
          call_status: "pending",
        });
        if (!error) success++;
      } catch { /* skip row */ }
    }
    setUploading(false);
    setUploadPreview([]);
    if (fileRef.current) fileRef.current.value = "";
    await fetchAll();
    setImportSummary({ imported: success });
    toast.success(`✅ ${success} leads imported into "New" stage`);
    setUploadOpen(false);
  }, [uploadPreview, fetchAll]);

  const buildExportRows = useCallback((rows: Lead[]) => rows.map(l => ({
    "Lead ID": l.lead_code, Name: l.name, Number: l.phone, Address: l.address,
    Medicine: l.medicine, Disease: l.disease, "Day's": l.qty_days, Price: l.value,
    "Lead Type": l.lead_type, Source: l.source, Budget: l.budget,
    Stage: l.stage, "Sub Stage": l.sub_stage, Temperature: l.temperature,
    "Call Status": CALL_STATUSES.find(s => s.value === l.call_status)?.label || l.call_status || "Pending",
    "Assigned To": getAgentName(l.assigned_to), "Order Status": l.order_status,
    "Previous History": l.previous_history, Note: l.remark, "Lost Reason": l.lost_reason || "",
    "Business Status": l.business_status, "Created Date": format(new Date(l.created_at), "dd/MM/yyyy"),
  })), [getAgentName]);

  const handleExportByStage = useCallback((stage: string) => {
    const src = stage === "all" ? leads : leads.filter(l => l.stage === stage);
    if (src.length === 0) { toast.error(`No leads found for "${stage}"`); return; }
    const ws = XLSX.utils.json_to_sheet(buildExportRows(src));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (stage === "all" ? "All Leads" : stage).slice(0, 31));
    XLSX.writeFile(wb, `leads_export_${stage === "all" ? "all" : stage}.xlsx`);
    toast.success(`📥 ${src.length} lead(s) exported`);
  }, [leads, buildExportRows]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* ─── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Team Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage leads, track attendance, and monitor team performance
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Badge variant="outline" className="px-3 py-1">
            <Users className="h-4 w-4 mr-1" />
            {agents.filter(a => a.status === "online").length} Online
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <UserCheck className="h-4 w-4 mr-1" />
            {stats.active} Active Leads
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-green-50 border-green-200">
            <PhoneIncoming className="h-4 w-4 mr-1 text-green-600" />
            {stats.interested} Interested
          </Badge>
        </div>
      </div>

      {/* ─── MY ATTENDANCE ────────────────────────────────────────────── */}
      {currentUser && <MyAttendanceCard userId={currentUser.id} />}

      {/* ─── TEAM OVERVIEW (Admin Only) ──────────────────────────────── */}
      {isAdmin && (
        <>
          {/* Team Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{agents.length}</p>
                    <p className="text-xs text-muted-foreground">Total Team</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {agents.filter(a => a.status === "online").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Coffee className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {agents.filter(a => a.status === "break").length}
                    </p>
                    <p className="text-xs text-muted-foreground">On Break</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Leads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Award className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {stats.converted}
                    </p>
                    <p className="text-xs text-muted-foreground">Converted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <PhoneIncoming className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.interested}</p>
                    <p className="text-xs text-muted-foreground">Interested</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <PhoneOutgoing className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{stats.ringing}</p>
                    <p className="text-xs text-muted-foreground">Ringing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Attendance Table */}
          <TeamAttendanceTable agents={agents} attendance={attendance} />

          {/* Employee Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map(agent => (
                  <EmployeeCard
                    key={agent.id}
                    agent={agent}
                    onStatusChange={handleAgentStatus}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── LEADS SECTION ────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Leads Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Lead Management
            </h2>
            <p className="text-muted-foreground text-sm">
              Track and manage all your leads in one place
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <Select value={exportStage} onValueChange={setExportStage}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.icon} {s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => handleExportByStage(exportStage)}>
                <Download className="mr-2 h-4 w-4" />Export
              </Button>
            </div>

            <Dialog open={uploadOpen} onOpenChange={o => {
              setUploadOpen(o);
              if (!o) { setUploadPreview([]);
                setImportSummary(null);
                if (fileRef.current) fileRef.current.value = ""; }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Import Leads from Excel/CSV
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload Excel/CSV with columns: Name, Number, Address, Medicine, Price, etc.
                    </p>
                    <Input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="max-w-xs mx-auto" />
                  </div>
                  {uploadPreview.length > 0 && (
                    <div className="max-h-60 overflow-auto rounded border">
                      <Table>
                        <TableHeader>
                          <TableRow><TableHead>Name</TableHead><TableHead>Number</TableHead><TableHead>Medicine</TableHead><TableHead>Price</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadPreview.slice(0, 10).map((r, i) => (
                            <TableRow key={i}>
                              <TableCell>{r.name}</TableCell>
                              <TableCell>{r.phone}</TableCell>
                              <TableCell>{r.medicine}</TableCell>
                              <TableCell>{r.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {uploadPreview.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          ...and {uploadPreview.length - 10} more
                        </p>
                      )}
                    </div>
                  )}
                  {importSummary && (
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      {importSummary.imported} imported into "New" stage
                    </div>
                  )}
                </div>
                <DialogFooter>
                  {uploadPreview.length > 0 && (
                    <Button onClick={handleBulkImport} disabled={uploading}>
                      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Import {uploadPreview.length} Leads
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />+ Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4 sm:grid-cols-2">
                  {[
                    ["Name *", "name"],
                    ["Number *", "phone"],
                    ["Email", "email"],
                    ["Address", "address"],
                    ["Medicine / Product", "medicine"],
                    ["Disease / Condition", "disease"],
                    ["Day's (Qty)", "qty_days"],
                    ["Price (Rs)", "value"]
                  ].map(([label, key]) => (
                    <div key={key} className="grid gap-2">
                      <Label>{label}</Label>
                      <Input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                    </div>
                  ))}
                  <div className="grid gap-2">
                    <Label>Lead Type</Label>
                    <Select value={form.lead_type} onValueChange={v => setForm({ ...form, lead_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LEAD_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Source</Label>
                    <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Budget</Label>
                    <Select value={form.budget} onValueChange={v => setForm({ ...form, budget: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{BUDGETS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Temperature</Label>
                    <Select value={form.temperature} onValueChange={v => setForm({ ...form, temperature: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TEMPERATURES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Stage</Label>
                    <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v, sub_stage: SUB_STAGES[v][0] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Sub Stage</Label>
                    <Select value={form.sub_stage} onValueChange={v => setForm({ ...form, sub_stage: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SUB_STAGES[form.stage].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Call Status</Label>
                    <Select value={form.call_status} onValueChange={v => setForm({ ...form, call_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CALL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Order Status</Label>
                    <Select value={form.order_status} onValueChange={v => setForm({ ...form, order_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>Previous History</Label>
                    <Textarea value={form.previous_history} onChange={e => setForm({ ...form, previous_history: e.target.value })} />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>Remark / Note</Label>
                    <Textarea value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} placeholder='e.g. "call at 2:30 PM"' />
                  </div>
                  <Button onClick={handleAddLead} className="sm:col-span-2">Add Lead</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Leads Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Assigned To" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterCallStatus} onValueChange={setFilterCallStatus}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Call Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {CALL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterTemperature} onValueChange={setFilterTemperature}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Temperature" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Temp</SelectItem>
                  {TEMPERATURES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 text-sm" />
                <span className="text-xs text-muted-foreground">to</span>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 text-sm" />
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                Total: <span className="text-primary">{filtered.length}</span>
                {filtered.length !== leads.length && (
                  <span className="text-muted-foreground font-normal"> (of {leads.length})</span>
                )}
              </p>
              <div className="flex gap-2">
                {STAGES.filter(s => s.value !== "Lost" && s.value !== "Converted").map(s => {
                  const count = leads.filter(l => l.stage === s.value).length;
                  return (
                    <button
                      key={s.value}
                      onClick={() => setFilterStage(filterStage === s.value ? "all" : s.value)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${filterStage === s.value ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
                    >
                      {s.icon} {count}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No leads found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead className="hidden lg:table-cell">Medicine</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Call Status</TableHead>
                        <TableHead>Temperature</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead className="hidden lg:table-cell">Price</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map(lead => {
                        const score = getLeadScore(lead);
                        const wa = buildWhatsAppLink(lead);
                        const callStatus = getCallStatusConfig(lead.call_status);
                        return (
                          <TableRow key={lead.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{lead.name}</p>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setDetailLead(lead);
                                  logActivity(lead.id, "viewed"); }}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-[10px] text-muted-foreground">{lead.lead_code}</p>
                            </TableCell>
                            <TableCell className="text-sm font-mono">
                              {hidePhoneNumber(lead.phone)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">{lead.medicine || "-"}</TableCell>
                            <TableCell>
                              <StagePill stage={lead.stage} subStage={lead.sub_stage} />
                            </TableCell>
                            <TableCell>
                              {callStatus ? (
                                <Badge variant="outline" style={{ borderColor: callStatus.color, color: callStatus.color }}>
                                  {callStatus.label}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <TemperatureBadge temperature={lead.temperature} />
                            </TableCell>
                            <TableCell>
                              <Select value={lead.assigned_to || "unassigned"} onValueChange={v => handleAssign(lead.id, v)}>
                                <SelectTrigger className="w-[120px] h-7 text-xs">
                                  <SelectValue>{getAgentName(lead.assigned_to)}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">{formatCurrency(lead.value || 0)}</TableCell>
                            <TableCell><ScoreBadge score={score} /></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailLead(lead)} title="View">
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditLead(lead)} title="Edit">
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                {wa && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" asChild title="WhatsApp">
                                    <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => logActivity(lead.id, "whatsapp")}>
                                      <MessageCircle className="h-3.5 w-3.5" />
                                    </a>
                                  </Button>
                                )}
                                {lead.stage !== "Lost" && lead.stage !== "Converted" && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setLostLeadDialog(lead)} title="Mark Lost">
                                    <Flag className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(lead.id)} title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── DIALOGS ────────────────────────────────────────────────────── */}

      {/* Detail Dialog with Comments */}
      <Dialog open={!!detailLead} onOpenChange={() => setDetailLead(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Lead Details</span>
              <div className="flex items-center gap-2">
                <TemperatureBadge temperature={detailLead?.temperature ?? null} />
                <ScoreBadge score={detailLead ? getLeadScore(detailLead) : 0} />
              </div>
            </DialogTitle>
          </DialogHeader>
          {detailLead && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold" style={{ background: avatarColor(detailLead.name) }}>
                  {getInitials(detailLead.name)}
                </div>
                <div>
                  <h3 className="font-bold">{detailLead.name}</h3>
                  <p className="text-xs text-muted-foreground">{detailLead.lead_code}</p>
                </div>
              </div>
              <Progress value={getLeadScore(detailLead)} className="h-2" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-medium font-mono">{hidePhoneNumber(detailLead.phone)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Address</p>
                  <p className="font-medium">{detailLead.address || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Medicine</p>
                  <p className="font-medium">{detailLead.medicine || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Disease</p>
                  <p className="font-medium">{detailLead.disease || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Qty (Days)</p>
                  <p className="font-medium">{detailLead.qty_days ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Price</p>
                  <p className="font-medium">{formatCurrency(detailLead.value || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Call Status</p>
                  <Select value={detailLead.call_status || "pending"} onValueChange={v => handleUpdateCallStatus(detailLead.id, v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CALL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Assigned To</p>
                  <p className="font-medium">{getAgentName(detailLead.assigned_to)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="font-medium">{format(new Date(detailLead.created_at), "dd MMM yyyy")}</p>
                </div>
                {detailLead.lost_reason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Lost Reason</p>
                    <p className="font-medium text-red-600">{detailLead.lost_reason}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Previous History</p>
                  <p className="font-medium whitespace-pre-wrap">{detailLead.previous_history || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Remark</p>
                  <p className="font-medium whitespace-pre-wrap">{detailLead.remark || "-"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {detailLead.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${detailLead.phone}`} onClick={() => logActivity(detailLead.id, "called")}>
                      <Phone className="mr-1 h-3 w-3" />Call
                    </a>
                  </Button>
                )}
                {detailLead.phone && (
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200" asChild>
                    <a href={buildWhatsAppLink(detailLead) || "#"} target="_blank" rel="noopener noreferrer" onClick={() => logActivity(detailLead.id, "whatsapp")}>
                      <MessageCircle className="mr-1 h-3 w-3" />WhatsApp
                    </a>
                  </Button>
                )}
                {detailLead.stage !== "Lost" && detailLead.stage !== "Converted" && (
                  <Button size="sm" variant="destructive" onClick={() => setLostLeadDialog(detailLead)}>
                    <Flag className="mr-1 h-3 w-3" />Mark as Lost
                  </Button>
                )}
              </div>

              {/* ─── Comments Section ─────────────────────────────────── */}
              <div className="border-t pt-4">
                <LeadComments leadId={detailLead.id} currentUser={currentUser} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editLead} onOpenChange={() => setEditLead(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Lead</DialogTitle></DialogHeader>
          {editLead && (
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              {[
                ["Name", "name"],
                ["Phone", "phone"],
                ["Email", "email"],
                ["Address", "address"],
                ["Medicine", "medicine"],
                ["Disease", "disease"]
              ].map(([label, key]) => (
                <div key={key} className="grid gap-2">
                  <Label>{label}</Label>
                  <Input value={(editLead as any)[key] || ""} onChange={e => setEditLead({ ...editLead, [key]: e.target.value } as Lead)} />
                </div>
              ))}
              <div className="grid gap-2"><Label>Day's (Qty)</Label><Input type="number" value={editLead.qty_days || 0} onChange={e => setEditLead({ ...editLead, qty_days: Number(e.target.value) })} /></div>
              <div className="grid gap-2"><Label>Price (Rs)</Label><Input type="number" value={editLead.value || 0} onChange={e => setEditLead({ ...editLead, value: Number(e.target.value) })} /></div>
              <div className="grid gap-2"><Label>Lead Type</Label><Select value={editLead.lead_type || ""} onValueChange={v => setEditLead({ ...editLead, lead_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEAD_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Source</Label><Select value={editLead.source || ""} onValueChange={v => setEditLead({ ...editLead, source: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Budget</Label><Select value={editLead.budget || ""} onValueChange={v => setEditLead({ ...editLead, budget: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BUDGETS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Temperature</Label><Select value={editLead.temperature || "Warm"} onValueChange={v => setEditLead({ ...editLead, temperature: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TEMPERATURES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Stage</Label><Select value={editLead.stage} onValueChange={v => setEditLead({ ...editLead, stage: v, sub_stage: SUB_STAGES[v][0] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Sub Stage</Label><Select value={editLead.sub_stage || SUB_STAGES[editLead.stage][0]} onValueChange={v => setEditLead({ ...editLead, sub_stage: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SUB_STAGES[editLead.stage].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Call Status</Label><Select value={editLead.call_status || "pending"} onValueChange={v => setEditLead({ ...editLead, call_status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CALL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Order Status</Label><Select value={editLead.order_status || ""} onValueChange={v => setEditLead({ ...editLead, order_status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Business Status</Label><Select value={editLead.business_status || "Active"} onValueChange={v => setEditLead({ ...editLead, business_status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BIZ_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2 sm:col-span-2"><Label>Previous History</Label><Textarea value={editLead.previous_history || ""} onChange={e => setEditLead({ ...editLead, previous_history: e.target.value })} /></div>
              <div className="grid gap-2 sm:col-span-2"><Label>Remark</Label><Textarea value={editLead.remark || ""} onChange={e => setEditLead({ ...editLead, remark: e.target.value })} /></div>
              <Button onClick={handleUpdate} className="sm:col-span-2">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lost Dialog */}
      <Dialog open={!!lostLeadDialog} onOpenChange={() => setLostLeadDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />Mark Lead as Lost
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm mb-4">Mark <strong>{lostLeadDialog?.name}</strong> as lost?</p>
            <Label>Lost Reason</Label>
            <Select onValueChange={reason => reason && lostLeadDialog && markLeadAsLost(lostLeadDialog.id, reason)}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Select reason..." /></SelectTrigger>
              <SelectContent>
                {SUB_STAGES.Lost.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostLeadDialog(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Helper Components ────────────────────────────────────────────────

// ... (ScoreBadge, TemperatureBadge, StagePill, RotateCcw components remain same)
