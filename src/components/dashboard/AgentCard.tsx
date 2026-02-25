import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MoreVertical, Pencil, Trash2, Rocket, Eye, MessageCircle, FileText, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AgentRow } from "@/hooks/useAgents";

const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AgentCardProps {
  agent: AgentRow;
  index: number;
  knowledgeStats?: { count: number; totalSize: number };
  onDelete: (id: string) => void;
}

export default function AgentCard({ agent, index, knowledgeStats, onDelete }: AgentCardProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const ks = knowledgeStats;
  const pct = ks ? Math.min((ks.totalSize / MAX_TOTAL_SIZE) * 100, 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.08 }}>
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
                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(agent.id); }}>
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
          {ks && ks.count > 0 && (
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
          )}
          <div className="flex items-center justify-between">
            <Badge variant={agent.status === "published" ? "default" : "secondary"} className="rounded-full text-xs">
              {agent.status === "published" ? "🟢 Published" : "📝 Draft"}
            </Badge>
            <span className="text-xs text-muted-foreground">{new Date(agent.created_at).toLocaleDateString("th-TH")}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
