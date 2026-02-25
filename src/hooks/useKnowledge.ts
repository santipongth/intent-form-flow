import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KnowledgeFile {
  id: string;
  agent_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  status: string;
  created_at: string;
}

export function useKnowledgeFiles(agentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["knowledge_files", agentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("knowledge_files")
        .select("*")
        .eq("agent_id", agentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as KnowledgeFile[];
    },
    enabled: !!user && !!agentId,
  });
}

export function useDeleteKnowledgeFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("knowledge_files").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["knowledge_files"] });
      toast.success("File deleted");
    },
  });
}
