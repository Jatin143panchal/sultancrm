import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHasRole } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Download, FileText } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/export";

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export default function WeeklyReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isLeader = useHasRole("admin", "owner", "hr_manager", "tl");

  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [hours, setHours] = useState("40");
  const [summary, setSummary] = useState("");
  const [achievements, setAchievements] = useState("");
  const [challenges, setChallenges] = useState("");
  const [next, setNext] = useState("");
  const [mine, setMine] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  const loadMine = async () => {
    if (!user) return;
    const { data } = await supabase.from("weekly_reports").select("*").eq("user_id", user.id).order("week_start", { ascending: false });
    setMine(data ?? []);
  };
  const loadTeam = async () => {
    const { data } = await supabase.from("weekly_reports").select("*").order("week_start", { ascending: false }).limit(100);
    setTeam(data ?? []);
    const { data: p } = await supabase.from("profiles").select("user_id, display_name");
    setProfiles(Object.fromEntries((p ?? []).map((x: any) => [x.user_id, x.display_name])));
  };

  useEffect(() => { loadMine(); if (isLeader) loadTeam(); }, [user?.id, isLeader]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("weekly_reports").insert({
      user_id: user.id, week_start: weekStart, total_hours: Number(hours),
      summary, achievements, challenges, next_week_plan: next,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Weekly report submitted" }); setSummary(""); setAchievements(""); setChallenges(""); setNext(""); loadMine(); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Weekly Reports</h1><p className="text-muted-foreground text-sm">Summarize your week</p></div>
      <Tabs defaultValue="submit">
        <TabsList>
          <TabsTrigger value="submit">New Report</TabsTrigger>
          <TabsTrigger value="mine">My Reports</TabsTrigger>
          {isLeader && <TabsTrigger value="team">Team Reports</TabsTrigger>}
        </TabsList>
        <TabsContent value="submit">
          <Card>
            <CardHeader><CardTitle>Weekly Summary</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Week Starting (Monday)</Label><Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} /></div>
                  <div><Label>Total Hours</Label><Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
                </div>
                <div><Label>Summary</Label><Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} required /></div>
                <div><Label>Key Achievements</Label><Textarea rows={3} value={achievements} onChange={(e) => setAchievements(e.target.value)} /></div>
                <div><Label>Challenges</Label><Textarea rows={2} value={challenges} onChange={(e) => setChallenges(e.target.value)} /></div>
                <div><Label>Next Week Plan</Label><Textarea rows={2} value={next} onChange={(e) => setNext(e.target.value)} /></div>
                <Button type="submit"><Plus className="h-4 w-4 mr-2" />Submit</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="mine">
          <Card><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Week</TableHead><TableHead>Hours</TableHead><TableHead>Summary</TableHead><TableHead>Next Week</TableHead></TableRow></TableHeader>
              <TableBody>
                {mine.map((r) => (
                  <TableRow key={r.id}><TableCell>{r.week_start}</TableCell><TableCell>{r.total_hours}</TableCell><TableCell className="max-w-xs truncate">{r.summary}</TableCell><TableCell className="max-w-xs truncate">{r.next_week_plan}</TableCell></TableRow>
                ))}
                {mine.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No reports</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        {isLeader && (
          <TabsContent value="team">
            <Card><CardContent className="pt-6 space-y-4">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  const rows = team.map((r) => ({ employee: profiles[r.user_id] ?? r.user_id, week_start: r.week_start, hours: r.total_hours, summary: r.summary, achievements: r.achievements, challenges: r.challenges, next_week: r.next_week_plan }));
                  exportToCSV(`weekly-reports-${new Date().toISOString().slice(0,10)}`, rows);
                }}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const rows = team.map((r) => ({ Employee: profiles[r.user_id] ?? r.user_id, Week: r.week_start, Hours: r.total_hours, Summary: r.summary, Achievements: r.achievements, Challenges: r.challenges }));
                  exportToPDF("Team Weekly Reports", rows);
                }}><FileText className="h-4 w-4 mr-2" />Export PDF</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Week</TableHead><TableHead>Hours</TableHead><TableHead>Summary</TableHead></TableRow></TableHeader>
                <TableBody>
                  {team.map((r) => (
                    <TableRow key={r.id}><TableCell>{profiles[r.user_id] ?? r.user_id.slice(0, 8)}</TableCell><TableCell>{r.week_start}</TableCell><TableCell>{r.total_hours}</TableCell><TableCell className="max-w-xs truncate">{r.summary}</TableCell></TableRow>
                  ))}
                  {team.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No team reports</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
