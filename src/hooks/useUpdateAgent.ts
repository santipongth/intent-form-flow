import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AgentRow } from "./useAgents";

export function useUpdateAgent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AgentRow> & { id: string }) => {
      const { data, error } = await supabase
        .from("agents")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      qc.invalidateQueries({ queryKey: ["agent", data.id] });
      toast.success("อัปเดต Agent สำเร็จ!");
    },
    onError: (err: Error) => {
      toast.error("อัปเดต Agent ไม่สำเร็จ", { description: err.message });
    },
  });
}
