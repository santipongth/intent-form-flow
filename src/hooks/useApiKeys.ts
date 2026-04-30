import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ApiKeyRow {
  id: string;
  agent_id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export function useApiKeys(agentId?: string) {
  return useQuery({
    queryKey: ["api_keys", agentId],
    queryFn: async () => {
      if (!agentId) return [];
      const { data, error } = await supabase
        .from("agent_api_keys")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ApiKeyRow[];
    },
    enabled: !!agentId,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ agent_id, name }: { agent_id: string; name?: string }) => {
      const { data, error } = await supabase.functions.invoke("issue-api-key", {
        body: { agent_id, name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { key: string; key_prefix: string; id: string; name: string };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["api_keys", vars.agent_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; agent_id: string }) => {
      const { error } = await supabase
        .from("agent_api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["api_keys", vars.agent_id] });
      toast.success("API key revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}