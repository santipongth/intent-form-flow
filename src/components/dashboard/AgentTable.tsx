import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AgentRow } from "@/hooks/useAgents";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  agents: AgentRow[];
  knowledgeStats?: Record<string, { count: number; totalSize: number }>;
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onDelete: (id: string) => void;
}

export default function AgentTable({ agents, knowledgeStats, selected, onToggle, onToggleAll, onDelete }: Props) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const allChecked = agents.length > 0 && selected.length === agents.length;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allChecked} onCheckedChange={(c) => onToggleAll(!!c)} aria-label={t("common.all")} />
            </TableHead>
            <TableHead>{t("dashboard.colName")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("dashboard.colStatus")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("dashboard.colModel")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("dashboard.colKnowledge")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("dashboard.colUpdated")}</TableHead>
            <TableHead className="w-24 text-right">{t("dashboard.colActions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => {
            const ks = knowledgeStats?.[agent.id];
            return (
              <TableRow key={agent.id} className="cursor-pointer" onClick={() => navigate(`/agents/${agent.id}`)}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.includes(agent.id)} onCheckedChange={() => onToggle(agent.id)} aria-label={agent.name} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{agent.avatar || "🤖"}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[220px]">{agent.objective}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={agent.status === "published" ? "default" : "secondary"} className="rounded-full text-xs">
                    {agent.status === "published" ? t("dashboard.published") : t("dashboard.draft")}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{agent.model || "-"}</TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {ks ? `${ks.count} · ${formatSize(ks.totalSize)}` : "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                  {new Date(agent.updated_at || agent.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("dashboard.viewDetail")} onClick={() => navigate(`/agents/${agent.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("dashboard.editAgent")} onClick={() => navigate(`/agents/${agent.id}?tab=edit`)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={t("dashboard.deleteAgent")} onClick={() => onDelete(agent.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
