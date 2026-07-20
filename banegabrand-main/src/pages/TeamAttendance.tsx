import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, Users, Phone, Clock, Coffee, Camera, PhoneCall,
  LogIn, LogOut,
} from "lucide-react";
import { format } from "date-fns";

interface AttRecord {
  id: string; user_id: string; date: string;
  check_in: string | null; check_out: string | null;
  check_in_photo_url: string | null; check_out_photo_url: string | null;
  lunch_start: string | null; lunch_end: string | null;
  status: string; type: string; notes: string | null;
}
interface Profile { user_id: string; display_name: string | null; }
interface CallLog { id: string; user_id: string; duration_seconds: number; created_at: string; status: string; }

function formatDuration(totalSeconds: number) {
  if (!totalSeconds) return "0m";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function calcWorkMinutes(a: AttRecord) {
  if (!a.check_in || !a.check_out) return null;
  let ms = new Date(a.check_out).getTime() - new Date(a.check_in).getTime();
  if (a.lunch_start && a.lunch_end) ms -= new Date(a.lunch_end).getTime() - new Date(a.lunch_start).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

function calcLunchMinutes(a: AttRecord) {
  if (!a.lunch_start) return null;
  const end = a.lunch_end ? new Date(a.lunch_end) : new Date();
  return Math.round((end.getTime() - new Date(a.lunch_start).getTime()) / 60000);
}

export default function TeamAttendance() {
  const [photoPreview, setPhotoPreview] = useState<{ url: string; who: string } | null>(null);
  const [dateFilter, setDateFilter] = useState("");

  // Get ALL attendance records
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["team_attendance_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .order("date", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AttRecord[];
    },
  });

  // Get all profiles for names
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["all_profiles_for_attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  // Get call logs
  const { data: callLogs = [] } = useQuery({
    queryKey: ["call_logs_team"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_logs")
        .select("id, user_id, duration_seconds, created_at, status")
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as CallLog[];
    },
  });

  // Index call stats by user_id + date
  const callStats = useMemo(() => {
    const map = new Map<string, { count: number; seconds: number }>();
    for (const c of callLogs) {
      const key = `${c.user_id}_${format(new Date(c.created_at), "yyyy-MM-dd")}`;
      const cur = map.get(key) || { count: 0, seconds: 0 };
      cur.count += 1;
      cur.seconds += c.duration_seconds || 0;
      map.set(key, cur);
    }
    return map;
  }, [callLogs]);

  const filtered = dateFilter ? records.filter(r => r.date === dateFilter) : records;

  const nameOf = (uid: string) => profiles.find(p => p.user_id === uid)?.display_name || "Unknown";
  const today = format(new Date(), "yyyy-MM-dd");
  const todayRecords = records.filter(r => r.date === today);
  const presentToday = todayRecords.filter(r => r.status === "present").length;
  const onLeaveToday = todayRecords.filter(r => r.status === "leave").length;
  const notCheckedInYet = profiles.length - presentToday - onLeaveToday;

  if (recordsLoading || profilesLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Attendance</h1>
          <p className="text-muted-foreground text-sm">
            All users' check-in/out, lunch breaks, working hours, and call activity
          </p>
        </div>
        <Input 
          type="date" 
          value={dateFilter} 
          onChange={e => setDateFilter(e.target.value)} 
          className="w-44" 
        />
      </div>

      {/* Today's Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <LogIn className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{presentToday}</p>
              <p className="text-xs text-muted-foreground">Checked in today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <LogOut className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{notCheckedInYet}</p>
              <p className="text-xs text-muted-foreground">Not checked in</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-2xl font-bold">{onLeaveToday}</p>
              <p className="text-xs text-muted-foreground">On leave today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{profiles.length}</p>
              <p className="text-xs text-muted-foreground">Total members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No attendance records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Total Time</TableHead>
                    <TableHead>Lunch</TableHead>
                    <TableHead>Calls</TableHead>
                    <TableHead>Call Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => {
                    const mins = calcWorkMinutes(r);
                    const lm = calcLunchMinutes(r);
                    const calls = callStats.get(`${r.user_id}_${r.date}`);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          {r.check_in_photo_url ? (
                            <button onClick={() => setPhotoPreview({ url: r.check_in_photo_url!, who: nameOf(r.user_id) })}>
                              <img src={r.check_in_photo_url} alt="selfie" className="w-9 h-9 rounded-full object-cover border hover:opacity-80" />
                            </button>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                              <Camera className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(r.date), "dd MMM yyyy")}</TableCell>
                        <TableCell className="font-medium text-sm">{nameOf(r.user_id)}</TableCell>
                        <TableCell className="text-sm">
                          {r.check_in ? (
                            <span className="flex items-center gap-1">
                              <LogIn className="h-3 w-3 text-green-600" />
                              {format(new Date(r.check_in), "hh:mm a")}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.check_out ? (
                            <span className="flex items-center gap-1">
                              <LogOut className="h-3 w-3 text-red-500" />
                              {format(new Date(r.check_out), "hh:mm a")}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {mins != null ? formatDuration(mins * 60) : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.lunch_start ? (
                            <span className="flex items-center gap-1">
                              <Coffee className="h-3 w-3 text-orange-500" />
                              {lm != null ? `${lm}m` : "-"}
                              {!r.lunch_end && <Badge variant="outline" className="text-[10px] ml-1">ongoing</Badge>}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {calls ? (
                            <span className="flex items-center gap-1">
                              <PhoneCall className="h-3 w-3 text-blue-500" />
                              {calls.count}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {calls ? formatDuration(calls.seconds) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === "present" ? "default" : r.status === "leave" ? "outline" : "secondary"}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {r.notes || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Preview Dialog */}
      <Dialog open={!!photoPreview} onOpenChange={() => setPhotoPreview(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{photoPreview?.who} — Check-In Selfie</DialogTitle>
          </DialogHeader>
          {photoPreview && <img src={photoPreview.url} alt="selfie" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
