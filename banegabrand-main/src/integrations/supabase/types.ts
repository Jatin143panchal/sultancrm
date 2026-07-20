export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          completed_at: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          due_date: string | null
          employee_remarks: string | null
          id: string
          task_status: string
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          employee_remarks?: string | null
          id?: string
          task_status?: string
          title: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          employee_remarks?: string | null
          id?: string
          task_status?: string
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          id: string
          location_in: string | null
          location_out: string | null
          notes: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          location_in?: string | null
          location_out?: string | null
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          location_in?: string | null
          location_out?: string | null
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          budget: number | null
          conversions: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          leads_generated: number | null
          name: string
          revenue: number | null
          spent: number | null
          start_date: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          conversions?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          leads_generated?: number | null
          name: string
          revenue?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          conversions?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          leads_generated?: number | null
          name?: string
          revenue?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          assigned_to: string | null
          category: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          resolution: string | null
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          last_contact: string | null
          name: string
          phone: string | null
          position: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact?: string | null
          name: string
          phone?: string | null
          position?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact?: string | null
          name?: string
          phone?: string | null
          position?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_fields: {
        Row: {
          created_at: string
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          module: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field_name: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          module?: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          module?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          blockers: string | null
          created_at: string
          hours_worked: number | null
          id: string
          notes: string | null
          report_date: string
          tasks_completed: string | null
          tasks_pending: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blockers?: string | null
          created_at?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          report_date?: string
          tasks_completed?: string | null
          tasks_pending?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blockers?: string | null
          created_at?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          report_date?: string
          tasks_completed?: string | null
          tasks_pending?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_columns: {
        Row: {
          column_name: string
          created_at: string
          id: string
          is_visible: boolean
          module: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          column_name: string
          created_at?: string
          id?: string
          is_visible?: boolean
          module?: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          column_name?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          module?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          company: string | null
          contact_name: string | null
          created_at: string
          expected_close: string | null
          id: string
          probability: number | null
          progress: number | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          company?: string | null
          contact_name?: string | null
          created_at?: string
          expected_close?: string | null
          id?: string
          probability?: number | null
          progress?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          company?: string | null
          contact_name?: string | null
          created_at?: string
          expected_close?: string | null
          id?: string
          probability?: number | null
          progress?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      digilocker_verifications: {
        Row: {
          created_at: string
          date_of_birth: string | null
          document_number: string | null
          document_type: string
          document_url: string | null
          full_name: string | null
          id: string
          remarks: string | null
          updated_at: string
          user_id: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          document_number?: string | null
          document_type?: string
          document_url?: string | null
          full_name?: string | null
          id?: string
          remarks?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          document_number?: string | null
          document_type?: string
          document_url?: string | null
          full_name?: string | null
          id?: string
          remarks?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          created_at: string
          from_email: string | null
          from_name: string | null
          id: string
          is_active: boolean
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_user: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_active?: boolean
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_active?: boolean
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_heads: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget: string | null
          business_status: string | null
          company: string | null
          created_at: string
          cx_comment: string | null
          email: string | null
          id: string
          lead_type: string | null
          name: string
          next_call_date: string | null
          phone: string | null
          remark: string | null
          source: string | null
          stage: string | null
          status: Database["public"]["Enums"]["lead_status"]
          sub_stage: string | null
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          budget?: string | null
          business_status?: string | null
          company?: string | null
          created_at?: string
          cx_comment?: string | null
          email?: string | null
          id?: string
          lead_type?: string | null
          name: string
          next_call_date?: string | null
          phone?: string | null
          remark?: string | null
          source?: string | null
          stage?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          sub_stage?: string | null
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          budget?: string | null
          business_status?: string | null
          company?: string | null
          created_at?: string
          cx_comment?: string | null
          email?: string | null
          id?: string
          lead_type?: string | null
          name?: string
          next_call_date?: string | null
          phone?: string | null
          remark?: string | null
          source?: string | null
          stage?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          sub_stage?: string | null
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_notes: string | null
          avatar_url: string | null
          created_at: string
          department: string | null
          display_name: string | null
          email: string | null
          employee_status: string | null
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          employee_status?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          employee_status?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          subject: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          subject?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      terms_conditions: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_activity_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_comments: {
        Row: {
          id: string
          lead_id: string
          user_id: string
          comment: string
          call_outcome: string | null
          next_call_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          user_id: string
          comment: string
          call_outcome?: string | null
          next_call_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          user_id?: string
          comment?: string
          call_outcome?: string | null
          next_call_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          achievements: string | null
          challenges: string | null
          created_at: string
          id: string
          next_week_plan: string | null
          summary: string | null
          total_hours: number | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          achievements?: string | null
          challenges?: string | null
          created_at?: string
          id?: string
          next_week_plan?: string | null
          summary?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          achievements?: string | null
          challenges?: string | null
          created_at?: string
          id?: string
          next_week_plan?: string | null
          summary?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_user_primary_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      activity_type: "call" | "email" | "meeting" | "task" | "note"
      app_role: "admin" | "user" | "owner" | "hr_manager" | "tl" | "employee"
      deal_stage:
        | "prospecting"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      lead_status: "new" | "contacted" | "answered" | "not_answered" | "qualified" | "converted" | "lost"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: ["call", "email", "meeting", "task", "note"],
      app_role: ["admin", "user", "owner", "hr_manager", "tl", "employee"],
      deal_stage: [
        "prospecting",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      lead_status: ["new", "contacted", "answered", "not_answered", "qualified", "converted", "lost"],
    },
  },
} as const
