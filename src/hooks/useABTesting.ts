import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ABTest {
  id: string;
  user_id: string;
  agent_a_id: string;
  agent_b_id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useABTests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ab_tests", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_ab_tests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ABTest[];
    },
    enabled: !!user,
  });
}

export function useABTest(id?: string) {
  return useQuery({
    queryKey: ["ab_test", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_ab_tests")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as ABTest;
    },
    enabled: !!id,
  });
}

export function useCreateABTest() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, agentAId, agentBId }: { name: string; agentAId: string; agentBId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("agent_ab_tests")
        .insert({
          user_id: user.id,
          name,
          agent_a_id: agentAId,
          agent_b_id: agentBId,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ABTest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ab_tests"] });
      toast.success("A/B Test created!");
    },
    onError: (err: Error) => {
      toast.error("Failed to create test", { description: err.message });
    },
  });
}
