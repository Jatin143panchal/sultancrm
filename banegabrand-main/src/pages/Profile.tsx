import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Save, KeyRound, UserPlus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email?: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { data: roles } = useUserRoles();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ---- Admin: Manage Agents state ----
  const isAdmin = roles?.includes("admin");
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name ?? "");
        setAvatarUrl(data.avatar_url);
      }
    });
  }, [user]);

  useEffect(() => {
    if (isAdmin) fetchAgents();
  }, [isAdmin]);

  const fetchAgents = async () => {
    setAgentsLoading(true);
    // user_roles table se 'agent' role wale users lao, profile info ke saath
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, profiles(display_name, avatar_url)")
      .eq("role", "agent");

    if (error) {
      toast({ title: "Agents load nahi ho paye", description: error.message, variant: "destructive" });
      setAgentsLoading(false);
      return;
    }

    const rows: AgentRow[] = (data ?? []).map((r: any) => ({
      user_id: r.user_id,
      display_name: r.profiles?.display_name ?? null,
      avatar_url: r.profiles?.avatar_url ?? null,
    }));
    setAgents(rows);
    setAgentsLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, avatar_url: avatarUrl }).eq("user_id", user.id);
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated" });
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
      toast({ title: "Photo updated" });
    }
    setUploading(false);
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Min 6 characters", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Password updated" });
      setNewPassword("");
    }
  };

  // ---- Create a new agent (signup) — calls secure edge function ----
  const createAgent = async () => {
    if (!newAgentEmail || !newAgentPassword || newAgentPassword.length < 6) {
      toast({ title: "Email aur kam se kam 6 character ka password daalein", variant: "destructive" });
      return;
    }
    setCreatingAgent(true);
    const { data, error } = await supabase.functions.invoke("manage-agents", {
      body: {
        action: "create",
        email: newAgentEmail,
        password: newAgentPassword,
        display_name: newAgentName || newAgentEmail.split("@")[0],
      },
    });
    setCreatingAgent(false);

    if (error || data?.error) {
      toast({
        title: "Agent create nahi hua",
        description: error?.message || data?.error || "Kuch galat ho gaya",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Agent create ho gaya", description: newAgentEmail });
    setNewAgentEmail("");
    setNewAgentPassword("");
    setNewAgentName("");
    fetchAgents();
  };

  // ---- Delete an agent — calls secure edge function ----
  const deleteAgent = async (agentUserId: string) => {
    setDeletingId(agentUserId);
    const { data, error } = await supabase.functions.invoke("manage-agents", {
      body: { action: "delete", user_id: agentUserId },
    });
    setDeletingId(null);

    if (error || data?.error) {
      toast({
        title: "Agent delete nahi hua",
        description: error?.message || data?.error || "Kuch galat ho gaya",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Agent delete ho gaya" });
    setAgents((prev) => prev.filter((a) => a.user_id !== agentUserId));
  };

  const initials = (displayName || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Update your name and photo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:opacity-90">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
              </label>
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">{user?.email}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {roles?.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>

          <Button onClick={saveProfile} disabled={loading}>
            <Save className="h-4 w-4 mr-2" /> Save Profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
          </div>
          <Button onClick={updatePassword} variant="outline">
            <KeyRound className="h-4 w-4 mr-2" /> Update Password
          </Button>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Agents</CardTitle>
            <CardDescription>Naya agent ID banayein ya existing agent delete karein</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create agent form */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Agent Name</Label>
                <Input
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="Agent ka naam"
                />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  placeholder="agent@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newAgentPassword}
                  onChange={(e) => setNewAgentPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  minLength={6}
                />
              </div>
            </div>
            <Button onClick={createAgent} disabled={creatingAgent}>
              {creatingAgent ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Add Agent
            </Button>

            {/* Agent list */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-muted-foreground">Existing Agents</Label>
              {agentsLoading ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </div>
              ) : agents.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">Koi agent nahi mila</div>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.user_id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {agent.avatar_url && <AvatarImage src={agent.avatar_url} />}
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {(agent.display_name || "A").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-medium">
                        {agent.display_name || "Unnamed Agent"}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteAgent(agent.user_id)}
                      disabled={deletingId === agent.user_id}
                    >
                      {deletingId === agent.user_id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
