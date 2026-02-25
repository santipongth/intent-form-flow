import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AgentFeedbackStats {
  agentId: string;
  agentName: string;
  thumbsUp: number;
  thumbsDown: number;
  total: number;
  satisfactionRate: number;
}

export function useFeedbackAnalytics(days = 7) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["feedback_analytics", user?.id, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Get feedback with message -> conversation -> agent chain
      const { data: feedback, error } = await (supabase as any)
        .from("message_feedback")
        .select(`
          id,
          rating,
          created_at,
          message_id
        `)
        .gte("created_at", since.toISOString())
        .eq("user_id", user!.id);

      if (error) throw error;
      if (!feedback || feedback.length === 0) return { byAgent: [], totals: { up: 0, down: 0, total: 0, rate: 0 } };

      // Get message IDs to find their conversations
      const messageIds = [...new Set(feedback.map((f: any) => f.message_id))];
      const { data: messages } = await (supabase as any)
        .from("chat_messages")
        .select("id, conversation_id")
        .in("id", messageIds);

      const msgToConv: Record<string, string> = {};
      for (const m of messages || []) {
        msgToConv[m.id] = m.conversation_id;
      }

      // Get conversation -> agent mapping
      const convIds = [...new Set(Object.values(msgToConv))];
      const { data: conversations } = await (supabase as any)
        .from("conversations")
        .select("id, agent_id")
        .in("id", convIds);

      const convToAgent: Record<string, string> = {};
      for (const c of conversations || []) {
        convToAgent[c.id] = c.agent_id || "unknown";
      }

      // Aggregate by agent
      const agentStats: Record<string, { up: number; down: number }> = {};
      let totalUp = 0, totalDown = 0;

      for (const fb of feedback) {
        const convId = msgToConv[fb.message_id];
        const agentId = convId ? convToAgent[convId] || "unknown" : "unknown";
        if (!agentStats[agentId]) agentStats[agentId] = { up: 0, down: 0 };
        if (fb.rating === "up") { agentStats[agentId].up++; totalUp++; }
        else { agentStats[agentId].down++; totalDown++; }
      }

      const total = totalUp + totalDown;

      return {
        byAgent: Object.entries(agentStats).map(([agentId, s]) => ({
          agentId,
          thumbsUp: s.up,
          thumbsDown: s.down,
          total: s.up + s.down,
          satisfactionRate: s.up + s.down > 0 ? +((s.up / (s.up + s.down)) * 100).toFixed(1) : 0,
        })),
        totals: { up: totalUp, down: totalDown, total, rate: total > 0 ? +((totalUp / total) * 100).toFixed(1) : 0 },
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
