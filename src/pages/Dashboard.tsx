import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bot, MessageCircle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgents, useDeleteAgent } from "@/hooks/useAgents";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import StatsRow from "@/components/dashboard/StatsRow";
import AgentFilters from "@/components/dashboard/AgentFilters";
import AgentCard from "@/components/dashboard/AgentCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: agents, isLoading } = useAgents();
  const deleteAgent = useDeleteAgent();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: knowledgeStats } = useQuery({
    queryKey: ["knowledge_stats"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("knowledge_files")
        .select("agent_id, file_size");
      if (error) throw error;
      const stats: Record<string, { count: number; totalSize: number }> = {};
      (data || []).forEach((row: { agent_id: string; file_size: number }) => {
        if (!stats[row.agent_id]) stats[row.agent_id] = { count: 0, totalSize: 0 };
        stats[row.agent_id].count++;
        stats[row.agent_id].totalSize += row.file_size || 0;
      });
      return stats;
    },
    enabled: !!user,
  });

  // Fetch today's messages count and total tokens from analytics events
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const { data: analyticsStats } = useQuery({
    queryKey: ["dashboard_analytics", todayStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_analytics_events")
        .select("event_type, tokens_used, created_at")
        .gte("created_at", todayStart);
      if (error) throw error;
      const msgs = (data || []).filter(e => e.event_type === "chat_message" || e.event_type === "message").length;
      const tokens = (data || []).reduce((sum, e) => sum + (e.tokens_used || 0), 0);
      return { messagesToday: msgs, tokensUsed: tokens };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const availableModels = useMemo(() => {
    if (!agents) return [];
    const models = new Set(agents.map(a => a.model).filter(Boolean));
    return Array.from(models) as string[];
  }, [agents]);

  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    const filtered = agents.filter(agent => {
      const matchesSearch = !searchQuery ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.objective || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
      const matchesModel = modelFilter === "all" || agent.model === modelFilter;
      return matchesSearch && matchesStatus && matchesModel;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "status": return (a.status || "").localeCompare(b.status || "");
        default: return 0;
      }
    });
  }, [agents, searchQuery, statusFilter, modelFilter, sortBy]);

  const hasActiveFilters = searchQuery || statusFilter !== "all" || modelFilter !== "all" || sortBy !== "newest";
  const clearFilters = () => { setSearchQuery(""); setStatusFilter("all"); setModelFilter("all"); setSortBy("newest"); };

  const agentCount = agents?.length ?? 0;
  const messagesToday = analyticsStats?.messagesToday ?? 0;
  const tokensUsed = analyticsStats?.tokensUsed ?? 0;
  const stats = [
    { label: t("dashboard.totalAgents"), value: String(agentCount), icon: Bot, color: "text-primary", bg: "bg-secondary" },
    { label: t("dashboard.messagestoday"), value: String(messagesToday), icon: MessageCircle, color: "text-brand-green", bg: "bg-brand-green/10" },
    { label: t("dashboard.tokensUsed"), value: tokensUsed.toLocaleString(), icon: Zap, color: "text-brand-orange", bg: "bg-brand-orange/10" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("dashboard.subtitle")}</p>
        </div>
        <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={() => navigate("/agents/new")}>
          <Plus className="h-4 w-4" />
          {t("dashboard.createNew")}
        </Button>
      </div>

      <StatsRow stats={stats} />

      <div>
        <AgentFilters
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          modelFilter={modelFilter} setModelFilter={setModelFilter}
          sortBy={sortBy} setSortBy={setSortBy}
          availableModels={availableModels}
          hasActiveFilters={!!hasActiveFilters}
          clearFilters={clearFilters}
        />

        <div className="mt-4">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="rounded-2xl">
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAgents.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredAgents.map((agent, i) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  index={i}
                  knowledgeStats={knowledgeStats?.[agent.id]}
                  onDelete={(id) => deleteAgent.mutate(id)}
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl">
              <CardContent className="p-10 text-center">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  {hasActiveFilters ? t("dashboard.noResults") : t("dashboard.noAgents")}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" className="mt-4 rounded-xl gap-2" onClick={clearFilters}>
                    <Plus className="h-4 w-4" /> {t("dashboard.clearFilters")}
                  </Button>
                ) : (
                  <Button className="mt-4 gradient-primary text-primary-foreground rounded-xl gap-2" onClick={() => navigate("/agents/new")}>
                    <Plus className="h-4 w-4" /> {t("dashboard.createAgent")}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
