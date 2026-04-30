import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ErrorLogRow {
  id: string;
  user_id: string | null;
  agent_id: string | null;
  source: string;
  level: string;
  message: string;
  context: Record<string, unknown>;
  created_at: string;
}

export function useErrorLogs(agentId?: string, limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["error_logs", user?.id, agentId, limit],
    queryFn: async () => {
      let q = supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (agentId) q = q.eq("agent_id", agentId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ErrorLogRow[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}