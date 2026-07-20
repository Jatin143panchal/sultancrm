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
import { Camera, Save, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const { data: roles } = useUserRoles();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name ?? "");
        setAvatarUrl(data.avatar_url);
      }
    });
  }, [user]);

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
    </div>
  );
}
