export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      chat_mentions: {
        Row: {
          id: number;
          mentioned: string | null;
          message: number;
        };
        Insert: {
          id?: number;
          mentioned?: string | null;
          message: number;
        };
        Update: {
          id?: number;
          mentioned?: string | null;
          message?: number;
        };
        Relationships: [
          {
            foreignKeyName: "chat_mentions_mentioned_fkey";
            columns: ["mentioned"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_mentions_mentioned_fkey";
            columns: ["mentioned"];
            isOneToOne: false;
            referencedRelation: "staff_data";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_mentions_message_fkey";
            columns: ["message"];
            isOneToOne: false;
            referencedRelation: "chat_message";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_message: {
        Row: {
          deleted: boolean | null;
          id: number;
          message: string | null;
          sender: string;
        };
        Insert: {
          deleted?: boolean | null;
          id?: number;
          message?: string | null;
          sender: string;
        };
        Update: {
          deleted?: boolean | null;
          id?: number;
          message?: string | null;
          sender?: string;
        };
        Relationships: [];
      };
      crew_member: {
        Row: {
          id: number;
          program: number;
          role: Database["public"]["Enums"]["crew_position"] | null;
          staff: string;
        };
        Insert: {
          id?: number;
          program: number;
          role?: Database["public"]["Enums"]["crew_position"] | null;
          staff: string;
        };
        Update: {
          id?: number;
          program?: number;
          role?: Database["public"]["Enums"]["crew_position"] | null;
          staff?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crew_member_program_fkey";
            columns: ["program"];
            isOneToOne: false;
            referencedRelation: "program";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crew_member_staff_fkey";
            columns: ["staff"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crew_member_staff_fkey";
            columns: ["staff"];
            isOneToOne: false;
            referencedRelation: "staff_data";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment_item: {
        Row: {
          id: number;
          notes: string | null;
          serial: string;
          status: Database["public"]["Enums"]["equipment_status"];
          type: number;
        };
        Insert: {
          id?: number;
          notes?: string | null;
          serial: string;
          status: Database["public"]["Enums"]["equipment_status"];
          type: number;
        };
        Update: {
          id?: number;
          notes?: string | null;
          serial?: string;
          status?: Database["public"]["Enums"]["equipment_status"];
          type?: number;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_item_type_fkey";
            columns: ["type"];
            isOneToOne: false;
            referencedRelation: "equipment_type";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment_loan: {
        Row: {
          expected_return_date: string | null;
          id: number;
          inventory: Database["public"]["Enums"]["equipment_inventory"] | null;
          return_date: string | null;
          start_date: string | null;
          status: Database["public"]["Enums"]["loan_status"] | null;
          taken_by: Json | null;
        };
        Insert: {
          expected_return_date?: string | null;
          id?: number;
          inventory?: Database["public"]["Enums"]["equipment_inventory"] | null;
          return_date?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["loan_status"] | null;
          taken_by?: Json | null;
        };
        Update: {
          expected_return_date?: string | null;
          id?: number;
          inventory?: Database["public"]["Enums"]["equipment_inventory"] | null;
          return_date?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["loan_status"] | null;
          taken_by?: Json | null;
        };
        Relationships: [];
      };
      equipment_loan_item: {
        Row: {
          id: number;
          item: number;
          loan: number;
        };
        Insert: {
          id?: number;
          item: number;
          loan: number;
        };
        Update: {
          id?: number;
          item?: number;
          loan?: number;
        };
        Relationships: [];
      };
      equipment_type: {
        Row: {
          category: Database["public"]["Enums"]["equipment_category"] | null;
          description: string | null;
          id: number;
          name: string;
        };
        Insert: {
          category?: Database["public"]["Enums"]["equipment_category"] | null;
          description?: string | null;
          id?: number;
          name: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["equipment_category"] | null;
          description?: string | null;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      program: {
        Row: {
          date: string | null;
          description: string | null;
          foh_list: string | null;
          id: number;
          leader: string | null;
          location: string | null;
          other_list: string | null;
          stage_list: string | null;
          status: Database["public"]["Enums"]["program_state"] | null;
        };
        Insert: {
          date?: string | null;
          description?: string | null;
          foh_list?: string | null;
          id?: number;
          leader?: string | null;
          location?: string | null;
          other_list?: string | null;
          stage_list?: string | null;
          status?: Database["public"]["Enums"]["program_state"] | null;
        };
        Update: {
          date?: string | null;
          description?: string | null;
          foh_list?: string | null;
          id?: number;
          leader?: string | null;
          location?: string | null;
          other_list?: string | null;
          stage_list?: string | null;
          status?: Database["public"]["Enums"]["program_state"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "program_leader_fkey";
            columns: ["leader"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_leader_fkey";
            columns: ["leader"];
            isOneToOne: false;
            referencedRelation: "staff_data";
            referencedColumns: ["id"];
          },
        ];
      };
      program_file: {
        Row: {
          file: string;
          id: number;
          program: number;
        };
        Insert: {
          file: string;
          id?: number;
          program: number;
        };
        Update: {
          file?: string;
          id?: number;
          program?: number;
        };
        Relationships: [
          {
            foreignKeyName: "program_file_program_fkey";
            columns: ["program"];
            isOneToOne: false;
            referencedRelation: "program";
            referencedColumns: ["id"];
          },
        ];
      };
      rehearsal: {
        Row: {
          id: number;
          lesson_period: string | null;
          notes: string | null;
          program: number;
        };
        Insert: {
          id?: number;
          lesson_period?: string | null;
          notes?: string | null;
          program: number;
        };
        Update: {
          id?: number;
          lesson_period?: string | null;
          notes?: string | null;
          program?: number;
        };
        Relationships: [
          {
            foreignKeyName: "rehearsal_program_fkey";
            columns: ["program"];
            isOneToOne: false;
            referencedRelation: "program";
            referencedColumns: ["id"];
          },
        ];
      };
      role: {
        Row: {
          add: Database["public"]["Enums"]["role_view"][] | null;
          color: string | null;
          delete: Database["public"]["Enums"]["role_view"][] | null;
          id: number;
          name: string | null;
          read: Database["public"]["Enums"]["role_view"][] | null;
          update: Database["public"]["Enums"]["role_view"][] | null;
        };
        Insert: {
          add?: Database["public"]["Enums"]["role_view"][] | null;
          color?: string | null;
          delete?: Database["public"]["Enums"]["role_view"][] | null;
          id?: number;
          name?: string | null;
          read?: Database["public"]["Enums"]["role_view"][] | null;
          update?: Database["public"]["Enums"]["role_view"][] | null;
        };
        Update: {
          add?: Database["public"]["Enums"]["role_view"][] | null;
          color?: string | null;
          delete?: Database["public"]["Enums"]["role_view"][] | null;
          id?: number;
          name?: string | null;
          read?: Database["public"]["Enums"]["role_view"][] | null;
          update?: Database["public"]["Enums"]["role_view"][] | null;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          mention_name: string | null;
          name: string | null;
          positions: Database["public"]["Enums"]["staff_position"][] | null;
          role: number | null;
        };
        Insert: {
          id: string;
          mention_name?: string | null;
          name?: string | null;
          positions?: Database["public"]["Enums"]["staff_position"][] | null;
          role?: number | null;
        };
        Update: {
          id?: string;
          mention_name?: string | null;
          name?: string | null;
          positions?: Database["public"]["Enums"]["staff_position"][] | null;
          role?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "staff_role_fkey";
            columns: ["role"];
            isOneToOne: false;
            referencedRelation: "role";
            referencedColumns: ["id"];
          },
        ];
      };
      task: {
        Row: {
          assigned_to: string | null;
          details: string | null;
          id: number;
          priority: Database["public"]["Enums"]["task_priority"] | null;
          program: number | null;
          status: Database["public"]["Enums"]["task_status"] | null;
          type: Database["public"]["Enums"]["task_type"] | null;
        };
        Insert: {
          assigned_to?: string | null;
          details?: string | null;
          id?: number;
          priority?: Database["public"]["Enums"]["task_priority"] | null;
          program?: number | null;
          status?: Database["public"]["Enums"]["task_status"] | null;
          type?: Database["public"]["Enums"]["task_type"] | null;
        };
        Update: {
          assigned_to?: string | null;
          details?: string | null;
          id?: number;
          priority?: Database["public"]["Enums"]["task_priority"] | null;
          program?: number | null;
          status?: Database["public"]["Enums"]["task_status"] | null;
          type?: Database["public"]["Enums"]["task_type"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "staff_data";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_program_fkey";
            columns: ["program"];
            isOneToOne: false;
            referencedRelation: "program";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      staff_data: {
        Row: {
          email: string | null;
          id: string | null;
          mention_name: string | null;
          name: string | null;
          phone: string | null;
          positions: Database["public"]["Enums"]["staff_position"][] | null;
          role: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "staff_role_fkey";
            columns: ["role"];
            isOneToOne: false;
            referencedRelation: "role";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      crew_position:
        | "Stage"
        | "hangtechnikus"
        | "fenytechnikus"
        | "fotos"
        | "videos"
        | "vetito";
      equipment_category:
        | "hangtechnika"
        | "fenytechnika"
        | "szinpad"
        | "kabel"
        | "egyeb";
      equipment_inventory: "foh" | "stage" | "egyeb" | "external";
      equipment_status: "elerheto" | "karbantartas" | "selejt";
      loan_status: "aktiv" | "lezart";
      program_state:
        | "varakozo"
        | "tervezes"
        | "proba_alatt"
        | "veglegesites"
        | "lemondva"
        | "lezarva";
      role_view:
        | "equipment"
        | "programs"
        | "staff"
        | "task"
        | "chat"
        | "settings";
      staff_position:
        | "hangtechnikus"
        | "fenytechnikus"
        | "stage"
        | "szervezo"
        | "egyeb";
      task_priority: "alacsony" | "kozepes" | "magas";
      task_status: "teendo" | "folyamatban" | "kesz";
      task_type: "sound" | "light";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      crew_position: [
        "Stage",
        "hangtechnikus",
        "fenytechnikus",
        "fotos",
        "videos",
        "vetito",
      ],
      equipment_category: [
        "hangtechnika",
        "fenytechnika",
        "szinpad",
        "kabel",
        "egyeb",
      ],
      equipment_inventory: ["foh", "stage", "egyeb", "external"],
      equipment_status: ["elerheto", "karbantartas", "selejt"],
      loan_status: ["aktiv", "lezart"],
      program_state: [
        "varakozo",
        "tervezes",
        "proba_alatt",
        "veglegesites",
        "lemondva",
        "lezarva",
      ],
      role_view: ["equipment", "programs", "staff", "task", "chat", "settings"],
      staff_position: [
        "hangtechnikus",
        "fenytechnikus",
        "stage",
        "szervezo",
        "egyeb",
      ],
      task_priority: ["alacsony", "kozepes", "magas"],
      task_status: ["teendo", "folyamatban", "kesz"],
      task_type: ["sound", "light"],
    },
  },
} as const;
