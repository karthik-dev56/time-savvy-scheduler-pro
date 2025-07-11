export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_prediction_metrics: {
        Row: {
          created_at: string | null
          duration_accuracy: number
          id: string
          no_show_accuracy: number
          reschedule_acceptance: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_accuracy?: number
          id?: string
          no_show_accuracy?: number
          reschedule_acceptance?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_accuracy?: number
          id?: string
          no_show_accuracy?: number
          reschedule_acceptance?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_predictions: {
        Row: {
          accuracy: number
          created_at: string | null
          id: string
          prediction: string
          timestamp: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          accuracy: number
          created_at?: string | null
          id?: string
          prediction: string
          timestamp?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          accuracy?: number
          created_at?: string | null
          id?: string
          prediction?: string
          timestamp?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          is_multi_person: boolean
          priority: string
          reminder_email: string | null
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_multi_person?: boolean
          priority?: string
          reminder_email?: string | null
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_multi_person?: boolean
          priority?: string
          reminder_email?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
          notify_on_appointment: boolean
          notify_on_settings_change: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notify_on_appointment?: boolean
          notify_on_settings_change?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notify_on_appointment?: boolean
          notify_on_settings_change?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          id: string
          push_enabled: boolean
          push_token: string | null
          reminder_minutes: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          push_enabled?: boolean
          push_token?: string | null
          reminder_minutes?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          push_enabled?: boolean
          push_token?: string | null
          reminder_minutes?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          appointment_id: string
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
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
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "manager" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "manager", "user"],
    },
  },
} as const
