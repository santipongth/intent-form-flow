import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TraceSpanRow {
  id: string;
  run_id: string;
  agent_id: string | null;
  conversation_id: string | null;
  source: string;
  step_index: number;
  span_type: string;
  name: string;
  input: any;
  output: any;
  status: string;
  duration_ms: number;
  created_at: string;
}

export interface TraceRun {
  runId: string;
  agentId: string | null;
  source: string;
  startedAt: string;
  totalMs: number;
  hasError: boolean;
  spans: TraceSpanRow[];
}

export function useTraces(agentId?: string, limit = 200) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["agent-traces", user?.id, agentId ?? "all", limit],
    enabled: !!user?.id,
    queryFn: async (): Promise<TraceRun[]> => {
      let query = (supabase as any)
        .from("agent_traces")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (agentId) query = query.eq("agent_id", agentId);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as TraceSpanRow[];
      const byRun = new Map<string, TraceSpanRow[]>();
      for (const row of rows) {
        const list = byRun.get(row.run_id) || [];
        list.push(row);
        byRun.set(row.run_id, list);
      }

      return Array.from(byRun.entries())
        .map(([runId, spans]) => {
          spans.sort((a, b) => a.step_index - b.step_index);
          return {
            runId,
            agentId: spans[0]?.agent_id ?? null,
            source: spans[0]?.source ?? "chat",
            startedAt: spans[0]?.created_at ?? "",
            totalMs: spans.reduce((sum, s) => sum + (s.duration_ms || 0), 0),
            hasError: spans.some((s) => s.status === "error" || s.span_type === "error"),
            spans,
          };
        })
        .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    },
  });
}
