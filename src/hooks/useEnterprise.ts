import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ---------------- Custom tools (user-owned external APIs) ----------------
export type CustomToolParam = {
  name: string;
  type: "string" | "number" | "boolean";
  description?: string;
  required?: boolean;
  location?: "query" | "body";
};

export type CustomTool = {
  id: string;
  agent_id: string;
  user_id: string;
  name: string;
  description: string;
  method: string;
  url: string;
  parameters: CustomToolParam[];
  auth_type: "none" | "header" | "bearer";
  auth_header_name: string | null;
  enabled: boolean;
  last_tested_at: string | null;
  last_test_status: string | null;
};

export const MAX_CUSTOM_TOOLS = 10;

export function useCustomTools(agentId?: string) {
  return useQuery({
    queryKey: ["custom-tools", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_custom_tools")
        // auth_secret is intentionally never selected into the browser
        .select("id, agent_id, user_id, name, description, method, url, parameters, auth_type, auth_header_name, enabled, last_tested_at, last_test_status")
        .eq("agent_id", agentId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((t: any) => ({
        ...t,
        parameters: Array.isArray(t.parameters) ? t.parameters : [],
      })) as CustomTool[];
    },
    enabled: !!agentId,
  });
}

export type CustomToolInput = {
  id?: string;
  name: string;
  description: string;
  method: string;
  url: string;
  parameters: CustomToolParam[];
  auth_type: "none" | "header" | "bearer";
  auth_header_name?: string | null;
  auth_secret?: string | null;
  enabled: boolean;
};

export function useSaveCustomTool(agentId?: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CustomToolInput) => {
      if (!user || !agentId) throw new Error("Not authenticated");
      const payload: any = {
        agent_id: agentId,
        user_id: user.id,
        name: input.name.trim(),
        description: input.description.trim(),
        method: input.method,
        url: input.url.trim(),
        parameters: input.parameters as any,
        auth_type: input.auth_type,
        auth_header_name: input.auth_type === "header" ? (input.auth_header_name || "x-api-key") : null,
        enabled: input.enabled,
      };
      // Only overwrite the stored secret when the user typed a new one.
      if (input.auth_secret) payload.auth_secret = input.auth_secret;
      if (input.auth_type === "none") payload.auth_secret = null;

      if (input.id) {
        const { error } = await supabase.from("agent_custom_tools").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agent_custom_tools").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-tools", agentId] }),
  });
}

export function useDeleteCustomTool(agentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agent_custom_tools").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-tools", agentId] }),
  });
}

export function useTestCustomTool() {
  return useMutation({
    mutationFn: async (input: { toolId: string; args: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke("test-custom-tool", {
        body: { tool_id: input.toolId, arguments: input.args },
      });
      if (error) throw error;
      return data as { ok: boolean; status: number | null; duration_ms: number; error: string | null; body: string };
    },
  });
}

// ---------------- Guardrails ----------------
export type Guardrails = {
  id?: string;
  agent_id: string;
  enabled: boolean;
  blocked_keywords: string[];
  pii_redaction: boolean;
  injection_detection: boolean;
  ai_review: boolean;
  blocked_message: string;
};

export const DEFAULT_GUARDRAILS = (agentId: string): Guardrails => ({
  agent_id: agentId,
  enabled: false,
  blocked_keywords: [],
  pii_redaction: true,
  injection_detection: true,
  ai_review: false,
  blocked_message: "ขออภัย ไม่สามารถตอบคำถามนี้ได้",
});

export function useGuardrails(agentId?: string) {
  return useQuery({
    queryKey: ["guardrails", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_guardrails")
        .select("*")
        .eq("agent_id", agentId!)
        .maybeSingle();
      if (error) throw error;
      return (data as Guardrails | null) ?? DEFAULT_GUARDRAILS(agentId!);
    },
    enabled: !!agentId,
  });
}

export function useSaveGuardrails(agentId?: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Guardrails) => {
      if (!user || !agentId) throw new Error("Not authenticated");
      const { error } = await supabase.from("agent_guardrails").upsert({
        agent_id: agentId,
        user_id: user.id,
        enabled: input.enabled,
        blocked_keywords: input.blocked_keywords,
        pii_redaction: input.pii_redaction,
        injection_detection: input.injection_detection,
        ai_review: input.ai_review,
        blocked_message: input.blocked_message.trim() || "ขออภัย ไม่สามารถตอบคำถามนี้ได้",
      }, { onConflict: "agent_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guardrails", agentId] }),
  });
}

// ---------------- Budgets + usage ----------------
export type AgentBudget = {
  agent_id: string;
  enabled: boolean;
  daily_token_limit: number | null;
  monthly_token_limit: number | null;
  daily_message_limit: number | null;
  monthly_message_limit: number | null;
};

export type AgentUsage = {
  dayTokens: number;
  dayMessages: number;
  monthTokens: number;
  monthMessages: number;
};

export const DEFAULT_BUDGET = (agentId: string): AgentBudget => ({
  agent_id: agentId,
  enabled: false,
  daily_token_limit: null,
  monthly_token_limit: null,
  daily_message_limit: null,
  monthly_message_limit: null,
});

/** Current Bangkok day/month period keys, matching the backend. */
function bangkokPeriods() {
  const bkk = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const y = bkk.getUTCFullYear();
  const m = String(bkk.getUTCMonth() + 1).padStart(2, "0");
  const d = String(bkk.getUTCDate()).padStart(2, "0");
  return { day: `${y}-${m}-${d}`, month: `${y}-${m}-01` };
}

export function useAgentBudget(agentId?: string) {
  return useQuery({
    queryKey: ["agent-budget", agentId],
    queryFn: async () => {
      const { day, month } = bangkokPeriods();
      const [{ data: budget }, { data: rows }] = await Promise.all([
        supabase.from("agent_budgets").select("*").eq("agent_id", agentId!).maybeSingle(),
        supabase
          .from("agent_usage_counters")
          .select("period_type, period_start, tokens, messages")
          .eq("agent_id", agentId!)
          .in("period_start", [day, month]),
      ]);
      const usage: AgentUsage = { dayTokens: 0, dayMessages: 0, monthTokens: 0, monthMessages: 0 };
      for (const r of rows ?? []) {
        if (r.period_type === "day" && r.period_start === day) {
          usage.dayTokens = Number(r.tokens) || 0;
          usage.dayMessages = Number(r.messages) || 0;
        } else if (r.period_type === "month" && r.period_start === month) {
          usage.monthTokens = Number(r.tokens) || 0;
          usage.monthMessages = Number(r.messages) || 0;
        }
      }
      return { budget: (budget as AgentBudget | null) ?? DEFAULT_BUDGET(agentId!), usage };
    },
    enabled: !!agentId,
  });
}

export function useSaveBudget(agentId?: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: AgentBudget) => {
      if (!user || !agentId) throw new Error("Not authenticated");
      const { error } = await supabase.from("agent_budgets").upsert({
        agent_id: agentId,
        user_id: user.id,
        enabled: input.enabled,
        daily_token_limit: input.daily_token_limit,
        monthly_token_limit: input.monthly_token_limit,
        daily_message_limit: input.daily_message_limit,
        monthly_message_limit: input.monthly_message_limit,
      }, { onConflict: "agent_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent-budget", agentId] }),
  });
}
