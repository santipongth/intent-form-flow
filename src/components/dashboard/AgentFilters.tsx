import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, ArrowUpDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AgentFiltersProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  modelFilter: string;
  setModelFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  availableModels: string[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

export default function AgentFilters({
  searchQuery, setSearchQuery,
  statusFilter, setStatusFilter,
  modelFilter, setModelFilter,
  sortBy, setSortBy,
  availableModels, hasActiveFilters, clearFilters,
}: AgentFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">{t("dashboard.yourAgents")}</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={clearFilters}>
            <X className="h-3 w-3" /> {t("dashboard.clearFilters")}
          </Button>
        )}
      </div>

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
    </div>
  );
}
