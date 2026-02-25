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

export function useABTestVotes(testId?: string) {
  return useQuery({
    queryKey: ["ab_test_votes", testId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ab_test_votes")
        .select("winner")
        .eq("test_id", testId!);
      if (error) throw error;
      const votes = { a: 0, b: 0, tie: 0 };
      for (const row of data || []) {
        if (row.winner === "a") votes.a++;
        else if (row.winner === "b") votes.b++;
        else if (row.winner === "tie") votes.tie++;
      }
      return votes;
    },
    enabled: !!testId,
  });
}

export function useCastVote() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ testId, winner }: { testId: string; winner: "a" | "b" | "tie" }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await (supabase as any)
        .from("ab_test_votes")
        .insert({ test_id: testId, user_id: user.id, winner });
      if (error) throw error;
    },
    onSuccess: (_: unknown, vars: { testId: string; winner: string }) => {
      qc.invalidateQueries({ queryKey: ["ab_test_votes", vars.testId] });
      toast.success("Vote recorded!");
    },
    onError: (err: Error) => {
      toast.error("Failed to record vote", { description: err.message });
    },
  });
}

export interface ABTestVoteSummary {
  test_id: string;
  a: number;
  b: number;
  tie: number;
}

export function useAllABTestVotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["all_ab_test_votes", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ab_test_votes")
        .select("test_id, winner");
      if (error) throw error;
      const map: Record<string, ABTestVoteSummary> = {};
      for (const row of data || []) {
        if (!map[row.test_id]) map[row.test_id] = { test_id: row.test_id, a: 0, b: 0, tie: 0 };
        if (row.winner === "a") map[row.test_id].a++;
        else if (row.winner === "b") map[row.test_id].b++;
        else if (row.winner === "tie") map[row.test_id].tie++;
      }
      return Object.values(map);
    },
    enabled: !!user,
  });
}

export function useDeleteABTest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("agent_ab_tests")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ab_tests"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to delete test", { description: err.message });
    },
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
