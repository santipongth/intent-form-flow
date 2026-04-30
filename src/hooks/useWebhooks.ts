import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WebhookRow {
  id: string;
  agent_id: string;
  user_id: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  last_triggered_at: string | null;
  last_status: string | null;
  created_at: string;
}

export function useWebhooks(agentId?: string) {
  return useQuery({
    queryKey: ["webhooks", agentId],
    queryFn: async () => {
      if (!agentId) return [];
      const { data, error } = await supabase
        .from("agent_webhooks")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WebhookRow[];
    },
    enabled: !!agentId,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ agent_id, url, events }: { agent_id: string; url: string; events?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("agent_webhooks").insert({
        agent_id, user_id: user.id, url, events: events || ["chat.completed"],
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["webhooks", vars.agent_id] });
      toast.success("Webhook created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean; agent_id: string }) => {
      const { error } = await supabase.from("agent_webhooks").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["webhooks", vars.agent_id] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; agent_id: string }) => {
      const { error } = await supabase.from("agent_webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["webhooks", vars.agent_id] });
      toast.success("Webhook deleted");
    },
  });
}