import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_ACTIVITY } from "@/data/mockData";
import { Plus, Bot, MessageCircle, Zap, MoreVertical, Pencil, Trash2, Rocket, Eye, FileText, HardDrive, Search, X, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgents, useDeleteAgent } from "@/hooks/useAgents";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const activityIcons: Record<string, string> = {
  created: "🆕",
  edited: "✏️",
  message: "💬",
  published: "🚀",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: agents, isLoading } = useAgents();
  const deleteAgent = useDeleteAgent();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  // Fetch knowledge stats per agent
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

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "";
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

  const agentCount = agents?.length ?? 0;
  const stats = [
    { label: t("dashboard.totalAgents"), value: String(agentCount), icon: Bot, color: "text-primary", bg: "bg-secondary" },
    { label: t("dashboard.messagestoday"), value: "0", icon: MessageCircle, color: "text-brand-green", bg: "bg-brand-green/10" },
    { label: t("dashboard.tokensUsed"), value: "0", icon: Zap, color: "text-brand-orange", bg: "bg-brand-orange/10" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
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

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="rounded-2xl hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold font-display">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agent Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">{t("dashboard.yourAgents")}</h2>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setModelFilter("all"); setSortBy("newest"); }}>
                <X className="h-3 w-3" /> {t("dashboard.clearFilters")}
              </Button>
            )}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("dashboard.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36 rounded-xl">
                <SelectValue placeholder={t("dashboard.filterStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="published">{t("dashboard.statusPublished")}</SelectItem>
                <SelectItem value="draft">{t("dashboard.statusDraft")}</SelectItem>
              </SelectContent>
            </Select>
            {availableModels.length > 0 && (
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="w-full sm:w-44 rounded-xl">
                  <SelectValue placeholder={t("dashboard.filterModel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {availableModels.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-44 rounded-xl">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                <SelectValue placeholder={t("dashboard.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("dashboard.sortNewest")}</SelectItem>
                <SelectItem value="oldest">{t("dashboard.sortOldest")}</SelectItem>
                <SelectItem value="name_asc">{t("dashboard.sortNameAZ")}</SelectItem>
                <SelectItem value="name_desc">{t("dashboard.sortNameZA")}</SelectItem>
                <SelectItem value="status">{t("dashboard.sortStatus")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                <motion.div key={agent.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                  <Card className="rounded-2xl hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer" onClick={() => navigate(`/agents/${agent.id}`)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">
                            {agent.avatar}
                          </div>
                          <div>
                            <h3 className="font-semibold">{agent.name}</h3>
                            <p className="text-xs text-muted-foreground">{agent.objective}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/agents/${agent.id}`); }}>
                              <Eye className="h-4 w-4 mr-2" /> {t("dashboard.viewDetail")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/agents/${agent.id}?tab=edit`); }}>
                              <Pencil className="h-4 w-4 mr-2" /> {t("dashboard.editAgent")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/agents/${agent.id}?tab=deploy`); }}>
                              <Rocket className="h-4 w-4 mr-2" /> {t("dashboard.deploy")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate("/chat"); }}>
                              <MessageCircle className="h-4 w-4 mr-2" /> {t("dashboard.chat")}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteAgent.mutate(agent.id); }}>
                              <Trash2 className="h-4 w-4 mr-2" /> {t("dashboard.deleteAgent")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <span>{agent.model || t("dashboard.notSpecified")}</span>
                        <span>·</span>
                        <span>{agent.provider || ""}</span>
                      </div>
                      {/* Knowledge storage info */}
                      {(() => {
                        const ks = knowledgeStats?.[agent.id];
                        if (!ks || ks.count === 0) return null;
                        const pct = Math.min((ks.totalSize / MAX_TOTAL_SIZE) * 100, 100);
                        return (
                          <div className="mb-3 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              <span>{ks.count}/{MAX_FILES} {t("knowledge.fileCount")}</span>
                              <span>·</span>
                              <HardDrive className="h-3 w-3" />
                              <span>{formatSize(ks.totalSize)}</span>
                            </div>
                            <Progress value={pct} className={`h-1 rounded-full ${pct > 80 ? "[&>div]:bg-destructive" : ""}`} />
                          </div>
                        );
                      })()}
                      <div className="flex items-center justify-between">
                        <Badge variant={agent.status === "published" ? "default" : "secondary"} className="rounded-full text-xs">
                          {agent.status === "published" ? "🟢 Published" : "📝 Draft"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{new Date(agent.created_at).toLocaleDateString("th-TH")}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
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
                  <Button variant="outline" className="mt-4 rounded-xl gap-2" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setModelFilter("all"); setSortBy("newest"); }}>
                    <X className="h-4 w-4" /> {t("dashboard.clearFilters")}
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

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-lg">{t("dashboard.recentActivity")}</h2>
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              {MOCK_ACTIVITY.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                  <span className="text-lg mt-0.5">{activityIcons[a.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{a.agentName}</span>{" "}
                      <span className="text-muted-foreground">{a.description}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.timestamp}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
