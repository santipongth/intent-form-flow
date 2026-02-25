import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_LOGS, MOCK_AGENTS } from "@/data/mockData";
import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const statusColors: Record<string, string> = {
  success: "bg-brand-green/10 text-brand-green",
  processing: "bg-brand-orange/10 text-brand-orange",
  error: "bg-destructive/10 text-destructive",
};

export default function Monitor() {
  const [filterAgent, setFilterAgent] = useState("all");
  const { t } = useLanguage();

  const filtered = filterAgent === "all"
    ? MOCK_LOGS
    : MOCK_LOGS.filter((l) => l.agentId === filterAgent);

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
            {MOCK_AGENTS.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.avatar} {a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {filtered.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative pl-14">
              <div className="absolute left-4 top-4 w-4 h-4 rounded-full bg-background border-2 border-primary z-10" />
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{log.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.detail}</p>
                    </div>
                    <Badge className={`rounded-full text-xs ${statusColors[log.status]}`}>
                      {log.status === "success" ? "✅" : log.status === "processing" ? "⏳" : "❌"} {log.duration}ms
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{log.agentName}</span>
                    <span>·</span>
                    <span>{log.timestamp}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
