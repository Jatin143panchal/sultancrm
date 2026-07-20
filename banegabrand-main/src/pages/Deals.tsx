// src/pages/SalesPunch.tsx
import React, { useState, useEffect, useRef } from 'react';
// Adjust this import path if your Supabase client lives somewhere else in the project.
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, IndianRupee, Loader2, User, Building2, Calendar, Clock, 
  FileText, CheckCircle, XCircle, AlertCircle, Edit2, Trash2,
  Paperclip, Image, File, X, Download, Eye, Search, Filter,
  ChevronDown, ChevronUp, DollarSign, Receipt, CreditCard, CheckSquare, Square
} from "lucide-react";
import { format } from "date-fns";

// ==================== TYPES ====================
interface PaymentSlip {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  url: string;
  uploadedAt: string;
}

interface GstDetails {
  gstNumber: string;
  companyName: string;
  businessType: 'proprietorship' | 'partnership' | 'pvt_ltd' | 'llp' | 'other';
  panNumber: string;
  registeredAddress: string;
}

interface SalesEntry {
  id: string;
  date: string;
  clientName: string;
  mobile: string;
  address: string;
  state: string;
  hasGst: boolean;
  gstDetails?: GstDetails;
  amount: number;
  gstAmount?: number;
  totalAmount?: number;
  product: string;
  paymentMode: 'UPI' | 'Netbanking' | 'Razorpay' | 'Cash' | 'Other';
  paymentSlips: PaymentSlip[];
  notes: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  request_number?: string;
  created_by?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  budget_allocated?: number;
  budget_utilized?: number;
  category?: string;
  assigned_to?: string | null;
  expected_completion_date?: string;
  paymentStatus?: 'pending' | 'partial' | 'completed';
  paymentReceived?: number;
  invoiceNumber?: string;
  poNumber?: string;
}

interface SalesFormData {
  clientName: string;
  mobile: string;
  address: string;
  state: string;
  hasGst: boolean;
  gstNumber: string;
  companyName: string;
  businessType: 'proprietorship' | 'partnership' | 'pvt_ltd' | 'llp' | 'other';
  panNumber: string;
  registeredAddress: string;
  amount: number;
  gstRate: number;
  product: string;
  paymentMode: 'UPI' | 'Netbanking' | 'Razorpay' | 'Cash' | 'Other';
  notes: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  budget_allocated: number;
  expected_completion_date: string;
  invoiceNumber: string;
  poNumber: string;
  paymentStatus: 'pending' | 'partial' | 'completed';
  paymentReceived: number;
}

// ==================== CONSTANTS ====================
const statuses = [
  { key: "draft", label: "Draft", color: "bg-gray-400" },
  { key: "submitted", label: "Submitted", color: "bg-blue-500" },
  { key: "approved", label: "Approved", color: "bg-green-500" },
  { key: "rejected", label: "Rejected", color: "bg-red-500" },
  { key: "cancelled", label: "Cancelled", color: "bg-gray-500" },
  { key: "completed", label: "Completed", color: "bg-emerald-500" },
] as const;

const priorities = [
  { key: "low", label: "Low", color: "bg-blue-100 text-blue-700" },
  { key: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { key: "high", label: "High", color: "bg-orange-100 text-orange-700" },
  { key: "urgent", label: "Urgent", color: "bg-red-100 text-red-700" },
] as const;

const paymentStatuses = [
  { key: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { key: "partial", label: "Partial", color: "bg-orange-100 text-orange-700" },
  { key: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
] as const;

const gstRates = [0, 5, 12, 18, 28];

// ==================== MAIN COMPONENT ====================
const SalesPunch: React.FC = () => {
  // ---------- STATE ----------
  const [entries, setEntries] = useState<SalesEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [showAllDates, setShowAllDates] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showSlipModal, setShowSlipModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'gst' | 'non_gst'>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'client'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<SalesFormData>({
    clientName: '',
    mobile: '',
    address: '',
    state: '',
    hasGst: false,
    gstNumber: '',
    companyName: '',
    businessType: 'proprietorship',
    panNumber: '',
    registeredAddress: '',
    amount: 0,
    gstRate: 18,
    product: '',
    paymentMode: 'Cash',
    notes: '',
    priority: 'medium',
    category: '',
    budget_allocated: 0,
    expected_completion_date: '',
    invoiceNumber: '',
    poNumber: '',
    paymentStatus: 'pending',
    paymentReceived: 0,
  });

  // ---------- SUPABASE MAPPING ----------
  const mapRowToEntry = (row: any, slips: PaymentSlip[] = []): SalesEntry => ({
    id: row.id,
    date: row.entry_date,
    clientName: row.client_name,
    mobile: row.mobile,
    address: row.address || '',
    state: row.state || '',
    hasGst: row.has_gst || false,
    gstDetails: row.has_gst ? {
      gstNumber: row.gst_number || '',
      companyName: row.company_name || '',
      businessType: row.business_type || 'proprietorship',
      panNumber: row.pan_number || '',
      registeredAddress: row.registered_address || '',
    } : undefined,
    amount: Number(row.amount) || 0,
    gstAmount: Number(row.gst_amount) || 0,
    totalAmount: Number(row.total_amount) || Number(row.amount) || 0,
    product: row.product || '',
    paymentMode: row.payment_mode || 'Cash',
    paymentSlips: slips,
    notes: row.notes || '',
    status: row.status || 'draft',
    priority: row.priority || 'medium',
    request_number: row.request_number || `REQ-${String(row.id).slice(-6)}`,
    created_by: row.created_by_email || row.created_by || undefined,
    approved_by: row.approved_by,
    approved_at: row.approved_at,
    rejection_reason: row.rejection_reason,
    submitted_at: row.submitted_at,
    completed_at: row.completed_at,
    budget_allocated: Number(row.budget_allocated) || 0,
    budget_utilized: Number(row.budget_utilized) || 0,
    category: row.category || '',
    assigned_to: row.assigned_to,
    expected_completion_date: row.expected_completion_date || '',
    paymentStatus: row.payment_status || 'pending',
    paymentReceived: Number(row.payment_received) || 0,
    invoiceNumber: row.invoice_number || '',
    poNumber: row.po_number || '',
  });

  // ---------- SUPABASE: FETCH (shared data — everyone sees everyone's entries) ----------
  const fetchEntries = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('sales_punch_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entries:', error);
      setLoading(false);
      return;
    }

    const { data: slipRows, error: slipError } = await supabase
      .from('sales_punch_payment_slips')
      .select('*');

    if (slipError) {
      console.error('Error fetching payment slips:', slipError);
    }

    const slipsByEntry: Record<string, PaymentSlip[]> = {};
    (slipRows || []).forEach((s: any) => {
      const { data: urlData } = supabase.storage.from('payment-slips').getPublicUrl(s.file_path);
      const slip: PaymentSlip = {
        id: s.id,
        fileName: s.file_name,
        filePath: s.file_path,
        fileType: s.file_type || '',
        url: urlData?.publicUrl || '',
        uploadedAt: s.uploaded_at,
      };
      slipsByEntry[s.entry_id] = [...(slipsByEntry[s.entry_id] || []), slip];
    });

    setEntries((rows || []).map((r: any) => mapRowToEntry(r, slipsByEntry[r.id] || [])));
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();

    // Realtime: any user's insert/update/delete refreshes everyone's view live
    const channel = supabase
      .channel('sales-punch-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_punch_entries' }, () => {
        fetchEntries();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_punch_payment_slips' }, () => {
        fetchEntries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ---------- HELPERS ----------
  function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatCurrencyLakh = (amount: number): string => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  const getPaymentEmoji = (mode: string): string => {
    const map: Record<string, string> = {
      Cash: '💵',
      UPI: '📱',
      Netbanking: '🏦',
      Razorpay: '⚡',
      Other: '🔄',
    };
    return map[mode] || '🔄';
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getPriorityColor = (priority: string): string => {
    const p = priorities.find(p => p.key === priority);
    return p ? p.color : 'bg-gray-100 text-gray-700';
  };

  const calculateGST = (amount: number, rate: number): number => {
    return (amount * rate) / 100;
  };

  const calculateTotal = (amount: number, gstAmount: number): number => {
    return amount + gstAmount;
  };

  // ---------- CRUD (Supabase — writes are visible to every user) ----------
  const buildEntryPayload = () => {
    const gstAmount = form.hasGst ? calculateGST(form.amount, form.gstRate) : 0;
    const totalAmount = form.hasGst ? calculateTotal(form.amount, gstAmount) : form.amount;
    return {
      entry_date: selectedDate,
      client_name: form.clientName.trim(),
      mobile: form.mobile.trim(),
      address: form.address.trim(),
      state: form.state.trim(),
      has_gst: form.hasGst,
      gst_number: form.hasGst ? form.gstNumber.trim() : null,
      company_name: form.hasGst ? form.companyName.trim() : null,
      business_type: form.hasGst ? form.businessType : null,
      pan_number: form.hasGst ? form.panNumber.trim() : null,
      registered_address: form.hasGst ? form.registeredAddress.trim() : null,
      amount: form.amount,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      product: form.product.trim(),
      payment_mode: form.paymentMode,
      notes: form.notes.trim(),
      priority: form.priority,
      category: form.category.trim(),
      budget_allocated: form.budget_allocated || 0,
      expected_completion_date: form.expected_completion_date || null,
      invoice_number: form.invoiceNumber.trim(),
      po_number: form.poNumber.trim(),
      payment_status: form.paymentStatus,
      payment_received: form.paymentReceived || 0,
    };
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.mobile.trim() || form.amount <= 0) {
      alert('Please fill Client Name, Mobile, and Amount correctly!');
      return;
    }

    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id || null;
      userEmail = userData?.user?.email || null;
    } catch {
      // No auth configured — entries will just be saved without a creator identity.
    }

    const { error } = await supabase.from('sales_punch_entries').insert({
      ...buildEntryPayload(),
      status: 'draft',
      budget_utilized: 0,
      request_number: `REQ-${String(Date.now()).slice(-6)}`,
      created_by: userId,
      created_by_email: userEmail,
    });

    if (error) {
      console.error(error);
      alert('Failed to save entry: ' + error.message);
      return;
    }

    resetForm();
    setShowForm(false);
    fetchEntries();
  };

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.mobile.trim() || form.amount <= 0) {
      alert('Please fill Client Name, Mobile, and Amount correctly!');
      return;
    }

    if (!editingId) return;

    const { error } = await supabase
      .from('sales_punch_entries')
      .update(buildEntryPayload())
      .eq('id', editingId);

    if (error) {
      console.error(error);
      alert('Failed to update entry: ' + error.message);
      return;
    }

    resetForm();
    setShowForm(false);
    setEditingId(null);
    fetchEntries();
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Delete this entry?')) return;

    const { error } = await supabase.from('sales_punch_entries').delete().eq('id', id);
    if (error) {
      console.error(error);
      alert('Failed to delete entry: ' + error.message);
      return;
    }

    setSelectedEntries(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    fetchEntries();
  };

  const handleEditEntry = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (entry) {
      setForm({
        clientName: entry.clientName,
        mobile: entry.mobile,
        address: entry.address,
        state: entry.state || '',
        hasGst: entry.hasGst || false,
        gstNumber: entry.gstDetails?.gstNumber || '',
        companyName: entry.gstDetails?.companyName || '',
        businessType: entry.gstDetails?.businessType || 'proprietorship',
        panNumber: entry.gstDetails?.panNumber || '',
        registeredAddress: entry.gstDetails?.registeredAddress || '',
        amount: entry.amount,
        gstRate: entry.gstAmount ? (entry.gstAmount / entry.amount) * 100 : 18,
        product: entry.product,
        paymentMode: entry.paymentMode,
        notes: entry.notes || '',
        priority: entry.priority || 'medium',
        category: entry.category || '',
        budget_allocated: entry.budget_allocated || 0,
        expected_completion_date: entry.expected_completion_date || '',
        invoiceNumber: entry.invoiceNumber || '',
        poNumber: entry.poNumber || '',
        paymentStatus: entry.paymentStatus || 'pending',
        paymentReceived: entry.paymentReceived || 0,
      });
      setSelectedDate(entry.date);
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updates: Record<string, any> = { status: newStatus };
    if (newStatus === 'approved') updates.approved_at = new Date().toISOString();
    if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
    if (newStatus === 'submitted') updates.submitted_at = new Date().toISOString();
    if (newStatus === 'rejected') updates.rejection_reason = 'Rejected by approver';

    const { error } = await supabase.from('sales_punch_entries').update(updates).eq('id', id);
    if (error) {
      console.error(error);
      alert('Failed to update status: ' + error.message);
      return;
    }
    fetchEntries();
  };

  const resetForm = () => {
    setForm({
      clientName: '',
      mobile: '',
      address: '',
      state: '',
      hasGst: false,
      gstNumber: '',
      companyName: '',
      businessType: 'proprietorship',
      panNumber: '',
      registeredAddress: '',
      amount: 0,
      gstRate: 18,
      product: '',
      paymentMode: 'Cash',
      notes: '',
      priority: 'medium',
      category: '',
      budget_allocated: 0,
      expected_completion_date: '',
      invoiceNumber: '',
      poNumber: '',
      paymentStatus: 'pending',
      paymentReceived: 0,
    });
    setEditingId(null);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  // ---------- PAYMENT SLIP HANDLERS (Supabase Storage + table) ----------
  const handleAddSlip = async (entryId: string, file: File) => {
    const path = `${entryId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-slips')
      .upload(path, file);

    if (uploadError) {
      console.error(uploadError);
      alert('Upload failed: ' + uploadError.message);
      return;
    }

    let userId: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id || null;
    } catch {
      // No auth configured — that's fine, slip is still saved.
    }

    const { error } = await supabase.from('sales_punch_payment_slips').insert({
      entry_id: entryId,
      file_name: file.name,
      file_path: path,
      file_type: file.type,
      uploaded_by: userId,
    });

    if (error) {
      console.error(error);
      alert('Failed to save payment slip: ' + error.message);
      return;
    }

    fetchEntries();
  };

  const handleDeleteSlip = async (entryId: string, slipId: string) => {
    if (!window.confirm('Delete this payment slip?')) return;

    const entry = entries.find(e => e.id === entryId);
    const slip = entry?.paymentSlips.find(s => s.id === slipId);

    if (slip?.filePath) {
      await supabase.storage.from('payment-slips').remove([slip.filePath]);
    }

    const { error } = await supabase.from('sales_punch_payment_slips').delete().eq('id', slipId);
    if (error) {
      console.error(error);
      alert('Failed to delete payment slip: ' + error.message);
      return;
    }

    fetchEntries();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedEntryId) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      await handleAddSlip(selectedEntryId, file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openSlipModal = (entryId: string) => {
    setSelectedEntryId(entryId);
    setShowSlipModal(true);
  };

  const closeSlipModal = () => {
    setShowSlipModal(false);
    setSelectedEntryId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ---------- SELECTION / BULK ACTIONS ----------
  const toggleSelectEntry = (id: string) => {
    setSelectedEntries(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllFilteredSelected = (list: SalesEntry[]): boolean => {
    return list.length > 0 && list.every(e => selectedEntries.has(e.id));
  };

  const toggleSelectAll = (list: SalesEntry[]) => {
    if (isAllFilteredSelected(list)) {
      // deselect just the currently visible ones
      setSelectedEntries(prev => {
        const next = new Set(prev);
        list.forEach(e => next.delete(e.id));
        return next;
      });
    } else {
      setSelectedEntries(prev => {
        const next = new Set(prev);
        list.forEach(e => next.add(e.id));
        return next;
      });
    }
  };

  const clearSelection = () => setSelectedEntries(new Set());

  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) return;
    if (!window.confirm(`Delete ${selectedEntries.size} selected entr${selectedEntries.size === 1 ? 'y' : 'ies'}?`)) return;

    const { error } = await supabase
      .from('sales_punch_entries')
      .delete()
      .in('id', Array.from(selectedEntries));

    if (error) {
      console.error(error);
      alert('Failed to delete selected entries: ' + error.message);
      return;
    }

    clearSelection();
    fetchEntries();
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedEntries.size === 0) return;

    const updates: Record<string, any> = { status: newStatus };
    if (newStatus === 'approved') updates.approved_at = new Date().toISOString();
    if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
    if (newStatus === 'submitted') updates.submitted_at = new Date().toISOString();
    if (newStatus === 'rejected') updates.rejection_reason = 'Rejected by approver';

    const { error } = await supabase
      .from('sales_punch_entries')
      .update(updates)
      .in('id', Array.from(selectedEntries));

    if (error) {
      console.error(error);
      alert('Failed to update selected entries: ' + error.message);
      return;
    }

    clearSelection();
    fetchEntries();
  };

  // ---------- FILTERED DATA ----------
  const filteredEntries = entries
    .filter(entry => {
      // Date filter (skipped entirely when "Show All Dates" is on)
      if (!showAllDates && selectedDate && entry.date !== selectedDate) return false;
      // Status filter
      if (selectedStatus !== 'all' && entry.status !== selectedStatus) return false;
      // GST filter
      if (filterMode === 'gst' && !entry.hasGst) return false;
      if (filterMode === 'non_gst' && entry.hasGst) return false;
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          entry.clientName.toLowerCase().includes(search) ||
          entry.mobile.includes(search) ||
          entry.product.toLowerCase().includes(search) ||
          (entry.invoiceNumber || '').toLowerCase().includes(search) ||
          (entry.request_number || '').toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'amount') {
        return sortOrder === 'asc' 
          ? (a.totalAmount || a.amount) - (b.totalAmount || b.amount)
          : (b.totalAmount || b.amount) - (a.totalAmount || a.amount);
      } else {
        return sortOrder === 'asc'
          ? a.clientName.localeCompare(b.clientName)
          : b.clientName.localeCompare(a.clientName);
      }
    });
  
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + (entry.totalAmount || entry.amount), 0);
  const totalGST = filteredEntries.reduce((sum, entry) => sum + (entry.gstAmount || 0), 0);

  // ---------- PIPELINE DATA ----------
  // Pipeline view always shows the full pipeline across all dates/statuses (that's the point
  // of a pipeline board), but it now respects search + GST filters like the list view does.
  const pipelineEntries = entries.filter(entry => {
    if (filterMode === 'gst' && !entry.hasGst) return false;
    if (filterMode === 'non_gst' && entry.hasGst) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        entry.clientName.toLowerCase().includes(search) ||
        entry.mobile.includes(search) ||
        entry.product.toLowerCase().includes(search) ||
        (entry.invoiceNumber || '').toLowerCase().includes(search) ||
        (entry.request_number || '').toLowerCase().includes(search)
      );
    }
    return true;
  });
  const pipelineTotals = statuses.reduce((acc, status) => {
    const items = pipelineEntries.filter(e => e.status === status.key);
    acc[status.key] = items.reduce((sum, e) => sum + (e.totalAmount || e.amount), 0);
    return acc;
  }, {} as Record<string, number>);

  // ---------- RENDER ----------
  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading entries…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                💰 Sales Punch
              </h2>
              <p className="text-sm text-gray-500 mt-1">Daily payment entries with GST and approval pipeline</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'pipeline' : 'list')}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                {viewMode === 'list' ? '📊 Pipeline View' : '📋 List View'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(!showForm);
                }}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {showForm ? '✕ Close Form' : '➕ New Entry'}
              </button>
            </div>
          </div>
        </div>

        {/* ===== FILTERS & CONTROLS ===== */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client, mobile, product, invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={showAllDates}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>

            {/* All Dates toggle */}
            <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={showAllDates}
                onChange={(e) => setShowAllDates(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show All Dates</span>
            </label>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="all">All Status</option>
                  {statuses.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">GST Filter</label>
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="all">All Entries</option>
                  <option value="gst">With GST</option>
                  <option value="non_gst">Without GST</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Sort Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ===== SUMMARY CARDS ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 md:mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Total Entries</p>
            <p className="text-2xl font-bold text-gray-800">{filteredEntries.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Total GST</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalGST)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500">GST Entries</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredEntries.filter(e => e.hasGst).length}
            </p>
          </div>
        </div>

        {/* ===== FORM ===== */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              {editingId ? '✏️ Edit Entry' : '📝 New Entry'}
            </h3>

            <form onSubmit={editingId ? handleUpdateEntry : handleAddEntry} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Rajesh Sharma"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="9876543210"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={form.invoiceNumber}
                    onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="INV-2024-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="123, Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Maharashtra"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={form.poNumber}
                    onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="PO-2024-001"
                  />
                </div>
              </div>

              {/* GST Section */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={form.hasGst}
                    onChange={(e) => setForm({ ...form, hasGst: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    GST Registered Client
                  </label>
                </div>

                {form.hasGst && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        GST Number *
                      </label>
                      <input
                        type="text"
                        value={form.gstNumber}
                        onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="22AAAAA0000A1Z5"
                        required={form.hasGst}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="ABC Pvt Ltd"
                        required={form.hasGst}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Business Type
                      </label>
                      <select
                        value={form.businessType}
                        onChange={(e) => setForm({ ...form, businessType: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="proprietorship">Proprietorship</option>
                        <option value="partnership">Partnership</option>
                        <option value="pvt_ltd">Private Limited</option>
                        <option value="llp">LLP</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        PAN Number *
                      </label>
                      <input
                        type="text"
                        value={form.panNumber}
                        onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="AAAAA1234A"
                        required={form.hasGst}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Registered Address
                      </label>
                      <input
                        type="text"
                        value={form.registeredAddress}
                        onChange={(e) => setForm({ ...form, registeredAddress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Registered office address"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Amount & Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {form.hasGst && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        GST Rate (%)
                      </label>
                      <select
                        value={form.gstRate}
                        onChange={(e) => setForm({ ...form, gstRate: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        {gstRates.map(rate => (
                          <option key={rate} value={rate}>{rate}%</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        GST Amount
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(calculateGST(form.amount, form.gstRate))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Total Amount
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(calculateTotal(form.amount, calculateGST(form.amount, form.gstRate)))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-blue-50 text-blue-700 font-semibold"
                        disabled
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Product / Service
                  </label>
                  <input
                    type="text"
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Website Development"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="UPI">📱 UPI</option>
                    <option value="Netbanking">🏦 Netbanking</option>
                    <option value="Razorpay">⚡ Razorpay</option>
                    <option value="Other">🔄 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={form.paymentStatus}
                    onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {paymentStatuses.map(p => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Payment Received (₹)
                  </label>
                  <input
                    type="number"
                    value={form.paymentReceived || ''}
                    onChange={(e) => setForm({ ...form, paymentReceived: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {priorities.map(p => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Software, Consulting, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Expected Completion Date
                  </label>
                  <input
                    type="date"
                    value={form.expected_completion_date}
                    onChange={(e) => setForm({ ...form, expected_completion_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Budget Allocated (₹)
                </label>
                <input
                  type="number"
                  value={form.budget_allocated || ''}
                  onChange={(e) => setForm({ ...form, budget_allocated: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
                >
                  {editingId ? '💾 Update Entry' : '✅ Save Entry'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== BULK ACTION BAR ===== */}
        {selectedEntries.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-sm font-medium text-blue-800">
              {selectedEntries.size} entr{selectedEntries.size === 1 ? 'y' : 'ies'} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkStatusChange(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
                className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="" disabled>Change status to...</option>
                {statuses.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* ===== PIPELINE VIEW ===== */}
        {viewMode === 'pipeline' ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statuses.map(status => {
              const statusRequests = pipelineEntries.filter(r => r.status === status.key);
              const totalAmount = statusRequests.reduce((s, r) => s + (r.totalAmount || r.amount || 0), 0);

              return (
                <div key={status.key} className="space-y-3">
                  {/* Column Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                      <h3 className="text-sm font-semibold">{status.label}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {statusRequests.length}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {formatCurrencyLakh(totalAmount)} total
                  </p>

                  {/* Cards */}
                  <div className="space-y-2">
                    {statusRequests.map(request => {
                      const priority = priorities.find(p => p.key === request.priority);
                      const isSelected = selectedEntries.has(request.id);
                      
                      return (
                        <Card
                          key={request.id}
                          className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
                        >
                          <CardContent className="p-3">
                            {/* Checkbox, Request Number & Priority */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectEntry(request.id)}
                                  className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <p className="text-xs text-muted-foreground">
                                  {request.request_number || `REQ-${request.id.slice(-6)}`}
                                </p>
                              </div>
                              {priority && (
                                <Badge className={`text-xs ${priority.color}`}>
                                  {priority.label}
                                </Badge>
                              )}
                            </div>

                            {/* Title */}
                            <p className="text-sm font-medium truncate mt-1">
                              {request.clientName} - {request.product || 'N/A'}
                            </p>

                            {/* Client & Company */}
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs text-muted-foreground truncate">
                                {request.clientName}
                              </p>
                              {request.state && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <p className="text-xs text-muted-foreground truncate">
                                    {request.state}
                                  </p>
                                </>
                              )}
                            </div>

                            {/* GST Badge */}
                            {request.hasGst && (
                              <Badge className="text-xs bg-green-100 text-green-700 mt-1">
                                GST {request.gstAmount ? formatCurrency(request.gstAmount) : ''}
                              </Badge>
                            )}

                            {/* Amount & Date */}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm font-semibold flex items-center gap-1">
                                <IndianRupee className="h-3 w-3 flex-shrink-0" />
                                {formatCurrency(request.totalAmount || request.amount || 0)}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                {request.expected_completion_date 
                                  ? format(new Date(request.expected_completion_date), 'dd/MM/yy')
                                  : 'N/A'}
                              </span>
                            </div>

                            {/* Payment Status */}
                            {request.paymentStatus && (
                              <Badge className={`text-xs mt-1 ${
                                request.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                request.paymentStatus === 'partial' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {request.paymentStatus.charAt(0).toUpperCase() + request.paymentStatus.slice(1)}
                              </Badge>
                            )}

                            {/* ===== ACTION BUTTONS ===== */}
                            {request.status === 'draft' && (
                              <Button 
                                size="sm" 
                                className="w-full mt-2 h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(request.id, 'submitted');
                                }}
                              >
                                Submit for Approval
                              </Button>
                            )}

                            {request.status === 'submitted' && (
                              <div className="flex gap-2 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-green-600 border-green-600 hover:bg-green-50 h-7 text-xs flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(request.id, 'approved');
                                  }}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 border-red-600 hover:bg-red-50 h-7 text-xs flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(request.id, 'rejected');
                                  }}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}

                            {request.status === 'approved' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 h-7 text-xs w-full mt-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(request.id, 'completed');
                                }}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Mark Completed
                              </Button>
                            )}

                            {request.status === 'rejected' && (
                              <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                                <AlertCircle className="h-3 w-3 inline mr-1" />
                                Rejected
                              </div>
                            )}

                            {request.status === 'completed' && (
                              <div className="mt-2 p-2 bg-emerald-50 rounded text-xs text-emerald-600">
                                <CheckCircle className="h-3 w-3 inline mr-1" />
                                Completed on {request.completed_at ? format(new Date(request.completed_at), 'dd/MM/yy') : 'N/A'}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Empty State */}
                    {statusRequests.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed rounded-lg">
                        <p className="text-xs text-muted-foreground">No requests</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ===== LIST VIEW ===== */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 md:p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700">
                📋 Entries ({filteredEntries.length})
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs text-gray-500">
                  Total: {formatCurrency(totalAmount)}
                </span>
                <span className="text-xs text-gray-500">
                  GST: {formatCurrency(totalGST)}
                </span>
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-400">
                <p className="text-4xl md:text-5xl mb-3">📭</p>
                <p className="text-sm">No entries found</p>
                <p className="text-xs">Try adjusting your filters or add a new entry</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-gray-600 text-xs uppercase tracking-wider">
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold">
                        <input
                          type="checkbox"
                          checked={isAllFilteredSelected(filteredEntries)}
                          onChange={() => toggleSelectAll(filteredEntries)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          title="Select all"
                        />
                      </th>
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold">#</th>
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold">Client</th>
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold hidden sm:table-cell">Mobile</th>
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold hidden lg:table-cell">State</th>
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold hidden md:table-cell">Product</th>
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold">Amount</th>
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold hidden sm:table-cell">GST</th>
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold hidden sm:table-cell">Payment</th>
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold">Status</th>
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold text-center">Slips</th>
                      <th className="py-2 md:py-3 px-2 md:px-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEntries.map((entry, index) => {
                      const isSelected = selectedEntries.has(entry.id);
                      return (
                      <tr key={entry.id} className={`hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50' : ''}`}>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectEntry(entry.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 text-gray-500 text-center">{index + 1}</td>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          <div className="font-medium text-gray-700">
                            {entry.clientName}
                            {entry.hasGst && (
                              <span className="ml-1 md:ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                GST
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 sm:hidden">
                            {entry.mobile}
                          </div>
                          {entry.invoiceNumber && (
                            <div className="text-xs text-gray-400">
                              INV: {entry.invoiceNumber}
                            </div>
                          )}
                          {entry.created_by && (
                            <div className="text-[10px] text-gray-400">
                              by {entry.created_by}
                            </div>
                          )}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 text-gray-600 hidden sm:table-cell">
                          {entry.mobile}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 text-gray-600 hidden lg:table-cell">
                          {entry.state || '—'}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 text-gray-600 hidden md:table-cell">
                          {entry.product || '—'}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          <div className="font-bold text-gray-800 whitespace-nowrap">
                            {formatCurrency(entry.totalAmount || entry.amount)}
                          </div>
                          {entry.totalAmount && entry.totalAmount !== entry.amount && (
                            <div className="text-xs text-gray-400">
                              Base: {formatCurrency(entry.amount)}
                            </div>
                          )}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 hidden sm:table-cell">
                          {entry.hasGst ? (
                            <span className="text-xs text-orange-600">
                              {formatCurrency(entry.gstAmount || 0)}
                              <span className="block text-[10px] text-gray-400">
                                {entry.gstDetails?.gstNumber || ''}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 hidden sm:table-cell">
                          <div>
                            <span className="text-[10px] bg-gray-100 px-1.5 py-1 rounded-full whitespace-nowrap">
                              {getPaymentEmoji(entry.paymentMode)} {entry.paymentMode}
                            </span>
                            {entry.paymentStatus && (
                              <div className="text-[10px] text-gray-400 mt-1">
                                {entry.paymentStatus}
                                {entry.paymentReceived && entry.paymentReceived > 0 && (
                                  <span className="ml-1">
                                    ({formatCurrency(entry.paymentReceived)})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          <Badge className={`text-xs ${
                            entry.status === 'draft' ? 'bg-gray-200 text-gray-700' :
                            entry.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            entry.status === 'approved' ? 'bg-green-100 text-green-700' :
                            entry.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            entry.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {entry.status || 'draft'}
                          </Badge>
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4 text-center">
                          <button
                            onClick={() => openSlipModal(entry.id)}
                            className="relative text-indigo-500 hover:text-indigo-700 p-1 rounded hover:bg-indigo-50 transition"
                            title="View/Add Slips"
                          >
                            <Paperclip className="h-4 w-4" />
                            {(entry.paymentSlips && entry.paymentSlips.length > 0) && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                {entry.paymentSlips.length}
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-4">
                          <div className="flex items-center justify-center gap-1 md:gap-2">
                            <button
                              onClick={() => handleEditEntry(entry.id)}
                              className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== PAYMENT SLIP MODAL ===== */}
      {showSlipModal && selectedEntryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Payment Slips
              </h3>
              <button
                onClick={closeSlipModal}
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 md:p-6">
              {/* Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 mb-6 text-center">
                <p className="text-gray-600 mb-1">Upload Payment Slip</p>
                <p className="text-xs text-gray-400 mb-3">Supported: JPG, PNG, PDF (Max 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Slips List */}
              {(() => {
                const entry = entries.find(e => e.id === selectedEntryId);
                if (!entry) return null;

                const slips = entry.paymentSlips || [];

                if (slips.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-4xl mb-2">📭</p>
                      <p className="text-sm">No payment slips uploaded</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {slips.map((slip) => (
                      <div key={slip.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="relative bg-gray-50 p-2">
                          {slip.fileType && slip.fileType.startsWith('image/') ? (
                            <img
                              src={slip.url}
                              alt={slip.fileName}
                              className="w-full h-32 md:h-40 object-contain rounded"
                            />
                          ) : (
                            <div className="w-full h-32 md:h-40 flex items-center justify-center bg-gray-100 rounded">
                              <div className="text-center">
                                <File className="h-12 w-12 text-gray-400 mx-auto" />
                                <p className="text-xs text-gray-600 truncate px-2 mt-2">{slip.fileName}</p>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteSlip(selectedEntryId, slip.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="p-2 text-xs text-gray-500">
                          <p className="truncate font-medium">{slip.fileName}</p>
                          <p>Uploaded: {formatDate(slip.uploadedAt)} at {formatTime(slip.uploadedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPunch;
