import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { TEMPLATES, LLM_MODELS, MODEL_LABELS, TOOLS_LIST, MARKETPLACE_TEMPLATES, TEMPLATE_DEFAULTS, CUSTOM_TEMPLATE_DEFAULTS } from "@/data/constants";
import { ArrowLeft, ArrowRight, Sparkles, Store } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCreateAgent } from "@/hooks/useAgents";
import { useAddKnowledgeUrl, useUploadKnowledgeFile } from "@/hooks/useKnowledge";
import { useLanguage } from "@/contexts/LanguageContext";
import KnowledgeStep from "@/components/agent-builder/KnowledgeStep";
import { AdvancedSettings } from "@/components/agent-builder/AdvancedSettings";
import { PreviewChat } from "@/components/agent-builder/PreviewChat";
import { withAgentSettings, toSkillEntries, renderSkillBlock } from "@/lib/agentTools";
import { useSkills } from "@/hooks/useSkills";
import { AlertTriangle, Pencil } from "lucide-react";

const STEPS_KEYS = ["Intent & Type", "Identity & Model", "Knowledge", "Tools & Memory", "Review & Create"];

export default function AgentBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { t } = useLanguage();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [outputStyle, setOutputStyle] = useState("friendly");
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("openai/gpt-5");
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [tools, setTools] = useState<Record<string, boolean>>({ "web-search": true });
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [templateSkills, setTemplateSkills] = useState<string[]>([]);
  const [templateTools, setTemplateTools] = useState<string[]>([]);
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState("2048");
  const [templateFromMarketplace, setTemplateFromMarketplace] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const [starters, setStarters] = useState<string[]>(["", "", ""]);
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [strictKnowledge, setStrictKnowledge] = useState(false);
  const [maxToolIterations, setMaxToolIterations] = useState(4);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const progress = ((step + 1) / STEPS_KEYS.length) * 100;

  /**
   * Sync skills + tools เมื่อเปลี่ยน template:
   *   - ลบของ template เก่าออก (เฉพาะที่ user ไม่ได้แก้)
   *   - merge ของ template ใหม่เข้าไป
   *   - อัปเดต templateSkills/templateTools เพื่อให้ badge "from template" ถูกต้องเสมอ
   */
  const applyTemplate = (def: typeof CUSTOM_TEMPLATE_DEFAULTS) => {
    setSystemPrompt(def.systemPrompt);
    if (def.outputStyle) setOutputStyle(def.outputStyle);
    if (typeof def.temperature === "number") setTemperature([def.temperature]);
    if (typeof def.maxTokens === "number") setMaxTokens(String(def.maxTokens));

    // Skills: เก็บ user-added (ที่ไม่ได้มาจาก template เก่า) + เพิ่มของ template ใหม่
    setSkills((prev) => {
      const userAdded = prev.filter((s) => !templateSkills.includes(s));
      const merged = [...def.skills];
      userAdded.forEach((s) => { if (!merged.includes(s)) merged.push(s); });
      return merged;
    });
    setTemplateSkills(def.skills);

    // Tools: ปิดของ template เก่า (เฉพาะที่ไม่ได้อยู่ใน template ใหม่), เปิดของ template ใหม่, คงค่า user toggle อื่น ๆ
    setTools((prev) => {
      const next = { ...prev };
      templateTools.forEach((tl) => {
        if (!def.tools.includes(tl)) next[tl] = false;
      });
      def.tools.forEach((tl) => { next[tl] = true; });
      return next;
    });
    setTemplateTools(def.tools);
  };

  useEffect(() => {
    const templateId = searchParams.get("template");
    if (!templateId) return;
    const tmpl = MARKETPLACE_TEMPLATES.find((tp) => tp.id === templateId);
    if (!tmpl) return;
    setSelectedTemplate(tmpl.id);
    setName(tmpl.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim());
    setObjective(tmpl.description);
    const def = TEMPLATE_DEFAULTS[tmpl.id] ?? { ...CUSTOM_TEMPLATE_DEFAULTS, tools: tmpl.tools, skills: [] };
    applyTemplate(def);
    for (const provider of LLM_MODELS) {
      if (provider.models.includes(tmpl.recommendedModel)) {
        setSelectedProvider(provider.id);
        setSelectedModel(tmpl.recommendedModel);
        break;
      }
    }
    setTemplateFromMarketplace(tmpl.name);
    setStep(1);
    toast.success(t("builder.templateLoaded"), { description: `${t("builder.usingTemplate")} "${tmpl.name}" ${t("builder.fromMarketplace")}` });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Draft autosave (local only) so a half-filled wizard survives a reload
  const DRAFT_KEY = "tm.agentDraft";
  useEffect(() => {
    if (searchParams.get("template")) { setDraftLoaded(true); return; }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d === "object") {
          setSelectedTemplate(d.selectedTemplate ?? null);
          setName(d.name ?? "");
          setObjective(d.objective ?? "");
          setOutputStyle(d.outputStyle ?? "friendly");
          setSelectedProvider(d.selectedProvider ?? "openai");
          setSelectedModel(d.selectedModel ?? "openai/gpt-5");
          setUrls(Array.isArray(d.urls) ? d.urls : []);
          setTools(d.tools ?? { "web-search": true });
          setMemoryEnabled(d.memoryEnabled ?? true);
          setSystemPrompt(d.systemPrompt ?? "");
          setUserPrompt(d.userPrompt ?? "");
          setSkills(Array.isArray(d.skills) ? d.skills : []);
          setTemperature([typeof d.temperature === "number" ? d.temperature : 0.7]);
          setMaxTokens(d.maxTokens ?? "2048");
          setGreeting(d.greeting ?? "");
          setStarters(Array.isArray(d.starters) ? d.starters : ["", "", ""]);
          setFallbackMessage(d.fallbackMessage ?? "");
          setStrictKnowledge(!!d.strictKnowledge);
          setMaxToolIterations(typeof d.maxToolIterations === "number" ? d.maxToolIterations : 4);
          if (d.name || d.objective) toast.info(t("builder.draftRestored"));
        }
      }
    } catch { /* ignore malformed drafts */ }
    setDraftLoaded(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!draftLoaded) return;
    const draft = {
      selectedTemplate, name, objective, outputStyle, selectedProvider, selectedModel, urls,
      tools, memoryEnabled, systemPrompt, userPrompt, skills, temperature: temperature[0], maxTokens,
      greeting, starters, fallbackMessage, strictKnowledge, maxToolIterations,
    };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* quota */ }
  }, [draftLoaded, selectedTemplate, name, objective, outputStyle, selectedProvider, selectedModel, urls,
      tools, memoryEnabled, systemPrompt, userPrompt, skills, temperature, maxTokens,
      greeting, starters, fallbackMessage, strictKnowledge, maxToolIterations]);

  // ---- Required fields per step
  const stepError = (() => {
    if (step === 1 && !name.trim()) return t("builder.needName");
    if (step === 1 && !objective.trim()) return t("builder.needObjective");
    return null;
  })();

  const goNext = () => {
    if (stepError) { toast.error(stepError); return; }
    setStep(step + 1);
  };

  const cleanStarters = starters.map((x) => x.trim()).filter(Boolean);

  /** System prompt used by the "try it" preview, mirroring the backend composition. */
  const previewSystemPrompt = (() => {
    let out = systemPrompt.trim()
      || (objective ? `You are ${name || "an assistant"}. Your objective: ${objective}. Be helpful and respond naturally.`
        : "You are a helpful AI assistant. Keep answers clear and concise.");
    if (userPrompt.trim()) out += `\n\n---\nUser Prompt Template (apply when responding):\n${userPrompt.trim()}\n---`;
    if (skills.length > 0) out += `\n\n---\nSpecialised skills you must apply in every answer:\n${skills.map((x) => `- ${x}`).join("\n")}\n---`;
    return out;
  })();

  const handleAddUrl = () => {
    try {
      const parsed = new URL(urlInput.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
      parsed.hash = "";
      const normalized = parsed.toString();
      if (urls.includes(normalized)) return toast.error("URL นี้ถูกเพิ่มแล้ว");
      if (urls.length >= 10) return toast.error("เพิ่ม URL ได้สูงสุด 10 รายการ");
      setUrls([...urls, normalized]);
      setUrlInput("");
    } catch {
      toast.error("กรุณาใส่ URL แบบ http หรือ https ที่ถูกต้อง");
    }
  };

  const createAgent = useCreateAgent();
  const uploadKnowledge = useUploadKnowledgeFile();
  const addKnowledgeUrl = useAddKnowledgeUrl();

  const handleCreate = () => {
    // Never persist tools that are not implemented yet ("เร็ว ๆ นี้"),
    // even if a template default listed them.
    const comingSoonIds = new Set(TOOLS_LIST.filter((tl) => tl.comingSoon).map((tl) => tl.id));
    const enabledTools = Object.fromEntries(
      Object.entries(tools).filter(([id, on]) => on && !comingSoonIds.has(id)),
    );
    createAgent.mutate({
      name: name || "Agent ใหม่",
      avatar: "🤖",
      objective,
      template: selectedTemplate,
      provider: selectedProvider,
      model: selectedModel,
      output_style: outputStyle,
      system_prompt: systemPrompt || null,
      temperature: temperature[0],
      max_tokens: parseInt(maxTokens) || 2048,
      tools: withAgentSettings(
        { ...enabledTools, _userPrompt: userPrompt, _skills: skills },
        { greeting, starters: cleanStarters, fallbackMessage, strictKnowledge, maxToolIterations },
      ) as any,
      memory_enabled: memoryEnabled,
      knowledge_urls: urls,
    }, {
      onSuccess: (data: any) => {
        // Upload pending files to the newly created agent
        if (files.length > 0 && data?.id) {
          files.forEach((file) => {
            uploadKnowledge.mutate({ file, agentId: data.id });
          });
        }
        if (data?.id) {
          urls.forEach((url) => addKnowledgeUrl.mutate({ url, agentId: data.id }));
        }
        try { localStorage.removeItem("tm.agentDraft"); } catch { /* ignore */ }
        navigate("/dashboard");
      },
    });
  };

  const currentProvider = LLM_MODELS.find((m) => m.id === selectedProvider);

  return (
    <div className="px-4 py-5 sm:p-6 max-w-5xl mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold">{t("builder.title")}</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">{t("builder.subtitle")}</p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {/* Step indicators - dots on mobile, full text on desktop */}
        <div className="flex items-center justify-between text-sm">
          {STEPS_KEYS.map((s, i) => (
            <span key={s} className={`hidden sm:inline ${i === step ? "text-primary font-semibold" : i < step ? "text-brand-green" : "text-muted-foreground"}`}>
              {i < step ? "✅" : i === step ? "👉" : `${i + 1}.`} {s}
            </span>
          ))}
          <div className="flex sm:hidden items-center gap-1.5 w-full">
            {STEPS_KEYS.map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>
        <p className="sm:hidden text-xs text-primary font-semibold">{t("builder.step")} {step + 1}{t("builder.of")}{STEPS_KEYS.length}: {STEPS_KEYS[step]}</p>
        <Progress value={progress} className="h-2 rounded-full hidden sm:block" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">{t("builder.selectTemplate")}</h2>
              {templateFromMarketplace && (
                <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-4 py-2.5 text-sm">
                  <Store className="h-4 w-4 shrink-0" />
                  <span>{t("builder.usingTemplate")} <strong>{templateFromMarketplace}</strong> {t("builder.fromMarketplace")} {t("builder.canChange")}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Card className={`rounded-2xl cursor-pointer transition-all border-2 ${selectedTemplate === "custom" ? "border-primary shadow-md" : "border-transparent hover:border-border"}`} onClick={() => {
                  setSelectedTemplate("custom");
                  applyTemplate(CUSTOM_TEMPLATE_DEFAULTS);
                }}>
                  <CardContent className="p-4 sm:p-5 text-center">
                    <div className="text-3xl mb-2">🎨</div>
                    <h3 className="font-semibold">{t("builder.custom")}</h3>
                    <p className="text-xs text-muted-foreground">{t("builder.customDesc")}</p>
                  </CardContent>
                </Card>
                {TEMPLATES.map((tp) => (
                  <Card key={tp.id} className={`rounded-2xl cursor-pointer transition-all border-2 ${selectedTemplate === tp.id ? "border-primary shadow-md" : "border-transparent hover:border-border"}`} onClick={() => {
                    setSelectedTemplate(tp.id);
                    setObjective(tp.description);
                    const d = TEMPLATE_DEFAULTS[tp.id];
                    if (d) applyTemplate(d);
                  }}>
                    <CardContent className="p-4 sm:p-5">
                      <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${tp.color} mb-3`} />
                      <h3 className="font-semibold text-sm">{tp.name}</h3>
                      <p className="text-xs text-muted-foreground">{tp.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold">{t("builder.nameAndBrain")}</h2>
              <div className="space-y-4">
                <div>
                  <Label>{t("builder.agentName")} <span className="text-destructive">*</span></Label>
                  <Input placeholder="เช่น Nong Support" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!name.trim()} className="rounded-xl mt-1" />
                  {!name.trim() && <p className="text-xs text-destructive mt-1">{t("builder.needName")}</p>}
                </div>
                <div>
                  <Label>{t("builder.objective")} <span className="text-destructive">*</span></Label>
                  <Input placeholder="เช่น ตอบคำถามลูกค้าเกี่ยวกับสินค้า" value={objective} onChange={(e) => setObjective(e.target.value)} aria-invalid={!objective.trim()} className="rounded-xl mt-1" />
                  {!objective.trim() && <p className="text-xs text-destructive mt-1">{t("builder.needObjective")}</p>}
                </div>
                <div>
                  <Label>{t("builder.tone")}</Label>
                  <Select value={outputStyle} onValueChange={setOutputStyle}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="polite">{t("builder.tonePolite")}</SelectItem>
                      <SelectItem value="friendly">{t("builder.toneFriendly")}</SelectItem>
                      <SelectItem value="professional">{t("builder.toneProfessional")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("builder.selectProvider")}</Label>
                   <div className="grid grid-cols-2 gap-2 mt-2">
                    {LLM_MODELS.map((m) => (
                      <Card key={m.id} className={`rounded-xl cursor-pointer transition-all border-2 ${selectedProvider === m.id ? "border-primary" : "border-transparent hover:border-border"}`} onClick={() => { setSelectedProvider(m.id); setSelectedModel(m.models[0]); }}>
                        <CardContent className="p-2.5 sm:p-3 text-center">
                          <div className="text-xl sm:text-2xl mb-1">{m.icon}</div>
                          <p className="text-[10px] sm:text-xs font-medium truncate">{m.name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                {currentProvider && (
                  <div>
                    <Label>{t("builder.selectModel")}</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {currentProvider.models.map((m) => <SelectItem key={m} value={m}>{MODEL_LABELS[m] ?? m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <KnowledgeStep
              files={files}
              setFiles={setFiles}
              urls={urls}
              setUrls={setUrls}
              urlInput={urlInput}
              setUrlInput={setUrlInput}
              onAddUrl={handleAddUrl}
            />
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold">{t("builder.toolsMemory")}</h2>
              <Card className="rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm">{t("builder.tools")}</h3>
                  {TOOLS_LIST.map((tl) => (
                    <div key={tl.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          {tl.name}
                          {templateTools.includes(tl.id) && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 font-normal">from template</span>
                          )}
                          {tl.comingSoon && (
                            <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 font-normal">เร็ว ๆ นี้</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{tl.description}</p>
                      </div>
                      <Switch
                        className="shrink-0"
                        checked={!!tools[tl.id] && !tl.comingSoon}
                        disabled={tl.comingSoon}
                        onCheckedChange={(checked) => {
                          if (tl.comingSoon) return;
                          setTools({ ...tools, [tl.id]: checked });
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{t("builder.memory")}</p>
                      <p className="text-xs text-muted-foreground">{t("builder.memoryDesc")}</p>
                    </div>
                    <Switch checked={memoryEnabled} onCheckedChange={setMemoryEnabled} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold">{t("builder.reviewCreate")}</h2>
              <div className="flex items-center gap-2">
                <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                <Label className="text-sm">{t("builder.showAdvanced")}</Label>
              </div>
              {showAdvanced && (
                <AdvancedSettings
                  value={{
                    systemPrompt, userPrompt, skills, templateSkills, temperature, maxTokens,
                    greeting, starters, fallbackMessage, strictKnowledge, maxToolIterations,
                    model: selectedModel,
                  }}
                  on={{
                    setSystemPrompt, setUserPrompt, setSkills, setTemperature, setMaxTokens,
                    setGreeting, setStarters, setFallbackMessage, setStrictKnowledge, setMaxToolIterations,
                  }}
                />
              )}

              <PreviewChat systemPrompt={previewSystemPrompt} />

              <Card className="rounded-2xl bg-secondary/50">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {t("builder.summary")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Template:</span> <span className="font-medium">{selectedTemplate || "Custom"}</span>
                      <button type="button" onClick={() => setStep(0)} className="text-primary hover:underline inline-flex items-center gap-0.5 text-xs" aria-label={t("builder.edit")}><Pencil className="h-3 w-3" />{t("builder.edit")}</button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{t("detail.name")}:</span> <span className="font-medium">{name || "-"}</span>
                      <button type="button" onClick={() => setStep(1)} className="text-primary hover:underline inline-flex items-center gap-0.5 text-xs" aria-label={t("builder.edit")}><Pencil className="h-3 w-3" />{t("builder.edit")}</button>
                    </div>
                    <div><span className="text-muted-foreground">Model:</span> <span className="font-medium">{MODEL_LABELS[selectedModel] ?? selectedModel}</span></div>
                    <div><span className="text-muted-foreground">{t("builder.tone")}:</span> <span className="font-medium">{outputStyle}</span></div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{t("builder.files")}:</span> <span className="font-medium">{files.length} {t("builder.files")}</span>
                      <button type="button" onClick={() => setStep(2)} className="text-primary hover:underline inline-flex items-center gap-0.5 text-xs" aria-label={t("builder.edit")}><Pencil className="h-3 w-3" />{t("builder.edit")}</button>
                    </div>
                    <div><span className="text-muted-foreground">URLs:</span> <span className="font-medium">{urls.length} URL</span></div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Tools:</span> <span className="font-medium">{Object.values(tools).filter(Boolean).length} {t("builder.toolsCount")}</span>
                      <button type="button" onClick={() => setStep(3)} className="text-primary hover:underline inline-flex items-center gap-0.5 text-xs" aria-label={t("builder.edit")}><Pencil className="h-3 w-3" />{t("builder.edit")}</button>
                    </div>
                    <div><span className="text-muted-foreground">Memory:</span> <span className="font-medium">{memoryEnabled ? t("builder.memoryOn") : t("builder.memoryOff")}</span></div>
                    <div><span className="text-muted-foreground">Skills:</span> <span className="font-medium">{skills.length}</span></div>
                    <div><span className="text-muted-foreground">{t("builder.answerLength")}:</span> <span className="font-medium">{maxTokens}</span></div>
                  </div>
                  {files.length === 0 && urls.length === 0 && (
                    <p className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      {t("builder.noKnowledgeWarn")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between pt-4 pb-2 sticky bottom-0 bg-background/80 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6">
        <Button variant="outline" className="rounded-xl gap-1.5 sm:gap-2 text-sm" onClick={() => step > 0 ? setStep(step - 1) : navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{step > 0 ? t("builder.back") : "Dashboard"}</span>
          <span className="sm:hidden">{step > 0 ? t("builder.back") : "Back"}</span>
        </Button>
        {step < STEPS_KEYS.length - 1 ? (
          <Button className="gradient-primary text-primary-foreground rounded-xl gap-1.5 sm:gap-2 text-sm" disabled={!!stepError} title={stepError ?? undefined} onClick={goNext}>
            {t("builder.next")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gradient-primary text-primary-foreground rounded-xl gap-2 text-sm sm:text-base px-6 sm:px-8" onClick={handleCreate}>
            {t("builder.create")}
          </Button>
        )}
      </div>
    </div>
  );
}
