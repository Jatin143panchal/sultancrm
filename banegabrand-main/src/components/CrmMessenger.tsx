// components/CrmMessenger.tsx
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  Send, Search, Loader2, Users, User, MessageSquare, 
  Phone, Video, MoreVertical, Paperclip, Smile, 
  Check, CheckCheck, Clock, Mic, Image, File,
  ArrowLeft, Plus, X, Trash2, Edit, Eye,
  UserPlus, UserMinus, Shield, Crown, Bell,
  Mail, PhoneCall, MapPin, Calendar, Link2,
  AlertCircle, CheckCircle, Info, Ban, Flag,
  Star, Heart, ThumbsUp, ThumbsDown, Share2,
  Copy, Download, Printer, Archive, Filter,
  Settings, LogOut, Menu, ChevronRight, ChevronDown,
  Reply, RefreshCw
} from "lucide-react";

// ============================================================
// INTERFACES
// ============================================================
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  message_type: string;
  media_url: string | null;
  media_type: string | null;
  status: string;
  read_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    role: string;
  };
}

interface Conversation {
  id: string;
  conversation_name: string | null;
  conversation_type: string;
  created_by: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    role: string;
  };
}

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  email: string | null;
  phone: string | null;
  is_online?: boolean;
  last_seen?: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function getInitials(name: string) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    admin: "bg-red-100 text-red-700 border-red-200",
    manager: "bg-blue-100 text-blue-700 border-blue-200",
    user: "bg-gray-100 text-gray-700 border-gray-200",
    lead: "bg-purple-100 text-purple-700 border-purple-200",
    owner: "bg-amber-100 text-amber-700 border-amber-200",
    tl: "bg-green-100 text-green-700 border-green-200",
    hr_manager: "bg-pink-100 text-pink-700 border-pink-200",
  };
  return colors[role] || colors.user;
}

function getRoleBadge(role: string) {
  const labels: Record<string, string> = {
    admin: "👑 Admin",
    manager: "📋 Manager",
    user: "👤 User",
    lead: "⭐ Lead",
    owner: "💎 Owner",
    tl: "📌 TL",
    hr_manager: "🤝 HR",
  };
  return labels[role] || role;
}

function formatTime(date: string) {
  return format(new Date(date), "hh:mm a");
}

function formatDate(date: string) {
  const now = new Date();
  const msgDate = new Date(date);
  if (msgDate.toDateString() === now.toDateString()) {
    return "Today";
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (msgDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return format(msgDate, "dd MMM yyyy");
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'sent': return <Clock className="h-3 w-3 text-gray-400" />;
    case 'delivered': return <Check className="h-3 w-3 text-blue-500" />;
    case 'read': return <CheckCheck className="h-3 w-3 text-blue-600" />;
    default: return <Clock className="h-3 w-3 text-gray-400" />;
  }
}

// ============================================================
// COMPONENTS
// ============================================================

// ── Message Bubble ──────────────────────────────────────────
function MessageBubble({ message, isOwn, onDelete, onReply }: {
  message: Message;
  isOwn: boolean;
  onDelete?: (id: string) => void;
  onReply?: (message: Message) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && message.sender && (
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(message.sender.display_name || 'User')}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">
              {message.sender.display_name || 'User'}
            </span>
            <Badge variant="outline" className={`text-xs ${getRoleColor(message.sender.role)}`}>
              {getRoleBadge(message.sender.role)}
            </Badge>
          </div>
        )}
        
        <div className={`rounded-lg p-3 ${
          isOwn 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
          
          {/* Media */}
          {message.media_url && (
            <div className="mt-2">
              {message.media_type === 'image' && (
                <img src={message.media_url} alt="Media" className="rounded-lg max-h-60 w-auto" />
              )}
              {message.media_type === 'file' && (
                <div className="flex items-center gap-2 p-2 bg-background/10 rounded">
                  <File className="h-4 w-4" />
                  <span className="text-sm truncate">Download File</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
          {isOwn && getStatusIcon(message.status)}
        </div>
      </div>
      
      {/* Actions */}
      {showActions && (
        <div className={`flex items-center gap-1 ${isOwn ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => onReply?.(message)}
          >
            <Reply className="h-3.5 w-3.5" />
          </Button>
          {isOwn && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive"
              onClick={() => onDelete?.(message.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Conversation List Item ──────────────────────────────────
function ConversationItem({ conversation, selected, onClick, currentUserId }: {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
  currentUserId: string;
}) {
  const otherParticipants = conversation.participants?.filter(p => p.user_id !== currentUserId) || [];
  
  // Get display name with fallbacks
  let displayName = 'Unknown User';
  if (conversation.conversation_type === 'group') {
    displayName = conversation.conversation_name || 'Group Chat';
  } else if (otherParticipants.length > 0) {
    const user = otherParticipants[0]?.user;
    displayName = user?.display_name || 
                  user?.email?.split('@')[0] || 
                  user?.phone || 
                  'Unknown User';
  }
  
  const avatarFallback = getInitials(displayName);
  const lastMessage = conversation.last_message;
  const unreadCount = conversation.unread_count || 0;
  const isGroup = conversation.conversation_type === 'group';
  
  return (
    <div 
      className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-0 ${
        selected ? 'bg-muted' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-sm">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          {isGroup && (
            <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5">
              <Users className="h-3 w-3" />
            </div>
          )}
          {!isGroup && otherParticipants[0]?.user?.is_online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm truncate">{displayName}</p>
            {lastMessage && (
              <span className="text-xs text-muted-foreground">
                {formatTime(lastMessage.created_at)}
              </span>
            )}
          </div>
          {lastMessage && (
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-sm text-muted-foreground truncate flex-1">
                {lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                {lastMessage.message}
              </p>
              {unreadCount > 0 && (
                <Badge className="ml-2 h-5 px-1.5 text-xs bg-primary">
                  {unreadCount}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── User List Item ──────────────────────────────────────────
function UserListItem({ user, onClick, isSelected, currentUserId }: {
  user: UserProfile;
  onClick: () => void;
  isSelected: boolean;
  currentUserId: string;
}) {
  if (user.id === currentUserId) return null;
  
  const displayName = user.display_name || 
                     user.email?.split('@')[0] || 
                     user.phone || 
                     'Unknown User';
  
  return (
    <div 
      className={`flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer rounded-lg transition-colors ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        {user.is_online && (
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground">
          {getRoleBadge(user.role)}
          {user.is_online ? ' • Online' : ''}
        </p>
      </div>
      <Badge variant="outline" className={`text-xs ${getRoleColor(user.role)}`}>
        {user.role}
      </Badge>
    </div>
  );
}

// ── New Conversation Dialog ─────────────────────────────────
function NewConversationDialog({ 
  open, 
  onOpenChange, 
  onStartConversation,
  users,
  currentUserId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartConversation: (type: string, participants: string[], name?: string) => void;
  users: UserProfile[];
  currentUserId: string;
}) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [conversationType, setConversationType] = useState("individual");
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  
  const filteredUsers = users.filter(u => {
    const displayName = u.display_name || u.email?.split('@')[0] || u.phone || '';
    return u.id !== currentUserId &&
      displayName.toLowerCase().includes(search.toLowerCase()) &&
      !selectedUsers.includes(u.id);
  });
  
  const handleStart = () => {
    if (conversationType === 'group' && selectedUsers.length < 2) {
      toast.error("Add at least 2 participants for group chat");
      return;
    }
    if (conversationType === 'individual' && selectedUsers.length !== 1) {
      toast.error("Select exactly 1 participant for individual chat");
      return;
    }
    if (conversationType === 'group' && !groupName) {
      toast.error("Enter a group name");
      return;
    }
    onStartConversation(conversationType, selectedUsers, groupName);
    setSelectedUsers([]);
    setGroupName("");
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            New Conversation
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Chat Type</Label>
            <Select value={conversationType} onValueChange={setConversationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">👤 Individual</SelectItem>
                <SelectItem value="group">👥 Group</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {conversationType === 'group' && (
            <div className="grid gap-2">
              <Label>Group Name *</Label>
              <Input 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
          )}
          
          <div className="grid gap-2">
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-9"
              />
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {conversationType === 'group' 
                ? `Selected (${selectedUsers.length})` 
                : `Selected (${selectedUsers.length}/1)`}
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedUsers.map(id => {
                const user = users.find(u => u.id === id);
                return user && (
                  <Badge key={id} variant="secondary" className="gap-1">
                    {user.display_name || user.email?.split('@')[0] || user.phone || 'User'}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 p-0"
                      onClick={() => setSelectedUsers(selectedUsers.filter(s => s !== id))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredUsers.map(user => {
                const displayName = user.display_name || user.email?.split('@')[0] || user.phone || 'User';
                return (
                  <div 
                    key={user.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer rounded"
                    onClick={() => setSelectedUsers([...selectedUsers, user.id])}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1">{displayName}</span>
                    <Badge variant="outline" className="text-xs">{user.role}</Badge>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && search && (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleStart}>
            <Plus className="h-4 w-4 mr-2" />
            Start Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── User Search Dialog ──────────────────────────────────────
function UserSearchDialog({ 
  open, 
  onOpenChange, 
  onAddUsers,
  existingParticipants,
  users,
  currentUserId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddUsers: (userIds: string[]) => void;
  existingParticipants: string[];
  users: UserProfile[];
  currentUserId: string;
}) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  
  const filteredUsers = users.filter((u: UserProfile) => {
    const displayName = u.display_name || u.email?.split('@')[0] || u.phone || '';
    return u.id !== currentUserId &&
      displayName.toLowerCase().includes(search.toLowerCase()) &&
      !existingParticipants.includes(u.id) &&
      !selectedUsers.includes(u.id);
  });
  
  const handleAdd = () => {
    if (selectedUsers.length === 0) {
      toast.error("Select at least one user");
      return;
    }
    onAddUsers(selectedUsers);
    setSelectedUsers([]);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Users to Group
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-9"
              />
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Selected ({selectedUsers.length})
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedUsers.map(id => {
                const user = users.find((u: UserProfile) => u.id === id);
                return user && (
                  <Badge key={id} variant="secondary" className="gap-1">
                    {user.display_name || user.email?.split('@')[0] || user.phone || 'User'}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 p-0"
                      onClick={() => setSelectedUsers(selectedUsers.filter(s => s !== id))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredUsers.map((user: UserProfile) => {
                const displayName = user.display_name || user.email?.split('@')[0] || user.phone || 'User';
                return (
                  <div 
                    key={user.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer rounded"
                    onClick={() => setSelectedUsers([...selectedUsers, user.id])}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1">{displayName}</span>
                    <Badge variant="outline" className="text-xs">{user.role}</Badge>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && search && (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={selectedUsers.length === 0}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CrmMessenger() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ── States ──────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [addUsersOpen, setAddUsersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingProfiles, setIsCreatingProfiles] = useState(false);
  
  // ── Check if user is authenticated ─────────────────────────
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Please login to access messages</p>
        </div>
      </div>
    );
  }
  
  // ── Function to ensure profiles exist for all auth users ──
  const ensureProfilesExist = async () => {
    try {
      setIsCreatingProfiles(true);
      console.log('Checking if profiles exist...');
      
      // Get all profiles
      const { data: existingProfiles, error: fetchError } = await supabase
        .from("profiles")
        .select("id");
      
      if (fetchError) {
        console.error('Error fetching profiles:', fetchError);
        return;
      }
      
      const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || []);
      
      // Get all auth users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        return;
      }
      
      if (!authUsers || authUsers.users.length === 0) {
        console.log('No auth users found');
        return;
      }
      
      // Find users without profiles
      const usersWithoutProfiles = authUsers.users.filter(
        (au: any) => !existingProfileIds.has(au.id)
      );
      
      if (usersWithoutProfiles.length === 0) {
        console.log('All users have profiles');
        return;
      }
      
      console.log(`Creating ${usersWithoutProfiles.length} profiles...`);
      
      // Create profiles for users without them
      const profilesToInsert = usersWithoutProfiles.map((au: any) => ({
        id: au.id,
        display_name: au.user_metadata?.display_name || 
                      au.email?.split('@')[0] || 
                      'User',
        email: au.email,
        phone: au.phone || null,
        role: 'user',
        avatar_url: null,
        is_online: false,
        last_seen: null
      }));
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profilesToInsert);
      
      if (insertError) {
        console.error('Error creating profiles:', insertError);
        toast.error('Failed to create user profiles');
      } else {
        console.log('Profiles created successfully');
        toast.success(`Created ${usersWithoutProfiles.length} user profiles`);
      }
    } catch (error) {
      console.error('Error in ensureProfilesExist:', error);
    } finally {
      setIsCreatingProfiles(false);
    }
  };
  
  // ── Fetch All Users from Supabase ──────────────────────────
  const { data: allUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ["all-users-messenger"],
    queryFn: async () => {
      console.log('Fetching all users from profiles table...');
      
      // First, ensure all auth users have profiles
      await ensureProfilesExist();
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, role, email, phone, is_online, last_seen")
        .order("display_name");
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      // If still no profiles, try a different approach - fetch from auth directly
      if (!data || data.length === 0) {
        console.log('No profiles found after creation attempt, trying direct auth fetch...');
        
        try {
          // Try to get users from auth
          const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
          
          if (!authError && authData && authData.users.length > 0) {
            // Return auth users as UserProfile objects
            return authData.users.map((au: any) => ({
              id: au.id,
              display_name: au.user_metadata?.display_name || au.email?.split('@')[0] || 'User',
              email: au.email,
              phone: au.phone || null,
              role: 'user',
              avatar_url: null,
              is_online: false,
              last_seen: null
            })) as UserProfile[];
          }
        } catch (authFetchError) {
          console.error('Error fetching auth users:', authFetchError);
        }
        
        return [];
      }
      
      // Ensure every user has a display_name
      const users = data.map((u: any) => ({
        ...u,
        display_name: u.display_name || u.email?.split('@')[0] || u.phone || `User_${u.id.slice(0, 8)}`
      }));
      
      console.log('Fetched users:', users.length, 'users');
      return users as UserProfile[];
    },
    enabled: !!user,
  });
  
  // ── Fetch Conversations ────────────────────────────────────
  const fetchConversations = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      // Get user's conversations
      const { data: participantData, error: participantError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);
      
      if (participantError) throw participantError;
      
      const conversationIds = participantData.map(p => p.conversation_id);
      
      if (conversationIds.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }
      
      // Get conversation details
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select(`
          *,
          participants:conversation_participants(
            id,
            user_id,
            role,
            joined_at,
            user:profiles!user_id(
              id,
              display_name,
              avatar_url,
              role,
              is_online,
              last_seen
            )
          )
        `)
        .in("id", conversationIds)
        .order("last_message_at", { ascending: false });
      
      if (convError) throw convError;
      
      // Get last message and unread count for each conversation
      const convWithDetails = await Promise.all((convData || []).map(async (conv: any) => {
        // Get last message
        const { data: lastMsg } = await supabase
          .from("messages")
          .select(`
            *,
            sender:profiles!sender_id(
              id,
              display_name,
              avatar_url,
              role
            )
          `)
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // Get unread count
        const { count } = await supabase
          .from("messages")
          .select("*", { count: 'exact', head: true })
          .eq("conversation_id", conv.id)
          .eq("status", "sent")
          .neq("sender_id", user.id);
        
        return {
          ...conv,
          last_message: lastMsg,
          unread_count: count || 0
        };
      }));
      
      setConversations(convWithDetails);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };
  
  // ── Fetch Messages ─────────────────────────────────────────
  const fetchMessages = async (conversationId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!sender_id(
            id,
            display_name,
            avatar_url,
            role
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      // Ensure sender display_name has fallback
      const messagesWithFallback = (data || []).map((msg: any) => ({
        ...msg,
        sender: msg.sender ? {
          ...msg.sender,
          display_name: msg.sender.display_name || 'User'
        } : undefined
      }));
      
      setMessages(messagesWithFallback);
      
      // Mark messages as read
      if (data && data.length > 0) {
        await supabase
          .from("messages")
          .update({ status: "read", read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .neq("status", "read");
        
        // Update unread count in UI
        setConversations(prev => 
          prev.map(c => 
            c.id === conversationId 
              ? { ...c, unread_count: 0 }
              : c
          )
        );
      }
      
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  
  // ── Send Message ────────────────────────────────────────────
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !user || isSending) return;
    
    setIsSending(true);
    const messageText = messageInput.trim();
    setMessageInput(""); // Clear input immediately for better UX
    
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          message: messageText,
          message_type: "text",
          status: "sent",
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update conversation last message
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);
      
      // Find sender data with fallback
      const senderData = allUsers.find(u => u.id === user.id);
      const senderName = senderData?.display_name || 
                         user.email?.split('@')[0] || 
                         user.phone || 
                         "User";
      
      // Update messages list
      setMessages(prev => [...prev, { 
        ...data, 
        sender: { 
          id: user.id, 
          display_name: senderName, 
          role: senderData?.role || "user",
          avatar_url: senderData?.avatar_url || null
        } 
      }]);
      
      // Update conversation list
      setConversations(prev => 
        prev.map(c => 
          c.id === selectedConversation.id 
            ? { 
                ...c, 
                last_message: { 
                  ...data, 
                  sender: { 
                    id: user.id, 
                    display_name: senderName, 
                    role: senderData?.role || "user",
                    avatar_url: senderData?.avatar_url || null
                  } 
                },
                last_message_at: new Date().toISOString()
              }
            : c
        )
      );
      
      scrollToBottom();
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
      // Restore message if send failed
      setMessageInput(messageText);
    } finally {
      setIsSending(false);
    }
  };
  
  // ── Handle Key Press ───────────────────────────────────────
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // ── Create Conversation ────────────────────────────────────
  const createConversation = async (type: string, participantIds: string[], name?: string) => {
    if (!user) return;
    
    try {
      // Check if individual conversation already exists
      if (type === 'individual' && participantIds.length === 1) {
        const otherUserId = participantIds[0];
        
        // Get user's conversation IDs
        const { data: userConvs } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);
        
        if (userConvs && userConvs.length > 0) {
          const convIds = userConvs.map(p => p.conversation_id);
          
          // Check if other user is in any of these conversations
          const { data: otherParticipant } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .in("conversation_id", convIds)
            .eq("user_id", otherUserId);
          
          if (otherParticipant && otherParticipant.length > 0) {
            // Check if it's an individual conversation
            const { data: convCheck } = await supabase
              .from("conversations")
              .select("id, conversation_type")
              .in("id", otherParticipant.map(p => p.conversation_id))
              .eq("conversation_type", "individual");
            
            if (convCheck && convCheck.length > 0) {
              const existingConv = conversations.find(c => c.id === convCheck[0].id);
              if (existingConv) {
                setSelectedConversation(existingConv);
                await fetchMessages(existingConv.id);
                setNewConversationOpen(false);
                toast.info("Existing conversation opened");
                return;
              }
            }
          }
        }
      }
      
      // Create conversation
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .insert({
          conversation_type: type,
          conversation_name: type === 'group' ? name : null,
          created_by: user.id,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (convError) throw convError;
      
      // Add participants
      const participants = [user.id, ...participantIds];
      const participantInserts = participants.map(pid => ({
        conversation_id: convData.id,
        user_id: pid,
        role: pid === user.id ? 'admin' : 'member',
        joined_at: new Date().toISOString(),
      }));
      
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(participantInserts);
      
      if (partError) throw partError;
      
      toast.success("Conversation created!");
      setNewConversationOpen(false);
      
      // Fetch updated conversations
      await fetchConversations();
      
      // Find and select the new conversation
      setTimeout(() => {
        const newConv = conversations.find(c => c.id === convData.id);
        if (newConv) {
          setSelectedConversation(newConv);
          fetchMessages(convData.id);
        } else {
          // If not found in state, construct it manually
          const constructedConv = {
            ...convData,
            participants: participantInserts.map(p => ({ 
              ...p, 
              user: { 
                id: p.user_id, 
                display_name: p.user_id === user.id ? 
                  (allUsers.find(u => u.id === user.id)?.display_name || user.email?.split('@')[0] || "You") : 
                  (allUsers.find(u => u.id === p.user_id)?.display_name || "User"),
                role: p.user_id === user.id ? 
                  (allUsers.find(u => u.id === user.id)?.role || "user") : 
                  "user",
                avatar_url: null,
                is_online: false,
              } 
            })),
            unread_count: 0,
          };
          setSelectedConversation(constructedConv as any);
          fetchMessages(convData.id);
        }
      }, 300);
      
    } catch (error: any) {
      console.error("Create conversation error:", error);
      toast.error(error.message || "Failed to create conversation");
    }
  };
  
  // ── Add Users to Group ─────────────────────────────────────
  const addUsersToGroup = async (userIds: string[]) => {
    if (!selectedConversation) return;
    
    try {
      const inserts = userIds.map(uid => ({
        conversation_id: selectedConversation.id,
        user_id: uid,
        role: 'member',
        joined_at: new Date().toISOString(),
      }));
      
      const { error } = await supabase
        .from("conversation_participants")
        .insert(inserts);
      
      if (error) throw error;
      
      toast.success(`${userIds.length} users added to group!`);
      await fetchConversations();
      if (selectedConversation) {
        await fetchMessages(selectedConversation.id);
      }
      setAddUsersOpen(false);
      
    } catch (error: any) {
      console.error("Add users error:", error);
      toast.error(error.message || "Failed to add users");
    }
  };
  
  // ── Delete Message ──────────────────────────────────────────
  const deleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);
      
      if (error) throw error;
      
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  
  // ── Refresh All Data ────────────────────────────────────────
  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchConversations(),
      refetchUsers(),
    ]);
    setRefreshing(false);
    toast.success("Refreshed!");
  };
  
  // ── Scroll to Bottom ────────────────────────────────────────
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // ── Setup Real-time Subscriptions ─────────────────────────
  useEffect(() => {
    if (!user) return;
    
    fetchConversations();
    
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Fetch sender details
          const { data: senderData } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, role")
            .eq("id", payload.new.sender_id)
            .single();
          
          const newMessage = {
            ...payload.new,
            sender: senderData || {
              id: payload.new.sender_id,
              display_name: 'User',
              avatar_url: null,
              role: 'user'
            },
          };
          
          // Add to messages if in current conversation
          if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
            
            // Mark as read
            if (payload.new.sender_id !== user.id) {
              await supabase
                .from("messages")
                .update({ status: "read", read_at: new Date().toISOString() })
                .eq("id", payload.new.id);
            }
          }
          
          // Update conversation list
          setConversations(prev => {
            const updated = prev.map(c => {
              if (c.id === payload.new.conversation_id) {
                return {
                  ...c,
                  last_message: newMessage,
                  last_message_at: payload.new.created_at,
                  unread_count: payload.new.sender_id !== user.id 
                    ? (c.unread_count || 0) + 1 
                    : c.unread_count || 0,
                };
              }
              return c;
            });
            return updated.sort((a, b) => 
              new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
            );
          });
        }
      )
      .subscribe();
    
    // Subscribe to user online status
    const statusChannel = supabase
      .channel('status-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          if (payload.new.is_online) {
            setOnlineUsers(prev => [...prev, payload.new.id]);
          } else {
            setOnlineUsers(prev => prev.filter(id => id !== payload.new.id));
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(statusChannel);
    };
  }, [user, selectedConversation?.id]);
  
  // ── Load messages when conversation changes ────────────────
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);
  
  // ── Get other participants display name ────────────────────
  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.conversation_type === 'group') {
      return conversation.conversation_name || 'Group Chat';
    }
    const other = conversation.participants?.find(p => p.user_id !== user?.id);
    if (other?.user) {
      return other.user.display_name || 
             other.user.email?.split('@')[0] || 
             other.user.phone || 
             'Unknown User';
    }
    return 'Unknown User';
  };
  
  // ── Get participants count ──────────────────────────────────
  const getParticipantCount = (conversation: Conversation) => {
    return conversation.participants?.length || 0;
  };
  
  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4">
      {/* ── Sidebar ── */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={refreshAll}
                disabled={refreshing || isCreatingProfiles}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button size="sm" onClick={() => setNewConversationOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="chats" className="flex-1">Chats</TabsTrigger>
              <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chats" className="h-[calc(100%-40px)] m-0">
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No conversations yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setNewConversationOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start New Chat
                    </Button>
                  </div>
                ) : (
                  conversations
                    .filter(c => {
                      const name = getConversationDisplayName(c);
                      return name.toLowerCase().includes(search.toLowerCase()) ||
                        (c.conversation_name || "").toLowerCase().includes(search.toLowerCase());
                    })
                    .map(conv => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        selected={selectedConversation?.id === conv.id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          fetchMessages(conv.id);
                        }}
                        currentUserId={user?.id || ''}
                      />
                    ))
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="users" className="h-[calc(100%-40px)] m-0">
              <ScrollArea className="h-full p-3">
                {isLoading || isCreatingProfiles ? (
                  <div className="flex flex-col justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isCreatingProfiles ? 'Creating user profiles...' : 'Loading users...'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">All Users</span>
                        <Badge variant="secondary">
                          {allUsers.length}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {onlineUsers.length} online
                      </Badge>
                    </div>
                    {allUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No users found</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={refreshAll}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Users
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {allUsers
                          .filter(u => u.id !== user?.id)
                          .map((u: UserProfile) => (
                            <UserListItem
                              key={u.id}
                              user={{
                                ...u,
                                is_online: onlineUsers.includes(u.id)
                              }}
                              isSelected={false}
                              onClick={() => {
                                createConversation('individual', [u.id]);
                              }}
                              currentUserId={user?.id || ''}
                            />
                          ))}
                      </div>
                    )}
                  </>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* ── Chat Area ── */}
      <Card className="flex-1 flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Welcome to CRM Messenger</h3>
              <p className="text-sm text-muted-foreground">
                Select a conversation or start a new chat
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat Header ── */}
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(getConversationDisplayName(selectedConversation))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {getConversationDisplayName(selectedConversation)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.conversation_type === 'group' ? (
                        `${getParticipantCount(selectedConversation)} members`
                      ) : (
                        onlineUsers.includes(selectedConversation.participants?.find(p => p.user_id !== user?.id)?.user_id || '') ? 'Online' : 'Offline'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {selectedConversation.conversation_type === 'group' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setAddUsersOpen(true)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {/* ── Messages ── */}
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      const prevMsg = index > 0 ? messages[index - 1] : null;
                      const showDate = !prevMsg || 
                        formatDate(msg.created_at) !== formatDate(prevMsg.created_at);
                      
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <Badge variant="outline" className="text-xs">
                                {formatDate(msg.created_at)}
                              </Badge>
                            </div>
                          )}
                          <MessageBubble
                            message={msg}
                            isOwn={msg.sender_id === user?.id}
                            onDelete={deleteMessage}
                            onReply={() => {}}
                          />
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </ScrollArea>
            </CardContent>
            
            {/* ── Message Input ── */}
            <CardHeader className="pt-3 border-t">
              <div className="flex items-end gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    // Handle file upload
                    toast.info("File upload coming soon!");
                  }}
                />
                <Textarea 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="min-h-[44px] max-h-32 resize-none"
                  rows={1}
                  disabled={isSending}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className="h-9 w-9 flex-shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
          </>
        )}
      </Card>
      
      {/* ── Dialogs ── */}
      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        onStartConversation={createConversation}
        users={allUsers}
        currentUserId={user?.id || ''}
      />
      
      <UserSearchDialog
        open={addUsersOpen}
        onOpenChange={setAddUsersOpen}
        onAddUsers={addUsersToGroup}
        existingParticipants={selectedConversation?.participants?.map(p => p.user_id) || []}
        users={allUsers}
        currentUserId={user?.id || ''}
      />
    </div>
  );
}
