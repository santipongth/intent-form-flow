import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wallet, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAgentBudget, useSaveBudget, DEFAULT_BUDGET, type AgentBudget } from "@/hooks/useEnterprise";

const num = (v: string): number | null => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function BudgetCard({ agentId }: { agentId: string }) {
  const { t } = useLanguage();
  const { data } = useAgentBudget(agentId);
  const save = useSaveBudget(agentId);
  const [form, setForm] = useState<AgentBudget>(DEFAULT_BUDGET(agentId));

  useEffect(() => { if (data?.budget) setForm(data.budget); }, [data?.budget]);

  const usage = data?.usage ?? { dayTokens: 0, dayMessages: 0, monthTokens: 0, monthMessages: 0 };

  const meter = (label: string, used: number, limit: number | null) => {
    if (!limit) return null;
    const pct = Math.min(Math.round((used / limit) * 100), 100);
    return (
      <div key={label} className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className={pct >= 100 ? "text-destructive font-medium" : pct >= 80 ? "text-amber-600 font-medium" : ""}>
            {used.toLocaleString()} / {limit.toLocaleString()} ({pct}%)
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
    );
  };

  const overLimit =
    (form.enabled && (
      (form.daily_token_limit && usage.dayTokens >= form.daily_token_limit) ||
      (form.monthly_token_limit && usage.monthTokens >= form.monthly_token_limit) ||
      (form.daily_message_limit && usage.dayMessages >= form.daily_message_limit) ||
      (form.monthly_message_limit && usage.monthMessages >= form.monthly_message_limit)
    )) || false;

  const field = (label: string, key: keyof AgentBudget) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        className="rounded-xl" type="number" min={1} inputMode="numeric"
        disabled={!form.enabled}
        value={(form[key] as number | null) ?? ""}
        placeholder={t("budget.noLimit")}
        onChange={(e) => setForm({ ...form, [key]: num(e.target.value) } as AgentBudget)}
      />
    </div>
  );

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-4 w-4" /> {t("budget.title")}
          {overLimit && <Badge variant="destructive" className="text-[10px]">{t("budget.exceeded")}</Badge>}
        </CardTitle>
        <CardDescription>{t("budget.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("budget.enable")}</p>
            <p className="text-xs text-muted-foreground">{t("budget.enableHint")}</p>
          </div>
          <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {field(t("budget.dailyTokens"), "daily_token_limit")}
          {field(t("budget.monthlyTokens"), "monthly_token_limit")}
          {field(t("budget.dailyMessages"), "daily_message_limit")}
          {field(t("budget.monthlyMessages"), "monthly_message_limit")}
        </div>

        {form.enabled && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium">{t("budget.usage")}</p>
            {meter(t("budget.dailyTokens"), usage.dayTokens, form.daily_token_limit)}
            {meter(t("budget.monthlyTokens"), usage.monthTokens, form.monthly_token_limit)}
            {meter(t("budget.dailyMessages"), usage.dayMessages, form.daily_message_limit)}
            {meter(t("budget.monthlyMessages"), usage.monthMessages, form.monthly_message_limit)}
            <p className="text-[11px] text-muted-foreground">{t("budget.resetHint")}</p>
          </div>
        )}

        {overLimit && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{t("budget.exceededHint")}</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            className="rounded-xl gradient-primary text-primary-foreground"
            onClick={async () => {
              try { await save.mutateAsync(form); toast.success(t("budget.saved")); }
              catch (e: any) { toast.error(e?.message || t("budget.errSave")); }
            }}
            disabled={save.isPending}
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
