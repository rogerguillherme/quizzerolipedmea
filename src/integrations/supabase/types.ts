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
      app_settings: {
        Row: {
          app_key: string
          setting_key: string
          updated_at: string
          value: Json
        }
        Insert: {
          app_key: string
          setting_key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          app_key?: string
          setting_key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      crm_conversations: {
        Row: {
          app_context: string
          created_at: string
          id: string
          lead_id: string | null
          modo: string
          nao_lidas: number
          nome: string | null
          status: string
          tags: string[]
          telefone: string
          ultima_mensagem: string | null
          ultima_mensagem_em: string | null
          updated_at: string
        }
        Insert: {
          app_context?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          modo?: string
          nao_lidas?: number
          nome?: string | null
          status?: string
          tags?: string[]
          telefone: string
          ultima_mensagem?: string | null
          ultima_mensagem_em?: string | null
          updated_at?: string
        }
        Update: {
          app_context?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          modo?: string
          nao_lidas?: number
          nome?: string | null
          status?: string
          tags?: string[]
          telefone?: string
          ultima_mensagem?: string | null
          ultima_mensagem_em?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_funnel_runs: {
        Row: {
          conversation_id: string
          created_at: string
          funnel_id: string
          id: string
          proximo_em: string | null
          status: string
          step_index: number
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          funnel_id: string
          id?: string
          proximo_em?: string | null
          status?: string
          step_index?: number
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          funnel_id?: string
          id?: string
          proximo_em?: string | null
          status?: string
          step_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_funnel_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_funnel_runs_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "crm_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_funnels: {
        Row: {
          app_key: string
          ativo: boolean
          created_at: string
          descricao: string | null
          gatilho_tipo: string
          gatilho_valor: string | null
          id: string
          nome: string
          steps: Json
          updated_at: string
        }
        Insert: {
          app_key?: string
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          gatilho_tipo?: string
          gatilho_valor?: string | null
          id?: string
          nome: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          app_key?: string
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          gatilho_tipo?: string
          gatilho_valor?: string | null
          id?: string
          nome?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: []
      }
      crm_messages: {
        Row: {
          autor: string
          conteudo: string
          conversation_id: string
          created_at: string
          direcao: string
          erro: string | null
          id: string
          status: string
        }
        Insert: {
          autor?: string
          conteudo: string
          conversation_id: string
          created_at?: string
          direcao: string
          erro?: string | null
          id?: string
          status?: string
        }
        Update: {
          autor?: string
          conteudo?: string
          conversation_id?: string
          created_at?: string
          direcao?: string
          erro?: string | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          cor: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cor?: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cor?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      evolution_config: {
        Row: {
          base_url: string | null
          connected: boolean
          id: number
          instance_name: string | null
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          connected?: boolean
          id?: number
          instance_name?: string | null
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          connected?: boolean
          id?: number
          instance_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exames_leituras: {
        Row: {
          created_at: string
          enviado_em: string | null
          enviado_erro: string | null
          enviado_status: string | null
          ia_erro: string | null
          ia_itens: Json
          ia_modelo: string | null
          ia_processado_em: string | null
          ia_resumo: string | null
          ia_status: string
          id: string
          lead_id: string | null
          mimetype: string
          nome_arquivo: string
          observacao_usuaria: string | null
          revisado_em: string | null
          revisado_por: string | null
          revisao_status: string
          revisao_texto: string | null
          storage_path: string
          tamanho_bytes: number | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enviado_em?: string | null
          enviado_erro?: string | null
          enviado_status?: string | null
          ia_erro?: string | null
          ia_itens?: Json
          ia_modelo?: string | null
          ia_processado_em?: string | null
          ia_resumo?: string | null
          ia_status?: string
          id?: string
          lead_id?: string | null
          mimetype: string
          nome_arquivo: string
          observacao_usuaria?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          revisao_status?: string
          revisao_texto?: string | null
          storage_path: string
          tamanho_bytes?: number | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enviado_em?: string | null
          enviado_erro?: string | null
          enviado_status?: string | null
          ia_erro?: string | null
          ia_itens?: Json
          ia_modelo?: string | null
          ia_processado_em?: string | null
          ia_resumo?: string | null
          ia_status?: string
          id?: string
          lead_id?: string | null
          mimetype?: string
          nome_arquivo?: string
          observacao_usuaria?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          revisao_status?: string
          revisao_texto?: string | null
          storage_path?: string
          tamanho_bytes?: number | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exames_leituras_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          diagnostico: Json | null
          email: string | null
          id: string
          idade: number | null
          nome: string
          origem: string | null
          respostas: Json
          status: string
          telefone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          diagnostico?: Json | null
          email?: string | null
          id?: string
          idade?: number | null
          nome: string
          origem?: string | null
          respostas?: Json
          status?: string
          telefone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          diagnostico?: Json | null
          email?: string | null
          id?: string
          idade?: number | null
          nome?: string
          origem?: string | null
          respostas?: Json
          status?: string
          telefone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          diagnostico: Json | null
          id: string
          nome: string
          perfil: string | null
          respostas: Json
          senha_temporaria: boolean
          telefone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnostico?: Json | null
          id: string
          nome: string
          perfil?: string | null
          respostas?: Json
          senha_temporaria?: boolean
          telefone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnostico?: Json | null
          id?: string
          nome?: string
          perfil?: string | null
          respostas?: Json
          senha_temporaria?: boolean
          telefone?: string
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      whatsapp_logs: {
        Row: {
          created_at: string
          erro: string | null
          id: string
          mensagem: string
          status: string
          telefone: string
        }
        Insert: {
          created_at?: string
          erro?: string | null
          id?: string
          mensagem: string
          status: string
          telefone: string
        }
        Update: {
          created_at?: string
          erro?: string | null
          id?: string
          mensagem?: string
          status?: string
          telefone?: string
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
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
