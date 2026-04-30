import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, ArrowUpDown, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

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
  availableSkills: string[];
  selectedSkills: string[];
  setSelectedSkills: (v: string[]) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

export default function AgentFilters({
  searchQuery, setSearchQuery,
  statusFilter, setStatusFilter,
  modelFilter, setModelFilter,
  sortBy, setSortBy,
  availableModels,
  availableSkills, selectedSkills, setSelectedSkills,
  hasActiveFilters, clearFilters,
}: AgentFiltersProps) {
  const { t } = useLanguage();

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const skillsLabel =
    selectedSkills.length === 0
      ? t("dashboard.filterSkillsAll")
      : t("dashboard.filterSkillsCount").replace("{count}", String(selectedSkills.length));

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
            placeholder={t("dashboard.searchHint")}
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
        {availableSkills.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-44 rounded-xl justify-start gap-2 font-normal"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate flex-1 text-left">
                  {t("dashboard.filterSkills")}: {skillsLabel}
                </span>
                {selectedSkills.length > 0 && (
                  <Badge variant="secondary" className="rounded-full h-5 px-1.5 text-[10px]">
                    {selectedSkills.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 rounded-xl" align="end">
              <div className="max-h-64 overflow-y-auto space-y-1">
                {availableSkills.map((skill) => {
                  const checked = selectedSkills.includes(skill);
                  return (
                    <label
                      key={skill}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSkill(skill)}
                      />
                      <span className="text-sm flex-1 truncate">{skill}</span>
                    </label>
                  );
                })}
              </div>
              {selectedSkills.length > 0 && (
                <div className="border-t mt-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs gap-1"
                    onClick={() => setSelectedSkills([])}
                  >
                    <X className="h-3 w-3" /> {t("dashboard.clearFilters")}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
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

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSkills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="rounded-full gap-1 pl-2.5 pr-1 py-0.5"
            >
              {skill}
              <button
                type="button"
                onClick={() => toggleSkill(skill)}
                className="rounded-full hover:bg-background/60 p-0.5"
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
