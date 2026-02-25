import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AgentRow {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  objective: string | null;
  status: string;
  model: string | null;
  provider: string | null;
  template: string | null;
  output_style: string;
  system_prompt: string | null;
  temperature: number;
  max_tokens: number;
  tools: Record<string, boolean>;
  memory_enabled: boolean;
  knowledge_urls: string[];
  created_at: string;
  updated_at: string;
}

export function useAgents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AgentRow[];
    },
    enabled: !!user,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (agent: Partial<Omit<AgentRow, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("agents")
        .insert({ ...agent, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success("🚀 สร้าง Agent สำเร็จ!");
    },
    onError: (err: Error) => {
      toast.error("สร้าง Agent ไม่สำเร็จ", { description: err.message });
    },
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success("ลบ Agent สำเร็จ");
    },
    onError: (err: Error) => {
      toast.error("ลบ Agent ไม่สำเร็จ", { description: err.message });
    },
  });
}
