import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettingsQuery, useSettingsInsert, useSettingsUpdate, useSettingsDelete } from "@/hooks/useSettings";
import {
  Building2, HelpCircle, LayoutDashboard, Menu, Upload, Bot, FileText, Mail,
  Target, ListChecks, FolderOpen, Wallet, Boxes, ScrollText, FormInput, Wrench,
  Plus, Trash2, Edit, Loader2, Check, X
} from "lucide-react";

// ---------- Generic CRUD list component ----------
function CrudSection<T extends { id: string; is_active?: boolean }>({
  title, description, icon: Icon, table, columns, renderForm, renderRow,
}: {
  title: string; description: string; icon: any;
  table: Parameters<typeof useSettingsQuery>[0];
  columns: string[];
  renderForm: (values: Record<string, any>, set: (v: Record<string, any>) => void) => React.ReactNode;
  renderRow: (item: T) => React.ReactNode[];
}) {
  const { data = [], isLoading } = useSettingsQuery<T>(table);
  const insert = useSettingsInsert(table);
  const update = useSettingsUpdate(table);
  const del = useSettingsDelete(table);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [editId, setEditId] = useState<string | null>(null);

  const handleSave = () => {
    if (editId) {
      update.mutate({ id: editId, ...form }, { onSuccess: () => { setOpen(false); setEditId(null); setForm({}); } });
    } else {
      insert.mutate(form, { onSuccess: () => { setOpen(false); setForm({}); } });
    }
  };

  const handleEdit = (item: T) => {
    const { id, user_id, created_at, updated_at, ...rest } = item as any;
    setEditId(id);
    setForm(rest);
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2"><Icon className="h-4 w-4" />{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({}); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} {title}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              {renderForm(form, setForm)}
              <Button onClick={handleSave} disabled={insert.isPending || update.isPending} className="w-full">
                {(insert.isPending || update.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editId ? "Update" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No {title.toLowerCase()} configured yet</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(c => <TableHead key={c}>{c}</TableHead>)}
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    {renderRow(item).map((cell, i) => <TableCell key={i}>{cell}</TableCell>)}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => del.mutate(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
  );
}

// ---------- Settings sections ----------
const sections = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "lead-source", label: "Lead Sources", icon: Target },
  { id: "lead-status", label: "Lead Status", icon: ListChecks },
  { id: "categories", label: "Categories", icon: FolderOpen },
  { id: "expense-head", label: "Expense Head", icon: Wallet },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "email", label: "Email Setting", icon: Mail },
  { id: "custom-fields", label: "Custom Fields", icon: FormInput },
  { id: "services", label: "Services", icon: Wrench },
  { id: "modules", label: "Modules", icon: Boxes },
  { id: "terms", label: "Terms & Conditions", icon: ScrollText },
  { id: "dashboard", label: "Dashboard Columns", icon: LayoutDashboard },
  { id: "menu", label: "Manage Menu", icon: Menu },
  { id: "import", label: "Lead Import", icon: Upload },
  { id: "help", label: "Help & Support", icon: HelpCircle },
];

export default function Settings() {
  const [active, setActive] = useState("company");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your CRM configuration</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                  active === s.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <s.icon className="h-4 w-4 shrink-0" />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {active === "company" && <CompanySection />}
          {active === "lead-source" && <LeadSourceSection />}
          {active === "lead-status" && <LeadStatusSection />}
          {active === "categories" && <CategoriesSection />}
          {active === "expense-head" && <ExpenseHeadSection />}
          {active === "templates" && <TemplatesSection />}
          {active === "email" && <EmailSettingSection />}
          {active === "custom-fields" && <CustomFieldsSection />}
          {active === "services" && <ServicesSection />}
          {active === "modules" && <ModulesSection />}
          {active === "terms" && <TermsSection />}
          {active === "dashboard" && <DashboardColumnsSection />}
          {active === "menu" && <ManageMenuSection />}
          {active === "import" && <LeadImportSection />}
          {active === "help" && <HelpSection />}
        </div>
      </div>
    </div>
  );
}

// ---- Company ----
function CompanySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Company Profile</CardTitle>
        <CardDescription>Update your company information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        <div className="grid gap-2"><Label>Company Name</Label><Input defaultValue="BanegaBrand Pvt Ltd" /></div>
        <div className="grid gap-2"><Label>Industry</Label><Input defaultValue="Technology & Consulting" /></div>
        <div className="grid gap-2"><Label>Website</Label><Input defaultValue="https://banegabrand.com" /></div>
        <div className="grid gap-2"><Label>Phone</Label><Input defaultValue="+91 11 2345 6789" /></div>
        <div className="grid gap-2"><Label>Address</Label><Textarea rows={2} defaultValue="New Delhi, India" /></div>
        <div className="grid gap-2"><Label>GST Number</Label><Input placeholder="Enter GST number" /></div>
        <Button>Save Changes</Button>
      </CardContent>
    </Card>
  );
}

// ---- Lead Sources ----
function LeadSourceSection() {
  return (
    <CrudSection<any>
      title="Lead Sources" description="Manage where your leads come from" icon={Target} table="lead_sources"
      columns={["Name", "Status"]}
      renderForm={(v, set) => (
        <>
          <div className="grid gap-2"><Label>Source Name</Label><Input value={v.name || ""} onChange={e => set({ ...v, name: e.target.value })} placeholder="e.g. Website, Referral, Cold Call" /></div>
          <div className="flex items-center gap-2"><Switch checked={v.is_active !== false} onCheckedChange={c => set({ ...v, is_active: c })} /><Label>Active</Label></div>
        </>
      )}
      renderRow={(item) => [
        item.name,
        <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge>,
      ]}
    />
  );
}

// ---- Lead Status ----
function LeadStatusSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4" />Manage Lead Status</CardTitle>
        <CardDescription>System lead statuses used across the CRM</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {["New", "Contacted", "Answered", "Not Answered", "Qualified", "Converted", "Lost"].map(s => (
            <div key={s} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">{s}</span>
              <Badge variant="outline">System</Badge>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">Lead statuses are system-defined. Use "Business Status" field on leads for custom tracking (Active, No-Go, Done).</p>
      </CardContent>
    </Card>
  );
}

// ---- Categories ----
function CategoriesSection() {
  return (
    <CrudSection<any>
      title="Categories" description="Organize leads, contacts, and helpdesk by category" icon={FolderOpen} table="categories"
      columns={["Name", "Type", "Status"]}
      renderForm={(v, set) => (
        <>
          <div className="grid gap-2"><Label>Category Name</Label><Input value={v.name || ""} onChange={e => set({ ...v, name: e.target.value })} /></div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select value={v.type || "general"} onValueChange={val => set({ ...v, type: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="helpdesk">Helpdesk</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2"><Switch checked={v.is_active !== false} onCheckedChange={c => set({ ...v, is_active: c })} /><Label>Active</Label></div>
        </>
      )}
      renderRow={(item) => [
        item.name,
        <Badge variant="outline">{item.type}</Badge>,
        <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge>,
      ]}
    />
  );
}

// ---- Expense Head ----
function ExpenseHeadSection() {
  return (
    <CrudSection<any>
      title="Expense Heads" description="Define expense categories for tracking" icon={Wallet} table="expense_heads"
      columns={["Name", "Description", "Status"]}
      renderForm={(v, set) => (
        <>
          <div className="grid gap-2"><Label>Name</Label><Input value={v.name || ""} onChange={e => set({ ...v, name: e.target.value })} placeholder="e.g. Travel, Office Supplies" /></div>
          <div className="grid gap-2"><Label>Description</Label><Input value={v.description || ""} onChange={e => set({ ...v, description: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={v.is_active !== false} onCheckedChange={c => set({ ...v, is_active: c })} /><Label>Active</Label></div>
        </>
      )}
      renderRow={(item) => [
        item.name,
        <span className="text-muted-foreground text-sm">{item.description || "—"}</span>,
        <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge>,
      ]}
    />
  );
}

// ---- Templates ----
function TemplatesSection() {
  return (
    <CrudSection<any>
      title="Templates" description="Create email, SMS, and WhatsApp templates" icon={FileText} table="templates"
      columns={["Name", "Type", "Subject", "Status"]}
      renderForm={(v, set) => (
        <>
          <div className="grid gap-2"><Label>Template Name</Label><Input value={v.name || ""} onChange={e => set({ ...v, name: e.target.value })} /></div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select value={v.type || "email"} onValueChange={val => set({ ...v, type: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2"><Label>Subject</Label><Input value={v.subject || ""} onChange={e => set({ ...v, subject: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Body</Label><Textarea value={v.body || ""} onChange={e => set({ ...v, body: e.target.value })} rows={5} placeholder="Use {{name}}, {{company}} for dynamic fields" /></div>
          <div className="flex items-center gap-2"><Switch checked={v.is_active !== false} onCheckedChange={c => set({ ...v, is_active: c })} /><Label>Active</Label></div>
        </>
      )}
      renderRow={(item) => [
        item.name,
        <Badge variant="outline">{item.type}</Badge>,
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{item.subject || "—"}</span>,
        <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge>,
      ]}
    />
  );
}

// ---- Email Settings ----
function EmailSettingSection() {
  const { data = [], isLoading } = useSettingsQuery<any>("email_settings");
  const insert = useSettingsInsert("email_settings");
  const update = useSettingsUpdate("email_settings");
  const existing = data[0];
  const [form, setForm] = useState<Record<string, any>>({});
  const f = existing ? { ...existing, ...form } : form;
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const handleSave = () => {
    if (existing) {
      update.mutate({ id: existing.id, ...form });
    } else {
      insert.mutate(form);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" />Email Configuration</CardTitle>
        <CardDescription>Configure SMTP settings for sending emails</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <>
            <div className="grid gap-2"><Label>SMTP Host</Label><Input value={f.smtp_host || ""} onChange={e => set("smtp_host", e.target.value)} placeholder="smtp.gmail.com" /></div>
            <div className="grid gap-2"><Label>SMTP Port</Label><Input type="number" value={f.smtp_port || 587} onChange={e => set("smtp_port", parseInt(e.target.value))} /></div>
            <div className="grid gap-2"><Label>SMTP Username</Label><Input value={f.smtp_user || ""} onChange={e => set("smtp_user", e.target.value)} /></div>
            <div className="grid gap-2"><Label>SMTP Password</Label><Input type="password" value={f.smtp_password || ""} onChange={e => set("smtp_password", e.target.value)} /></div>
            <div className="grid gap-2"><Label>From Name</Label><Input value={f.from_name || ""} onChange={e => set("from_name", e.target.value)} placeholder="BanegaBrand" /></div>
            <div className="grid gap-2"><Label>From Email</Label><Input value={f.from_email || ""} onChange={e => set("from_email", e.target.value)} placeholder="noreply@banegabrand.com" /></div>
            <div className="flex items-center gap-2"><Switch checked={f.is_active || false} onCheckedChange={c => set("is_active", c)} /><Label>Enable Email Sending</Label></div>
            <Button onClick={handleSave} disabled={insert.isPending || update.isPending}>
              {(insert.isPending || update.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Email Settings
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Custom Fields ----
function CustomFieldsSection() {
  return (
    <CrudSection<any>
      title="Custom Fields" description="Add custom fields to any module" icon={FormInput} table="custom_fields"
      columns={["Field Name", "Module", "Type", "Required"]}
      renderForm={(v, set) => (
        <>
          <div className="grid gap-2"><Label>Field Name</Label><Input value={v.field_name || ""} onChange={e => set({ ...v, field_name: e.target.value })} /></div>
          <div className="grid gap-2">
            <Label>Module</Label>
            <Select value={v.module || "leads"} onValueChange={val => set({ ...v, module: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="contacts">Contacts</SelectItem>
                <SelectItem value="deals">Deals</SelectItem>
                <SelectItem value="activities">Activities</SelectItem>
                <SelectItem value="helpdesk">Helpdesk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Field Type</Label>
            <Select value={v.field_type || "text"} onValueChange={val => set({ ...v, field_type: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {v.field_type === "dropdown" && (
            <div className="grid gap-2"><Label>Options (comma separated)</Label><Input value={v.field_options?.join?.(", ") || ""} onChange={e => set({ ...v, field_options: e.target.value.split(",").map((s: string) => s.trim()) })} /></div>
          )}
          <div className="grid gap-2"><Label>Sort Order</Label><Input type="number" value={v.sort_order || 0} onChange={e => set({ ...v, sort_order: parseInt(e.target.value) })} /></div>
          <div className="flex items-center gap-2"><Switch checked={v.is_required || false} onCheckedChange={c => set({ ...v, is_required: c })} /><Label>Required</Label></div>
        </>
      )}
      renderRow={(item) => [
        item.field_name,
        <Badge variant="outline">{item.module}</Badge>,
        <Badge variant="secondary">{item.field_type}</Badge>,
        item.is_required ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" />,
      ]}
    />
  );
}

// ---- Services ----
function ServicesSection() {
  return (
    <CrudSection<any>
      title="Services" description="Manage your service catalog for quotations" icon={Wrench} table="services"
      columns={["Name", "Price", "Unit", "Status"]}
      renderForm={(v, set) => (
        <>
          <div className="grid gap-2"><Label>Service Name</Label><Input value={v.name || ""} onChange={e => set({ ...v, name: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Description</Label><Textarea value={v.description || ""} onChange={e => set({ ...v, description: e.target.value })} rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Price (₹)</Label><Input type="number" value={v.price || 0} onChange={e => set({ ...v, price: parseFloat(e.target.value) })} /></div>
            <div className="grid gap-2"><Label>Unit</Label><Input value={v.unit || "per unit"} onChange={e => set({ ...v, unit: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={v.is_active !== false} onCheckedChange={c => set({ ...v, is_active: c })} /><Label>Active</Label></div>
        </>
      )}
      renderRow={(item) => [
        <div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.description || ""}</p></div>,
        <span>₹{Number(item.price || 0).toLocaleString()}</span>,
        item.unit,
        <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge>,
      ]}
    />
  );
}

// ---- Modules ----
function ModulesSection() {
  const { data = [], isLoading } = useSettingsQuery<any>("modules");
  const insert = useSettingsInsert("modules");
  const update = useSettingsUpdate("modules");

  const defaultModules = [
    { name: "Leads", slug: "leads" }, { name: "Contacts", slug: "contacts" }, { name: "Deals", slug: "deals" },
    { name: "Activities", slug: "activities" }, { name: "Helpdesk", slug: "helpdesk" }, { name: "Attendance", slug: "attendance" },
    { name: "Marketing", slug: "marketing" }, { name: "Quotations", slug: "quotations" }, { name: "Holidays", slug: "holidays" },
    { name: "Reports", slug: "reports" },
  ];

  const getModuleState = (slug: string) => {
    const found = data.find((m: any) => m.slug === slug);
    return found ? found.is_enabled : true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Boxes className="h-4 w-4" />Modules</CardTitle>
        <CardDescription>Enable or disable CRM modules</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <div className="space-y-3">
            {defaultModules.map(mod => (
              <div key={mod.slug} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{mod.name}</p>
                  <p className="text-xs text-muted-foreground">/{mod.slug}</p>
                </div>
                <Switch
                  checked={getModuleState(mod.slug)}
                  onCheckedChange={(checked) => {
                    const existing = data.find((m: any) => m.slug === mod.slug);
                    if (existing) {
                      update.mutate({ id: existing.id, is_enabled: checked });
                    } else {
                      insert.mutate({ name: mod.name, slug: mod.slug, is_enabled: checked });
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Terms & Conditions ----
function TermsSection() {
  return (
    <CrudSection<any>
      title="Terms & Conditions" description="Manage T&C for quotations and invoices" icon={ScrollText} table="terms_conditions"
      columns={["Title", "Default", "Status"]}
      renderForm={(v, set) => (
        <>
          <div className="grid gap-2"><Label>Title</Label><Input value={v.title || ""} onChange={e => set({ ...v, title: e.target.value })} placeholder="Standard Terms" /></div>
          <div className="grid gap-2"><Label>Content</Label><Textarea value={v.content || ""} onChange={e => set({ ...v, content: e.target.value })} rows={6} placeholder="Enter terms and conditions..." /></div>
          <div className="flex items-center gap-2"><Switch checked={v.is_default || false} onCheckedChange={c => set({ ...v, is_default: c })} /><Label>Set as Default</Label></div>
        </>
      )}
      renderRow={(item) => [
        <div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground truncate max-w-[300px]">{item.content}</p></div>,
        item.is_default ? <Badge>Default</Badge> : <span className="text-muted-foreground text-sm">—</span>,
        <Badge variant={item.is_active ? "default" : "secondary"}>{item.is_active ? "Active" : "Inactive"}</Badge>,
      ]}
    />
  );
}

// ---- Dashboard Columns ----
function DashboardColumnsSection() {
  const { data = [], isLoading } = useSettingsQuery<any>("dashboard_columns");
  const insert = useSettingsInsert("dashboard_columns");
  const update = useSettingsUpdate("dashboard_columns");

  const defaultCols = [
    { name: "Total Pipeline", module: "dashboard" }, { name: "Revenue Won", module: "dashboard" },
    { name: "Active Leads", module: "dashboard" }, { name: "Open Deals", module: "dashboard" },
    { name: "Today's Activities", module: "dashboard" }, { name: "Recent Deals", module: "dashboard" },
    { name: "Pipeline Chart", module: "dashboard" },
  ];

  const getColState = (name: string) => {
    const found = data.find((c: any) => c.column_name === name);
    return found ? found.is_visible : true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />Dashboard Columns</CardTitle>
        <CardDescription>Show or hide dashboard widgets</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <div className="space-y-3">
            {defaultCols.map(col => (
              <div key={col.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{col.name}</span>
                <Switch
                  checked={getColState(col.name)}
                  onCheckedChange={(checked) => {
                    const existing = data.find((c: any) => c.column_name === col.name);
                    if (existing) {
                      update.mutate({ id: existing.id, is_visible: checked });
                    } else {
                      insert.mutate({ column_name: col.name, module: col.module, is_visible: checked });
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Manage Menu ----
function ManageMenuSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Menu className="h-4 w-4" />Manage Menu</CardTitle>
        <CardDescription>Customize sidebar menu order and visibility</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {["Dashboard", "Leads", "Contacts", "Deals", "Activities", "Helpdesk", "Attendance", "Marketing", "Quotations", "Holidays", "Reports"].map((item, i) => (
            <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono w-6">{i + 1}</span>
                <span className="text-sm font-medium">{item}</span>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">Menu order changes will reflect in the sidebar navigation.</p>
      </CardContent>
    </Card>
  );
}

// ---- Lead Import ----
function LeadImportSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" />Other Party Lead Import</CardTitle>
        <CardDescription>Import leads from third-party sources via CSV or Excel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Drag & drop your file here</p>
          <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .csv files up to 10MB</p>
          <Button variant="outline" className="mt-4">Browse Files</Button>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2">Expected Format</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Column A: <strong>Name</strong> (required)</p>
            <p>• Column B: <strong>Email</strong></p>
            <p>• Column C: <strong>Phone</strong></p>
            <p>• Column D: <strong>Company</strong></p>
            <p>• Column E: <strong>Source</strong></p>
            <p>• Column F: <strong>Value</strong></p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">💡 Tip: Use the Leads page for full import with preview and column mapping.</p>
      </CardContent>
    </Card>
  );
}

// ---- Help ----
function HelpSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><HelpCircle className="h-4 w-4" />Help & Support</CardTitle>
        <CardDescription>Get help with using the CRM</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { title: "Getting Started", desc: "Learn how to set up your CRM and start managing leads" },
          { title: "Lead Management", desc: "Import, score, and convert leads efficiently" },
          { title: "Deal Pipeline", desc: "Track deals through stages from prospecting to close" },
          { title: "Helpdesk & Tickets", desc: "Manage customer support tickets and complaints" },
          { title: "Attendance Tracking", desc: "Check in/out, apply for leaves, and view reports" },
          { title: "Marketing Campaigns", desc: "Create campaigns, track ROI, and measure performance" },
          { title: "Quotations", desc: "Generate professional quotes with line items and T&C" },
          { title: "Reports & Analytics", desc: "View dashboards, export data, and generate reports" },
        ].map(item => (
          <div key={item.title} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
        <div className="border-t pt-4">
          <p className="text-sm font-medium">Need more help?</p>
          <p className="text-xs text-muted-foreground mt-1">Contact support at support@banegabrand.com or call +91 11 2345 6789</p>
        </div>
      </CardContent>
    </Card>
  );
}
