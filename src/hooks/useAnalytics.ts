import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAnalyticsEvents(agentId?: string, days = 7) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analytics_events", user?.id, agentId, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      let q = (supabase as any)
        .from("agent_analytics_events")
        .select("*")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      if (agentId) q = q.eq("agent_id", agentId);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
