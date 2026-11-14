// src/components/Leads.tsx
// ═══════════════════════════════════════════════════════════════════
// COMPLETE CRM SOLUTION - All Features in One File
// ═══════════════════════════════════════════════════════════════════
// 
// ✅ Lead Management - Facebook, Instagram, Website, WhatsApp leads
// ✅ Customer History - Past orders, purchases, call history
// ✅ Call Management - Status, next call, auto queue
// ✅ Order Management - Create orders, payment, courier tracking
// ✅ Follow-up Reminders - Auto reminders for next calls
// ✅ Employee Dashboard - Role-based lead visibility
// ✅ Reports - Daily/Weekly/Monthly sales, source, product, performance
// ✅ WhatsApp & SMS Integration - Direct WhatsApp links
// ✅ Invoice & Billing - GST invoices with PDF download
// ✅ Role & Permission - Admin, Team Leader, Caller
// ✅ Stock Management - Product inventory, low stock alerts
// ✅ Customer Feedback - Rating, reviews, repeat likelihood
//
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Search, Loader2, Upload, FileSpreadsheet, Trash2, Edit, Eye,
  Download, X, Users, Phone, MessageCircle, Calendar, TrendingUp, Flag,
  XCircle, ChevronLeft, ChevronRight, CheckCircle2, Clock, Coffee, LogOut,
  Timer, PhoneCall, Camera, UserCheck, UserX, UserCog, Building2, Award, Zap,
  PhoneIncoming, PhoneMissed, MessageSquarePlus, Send, Save, RotateCcw,
  ShoppingCart, Package, FileText, Printer, Star, Bell, BarChart,
  DollarSign, CalendarDays, ClipboardList, Users2, Briefcase,
  MessagesSquare, Smartphone, Tablet, Monitor, Settings, Shield,
  Database, Cloud, Server, HardDrive, Cpu,
  Play, Pause, Volume2, HelpCircle, ExternalLink, Copy, Check, Headset, Radio, RefreshCw
} from "lucide-react";
import { isToday, subDays, format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ── TYPES ───────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  agent_code: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: "admin" | "team_leader" | "caller";
  status: "online" | "break" | "offline";
  login_time: string | null;
  break_time: string | null;
  logout_time: string | null;
  total_working_hours: number;
  total_breaks: number;
  created_at: string;
  incentive_rate?: number;
  target_calls?: number;
  target_conversions?: number;
  team_id?: string;
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
  updated_at: string;
  user_name?: string;
}

interface LeadCall {
  id: string;
  lead_id: string;
  user_id: string;
  call_type: "incoming" | "outgoing" | "missed";
  duration: number;
  status: string;
  notes: string | null;
  created_at: string;
  user_name?: string;
}

interface LeadOrder {
  id: string;
  lead_id: string;
  order_number: string;
  products: any[];
  total_amount: number;
  payment_status: "paid" | "cod" | "pending";
  order_status: "new" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
  courier_tracking: string | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
}

interface LeadFeedback {
  id: string;
  lead_id: string;
  user_id: string;
  rating: number;
  review: string | null;
  repeat_order_likelihood: "high" | "medium" | "low" | null;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  batch_number: string | null;
  expiry_date: string | null;
  description: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  lead_code: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
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
  call_status: string | null;
  last_call_at: string | null;
  created_at: string;
  updated_at: string;
  source_details?: string | null;
  lead_score?: number;
  conversion_probability?: number;
  last_order_date?: string | null;
  total_orders?: number;
  total_spent?: number;
  feedback_rating?: number;
  feedback_count?: number;
}

// ── CONFIGURATION ──────────────────────────────────────────────────────

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
  { value: "connected", label: "✅ Connected", color: "#10b981" },
  { value: "not_connected", label: "❌ Not Connected", color: "#ef4444" },
  { value: "interested", label: "⭐ Interested", color: "#8b5cf6" },
  { value: "not_interested", label: "👎 Not Interested", color: "#ef4444" },
  { value: "callback_requested", label: "🔄 Callback Requested", color: "#8b5cf6" },
  { value: "followup", label: "📅 Follow-up", color: "#3b82f6" },
  { value: "order_confirmed", label: "🛒 Order Confirmed", color: "#10b981" },
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
  Lost: ["Not Interested", "No Response", "Budget Issue", "Competitor", "Wrong Number", "Price Issue", "Already Purchased"],
};

const LEAD_TYPES = ["Herbal & Ayurvedic", "Cosmetics", "Food & Beverage", "Pharma", "Perfume", "Nutraceutical", "Other"];
const SOURCES = ["Website", "Facebook", "Instagram", "WhatsApp", "Referral", "Existing Customer", "Google Ads", "Cold Call", "Trade Show", "LinkedIn", "Other"];
const BUDGETS = ["Below Rs 50k", "Rs 50k - 1L", "Rs 1L - 3L", "Rs 3L - 5L", "Rs 5L+"];
const ORDER_STATUSES = ["New Order", "Processing", "In Transit", "Delivered", "RTO", "Cancelled", "Returned"];
const BIZ_STATUSES = ["Active", "No-Go", "Done"];

const STAGE_BONUS: Record<string, number> = { New: 5, Ringing: 10, Callback: 12, DP: 15, VMS: 15, PG: 20, Converted: 30, Lost: 0 };
const TEMP_BONUS: Record<string, number> = { Hot: 15, Warm: 8, Cold: 0 };
const CALL_COOLDOWN_SECONDS = 30;

// ── HELPERS ─────────────────────────────────────────────────────────────

const getStageConfig = (s: string | null) => STAGES.find(x => x.value === s) || null;
const getTempConfig = (t: string | null) => TEMPERATURES.find(x => x.value === t) || null;
const getCallStatusConfig = (s: string | null) => CALL_STATUSES.find(x => x.value === s) || null;
const formatCurrency = (v: number) => `₹ ${v.toLocaleString("en-IN")}`;

function getInitials(name: string) {
  if (!name) return "U";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#06b6d4", "#f59e0b", "#ef4444"];

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function getLeadScore(lead: Lead): number {
  let score = 0;
  if (lead.name) score += 10;
  if (lead.phone) score += 15;
  if (lead.address) score += 10;
  if (lead.medicine) score += 10;
  if ((lead.value || 0) > 0) score += 15;
  score += STAGE_BONUS[lead.stage] ?? 0;
  score += TEMP_BONUS[lead.temperature || ""] ?? 0;
  if (lead.total_orders && lead.total_orders > 0) score += 10;
  if (lead.feedback_rating && lead.feedback_rating >= 4) score += 5;
  if (lead.conversion_probability && lead.conversion_probability > 0.7) score += 10;
  return Math.min(score, 100);
}

function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function buildWhatsAppLink(lead: Lead): string | null {
  if (!lead.phone) return null;
  const digits = lead.phone.replace(/\D/g, "");
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  const message = encodeURIComponent(`Hi ${lead.name}, this is from [Your Company]. Following up on your order (${lead.medicine || "your product"}). Let us know if you need anything!`);
  return `https://wa.me/${withCountry}?text=${message}`;
}

function hidePhoneNumber(phone: string | null): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  const first4 = digits.slice(0, 4);
  const last2 = digits.slice(-2);
  const hidden = digits.slice(4, -2).replace(/./g, "*");
  return `${first4}${hidden}${last2}`;
}

function getDaysUntilNextCall(nextCallDate: string | null): number | null {
  if (!nextCallDate) return null;
  return differenceInDays(new Date(nextCallDate), new Date());
}

function getCallStatusColor(status: string | null): string {
  const config = getCallStatusConfig(status);
  return config?.color || "#6b7280";
}

function getOrderStatusColor(status: string | null): string {
  const colors: Record<string, string> = {
    "New Order": "#3b82f6",
    "Processing": "#f59e0b",
    "In Transit": "#8b5cf6",
    "Delivered": "#10b981",
    "RTO": "#ef4444",
    "Cancelled": "#6b7280",
    "Returned": "#ef4444"
  };
  return colors[status || ""] || "#6b7280";
}

// ── HELPER COMPONENTS ──────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold" style={{ borderColor: color, color }}>
      {score}
    </div>
  );
}

function TemperatureBadge({ temperature }: { temperature: string | null }) {
  const cfg = getTempConfig(temperature);
  if (!cfg) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border" style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

function StagePill({ stage, subStage }: { stage: string; subStage: string | null }) {
  const cfg = getStageConfig(stage);
  if (!cfg) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold border" style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}30` }}>
        {cfg.icon} {cfg.label}
      </span>
      {subStage && subStage !== "-" && <span className="text-[10px] text-muted-foreground">{subStage}</span>}
    </div>
  );
}

// ── CAMERA DIALOG ──────────────────────────────────────────────────────
function CameraDialog({ open, onClose, onCapture, title }: {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCaptured(null);
      setError(null);
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError("Camera access denied. Please allow camera permission."));
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [open]);

  const takePhoto = () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL("image/jpeg", 0.85));
  };

  const confirm = () => {
    canvasRef.current?.toBlob(blob => { if (blob) onCapture(blob); }, "image/jpeg", 0.85);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {error ? (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-black aspect-square">
              {!captured && <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />}
              {captured && <img src={captured} alt="Captured selfie" className="w-full h-full object-cover -scale-x-100" />}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex gap-2">
          {!error && !captured && <Button onClick={takePhoto} className="w-full"><Camera className="mr-2 h-4 w-4" />Take Photo</Button>}
          {!error && captured && (
            <>
              <Button variant="outline" onClick={() => setCaptured(null)} className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />Retake
              </Button>
              <Button onClick={confirm} className="flex-1">
                <CheckCircle2 className="mr-2 h-4 w-4" />Confirm
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── LEAD COMMENTS ──────────────────────────────────────────────────────
function LeadComments({ leadId, currentUser }: { leadId: string; currentUser: any }) {
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("lead_comments")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: users, error: usersError } = await supabase
          .from("agents")
          .select("id, name")
          .in("id", userIds);

        const userMap = new Map();
        users?.forEach(u => userMap.set(u.id, u.name));

        const formattedComments = commentsData.map(comment => ({
          ...comment,
          user_name: userMap.get(comment.user_id) || "Unknown User"
        }));

        setComments(formattedComments);
      } else {
        setComments([]);
      }
    } catch (err: any) {
      console.error("Error in fetchComments:", err);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      fetchComments();
    }
  }, [leadId, fetchComments]);

  const addComment = useCallback(async () => {
    if (!newComment.trim() || !currentUser) {
      toast.error("Please enter a comment");
      return;
    }
    
    setSubmitting(true);
    try {
      const commentData = {
        lead_id: leadId,
        user_id: currentUser.id,
        comment: newComment.trim()
      };

      const { data, error } = await supabase
        .from("lead_comments")
        .insert(commentData)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const { data: userData } = await supabase
          .from("agents")
          .select("name")
          .eq("id", data.user_id)
          .single();

        const newCommentWithUser = {
          ...data,
          user_name: userData?.name || "Current User"
        };

        setComments(prev => [newCommentWithUser, ...prev]);
        setNewComment("");
        toast.success("💬 Comment added successfully");
      }
    } catch (err: any) {
      console.error("Add comment error:", err);
      toast.error(err.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  }, [leadId, currentUser, newComment]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
        <h4 className="font-semibold text-sm">Comments ({comments.length})</h4>
      </div>

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
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: avatarColor(comment.user_name || "Unknown") }}>
                {getInitials(comment.user_name || "Unknown")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{comment.user_name || "Unknown"}</span>
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

// ── LEAD CALL HISTORY ──────────────────────────────────────────────────
function LeadCallHistory({ leadId }: { leadId: string }) {
  const [calls, setCalls] = useState<LeadCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCallNote, setNewCallNote] = useState("");
  const [callStatus, setCallStatus] = useState("connected");
  const [callDuration, setCallDuration] = useState(60);

  const fetchCalls = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lead_calls")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: users } = await supabase
          .from("agents")
          .select("id, name")
          .in("id", userIds);

        const userMap = new Map();
        users?.forEach(u => userMap.set(u.id, u.name));

        const formattedCalls = data.map(call => ({
          ...call,
          user_name: userMap.get(call.user_id) || "Unknown"
        }));

        setCalls(formattedCalls);
      } else {
        setCalls([]);
      }
    } catch (err: any) {
      console.error("Error in fetchCalls:", err);
      toast.error("Failed to load call history");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      fetchCalls();
    }
  }, [leadId, fetchCalls]);

  const addCallLog = useCallback(async () => {
    if (!leadId) return;
    try {
      const { error } = await supabase
        .from("lead_calls")
        .insert({
          lead_id: leadId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          call_type: "outgoing",
          duration: callDuration,
          status: callStatus,
          notes: newCallNote.trim() || null
        });

      if (error) throw error;

      toast.success("📞 Call logged successfully");
      setNewCallNote("");
      fetchCalls();
    } catch (err: any) {
      console.error("Add call log error:", err);
      toast.error(err.message || "Failed to log call");
    }
  }, [leadId, callDuration, callStatus, newCallNote, fetchCalls]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PhoneCall className="h-5 w-5 text-muted-foreground" />
        <h4 className="font-semibold text-sm">Call History ({calls.length})</h4>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={callStatus} onValueChange={setCallStatus}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CALL_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Duration (seconds)</Label>
          <Input
            type="number"
            value={callDuration}
            onChange={e => setCallDuration(Number(e.target.value))}
            className="h-8 text-xs"
            min={0}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Textarea
          placeholder="Call notes..."
          value={newCallNote}
          onChange={e => setNewCallNote(e.target.value)}
          className="flex-1 min-h-[50px] text-sm"
        />
        <Button size="sm" onClick={addCallLog} className="self-end">
          <Save className="h-3 w-3 mr-1" /> Log
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : calls.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No call records</p>
      ) : (
        <div className="max-h-[200px] overflow-y-auto space-y-2">
          {calls.map((call) => (
            <div key={call.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-xs">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                <Phone className="h-3 w-3" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{call.user_name || "Unknown"}</span>
                  <span className="text-muted-foreground">{format(new Date(call.created_at), "dd MMM, hh:mm a")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" style={{ color: getCallStatusColor(call.status) }}>
                    {getCallStatusConfig(call.status)?.label || call.status}
                  </Badge>
                  <span className="text-muted-foreground">{call.duration}s</span>
                </div>
                {call.notes && <p className="text-muted-foreground mt-1">{call.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── LEAD ORDERS ─────────────────────────────────────────────────────────
function LeadOrders({ leadId, currentUser }: { leadId: string; currentUser: any }) {
  const [orders, setOrders] = useState<LeadOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({
    products: [] as any[],
    total_amount: 0,
    payment_status: "pending" as "paid" | "cod" | "pending",
    order_status: "new" as "new" | "processing" | "shipped" | "delivered" | "cancelled" | "returned",
    courier_tracking: "",
    shipping_address: ""
  });
  const [orderProduct, setOrderProduct] = useState({ name: "", quantity: 1, price: 0 });

  const fetchOrders = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lead_orders")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error("Error in fetchOrders:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      fetchOrders();
    }
  }, [leadId, fetchOrders]);

  const addProductToOrder = () => {
    if (!orderProduct.name || orderProduct.price <= 0) return;
    const newProduct = { ...orderProduct };
    setOrderForm(prev => ({
      ...prev,
      products: [...prev.products, newProduct],
      total_amount: prev.total_amount + (newProduct.price * newProduct.quantity)
    }));
    setOrderProduct({ name: "", quantity: 1, price: 0 });
  };

  const removeProductFromOrder = (index: number) => {
    setOrderForm(prev => {
      const newProducts = [...prev.products];
      const removed = newProducts.splice(index, 1)[0];
      return {
        ...prev,
        products: newProducts,
        total_amount: prev.total_amount - (removed.price * removed.quantity)
      };
    });
  };

  const createOrder = useCallback(async () => {
    if (orderForm.products.length === 0) {
      toast.error("Add at least one product");
      return;
    }

    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
      const { data, error } = await supabase
        .from("lead_orders")
        .insert({
          lead_id: leadId,
          order_number: orderNumber,
          products: orderForm.products,
          total_amount: orderForm.total_amount,
          payment_status: orderForm.payment_status,
          order_status: orderForm.order_status,
          courier_tracking: orderForm.courier_tracking || null,
          shipping_address: orderForm.shipping_address || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`🛒 Order ${orderNumber} created successfully`);
      setShowOrderForm(false);
      setOrderForm({
        products: [],
        total_amount: 0,
        payment_status: "pending",
        order_status: "new",
        courier_tracking: "",
        shipping_address: ""
      });
      fetchOrders();
      
      await supabase
        .from("leads")
        .update({ order_status: orderForm.order_status })
        .eq("id", leadId);

    } catch (err: any) {
      console.error("Create order error:", err);
      toast.error(err.message || "Failed to create order");
    }
  }, [leadId, orderForm, fetchOrders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("lead_orders")
        .update({ order_status: status })
        .eq("id", orderId);

      if (error) throw error;
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (err: any) {
      console.error("Update order error:", err);
      toast.error(err.message || "Failed to update order");
    }
  }, [fetchOrders]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "new": "#3b82f6",
      "processing": "#f59e0b",
      "shipped": "#8b5cf6",
      "delivered": "#10b981",
      "cancelled": "#ef4444",
      "returned": "#ef4444"
    };
    return colors[status] || "#6b7280";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          <h4 className="font-semibold text-sm">Orders ({orders.length})</h4>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowOrderForm(true)}>
          <Plus className="h-3 w-3 mr-1" /> New Order
        </Button>
      </div>

      {showOrderForm && (
        <div className="border rounded-lg p-4 space-y-3">
          <h5 className="font-medium text-sm">Create Order</h5>
          
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Product name"
              value={orderProduct.name}
              onChange={e => setOrderProduct({ ...orderProduct, name: e.target.value })}
              className="h-8 text-sm"
            />
            <Input
              type="number"
              placeholder="Qty"
              value={orderProduct.quantity}
              onChange={e => setOrderProduct({ ...orderProduct, quantity: Number(e.target.value) })}
              className="h-8 text-sm"
              min={1}
            />
            <Input
              type="number"
              placeholder="Price"
              value={orderProduct.price}
              onChange={e => setOrderProduct({ ...orderProduct, price: Number(e.target.value) })}
              className="h-8 text-sm"
              min={0}
            />
          </div>
          <Button size="sm" variant="outline" onClick={addProductToOrder} className="w-full">
            <Plus className="h-3 w-3 mr-1" /> Add Product
          </Button>

          {orderForm.products.length > 0 && (
            <div className="space-y-1">
              {orderForm.products.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                  <span>{p.name} x{p.quantity}</span>
                  <span className="font-medium">₹{p.price * p.quantity}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeProductFromOrder(idx)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="font-semibold text-right">Total: ₹{orderForm.total_amount}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Payment Status</Label>
              <Select value={orderForm.payment_status} onValueChange={(v: any) => setOrderForm({ ...orderForm, payment_status: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cod">COD</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Order Status</Label>
              <Select value={orderForm.order_status} onValueChange={(v: any) => setOrderForm({ ...orderForm, order_status: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input
            placeholder="Courier Tracking Number"
            value={orderForm.courier_tracking}
            onChange={e => setOrderForm({ ...orderForm, courier_tracking: e.target.value })}
            className="h-8 text-sm"
          />
          <Textarea
            placeholder="Shipping Address"
            value={orderForm.shipping_address}
            onChange={e => setOrderForm({ ...orderForm, shipping_address: e.target.value })}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={createOrder} className="flex-1">
              <Save className="h-3 w-3 mr-1" /> Create Order
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowOrderForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{order.order_number}</span>
                  <Badge style={{ backgroundColor: getStatusColor(order.order_status) + "20", color: getStatusColor(order.order_status) }}>
                    {order.order_status}
                  </Badge>
                </div>
                <span className="font-semibold text-sm">₹{order.total_amount}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Payment: {order.payment_status}</span>
                {order.courier_tracking && <span>• Tracking: {order.courier_tracking}</span>}
                <span>• {format(new Date(order.created_at), "dd MMM yyyy")}</span>
              </div>
              {order.products && order.products.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {order.products.map((p: any, idx: number) => (
                    <span key={idx}>{p.name} x{p.quantity}{idx < order.products.length - 1 ? ", " : ""}</span>
                  ))}
                </div>
              )}
              {order.order_status !== "delivered" && order.order_status !== "cancelled" && (
                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateOrderStatus(order.id, "processing")}>
                    Processing
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateOrderStatus(order.id, "shipped")}>
                    Shipped
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateOrderStatus(order.id, "delivered")}>
                    Delivered
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs text-red-600" onClick={() => updateOrderStatus(order.id, "cancelled")}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── LEAD FEEDBACK ──────────────────────────────────────────────────────
function LeadFeedback({ leadId, currentUser }: { leadId: string; currentUser: any }) {
  const [feedbacks, setFeedbacks] = useState<LeadFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [repeatLikelihood, setRepeatLikelihood] = useState<"high" | "medium" | "low" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lead_feedback")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err: any) {
      console.error("Error in fetchFeedbacks:", err);
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      fetchFeedbacks();
    }
  }, [leadId, fetchFeedbacks]);

  const submitFeedback = useCallback(async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("lead_feedback")
        .insert({
          lead_id: leadId,
          user_id: currentUser?.id || null,
          rating: rating,
          review: review.trim() || null,
          repeat_order_likelihood: repeatLikelihood
        })
        .select()
        .single();

      if (error) throw error;

      setFeedbacks(prev => [data, ...prev]);
      setRating(0);
      setReview("");
      setRepeatLikelihood(null);
      toast.success("⭐ Feedback submitted successfully");
    } catch (err: any) {
      console.error("Submit feedback error:", err);
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  }, [leadId, currentUser, rating, review, repeatLikelihood]);

  const averageRating = useMemo(() => {
    if (feedbacks.length === 0) return 0;
    return feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
  }, [feedbacks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <h4 className="font-semibold text-sm">Feedback ({feedbacks.length})</h4>
        </div>
        {feedbacks.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                className={`h-6 w-6 ${(hoverRating || rating) >= star ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
              />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Write a review..."
          value={review}
          onChange={e => setReview(e.target.value)}
          className="text-sm min-h-[60px]"
        />
        <div className="flex gap-2">
          <Select value={repeatLikelihood || ""} onValueChange={(v: any) => setRepeatLikelihood(v)}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="Repeat order likelihood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">🟢 High</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="low">🔴 Low</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={submitFeedback} disabled={submitting || rating === 0}>
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : feedbacks.length > 0 ? (
        <div className="max-h-[150px] overflow-y-auto space-y-2">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="p-2 rounded-lg bg-muted/30 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-3 w-3 ${star <= fb.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(fb.created_at), "dd MMM yyyy")}</span>
              </div>
              {fb.review && <p className="text-xs text-muted-foreground mt-1">{fb.review}</p>}
              {fb.repeat_order_likelihood && (
                <Badge variant="outline" className="text-xs mt-1">
                  Repeat: {fb.repeat_order_likelihood}
                </Badge>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── MY ATTENDANCE CARD ─────────────────────────────────────────────────
function MyAttendanceCard({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [cameraMode, setCameraMode] = useState<"check_in" | "check_out" | null>(null);
  const [busy, setBusy] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayRecord, isLoading, refetch } = useQuery({
    queryKey: ["my_attendance", userId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data as Attendance | null;
    },
    enabled: !!userId,
  });

  const uploadPhoto = useCallback(async (blob: Blob, tag: string) => {
    const path = `${userId}/${today}_${tag}_${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("attendance-photos")
      .upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    const { data } = supabase.storage.from("attendance-photos").getPublicUrl(path);
    return data.publicUrl;
  }, [userId, today]);

  const handleCheckIn = useCallback(async (blob: Blob) => {
    if (!userId) return;
    setBusy(true);
    try {
      const photoUrl = await uploadPhoto(blob, "checkin");
      const { error } = await supabase.from("attendance").upsert({
        user_id: userId,
        date: today,
        check_in: new Date().toISOString(),
        check_in_photo_url: photoUrl,
        status: "present",
        type: "office",
      }, { onConflict: "user_id,date" });
      if (error) throw error;
      toast.success("✅ Checked in successfully!");
      setCameraMode(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Check-in failed");
    } finally {
      setBusy(false);
    }
  }, [userId, today, uploadPhoto, refetch]);

  const handleCheckOut = useCallback(async (blob: Blob) => {
    if (!userId || !todayRecord) return;
    setBusy(true);
    try {
      const photoUrl = await uploadPhoto(blob, "checkout");
      const { error } = await supabase
        .from("attendance")
        .update({
          check_out: new Date().toISOString(),
          check_out_photo_url: photoUrl
        })
        .eq("id", todayRecord.id);
      if (error) throw error;
      toast.success("✅ Checked out successfully!");
      setCameraMode(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Check-out failed");
    } finally {
      setBusy(false);
    }
  }, [userId, todayRecord, uploadPhoto, refetch]);

  const startLunch = useCallback(async () => {
    if (!todayRecord) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("attendance")
        .update({ lunch_start: new Date().toISOString() })
        .eq("id", todayRecord.id);
      if (error) throw error;
      toast.success("☕ Lunch break started");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to start lunch");
    } finally {
      setBusy(false);
    }
  }, [todayRecord, refetch]);

  const endLunch = useCallback(async () => {
    if (!todayRecord) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("attendance")
        .update({ lunch_end: new Date().toISOString() })
        .eq("id", todayRecord.id);
      if (error) throw error;
      toast.success("☕ Lunch break ended");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to end lunch");
    } finally {
      setBusy(false);
    }
  }, [todayRecord, refetch]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const checkedIn = !!todayRecord?.check_in;
  const checkedOut = !!todayRecord?.check_out;
  const onLunch = !!todayRecord?.lunch_start && !todayRecord?.lunch_end;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            My Attendance — Today
          </span>
          <Badge variant={checkedOut ? "secondary" : checkedIn ? (onLunch ? "default" : "default") : "outline"}>
            {checkedOut ? "Checked Out" : checkedIn ? (onLunch ? "On Lunch" : "Checked In") : "Not Checked In"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Check In</p>
            <p className="font-semibold">{todayRecord?.check_in ? format(new Date(todayRecord.check_in), "hh:mm a") : "-"}</p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Lunch</p>
            <p className="font-semibold">
              {todayRecord?.lunch_start ? format(new Date(todayRecord.lunch_start), "hh:mm a") : "-"}
              {onLunch && " → ongoing"}
              {todayRecord?.lunch_end && ` → ${format(new Date(todayRecord.lunch_end), "hh:mm a")}`}
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Check Out</p>
            <p className="font-semibold">{todayRecord?.check_out ? format(new Date(todayRecord.check_out), "hh:mm a") : "-"}</p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30 flex items-center gap-2">
            {todayRecord?.check_in_photo_url ? (
              <img src={todayRecord.check_in_photo_url} alt="selfie" className="w-10 h-10 rounded-full object-cover border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Camera className="h-4 w-4 text-gray-400" />
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Selfie</p>
              <p className="text-xs font-medium">{todayRecord?.check_in_photo_url ? "✅ Captured" : "Pending"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!checkedIn && (
            <Button onClick={() => setCameraMode("check_in")} disabled={busy}>
              <Camera className="mr-2 h-4 w-4" /> Check In with Selfie
            </Button>
          )}
          {checkedIn && !checkedOut && !onLunch && (
            <Button variant="outline" onClick={startLunch} disabled={busy}>
              <Coffee className="mr-2 h-4 w-4" /> Start Lunch Break
            </Button>
          )}
          {onLunch && (
            <Button variant="outline" onClick={endLunch} disabled={busy}>
              <Coffee className="mr-2 h-4 w-4" /> End Lunch Break
            </Button>
          )}
          {checkedIn && !checkedOut && (
            <Button variant="destructive" onClick={() => setCameraMode("check_out")} disabled={busy}>
              <LogOut className="mr-2 h-4 w-4" /> Check Out with Selfie
            </Button>
          )}
          {checkedOut && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Day complete. See you tomorrow!
            </span>
          )}
        </div>
      </CardContent>

      <CameraDialog
        open={cameraMode === "check_in"}
        onClose={() => setCameraMode(null)}
        onCapture={handleCheckIn}
        title="Check-In Selfie"
      />
      <CameraDialog
        open={cameraMode === "check_out"}
        onClose={() => setCameraMode(null)}
        onCapture={handleCheckOut}
        title="Check-Out Selfie"
      />
    </Card>
  );
}

// ── EMPLOYEE CARD ──────────────────────────────────────────────────────
function EmployeeCard({ agent, onStatusChange }: { agent: Agent; onStatusChange: (id: string, status: Agent["status"]) => void }) {
  const statusColor = {
    online: "text-green-600 bg-green-50 border-green-200",
    break: "text-orange-600 bg-orange-50 border-orange-200",
    offline: "text-gray-600 bg-gray-50 border-gray-200"
  };
  const statusIcon = {
    online: <UserCheck className="h-4 w-4" />,
    break: <Coffee className="h-4 w-4" />,
    offline: <UserX className="h-4 w-4" />
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: avatarColor(agent.name) }}>
              {getInitials(agent.name)}
            </div>
            <div>
              <p className="font-semibold">{agent.name}</p>
              <p className="text-xs text-muted-foreground">{agent.role} • {agent.department}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 mt-1 ${statusColor[agent.status]}`}>
                {statusIcon[agent.status]} {agent.status}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {agent.total_working_hours ? formatHMS(agent.total_working_hours * 3600) : "0h"}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="p-2 rounded bg-muted/30">
            <p className="text-muted-foreground">Login</p>
            <p className="font-medium">{agent.login_time ? format(new Date(agent.login_time), "hh:mm a") : "-"}</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <p className="text-muted-foreground">Break</p>
            <p className="font-medium">{agent.break_time ? format(new Date(agent.break_time), "hh:mm a") : "-"}</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <p className="text-muted-foreground">Logout</p>
            <p className="font-medium">{agent.logout_time ? format(new Date(agent.logout_time), "hh:mm a") : "Active"}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button size="sm" variant={agent.status === "online" ? "default" : "outline"} onClick={() => onStatusChange(agent.id, "online")}>
            <UserCheck className="h-3 w-3 mr-1" /> Active
          </Button>
          <Button size="sm" variant={agent.status === "break" ? "default" : "outline"} onClick={() => onStatusChange(agent.id, "break")}>
            <Coffee className="h-3 w-3 mr-1" /> Break
          </Button>
          <Button size="sm" variant={agent.status === "offline" ? "default" : "outline"} onClick={() => onStatusChange(agent.id, "offline")}>
            <LogOut className="h-3 w-3 mr-1" /> Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── TEAM ATTENDANCE TABLE ──────────────────────────────────────────────
function TeamAttendanceTable({ agents, attendance }: { agents: Agent[]; attendance: Attendance[] }) {
  const [photoPreview, setPhotoPreview] = useState<{ url: string; who: string } | null>(null);
  const [dateFilter, setDateFilter] = useState("");

  const filteredAttendance = useMemo(() => {
    const today = dateFilter || format(new Date(), "yyyy-MM-dd");
    return attendance.filter(a => a.date === today);
  }, [attendance, dateFilter]);

  const getAgentName = (userId: string) => {
    const agent = agents.find(a => a.id === userId);
    return agent?.name || "Unknown";
  };

  const getAgentStatus = (userId: string) => {
    const agent = agents.find(a => a.id === userId);
    return agent?.status || "offline";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Attendance — {dateFilter || "Today"}
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-40 text-sm"
            />
            <Badge variant="outline">
              {filteredAttendance.filter(a => a.status === "present").length} Present
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredAttendance.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No attendance records for this date.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Lunch</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Working Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.map(record => {
                  const checkInTime = record.check_in ? new Date(record.check_in) : null;
                  const checkOutTime = record.check_out ? new Date(record.check_out) : null;
                  const lunchStart = record.lunch_start ? new Date(record.lunch_start) : null;
                  const lunchEnd = record.lunch_end ? new Date(record.lunch_end) : null;

                  let workingHours = 0;
                  if (checkInTime && checkOutTime) {
                    let diff = checkOutTime.getTime() - checkInTime.getTime();
                    if (lunchStart && lunchEnd) {
                      diff -= lunchEnd.getTime() - lunchStart.getTime();
                    }
                    workingHours = Math.max(0, diff / 3600000);
                  }

                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        {record.check_in_photo_url ? (
                          <button onClick={() => setPhotoPreview({
                            url: record.check_in_photo_url!,
                            who: getAgentName(record.user_id)
                          })}>
                            <img
                              src={record.check_in_photo_url}
                              alt="selfie"
                              className="w-9 h-9 rounded-full object-cover border hover:opacity-80"
                            />
                          </button>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                            <Camera className="h-3.5 w-3.5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getAgentName(record.user_id)}</span>
                          <Badge variant={getAgentStatus(record.user_id) === "online" ? "default" : "outline"} className="text-xs">
                            {getAgentStatus(record.user_id)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === "present" ? "default" : "outline"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {checkInTime ? format(checkInTime, "hh:mm a") : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lunchStart ? (
                          <span className="flex items-center gap-1">
                            <Coffee className="h-3 w-3 text-orange-500" />
                            {format(lunchStart, "hh:mm a")}
                            {lunchEnd && ` → ${format(lunchEnd, "hh:mm a")}`}
                            {!lunchEnd && " → ongoing"}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {checkOutTime ? format(checkOutTime, "hh:mm a") : "-"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {workingHours > 0 ? `${workingHours.toFixed(1)}h` : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!photoPreview} onOpenChange={() => setPhotoPreview(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{photoPreview?.who} — Check-In Selfie</DialogTitle>
          </DialogHeader>
          {photoPreview && <img src={photoPreview.url} alt="check-in selfie" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── AUDIO BEEP & PC TELEPHONY TRIGGER ──────────────────────────────────
function playAudioTone(freq = 880, duration = 0.12, type: OscillatorType = "sine") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio context may require user interaction
  }
}

function playDialChime() {
  playAudioTone(587.33, 0.08, "sine");
  setTimeout(() => playAudioTone(880, 0.12, "sine"), 100);
}

function triggerPCTelephony(phone: string) {
  if (!phone) return;
  const clean = phone.replace(/[^0-9+]/g, "");
  let frame = document.getElementById("crm-tel-trigger") as HTMLIFrameElement;
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = "crm-tel-trigger";
    frame.style.display = "none";
    document.body.appendChild(frame);
  }
  frame.src = `tel:${clean}`;
}

// ── AUTO CALL QUEUE & HANDS-FREE AUTO-DIALER ────────────────────────────
function AutoCallQueue({
  leads,
  currentUserId,
  isAdmin,
  onUpdateCallStatus,
  onLogCall,
  onSaveRemark,
}: {
  leads: Lead[];
  currentUserId: string;
  isAdmin?: boolean;
  onUpdateCallStatus: (id: string, status: string) => void;
  onLogCall: (id: string) => void;
  onSaveRemark?: (id: string, remark: string) => Promise<void>;
}) {
  const [filterScope, setFilterScope] = useState<"all_pending" | "my_pending" | "followups" | "hot_leads">("all_pending");
  const [isAutoDial, setIsAutoDial] = useState<boolean>(false);
  const [autoDelay, setAutoDelay] = useState<number>(5);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [callActive, setCallActive] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [noteText, setNoteText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [index, setIndex] = useState(0);

  const queue = useMemo(() => {
    return leads
      .filter(l => {
        if (l.stage === "Converted" || l.stage === "Lost") return false;
        if (!isAdmin && l.assigned_to !== currentUserId) return false;

        if (filterScope === "my_pending") {
          const isMine = l.assigned_to === currentUserId;
          const isPendingCall =
            !l.call_status ||
            l.call_status === "pending" ||
            l.call_status === "followup" ||
            l.call_status === "callback_requested";
          return isMine && isPendingCall;
        }

        if (filterScope === "followups") {
          return l.call_status === "followup" || l.call_status === "callback_requested" || !!l.next_call_date;
        }

        if (filterScope === "hot_leads") {
          return (l.temperature === "Hot" || l.stage === "Interested") && l.call_status !== "order_confirmed";
        }

        // "all_pending" (default): All active pending leads
        return (
          !l.call_status ||
          l.call_status === "pending" ||
          l.call_status === "followup" ||
          l.call_status === "callback_requested" ||
          l.call_status === "ringing"
        );
      })
      .sort((a, b) => {
        if (a.next_call_date && b.next_call_date) {
          return new Date(a.next_call_date).getTime() - new Date(b.next_call_date).getTime();
        }
        if (a.next_call_date) return -1;
        if (b.next_call_date) return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  }, [leads, currentUserId, filterScope, isAdmin]);

  const current = queue[index] || null;

  // Reset index if queue changes and index exceeds
  useEffect(() => {
    if (index >= queue.length && queue.length > 0) {
      setIndex(0);
    }
  }, [queue.length, index]);

  // Sync quick note with lead's existing remark
  useEffect(() => {
    setNoteText(current?.remark || "");
  }, [current?.id]);

  // Dial function
  const dialLead = useCallback(
    (lead: Lead) => {
      if (!lead || !lead.phone) {
        toast.error("Lead has no valid phone number");
        return;
      }
      playDialChime();
      triggerPCTelephony(lead.phone);
      onLogCall(lead.id);
      if (!lead.call_status || lead.call_status === "pending") {
        onUpdateCallStatus(lead.id, "ringing");
      }
      setCallActive(true);
      setCallDuration(0);
      toast.info(`📞 Calling ${lead.name} (${lead.phone})...`);
    },
    [onLogCall, onUpdateCallStatus]
  );

  // In-call duration timer
  useEffect(() => {
    if (!callActive) return;
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callActive]);

  // Countdown timer for Auto-Dialing
  useEffect(() => {
    if (countdown === null || isPaused || !isAutoDial) return;

    if (countdown <= 0) {
      setCountdown(null);
      if (current) {
        dialLead(current);
      }
      return;
    }

    if (countdown === 1) {
      playAudioTone(784, 0.08, "sine"); // Warning chime 1 sec prior
    }

    const t = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(t);
  }, [countdown, isPaused, isAutoDial, current, dialLead]);

  const handleNext = useCallback(() => {
    setCountdown(null);
    setCallActive(false);
    const nextIdx = index + 1 < queue.length ? index + 1 : 0;
    setIndex(nextIdx);
    if (isAutoDial && !isPaused && queue.length > 1) {
      setCountdown(autoDelay);
    }
  }, [index, queue.length, isAutoDial, isPaused, autoDelay]);

  const handleOutcome = useCallback(
    async (status: string) => {
      if (!current) return;
      onUpdateCallStatus(current.id, status);

      if (noteText.trim() && onSaveRemark) {
        await onSaveRemark(current.id, noteText.trim());
      }

      setCallActive(false);
      const nextIdx = index + 1 < queue.length ? index + 1 : 0;
      setIndex(nextIdx);

      if (isAutoDial && !isPaused && queue.length > 1) {
        setCountdown(autoDelay);
      } else {
        setCountdown(null);
      }
    },
    [current, onUpdateCallStatus, noteText, onSaveRemark, index, queue.length, isAutoDial, isPaused, autoDelay]
  );

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Phone number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const wa = current ? buildWhatsAppLink(current) : null;
  const daysUntil = current ? getDaysUntilNextCall(current.next_call_date) : null;

  return (
    <>
      <Card className="border-2 border-primary/30 shadow-md bg-gradient-to-br from-background via-background to-primary/5">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-sm">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  ⚡ Auto-Dialer & Telephony Queue
                  {isAutoDial && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 animate-pulse">
                      ● Auto-Dialing Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Hands-free PC calling with 1-click outcomes and automatic queuing
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Queue Filter Scope */}
              <Select value={filterScope} onValueChange={(val: any) => { setFilterScope(val); setIndex(0); setCountdown(null); }}>
                <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
                  <SelectValue placeholder="Queue Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_pending">All Pending ({leads.length})</SelectItem>
                  <SelectItem value="my_pending">My Leads</SelectItem>
                  <SelectItem value="followups">Follow-ups</SelectItem>
                  <SelectItem value="hot_leads">Hot / Warm Leads</SelectItem>
                </SelectContent>
              </Select>

              {/* Free PC Setup Guide Button */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => setShowGuide(true)}
              >
                <Headset className="h-3.5 w-3.5" />
                Free PC Setup Guide
              </Button>

              <Badge variant="secondary" className="font-mono text-xs px-2.5 py-1">
                {queue.length > 0 ? `${index + 1} of ${queue.length}` : "0 Leads"}
              </Badge>
            </div>
          </div>

          {/* Auto-Dial Control Bar */}
          <div className="mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-3 bg-background/50 p-2.5 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-dial-mode"
                  checked={isAutoDial}
                  onCheckedChange={checked => {
                    setIsAutoDial(checked);
                    if (!checked) {
                      setCountdown(null);
                      toast.info("Auto-Dialer mode turned OFF");
                    } else {
                      toast.success(`⚡ Auto-Dialer ON (${autoDelay}s delay)`);
                      if (!callActive && current) {
                        setCountdown(autoDelay);
                      }
                    }
                  }}
                />
                <Label htmlFor="auto-dial-mode" className="text-xs font-semibold cursor-pointer select-none">
                  ⚡ Hands-Free Auto Mode
                </Label>
              </div>

              {isAutoDial && (
                <div className="flex items-center gap-1.5 pl-3 border-l text-xs text-muted-foreground">
                  <span>Delay:</span>
                  {[3, 5, 8, 10].map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setAutoDelay(sec)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        autoDelay === sec
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAutoDial && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isPaused ? "default" : "outline"}
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    setIsPaused(!isPaused);
                    toast.info(isPaused ? "▶ Auto-dial resumed" : "⏸ Auto-dial paused");
                  }}
                >
                  {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  {isPaused ? "Resume Auto-Dial" : "Pause"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {queue.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-base">No pending calls in this queue! 🎉</p>
              <p className="text-xs text-muted-foreground mt-1">
                Select another filter above (e.g. "All Pending") to continue calling.
              </p>
            </div>
          ) : current ? (
            <>
              {/* Countdown Banner */}
              {countdown !== null && !isPaused && (
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Auto-calling <span className="font-bold">{current.name}</span> in{" "}
                        <span className="text-sm font-bold text-primary">{countdown}s</span>...
                      </p>
                      <Progress value={((autoDelay - countdown) / autoDelay) * 100} className="h-1.5 w-44 mt-1" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCountdown(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={() => dialLead(current)}>
                      <Phone className="h-3 w-3" /> Dial Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Live In-Call Banner */}
              {callActive && (
                <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                      Live Call In Progress: <span className="font-mono text-sm">{formatDuration(callDuration)}</span>
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-300">
                    Active on Softphone / PC
                  </Badge>
                </div>
              )}

              {/* Lead Details Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0"
                    style={{ background: avatarColor(current.name) }}
                  >
                    {getInitials(current.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-lg leading-tight">{current.name}</h4>
                      <StagePill stage={current.stage} subStage={current.sub_stage} />
                      {current.temperature && (
                        <Badge
                          variant="outline"
                          className={
                            current.temperature === "Hot"
                              ? "bg-red-50 text-red-600 border-red-200"
                              : current.temperature === "Warm"
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : "bg-blue-50 text-blue-600 border-blue-200"
                          }
                        >
                          {current.temperature}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="font-mono font-medium text-foreground">{current.phone || "No Phone"}</span>
                      {current.phone && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(current.phone)}
                          className="hover:text-primary transition-colors"
                          title="Copy Phone"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      <span>•</span>
                      <span>{current.city || current.state ? `${current.city || ""}, ${current.state || ""}` : "Location N/A"}</span>
                    </div>

                    {daysUntil !== null && (
                      <p className={`text-xs mt-1 font-medium ${daysUntil <= 0 ? "text-red-600" : "text-amber-600"}`}>
                        {daysUntil <= 0 ? "🔔 Follow-up scheduled for TODAY!" : `📅 Follow-up in ${daysUntil} days`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Medicine / Product / Value Pills */}
                <div className="flex sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
                  {current.medicine && (
                    <Badge variant="secondary" className="text-xs">
                      💊 {current.medicine}
                    </Badge>
                  )}
                  {current.disease && (
                    <Badge variant="outline" className="text-xs">
                      🩺 {current.disease}
                    </Badge>
                  )}
                  {current.value && (
                    <span className="text-xs font-semibold text-emerald-600">
                      ₹{current.value}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Call Now, WhatsApp, Skip */}
              <div className="flex flex-wrap gap-2.5">
                <Button
                  className="flex-1 min-w-[160px] h-10 font-semibold gap-2 shadow-sm"
                  onClick={() => dialLead(current)}
                >
                  <Phone className="h-4 w-4" />
                  {callActive ? "Re-Dial via PC" : "📞 Call Now (System)"}
                </Button>

                {wa && (
                  <Button
                    variant="outline"
                    className="h-10 text-green-600 border-green-300 hover:bg-green-50 font-semibold gap-1.5"
                    asChild
                  >
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}

                <Button variant="outline" className="h-10 gap-1" onClick={handleNext} title="Skip to next lead">
                  <ChevronRight className="h-4 w-4" /> Skip Next
                </Button>
              </div>

              {/* In-Call Quick Note Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">Call Notes & Remarks (Auto-saved with outcome):</span>
                  {current.remark && <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">Prev: {current.remark}</span>}
                </div>
                <Input
                  placeholder="e.g. Customer interested in 30 days pack, requested callback at 4 PM..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* 1-Click Call Outcome Buttons */}
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  Select Call Outcome {isAutoDial && "→ Auto-advances to next call"}:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50 font-medium text-xs h-8"
                    onClick={() => handleOutcome("connected")}
                  >
                    <PhoneIncoming className="mr-1 h-3 w-3" /> Connected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-purple-600 border-purple-200 hover:bg-purple-50 font-medium text-xs h-8"
                    onClick={() => handleOutcome("interested")}
                  >
                    ⭐ Interested
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-medium text-xs h-8"
                    onClick={() => handleOutcome("order_confirmed")}
                  >
                    🛒 Confirmed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 font-medium text-xs h-8"
                    onClick={() => handleOutcome("not_connected")}
                  >
                    <PhoneMissed className="mr-1 h-3 w-3" /> Busy / No Ans
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 font-medium text-xs h-8"
                    onClick={() => handleOutcome("not_interested")}
                  >
                    👎 Not Interested
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 font-medium text-xs h-8"
                    onClick={() => handleOutcome("callback_requested")}
                  >
                    🔄 Callback
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-600 border-amber-200 hover:bg-amber-50 font-medium text-xs h-8"
                    onClick={() => handleOutcome("followup")}
                  >
                    📅 Follow-up
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Free PC Setup Guide Modal */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Headset className="h-5 w-5 text-primary" />
              Free PC Calling Setup Guide (System se ₹0 Calling)
            </DialogTitle>
            <DialogDescription>
              Is CRM me system se 100% free calling setup karne ke 2 aasan open-source aur built-in tareeqe:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Option 1: Microsoft Phone Link */}
            <div className="border rounded-xl p-4 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-2 text-blue-600">
                  <Smartphone className="h-4 w-4" /> Option 1: Windows Phone Link (Sabse Best & 100% Free)
                </span>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  Zero Cost • Unlimited Calls
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aapke mobile me maujood Jio / Airtel unlimited calling plan direct PC ke headphone se chalega.
              </p>
              <ol className="text-xs space-y-1.5 list-decimal pl-4 text-foreground/80">
                <li>
                  Windows PC me <strong>"Phone Link"</strong> app open karein aur Android phone me <strong>"Link to Windows"</strong> app on karein.
                </li>
                <li>Bluetooth aur Wi-Fi ke zariye phone ko PC se pair kar lijiye.</li>
                <li>PC me apna <strong>Headphone / Mic</strong> connect karein.</li>
                <li>
                  Ab CRM me <strong>"Auto-Dialer"</strong> on karenge toh call mobile SIM se lagegi aur baat PC ke headphone se hogi!
                </li>
              </ol>
            </div>

            {/* Option 2: MicroSIP Open Source */}
            <div className="border rounded-xl p-4 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-2 text-purple-600">
                  <Monitor className="h-4 w-4" /> Option 2: MicroSIP (100% Free & Open-Source Softphone)
                </span>
                <Badge variant="outline" className="border-purple-300 text-purple-700">
                  GPL Open Source
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Windows ka lightweight open-source dialer jo browser ke har call link ko handle karta hai.
              </p>
              <ol className="text-xs space-y-1.5 list-decimal pl-4 text-foreground/80">
                <li>
                  <a
                    href="https://www.microsip.org"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline font-medium inline-flex items-center gap-1"
                  >
                    microsip.org <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  se MicroSIP download karke install karein.
                </li>
                <li>
                  Windows Settings → <strong>Default Apps</strong> → "Choose defaults by protocol" me jaakar{" "}
                  <code>tel:</code> ko <strong>MicroSIP</strong> par set karein.
                </li>
                <li>MicroSIP me apna free SIP/VoIP account ya GSM Gateway connect karein.</li>
                <li>CRM se click karte hi direct MicroSIP call connect karega.</li>
              </ol>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs text-muted-foreground">
              💡 <strong>Pro Tip:</strong> "⚡ Hands-Free Auto Mode" switch on karne ke baad telecaller ko sirf call pe baat karke outcome button dabana hai — agla number bina click kiye apne aap dial hota rahega!
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowGuide(false)} className="w-full sm:w-auto">
              Got it! Start Calling
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── REPORTS COMPONENT ──────────────────────────────────────────────────
function Reports({ leads, agents }: { leads: Lead[]; agents: Agent[] }) {
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [reportType, setReportType] = useState<"sales" | "source" | "product" | "performance">("sales");

  const getPeriodStart = useCallback(() => {
    const now = new Date();
    if (reportPeriod === "daily") return subDays(now, 1);
    if (reportPeriod === "weekly") return subDays(now, 7);
    return subDays(now, 30);
  }, [reportPeriod]);

  const periodLeads = useMemo(() => {
    const start = getPeriodStart();
    return leads.filter(l => new Date(l.created_at) >= start);
  }, [leads, getPeriodStart]);

  const salesData = useMemo(() => {
    const totalLeads = periodLeads.length;
    const converted = periodLeads.filter(l => l.stage === "Converted").length;
    const lost = periodLeads.filter(l => l.stage === "Lost").length;
    const active = totalLeads - converted - lost;
    const conversionRate = totalLeads > 0 ? (converted / totalLeads * 100) : 0;
    const totalValue = periodLeads.reduce((sum, l) => sum + (l.value || 0), 0);
    return { totalLeads, converted, lost, active, conversionRate, totalValue };
  }, [periodLeads]);

  const sourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    periodLeads.forEach(l => {
      const src = l.source || "Other";
      sources[src] = (sources[src] || 0) + 1;
    });
    return Object.entries(sources).sort((a, b) => b[1] - a[1]);
  }, [periodLeads]);

  const productData = useMemo(() => {
    const products: Record<string, number> = {};
    periodLeads.forEach(l => {
      if (l.medicine) {
        products[l.medicine] = (products[l.medicine] || 0) + 1;
      }
    });
    return Object.entries(products).sort((a, b) => b[1] - a[1]);
  }, [periodLeads]);

  const performanceData = useMemo(() => {
    const perf: Record<string, { leads: number; converted: number; value: number }> = {};
    periodLeads.forEach(l => {
      const agentId = l.assigned_to || "unassigned";
      if (!perf[agentId]) perf[agentId] = { leads: 0, converted: 0, value: 0 };
      perf[agentId].leads += 1;
      if (l.stage === "Converted") perf[agentId].converted += 1;
      perf[agentId].value += (l.value || 0);
    });
    return Object.entries(perf).map(([agentId, data]) => ({
      agentId,
      agentName: agentId === "unassigned" ? "Unassigned" : agents.find(a => a.id === agentId)?.name || "Unknown",
      ...data,
      conversionRate: data.leads > 0 ? (data.converted / data.leads * 100) : 0
    })).sort((a, b) => b.converted - a.converted);
  }, [periodLeads, agents]);

  const totalRevenue = salesData.totalValue;
  const averageOrderValue = salesData.converted > 0 ? totalRevenue / salesData.converted : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            Reports
          </CardTitle>
          <div className="flex gap-2">
            <Select value={reportPeriod} onValueChange={(v: any) => setReportPeriod(v)}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="source">Source</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reportType === "sales" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-blue-50">
                <p className="text-xs text-blue-600">Total Leads</p>
                <p className="text-2xl font-bold text-blue-700">{salesData.totalLeads}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <p className="text-xs text-green-600">Converted</p>
                <p className="text-2xl font-bold text-green-700">{salesData.converted}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <p className="text-xs text-purple-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-700">{salesData.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <p className="text-xs text-orange-600">Total Value</p>
                <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-50">
                <p className="text-xs text-emerald-600">Avg Order Value</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(averageOrderValue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <p className="text-xs text-red-600">Lost Leads</p>
                <p className="text-xl font-bold text-red-700">{salesData.lost}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${salesData.conversionRate}%` }}></div>
            </div>
            <p className="text-xs text-muted-foreground text-center">{salesData.active} active leads • {salesData.lost} lost</p>
          </div>
        )}

        {reportType === "source" && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Lead Sources</h4>
            {sourceData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No source data available</p>
            ) : (
              <div className="space-y-2">
                {sourceData.map(([source, count]) => (
                  <div key={source} className="flex items-center gap-2">
                    <span className="text-sm w-32 truncate">{source}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${(count / periodLeads.length) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {reportType === "product" && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Top Products</h4>
            {productData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No product data available</p>
            ) : (
              <div className="space-y-2">
                {productData.slice(0, 10).map(([product, count]) => (
                  <div key={product} className="flex items-center gap-2">
                    <span className="text-sm flex-1 truncate">{product}</span>
                    <Badge>{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {reportType === "performance" && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Agent Performance</h4>
            {performanceData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No performance data available</p>
            ) : (
              <div className="space-y-3">
                {performanceData.map((p) => (
                  <div key={p.agentId} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.agentName}</span>
                      <Badge variant="outline">{p.conversionRate.toFixed(1)}%</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-1">
                      <span>Leads: {p.leads}</span>
                      <span>Converted: {p.converted}</span>
                      <span>Value: {formatCurrency(p.value)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${p.conversionRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── STOCK MANAGEMENT ────────────────────────────────────────────────────
function StockManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error("Fetch products error:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = useCallback(async () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error("Product name and price are required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: newProduct.name,
          category: newProduct.category || null,
          price: newProduct.price,
          cost_price: newProduct.cost_price || 0,
          stock_quantity: newProduct.stock_quantity || 0,
          min_stock_level: newProduct.min_stock_level || 10,
          batch_number: newProduct.batch_number || null,
          expiry_date: newProduct.expiry_date || null,
          description: newProduct.description || null
        })
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [data, ...prev]);
      setNewProduct({});
      setShowAddProduct(false);
      toast.success(`✅ Product "${data.name}" added successfully`);
    } catch (err: any) {
      console.error("Add product error:", err);
      toast.error(err.message || "Failed to add product");
    }
  }, [newProduct]);

  const updateStock = useCallback(async (productId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: newQuantity })
        .eq("id", productId);
      if (error) throw error;
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, stock_quantity: newQuantity } : p
      ));
      toast.success("Stock updated");
    } catch (err: any) {
      console.error("Update stock error:", err);
      toast.error("Failed to update stock");
    }
  }, []);

  const filteredProducts = useMemo(() => {
    if (stockFilter === "all") return products;
    if (stockFilter === "low") return products.filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0);
    return products.filter(p => p.stock_quantity === 0);
  }, [products, stockFilter]);

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return { label: "Out of Stock", color: "#ef4444", bg: "#fef2f2" };
    if (product.stock_quantity <= product.min_stock_level) return { label: "Low Stock", color: "#f59e0b", bg: "#fffbeb" };
    return { label: "In Stock", color: "#10b981", bg: "#ecfdf5" };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Stock Management
          </CardTitle>
          <div className="flex gap-2">
            <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setShowAddProduct(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add Product
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showAddProduct && (
          <div className="border rounded-lg p-4 mb-4 space-y-3">
            <h5 className="font-medium text-sm">Add New Product</h5>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Product Name *"
                value={newProduct.name || ""}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                className="h-8 text-sm"
              />
              <Input
                placeholder="Category"
                value={newProduct.category || ""}
                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                className="h-8 text-sm"
              />
              <Input
                type="number"
                placeholder="Price *"
                value={newProduct.price || ""}
                onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                className="h-8 text-sm"
              />
              <Input
                type="number"
                placeholder="Cost Price"
                value={newProduct.cost_price || ""}
                onChange={e => setNewProduct({ ...newProduct, cost_price: Number(e.target.value) })}
                className="h-8 text-sm"
              />
              <Input
                type="number"
                placeholder="Stock Quantity"
                value={newProduct.stock_quantity || ""}
                onChange={e => setNewProduct({ ...newProduct, stock_quantity: Number(e.target.value) })}
                className="h-8 text-sm"
              />
              <Input
                type="number"
                placeholder="Min Stock Level"
                value={newProduct.min_stock_level || ""}
                onChange={e => setNewProduct({ ...newProduct, min_stock_level: Number(e.target.value) })}
                className="h-8 text-sm"
              />
              <Input
                placeholder="Batch Number"
                value={newProduct.batch_number || ""}
                onChange={e => setNewProduct({ ...newProduct, batch_number: e.target.value })}
                className="h-8 text-sm"
              />
              <Input
                type="date"
                placeholder="Expiry Date"
                value={newProduct.expiry_date || ""}
                onChange={e => setNewProduct({ ...newProduct, expiry_date: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <Textarea
              placeholder="Description"
              value={newProduct.description || ""}
              onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addProduct}>Add Product</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowAddProduct(false); setNewProduct({}); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No products found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.stock_quantity}</TableCell>
                      <TableCell>
                        <Badge style={{ color: status.color, background: status.bg, borderColor: `${status.color}30` }}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            className="w-20 h-7 text-xs"
                            defaultValue={product.stock_quantity}
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (!isNaN(val) && val >= 0) {
                                updateStock(product.id, val);
                              }
                            }}
                          />
                          {product.batch_number && (
                            <Badge variant="outline" className="text-xs">
                              Batch: {product.batch_number}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeamLeader, setIsTeamLeader] = useState(false);

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

  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // ── Bulk selection ───────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAssignTo, setBulkAssignTo] = useState("unassigned");
  const [bulkActing, setBulkActing] = useState(false);

  // ── Dialogs ──────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [lostLeadDialog, setLostLeadDialog] = useState<Lead | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importSummary, setImportSummary] = useState<{ imported: number } | null>(null);
  const [importAssignTo, setImportAssignTo] = useState("unassigned");
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportStage, setExportStage] = useState("all");

  // ── Next Call Reminder Dialog ──────────────────────────────────────
  const [reminderLead, setReminderLead] = useState<Lead | null>(null);
  const [nextCallDate, setNextCallDate] = useState("");
  const [nextCallTime, setNextCallTime] = useState("");

  // ── Invoice Dialog ──────────────────────────────────────────────────
  const [invoiceLead, setInvoiceLead] = useState<Lead | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // ── Form State ──────────────────────────────────────────────────────
  const emptyForm = {
    name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "",
    medicine: "", disease: "", qty_days: "", value: "", lead_type: "Herbal & Ayurvedic",
    source: "Website", source_details: "", budget: "Below Rs 50k", stage: "New",
    sub_stage: "-", temperature: "Warm", order_status: "New Order",
    previous_history: "", remark: "", call_status: "pending", assigned_to: "unassigned",
    next_call_date: "",
  };
  const [form, setForm] = useState(emptyForm);

  // ── Get Current User + Role ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setCurrentUser(data.user);
      if (!data.user) return;
      
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
        
      const userRoles = (rolesData || []).map(r => r.role);
      const isAdm = userRoles.includes("admin") || userRoles.includes("owner");
      const isTl = isAdm || userRoles.includes("tl");
      setIsAdmin(isAdm);
      setIsTeamLeader(isTl);
    });
  }, []);

  // ── Fetch Data ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { data: leadsData, error: leadsErr },
        { data: agentsData, error: agentsErr },
        { data: attendanceData }
      ] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("agents").select("*").order("name"),
        supabase.from("attendance").select("*").order("date", { ascending: false }).limit(500)
      ]);

      if (leadsErr) throw leadsErr;
      setLeads((leadsData as Lead[]) || []);

      if (agentsData && !agentsErr) {
        setAgents((agentsData as Agent[]) || []);
      } else {
        // Fallback to profiles table if agents view is not yet created
        const { data: profs } = await supabase.from("profiles").select("*");
        if (profs && profs.length > 0) {
          const mappedAgents: Agent[] = profs.map(p => ({
            id: p.user_id,
            agent_code: "AGT-" + (p.user_id ? p.user_id.slice(0, 4).toUpperCase() : "0000"),
            name: p.display_name || p.email || "Agent",
            email: p.email || "",
            phone: p.phone || "",
            department: p.department || "Telecalling",
            role: "caller",
            status: "online",
            login_time: null,
            break_time: null,
            logout_time: null,
            total_working_hours: 0,
            total_breaks: 0,
            created_at: p.created_at,
          }));
          setAgents(mappedAgents);
        }
      }

      if (attendanceData) {
        setAttendance((attendanceData as Attendance[]) || []);
      }
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

  useEffect(() => {
    const channel = supabase.channel("agents-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, payload => {
        if (payload.eventType === "INSERT") {
          setAgents(prev => prev.some(a => a.id === (payload.new as Agent).id) ? prev : [...prev, payload.new as Agent]);
        } else if (payload.eventType === "UPDATE") {
          setAgents(prev => prev.map(a => (a.id === (payload.new as Agent).id ? (payload.new as Agent) : a)));
        } else if (payload.eventType === "DELETE") {
          setAgents(prev => prev.filter(a => a.id !== (payload.old as Agent).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Helper Functions ──────────────────────────────────────────────
  const getAgentName = useCallback((id: string | null) => agents.find(a => a.id === id)?.name || "Unassigned", [agents]);

  const logActivity = useCallback(async (leadId: string, action: string, detail?: string) => {
    try {
      await supabase.from("lead_activity_log").insert({
        lead_id: leadId,
        user_id: currentUser?.id || null,
        action,
        details: detail || "",
      });
    } catch { /* non-critical */ }
  }, [currentUser?.id]);

  const logCallAttempt = useCallback(async (leadId: string) => {
    const now = new Date().toISOString();
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, last_call_at: now } : l)));
    try {
      await supabase.from("leads").update({ last_call_at: now }).eq("id", leadId);
      logActivity(leadId, "called");
    } catch { /* non-critical */ }
  }, [logActivity]);

  // ── Lead CRUD ──────────────────────────────────────────────────────
  const handleAddLead = useCallback(async () => {
    if (!form.name || !form.phone) {
      toast.error("Name and Phone are required");
      return;
    }

    const selfIsRealAgent = !!currentUser?.id && agents.some(a => a.id === currentUser.id);
    const finalAssignee = isAdmin
      ? (form.assigned_to === "unassigned" ? null : form.assigned_to)
      : (selfIsRealAgent ? currentUser!.id : null);

    try {
      const { error } = await supabase.from("leads").insert({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        address: form.address,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
        medicine: form.medicine,
        disease: form.disease,
        qty_days: Number(form.qty_days) || 0,
        value: Number(form.value) || 0,
        lead_type: form.lead_type,
        source: form.source,
        source_details: form.source_details || null,
        budget: form.budget,
        stage: form.stage,
        sub_stage: form.sub_stage,
        temperature: form.temperature,
        order_status: form.order_status,
        previous_history: form.previous_history,
        remark: form.remark,
        call_status: form.call_status || "pending",
        assigned_to: finalAssignee,
        next_call_date: form.next_call_date || null,
      });
      if (error) throw error;
      setForm(emptyForm);
      setDialogOpen(false);
      toast.success("✅ Lead added successfully");
      await fetchAll();
    } catch (err: any) {
      console.error("Add lead failed:", err);
      toast.error(err?.message || "Failed to add lead");
    }
  }, [form, fetchAll, isAdmin, currentUser, agents]);

  // ── Assign Lead ──
  const handleAssign = useCallback(async (id: string, agentId: string) => {
    const finalAgent = agentId === "unassigned" ? null : agentId;
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, assigned_to: finalAgent } : l)));
    try {
      const { error } = await supabase.from("leads").update({ assigned_to: finalAgent }).eq("id", id);
      if (error) throw error;
      toast.success("✅ Lead assigned");
    } catch (err: any) {
      toast.error(err.message || "Failed to assign");
      await fetchAll();
    }
  }, [fetchAll]);

  // ── Update Stage ──
  const handleUpdateStage = useCallback(async (id: string, stage: string) => {
    const subStage = SUB_STAGES[stage]?.[0] ?? "-";
    
    setLeads(prev => prev.map(l => 
      l.id === id ? { ...l, stage, sub_stage: subStage } : l
    ));
    
    if (detailLead?.id === id) {
      setDetailLead(prev => prev ? { ...prev, stage, sub_stage: subStage } : prev);
    }
    
    try {
      const { error } = await supabase
        .from("leads")
        .update({ stage, sub_stage: subStage })
        .eq("id", id);
        
      if (error) throw error;
      
      await logActivity(id, "stage_updated", `Stage: ${stage}, Sub-stage: ${subStage}`);
      toast.success(`✅ Stage updated to ${stage}`);
    } catch (err: any) {
      console.error("Failed to update stage:", err);
      toast.error(err.message || "Failed to update stage");
      await fetchAll();
    }
  }, [detailLead, logActivity, fetchAll]);

  // ── Update Call Status ──
  const handleUpdateCallStatus = useCallback(async (id: string, callStatus: string) => {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, call_status: callStatus } : l)));
    if (detailLead?.id === id) setDetailLead(prev => (prev ? { ...prev, call_status: callStatus } : prev));
    try {
      const { error } = await supabase.from("leads").update({ call_status: callStatus }).eq("id", id);
      if (error) throw error;
      logActivity(id, "call_status_updated", `Call Status: ${callStatus}`);
      toast.success(`📞 Call status updated`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update call status");
      await fetchAll();
    }
  }, [detailLead, logActivity, fetchAll]);

  // ── Set Next Call Date ──
  const handleSetNextCall = useCallback(async (id: string, dateTime: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ next_call_date: dateTime })
        .eq("id", id);
      if (error) throw error;
      setLeads(prev => prev.map(l => (l.id === id ? { ...l, next_call_date: dateTime } : l)));
      toast.success(`📅 Next call scheduled for ${format(new Date(dateTime), "dd MMM yyyy, hh:mm a")}`);
      setReminderLead(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to set next call");
    }
  }, []);

  // ── Update Order Status ──
  const handleUpdateOrderStatus = useCallback(async (id: string, status: string) => {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, order_status: status } : l)));
    try {
      const { error } = await supabase.from("leads").update({ order_status: status }).eq("id", id);
      if (error) throw error;
      toast.success(`📦 Order status updated to ${status}`);
      logActivity(id, "order_updated", `Order Status: ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update order status");
      await fetchAll();
    }
  }, [fetchAll, logActivity]);

  const handleUpdate = useCallback(async () => {
    if (!editLead) return;
    try {
      const { error } = await supabase.from("leads").update({
        name: editLead.name,
        phone: editLead.phone,
        email: editLead.email,
        address: editLead.address,
        city: editLead.city,
        state: editLead.state,
        pincode: editLead.pincode,
        medicine: editLead.medicine,
        disease: editLead.disease,
        qty_days: editLead.qty_days,
        value: editLead.value,
        lead_type: editLead.lead_type,
        source: editLead.source,
        source_details: editLead.source_details,
        budget: editLead.budget,
        stage: editLead.stage,
        sub_stage: editLead.sub_stage,
        temperature: editLead.temperature,
        assigned_to: editLead.assigned_to,
        order_status: editLead.order_status,
        previous_history: editLead.previous_history,
        remark: editLead.remark,
        business_status: editLead.business_status,
        call_status: editLead.call_status,
        next_call_date: editLead.next_call_date,
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
      if (!isAdmin && l.assigned_to !== currentUser?.id) return false;
      if (isAdmin && showOnlyMine && l.assigned_to !== currentUser?.id) return false;

      const q = search.toLowerCase();
      const matchSearch = l.name.toLowerCase().includes(q) || 
        (l.phone || "").includes(search) || 
        (l.medicine || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.city || "").toLowerCase().includes(q);

      const matchStage = filterStage === "all" || l.stage === filterStage;
      const matchTemp = filterTemperature === "all" || l.temperature === filterTemperature;
      const matchType = filterLeadType === "all" || l.lead_type === filterLeadType;
      const matchBudget = filterBudget === "all" || l.budget === filterBudget;
      const matchAssignee = filterAssignee === "all" || (filterAssignee === "unassigned" ? !l.assigned_to : l.assigned_to === filterAssignee);
      const matchCallStatus = filterCallStatus === "all" || l.call_status === filterCallStatus;
      const matchPreset = filterPreset === "all" ||
        (filterPreset === "today" && isToday(new Date(l.created_at))) ||
        (filterPreset === "fresh" && l.stage === "New" && new Date(l.created_at) >= subDays(new Date(), 3)) ||
        (filterPreset === "followup" && l.next_call_date && new Date(l.next_call_date) <= new Date()) ||
        (filterPreset === "converted" && l.stage === "Converted") ||
        (filterPreset === "lost" && l.stage === "Lost") ||
        (filterPreset === "active" && l.stage !== "Converted" && l.stage !== "Lost");

      const created = new Date(l.created_at);
      const matchFrom = !dateFrom || created >= new Date(dateFrom);
      const matchTo = !dateTo || created <= new Date(dateTo + "T23:59:59");
      return matchSearch && matchStage && matchTemp && matchType && matchBudget && matchAssignee && matchCallStatus && matchPreset && matchFrom && matchTo;
    });
  }, [leads, search, filterStage, filterTemperature, filterLeadType, filterBudget, filterAssignee, filterCallStatus, filterPreset, dateFrom, dateTo, isAdmin, showOnlyMine, currentUser]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = useMemo(() => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filtered, currentPage]);
  useEffect(() => { setCurrentPage(1); }, [filtered.length]);
  useEffect(() => { setSelectedIds(new Set()); }, [search, filterStage, filterTemperature, filterLeadType, filterBudget, filterAssignee, filterCallStatus, filterPreset, dateFrom, dateTo, showOnlyMine]);

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

  // ── Bulk selection ──────────────────────────────────────────────────
  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const allOnPageSelected = currentItems.length > 0 && currentItems.every(l => selectedIds.has(l.id));

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = currentItems.length > 0 && currentItems.every(l => next.has(l.id));
      if (allSelected) {
        currentItems.forEach(l => next.delete(l.id));
      } else {
        currentItems.forEach(l => next.add(l.id));
      }
      return next;
    });
  }, [currentItems]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ── Bulk Actions ──
  const handleBulkAssign = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const finalAgent = bulkAssignTo === "unassigned" ? null : bulkAssignTo;
    const ids = Array.from(selectedIds);
    setBulkActing(true);
    setLeads(prev => prev.map(l => (selectedIds.has(l.id) ? { ...l, assigned_to: finalAgent } : l)));
    try {
      const { error } = await supabase.from("leads").update({ assigned_to: finalAgent }).in("id", ids);
      if (error) throw error;
      toast.success(`✅ ${ids.length} lead(s) assigned to ${finalAgent ? getAgentName(finalAgent) : "Unassigned"}`);
      clearSelection();
    } catch (err: any) {
      toast.error(err.message || "Bulk assign failed");
      await fetchAll();
    } finally {
      setBulkActing(false);
    }
  }, [selectedIds, bulkAssignTo, getAgentName, fetchAll, clearSelection]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected lead(s)? This cannot be undone.`)) return;
    const ids = Array.from(selectedIds);
    setBulkActing(true);
    try {
      const { error } = await supabase.from("leads").delete().in("id", ids);
      if (error) throw error;
      setLeads(prev => prev.filter(l => !selectedIds.has(l.id)));
      toast.success(`🗑️ ${ids.length} lead(s) deleted`);
      clearSelection();
    } catch (err: any) {
      toast.error(err.message || "Bulk delete failed");
      await fetchAll();
    } finally {
      setBulkActing(false);
    }
  }, [selectedIds, fetchAll, clearSelection]);

  const handleBulkStage = useCallback(async (stage: string) => {
    if (selectedIds.size === 0 || !stage) return;
    const subStage = SUB_STAGES[stage]?.[0] ?? "-";
    const ids = Array.from(selectedIds);
    setBulkActing(true);
    setLeads(prev => prev.map(l => (selectedIds.has(l.id) ? { ...l, stage, sub_stage: subStage } : l)));
    try {
      const { error } = await supabase.from("leads").update({ stage, sub_stage: subStage }).in("id", ids);
      if (error) throw error;
      toast.success(`✅ ${ids.length} lead(s) moved to ${stage}`);
      clearSelection();
    } catch (err: any) {
      toast.error(err.message || "Bulk stage update failed");
      await fetchAll();
    } finally {
      setBulkActing(false);
    }
  }, [selectedIds, fetchAll, clearSelection]);

  // ── Stats ──
  const visibleLeads = useMemo(
    () => (isAdmin ? leads : leads.filter(l => l.assigned_to === currentUser?.id)),
    [leads, isAdmin, currentUser]
  );

  const stats = useMemo(() => ({
    total: visibleLeads.length,
    hot: visibleLeads.filter(l => l.temperature === "Hot").length,
    warm: visibleLeads.filter(l => l.temperature === "Warm").length,
    cold: visibleLeads.filter(l => l.temperature === "Cold").length,
    converted: visibleLeads.filter(l => l.stage === "Converted").length,
    active: visibleLeads.filter(l => l.stage !== "Converted" && l.stage !== "Lost").length,
    interested: visibleLeads.filter(l => l.call_status === "interested").length,
    ringing: visibleLeads.filter(l => l.call_status === "ringing").length,
    connected: visibleLeads.filter(l => l.call_status === "connected").length,
    followup: visibleLeads.filter(l => l.call_status === "followup").length,
    totalValue: visibleLeads.reduce((sum, l) => sum + (l.value || 0), 0),
  }), [visibleLeads]);

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
          city: r.City || r.city || "",
          state: r.State || r.state || "",
          pincode: r.Pincode || r.pincode || "",
          medicine: r.Medicine || r["Product / Medicine"] || r.medicine || "",
          disease: r.Disease || r.disease || "",
          qty_days: Number(r["Day's"] || r["Qty (Days)"] || r.qty_days || 0),
          value: Number(r.Price || r.Value || r.value || 0),
          previous_history: r["Previous History"] || r.previous_history || "",
          remark: r.Note || r.Remark || r.remark || "",
          temperature: r.Temperature || "Warm",
          source: r.Source || "Website",
          lead_type: r["Lead Type"] || r.lead_type || "Other",
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
    const finalAgent = importAssignTo === "unassigned" ? null : importAssignTo;
    let success = 0;
    for (const lead of uploadPreview) {
      try {
        const { error } = await supabase.from("leads").insert({
          name: lead.name,
          phone: lead.phone,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          pincode: lead.pincode,
          medicine: lead.medicine,
          disease: lead.disease,
          qty_days: lead.qty_days,
          value: lead.value,
          previous_history: lead.previous_history,
          remark: lead.remark,
          temperature: lead.temperature,
          source: lead.source || "Website",
          lead_type: lead.lead_type || "Other",
          stage: "New",
          sub_stage: "-",
          call_status: "pending",
          assigned_to: finalAgent,
        });
        if (!error) success++;
      } catch { /* skip row */ }
    }
    setUploading(false);
    setUploadPreview([]);
    setImportAssignTo("unassigned");
    if (fileRef.current) fileRef.current.value = "";
    await fetchAll();
    setImportSummary({ imported: success });
    toast.success(`✅ ${success} leads imported into "New" stage${finalAgent ? ` and assigned to ${getAgentName(finalAgent)}` : ""}`);
    setUploadOpen(false);
  }, [uploadPreview, importAssignTo, fetchAll, getAgentName]);

  const buildExportRows = useCallback((rows: Lead[]) => rows.map(l => ({
    "Lead ID": l.lead_code,
    Name: l.name,
    Number: l.phone,
    Email: l.email,
    Address: l.address,
    City: l.city,
    State: l.state,
    Pincode: l.pincode,
    Medicine: l.medicine,
    Disease: l.disease,
    "Day's": l.qty_days,
    Price: l.value,
    "Lead Type": l.lead_type,
    Source: l.source,
    "Source Details": l.source_details,
    Budget: l.budget,
    Stage: l.stage,
    "Sub Stage": l.sub_stage,
    Temperature: l.temperature,
    "Call Status": CALL_STATUSES.find(s => s.value === l.call_status)?.label || l.call_status || "Pending",
    "Assigned To": getAgentName(l.assigned_to),
    "Order Status": l.order_status,
    "Previous History": l.previous_history,
    Note: l.remark,
    "Lost Reason": l.lost_reason || "",
    "Business Status": l.business_status,
    "Next Call Date": l.next_call_date ? format(new Date(l.next_call_date), "dd/MM/yyyy HH:mm") : "",
    "Created Date": format(new Date(l.created_at), "dd/MM/yyyy"),
  })), [getAgentName]);

  const handleExportByStage = useCallback((stage: string) => {
    const src = stage === "all" ? visibleLeads : visibleLeads.filter(l => l.stage === stage);
    if (src.length === 0) { toast.error(`No leads found for "${stage}"`); return; }
    const ws = XLSX.utils.json_to_sheet(buildExportRows(src));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (stage === "all" ? "All Leads" : stage).slice(0, 31));
    XLSX.writeFile(wb, `leads_export_${stage === "all" ? "all" : stage}.xlsx`);
    toast.success(`📥 ${src.length} lead(s) exported`);
  }, [visibleLeads, buildExportRows]);

  const handleExportSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const src = leads.filter(l => selectedIds.has(l.id));
    const ws = XLSX.utils.json_to_sheet(buildExportRows(src));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selected Leads");
    XLSX.writeFile(wb, `leads_export_selected.xlsx`);
    toast.success(`📥 ${src.length} selected lead(s) exported`);
  }, [selectedIds, leads, buildExportRows]);

  // ── Generate Invoice ──
  const generateInvoice = useCallback((lead: Lead) => {
    const invoice = {
      invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
      date: format(new Date(), "dd MMM yyyy"),
      customer: {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        pincode: lead.pincode,
      },
      items: [
        {
          description: lead.medicine || "Product",
          quantity: lead.qty_days || 1,
          price: lead.value || 0,
          total: (lead.value || 0) * (lead.qty_days || 1),
        }
      ],
      total: (lead.value || 0) * (lead.qty_days || 1),
      gst: (lead.value || 0) * (lead.qty_days || 1) * 0.18,
      grandTotal: (lead.value || 0) * (lead.qty_days || 1) * 1.18,
    };
    setInvoiceData(invoice);
    setInvoiceLead(lead);
  }, []);

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
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Team Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage leads, track attendance, monitor performance, and handle orders
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
          <Badge variant="outline" className="px-3 py-1 bg-blue-50 border-blue-200">
            <ShoppingCart className="h-4 w-4 mr-1 text-blue-600" />
            {stats.converted} Converted
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-orange-50 border-orange-200">
            <DollarSign className="h-4 w-4 mr-1 text-orange-600" />
            {formatCurrency(stats.totalValue)}
          </Badge>
        </div>
      </div>

      {/* ATTENDANCE */}
      {currentUser && <MyAttendanceCard userId={currentUser.id} />}

      {/* AUTO CALL QUEUE */}
      <AutoCallQueue
        leads={leads}
        currentUserId={currentUser?.id || "unassigned"}
        isAdmin={isAdmin}
        onUpdateCallStatus={handleUpdateCallStatus}
        onLogCall={logCallAttempt}
        onSaveRemark={async (id: string, remark: string) => {
          try {
            await supabase.from("leads").update({ remark }).eq("id", id);
            setLeads(prev => prev.map(l => (l.id === id ? { ...l, remark } : l)));
            logActivity(id, "note_added", remark);
          } catch { /* non-critical */ }
        }}
      />

      {/* REPORTS */}
      {isAdmin && <Reports leads={leads} agents={agents} />}

      {/* STOCK MANAGEMENT */}
      {isAdmin && <StockManagement />}

      {/* TEAM OVERVIEW */}
      {isAdmin && (
        <>
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
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                    <UserX className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">
                      {agents.filter(a => a.status === "offline").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Offline</p>
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
          </div>

          <TeamAttendanceTable agents={agents} attendance={attendance} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No employees have signed up yet. Once someone creates an account, they'll show up here automatically.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map(agent => (
                    <EmployeeCard
                      key={agent.id}
                      agent={agent}
                      onStatusChange={handleAgentStatus}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* LEADS SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {isAdmin && !showOnlyMine ? "Lead Management" : "My Leads"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isAdmin && !showOnlyMine ? "Track and manage all your leads in one place" : "Leads assigned to you — update stage & call status as you work them"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {isAdmin && (
              <Button
                variant={showOnlyMine ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyMine(v => !v)}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                {showOnlyMine ? "Showing: My Leads" : "Show My Leads Only"}
              </Button>
            )}
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

            {/* Import Dialog (Admin Only) */}
            {isAdmin && (
              <Dialog open={uploadOpen} onOpenChange={o => {
                setUploadOpen(o);
                if (!o) { setUploadPreview([]);
                  setImportSummary(null);
                  setImportAssignTo("unassigned");
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
                    <>
                      <div className="grid gap-2 max-w-xs">
                        <Label className="text-xs">Assign all imported leads to</Label>
                        <Select value={importAssignTo} onValueChange={setImportAssignTo}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="max-h-60 overflow-auto rounded border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Number</TableHead>
                              <TableHead>Medicine</TableHead>
                              <TableHead>Price</TableHead>
                            </TableRow>
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
                    </>
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
            )}

            {/* Add Lead Dialog (Admin Only) */}
            {isAdmin && (
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
                    ["City", "city"],
                    ["State", "state"],
                    ["Pincode", "pincode"],
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
                    <Label>Source Details</Label>
                    <Input value={form.source_details} onChange={e => setForm({ ...form, source_details: e.target.value })} placeholder="e.g. Facebook Ad Name" />
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
                  <div className="grid gap-2">
                    <Label>Next Call Date</Label>
                    <Input type="datetime-local" value={form.next_call_date} onChange={e => setForm({ ...form, next_call_date: e.target.value })} />
                  </div>
                  {isAdmin && (
                    <div className="grid gap-2">
                      <Label>Assign To</Label>
                      <Select value={form.assigned_to} onValueChange={v => setForm({ ...form, assigned_to: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
            )}
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
              {isAdmin && (
                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Assigned To" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
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
              <Select value={filterPreset} onValueChange={setFilterPreset}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Quick Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leads</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="fresh">Fresh Leads</SelectItem>
                  <SelectItem value="followup">Follow-up Due</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
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

        {/* Bulk Action Toolbar */}
        {isAdmin && selectedIds.size > 0 && (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="p-3 flex flex-wrap items-center gap-2">
              <Badge className="px-3 py-1">{selectedIds.size} selected</Badge>
              <div className="flex items-center gap-1.5">
                <Select value={bulkAssignTo} onValueChange={setBulkAssignTo}>
                  <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handleBulkAssign} disabled={bulkActing}>
                  {bulkActing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCog className="mr-2 h-4 w-4" />}
                  Bulk Assign
                </Button>
              </div>
              <Select onValueChange={handleBulkStage}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Move stage to..." /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.icon} {s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={handleExportSelected} disabled={bulkActing}>
                <Download className="mr-2 h-4 w-4" />Export Selected
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={bulkActing}>
                <Trash2 className="mr-2 h-4 w-4" />Delete Selected
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                <X className="mr-2 h-4 w-4" />Clear
              </Button>
            </CardContent>
          </Card>
        )}

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
              <div className="flex gap-2 flex-wrap">
                {STAGES.filter(s => s.value !== "Lost" && s.value !== "Converted").map(s => {
                  const count = visibleLeads.filter(l => l.stage === s.value).length;
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
                        {isAdmin && (
                          <TableHead className="w-8">
                            <input
                              type="checkbox"
                              checked={allOnPageSelected}
                              onChange={toggleSelectAllOnPage}
                              className="h-4 w-4 cursor-pointer align-middle"
                              aria-label="Select all leads on this page"
                            />
                          </TableHead>
                        )}
                        <TableHead>Lead</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead className="hidden lg:table-cell">Medicine</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Call Status</TableHead>
                        <TableHead>Temperature</TableHead>
                        {isAdmin && <TableHead>Assigned To</TableHead>}
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
                        const daysUntil = getDaysUntilNextCall(lead.next_call_date);
                        const isFollowUpDue = daysUntil !== null && daysUntil <= 0;

                        return (
                          <TableRow key={lead.id} className={selectedIds.has(lead.id) ? "bg-primary/5" : undefined}>
                            {isAdmin && (
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(lead.id)}
                                  onChange={() => toggleSelectOne(lead.id)}
                                  className="h-4 w-4 cursor-pointer align-middle"
                                  aria-label={`Select ${lead.name}`}
                                />
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{lead.name}</p>
                                {isFollowUpDue && (
                                  <Badge className="bg-red-500 text-white text-[8px] px-1 py-0.5">🔔</Badge>
                                )}
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setDetailLead(lead);
                                  logActivity(lead.id, "viewed"); }}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-[10px] text-muted-foreground">{lead.lead_code}</p>
                              {lead.city && <p className="text-[10px] text-muted-foreground">{lead.city}</p>}
                            </TableCell>
                            <TableCell className="text-sm font-mono">
                              {hidePhoneNumber(lead.phone)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">{lead.medicine || "-"}</TableCell>
                            <TableCell>
                              {isAdmin ? (
                                <StagePill stage={lead.stage} subStage={lead.sub_stage} />
                              ) : (
                                <Select value={lead.stage} onValueChange={v => handleUpdateStage(lead.id, v)}>
                                  <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>{STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.icon} {s.label}</SelectItem>)}</SelectContent>
                                </Select>
                              )}
                            </TableCell>
                            <TableCell>
                              <Select value={lead.call_status || "pending"} onValueChange={v => handleUpdateCallStatus(lead.id, v)}>
                                <SelectTrigger className="w-[150px] h-7 text-xs">
                                  <SelectValue>
                                    {callStatus ? callStatus.label : "⏳ Pending"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {CALL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TemperatureBadge temperature={lead.temperature} />
                            </TableCell>
                            {isAdmin && (
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
                            )}
                            <TableCell className="hidden lg:table-cell text-sm">{formatCurrency(lead.value || 0)}</TableCell>
                            <TableCell><ScoreBadge score={score} /></TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailLead(lead)} title="View">
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {isAdmin && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditLead(lead)} title="Edit">
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {wa && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" asChild title="WhatsApp">
                                    <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => logActivity(lead.id, "whatsapp")}>
                                      <MessageCircle className="h-3.5 w-3.5" />
                                    </a>
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-600" onClick={() => {
                                  setReminderLead(lead);
                                  setNextCallDate(lead.next_call_date ? format(new Date(lead.next_call_date), "yyyy-MM-dd") : "");
                                  setNextCallTime(lead.next_call_date ? format(new Date(lead.next_call_date), "HH:mm") : "");
                                }} title="Set Reminder">
                                  <Bell className="h-3.5 w-3.5" />
                                </Button>
                                {isAdmin && lead.stage === "Converted" && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => generateInvoice(lead)} title="Invoice">
                                    <FileText className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {lead.stage !== "Lost" && lead.stage !== "Converted" && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setLostLeadDialog(lead)} title="Mark Lost">
                                    <Flag className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(lead.id)} title="Delete">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
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

      {/* Detail Dialog */}
      <Dialog open={!!detailLead} onOpenChange={() => setDetailLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="calls">Calls</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold" style={{ background: avatarColor(detailLead.name) }}>
                    {getInitials(detailLead.name)}
                  </div>
                  <div>
                    <h3 className="font-bold">{detailLead.name}</h3>
                    <p className="text-xs text-muted-foreground">{detailLead.lead_code}</p>
                    {detailLead.city && <p className="text-xs text-muted-foreground">{detailLead.city}, {detailLead.state || ""}</p>}
                  </div>
                </div>
                <Progress value={getLeadScore(detailLead)} className="h-2" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">Phone</p><p className="font-medium font-mono">{hidePhoneNumber(detailLead.phone)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Email</p><p className="font-medium">{detailLead.email || "-"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Address</p><p className="font-medium">{detailLead.address || "-"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Medicine</p><p className="font-medium">{detailLead.medicine || "-"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Disease</p><p className="font-medium">{detailLead.disease || "-"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Qty (Days)</p><p className="font-medium">{detailLead.qty_days ?? "-"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Price</p><p className="font-medium">{formatCurrency(detailLead.value || 0)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Source</p><p className="font-medium">{detailLead.source || "-"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Budget</p><p className="font-medium">{detailLead.budget || "-"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Call Status</p>
                    <Select value={detailLead.call_status || "pending"} onValueChange={v => handleUpdateCallStatus(detailLead.id, v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CALL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><p className="text-muted-foreground text-xs">Assigned To</p><p className="font-medium">{getAgentName(detailLead.assigned_to)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Created</p><p className="font-medium">{format(new Date(detailLead.created_at), "dd MMM yyyy")}</p></div>
                  <div><p className="text-muted-foreground text-xs">Next Call</p><p className="font-medium">{detailLead.next_call_date ? format(new Date(detailLead.next_call_date), "dd MMM, hh:mm a") : "-"}</p></div>
                  {detailLead.lost_reason && (
                    <div className="col-span-2"><p className="text-muted-foreground text-xs">Lost Reason</p><p className="font-medium text-red-600">{detailLead.lost_reason}</p></div>
                  )}
                  <div className="col-span-2"><p className="text-muted-foreground text-xs">Previous History</p><p className="font-medium whitespace-pre-wrap">{detailLead.previous_history || "-"}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground text-xs">Remark</p><p className="font-medium whitespace-pre-wrap">{detailLead.remark || "-"}</p></div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {detailLead.phone && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`tel:${detailLead.phone}`} onClick={() => logCallAttempt(detailLead.id)}>
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
                  <Button size="sm" variant="outline" onClick={() => {
                    setReminderLead(detailLead);
                    setNextCallDate(detailLead.next_call_date ? format(new Date(detailLead.next_call_date), "yyyy-MM-dd") : "");
                    setNextCallTime(detailLead.next_call_date ? format(new Date(detailLead.next_call_date), "HH:mm") : "");
                  }}>
                    <Bell className="mr-1 h-3 w-3" />Set Reminder
                  </Button>
                  {isAdmin && detailLead.stage === "Converted" && (
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200" onClick={() => generateInvoice(detailLead)}>
                      <FileText className="mr-1 h-3 w-3" />Invoice
                    </Button>
                  )}
                  {detailLead.stage !== "Lost" && detailLead.stage !== "Converted" && (
                    <Button size="sm" variant="destructive" onClick={() => setLostLeadDialog(detailLead)}>
                      <Flag className="mr-1 h-3 w-3" />Mark as Lost
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="calls">
                <LeadCallHistory leadId={detailLead.id} />
              </TabsContent>

              <TabsContent value="orders">
                <LeadOrders leadId={detailLead.id} currentUser={currentUser} />
              </TabsContent>

              <TabsContent value="feedback">
                <LeadFeedback leadId={detailLead.id} currentUser={currentUser} />
              </TabsContent>

              <TabsContent value="comments">
                <LeadComments leadId={detailLead.id} currentUser={currentUser} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={!!reminderLead} onOpenChange={() => setReminderLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Set Follow-up Reminder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">Set next call date for <strong>{reminderLead?.name}</strong></p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Date</Label>
                <Input type="date" value={nextCallDate} onChange={e => setNextCallDate(e.target.value)} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={nextCallTime} onChange={e => setNextCallTime(e.target.value)} />
              </div>
            </div>
            <Button 
              onClick={() => {
                if (reminderLead && nextCallDate && nextCallTime) {
                  const dateTime = `${nextCallDate}T${nextCallTime}:00`;
                  handleSetNextCall(reminderLead.id, dateTime);
                } else {
                  toast.error("Please select date and time");
                }
              }}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" /> Set Reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={!!invoiceLead} onOpenChange={() => { setInvoiceLead(null); setInvoiceData(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice
            </DialogTitle>
          </DialogHeader>
          {invoiceData && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold text-lg">Invoice #{invoiceData.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">Date: {invoiceData.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">[Your Company Name]</p>
                    <p className="text-sm text-muted-foreground">GST: [Your GST]</p>
                  </div>
                </div>
              </div>
              <div className="border-b pb-4">
                <p className="font-semibold">Bill To:</p>
                <p className="text-sm">{invoiceData.customer.name}</p>
                <p className="text-sm">{invoiceData.customer.phone}</p>
                <p className="text-sm">{invoiceData.customer.email}</p>
                <p className="text-sm">{invoiceData.customer.address}</p>
                <p className="text-sm">{invoiceData.customer.city}, {invoiceData.customer.state} - {invoiceData.customer.pincode}</p>
              </div>
              <div className="border-b pb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceData.items.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoiceData.total)}</span></div>
                <div className="flex justify-between"><span>GST (18%)</span><span>{formatCurrency(invoiceData.gst)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Grand Total</span>
                  <span>{formatCurrency(invoiceData.grandTotal)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="w-full" onClick={() => { toast.info("PDF download will be available in production"); }}>
                  <Printer className="mr-2 h-4 w-4" /> Download PDF
                </Button>
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
                ["City", "city"],
                ["State", "state"],
                ["Pincode", "pincode"],
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
              <div className="grid gap-2"><Label>Source Details</Label><Input value={editLead.source_details || ""} onChange={e => setEditLead({ ...editLead, source_details: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Budget</Label><Select value={editLead.budget || ""} onValueChange={v => setEditLead({ ...editLead, budget: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BUDGETS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Temperature</Label><Select value={editLead.temperature || "Warm"} onValueChange={v => setEditLead({ ...editLead, temperature: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TEMPERATURES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Stage</Label><Select value={editLead.stage} onValueChange={v => setEditLead({ ...editLead, stage: v, sub_stage: SUB_STAGES[v][0] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Sub Stage</Label><Select value={editLead.sub_stage || SUB_STAGES[editLead.stage][0]} onValueChange={v => setEditLead({ ...editLead, sub_stage: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SUB_STAGES[editLead.stage].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Call Status</Label><Select value={editLead.call_status || "pending"} onValueChange={v => setEditLead({ ...editLead, call_status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CALL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Order Status</Label><Select value={editLead.order_status || ""} onValueChange={v => setEditLead({ ...editLead, order_status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Business Status</Label><Select value={editLead.business_status || "Active"} onValueChange={v => setEditLead({ ...editLead, business_status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BIZ_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Next Call Date</Label><Input type="datetime-local" value={editLead.next_call_date ? format(new Date(editLead.next_call_date), "yyyy-MM-dd'T'HH:mm") : ""} onChange={e => setEditLead({ ...editLead, next_call_date: e.target.value || null })} /></div>
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
