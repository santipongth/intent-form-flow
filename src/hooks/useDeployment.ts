import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Deployment {
  id: string;
  agent_id: string;
  user_id: string;
  deploy_type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  api_key: string;
  created_at: string;
  updated_at: string;
}

export function useDeployments(agentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["deployments", agentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_deployments")
        .select("*")
        .eq("agent_id", agentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Deployment[];
    },
    enabled: !!user && !!agentId,
  });
}

export function useCreateDeployment() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ agentId, deployType, config }: { agentId: string; deployType: string; config?: Record<string, unknown> }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("agent_deployments")
        .insert({
          agent_id: agentId,
          user_id: user.id,
          deploy_type: deployType,
          config: config || {},
        })
        .select()
        .single();
      if (error) throw error;
      return data as Deployment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deployments"] });
      toast.success("Deployment created!");
    },
  });
}
