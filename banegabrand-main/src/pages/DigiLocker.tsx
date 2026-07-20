import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHasRole } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Upload, Loader2, FileCheck2, Clock, XCircle } from "lucide-react";

const DOC_TYPES = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "driving_license", label: "Driving License" },
  { value: "voter_id", label: "Voter ID" },
  { value: "passport", label: "Passport" },
  { value: "marksheet", label: "Education Marksheet" },
];

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  verified: "secondary",
  rejected: "destructive",
};

export default function DigiLocker() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const isLeader = useHasRole("owner", "admin", "hr_manager");

  const [form, setForm] = useState({ document_type: "aadhaar", document_number: "", full_name: "", date_of_birth: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: mine = [], isLoading: ml } = useQuery({
    queryKey: ["digilocker_mine", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("digilocker_verifications" as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const { data: all = [] } = useQuery({
    queryKey: ["digilocker_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("digilocker_verifications" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const userIds = [...new Set((data as any[]).map(d => d.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
      return (data as any[]).map(d => ({ ...d, name: (profiles || []).find(p => p.user_id === d.user_id)?.display_name || "Unknown" }));
    },
    enabled: isLeader,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      let document_url: string | null = null;
      if (file) {
        setUploading(true);
        const path = `${user.id}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from("digilocker").upload(path, file);
        if (upErr) throw upErr;
        document_url = path;
      }
      const { error } = await supabase.from("digilocker_verifications" as any).insert({
        user_id: user.id,
        ...form,
        date_of_birth: form.date_of_birth || null,
        document_url,
        verification_status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Submitted", description: "Your document is awaiting verification." });
      setForm({ document_type: "aadhaar", document_number: "", full_name: "", date_of_birth: "" });
      setFile(null);
      qc.invalidateQueries({ queryKey: ["digilocker_mine"] });
      qc.invalidateQueries({ queryKey: ["digilocker_all"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    onSettled: () => setUploading(false),
  });

  const verify = useMutation({
    mutationFn: async ({ id, status, remarks }: { id: string; status: string; remarks?: string }) => {
      const { error } = await supabase.from("digilocker_verifications" as any).update({
        verification_status: status,
        verified_by: user!.id,
        verified_at: new Date().toISOString(),
        remarks: remarks ?? null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Verification updated" });
      qc.invalidateQueries({ queryKey: ["digilocker_all"] });
      qc.invalidateQueries({ queryKey: ["digilocker_mine"] });
    },
  });

  const downloadDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("digilocker").createSignedUrl(path, 60);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DigiLocker Verification</h1>
          <p className="text-muted-foreground">Upload identity documents for employee verification</p>
        </div>
      </div>

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">My Documents</TabsTrigger>
          {isLeader && <TabsTrigger value="all">Verify Team ({all.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="my" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submit New Document</CardTitle>
              <CardDescription>Provide your DigiLocker-issued documents for HR verification.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Document Type</Label>
                <Select value={form.document_type} onValueChange={v => setForm({ ...form, document_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Document Number</Label><Input value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })} placeholder="XXXX-XXXX-XXXX" /></div>
              <div className="grid gap-2"><Label>Full Name (as on document)</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
              <div className="grid gap-2 md:col-span-2">
                <Label>Upload Document (PDF / Image)</Label>
                <Input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <div className="md:col-span-2">
                <Button onClick={() => submit.mutate()} disabled={uploading || submit.isPending || !form.document_number}>
                  {uploading || submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Submit for Verification
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">My Submissions</CardTitle></CardHeader>
            <CardContent>
              {ml ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Number</TableHead><TableHead>Status</TableHead><TableHead>Remarks</TableHead><TableHead>Document</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {mine.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="capitalize">{d.document_type.replace("_", " ")}</TableCell>
                        <TableCell className="font-mono text-xs">{d.document_number}</TableCell>
                        <TableCell><Badge variant={statusColor[d.verification_status]}>{d.verification_status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{d.remarks || "—"}</TableCell>
                        <TableCell>{d.document_url ? <Button size="sm" variant="link" onClick={() => downloadDoc(d.document_url)}>View</Button> : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {mine.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">No documents submitted yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isLeader && (
          <TabsContent value="all">
            <Card>
              <CardHeader><CardTitle className="text-base">Team DigiLocker Verifications</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Number</TableHead><TableHead>Status</TableHead><TableHead>Document</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {all.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="capitalize">{d.document_type.replace("_", " ")}</TableCell>
                        <TableCell className="font-mono text-xs">{d.document_number}</TableCell>
                        <TableCell><Badge variant={statusColor[d.verification_status]}>{d.verification_status}</Badge></TableCell>
                        <TableCell>{d.document_url ? <Button size="sm" variant="link" onClick={() => downloadDoc(d.document_url)}>View</Button> : "—"}</TableCell>
                        <TableCell className="space-x-1">
                          <Button size="sm" variant="outline" onClick={() => verify.mutate({ id: d.id, status: "verified" })}><FileCheck2 className="h-3 w-3 mr-1" />Verify</Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            const reason = prompt("Reason for rejection?") || "";
                            verify.mutate({ id: d.id, status: "rejected", remarks: reason });
                          }}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {all.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">No submissions yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
