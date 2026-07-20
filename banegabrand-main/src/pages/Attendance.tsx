import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Clock, LogIn, LogOut, CalendarDays, MapPin, Loader2, Calendar, 
  Camera, Coffee, CheckCircle2, RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  type: string;
  notes: string | null;
  location_in: string | null;
  location_out: string | null;
  check_in_photo_url: string | null;
  check_out_photo_url: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
}

const statusBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  present: "default", absent: "destructive", late: "secondary", "half-day": "outline", leave: "outline",
};

function formatDuration(totalSeconds: number) {
  if (!totalSeconds) return "0m";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getWorkMinutes(checkIn: string | null, checkOut: string | null, lunchStart: string | null, lunchEnd: string | null) {
  if (!checkIn || !checkOut) return null;
  let ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (lunchStart && lunchEnd) {
    ms -= new Date(lunchEnd).getTime() - new Date(lunchStart).getTime();
  }
  return Math.max(0, Math.round(ms / 60000));
}

function getLunchMinutes(lunchStart: string | null, lunchEnd: string | null) {
  if (!lunchStart) return null;
  const end = lunchEnd ? new Date(lunchEnd) : new Date();
  return Math.round((end.getTime() - new Date(lunchStart).getTime()) / 60000);
}

// ── Camera Dialog ───────────────────────────────────────────────
function CameraDialog({ 
  open, onClose, onCapture, title 
}: { 
  open: boolean; 
  onClose: () => void; 
  onCapture: (blob: Blob) => void; 
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCaptured(null);
      setError(null);
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(stream => { 
        streamRef.current = stream; 
        if (videoRef.current) videoRef.current.srcObject = stream; 
      })
      .catch(() => setError("Camera access denied."));
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [open]);

  const takePhoto = () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL("image/jpeg", 0.85));
  };

  const confirm = () => {
    canvasRef.current?.toBlob(blob => { if (blob) onCapture(blob); }, "image/jpeg", 0.85);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {error ? (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-black aspect-square">
              {!captured && <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />}
              {captured && <img src={captured} alt="Captured selfie" className="w-full h-full object-cover -scale-x-100" />}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex gap-2">
          {!error && !captured && <Button onClick={takePhoto} className="w-full"><Camera className="mr-2 h-4 w-4" />Take Photo</Button>}
          {!error && captured && (
            <>
              <Button variant="outline" onClick={() => setCaptured(null)} className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />Retake
              </Button>
              <Button onClick={confirm} className="flex-1">
                <CheckCircle2 className="mr-2 h-4 w-4" />Confirm
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Personal Attendance (No admin table) ────────────────────────
export default function Attendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ date: "", type: "leave", notes: "" });
  const [cameraMode, setCameraMode] = useState<"check_in" | "check_out" | null>(null);
  const [busy, setBusy] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  // Get MY attendance
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["my_attendance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AttendanceRecord[];
    },
    enabled: !!user,
  });

  const todayRecord = records.find(r => r.date === today);

  const uploadPhoto = useCallback(async (blob: Blob, tag: string) => {
    const path = `${user!.id}/${today}_${tag}_${Date.now()}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from("attendance-photos")
      .upload(path, blob, { contentType: "image/jpeg" });
    if (uploadErr) throw uploadErr;
    const { data } = supabase.storage.from("attendance-photos").getPublicUrl(path);
    return data.publicUrl;
  }, [user, today]);

  const handleCheckIn = useCallback(async (photoBlob: Blob) => {
    if (!user) return;
    setBusy(true);
    try {
      const photoUrl = await uploadPhoto(photoBlob, "checkin");
      const { error: insertErr } = await supabase
        .from("attendance")
        .upsert({
          user_id: user.id,
          date: today,
          check_in: new Date().toISOString(),
          check_in_photo_url: photoUrl,
          status: "present",
          type: "regular",
          location_in: "Office",
        } as any, { onConflict: "user_id,date" });
      if (insertErr) throw insertErr;
      toast.success("Checked in!");
      setCameraMode(null);
      queryClient.invalidateQueries({ queryKey: ["my_attendance"] });
    } catch (e: any) {
      toast.error(e.message || "Check-in failed");
    }
    setBusy(false);
  }, [user, today, uploadPhoto, queryClient]);

  const handleCheckOut = useCallback(async (photoBlob: Blob) => {
    if (!user || !todayRecord) return;
    setBusy(true);
    try {
      const photoUrl = await uploadPhoto(photoBlob, "checkout");
      const { error: updateErr } = await supabase
        .from("attendance")
        .update({ check_out: new Date().toISOString(), check_out_photo_url: photoUrl, location_out: "Office" } as any)
        .eq("id", todayRecord.id);
      if (updateErr) throw updateErr;
      toast.success("Checked out!");
      setCameraMode(null);
      queryClient.invalidateQueries({ queryKey: ["my_attendance"] });
    } catch (e: any) {
      toast.error(e.message || "Check-out failed");
    }
    setBusy(false);
  }, [user, todayRecord, uploadPhoto, queryClient]);

  const handleStartLunch = useCallback(async () => {
    if (!todayRecord) return;
    setBusy(true);
    try {
      const { error: lunchErr } = await supabase.from("attendance").update({ lunch_start: new Date().toISOString() } as any).eq("id", todayRecord.id);
      if (lunchErr) throw lunchErr;
      toast.success("Lunch started!");
      queryClient.invalidateQueries({ queryKey: ["my_attendance"] });
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  }, [todayRecord, queryClient]);

  const handleEndLunch = useCallback(async () => {
    if (!todayRecord) return;
    setBusy(true);
    try {
      const { error: lunchEndErr } = await supabase.from("attendance").update({ lunch_end: new Date().toISOString() } as any).eq("id", todayRecord.id);
      if (lunchEndErr) throw lunchEndErr;
      toast.success("Lunch ended!");
      queryClient.invalidateQueries({ queryKey: ["my_attendance"] });
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  }, [todayRecord, queryClient]);

  const handleApplyLeave = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { error: leaveErr } = await supabase
        .from("attendance")
        .upsert({ user_id: user.id, date: leaveForm.date, status: "leave", type: leaveForm.type, notes: leaveForm.notes } as any, { onConflict: "user_id,date" });
      if (leaveErr) throw leaveErr;
      toast.success("Leave applied");
      setLeaveForm({ date: "", type: "leave", notes: "" });
      setLeaveOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my_attendance"] });
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  }, [user, leaveForm, queryClient]);

  // Stats
  const thisMonth = records.filter(r => r.date.startsWith(format(new Date(), "yyyy-MM")));
  const presentDays = thisMonth.filter(r => r.status === "present").length;
  const leaveDays = thisMonth.filter(r => r.status === "leave").length;
  const totalDays = new Date().getDate();

  const getTimeDiff = (ci: string | null, co: string | null) => {
    if (!ci || !co) return "-";
    const diff = new Date(co).getTime() - new Date(ci).getTime();
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const checkedIn = !!todayRecord?.check_in;
  const checkedOut = !!todayRecord?.check_out;
  const onLunch = !!todayRecord?.lunch_start && !todayRecord?.lunch_end;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
          <p className="text-muted-foreground">Check in, lunch breaks, check out</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!checkedIn && (
            <Button onClick={() => setCameraMode("check_in")} disabled={busy} className="bg-green-600 hover:bg-green-700">
              <Camera className="mr-2 h-4 w-4" />{busy ? "Processing..." : "Check In"}
            </Button>
          )}
          {checkedIn && !checkedOut && !onLunch && (
            <Button variant="outline" onClick={handleStartLunch} disabled={busy}>
              <Coffee className="mr-2 h-4 w-4" />Start Lunch
            </Button>
          )}
          {onLunch && (
            <Button variant="outline" onClick={handleEndLunch} disabled={busy}>
              <Coffee className="mr-2 h-4 w-4" />End Lunch
            </Button>
          )}
          {checkedIn && !checkedOut && (
            <Button onClick={() => setCameraMode("check_out")} disabled={busy} variant="destructive">
              <Camera className="mr-2 h-4 w-4" />{busy ? "Processing..." : "Check Out"}
            </Button>
          )}
          {checkedOut && (
            <Badge variant="secondary" className="py-2 px-4">
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Complete
            </Badge>
          )}
          <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Calendar className="mr-2 h-4 w-4" />Apply Leave</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input type="date" value={leaveForm.date} onChange={e => setLeaveForm({ ...leaveForm, date: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={leaveForm.type} onValueChange={v => setLeaveForm({ ...leaveForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leave">Full Day Leave</SelectItem>
                      <SelectItem value="half-day">Half Day</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Reason</Label>
                  <Textarea value={leaveForm.notes} onChange={e => setLeaveForm({ ...leaveForm, notes: e.target.value })} placeholder="Reason..." />
                </div>
                <Button onClick={handleApplyLeave} disabled={busy || !leaveForm.date}>
                  {busy ? "Applying..." : "Submit"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Today's Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Status</span>
            <Badge variant={checkedOut ? "secondary" : checkedIn ? "default" : "outline"}>
              {checkedOut ? "Checked Out" : checkedIn ? (onLunch ? "On Lunch" : "Checked In") : "Not Checked In"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1"><LogIn className="h-3 w-3 inline mr-1" />Check In</p>
              <p className="font-semibold">{todayRecord?.check_in ? format(new Date(todayRecord.check_in), "hh:mm a") : "-"}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1"><Coffee className="h-3 w-3 inline mr-1" />Lunch</p>
              <p className="font-semibold">
                {todayRecord?.lunch_start ? format(new Date(todayRecord.lunch_start), "hh:mm a") : "-"}
                {todayRecord?.lunch_start && todayRecord?.lunch_end && ` – ${format(new Date(todayRecord.lunch_end), "hh:mm a")}`}
                {onLunch && " – ongoing"}
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1"><LogOut className="h-3 w-3 inline mr-1" />Check Out</p>
              <p className="font-semibold">{todayRecord?.check_out ? format(new Date(todayRecord.check_out), "hh:mm a") : "-"}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1"><Clock className="h-3 w-3 inline mr-1" />Total Time</p>
              <p className="font-semibold">
                {todayRecord && todayRecord.check_in && todayRecord.check_out
                  ? formatDuration(getWorkMinutes(todayRecord.check_in, todayRecord.check_out, todayRecord.lunch_start, todayRecord.lunch_end)! * 60)
                  : "In progress..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CalendarDays className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{presentDays}</p>
              <p className="text-xs text-muted-foreground">Present this month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <CalendarDays className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{leaveDays}</p>
              <p className="text-xs text-muted-foreground">Leaves this month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(0) : 0}%</p>
              <p className="text-xs text-muted-foreground">Attendance Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader><CardTitle className="text-base">My Attendance History</CardTitle></CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Total Time</TableHead>
                  <TableHead>Lunch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(rec => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium text-sm">{format(new Date(rec.date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-sm">{rec.check_in ? format(new Date(rec.check_in), "hh:mm a") : "-"}</TableCell>
                    <TableCell className="text-sm">{rec.check_out ? format(new Date(rec.check_out), "hh:mm a") : "-"}</TableCell>
                    <TableCell className="text-sm">{getTimeDiff(rec.check_in, rec.check_out)}</TableCell>
                    <TableCell className="text-sm">
                      {rec.lunch_start ? `${getLunchMinutes(rec.lunch_start, rec.lunch_end) ?? "-"}m` : "-"}
                    </TableCell>
                    <TableCell><Badge variant={statusBadge[rec.status] || "outline"}>{rec.status}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{rec.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Camera Dialogs */}
      <CameraDialog open={cameraMode === "check_in"} onClose={() => setCameraMode(null)} onCapture={handleCheckIn} title="Check-In Selfie" />
      <CameraDialog open={cameraMode === "check_out"} onClose={() => setCameraMode(null)} onCapture={handleCheckOut} title="Check-Out Selfie" />
    </div>
  );
}
