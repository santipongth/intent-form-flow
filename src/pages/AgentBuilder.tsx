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
import { ArrowLeft, ArrowRight, Upload, Link, X, Sparkles, Store } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const STEPS = ["Intent & Type", "Identity & Model", "Knowledge", "Tools & Memory", "Review & Create"];

export default function AgentBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [outputStyle, setOutputStyle] = useState("friendly");
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("GPT-4o");
  const [files, setFiles] = useState<string[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [tools, setTools] = useState<Record<string, boolean>>({ "web-search": true });
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState("2048");

  const [templateFromMarketplace, setTemplateFromMarketplace] = useState<string | null>(null);

  const progress = ((step + 1) / STEPS.length) * 100;

  // Pre-fill from ?template=xxx query param
  useEffect(() => {
    const templateId = searchParams.get("template");
    if (!templateId) return;

    const tmpl = MARKETPLACE_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    setSelectedTemplate(tmpl.id);
    setName(tmpl.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim());
    setObjective(tmpl.description);

    // Enable tools from template
    const newTools: Record<string, boolean> = {};
    tmpl.tools.forEach((t) => { newTools[t] = true; });
    setTools(newTools);

    // Match recommended model to provider
    for (const provider of LLM_MODELS) {
      if (provider.models.includes(tmpl.recommendedModel)) {
        setSelectedProvider(provider.id);
        setSelectedModel(tmpl.recommendedModel);
        break;
      }
    }

    setTemplateFromMarketplace(tmpl.name);
    setStep(1); // Skip to Step 2
    toast.success("โหลด Template สำเร็จ!", { description: `กำลังใช้ "${tmpl.name}" จาก Marketplace` });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddUrl = () => {
    if (urlInput.trim()) {
      setUrls([...urls, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const handleCreate = () => {
    toast.success("🚀 สร้าง Agent สำเร็จ!", { description: `${name || "Agent ใหม่"} พร้อมใช้งานแล้ว` });
    navigate(`/deploy?agent=${encodeURIComponent(name || "new-agent").replace(/%20/g, "-")}`);
  };

  const currentProvider = LLM_MODELS.find((m) => m.id === selectedProvider);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">✨ สร้าง Agent ใหม่</h1>
        <p className="text-muted-foreground text-sm">กรอกข้อมูลทีละขั้นเพื่อสร้าง AI Agent ของคุณ</p>
      </div>

      {/* Stepper */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          {STEPS.map((s, i) => (
            <span key={s} className={`hidden sm:inline ${i === step ? "text-primary font-semibold" : i < step ? "text-brand-green" : "text-muted-foreground"}`}>
              {i < step ? "✅" : i === step ? "👉" : `${i + 1}.`} {s}
            </span>
          ))}
          <span className="sm:hidden text-primary font-semibold">ขั้นตอน {step + 1}/{STEPS.length}: {STEPS[step]}</span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          {/* Step 1: Intent & Type */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">เลือก Template หรือเริ่มจากศูนย์</h2>
              {templateFromMarketplace && (
                <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-4 py-2.5 text-sm">
                  <Store className="h-4 w-4 shrink-0" />
                  <span>ใช้ Template <strong>{templateFromMarketplace}</strong> จาก Marketplace แล้ว — คุณสามารถเปลี่ยนได้ที่นี่</span>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <Card
                  className={`rounded-2xl cursor-pointer transition-all border-2 ${selectedTemplate === "custom" ? "border-primary shadow-md" : "border-transparent hover:border-border"}`}
                  onClick={() => setSelectedTemplate("custom")}
                >
                  <CardContent className="p-5 text-center">
                    <div className="text-3xl mb-2">🎨</div>
                    <h3 className="font-semibold">Custom</h3>
                    <p className="text-xs text-muted-foreground">เริ่มจากศูนย์ กำหนดเอง</p>
                  </CardContent>
                </Card>
                {TEMPLATES.map((t) => (
                  <Card
                    key={t.id}
                    className={`rounded-2xl cursor-pointer transition-all border-2 ${selectedTemplate === t.id ? "border-primary shadow-md" : "border-transparent hover:border-border"}`}
                    onClick={() => { setSelectedTemplate(t.id); setObjective(t.description); }}
                  >
                    <CardContent className="p-5">
                      <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${t.color} mb-3`} />
                      <h3 className="font-semibold text-sm">{t.name}</h3>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Identity & Model */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold">ตั้งชื่อและเลือกสมอง</h2>
              <div className="space-y-4">
                <div>
                  <Label>ชื่อ Agent</Label>
                  <Input placeholder="เช่น Nong Support" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label>หน้าที่ / Objective</Label>
                  <Input placeholder="เช่น ตอบคำถามลูกค้าเกี่ยวกับสินค้า" value={objective} onChange={(e) => setObjective(e.target.value)} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label>โทนเสียง</Label>
                  <Select value={outputStyle} onValueChange={setOutputStyle}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="polite">🙏 สุภาพ</SelectItem>
                      <SelectItem value="friendly">😊 เป็นกันเอง</SelectItem>
                      <SelectItem value="professional">💼 มืออาชีพ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>เลือก LLM Provider</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {LLM_MODELS.map((m) => (
                      <Card
                        key={m.id}
                        className={`rounded-xl cursor-pointer transition-all border-2 ${selectedProvider === m.id ? "border-primary" : "border-transparent hover:border-border"}`}
                        onClick={() => { setSelectedProvider(m.id); setSelectedModel(m.models[0]); }}
                      >
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
                    <Label>เลือก Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {currentProvider.models.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Knowledge */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold">เพิ่มคลังความรู้</h2>
              <Card className="rounded-2xl border-dashed border-2 border-primary/30 hover:border-primary/50 transition-colors">
                <CardContent className="p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-primary/50" />
                  <p className="font-medium mb-1">ลากไฟล์มาวางที่นี่</p>
                  <p className="text-sm text-muted-foreground mb-3">รองรับ PDF, Word, TXT (สูงสุด 20MB)</p>
                  <Button variant="outline" className="rounded-xl" onClick={() => { setFiles([...files, `document_${files.length + 1}.pdf`]); }}>
                    เลือกไฟล์
                  </Button>
                </CardContent>
              </Card>
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-2">
                      <span className="text-sm">📄 {f}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Label>เพิ่ม URL เว็บไซต์</Label>
                <div className="flex gap-2 mt-1">
                  <Input placeholder="https://example.com" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="rounded-xl" onKeyDown={(e) => e.key === "Enter" && handleAddUrl()} />
                  <Button variant="outline" className="rounded-xl" onClick={handleAddUrl}><Link className="h-4 w-4" /></Button>
                </div>
                {urls.map((u, i) => (
                  <div key={i} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-2 mt-2">
                    <span className="text-sm truncate">🔗 {u}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Tools & Memory */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold">เลือกเครื่องมือและความจำ</h2>
              <Card className="rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm">🛠️ Tools</h3>
                  {TOOLS_LIST.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                      <Switch checked={!!tools[t.id]} onCheckedChange={(checked) => setTools({ ...tools, [t.id]: checked })} />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">🧠 จำบริบทการสนทนา</p>
                      <p className="text-xs text-muted-foreground">Agent จะจำสิ่งที่คุยไว้ก่อนหน้า</p>
                    </div>
                    <Switch checked={memoryEnabled} onCheckedChange={setMemoryEnabled} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Advanced & Review */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold">ตรวจสอบและสร้าง Agent</h2>

              {/* Toggle Advanced */}
              <div className="flex items-center gap-2">
                <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                <Label className="text-sm">แสดงการตั้งค่าขั้นสูง</Label>
              </div>

              {showAdvanced && (
                <Card className="rounded-2xl">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <Label>System Prompt</Label>
                      <Textarea placeholder="กำหนด System Prompt แบบละเอียด..." value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="rounded-xl mt-1 min-h-[120px]" />
                    </div>
                    <div>
                      <Label>Temperature: {temperature[0]}</Label>
                      <Slider value={temperature} onValueChange={setTemperature} max={2} step={0.1} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">ค่าน้อย = ตอบตรงประเด็น · ค่ามาก = สร้างสรรค์</p>
                    </div>
                    <div>
                      <Label>Max Tokens</Label>
                      <Input type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} className="rounded-xl mt-1" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Review Summary */}
              <Card className="rounded-2xl bg-secondary/50">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> สรุปการตั้งค่า</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Template:</span> <span className="font-medium">{selectedTemplate || "Custom"}</span></div>
                    <div><span className="text-muted-foreground">ชื่อ:</span> <span className="font-medium">{name || "-"}</span></div>
                    <div><span className="text-muted-foreground">Model:</span> <span className="font-medium">{selectedModel}</span></div>
                    <div><span className="text-muted-foreground">โทนเสียง:</span> <span className="font-medium">{outputStyle}</span></div>
                    <div><span className="text-muted-foreground">ไฟล์:</span> <span className="font-medium">{files.length} ไฟล์</span></div>
                    <div><span className="text-muted-foreground">URLs:</span> <span className="font-medium">{urls.length} URL</span></div>
                    <div><span className="text-muted-foreground">Tools:</span> <span className="font-medium">{Object.values(tools).filter(Boolean).length} เครื่องมือ</span></div>
                    <div><span className="text-muted-foreground">Memory:</span> <span className="font-medium">{memoryEnabled ? "เปิด" : "ปิด"}</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => step > 0 ? setStep(step - 1) : navigate("/dashboard")} >
          <ArrowLeft className="h-4 w-4" />
          {step > 0 ? "ย้อนกลับ" : "Dashboard"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={() => setStep(step + 1)}>
            ถัดไป
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gradient-primary text-primary-foreground rounded-xl gap-2 text-base px-8" onClick={handleCreate}>
            🚀 Create Agent
          </Button>
        )}
      </div>
    </div>
  );
}
