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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          published: boolean | null
          published_at: string | null
          target_audience: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          schedule_id: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          schedule_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          schedule_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          phone: string | null
          preferred_language: string | null
          preferred_location: string | null
          student_name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          phone?: string | null
          preferred_language?: string | null
          preferred_location?: string | null
          student_name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string | null
          preferred_language?: string | null
          preferred_location?: string | null
          student_name?: string
        }
        Relationships: []
      }
      class_schedules: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          location: string | null
          recurrence_rule: string | null
          recurring: boolean | null
          start_time: string
          title: string
          tutor_id: string | null
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          recurrence_rule?: string | null
          recurring?: boolean | null
          start_time: string
          title: string
          tutor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          recurrence_rule?: string | null
          recurring?: boolean | null
          start_time?: string
          title?: string
          tutor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          duration_weeks: number | null
          id: string
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string | null
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string | null
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string | null
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          student_id: string
          tutor_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          student_id: string
          tutor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          student_id?: string
          tutor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notes_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cards: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
          student_id: string
          term: string | null
          title: string
          uploaded_by: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
          student_id: string
          term?: string | null
          title: string
          uploaded_by?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
          student_id?: string
          term?: string | null
          title?: string
          uploaded_by?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          page: string
          section_key: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          page: string
          section_key: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          page?: string
          section_key?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      student_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string | null
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string | null
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string | null
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grades: {
        Row: {
          attitude: string | null
          class_name: string
          comments: string | null
          created_at: string | null
          homework: string | null
          id: string
          import_batch_id: string | null
          imported_by: string | null
          participation: string | null
          semester: string
          student_id: string
          test_quiz: string | null
          updated_at: string | null
        }
        Insert: {
          attitude?: string | null
          class_name: string
          comments?: string | null
          created_at?: string | null
          homework?: string | null
          id?: string
          import_batch_id?: string | null
          imported_by?: string | null
          participation?: string | null
          semester: string
          student_id: string
          test_quiz?: string | null
          updated_at?: string | null
        }
        Update: {
          attitude?: string | null
          class_name?: string
          comments?: string | null
          created_at?: string | null
          homework?: string | null
          id?: string
          import_batch_id?: string | null
          imported_by?: string | null
          participation?: string | null
          semester?: string
          student_id?: string
          test_quiz?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          account_type: string
          active: boolean | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          grade_level: string | null
          id: string
          last_name: string
          linked_student_id: string | null
          notes: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          school: string | null
          status: string
          student_number: string | null
          tutor_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_type?: string
          active?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          grade_level?: string | null
          id?: string
          last_name: string
          linked_student_id?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          school?: string | null
          status?: string
          student_number?: string | null
          tutor_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: string
          active?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          grade_level?: string | null
          id?: string
          last_name?: string
          linked_student_id?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          school?: string | null
          status?: string
          student_number?: string | null
          tutor_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_linked_student_id_fkey"
            columns: ["linked_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      tutors: {
        Row: {
          active: boolean | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          specializations: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          specializations?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          specializations?: string[] | null
          updated_at?: string | null
          user_id?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_linked_student_id_for_parent: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      attendance_status: "present" | "absent" | "late" | "excused"
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
      app_role: ["admin", "user"],
      attendance_status: ["present", "absent", "late", "excused"],
    },
  },
} as const
