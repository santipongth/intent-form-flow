import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalyticsEvents } from "@/hooks/useAnalytics";
import { useAgents } from "@/hooks/useAgents";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTraces } from "@/hooks/useTraces";

const statusColors: Record<string, string> = {
  success: "bg-brand-green/10 text-brand-green",
  processing: "bg-brand-orange/10 text-brand-orange",
  error: "bg-destructive/10 text-destructive",
};

const statusIcon: Record<string, string> = {
  success: "✅",
  processing: "⏳",
  error: "❌",
};

export default function Monitor() {
  const [filterAgent, setFilterAgent] = useState("all");
  const { t } = useLanguage();
  const { data: events, isLoading: eventsLoading } = useAnalyticsEvents(
    filterAgent === "all" ? undefined : filterAgent,
    30
  );
  const { data: agents } = useAgents();
  const { data: runs, isLoading: tracesLoading } = useTraces(
    filterAgent === "all" ? undefined : filterAgent,
  );

  const agentMap = new Map(agents?.map(a => [a.id, a]) || []);

  const logs = (events || [])
    .slice()
    .reverse()
    .map(e => ({
      id: e.id,
      action: e.event_type,
      detail: e.metadata ? JSON.stringify(e.metadata) : "",
      status: e.status || "success",
      duration: e.response_time_ms || 0,
      agentName: agentMap.get(e.agent_id || "")?.name || "Unknown Agent",
      agentAvatar: agentMap.get(e.agent_id || "")?.avatar || "🤖",
      agentId: e.agent_id,
      timestamp: e.created_at ? format(new Date(e.created_at), "dd MMM yyyy HH:mm:ss") : "",
    }));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("monitor.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("monitor.subtitle")}</p>
        </div>
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-48 rounded-xl"><SelectValue placeholder={t("monitor.allAgents")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("monitor.allAgents")}</SelectItem>
            {(agents || []).map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.avatar} {a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="rounded-xl">
          <TabsTrigger value="activity" className="rounded-lg">{t("monitor.tabActivity")}</TabsTrigger>
          <TabsTrigger value="traces" className="rounded-lg">{t("monitor.tabTraces")}</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4 space-y-4">
        {eventsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="pl-14">
                <Card className="rounded-2xl">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-10 text-center text-muted-foreground">
              {t("monitor.noLogs") || "No activity logs yet"}
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-4">
              {logs.map((log, i) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative pl-14">
                  <div className="absolute left-4 top-4 w-4 h-4 rounded-full bg-background border-2 border-primary z-10" />
                  <Card className="rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{log.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{log.detail !== "{}" ? log.detail : ""}</p>
                        </div>
                        <Badge className={`rounded-full text-xs ${statusColors[log.status] || statusColors.success}`}>
                          {statusIcon[log.status] || "✅"} {log.duration}ms
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{log.agentAvatar} {log.agentName}</span>
                        <span>·</span>
                        <span>{log.timestamp}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        </TabsContent>

        <TabsContent value="traces" className="mt-4">
          {tracesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-2xl">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (runs || []).length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-10 text-center text-muted-foreground">
                {t("monitor.noTraces")}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(runs || []).map((run) => {
                const searchMs = run.spans
                  .filter((s) => s.span_type === "retrieval")
                  .reduce((sum, s) => sum + (s.duration_ms || 0), 0);
                const answerMs = run.spans
                  .filter((s) => s.span_type === "answer")
                  .reduce((sum, s) => sum + (s.duration_ms || 0), 0);
                return (
                <Card key={run.runId} className="rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">
                          {agentMap.get(run.agentId || "")?.avatar || "🤖"}{" "}
                          {agentMap.get(run.agentId || "")?.name || t("monitor.unknownAgent")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {run.startedAt ? format(new Date(run.startedAt), "dd MMM yyyy HH:mm:ss") : ""} · {run.source}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {searchMs > 0 && (
                          <Badge variant="secondary" className="rounded-full text-xs">
                            🔎 {t("monitor.searchMs")} {searchMs}ms
                          </Badge>
                        )}
                        {answerMs > 0 && (
                          <Badge variant="secondary" className="rounded-full text-xs">
                            💬 {t("monitor.answerMs")} {answerMs}ms
                          </Badge>
                        )}
                        <Badge className={`rounded-full text-xs ${run.hasError ? statusColors.error : statusColors.success}`}>
                          {run.hasError ? "❌" : "✅"} {run.totalMs}ms
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {run.spans.map((span) => (
                        <div key={span.id} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge variant="secondary" className="rounded-full text-[10px] shrink-0">
                                {span.span_type}
                              </Badge>
                              <span className="text-xs font-medium truncate">{span.name}</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground shrink-0">{span.duration_ms}ms</span>
                          </div>
                          {(span.input || span.output) && (
                            <pre className="mt-2 text-[11px] text-muted-foreground whitespace-pre-wrap break-words max-h-32 overflow-auto">
                              {JSON.stringify({ input: span.input, output: span.output }, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
