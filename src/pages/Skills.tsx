import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Sparkles, Search, Wand2, Info, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useSkills,
  useSkillUsage,
  useCreateSkill,
  useUpdateSkill,
  useDeleteSkill,
  type Skill,
} from "@/hooks/useSkills";
import { useLanguage } from "@/contexts/LanguageContext";
import { SKILL_PRESETS } from "@/data/skillPresets";
import { toast } from "sonner";

const NAME_MAX = 40;
const INSTR_MAX = 4000;

type Filter = "all" | "used" | "unused";

export default function Skills() {
  const { t, language } = useLanguage();
  const isTh = language === "th";
  const { data: skills = [], isLoading } = useSkills();
  const { data: usage = {} } = useSkillUsage();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [presetPicked, setPresetPicked] = useState<string[]>([]);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [toDelete, setToDelete] = useState<Skill | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const tn = (key: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), t(key));

  const agentsFor = (s: Skill) => usage[s.name.toLowerCase()] ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter((s) => {
      const used = (usage[s.name.toLowerCase()] ?? []).length > 0;
      if (filter === "used" && !used) return false;
      if (filter === "unused" && used) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q) ||
        (s.instructions ?? "").toLowerCase().includes(q)
      );
    });
  }, [skills, usage, query, filter]);

  const nameTaken = useMemo(() => {
    const n = name.trim().toLowerCase();
    if (!n) return false;
    return skills.some((s) => s.name.toLowerCase() === n && s.id !== editing?.id);
  }, [name, skills, editing]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setInstructions("");
    setDialogOpen(true);
  };

  const openEdit = (s: Skill) => {
    setEditing(s);
    setName(s.name);
    setDescription(s.description ?? "");
    setInstructions(s.instructions ?? "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return toast.error(t("skills.nameRequired"));
    if (trimmed.length > NAME_MAX) return toast.error(t("skills.nameTooLong"));
    if (nameTaken) return toast.error(t("skills.duplicate"));
    try {
      if (editing) {
        await updateSkill.mutateAsync({ id: editing.id, name: trimmed, description, instructions });
        toast.success(t("skills.updated"));
      } else {
        await createSkill.mutateAsync({ name: trimmed, description, instructions });
        toast.success(t("skills.created"));
      }
      setDialogOpen(false);
    } catch (err: any) {
      const msg = err?.message?.includes("duplicate") ? t("skills.duplicate") : err?.message;
      toast.error(msg ?? t("skills.saveFailed"));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteSkill.mutateAsync(toDelete.id);
      toast.success(t("skills.deleted"));
      setToDelete(null);
    } catch (err: any) {
      toast.error(err?.message ?? t("skills.saveFailed"));
    }
  };

  const addPresets = async () => {
    const chosen = SKILL_PRESETS.filter((p) => presetPicked.includes(p.id));
    let added = 0;
    for (const p of chosen) {
      try {
        await createSkill.mutateAsync({
          name: isTh ? p.nameTh : p.nameEn,
          description: isTh ? p.descTh : p.descEn,
          instructions: isTh ? p.instructionsTh : p.instructionsEn,
        });
        added += 1;
      } catch {
        /* duplicate name — skip */
      }
    }
    toast.success(tn("skills.presetsAdd", { n: added }));
    setPresetPicked([]);
    setPresetOpen(false);
  };

  const presetExists = (p: (typeof SKILL_PRESETS)[number]) =>
    skills.some((s) => s.name.toLowerCase() === (isTh ? p.nameTh : p.nameEn).toLowerCase());

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-start justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            {t("skills.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">{t("skills.subtitle")}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setPresetOpen(true)}>
            <Wand2 className="h-4 w-4" />
            {t("skills.presets")}
          </Button>
          <Button onClick={openCreate} className="gradient-primary text-primary-foreground rounded-xl gap-2">
            <Plus className="h-4 w-4" />
            {t("skills.new")}
          </Button>
        </div>
      </motion.div>

      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <span>{t("skills.howItWorks")}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("skills.search")}
            className="pl-9 rounded-xl"
            aria-label={t("skills.search")}
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {(["all", "used", "unused"] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "ghost"}
              className="rounded-lg"
              onClick={() => setFilter(f)}
            >
              {t(`skills.filter${f === "all" ? "All" : f === "used" ? "Used" : "Unused"}`)}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{tn("skills.count", { n: skills.length })}</p>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <Card className="rounded-2xl glass-card">
          <CardContent className="text-center py-14">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">{t("skills.empty")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("skills.emptyHint")}</p>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" className="rounded-xl gap-2" onClick={() => setPresetOpen(true)}>
                <Wand2 className="h-4 w-4" />
                {t("skills.presets")}
              </Button>
              <Button onClick={openCreate} className="rounded-xl gap-2">
                <Plus className="h-4 w-4" />
                {t("skills.new")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">{t("skills.noResults")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const agents = agentsFor(s);
            const hasInstr = !!s.instructions?.trim();
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="rounded-2xl glass-card h-full flex flex-col">
                  <CardContent className="p-5 flex flex-col gap-3 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="font-semibold flex-1 min-w-0 break-words">{s.name}</p>
                      <div className="flex shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)} aria-label={`${t("common.edit")} ${s.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToDelete(s)}
                          aria-label={`${t("common.delete")} ${s.name}`}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                      {s.description || s.instructions || "—"}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={hasInstr ? "secondary" : "outline"} className="gap-1 font-normal">
                        {hasInstr ? (
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-muted-foreground" />
                        )}
                        {hasInstr ? t("skills.hasInstructions") : t("skills.noInstructions")}
                      </Badge>
                      <Badge variant="outline" className="gap-1 font-normal">
                        <Users className="h-3 w-3" />
                        {agents.length > 0 ? tn("skills.usedBy", { n: agents.length }) : t("skills.notUsed")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create / edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? t("skills.editTitle") : t("skills.newTitle")}</DialogTitle>
              <DialogDescription>{t("skills.howItWorks")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="skill-name">{t("skills.name")}</Label>
                  <span className="text-xs text-muted-foreground">
                    {name.length}/{NAME_MAX}
                  </span>
                </div>
                <Input
                  id="skill-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={NAME_MAX}
                  className="rounded-xl mt-1"
                  aria-invalid={nameTaken}
                  required
                  autoFocus
                />
                <p className={`text-xs mt-1 ${nameTaken ? "text-destructive" : "text-muted-foreground"}`}>
                  {nameTaken ? t("skills.duplicate") : t("skills.nameHelp")}
                </p>
              </div>

              <div>
                <Label htmlFor="skill-desc">
                  {t("skills.desc")} <span className="text-muted-foreground">({t("builder.optional")})</span>
                </Label>
                <Input
                  id="skill-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl mt-1"
                  maxLength={140}
                />
                <p className="text-xs text-muted-foreground mt-1">{t("skills.descHelp")}</p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="skill-instr">{t("skills.instructions")}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() =>
                        setInstructions(
                          instructions.trim()
                            ? instructions
                            : isTh
                              ? SKILL_PRESETS[0].instructionsTh
                              : SKILL_PRESETS[0].instructionsEn,
                        )
                      }
                    >
                      <Wand2 className="h-3 w-3" />
                      {t("skills.insertExample")}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {instructions.length}/{INSTR_MAX}
                    </span>
                  </div>
                </div>
                <Textarea
                  id="skill-instr"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value.slice(0, INSTR_MAX))}
                  placeholder={t("skills.instructionsPlaceholder")}
                  className="rounded-xl mt-1 font-mono text-xs"
                  rows={12}
                />
                <p className="text-xs text-muted-foreground mt-1">{t("skills.instructionsHelp")}</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createSkill.isPending || updateSkill.isPending || nameTaken}
                className="gradient-primary text-primary-foreground rounded-xl"
              >
                {editing ? t("common.save") : t("skills.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Presets */}
      <Dialog open={presetOpen} onOpenChange={setPresetOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("skills.presetsTitle")}</DialogTitle>
            <DialogDescription>{t("skills.presetsDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {SKILL_PRESETS.map((p) => {
              const exists = presetExists(p);
              const picked = presetPicked.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={exists}
                  onClick={() =>
                    setPresetPicked((prev) => (picked ? prev.filter((x) => x !== p.id) : [...prev, p.id]))
                  }
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${
                    exists
                      ? "opacity-50 cursor-not-allowed"
                      : picked
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{isTh ? p.nameTh : p.nameEn}</span>
                    {exists && <Badge variant="outline" className="font-normal">{t("skills.presetAdded")}</Badge>}
                    {picked && !exists && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{isTh ? p.descTh : p.descEn}</p>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPresetOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={addPresets}
              disabled={presetPicked.length === 0 || createSkill.isPending}
              className="gradient-primary text-primary-foreground rounded-xl"
            >
              {tn("skills.presetsAdd", { n: presetPicked.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("skills.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tn("skills.deleteDesc", { name: toDelete?.name ?? "" })}
              {toDelete && agentsFor(toDelete).length > 0 && (
                <span className="block mt-2 text-destructive">
                  {tn("skills.deleteUsed", { names: agentsFor(toDelete).join(", ") })}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
