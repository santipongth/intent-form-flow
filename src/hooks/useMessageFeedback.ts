import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MessageFeedback {
  id: string;
  message_id: string;
  user_id: string;
  rating: "up" | "down";
  created_at: string;
}

export function useMessageFeedback(conversationId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["message_feedback", conversationId],
    queryFn: async () => {
      // Get all message IDs for this conversation, then fetch feedback
      const { data: messages } = await (supabase as any)
        .from("chat_messages")
        .select("id")
        .eq("conversation_id", conversationId!);

      if (!messages || messages.length === 0) return {} as Record<string, "up" | "down">;

      const messageIds = messages.map((m: any) => m.id);
      const { data, error } = await (supabase as any)
        .from("message_feedback")
        .select("*")
        .in("message_id", messageIds)
        .eq("user_id", user!.id);

      if (error) throw error;

      const map: Record<string, "up" | "down"> = {};
      for (const fb of data || []) {
        map[fb.message_id] = fb.rating;
      }
      return map;
    },
    enabled: !!conversationId && !!user,
  });
}

export function useSaveMessageFeedback() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      messageId,
      rating,
      currentRating,
    }: {
      messageId: string;
      rating: "up" | "down";
      currentRating?: "up" | "down";
    }) => {
      if (!user) throw new Error("Not authenticated");

      if (currentRating === rating) {
        // Toggle off - delete
        const { error } = await (supabase as any)
          .from("message_feedback")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Upsert
        const { error } = await (supabase as any)
          .from("message_feedback")
          .upsert(
            { message_id: messageId, user_id: user.id, rating },
            { onConflict: "message_id,user_id" }
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message_feedback"] });
    },
  });
}
