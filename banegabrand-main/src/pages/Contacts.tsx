import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCrmQuery, useCrmInsert } from "@/hooks/useCrm";
import { Plus, Search, Phone, Mail, Loader2 } from "lucide-react";

interface DbContact { id: string; name: string; email: string | null; phone: string | null; company: string | null; position: string | null; tags: string[] | null; last_contact: string | null; }

export default function Contacts() {
  const { data: contacts = [], isLoading } = useCrmQuery<DbContact>("contacts");
  const insertContact = useCrmInsert("contacts");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", position: "" });

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.company || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name || !form.email) return;
    await insertContact.mutateAsync({ ...form, tags: ["New"], last_contact: new Date().toISOString() });
    setForm({ name: "", email: "", phone: "", company: "", position: "" });
    setDialogOpen(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Contacts</h1><p className="text-muted-foreground">Your business contacts</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Contact</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              {[{ l: "Name", k: "name" }, { l: "Email", k: "email" }, { l: "Phone", k: "phone" }, { l: "Company", k: "company" }, { l: "Position", k: "position" }].map(f => (
                <div key={f.k} className="grid gap-2"><Label>{f.l}</Label><Input value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} /></div>
              ))}
              <Button onClick={handleAdd} disabled={insertContact.isPending} className="mt-2">{insertContact.isPending ? "Adding..." : "Add Contact"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No contacts found. Add your first contact!</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(contact => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {contact.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">{contact.position} at {contact.company}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><Mail className="h-3.5 w-3.5" /><span className="truncate">{contact.email}</span></a>}
                  {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><Phone className="h-3.5 w-3.5" /><span>{contact.phone}</span></a>}
                </div>
                {contact.tags && contact.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {contact.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
