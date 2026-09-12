import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, ArrowRight, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  MARKETPLACE_TEMPLATES, MarketplaceTemplate, TOOLS_LIST, MODEL_LABELS,
  WORK_CATEGORIES, WorkCategory, workCategoryOfTemplate,
} from "@/data/constants";
import { USER_PROMPT_CATEGORIES, USER_PROMPT_SAMPLE_ANSWERS } from "@/data/userPromptExamples";
import { useLanguage } from "@/contexts/LanguageContext";

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

function TemplateCard({ template, index, usageCount, onSelect, onClone, t }: {
  template: MarketplaceTemplate; index: number; usageCount: number; onSelect: () => void; onClone: () => void; t: (k: string) => string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 6) * 0.04, duration: 0.25 }}>
      <Card
        className="group h-full cursor-pointer rounded-2xl border-border/60 hover:border-primary/40 hover:shadow-sm transition-all"
        onClick={onSelect}
      >
        <CardContent className="p-5 flex h-full flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{template.name}</h3>
            {template.featured && (
              <Badge variant="secondary" className="shrink-0 rounded-full text-[10px] px-2 py-0">
                {t("marketplace.featured").replace("⭐ ", "")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-full text-[10px] px-2 py-0 font-normal">{tag}</Badge>
            ))}
          </div>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {formatCount(usageCount)} {t("marketplace.usageCount")}
            </span>
            <Button size="sm" variant="ghost" className="rounded-lg gap-1.5 text-primary hover:text-primary" onClick={(e) => { e.stopPropagation(); onClone(); }}>
              {t("marketplace.useTemplate")} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HowItWorks({ category, locale }: { category: WorkCategory; locale: "th" | "en" }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {category.howItWorks.map((step, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-foreground">
            {i + 1}
          </span>
          <span>{step[locale]}</span>
        </li>
      ))}
    </ol>
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<MarketplaceTemplate | null>(null);
  const qc = useQueryClient();

  // Real usage counts from the database (incremented when a template is cloned).
  const { data: usage } = useQuery({
    queryKey: ["template_stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("template_stats").select("template_id, clone_count");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach((row) => { map[row.template_id] = row.clone_count; });
      return map;
    },
  });
  const usageOf = (id: string) => usage?.[id] ?? 0;

  const matchesSearch = (tmpl: MarketplaceTemplate) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return tmpl.name.toLowerCase().includes(q)
      || tmpl.description.toLowerCase().includes(q)
      || tmpl.tags.some((tag) => tag.toLowerCase().includes(q));
  };

  /** กลุ่มตามหมวดงาน (template หนึ่งอาจอยู่ได้หลายหมวด) */
  const groups = useMemo(() => {
    return WORK_CATEGORIES
      .filter((c) => category === "all" || c.id === category)
      .map((c) => ({
        category: c,
        templates: c.templateIds
          .map((id) => MARKETPLACE_TEMPLATES.find((tp) => tp.id === id))
          .filter((tp): tp is MarketplaceTemplate => !!tp && matchesSearch(tp)),
      }))
      .filter((g) => g.templates.length > 0);
  }, [category, search]);

  const totalShown = groups.reduce((sum, g) => sum + g.templates.length, 0);

  const handleClone = async (id: string) => {
    try {
      await supabase.rpc("increment_template_clone", { _template_id: id });
      qc.invalidateQueries({ queryKey: ["template_stats"] });
    } catch { /* usage counting must never block the user */ }
    navigate(`/agents/new?template=${id}`);
  };

  const selectedCategory = selected ? workCategoryOfTemplate(selected.id) : undefined;
  const sampleExample = selectedCategory
    ? USER_PROMPT_CATEGORIES.find((c) => c.id === selectedCategory.promptCategoryId)?.examples[0]
    : undefined;
  const sampleAnswer = sampleExample ? USER_PROMPT_SAMPLE_ANSWERS[sampleExample.id]?.[locale] : undefined;

  return (
    <div className="px-4 py-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{t("marketplace.title")}</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">{t("marketplace.subtitleWork")}</p>
      </header>

      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("marketplace.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch("")} aria-label={t("common.close")}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("marketplace.category")}>
          <button
            role="tab"
            aria-selected={category === "all"}
            onClick={() => setCategory("all")}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${category === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`}
          >
            {t("common.all")}
          </button>
          {WORK_CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={category === c.id}
              onClick={() => setCategory(c.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${category === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`}
            >
              <span aria-hidden="true" className="mr-1">{c.icon}</span>{c.name[locale]}
            </button>
          ))}
        </div>
      </div>

      {totalShown === 0 && (
        <p className="py-12 text-center text-muted-foreground">{t("marketplace.noResults")}</p>
      )}

      {groups.map(({ category: c, templates }) => (
        <section key={c.id} className="space-y-4 border-t border-border/60 pt-6 first:border-t-0 first:pt-0">
          <div className="space-y-2">
            <h2 className="font-display text-lg font-semibold">
              <span aria-hidden="true" className="mr-1.5">{c.icon}</span>{c.name[locale]}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">{c.description[locale]}</p>
          </div>

          <Card className="rounded-2xl border-border/60 bg-secondary/30">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("marketplace.howItWorks")}</p>
              <HowItWorks category={c} locale={locale} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tmpl, i) => (
              <TemplateCard
                key={`${c.id}-${tmpl.id}`}
                template={tmpl}
                index={i}
                usageCount={usageOf(tmpl.id)}
                onSelect={() => setSelected(tmpl)}
                onClone={() => handleClone(tmpl.id)}
                t={t}
              />
            ))}
          </div>
        </section>
      ))}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">{selected.name}</DialogTitle>
              <DialogDescription className="text-sm">
                {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name[locale]}` : selected.category}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-foreground/80">{selected.previewDescription}</p>

              {selectedCategory && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("marketplace.howItWorks")}</p>
                  <HowItWorks category={selectedCategory} locale={locale} />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("marketplace.toolsUsed")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tools.map((toolId) => {
                      const tool = TOOLS_LIST.find((tl) => tl.id === toolId);
                      return <Badge key={toolId} variant="outline" className="rounded-full text-xs font-normal">{tool?.name ?? toolId}</Badge>;
                    })}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("marketplace.recommendedModel")}</p>
                  <Badge variant="secondary" className="rounded-full font-normal">{MODEL_LABELS[selected.recommendedModel] ?? selected.recommendedModel}</Badge>
                </div>
              </div>

              {selectedCategory && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("marketplace.sampleQuestions")}</p>
                  <ul className="space-y-1.5">
                    {selectedCategory.sampleQuestions.map((q) => (
                      <li key={q.en} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{q[locale]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {sampleAnswer && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("marketplace.sampleAnswer")}</p>
                  <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-secondary/60 p-3 text-xs leading-relaxed text-foreground/80">
                    {sampleAnswer}
                  </pre>
                  <p className="text-[11px] text-muted-foreground">{t("marketplace.sampleAnswerHint")}</p>
                </div>
              )}

              <Button className="w-full gradient-primary text-primary-foreground gap-2 rounded-xl" size="lg" onClick={() => handleClone(selected.id)}>
                {t("marketplace.useTemplate")} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
