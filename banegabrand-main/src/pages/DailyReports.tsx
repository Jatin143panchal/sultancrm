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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Send,
  Bell,
  FileText,
  Download,
  Upload,
  Users,
  Tag,
  Link,
  Briefcase,
  UserPlus,
  UserCheck,
  Building2,
  HardDrive,
  Monitor,
  Wrench,
  Network,
  Database,
  Shield,
  Cloud,
  Code,
  Server
} from "lucide-react";
import { format, isToday, isTomorrow, isAfter, parseISO, differenceInDays } from "date-fns";

// IT Department Icons
const itDepartmentIcons: Record<string, any> = {
  "it": <Monitor className="h-4 w-4" />,
  "software": <Code className="h-4 w-4" />,
  "hardware": <HardDrive className="h-4 w-4" />,
  "network": <Network className="h-4 w-4" />,
  "database": <Database className="h-4 w-4" />,
  "security": <Shield className="h-4 w-4" />,
  "cloud": <Cloud className="h-4 w-4" />,
  "support": <Wrench className="h-4 w-4" />,
  "server": <Server className="h-4 w-4" />,
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, any> = {
    pending: { className: "bg-yellow-500/10 text-yellow-600 border-yellow-200", label: "Pending" },
    in_progress: { className: "bg-blue-500/10 text-blue-600 border-blue-200", label: "In Progress" },
    completed: { className: "bg-green-500/10 text-green-600 border-green-200", label: "Completed" },
    blocked: { className: "bg-red-500/10 text-red-600 border-red-200", label: "Blocked" },
    cancelled: { className: "bg-gray-500/10 text-gray-600 border-gray-200", label: "Cancelled" },
  };
  const v = variants[status] || variants.pending;
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>;
};

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const variants: Record<string, any> = {
    low: { className: "bg-green-500/10 text-green-600", label: "Low" },
    medium: { className: "bg-yellow-500/10 text-yellow-600", label: "Medium" },
    high: { className: "bg-orange-500/10 text-orange-600", label: "High" },
    urgent: { className: "bg-red-500/10 text-red-600", label: "Urgent" },
  };
  const v = variants[priority] || variants.medium;
  return <Badge className={v.className}>{v.label}</Badge>;
};

// IT Department Badge
const DepartmentBadge = ({ department }: { department: string }) => {
  const deptMap: Record<string, any> = {
    "it": { label: "IT", className: "bg-purple-500/10 text-purple-600" },
    "software": { label: "Software", className: "bg-blue-500/10 text-blue-600" },
    "hardware": { label: "Hardware", className: "bg-orange-500/10 text-orange-600" },
    "network": { label: "Network", className: "bg-cyan-500/10 text-cyan-600" },
    "database": { label: "Database", className: "bg-red-500/10 text-red-600" },
    "security": { label: "Security", className: "bg-green-500/10 text-green-600" },
    "cloud": { label: "Cloud", className: "bg-sky-500/10 text-sky-600" },
    "support": { label: "Support", className: "bg-pink-500/10 text-pink-600" },
    "server": { label: "Server", className: "bg-indigo-500/10 text-indigo-600" },
  };
  const dept = deptMap[department] || { label: department || "General", className: "bg-gray-500/10 text-gray-600" };
  return <Badge className={dept.className}>{dept.label}</Badge>;
};

// Employee Select Component with Department Filter
const EmployeeSelect = ({ 
  value, 
  onChange, 
  employees, 
  multiple = false,
  department = "all",
  showDepartment = true
}: any) => {
  const filteredEmployees = department === "all" 
    ? employees 
    : employees.filter((emp: any) => emp.department === department || emp.role === "it");

  if (multiple) {
    return (
      <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
        {filteredEmployees.map((emp: any) => (
          <div key={emp.user_id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
            <Checkbox
              id={emp.user_id}
              checked={value?.includes(emp.user_id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange([...(value || []), emp.user_id]);
                } else {
                  onChange(value?.filter((id: string) => id !== emp.user_id));
                }
              }}
            />
            <div className="flex-1">
              <Label htmlFor={emp.user_id} className="cursor-pointer">
                {emp.display_name || emp.email}
              </Label>
              {showDepartment && emp.department && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {emp.department}
                </Badge>
              )}
            </div>
          </div>
        ))}
        {filteredEmployees.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No employees found in this department
          </div>
        )}
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select employee" />
      </SelectTrigger>
      <SelectContent>
        {filteredEmployees.map((emp: any) => (
          <SelectItem key={emp.user_id} value={emp.user_id}>
            <div className="flex items-center gap-2">
              {emp.display_name || emp.email}
              {showDepartment && emp.department && (
                <Badge variant="outline" className="text-xs">
                  {emp.department}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Create/Edit Task Modal
const TaskFormModal = ({ 
  open, 
  onOpenChange, 
  task, 
  onSave,
  employees,
  currentUser 
}: any) => {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    assigned_to: task?.assigned_to || "",
    due_date: task?.due_date || new Date().toISOString().slice(0, 10),
    start_date: task?.start_date || new Date().toISOString().slice(0, 10),
    priority: task?.priority || "medium",
    estimated_hours: task?.estimated_hours || "",
    notes: task?.notes || "",
    tags: task?.tags?.join(", ") || "",
    is_daily: task?.is_daily !== undefined ? task.is_daily : true,
    recurring: task?.recurring || false,
    recurring_pattern: task?.recurring_pattern || "daily",
    department: task?.department || "it",
    task_category: task?.task_category || "general",
  });

  const [assignMultiple, setAssignMultiple] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(
    task?.assigned_to ? [task.assigned_to] : []
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  const taskCategories = [
    { value: "general", label: "General Task" },
    { value: "development", label: "Development" },
    { value: "bug_fix", label: "Bug Fix" },
    { value: "maintenance", label: "Maintenance" },
    { value: "support", label: "IT Support" },
    { value: "network", label: "Network Setup" },
    { value: "security", label: "Security Check" },
    { value: "database", label: "Database Management" },
    { value: "server", label: "Server Management" },
    { value: "cloud", label: "Cloud Operations" },
    { value: "software", label: "Software Installation" },
    { value: "hardware", label: "Hardware Setup" },
    { value: "backup", label: "Backup & Recovery" },
    { value: "monitoring", label: "System Monitoring" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalAssignedTo = assignMultiple ? selectedEmployees[0] : formData.assigned_to;
    
    await onSave({
      ...formData,
      assigned_to: finalAssignedTo,
      tags: formData.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      department: formData.department,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {task ? "Edit Task" : "Assign New IT Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Task Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title (e.g., Server Maintenance, Bug Fixing, etc.)"
                required
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the task in detail..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT Department</SelectItem>
                  <SelectItem value="software">Software Development</SelectItem>
                  <SelectItem value="hardware">Hardware Support</SelectItem>
                  <SelectItem value="network">Network Team</SelectItem>
                  <SelectItem value="database">Database Team</SelectItem>
                  <SelectItem value="security">Security Team</SelectItem>
                  <SelectItem value="cloud">Cloud Operations</SelectItem>
                  <SelectItem value="support">IT Support</SelectItem>
                  <SelectItem value="server">Server Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Task Category</Label>
              <Select
                value={formData.task_category}
                onValueChange={(value) => setFormData({ ...formData, task_category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {taskCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Assign To *</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assign-multiple"
                    checked={assignMultiple}
                    onCheckedChange={(checked) => {
                      setAssignMultiple(!!checked);
                      if (!checked) setSelectedEmployees([]);
                    }}
                  />
                  <Label htmlFor="assign-multiple">Multiple Employees</Label>
                </div>
                
                <div className="flex-1">
                  <Select
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="cloud">Cloud</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="server">Server</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {assignMultiple ? (
                <EmployeeSelect
                  value={selectedEmployees}
                  onChange={setSelectedEmployees}
                  employees={employees}
                  multiple={true}
                  department={selectedDepartment}
                  showDepartment={true}
                />
              ) : (
                <EmployeeSelect
                  value={formData.assigned_to}
                  onChange={(value: string) => setFormData({ ...formData, assigned_to: value })}
                  employees={employees}
                  department={selectedDepartment}
                  showDepartment={true}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                placeholder="e.g., 2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Tags (comma separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., urgent, server, maintenance"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or instructions..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-daily"
                checked={formData.is_daily}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_daily: !!checked })
                }
              />
              <Label htmlFor="is-daily">Daily Task</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.recurring}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, recurring: !!checked })
                }
              />
              <Label htmlFor="recurring">Recurring Task</Label>
            </div>
          </div>

          {formData.recurring && (
            <div>
              <Label>Recurring Pattern</Label>
              <Select
                value={formData.recurring_pattern}
                onValueChange={(value) => setFormData({ ...formData, recurring_pattern: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              {task ? (
                <>
                  <Edit className="h-4 w-4" />
                  Update Task
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Assign IT Task
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Task Update Modal
const TaskUpdateModal = ({ open, onOpenChange, task, onUpdate }: any) => {
  const [status, setStatus] = useState(task?.status || "pending");
  const [progress, setProgress] = useState(task?.progress || 0);
  const [comment, setComment] = useState("");
  const [actualHours, setActualHours] = useState(task?.actual_hours || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({
      id: task.id,
      status,
      progress,
      comment,
      actual_hours: actualHours ? parseFloat(actualHours) : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Task: {task?.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Progress: {progress}%</Label>
            <Input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <Label>Actual Hours Worked</Label>
            <Input
              type="number"
              step="0.5"
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value)}
              placeholder="e.g., 3.5"
            />
          </div>

          <div>
            <Label>Update Comment</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add an update comment..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Task Details Modal
const TaskDetailsModal = ({ open, onOpenChange, task, profiles }: any) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Task Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{task?.title}</h3>
            <p className="text-muted-foreground">{task?.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department</Label>
              <div className="mt-1">
                <DepartmentBadge department={task?.department} />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <p>{task?.task_category?.replace('_', ' ') || 'General'}</p>
            </div>
            <div>
              <Label>Assigned To</Label>
              <p>{profiles[task?.assigned_to] || task?.assigned_to}</p>
            </div>
            <div>
              <Label>Assigned By</Label>
              <p>{profiles[task?.assigned_by] || task?.assigned_by}</p>
            </div>
            <div>
              <Label>Due Date</Label>
              <p>{task?.due_date ? format(parseISO(task.due_date), "PPP") : "N/A"}</p>
            </div>
            <div>
              <Label>Priority</Label>
              <PriorityBadge priority={task?.priority} />
            </div>
            <div>
              <Label>Status</Label>
              <StatusBadge status={task?.status} />
            </div>
            <div>
              <Label>Progress</Label>
              <p>{task?.progress}%</p>
            </div>
            {task?.estimated_hours && (
              <div>
                <Label>Estimated Hours</Label>
                <p>{task.estimated_hours}h</p>
              </div>
            )}
            {task?.actual_hours && (
              <div>
                <Label>Actual Hours</Label>
                <p>{task.actual_hours}h</p>
              </div>
            )}
          </div>

          {task?.tags && task.tags.length > 0 && (
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {task?.notes && (
            <div>
              <Label>Notes</Label>
              <p className="text-muted-foreground">{task.notes}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
export default function DailyTaskAssignment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = useHasRole("admin", "owner", "hr_manager", "tl");
  const isEmployee = useHasRole("employee");

  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Load Tasks
  const loadTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("daily_tasks")
        .select(`
          *,
          assigned_to_profile:profiles!assigned_to(display_name, email, department),
          assigned_by_profile:profiles!assigned_by(display_name, email, department)
        `);

      if (!isAdmin) {
        query = query.eq("assigned_to", user?.id);
      }

      // Department filter
      if (departmentFilter !== "all") {
        query = query.eq("department", departmentFilter);
      }

      const { data, error } = await query
        .order("due_date", { ascending: true })
        .order("priority", { ascending: false });

      if (error) throw error;
      setTasks(data || []);

      // Build profiles map
      const profileMap: Record<string, string> = {};
      data?.forEach((task: any) => {
        if (task.assigned_to_profile) {
          profileMap[task.assigned_to] = task.assigned_to_profile.display_name || task.assigned_to_profile.email;
        }
        if (task.assigned_by_profile) {
          profileMap[task.assigned_by] = task.assigned_by_profile.display_name || task.assigned_by_profile.email;
        }
      });
      setProfiles(profileMap);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Load Employees with Department Info
  const loadEmployees = async () => {
    if (!isAdmin) return;
    try {
      // Get all users with employee roles
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["employee", "tl"]);

      if (roleData) {
        const userIds = roleData.map((r: any) => r.user_id);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, display_name, email, department")
          .in("user_id", userIds);
        
        setEmployees(profileData || []);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  useEffect(() => {
    loadTasks();
    if (isAdmin) loadEmployees();

    // Real-time subscription
    const channel = supabase
      .channel('daily-tasks-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'daily_tasks' },
        () => loadTasks()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, isAdmin, departmentFilter]);

  // Create/Update Task
  const handleSaveTask = async (taskData: any) => {
    try {
      let result;
      if (taskData.id) {
        // Update existing task
        result = await supabase
          .from("daily_tasks")
          .update({
            title: taskData.title,
            description: taskData.description,
            assigned_to: taskData.assigned_to,
            due_date: taskData.due_date,
            start_date: taskData.start_date,
            priority: taskData.priority,
            estimated_hours: taskData.estimated_hours ? parseFloat(taskData.estimated_hours) : null,
            notes: taskData.notes,
            tags: taskData.tags,
            is_daily: taskData.is_daily,
            recurring: taskData.recurring,
            recurring_pattern: taskData.recurring_pattern,
            department: taskData.department,
            task_category: taskData.task_category,
            updated_at: new Date().toISOString(),
          })
          .eq("id", taskData.id);
      } else {
        // Create new task
        result = await supabase
          .from("daily_tasks")
          .insert({
            title: taskData.title,
            description: taskData.description,
            assigned_to: taskData.assigned_to,
            assigned_by: user?.id,
            due_date: taskData.due_date,
            start_date: taskData.start_date,
            priority: taskData.priority,
            estimated_hours: taskData.estimated_hours ? parseFloat(taskData.estimated_hours) : null,
            notes: taskData.notes,
            tags: taskData.tags,
            is_daily: taskData.is_daily,
            recurring: taskData.recurring,
            recurring_pattern: taskData.recurring_pattern,
            department: taskData.department,
            task_category: taskData.task_category,
            created_at: new Date().toISOString(),
          });
      }

      if (result.error) throw result.error;
      
      // Log assignment
      if (!taskData.id && result.data) {
        await supabase
          .from("task_assignments")
          .insert({
            task_id: result.data[0]?.id,
            assigned_to: taskData.assigned_to,
            assigned_by: user?.id,
            assigned_date: new Date().toISOString().slice(0, 10),
          });
      }

      toast({
        title: taskData.id ? "Task Updated" : "Task Assigned",
        description: `Task "${taskData.title}" ${taskData.id ? "updated" : "assigned"} successfully`,
      });
      
      loadTasks();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Update Task Status
  const handleUpdateTask = async ({ id, status, progress, comment, actual_hours }: any) => {
    try {
      // Get current task for status change tracking
      const { data: currentTask } = await supabase
        .from("daily_tasks")
        .select("status, progress")
        .eq("id", id)
        .single();

      // Update task
      const updateData: any = {
        status,
        progress,
        updated_at: new Date().toISOString(),
      };

      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      if (actual_hours !== undefined) {
        updateData.actual_hours = actual_hours;
      }

      const { error } = await supabase
        .from("daily_tasks")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Add update log
      await supabase
        .from("task_updates")
        .insert({
          task_id: id,
          user_id: user?.id,
          update_type: "status_change",
          content: comment,
          old_status: currentTask?.status,
          new_status: status,
          old_progress: currentTask?.progress,
          new_progress: progress,
        });

      toast({ title: "Task Updated", description: "Task status and progress updated" });
      loadTasks();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      const { error } = await supabase
        .from("daily_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Task Deleted", description: "Task has been removed" });
      loadTasks();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Get Filtered Tasks
  const getFilteredTasks = () => {
    let filtered = tasks;
    
    if (filter !== "all") {
      filtered = filtered.filter((t) => t.status === filter);
    }

    if (search) {
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        profiles[t.assigned_to]?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  };

  // Get Statistics
  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const overdue = tasks.filter((t) => 
      t.status !== "completed" && 
      t.status !== "cancelled" && 
      isAfter(new Date(), parseISO(t.due_date))
    ).length;

    return { total, completed, inProgress, pending, blocked, overdue };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            IT Task Assignment
          </h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin ? "Assign and manage IT tasks for your team" : "View and update your IT tasks"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadTasks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => { setSelectedTask(null); setFormOpen(true); }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign IT Task
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
            <p className="text-xs text-muted-foreground">Blocked</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search IT tasks by title, description or assignee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="cloud">Cloud</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="server">Server</SelectItem>
              </SelectContent>
            </Select>

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
              >
                {viewMode === "table" ? "Cards View" : "Table View"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading IT tasks...</p>
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Details</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredTasks().map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {task.description}
                          </div>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.tags.slice(0, 2).map((tag: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {task.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{task.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DepartmentBadge department={task.department} />
                      </TableCell>
                      <TableCell>
                        {profiles[task.assigned_to] || task.assigned_to?.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className={isAfter(new Date(), parseISO(task.due_date)) && task.status !== "completed" ? "text-red-600 font-medium" : ""}>
                            {format(parseISO(task.due_date), "MMM dd, yyyy")}
                          </span>
                          {isToday(parseISO(task.due_date)) && <Badge variant="outline" className="text-xs">Today</Badge>}
                          {isAfter(new Date(), parseISO(task.due_date)) && task.status !== "completed" && (
                            <Badge variant="destructive" className="text-xs">
                              {differenceInDays(new Date(), parseISO(task.due_date))}d overdue
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                      <TableCell><StatusBadge status={task.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 rounded-full h-2 transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span className="text-xs">{task.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setSelectedTask(task); setDetailsOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {task.status !== "completed" && task.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setSelectedTask(task); setUpdateOpen(true); }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {getFilteredTasks().length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        {search || filter !== "all" || departmentFilter !== "all" ? (
                          "No IT tasks match your filters"
                        ) : (
                          <div>
                            <p className="text-lg">No IT tasks found</p>
                            <p className="text-sm">
                              {isAdmin ? "Assign a new IT task to get started." : "You have no IT tasks assigned."}
                            </p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredTasks().map((task) => (
                <Card key={task.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <DepartmentBadge department={task.department} />
                      {task.task_category && (
                        <Badge variant="outline">{task.task_category.replace('_', ' ')}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Assignee:</span>
                        <span>{profiles[task.assigned_to] || task.assigned_to?.slice(0, 8)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Due:</span>
                        <span className={isAfter(new Date(), parseISO(task.due_date)) && task.status !== "completed" ? "text-red-600" : ""}>
                          {format(parseISO(task.due_date), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <StatusBadge status={task.status} />
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 rounded-full h-2 transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => { setSelectedTask(task); setDetailsOpen(true); }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {task.status !== "completed" && task.status !== "cancelled" && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => { setSelectedTask(task); setUpdateOpen(true); }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Update
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {getFilteredTasks().length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  No IT tasks found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <TaskFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        task={selectedTask}
        onSave={handleSaveTask}
        employees={employees}
        currentUser={user}
      />

      <TaskUpdateModal
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        task={selectedTask}
        onUpdate={handleUpdateTask}
      />

      <TaskDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        task={selectedTask}
        profiles={profiles}
      />
    </div>
  );
}
