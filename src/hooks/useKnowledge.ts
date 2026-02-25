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
  content: string | null;
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

export function useUploadKnowledgeFile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, agentId }: { file: File; agentId: string }) => {
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/${agentId}/${Date.now()}_${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("knowledge-files")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Insert metadata
      const { data: record, error: insertError } = await (supabase as any)
        .from("knowledge_files")
        .insert({
          agent_id: agentId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type || "text/plain",
          status: "processing",
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      // Call extract-text function (fire-and-forget)
      supabase.functions.invoke("extract-text", {
        body: { file_path: filePath, knowledge_file_id: record.id },
      }).then(() => {
        qc.invalidateQueries({ queryKey: ["knowledge_files", agentId] });
      });

      return record;
    },
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["knowledge_files", agentId] });
      toast.success("File uploaded successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Upload failed");
    },
  });
}

export function useDeleteKnowledgeFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Delete from storage
      await supabase.storage.from("knowledge-files").remove([filePath]);
      // Delete from DB
      const { error } = await (supabase as any).from("knowledge_files").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["knowledge_files"] });
      toast.success("File deleted");
    },
  });
}
