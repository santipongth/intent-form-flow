import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SkillSelector } from "@/components/SkillSelector";
import { FieldHint } from "@/components/agent-builder/FieldHint";
import { useLanguage } from "@/contexts/LanguageContext";
import { MAX_TOKEN_PRESETS, modelSupportsTemperature } from "@/lib/agentTools";

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <Card className="rounded-2xl">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button type="button" className="w-full flex items-center justify-between p-4 sm:p-5 text-left">
            <span className="font-semibold text-sm">{title}</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-4">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export interface AdvancedSettingsValue {
  systemPrompt: string;
  userPrompt: string;
  skills: string[];
  templateSkills: string[];
  temperature: number[];
  maxTokens: string;
  greeting: string;
  starters: string[];
  fallbackMessage: string;
  strictKnowledge: boolean;
  maxToolIterations: number;
  model: string;
}

export interface AdvancedSettingsHandlers {
  setSystemPrompt: (v: string) => void;
  setUserPrompt: (v: string) => void;
  setSkills: (v: string[]) => void;
  setTemperature: (v: number[]) => void;
  setMaxTokens: (v: string) => void;
  setGreeting: (v: string) => void;
  setStarters: (v: string[]) => void;
  setFallbackMessage: (v: string) => void;
  setStrictKnowledge: (v: boolean) => void;
  setMaxToolIterations: (v: number) => void;
}

const USER_PROMPT_EXAMPLE =
  "คำถามของผู้ใช้: {{question}}\nตอบเป็นข้อ ๆ อ้างอิงข้อมูลที่มี และปิดท้ายด้วยสรุปสั้น 1 บรรทัด";

export function AdvancedSettings({ value, on }: { value: AdvancedSettingsValue; on: AdvancedSettingsHandlers }) {
  const { t, locale } = useLanguage();
  const tempSupported = modelSupportsTemperature(value.model);
  const presetValues = MAX_TOKEN_PRESETS.map((p) => String(p.value));
  const isPreset = presetValues.includes(value.maxTokens);

  const setStarter = (i: number, v: string) => {
    const next = [...value.starters];
    next[i] = v;
    on.setStarters(next);
  };

  return (
    <div className="space-y-3">
      <Section title={t("builder.sectionPersona")} defaultOpen>
        <div>
          <Label className="flex items-center gap-1.5">
            {t("builder.systemPrompt")} <FieldHint text={t("builder.systemPromptHelp")} />
          </Label>
          <Textarea
            placeholder="กำหนด System Prompt แบบละเอียด..."
            value={value.systemPrompt}
            onChange={(e) => on.setSystemPrompt(e.target.value)}
            className="rounded-xl mt-1 min-h-[120px]"
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <Label className="flex items-center gap-1.5">
              User Prompt
              <span className="text-xs text-muted-foreground font-normal">({t("builder.optional")})</span>
              <FieldHint text={t("builder.userPromptHelp")} />
            </Label>
            <Button
              type="button" variant="ghost" size="sm" className="h-7 text-xs rounded-lg"
              onClick={() => on.setUserPrompt(USER_PROMPT_EXAMPLE)}
            >
              {t("builder.userPromptInsert")}
            </Button>
          </div>
          <Textarea
            placeholder={USER_PROMPT_EXAMPLE}
            value={value.userPrompt}
            onChange={(e) => on.setUserPrompt(e.target.value)}
            className="rounded-xl mt-1 min-h-[100px] text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("builder.userPromptHelp")} · <code>{"{{question}}"}</code>
          </p>
        </div>
        <div>
          <Label className="flex items-center gap-1.5">
            Skills <FieldHint text={t("builder.skillsHelp")} />
          </Label>
          <div className="mt-2">
            <SkillSelector value={value.skills} onChange={on.setSkills} templateSkills={value.templateSkills} />
          </div>
        </div>
      </Section>

      <Section title={t("builder.sectionAnswer")}>
        <div>
          <Label className="flex items-center gap-1.5">
            {t("builder.temperature")}: {tempSupported ? value.temperature[0] : "—"}
            <FieldHint text={t("builder.temperatureDesc")} />
          </Label>
          <Slider
            value={value.temperature} onValueChange={on.setTemperature}
            max={2} step={0.1} className="mt-2" disabled={!tempSupported}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {tempSupported ? t("builder.temperatureDesc") : t("builder.temperatureUnsupported")}
          </p>
        </div>
        <div>
          <Label className="flex items-center gap-1.5">
            {t("builder.answerLength")} <FieldHint text={t("builder.answerLengthHelp")} />
          </Label>
          <Select
            value={isPreset ? value.maxTokens : "custom"}
            onValueChange={(v) => on.setMaxTokens(v === "custom" ? value.maxTokens : v)}
          >
            <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MAX_TOKEN_PRESETS.map((p) => (
                <SelectItem key={p.value} value={String(p.value)}>
                  {locale === "en" ? p.labelEn : p.labelTh}
                </SelectItem>
              ))}
              <SelectItem value="custom">{t("builder.lengthCustom")}</SelectItem>
            </SelectContent>
          </Select>
          {!isPreset && (
            <Input
              type="number" min={256} max={32000} value={value.maxTokens}
              onChange={(e) => on.setMaxTokens(e.target.value)}
              className="rounded-xl mt-2"
            />
          )}
        </div>
        <div>
          <Label className="flex items-center gap-1.5">
            {t("builder.greeting")} <FieldHint text={t("builder.greetingHelp")} />
          </Label>
          <Input
            value={value.greeting} onChange={(e) => on.setGreeting(e.target.value)}
            placeholder="สวัสดีครับ ผมช่วยตอบคำถามเรื่องสินค้าได้ ถามได้เลย"
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label className="flex items-center gap-1.5">
            {t("builder.starters")} <FieldHint text={t("builder.startersHelp")} />
          </Label>
          <div className="space-y-2 mt-1">
            {[0, 1, 2].map((i) => (
              <Input
                key={i} value={value.starters[i] ?? ""} onChange={(e) => setStarter(i, e.target.value)}
                placeholder={`คำถามตัวอย่างที่ ${i + 1}`} className="rounded-xl"
              />
            ))}
          </div>
        </div>
      </Section>

      <Section title={t("builder.sectionScope")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium flex items-center gap-1.5">
              {t("builder.strictKnowledge")} <FieldHint text={t("builder.strictKnowledgeHelp")} />
            </p>
            <p className="text-xs text-muted-foreground">{t("builder.strictKnowledgeHelp")}</p>
          </div>
          <Switch checked={value.strictKnowledge} onCheckedChange={on.setStrictKnowledge} className="shrink-0" />
        </div>
        <div>
          <Label className="flex items-center gap-1.5">
            {t("builder.fallback")} <FieldHint text={t("builder.fallbackHelp")} />
          </Label>
          <Input
            value={value.fallbackMessage} onChange={(e) => on.setFallbackMessage(e.target.value)}
            placeholder="ขออภัย ไม่พบข้อมูลนี้ในคลังความรู้ครับ"
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label className="flex items-center gap-1.5">
            {t("builder.toolRounds")}: {value.maxToolIterations} <FieldHint text={t("builder.toolRoundsHelp")} />
          </Label>
          <Slider
            value={[value.maxToolIterations]}
            onValueChange={(v) => on.setMaxToolIterations(v[0])}
            min={1} max={8} step={1} className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">{t("builder.toolRoundsHelp")}</p>
        </div>
        <p className="text-xs text-muted-foreground">{t("builder.enterpriseHint")}</p>
      </Section>
    </div>
  );
}
