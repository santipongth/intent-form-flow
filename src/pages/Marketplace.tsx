import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Star, Users, ArrowRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { MARKETPLACE_TEMPLATES, MarketplaceTemplate, TOOLS_LIST } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";

const CATEGORIES = ["All", "Knowledge", "Research", "Support", "Dev", "Content", "Analytics"];

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
      <span className="text-xs font-medium text-muted-foreground ml-0.5">{rating}</span>
    </span>
  );
}

function TemplateCard({ template, index, onSelect, onClone, t }: {
  template: MarketplaceTemplate; index: number; onSelect: () => void; onClone: () => void; t: (k: string) => string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }}>
      <Card className="group cursor-pointer overflow-hidden border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300" onClick={onSelect}>
        <div className={`h-2 bg-gradient-to-r ${template.color}`} />
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-base leading-tight">{template.name}</h3>
            {template.featured && (
              <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200 shrink-0">⭐ {t("marketplace.featured").replace("⭐ ", "")}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
          <StarRating rating={template.rating} />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{formatCount(template.usageCount)} {t("marketplace.usageCount")}</span>
            <span>{t("marketplace.by")} {template.author}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {template.tags.map((tag) => (<Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>))}
          </div>
          <Button size="sm" className="w-full gradient-primary text-primary-foreground gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onClone(); }}>
            {t("marketplace.useTemplate")} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<MarketplaceTemplate | null>(null);

  const filtered = useMemo(() => {
    return MARKETPLACE_TEMPLATES.filter((tmpl) => {
      const matchCat = category === "All" || tmpl.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q || tmpl.name.toLowerCase().includes(q) || tmpl.description.toLowerCase().includes(q) || tmpl.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const featured = useMemo(() => MARKETPLACE_TEMPLATES.filter((tmpl) => tmpl.featured), []);
  const handleClone = (id: string) => navigate(`/agents/new?template=${id}`);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">{t("marketplace.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("marketplace.subtitle")}</p>
      </div>

      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("marketplace.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
          {search && (<button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch("")}><X className="h-4 w-4" /></button>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${category === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {category === "All" && !search && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("marketplace.featured")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((tmpl, i) => (<TemplateCard key={tmpl.id} template={tmpl} index={i} onSelect={() => setSelected(tmpl)} onClone={() => handleClone(tmpl.id)} t={t} />))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {category === "All" ? t("marketplace.allTemplates") : `${t("marketplace.category")} ${category}`}{" "}
          <span className="text-muted-foreground font-normal text-sm">({filtered.length})</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((tmpl, i) => (<TemplateCard key={tmpl.id} template={tmpl} index={i} onSelect={() => setSelected(tmpl)} onClone={() => handleClone(tmpl.id)} t={t} />))}
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">{t("marketplace.noResults")}</p>}
      </section>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg">
            <div className={`-mx-6 -mt-6 h-3 rounded-t-lg bg-gradient-to-r ${selected.color}`} />
            <DialogHeader className="pt-2">
              <DialogTitle className="text-xl">{selected.name}</DialogTitle>
              <DialogDescription className="text-sm">{t("marketplace.by")} {selected.author}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed">{selected.previewDescription}</p>
              <div className="flex items-center gap-4">
                <StarRating rating={selected.rating} />
                <span className="text-xs text-muted-foreground">({selected.reviewCount} {t("marketplace.reviews")})</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {formatCount(selected.usageCount)} {t("marketplace.usageCount")}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t("marketplace.toolsUsed")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.tools.map((toolId) => {
                    const tool = TOOLS_LIST.find((tl) => tl.id === toolId);
                    return <Badge key={toolId} variant="outline" className="text-xs">{tool?.name ?? toolId}</Badge>;
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t("marketplace.recommendedModel")}</p>
                <Badge variant="secondary">{selected.recommendedModel}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selected.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}
              </div>
              <Button className="w-full gradient-primary text-primary-foreground gap-2" size="lg" onClick={() => handleClone(selected.id)}>
                {t("marketplace.useTemplate")} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
