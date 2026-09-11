import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGuardrails, useSaveGuardrails, DEFAULT_GUARDRAILS, type Guardrails } from "@/hooks/useEnterprise";

export function GuardrailsCard({ agentId }: { agentId: string }) {
  const { t } = useLanguage();
  const { data } = useGuardrails(agentId);
  const save = useSaveGuardrails(agentId);
  const [form, setForm] = useState<Guardrails>(DEFAULT_GUARDRAILS(agentId));
  const [keyword, setKeyword] = useState("");

  useEffect(() => { if (data) setForm(data); }, [data]);

  const addKeyword = () => {
    const k = keyword.trim();
    if (!k) return;
    if (form.blocked_keywords.some((x) => x.toLowerCase() === k.toLowerCase())) { setKeyword(""); return; }
    if (form.blocked_keywords.length >= 50) { toast.error(t("guard.maxKeywords")); return; }
    setForm({ ...form, blocked_keywords: [...form.blocked_keywords, k] });
    setKeyword("");
  };

  const handleSave = async () => {
    try {
      await save.mutateAsync(form);
      toast.success(t("guard.saved"));
    } catch (e: any) {
      toast.error(e?.message || t("guard.errSave"));
    }
  };

  const row = (label: string, hint: string, key: keyof Guardrails) => (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch
        checked={!!form[key]}
        onCheckedChange={(v) => setForm({ ...form, [key]: v } as Guardrails)}
        disabled={!form.enabled && key !== "enabled"}
      />
    </div>
  );

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> {t("guard.title")}
          {form.enabled && <Badge className="text-[10px]">{t("guard.on")}</Badge>}
        </CardTitle>
        <CardDescription>{t("guard.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {row(t("guard.enable"), t("guard.enableHint"), "enabled")}
        <div className="border-t pt-2">
          {row(t("guard.injection"), t("guard.injectionHint"), "injection_detection")}
          {row(t("guard.pii"), t("guard.piiHint"), "pii_redaction")}
          {row(t("guard.aiReview"), t("guard.aiReviewHint"), "ai_review")}
        </div>

        <div className="border-t pt-3 space-y-2">
          <Label className="text-xs">{t("guard.keywords")}</Label>
          <div className="flex gap-2">
            <Input
              className="rounded-xl" value={keyword} disabled={!form.enabled}
              placeholder={t("guard.keywordsPlaceholder")}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
            />
            <Button variant="outline" className="rounded-xl" onClick={addKeyword} disabled={!form.enabled}>
              {t("guard.addKeyword")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.blocked_keywords.map((k) => (
              <Badge key={k} variant="secondary" className="gap-1 rounded-lg">
                {k}
                <button onClick={() => setForm({ ...form, blocked_keywords: form.blocked_keywords.filter((x) => x !== k) })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="border-t pt-3">
          <Label className="text-xs">{t("guard.blockedMessage")}</Label>
          <Input
            className="rounded-xl" value={form.blocked_message} disabled={!form.enabled}
            onChange={(e) => setForm({ ...form, blocked_message: e.target.value })}
          />
          <p className="text-[11px] text-muted-foreground mt-1">{t("guard.blockedMessageHint")}</p>
        </div>

        <div className="flex justify-end pt-2">
          <Button className="rounded-xl gradient-primary text-primary-foreground" onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
