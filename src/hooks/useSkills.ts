import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getSkills } from "@/lib/agentTools";

export type Skill = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  created_at: string;
  updated_at: string;
};

export function useSkills() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["skills", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Skill[];
    },
    enabled: !!user,
  });
}

export type SkillUsage = Record<string, string[]>;

/** Maps lowercase skill name -> names of agents currently using it. */
export function useSkillUsage() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["skill-usage", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("name, tools")
        .eq("user_id", user!.id);
      if (error) throw error;
      const map: SkillUsage = {};
      for (const a of data ?? []) {
        for (const s of getSkills((a as any).tools)) {
          const key = s.toLowerCase();
          (map[key] ??= []).push((a as any).name);
        }
      }
      return map;
    },
    enabled: !!user,
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; instructions?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("skills")
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          instructions: input.instructions?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Skill;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name: string; description?: string; instructions?: string }) => {
      const { error } = await supabase
        .from("skills")
        .update({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          instructions: input.instructions?.trim() || null,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }),
  });
}
