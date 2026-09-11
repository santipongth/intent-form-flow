import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

type MemoryStat = {
  conversations: number;
  messages: number;
  summaries: number;
  lastActive: string | null;
};

export function MemoryCard({ agentId, memoryEnabled }: { agentId: string; memoryEnabled: boolean }) {
  const { t } = useLanguage();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["agent-memory", agentId],
    queryFn: async (): Promise<MemoryStat> => {
      const { data: convs, error } = await supabase
        .from("conversations")
        .select("id, memory_summary, updated_at")
        .eq("agent_id", agentId);
      if (error) throw error;
      const ids = (convs ?? []).map((c) => c.id);
      let messages = 0;
      if (ids.length > 0) {
        const { count } = await supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", ids);
        messages = count ?? 0;
      }
      const lastActive = (convs ?? [])
        .map((c) => c.updated_at as string)
        .sort()
        .pop() ?? null;
      return {
        conversations: ids.length,
        messages,
        summaries: (convs ?? []).filter((c) => !!c.memory_summary).length,
        lastActive,
      };
    },
  });

  const clearAll = async () => {
    if (!confirm(t("memory.confirmClear"))) return;
    const { data: convs } = await supabase.from("conversations").select("id").eq("agent_id", agentId);
    const ids = (convs ?? []).map((c) => c.id);
    if (ids.length > 0) {
      await supabase.from("chat_messages").delete().in("conversation_id", ids);
      await supabase
        .from("conversations")
        .update({ memory_summary: null, summary_message_count: 0 })
        .in("id", ids);
    }
    qc.invalidateQueries({ queryKey: ["agent-memory", agentId] });
    toast.success(t("memory.cleared"));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" /> {t("memory.title")}
            </CardTitle>
            <CardDescription>{t("memory.description")}</CardDescription>
          </div>
          <Badge variant={memoryEnabled ? "secondary" : "outline"}>
            {memoryEnabled ? t("memory.on") : t("memory.off")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-semibold">{data?.conversations ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t("memory.conversations")}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-semibold">{data?.messages ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t("memory.messages")}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-semibold">{data?.summaries ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t("memory.summaries")}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("memory.hint")}</p>
        <Button variant="outline" size="sm" onClick={clearAll}>
          <Trash2 className="h-4 w-4 mr-1 text-destructive" /> {t("memory.clear")}
        </Button>
      </CardContent>
    </Card>
  );
}
