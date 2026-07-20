import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHasRole } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, Pencil, Trash2, Tent, Upload, Download, FileSpreadsheet, 
  Loader2, X, Search, Filter 
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type ExpoLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  city: string | null;
  event_name: string;
  event_date: string | null;
  event_location: string | null;
  booth_number: string | null;
  interest: string | null;
  budget: string | null;
  status: string;
  remark: string | null;
  created_at: string;
};

const STATUSES = ["new", "contacted", "qualified", "converted", "lost"];
const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  converted: "bg-purple-100 text-purple-800",
  lost: "bg-gray-100 text-gray-800",
};

const emptyForm: Partial<ExpoLead> = {
  name: "", email: "", phone: "", company: "", city: "",
  event_name: "", event_date: "", event_location: "", booth_number: "",
  interest: "", budget: "", status: "new", remark: "",
};

// Sample leads data
const SAMPLE_LEADS: Partial<ExpoLead>[] = [
  {
    name: "Rajesh Kumar",
    email: "rajesh@example.com",
    phone: "9876543210",
    company: "Herbal Life India",
    city: "Mumbai",
    event_name: "India Herbal Expo 2024",
    event_date: "2024-03-15",
    event_location: "Bombay Exhibition Centre, Mumbai",
    booth_number: "A-12",
    interest: "Ayurvedic products, Herbal supplements",
    budget: "₹5l+",
    status: "qualified",
    remark: "Showed strong interest in partnership"
  },
  {
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "9876543211",
    company: "Natural Beauty Co",
    city: "Delhi",
    event_name: "Cosmetics Expo 2024",
    event_date: "2024-02-20",
    event_location: "Pragati Maidan, Delhi",
    booth_number: "B-05",
    interest: "Natural cosmetics, Skincare products",
    budget: "₹3l - ₹5l",
    status: "converted",
    remark: "Signed MOU at the event"
  },
  {
    name: "Amit Patel",
    email: "amit@example.com",
    phone: "9876543212",
    company: "FoodTech Solutions",
    city: "Ahmedabad",
    event_name: "Food & Beverage Expo",
    event_date: "2024-03-10",
    event_location: "Gandhinagar Exhibition Center",
    booth_number: "C-08",
    interest: "Organic food processing",
    budget: "₹1l - ₹3l",
    status: "contacted",
    remark: "Requested product samples"
  },
  {
    name: "Neha Gupta",
    email: "neha@example.com",
    phone: "9876543213",
    company: "PharmaCare Ltd",
    city: "Bangalore",
    event_name: "Pharma Expo 2024",
    event_date: "2024-01-25",
    event_location: "BIEC, Bangalore",
    booth_number: "D-03",
    interest: "Nutraceutical manufacturing",
    budget: "₹5l+",
    status: "new",
    remark: "Will connect post-event"
  },
  {
    name: "Suresh Reddy",
    email: "suresh@example.com",
    phone: "9876543214",
    company: "Wellness India",
    city: "Hyderabad",
    event_name: "Wellness Summit 2024",
    event_date: "2024-03-05",
    event_location: "HICC, Hyderabad",
    booth_number: "E-15",
    interest: "Fitness supplements",
    budget: "₹50k - ₹1l",
    status: "lost",
    remark: "Budget constraints"
  },
  {
    name: "Kavita Singh",
    email: "kavita@example.com",
    phone: "9876543215",
    company: "Green Organics",
    city: "Pune",
    event_name: "Organic Products Expo",
    event_date: "2024-02-28",
    event_location: "Pune International Exhibition Centre",
    booth_number: "F-07",
    interest: "Organic certification, Products",
    budget: "₹3l - ₹5l",
    status: "qualified",
    remark: "Interested in white labeling"
  },
  {
    name: "Vikram Mehta",
    email: "vikram@example.com",
    phone: "9876543216",
    company: "Herbal Remedies",
    city: "Jaipur",
    event_name: "India Herbal Expo 2024",
    event_date: "2024-03-15",
    event_location: "Bombay Exhibition Centre, Mumbai",
    booth_number: "A-20",
    interest: "Ayurvedic medicines",
    budget: "₹5l+",
    status: "contacted",
    remark: "Following up next week"
  },
  {
    name: "Anjali Nair",
    email: "anjali@example.com",
    phone: "9876543217",
    company: "Beauty Essentials",
    city: "Chennai",
    event_name: "Cosmetics Expo 2024",
    event_date: "2024-02-20",
    event_location: "Pragati Maidan, Delhi",
    booth_number: "B-12",
    interest: "Cruelty-free products",
    budget: "₹1l - ₹3l",
    status: "new",
    remark: "Sent brochure"
  }
];

export default function ExpoLeads() {
  const qc = useQueryClient();
  const canEdit = useHasRole("owner", "admin", "hr_manager", "tl");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpoLead | null>(null);
  const [form, setForm] = useState<Partial<ExpoLead>>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [addingSample, setAddingSample] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadPreview, setUploadPreview] = useState<any[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["expo_leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expo_leads" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExpoLead[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<ExpoLead>) => {
      const clean: any = { ...payload };
      if (!clean.event_date) delete clean.event_date;
      if (editing) {
        const { error } = await supabase.from("expo_leads" as any).update(clean).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("expo_leads" as any).insert({ ...clean, created_by: u.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expo_leads"] });
      toast.success(editing ? "Expo lead updated" : "Expo lead added");
      setOpen(false); setEditing(null); setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expo_leads" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expo_leads"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Import Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        setUploadPreview(rows);
        if (rows.length === 0) {
          toast.error("No valid leads found in file");
        } else {
          toast.success(`${rows.length} leads ready to import`);
        }
      } catch (err) {
        console.error("File parse error:", err);
        toast.error("Failed to parse file. Please upload a valid Excel or CSV file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImport = async () => {
    if (uploadPreview.length === 0) return;
    setUploading(true);
    let success = 0;
    
    for (const row of uploadPreview) {
      try {
        const { data: u } = await supabase.auth.getUser();
        await supabase.from("expo_leads" as any).insert({
          name: row.Name || row.name || "",
          email: row.Email || row.email || "",
          phone: row.Phone || row.phone || "",
          company: row.Company || row.company || "",
          city: row.City || row.city || "",
          event_name: row.EventName || row.event_name || row["Event Name"] || "",
          event_date: row.EventDate || row.event_date || row["Event Date"] || null,
          event_location: row.EventLocation || row.event_location || row["Event Location"] || "",
          booth_number: row.BoothNumber || row.booth_number || row["Booth Number"] || "",
          interest: row.Interest || row.interest || "",
          budget: row.Budget || row.budget || "",
          status: row.Status || row.status || "new",
          remark: row.Remark || row.remark || "",
          created_by: u.user?.id,
        });
        success++;
      } catch (err) {
        console.error("Import error:", err);
      }
    }
    
    setUploading(false);
    setUploadPreview([]);
    setUploadOpen(false);
    if (fileRef.current) fileRef.current.value = "";
    qc.invalidateQueries({ queryKey: ["expo_leads"] });
    toast.success(`${success} leads imported successfully!`);
  };

  // Export Excel
  const handleExportExcel = () => {
    const exportData = leads.map(l => ({
      Name: l.name,
      Email: l.email,
      Phone: l.phone,
      Company: l.company,
      City: l.city,
      "Event Name": l.event_name,
      "Event Date": l.event_date,
      "Event Location": l.event_location,
      "Booth Number": l.booth_number,
      Interest: l.interest,
      Budget: l.budget,
      Status: l.status,
      Remark: l.remark,
      "Created At": new Date(l.created_at).toLocaleDateString(),
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expo Leads");
    XLSX.writeFile(wb, `expo_leads_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Expo leads exported!");
  };

  // Add sample leads
  const handleAddSampleLeads = async () => {
    setAddingSample(true);
    let success = 0;
    
    for (const sample of SAMPLE_LEADS) {
      try {
        const { data: u } = await supabase.auth.getUser();
        await supabase.from("expo_leads" as any).insert({
          ...sample,
          created_by: u.user?.id,
        });
        success++;
      } catch (err) {
        console.error("Sample add error:", err);
      }
    }
    
    setAddingSample(false);
    qc.invalidateQueries({ queryKey: ["expo_leads"] });
    toast.success(`${success} sample leads added successfully!`);
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (l: ExpoLead) => { setEditing(l); setForm(l); setOpen(true); };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchSearch = 
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
      (lead.phone && lead.phone.includes(search)) ||
      (lead.company && lead.company.toLowerCase().includes(search.toLowerCase())) ||
      lead.event_name.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    qualified: leads.filter(l => l.status === "qualified").length,
    converted: leads.filter(l => l.status === "converted").length,
    lost: leads.filter(l => l.status === "lost").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tent className="h-7 w-7 text-primary" /> 
            Expo Leads
          </h1>
          <p className="text-muted-foreground">Leads collected from exhibitions and expos</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Export Button */}
          <Button variant="outline" onClick={handleExportExcel} disabled={leads.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          
          {/* Import Button */}
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Import Expo Leads from Excel/CSV
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Upload Excel (.xlsx, .xls) or CSV file
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Columns: Name, Email, Phone, Company, City, Event Name, Event Date, Status
                  </p>
                  <Input 
                    ref={fileRef} 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={handleImportExcel} 
                    className="max-w-xs mx-auto" 
                  />
                </div>
                {uploadPreview.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{uploadPreview.length} leads found</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setUploadPreview([]); if (fileRef.current) fileRef.current.value = ""; }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="max-h-60 overflow-auto rounded border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Event</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadPreview.slice(0, 10).map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-sm">{row.Name || row.name}</TableCell>
                              <TableCell className="text-sm">{row.Email || row.email}</TableCell>
                              <TableCell className="text-sm">{row.Phone || row.phone}</TableCell>
                              <TableCell className="text-sm">{row.EventName || row.event_name}</TableCell>
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
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleBulkImport} 
                  disabled={uploading || uploadPreview.length === 0}
                >
                  {uploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</>
                  ) : (
                    `Import ${uploadPreview.length} Leads`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Sample Leads Button */}
          <Button 
            variant="outline" 
            onClick={handleAddSampleLeads} 
            disabled={addingSample || leads.length > 0}
          >
            {addingSample ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</>
            ) : (
              <>Add Sample Leads</>
            )}
          </Button>
          
          {/* Add Lead Button */}
          {canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit" : "Add"} Expo Lead</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-2">
                  <div><Label>Name *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Company</Label><Input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                  <div><Label>City</Label><Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                  <div><Label>Event Name *</Label><Input value={form.event_name || ""} onChange={(e) => setForm({ ...form, event_name: e.target.value })} /></div>
                  <div><Label>Event Date</Label><Input type="date" value={form.event_date || ""} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
                  <div><Label>Event Location</Label><Input value={form.event_location || ""} onChange={(e) => setForm({ ...form, event_location: e.target.value })} /></div>
                  <div><Label>Booth Number</Label><Input value={form.booth_number || ""} onChange={(e) => setForm({ ...form, booth_number: e.target.value })} /></div>
                  <div><Label>Budget</Label><Input value={form.budget || ""} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Interest</Label><Input value={form.interest || ""} onChange={(e) => setForm({ ...form, interest: e.target.value })} /></div>
                  <div><Label>Status</Label>
                    <Select value={form.status || "new"} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>Remark</Label><Textarea value={form.remark || ""} onChange={(e) => setForm({ ...form, remark: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.event_name || saveMutation.isPending}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.new}</p>
              <p className="text-xs text-muted-foreground">New</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-700">{stats.contacted}</p>
              <p className="text-xs text-muted-foreground">Contacted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{stats.qualified}</p>
              <p className="text-xs text-muted-foreground">Qualified</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-700">{stats.converted}</p>
              <p className="text-xs text-muted-foreground">Converted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">{stats.lost}</p>
              <p className="text-xs text-muted-foreground">Lost</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, company, or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>All Expo Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tent className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No expo leads found.</p>
              {canEdit && (
                <Button onClick={openCreate} variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first expo lead
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell>{l.event_name}</TableCell>
                      <TableCell>{l.event_date ? new Date(l.event_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{l.company || "—"}</TableCell>
                      <TableCell>{l.phone || "—"}</TableCell>
                      <TableCell>{l.city || "—"}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[l.status as keyof typeof STATUS_COLORS]}>
                          {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(l)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => { 
                              if (confirm("Delete this expo lead?")) deleteMutation.mutate(l.id); 
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
