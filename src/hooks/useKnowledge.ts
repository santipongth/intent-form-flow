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
  source_type: "file" | "url";
  source_url: string | null;
  source_title: string | null;
  error_message: string | null;
  last_crawled_at: string | null;
  updated_at: string;
}

export function useKnowledgeFiles(agentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["knowledge_files", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_files")
        .select("*")
        .eq("agent_id", agentId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as KnowledgeFile[];
    },
    enabled: !!user && !!agentId,
  });
}

export function useAddKnowledgeUrl() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ url, agentId }: { url: string; agentId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const normalized = new URL(url.trim());
      if (!['http:', 'https:'].includes(normalized.protocol)) throw new Error("รองรับเฉพาะ URL แบบ http หรือ https");
      normalized.hash = "";
      const sourceUrl = normalized.toString();
      const { data: record, error } = await supabase.from("knowledge_files").insert({
        agent_id: agentId, user_id: user.id, file_name: normalized.hostname,
        file_path: `url:${crypto.randomUUID()}`, file_size: 0, file_type: "text/html",
        status: "processing", source_type: "url", source_url: sourceUrl,
      }).select("id").single();
      if (error) throw error;
      const { error: ingestError } = await supabase.functions.invoke("ingest-url", { body: { knowledge_file_id: record.id } });
      if (ingestError) throw ingestError;
      return record;
    },
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["knowledge_files", agentId] });
      toast.success("อ่านข้อมูลจาก URL สำเร็จ");
    },
    onError: (err: Error) => toast.error("อ่าน URL ไม่สำเร็จ", { description: err.message }),
  });
}

export function useRefreshKnowledgeUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; agentId: string }) => {
      const { error } = await supabase.functions.invoke("ingest-url", { body: { knowledge_file_id: id } });
      if (error) throw error;
    },
    onSuccess: (_, { agentId }) => qc.invalidateQueries({ queryKey: ["knowledge_files", agentId] }),
    onError: (err: Error) => toast.error("อัปเดต URL ไม่สำเร็จ", { description: err.message }),
  });
}

/** Re-run text extraction + indexing for an uploaded file (e.g. after a failure). */
export function useReprocessKnowledgeFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string; agentId: string }) => {
      const { error } = await supabase
        .from("knowledge_files")
        .update({ status: "processing", error_message: null })
        .eq("id", id);
      if (error) throw error;
      const { error: fnError } = await supabase.functions.invoke("extract-text", {
        body: { file_path: filePath, knowledge_file_id: id },
      });
      if (fnError) throw fnError;
    },
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["knowledge_files", agentId] });
      toast.success("ประมวลผลไฟล์ใหม่สำเร็จ");
    },
    onError: (err: Error) => toast.error("ประมวลผลไฟล์ไม่สำเร็จ", { description: err.message }),
  });
}



export function useUploadKnowledgeFile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, agentId }: { file: File; agentId: string }) => {
      if (!user) throw new Error("Not authenticated");

      const safeName = encodeURIComponent(file.name).replace(/%/g, "_");
      const filePath = `${user.id}/${agentId}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("knowledge-files")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: record, error: insertError } = await supabase
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
    mutationFn: async ({ id, filePath, sourceType = "file" }: { id: string; filePath: string; sourceType?: "file" | "url" }) => {
      if (sourceType === "file") await supabase.storage.from("knowledge-files").remove([filePath]);
      const { error } = await supabase.from("knowledge_files").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["knowledge_files"] });
      toast.success("File deleted");
    },
  });
}
