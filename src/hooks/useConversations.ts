import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  user_id: string;
  agent_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  tokens_used: number;
  response_time_ms: number;
  created_at: string;
}

export function useConversations(agentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id, agentId],
    queryFn: async () => {
      let q = (supabase as any)
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (agentId) q = q.eq("agent_id", agentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Conversation[];
    },
    enabled: !!user,
  });
}

export function useConversationMessages(conversationId?: string) {
  return useQuery({
    queryKey: ["chat_messages", conversationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ChatMessageRow[];
    },
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ agentId, title }: { agentId?: string; title?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("conversations")
        .insert({
          user_id: user.id,
          agent_id: agentId || null,
          title: title || "New Chat",
        })
        .select()
        .single();
      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useSaveMessage() {
  return useMutation({
    mutationFn: async (msg: {
      conversation_id: string;
      role: string;
      content: string;
      tokens_used?: number;
      response_time_ms?: number;
    }) => {
      const { data, error } = await (supabase as any)
        .from("chat_messages")
        .insert(msg)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateConversationTitle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await (supabase as any)
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      // Delete messages first, then conversation
      await (supabase as any)
        .from("chat_messages")
        .delete()
        .eq("conversation_id", conversationId);
      const { error } = await (supabase as any)
        .from("conversations")
        .delete()
        .eq("id", conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["chat_messages"] });
    },
  });
}
