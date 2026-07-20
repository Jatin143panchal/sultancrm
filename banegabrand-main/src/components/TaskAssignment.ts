// components/TaskAssignment.tsx
import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendTaskAssignmentEmail } from "@/services/emailService";
import { 
  Mail, Send, User, Calendar, Clock, AlertCircle, CheckCircle, 
  Loader2, Users, MessageSquare, Paperclip, Link as LinkIcon,
  Bell, Star
} from "lucide-react";
import { format } from "date-fns";

interface Employee {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface Task {
  id: string;
  task_name: string;
  description: string | null;
  department: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  assigned_to_email: string | null;
  assigned_by: string | null;
  assigned_by_email: string | null;
}

interface TaskAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  projectName: string;
  projectId: string;
  onTaskUpdated: () => void;
}

export function TaskAssignment({
  open,
  onOpenChange,
  task,
  projectName,
  projectId,
  onTaskUpdated
}: TaskAssignmentProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Fetch employees
  useEffect(() => {
    if (open) {
      fetchEmployees();
      if (task?.assigned_to_email) {
        setAssigneeEmail(task.assigned_to_email);
      }
    }
  }, [open, task]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    }
  };

  // Get employee initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Assign task to employee
  const assignTask = async () => {
    if (!task || !assigneeEmail) {
      toast.error("Please select an assignee");
      return;
    }

    setSending(true);
    try {
      // Update task with assignment
      const { error: taskError } = await supabase
        .from("project_tasks")
        .update({
          assigned_to_email: assigneeEmail,
          assigned_by_email: "system@banegabrand.com",
          status: "in_progress",
          updated_at: new Date().toISOString()
        })
        .eq("id", task.id);

      if (taskError) throw taskError;

      // Create assignment record
      const { error: assignmentError } = await supabase
        .from("task_assignments")
        .insert({
          task_id: task.id,
          assignee_email: assigneeEmail,
          assigned_by_email: "system@banegabrand.com",
          status: "pending",
          notification_sent: false
        });

      if (assignmentError) throw assignmentError;

      // Send email notification
      const assignee = employees.find(e => e.email === assigneeEmail);
      if (assignee) {
        await sendTaskAssignmentEmail({
          to: assigneeEmail,
          taskName: task.task_name,
          projectName: projectName,
          description: task.description || "",
          dueDate: task.due_date || new Date().toISOString(),
          assignedBy: "System",
          taskLink: `${window.location.origin}/projects/${projectId}?task=${task.id}`
        });

        // Update notification status
        await supabase
          .from("task_assignments")
          .update({ 
            notification_sent: true,
            notified_at: new Date().toISOString()
          })
          .eq("task_id", task.id)
          .eq("assignee_email", assigneeEmail);

        setEmailSent(true);
        toast.success(`Task assigned to ${assignee.name} and email sent!`);
      }

      // Add comment if provided
      if (comment.trim()) {
        await supabase
          .from("task_comments")
          .insert({
            task_id: task.id,
            comment: comment.trim(),
            created_by_email: "system@banegabrand.com"
          });
      }

      onTaskUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to assign task");
    } finally {
      setSending(false);
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "text-red-600 bg-red-100 border-red-200",
      high: "text-orange-600 bg-orange-100 border-orange-200",
      medium: "text-blue-600 bg-blue-100 border-blue-200",
      low: "text-gray-600 bg-gray-100 border-gray-200"
    };
    return colors[priority] || colors.medium;
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-blue-500" />
            Assign Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task Details */}
          <div className="bg-muted/20 rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{task.task_name}</h3>
                <p className="text-sm text-muted-foreground">{projectName}</p>
              </div>
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Badge>
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
            {task.due_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Due: {format(new Date(task.due_date), "dd MMM yyyy, hh:mm a")}
              </div>
            )}
          </div>

          {/* Assign to */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Assign To</Label>
            <Select value={assigneeEmail} onValueChange={setAssigneeEmail}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.email}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{employee.name}</span>
                      <span className="text-xs text-muted-foreground">({employee.role})</span>
                    </div>
                  </SelectItem>
                ))}
                {employees.length === 0 && (
                  <SelectItem value="no-employees" disabled>
                    No employees available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {assigneeEmail && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Selected: {employees.find(e => e.email === assigneeEmail)?.name}
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Add Comment (Optional)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add instructions or additional notes..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (assigneeEmail) {
                  const assignee = employees.find(e => e.email === assigneeEmail);
                  if (assignee) {
                    // Open email client
                    window.location.href = `mailto:${assigneeEmail}?subject=Task: ${task.task_name}&body=${encodeURIComponent(
                      `Hello ${assignee.name},\n\nI have assigned you a new task:\n\nTask: ${task.task_name}\nProject: ${projectName}\nDescription: ${task.description || 'N/A'}\nDue Date: ${task.due_date ? format(new Date(task.due_date), "dd MMM yyyy") : 'N/A'}\n\nPlease check the project dashboard for more details.\n\nBest regards,\nBanega Brand Team`
                    )}`;
                  }
                }
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Copy task link
                const link = `${window.location.origin}/projects/${projectId}?task=${task.id}`;
                navigator.clipboard.writeText(link);
                toast.success("Task link copied!");
              }}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>

          {/* Team Members Quick View */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Team Members</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {employees.slice(0, 8).map(emp => (
                <Badge 
                  key={emp.id} 
                  variant={assigneeEmail === emp.email ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => setAssigneeEmail(emp.email)}
                >
                  {emp.name}
                </Badge>
              ))}
              {employees.length > 8 && (
                <Badge variant="outline">+{employees.length - 8} more</Badge>
              )}
            </div>
          </div>

          {/* Email Status */}
          {emailSent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Email notification sent successfully!</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={assignTask} 
            disabled={!assigneeEmail || sending}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Assign & Notify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}