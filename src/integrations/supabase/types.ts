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
      ab_test_votes: {
        Row: {
          created_at: string | null
          id: string
          test_id: string
          user_id: string
          winner: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          test_id: string
          user_id: string
          winner: string
        }
        Update: {
          created_at?: string | null
          id?: string
          test_id?: string
          user_id?: string
          winner?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_votes_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "agent_ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_ab_tests: {
        Row: {
          agent_a_id: string
          agent_b_id: string
          created_at: string | null
          id: string
          name: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_a_id: string
          agent_b_id: string
          created_at?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_a_id?: string
          agent_b_id?: string
          created_at?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_ab_tests_agent_a_id_fkey"
            columns: ["agent_a_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_ab_tests_agent_b_id_fkey"
            columns: ["agent_b_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_analytics_events: {
        Row: {
          agent_id: string | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          response_time_ms: number | null
          status: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_analytics_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_api_keys: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_budgets: {
        Row: {
          agent_id: string
          created_at: string
          daily_message_limit: number | null
          daily_token_limit: number | null
          enabled: boolean
          id: string
          monthly_message_limit: number | null
          monthly_token_limit: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          daily_message_limit?: number | null
          daily_token_limit?: number | null
          enabled?: boolean
          id?: string
          monthly_message_limit?: number | null
          monthly_token_limit?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          daily_message_limit?: number | null
          daily_token_limit?: number | null
          enabled?: boolean
          id?: string
          monthly_message_limit?: number | null
          monthly_token_limit?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_budgets_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_custom_tools: {
        Row: {
          agent_id: string
          auth_header_name: string | null
          auth_secret: string | null
          auth_type: string
          created_at: string
          description: string
          enabled: boolean
          headers: Json
          id: string
          last_test_status: string | null
          last_tested_at: string | null
          method: string
          name: string
          parameters: Json
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          agent_id: string
          auth_header_name?: string | null
          auth_secret?: string | null
          auth_type?: string
          created_at?: string
          description?: string
          enabled?: boolean
          headers?: Json
          id?: string
          last_test_status?: string | null
          last_tested_at?: string | null
          method?: string
          name: string
          parameters?: Json
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          agent_id?: string
          auth_header_name?: string | null
          auth_secret?: string | null
          auth_type?: string
          created_at?: string
          description?: string
          enabled?: boolean
          headers?: Json
          id?: string
          last_test_status?: string | null
          last_tested_at?: string | null
          method?: string
          name?: string
          parameters?: Json
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_custom_tools_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_guardrails: {
        Row: {
          agent_id: string
          ai_review: boolean
          blocked_keywords: string[]
          blocked_message: string
          created_at: string
          enabled: boolean
          id: string
          injection_detection: boolean
          pii_redaction: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          ai_review?: boolean
          blocked_keywords?: string[]
          blocked_message?: string
          created_at?: string
          enabled?: boolean
          id?: string
          injection_detection?: boolean
          pii_redaction?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          ai_review?: boolean
          blocked_keywords?: string[]
          blocked_message?: string
          created_at?: string
          enabled?: boolean
          id?: string
          injection_detection?: boolean
          pii_redaction?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_guardrails_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_mcp_servers: {
        Row: {
          agent_id: string
          allowed_tools: string[]
          auth_header_name: string | null
          auth_secret: string | null
          auth_type: string
          cached_tools: Json
          created_at: string
          enabled: boolean
          id: string
          last_error: string | null
          last_status: string | null
          last_synced_at: string | null
          name: string
          transport: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          agent_id: string
          allowed_tools?: string[]
          auth_header_name?: string | null
          auth_secret?: string | null
          auth_type?: string
          cached_tools?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          name: string
          transport?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          agent_id?: string
          allowed_tools?: string[]
          auth_header_name?: string | null
          auth_secret?: string | null
          auth_type?: string
          cached_tools?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          name?: string
          transport?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_mcp_servers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_traces: {
        Row: {
          agent_id: string | null
          conversation_id: string | null
          created_at: string
          duration_ms: number | null
          id: string
          input: Json | null
          name: string
          output: Json | null
          run_id: string
          source: string
          span_type: string
          status: string
          step_index: number
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          input?: Json | null
          name: string
          output?: Json | null
          run_id: string
          source?: string
          span_type: string
          status?: string
          step_index?: number
          user_id: string
        }
        Update: {
          agent_id?: string | null
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          input?: Json | null
          name?: string
          output?: Json | null
          run_id?: string
          source?: string
          span_type?: string
          status?: string
          step_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_traces_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_usage_counters: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          messages: number
          period_start: string
          period_type: string
          tokens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          messages?: number
          period_start: string
          period_type: string
          tokens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          messages?: number
          period_start?: string
          period_type?: string
          tokens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_usage_counters_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_webhooks: {
        Row: {
          agent_id: string
          created_at: string
          enabled: boolean
          events: string[]
          id: string
          last_status: string | null
          last_triggered_at: string | null
          secret: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          enabled?: boolean
          events?: string[]
          id?: string
          last_status?: string | null
          last_triggered_at?: string | null
          secret?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          enabled?: boolean
          events?: string[]
          id?: string
          last_status?: string | null
          last_triggered_at?: string | null
          secret?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          avatar: string | null
          created_at: string | null
          id: string
          knowledge_urls: string[] | null
          max_tokens: number | null
          memory_enabled: boolean | null
          model: string | null
          name: string
          objective: string | null
          output_style: string | null
          provider: string | null
          status: string | null
          system_prompt: string | null
          temperature: number | null
          template: string | null
          tools: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          id?: string
          knowledge_urls?: string[] | null
          max_tokens?: number | null
          memory_enabled?: boolean | null
          model?: string | null
          name: string
          objective?: string | null
          output_style?: string | null
          provider?: string | null
          status?: string | null
          system_prompt?: string | null
          temperature?: number | null
          template?: string | null
          tools?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          id?: string
          knowledge_urls?: string[] | null
          max_tokens?: number | null
          memory_enabled?: boolean | null
          model?: string | null
          name?: string
          objective?: string | null
          output_style?: string | null
          provider?: string | null
          status?: string | null
          system_prompt?: string | null
          temperature?: number | null
          template?: string | null
          tools?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_key_usage: {
        Row: {
          api_key_id: string
          count: number
          created_at: string
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          api_key_id: string
          count?: number
          created_at?: string
          id?: string
          user_id: string
          window_start: string
        }
        Update: {
          api_key_id?: string
          count?: number
          created_at?: string
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          response_time_ms: number | null
          role: string
          tokens_used: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          response_time_ms?: number | null
          role: string
          tokens_used?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          response_time_ms?: number | null
          role?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string | null
          created_at: string | null
          external_session_id: string | null
          id: string
          memory_summary: string | null
          summary_message_count: number
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          external_session_id?: string | null
          id?: string
          memory_summary?: string | null
          summary_message_count?: number
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          external_session_id?: string | null
          id?: string
          memory_summary?: string | null
          summary_message_count?: number
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          agent_id: string | null
          context: Json | null
          created_at: string
          id: string
          level: string
          message: string
          source: string
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message: string
          source: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          agent_id: string
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          file_id: string
          file_name: string
          id: string
          user_id: string
        }
        Insert: {
          agent_id: string
          chunk_index?: number
          content: string
          created_at?: string
          embedding?: string | null
          file_id: string
          file_name: string
          id?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          file_id?: string
          file_name?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "knowledge_files"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_files: {
        Row: {
          agent_id: string
          content: string | null
          created_at: string
          error_message: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          last_crawled_at: string | null
          source_title: string | null
          source_type: string
          source_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          content?: string | null
          created_at?: string
          error_message?: string | null
          file_name: string
          file_path: string
          file_size?: number
          file_type?: string
          id?: string
          last_crawled_at?: string | null
          source_title?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          content?: string | null
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          last_crawled_at?: string | null
          source_title?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_files_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      message_feedback: {
        Row: {
          created_at: string
          id: string
          message_id: string
          rating: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          rating: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          rating?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instructions: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      template_stats: {
        Row: {
          clone_count: number
          created_at: string
          template_id: string
          updated_at: string
        }
        Insert: {
          clone_count?: number
          created_at?: string
          template_id: string
          updated_at?: string
        }
        Update: {
          clone_count?: number
          created_at?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_platform_stats: { Args: never; Returns: Json }
      increment_agent_usage: {
        Args: {
          _agent_id: string
          _messages: number
          _tokens: number
          _user_id: string
        }
        Returns: undefined
      }
      increment_api_key_usage: {
        Args: { _api_key_id: string; _user_id: string; _window: string }
        Returns: number
      }
      increment_template_clone: {
        Args: { _template_id: string }
        Returns: number
      }
      match_knowledge_chunks: {
        Args: {
          _agent_id: string
          _match_count?: number
          _query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          file_id: string
          file_name: string
          id: string
          similarity: number
          source_url: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
