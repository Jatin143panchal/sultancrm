import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  Upload,
  Download,
  Search,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Status options
const STATUSES = ["new", "contacted", "interested", "not_interested", "converted", "lost"];

// Interface for Workshop Lead
interface WorkshopLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  city: string | null;
  workshop_name: string;
  workshop_date: string | null;
  workshop_topic: string | null;
  trainer: string | null;
  interest: string | null;
  budget: string | null;
  status: string;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

// Form data interface
interface WorkshopLeadForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  workshop_name: string;
  workshop_date: string;
  workshop_topic: string;
  trainer: string;
  interest: string;
  budget: string;
  status: string;
  remark: string;
}

const emptyForm: WorkshopLeadForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  city: "",
  workshop_name: "",
  workshop_date: "",
  workshop_topic: "",
  trainer: "",
  interest: "",
  budget: "",
  status: "new",
  remark: "",
};

export default function WorkshopLeads() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkshopLead | null>(null);
  const [form, setForm] = useState<WorkshopLeadForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  // Check if user can edit (admin, manager, or specific role)
  const canEdit = user?.role === "admin" || user?.role === "owner" || user?.role === "tl";

  // Fetch workshop leads
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["workshop_leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshop_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WorkshopLead[];
    },
  });

  // Save mutation (create/update)
  const saveMutation = useMutation({
    mutationFn: async (formData: WorkshopLeadForm) => {
      if (editing) {
        // Update existing
        const { error } = await supabase
          .from("workshop_leads")
          .update({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            company: formData.company || null,
            city: formData.city || null,
            workshop_name: formData.workshop_name,
            workshop_date: formData.workshop_date || null,
            workshop_topic: formData.workshop_topic || null,
            trainer: formData.trainer || null,
            interest: formData.interest || null,
            budget: formData.budget || null,
            status: formData.status,
            remark: formData.remark || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editing.id);
        if (error) throw error;
        return { ...editing, ...formData };
      } else {
        // Create new
        const { data, error } = await supabase
          .from("workshop_leads")
          .insert({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            company: formData.company || null,
            city: formData.city || null,
            workshop_name: formData.workshop_name,
            workshop_date: formData.workshop_date || null,
            workshop_topic: formData.workshop_topic || null,
            trainer: formData.trainer || null,
            interest: formData.interest || null,
            budget: formData.budget || null,
            status: formData.status,
            remark: formData.remark || null,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop_leads"] });
      toast.success(editing ? "Workshop lead updated" : "Workshop lead created");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workshop_leads").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop_leads"] });
      toast.success("Workshop lead deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Open create modal
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  // Open edit modal
  const openEdit = (lead: WorkshopLead) => {
    setEditing(lead);
    setForm({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      city: lead.city || "",
      workshop_name: lead.workshop_name,
      workshop_date: lead.workshop_date || "",
      workshop_topic: lead.workshop_topic || "",
      trainer: lead.trainer || "",
      interest: lead.interest || "",
      budget: lead.budget || "",
      status: lead.status,
      remark: lead.remark || "",
    });
    setOpen(true);
  };

  // ================= IMPORT EXCEL =================
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

        setUploading(true);

        for (const row of rows) {
          await supabase.from("workshop_leads").insert({
            name: row.Name || row.name || "",
            email: row.Email || row.email || "",
            phone: row.Phone || row.phone || "",
            company: row.Company || row.company || "",
            city: row.City || row.city || "",
            workshop_name: row.WorkshopName || row.workshop_name || row["Workshop Name"] || "",
            workshop_date: row.WorkshopDate || row.workshop_date || row["Workshop Date"] || null,
            workshop_topic: row.Topic || row.topic || row["Workshop Topic"] || "",
            trainer: row.Trainer || row.trainer || "",
            interest: row.Interest || row.interest || "",
            budget: row.Budget || row.budget || "",
            status: row.Status || row.status || "new",
            remark: row.Remark || row.remark || "",
          });
        }

        queryClient.invalidateQueries({ queryKey: ["workshop_leads"] });
        toast.success(`${rows.length} Workshop Leads Imported`);
      } catch (error) {
        console.error(error);
        toast.error("Excel import failed");
      } finally {
        setUploading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // ================= EXPORT EXCEL =================
  const handleExportExcel = () => {
    const exportData = leads.map((lead) => ({
      Name: lead.name,
      Email: lead.email,
      Phone: lead.phone,
      Company: lead.company,
      City: lead.city,
      WorkshopName: lead.workshop_name,
      WorkshopDate: lead.workshop_date,
      Topic: lead.workshop_topic,
      Trainer: lead.trainer,
      Interest: lead.interest,
      Budget: lead.budget,
      Status: lead.status,
      Remark: lead.remark,
      CreatedAt: lead.created_at,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Workshop Leads");
    XLSX.writeFile(
      workbook,
      `Workshop_Leads_${new Date().toISOString().split("T")[0]}.xlsx`
    );

    toast.success("Workshop Leads Exported");
  };

  // Filter leads based on search
  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
      (lead.phone && lead.phone.includes(search)) ||
      (lead.company && lead.company.toLowerCase().includes(search.toLowerCase())) ||
      lead.workshop_name.toLowerCase().includes(search.toLowerCase())
  );

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "interested":
        return "bg-green-100 text-green-800";
      case "not_interested":
        return "bg-red-100 text-red-800";
      case "converted":
        return "bg-purple-100 text-purple-800";
      case "lost":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            Workshop Leads
          </h1>
          <p className="text-muted-foreground">
            Leads captured from training workshops
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>

          <label>
            <input
              type="file"
              hidden
              accept=".xlsx,.xls,.csv"
              onChange={handleImportExcel}
            />
            <Button variant="outline" asChild disabled={uploading}>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Importing..." : "Import Excel"}
              </span>
            </Button>
          </label>

          {canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Workshop Lead
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Edit" : "Add"} Workshop Lead
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 py-2">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={form.name || ""}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={form.phone || ""}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      value={form.email || ""}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Company</Label>
                    <Input
                      value={form.company || ""}
                      onChange={(e) =>
                        setForm({ ...form, company: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>City</Label>
                    <Input
                      value={form.city || ""}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Workshop Name *</Label>
                    <Input
                      value={form.workshop_name || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          workshop_name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Workshop Date</Label>
                    <Input
                      type="date"
                      value={form.workshop_date || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          workshop_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Topic</Label>
                    <Input
                      value={form.workshop_topic || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          workshop_topic: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Trainer</Label>
                    <Input
                      value={form.trainer || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          trainer: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Budget</Label>
                    <Input
                      value={form.budget || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          budget: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Interest</Label>
                    <Input
                      value={form.interest || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          interest: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select
                      value={form.status || "new"}
                      onValueChange={(v) =>
                        setForm({ ...form, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label>Remark</Label>
                    <Textarea
                      value={form.remark || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          remark: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={() => saveMutation.mutate(form)}
                    disabled={
                      !form.name ||
                      !form.workshop_name ||
                      saveMutation.isPending
                    }
                  >
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{leads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interested</p>
                <p className="text-2xl font-bold">
                  {leads.filter((l) => l.status === "interested").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold">
                  {leads.filter((l) => l.status === "converted").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {leads.length > 0
                    ? Math.round(
                        (leads.filter((l) => l.status === "converted").length /
                          leads.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, company, or workshop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Workshop Leads List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No workshop leads found</p>
              {canEdit && (
                <Button onClick={openCreate} variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first workshop lead
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Workshop</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {lead.email && <div>{lead.email}</div>}
                          {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{lead.workshop_name}</TableCell>
                      <TableCell>
                        {lead.workshop_date
                          ? new Date(lead.workshop_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.interest || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(lead)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Delete this workshop lead?")) {
                                    deleteMutation.mutate(lead.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
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
