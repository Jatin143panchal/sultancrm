import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, KeyRound, User, Shield, Phone, Mail, Building } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { data: roles = [], isLoading: rolesLoading } = useUserRoles();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .or(`user_id.eq.${user.id},id.eq.${user.id}`)
          .maybeSingle();

        if (error) {
          console.warn("Profile fetch error:", error);
        }

        if (data) {
          setDisplayName(data.display_name || data.full_name || "");
          setPhone(data.phone || "");
          setDepartment(data.department || "Telecalling");
        } else {
          setDisplayName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
          setPhone(user.user_metadata?.phone || "");
          setDepartment("Telecalling");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          user_id: user.id,
          display_name: displayName.trim(),
          full_name: displayName.trim(),
          phone: phone.trim() || null,
          email: user.email,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Profile successfully update ho gayi!");
    } catch (err: any) {
      toast.error(err.message || "Profile update nahi ho saki");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password kam se kam 6 characters ka hona chahiye");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Password aur Confirm Password match nahi ho rahe");
      return;
    }

    setChangingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      toast.success("Password successfully update ho gaya!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Password update fail hua");
    } finally {
      setChangingPass(false);
    }
  };

  const initials = (displayName || user?.email || "U").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-sm">Apni profile details aur security settings manage karein</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3">
              <Avatar className="h-24 w-24 text-2xl font-bold border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-lg">{displayName || "User"}</CardTitle>
            <CardDescription className="text-xs break-all">{user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 text-center space-y-3">
            <div className="flex flex-wrap justify-center gap-1">
              {roles.length > 0 ? (
                roles.map((r) => (
                  <Badge key={r} variant={r === "admin" || r === "owner" ? "default" : "secondary"} className="capitalize">
                    <Shield className="h-3 w-3 mr-1" />
                    {r === "tl" ? "Team Leader" : r}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">Employee</Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t flex flex-col gap-1.5 text-left">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{user?.email}</span>
              </div>
              {phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{department || "Telecalling"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription>Apna naam aur contact number update karein</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="display-name">Display Name / Full Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Apna poora naam daalein"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-muted cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Email login ke liye use hoti hai aur change nahi ki ja sakti.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" /> Change Password
              </CardTitle>
              <CardDescription>Apna naya login password set karein</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="new-pass">New Password</Label>
                <Input
                  id="new-pass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kam se kam 6 characters"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-pass">Confirm New Password</Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Dobara password daalein"
                />
              </div>

              <Button onClick={handleUpdatePassword} disabled={changingPass} variant="outline" className="w-full sm:w-auto">
                {changingPass ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                Update Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
