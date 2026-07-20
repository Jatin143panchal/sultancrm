import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Loader2, Trash2, Download, IndianRupee, Eye } from "lucide-react";
import { toast } from "sonner";

interface Quotation {
  id: string;
  quote_number: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  items: QuoteItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  notes: string | null;
  valid_until: string | null;
  created_at: string;
}

interface QuoteItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

// We'll store quotations in localStorage since we don't have a table yet
function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("quotations") || "[]");
    } catch { return []; }
  });

  const save = (q: Quotation[]) => {
    setQuotations(q);
    localStorage.setItem("quotations", JSON.stringify(q));
  };

  return { quotations, save };
}

const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;

export default function Quotations() {
  const { quotations, save } = useQuotations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quotation | null>(null);
  const [form, setForm] = useState({
    client_name: "", client_email: "", client_phone: "", client_company: "",
    notes: "", valid_until: "", tax_rate: "18",
  });
  const [items, setItems] = useState<QuoteItem[]>([{ description: "", quantity: 1, rate: 0, amount: 0 }]);

  const addItem = () => setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const updated = [...items];
    (updated[i] as any)[field] = value;
    updated[i].amount = updated[i].quantity * updated[i].rate;
    setItems(updated);
  };

  const subtotal = items.reduce((s, item) => s + item.amount, 0);
  const taxRate = Number(form.tax_rate) || 0;
  const taxAmount = subtotal * taxRate / 100;
  const total = subtotal + taxAmount;

  const handleCreate = () => {
    if (!form.client_name || items.every(i => !i.description)) return;
    const quote: Quotation = {
      id: crypto.randomUUID(),
      quote_number: `QT-${String(quotations.length + 1).padStart(4, "0")}`,
      client_name: form.client_name,
      client_email: form.client_email || null,
      client_phone: form.client_phone || null,
      client_company: form.client_company || null,
      items: items.filter(i => i.description),
      subtotal, tax_rate: taxRate, tax_amount: taxAmount, total,
      status: "draft",
      notes: form.notes || null,
      valid_until: form.valid_until || null,
      created_at: new Date().toISOString(),
    };
    save([quote, ...quotations]);
    setForm({ client_name: "", client_email: "", client_phone: "", client_company: "", notes: "", valid_until: "", tax_rate: "18" });
    setItems([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
    setDialogOpen(false);
    toast.success(`Quotation ${quote.quote_number} created!`);
  };

  const updateStatus = (id: string, status: string) => {
    save(quotations.map(q => q.id === id ? { ...q, status } : q));
    toast.success("Status updated");
  };

  const deleteQuote = (id: string) => {
    save(quotations.filter(q => q.id !== id));
    toast.success("Quotation deleted");
  };

  const printQuote = (q: Quotation) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${q.quote_number}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:auto}
      table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#f5f5f5}.total{font-weight:bold;font-size:18px}.header{display:flex;justify-content:space-between;align-items:start}
      h1{color:#1a1a1a;margin:0}h2{color:#666;margin:5px 0}.info{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0}
      </style></head><body>
      <div class="header"><div><h1>QUOTATION</h1><h2>${q.quote_number}</h2></div>
      <div style="text-align:right"><h2>BanegaBrand Pvt Ltd</h2><p>Date: ${new Date(q.created_at).toLocaleDateString()}</p>
      ${q.valid_until ? `<p>Valid Until: ${new Date(q.valid_until).toLocaleDateString()}</p>` : ""}</div></div>
      <div class="info"><div><h3>Bill To:</h3><p><strong>${q.client_name}</strong></p>
      ${q.client_company ? `<p>${q.client_company}</p>` : ""}
      ${q.client_email ? `<p>${q.client_email}</p>` : ""}
      ${q.client_phone ? `<p>${q.client_phone}</p>` : ""}</div></div>
      <table><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Rate (₹)</th><th>Amount (₹)</th></tr></thead><tbody>
      ${q.items.map((item, i) => `<tr><td>${i + 1}</td><td>${item.description}</td><td>${item.quantity}</td><td>${item.rate.toLocaleString("en-IN")}</td><td>${item.amount.toLocaleString("en-IN")}</td></tr>`).join("")}
      </tbody></table>
      <div style="text-align:right;margin-top:10px"><p>Subtotal: ₹${q.subtotal.toLocaleString("en-IN")}</p>
      <p>Tax (${q.tax_rate}%): ₹${q.tax_amount.toLocaleString("en-IN")}</p>
      <p class="total">Total: ₹${q.total.toLocaleString("en-IN")}</p></div>
      ${q.notes ? `<div style="margin-top:30px;padding:15px;background:#f9f9f9;border-radius:8px"><h3>Notes:</h3><p>${q.notes}</p></div>` : ""}
      <script>window.print()</script></body></html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Quotations & Invoices</h1><p className="text-muted-foreground">Create and manage sales quotations</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Quotation</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Quotation</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Client Name *</Label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Company</Label><Input value={form.client_company} onChange={e => setForm({ ...form, client_company: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Email</Label><Input value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Phone</Label><Input value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} /></div>
              </div>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-semibold">Line Items</Label>
                  <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-3 w-3" />Add Item</Button>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5"><Input placeholder="Description" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} /></div>
                      <div className="col-span-2"><Input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", Number(e.target.value))} /></div>
                      <div className="col-span-2"><Input type="number" placeholder="Rate" value={item.rate || ""} onChange={e => updateItem(i, "rate", Number(e.target.value))} /></div>
                      <div className="col-span-2"><Input value={formatCurrency(item.amount)} disabled /></div>
                      <Button variant="ghost" size="icon" className="h-10" onClick={() => removeItem(i)} disabled={items.length === 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Tax Rate (%)</Label><Input type="number" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Valid Until</Label><Input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} /></div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm">Subtotal: <strong>{formatCurrency(subtotal)}</strong></p>
                <p className="text-sm">Tax ({taxRate}%): <strong>{formatCurrency(taxAmount)}</strong></p>
                <p className="text-lg font-bold">Total: {formatCurrency(total)}</p>
              </div>
              <div className="grid gap-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Terms, conditions, payment details..." /></div>
              <Button onClick={handleCreate} className="w-full">Create Quotation</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{quotations.length}</p><p className="text-xs text-muted-foreground">Total Quotations</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{formatCurrency(quotations.filter(q => q.status === "accepted").reduce((s, q) => s + q.total, 0))}</p><p className="text-xs text-muted-foreground">Accepted Value</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{quotations.filter(q => q.status === "draft").length}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All Quotations</CardTitle></CardHeader>
        <CardContent>
          {quotations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No quotations yet. Create your first quotation!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map(q => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium text-sm">{q.quote_number}</TableCell>
                    <TableCell><div><p className="text-sm font-medium">{q.client_name}</p><p className="text-xs text-muted-foreground">{q.client_company}</p></div></TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{q.items.length} items</TableCell>
                    <TableCell className="font-semibold text-sm">{formatCurrency(q.total)}</TableCell>
                    <TableCell>
                      <Select value={q.status} onValueChange={v => updateStatus(q.id, v)}>
                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["draft", "sent", "accepted", "rejected", "expired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printQuote(q)}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteQuote(q.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
