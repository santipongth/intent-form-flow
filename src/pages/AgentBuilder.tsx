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
import { Badge } from "@/components/ui/badge";
import { TEMPLATES, LLM_MODELS, TOOLS_LIST, MARKETPLACE_TEMPLATES } from "@/data/mockData";
import { ArrowLeft, ArrowRight, Upload, Link, X, Sparkles, Store, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCreateAgent } from "@/hooks/useAgents";
import { useUploadKnowledgeFile } from "@/hooks/useKnowledge";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const [selectedModel, setSelectedModel] = useState("GPT-4o");
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [tools, setTools] = useState<Record<string, boolean>>({ "web-search": true });
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState("2048");
  const [templateFromMarketplace, setTemplateFromMarketplace] = useState<string | null>(null);

  const progress = ((step + 1) / STEPS_KEYS.length) * 100;

  useEffect(() => {
    const templateId = searchParams.get("template");
    if (!templateId) return;
    const tmpl = MARKETPLACE_TEMPLATES.find((tp) => tp.id === templateId);
    if (!tmpl) return;
    setSelectedTemplate(tmpl.id);
    setName(tmpl.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim());
    setObjective(tmpl.description);
    const newTools: Record<string, boolean> = {};
    tmpl.tools.forEach((tl) => { newTools[tl] = true; });
    setTools(newTools);
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

  const handleAddUrl = () => {
    if (urlInput.trim()) { setUrls([...urls, urlInput.trim()]); setUrlInput(""); }
  };

  const createAgent = useCreateAgent();
  const uploadKnowledge = useUploadKnowledgeFile();

  const handleCreate = () => {
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
      tools: tools as any,
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
        navigate("/dashboard");
      },
    });
  };

  const currentProvider = LLM_MODELS.find((m) => m.id === selectedProvider);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("builder.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("builder.subtitle")}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          {STEPS_KEYS.map((s, i) => (
            <span key={s} className={`hidden sm:inline ${i === step ? "text-primary font-semibold" : i < step ? "text-brand-green" : "text-muted-foreground"}`}>
              {i < step ? "✅" : i === step ? "👉" : `${i + 1}.`} {s}
            </span>
          ))}
          <span className="sm:hidden text-primary font-semibold">{t("builder.step")} {step + 1}{t("builder.of")}{STEPS_KEYS.length}: {STEPS_KEYS[step]}</span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
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
              <div className="grid sm:grid-cols-2 gap-3">
                <Card className={`rounded-2xl cursor-pointer transition-all border-2 ${selectedTemplate === "custom" ? "border-primary shadow-md" : "border-transparent hover:border-border"}`} onClick={() => setSelectedTemplate("custom")}>
                  <CardContent className="p-5 text-center">
                    <div className="text-3xl mb-2">🎨</div>
                    <h3 className="font-semibold">{t("builder.custom")}</h3>
                    <p className="text-xs text-muted-foreground">{t("builder.customDesc")}</p>
                  </CardContent>
                </Card>
                {TEMPLATES.map((tp) => (
                  <Card key={tp.id} className={`rounded-2xl cursor-pointer transition-all border-2 ${selectedTemplate === tp.id ? "border-primary shadow-md" : "border-transparent hover:border-border"}`} onClick={() => { setSelectedTemplate(tp.id); setObjective(tp.description); }}>
                    <CardContent className="p-5">
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
                  <Label>{t("builder.agentName")}</Label>
                  <Input placeholder="เช่น Nong Support" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label>{t("builder.objective")}</Label>
                  <Input placeholder="เช่น ตอบคำถามลูกค้าเกี่ยวกับสินค้า" value={objective} onChange={(e) => setObjective(e.target.value)} className="rounded-xl mt-1" />
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {LLM_MODELS.map((m) => (
                      <Card key={m.id} className={`rounded-xl cursor-pointer transition-all border-2 ${selectedProvider === m.id ? "border-primary" : "border-transparent hover:border-border"}`} onClick={() => { setSelectedProvider(m.id); setSelectedModel(m.models[0]); }}>
                        <CardContent className="p-3 text-center">
                          <div className="text-2xl mb-1">{m.icon}</div>
                          <p className="text-xs font-medium">{m.name}</p>
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
                        {currentProvider.models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold">{t("builder.knowledge")}</h2>
              <Card className="rounded-2xl border-dashed border-2 border-primary/30 hover:border-primary/50 transition-colors">
                <CardContent className="p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-primary/50" />
                  <p className="font-medium mb-1">{t("builder.dragDrop")}</p>
                  <p className="text-sm text-muted-foreground mb-3">{t("builder.fileTypes")}</p>
                  <label>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md,.csv,.json,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFiles([...files, file]);
                        e.target.value = "";
                      }}
                    />
                    <Button variant="outline" className="rounded-xl" asChild><span>{t("builder.selectFile")}</span></Button>
                  </label>
                </CardContent>
              </Card>
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-2">
                      <span className="text-sm">📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Label>{t("builder.addUrl")}</Label>
                <div className="flex gap-2 mt-1">
                  <Input placeholder="https://example.com" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="rounded-xl" onKeyDown={(e) => e.key === "Enter" && handleAddUrl()} />
                  <Button variant="outline" className="rounded-xl" onClick={handleAddUrl}><Link className="h-4 w-4" /></Button>
                </div>
                {urls.map((u, i) => (
                  <div key={i} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-2 mt-2">
                    <span className="text-sm truncate">🔗 {u}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold">{t("builder.toolsMemory")}</h2>
              <Card className="rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm">{t("builder.tools")}</h3>
                  {TOOLS_LIST.map((tl) => (
                    <div key={tl.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{tl.name}</p>
                        <p className="text-xs text-muted-foreground">{tl.description}</p>
                      </div>
                      <Switch checked={!!tools[tl.id]} onCheckedChange={(checked) => setTools({ ...tools, [tl.id]: checked })} />
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
                <Card className="rounded-2xl">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <Label>{t("builder.systemPrompt")}</Label>
                      <Textarea placeholder="กำหนด System Prompt แบบละเอียด..." value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="rounded-xl mt-1 min-h-[120px]" />
                    </div>
                    <div>
                      <Label>{t("builder.temperature")}: {temperature[0]}</Label>
                      <Slider value={temperature} onValueChange={setTemperature} max={2} step={0.1} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">{t("builder.temperatureDesc")}</p>
                    </div>
                    <div>
                      <Label>{t("builder.maxTokens")}</Label>
                      <Input type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} className="rounded-xl mt-1" />
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="rounded-2xl bg-secondary/50">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {t("builder.summary")}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Template:</span> <span className="font-medium">{selectedTemplate || "Custom"}</span></div>
                    <div><span className="text-muted-foreground">{t("detail.name")}:</span> <span className="font-medium">{name || "-"}</span></div>
                    <div><span className="text-muted-foreground">Model:</span> <span className="font-medium">{selectedModel}</span></div>
                    <div><span className="text-muted-foreground">{t("builder.tone")}:</span> <span className="font-medium">{outputStyle}</span></div>
                    <div><span className="text-muted-foreground">{t("builder.files")}:</span> <span className="font-medium">{files.length} {t("builder.files")}</span></div>
                    <div><span className="text-muted-foreground">URLs:</span> <span className="font-medium">{urls.length} URL</span></div>
                    <div><span className="text-muted-foreground">Tools:</span> <span className="font-medium">{Object.values(tools).filter(Boolean).length} {t("builder.toolsCount")}</span></div>
                    <div><span className="text-muted-foreground">Memory:</span> <span className="font-medium">{memoryEnabled ? t("builder.memoryOn") : t("builder.memoryOff")}</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between pt-4">
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => step > 0 ? setStep(step - 1) : navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
          {step > 0 ? t("builder.back") : "Dashboard"}
        </Button>
        {step < STEPS_KEYS.length - 1 ? (
          <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={() => setStep(step + 1)}>
            {t("builder.next")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gradient-primary text-primary-foreground rounded-xl gap-2 text-base px-8" onClick={handleCreate}>
            {t("builder.create")}
          </Button>
        )}
      </div>
    </div>
  );
}
