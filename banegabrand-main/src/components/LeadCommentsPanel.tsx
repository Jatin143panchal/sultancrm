import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { useLeadComments, useAddLeadComment } from "@/hooks/useLeadComments";
import { useAllProfiles } from "@/hooks/useAdmin";
import { formatStageLabel, getSubStagesForStage } from "@/lib/leadStages";
import { toast } from "sonner";

interface LeadCommentsPanelProps {
  leadId: string;
  leadStage?: string | null;
  onCommentAdded?: () => void;
}

export default function LeadCommentsPanel({ leadId, leadStage, onCommentAdded }: LeadCommentsPanelProps) {
  const { data: comments = [], isLoading } = useLeadComments(leadId);
  const { data: profiles = [] } = useAllProfiles();
  const addComment = useAddLeadComment();
  const [comment, setComment] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [nextCallDate, setNextCallDate] = useState("");

  const getProfileName = (userId: string) => {
    const p = (profiles as { user_id: string; display_name: string | null }[]).find((p) => p.user_id === userId);
    return p?.display_name || "Unknown";
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error("Comment likho pehle");
      return;
    }
    try {
      await addComment.mutateAsync({
        leadId,
        comment: comment.trim(),
        callOutcome: callOutcome || undefined,
        nextCallDate: nextCallDate || undefined,
      });
      setComment("");
      setCallOutcome("");
      setNextCallDate("");
      toast.success("Comment save ho gaya");
      onCommentAdded?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Comment save nahi hua");
    }
  };

  const subStages = getSubStagesForStage(leadStage);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">Call Notes & History</h4>
        <Badge variant="secondary" className="text-xs">{comments.length}</Badge>
      </div>

      {/* Add comment form */}
      <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
        <div className="grid gap-2">
          <Label className="text-xs">Call pe kya hua? (Comment)</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Client ne bola parso call karna, interested hai..."
            rows={2}
            className="text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {subStages.length > 0 && (
            <div className="grid gap-1">
              <Label className="text-xs">Call Outcome</Label>
              <Select value={callOutcome || "none"} onValueChange={(v) => setCallOutcome(v === "none" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select outcome" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {subStages.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-1">
            <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Next Call Date</Label>
            <Input
              type="date"
              value={nextCallDate}
              onChange={(e) => setNextCallDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={addComment.isPending || !comment.trim()}>
          {addComment.isPending ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Saving...</> : "Save Comment"}
        </Button>
      </div>

      {/* Comment history */}
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">Abhi koi comment nahi hai. Call ke baad note add karo.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="p-3 rounded-lg border bg-background">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{getProfileName(c.user_id)}</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{c.comment}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {c.call_outcome && (
                      <Badge variant="outline" className="text-xs">{formatStageLabel(c.call_outcome)}</Badge>
                    )}
                    {c.next_call_date && (
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        Next: {format(new Date(c.next_call_date), "dd MMM yyyy")}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(c.created_at), "dd MMM, hh:mm a")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
