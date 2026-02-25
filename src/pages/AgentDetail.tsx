import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Copy, Eye, EyeOff, RefreshCw, Globe, Code, Monitor, Key, AlertTriangle, Send, Bot, User, ArrowLeft, Info, Pencil, Upload, Trash2, FileText, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUpdateAgent } from "@/hooks/useUpdateAgent";
import { useKnowledgeFiles, useUploadKnowledgeFile, useDeleteKnowledgeFile } from "@/hooks/useKnowledge";
import type { AgentRow } from "@/hooks/useAgents";

function generateApiKey() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `sk-tm-${rand(8)}-${rand(8)}-${rand(8)}-${rand(8)}`;
}

function KnowledgeTab({ agentId }: { agentId: string }) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasProcessing = useRef(false);
  const { data: files = [], isLoading, refetch } = useKnowledgeFiles(agentId);
  const uploadFile = useUploadKnowledgeFile();
  const deleteFile = useDeleteKnowledgeFile();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Auto-refresh every 5s when files are processing
  useEffect(() => {
    hasProcessing.current = files.some(f => f.status === "processing");
    if (!hasProcessing.current) return;
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [files, refetch]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Simulate upload progress
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + Math.random() * 20;
      });
    }, 200);
    uploadFile.mutate({ file, agentId }, {
      onSuccess: () => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 800);
      },
      onError: () => {
        clearInterval(progressInterval);
        setUploadProgress(null);
      },
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusBadge = (status: string) => {
    if (status === "ready") return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{t("knowledge.statusReady")}</Badge>;
    if (status === "processing") return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />{t("knowledge.statusProcessing")}</Badge>;
    return <Badge variant="destructive">{t("knowledge.statusError")}</Badge>;
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{t("knowledge.title")}</CardTitle>
            <CardDescription>{t("knowledge.subtitle")}</CardDescription>
          </div>
          <div className="flex gap-2">
            {files.some(f => f.status === "processing") && (
              <Button variant="outline" className="rounded-xl gap-2" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" /> {t("knowledge.refresh")}
              </Button>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.csv,.json,.docx" className="hidden" onChange={handleFileSelect} />
            <Button className="rounded-xl gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploadFile.isPending}>
              {uploadFile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadFile.isPending ? t("knowledge.uploading") : t("knowledge.upload")}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("knowledge.supportedTypes")}</p>
        {uploadProgress !== null && (
          <div className="space-y-1">
            <Progress value={Math.min(uploadProgress, 100)} className="h-2 rounded-full" />
            <p className="text-xs text-muted-foreground">{uploadProgress >= 100 ? t("knowledge.statusProcessing") : `${t("knowledge.uploading")} ${Math.round(uploadProgress)}%`}</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>{t("knowledge.noFiles")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="bg-secondary/50 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    onClick={() => f.status === "ready" && f.content ? setExpandedId(expandedId === f.id ? null : f.id) : null}
                  >
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{f.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(f.file_size)} · {new Date(f.created_at).toLocaleDateString("th-TH")}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(f.status)}
                    {f.status === "ready" && f.content && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}>
                        {expandedId === f.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("knowledge.deleteConfirm")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("knowledge.deleteConfirmDesc")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteFile.mutate({ id: f.id, filePath: f.file_path })}>{t("common.delete")}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {expandedId === f.id && f.content && (
                  <div className="px-4 pb-3">
                    <div className="bg-background rounded-lg border border-border p-3 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{f.content.length > 3000 ? f.content.substring(0, 3000) + "\n\n... (" + (f.content.length - 3000).toLocaleString() + " characters more)" : f.content}</pre>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{f.content.length.toLocaleString()} {t("knowledge.characters")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get("tab") || "overview";
  const { t } = useLanguage();
  const updateAgent = useUpdateAgent();

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as AgentRow;
    },
    enabled: !!id,
  });

  // Edit state
  const [isEditing, setIsEditing] = useState(defaultTab === "edit");
  const [editName, setEditName] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editProvider, setEditProvider] = useState("");
  const [editSystemPrompt, setEditSystemPrompt] = useState("");
  const [editTemperature, setEditTemperature] = useState([0.7]);
  const [editMaxTokens, setEditMaxTokens] = useState("2048");

  useEffect(() => {
    if (agent) {
      setEditName(agent.name);
      setEditObjective(agent.objective || "");
      setEditModel(agent.model || "");
      setEditProvider(agent.provider || "");
      setEditSystemPrompt(agent.system_prompt || "");
      setEditTemperature([agent.temperature]);
      setEditMaxTokens(String(agent.max_tokens));
    }
  }, [agent]);

  // Deploy state
  const [published, setPublished] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState(() => generateApiKey());
  const [widgetWidth, setWidgetWidth] = useState("400");
  const [widgetHeight, setWidgetHeight] = useState("600");
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [brandName, setBrandName] = useState("");
  const [widgetPosition, setWidgetPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [bubbleSize, setBubbleSize] = useState([60]);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [widgetLang, setWidgetLang] = useState<"th" | "en">("th");

  const agentName = agent?.name || "Agent";
  const agentId = agent?.id || "unknown";
  const endpoint = `https://api.thoughtmind.ai/v1/agents/${agentId}/chat`;

  const curlSnippet = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "สวัสดี", "session_id": "user-123"}'`;

  const widgetBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget`;
  const colorParam = encodeURIComponent(primaryColor);
  const brandParam = encodeURIComponent(brandName || agent?.name || "");

  const positionParam = widgetPosition;
  const bubbleSizeParam = bubbleSize[0];

  const welcomeParam = welcomeMessage ? `&welcome_message=${encodeURIComponent(welcomeMessage)}` : "";

  const scriptEmbedCode = `<script src="${widgetBaseUrl}?agent_id=${agentId}&theme=${previewTheme}&color=${colorParam}&brand=${brandParam}&position=${positionParam}&bubble_size=${bubbleSizeParam}&lang=${widgetLang}${welcomeParam}" defer><\/script>`;

  const iframeEmbedCode = `<iframe
  src="${widgetBaseUrl}?agent_id=${agentId}&mode=fullpage&theme=${previewTheme}&auto_open=true&color=${colorParam}&brand=${brandParam}&position=${positionParam}&bubble_size=${bubbleSizeParam}&lang=${widgetLang}${welcomeParam}"
  width="${widgetWidth}"
  height="${widgetHeight}"
  frameborder="0"
  allow="microphone"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);"
></iframe>`;

  const maskedKey = useMemo(() => apiKey.slice(0, 8) + "••••••••••••••••" + apiKey.slice(-4), [apiKey]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${t("common.copied")} ${label}`);
  };

  const handleSaveEdit = () => {
    if (!agent) return;
    updateAgent.mutate({
      id: agent.id,
      name: editName,
      objective: editObjective || null,
      model: editModel || null,
      provider: editProvider || null,
      system_prompt: editSystemPrompt || null,
      temperature: editTemperature[0],
      max_tokens: parseInt(editMaxTokens) || 2048,
    }, {
      onSuccess: () => setIsEditing(false),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <p className="text-muted-foreground">{t("detail.notFound")}</p>
        <Button variant="outline" className="rounded-xl" onClick={() => navigate("/dashboard")}>{t("detail.backDashboard")}</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">{agent.avatar}</div>
          <div>
            <h1 className="font-display text-2xl font-bold">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">{agent.objective || t("detail.noDescription")}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setIsEditing(!isEditing)}>
          <Pencil className="h-3.5 w-3.5" /> {t("detail.editTab")}
        </Button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <Card className="rounded-2xl border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">{t("detail.editing")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("detail.name")}</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>{t("detail.objective")}</Label>
                <Input value={editObjective} onChange={(e) => setEditObjective(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>{t("detail.model")}</Label>
                <Input value={editModel} onChange={(e) => setEditModel(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>{t("detail.provider")}</Label>
                <Input value={editProvider} onChange={(e) => setEditProvider(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>{t("detail.temperature")}: {editTemperature[0]}</Label>
                <Slider value={editTemperature} onValueChange={setEditTemperature} max={2} step={0.1} className="mt-2" />
              </div>
              <div>
                <Label>{t("detail.maxTokens")}</Label>
                <Input type="number" value={editMaxTokens} onChange={(e) => setEditMaxTokens(e.target.value)} className="rounded-xl mt-1" />
              </div>
            </div>
            <div>
              <Label>{t("detail.systemPrompt")}</Label>
              <Textarea value={editSystemPrompt} onChange={(e) => setEditSystemPrompt(e.target.value)} className="rounded-xl mt-1 min-h-[100px]" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="rounded-xl" onClick={() => setIsEditing(false)}>{t("common.cancel")}</Button>
              <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={handleSaveEdit} disabled={updateAgent.isPending}>
                {t("detail.saveChanges")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue={defaultTab === "edit" ? "overview" : defaultTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 rounded-xl h-11 w-fit">
          <TabsTrigger value="overview" className="rounded-lg gap-1.5">
            <Info className="h-4 w-4" /> {t("detail.overview")}
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="rounded-lg gap-1.5">
            <FileText className="h-4 w-4" /> {t("knowledge.title")}
          </TabsTrigger>
          <TabsTrigger value="deploy" className="rounded-lg gap-1.5">
            <Globe className="h-4 w-4" /> {t("detail.deploy")}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{t("detail.agentDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">{t("detail.name")}</Label>
                  <p className="font-medium">{agent.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("detail.status")}</Label>
                  <div>
                    <Badge variant={agent.status === "published" ? "default" : "secondary"} className="rounded-full">
                      {agent.status === "published" ? t("detail.published") : t("detail.draft")}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("detail.model")}</Label>
                  <p className="font-medium">{agent.model || t("dashboard.notSpecified")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("detail.provider")}</Label>
                  <p className="font-medium">{agent.provider || t("dashboard.notSpecified")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("detail.temperature")}</Label>
                  <p className="font-medium">{agent.temperature}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("detail.maxTokens")}</Label>
                  <p className="font-medium">{agent.max_tokens}</p>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-muted-foreground text-xs">{t("detail.systemPrompt")}</Label>
                  <p className="font-medium text-sm whitespace-pre-wrap">{agent.system_prompt || t("dashboard.notSpecified")}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {t("detail.createdAt")}: {new Date(agent.created_at).toLocaleString("th-TH")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge">
          <KnowledgeTab agentId={agent.id} />
        </TabsContent>

        {/* Deploy Tab */}
        <TabsContent value="deploy" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t("detail.publishAgent")}</p>
            <div className="flex items-center gap-3">
              <Label htmlFor="publish-toggle" className="text-sm">{t("detail.publish")}</Label>
              <Switch
                id="publish-toggle"
                checked={published}
                onCheckedChange={(val) => {
                  setPublished(val);
                  toast.success(val ? t("detail.publishedToast") : t("detail.draftToast"));
                }}
              />
            </div>
          </div>

          <Tabs defaultValue="api" className="space-y-4">
            <TabsList className="grid grid-cols-4 rounded-xl h-11">
              <TabsTrigger value="api" className="rounded-lg gap-1.5 text-xs sm:text-sm">
                <Globe className="h-4 w-4 hidden sm:block" /> API
              </TabsTrigger>
              <TabsTrigger value="embed" className="rounded-lg gap-1.5 text-xs sm:text-sm">
                <Code className="h-4 w-4 hidden sm:block" /> Embed
              </TabsTrigger>
              <TabsTrigger value="preview" className="rounded-lg gap-1.5 text-xs sm:text-sm">
                <Monitor className="h-4 w-4 hidden sm:block" /> Preview
              </TabsTrigger>
              <TabsTrigger value="apikey" className="rounded-lg gap-1.5 text-xs sm:text-sm">
                <Key className="h-4 w-4 hidden sm:block" /> API Key
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">{t("detail.apiEndpoint")}</CardTitle>
                  <CardDescription>{t("detail.apiEndpointDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("detail.endpointUrl")}</Label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm font-mono break-all">{endpoint}</code>
                      <Button size="icon" variant="outline" className="shrink-0 rounded-xl" onClick={() => copyToClipboard(endpoint, "Endpoint")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t("detail.curlExample")}</Label>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => copyToClipboard(curlSnippet, "cURL")}>
                        <Copy className="h-3.5 w-3.5" /> {t("common.copy")}
                      </Button>
                    </div>
                    <pre className="bg-muted rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{curlSnippet}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="embed">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">{t("detail.embedCode")}</CardTitle>
                  <CardDescription>{t("detail.embedCodeDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Customization */}
                  <div className="grid sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">🎨 สี Primary</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="rounded-xl font-mono text-sm flex-1"
                          placeholder="#6366f1"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">✏️ ชื่อแบรนด์</Label>
                      <Input
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="rounded-xl mt-1"
                        placeholder={agent?.name || "ชื่อแบรนด์"}
                      />
                      <p className="text-xs text-muted-foreground">แสดงใน header และ footer ของ widget</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">📍 ตำแหน่ง Widget</Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={widgetPosition === "bottom-left" ? "default" : "outline"}
                          className="rounded-xl flex-1 gap-1.5 text-xs"
                          onClick={() => setWidgetPosition("bottom-left")}
                        >
                          ◁ ซ้ายล่าง
                        </Button>
                        <Button
                          size="sm"
                          variant={widgetPosition === "bottom-right" ? "default" : "outline"}
                          className="rounded-xl flex-1 gap-1.5 text-xs"
                          onClick={() => setWidgetPosition("bottom-right")}
                        >
                          ขวาล่าง ▷
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">⭕ ขนาดปุ่ม Bubble: {bubbleSize[0]}px</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={bubbleSize} onValueChange={setBubbleSize} min={48} max={80} step={2} className="flex-1" />
                        <div
                          className="rounded-full flex items-center justify-center text-primary-foreground shrink-0"
                          style={{
                            width: bubbleSize[0] * 0.6,
                            height: bubbleSize[0] * 0.6,
                            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                            fontSize: bubbleSize[0] * 0.25,
                          }}
                        >
                          💬
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">🌐 ภาษา Widget</Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={widgetLang === "th" ? "default" : "outline"}
                          className="rounded-xl flex-1 gap-1.5 text-xs"
                          onClick={() => setWidgetLang("th")}
                        >
                          🇹🇭 ไทย
                        </Button>
                        <Button
                          size="sm"
                          variant={widgetLang === "en" ? "default" : "outline"}
                          className="rounded-xl flex-1 gap-1.5 text-xs"
                          onClick={() => setWidgetLang("en")}
                        >
                          🇺🇸 English
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-medium">💬 ข้อความต้อนรับ</Label>
                      <Input
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        className="rounded-xl"
                        placeholder="สวัสดีค่ะ! 👋 มีอะไรให้ช่วยไหมคะ?"
                      />
                      <p className="text-xs text-muted-foreground">ข้อความที่แสดงเมื่อเปิด widget (เว้นว่างเพื่อใช้ค่าเริ่มต้น)</p>
                    </div>
                  </div>
                  {/* Script embed */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5"><Code className="h-4 w-4" /> Script Tag (แนะนำ)</Label>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => copyToClipboard(scriptEmbedCode, "Script Code")}>
                        <Copy className="h-3.5 w-3.5" /> {t("common.copy")}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">วางโค้ดนี้ก่อนปิด &lt;/body&gt; ในเว็บไซต์ของคุณ จะแสดงปุ่มแชทลอยมุมขวาล่าง</p>
                    <pre className="bg-muted rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{scriptEmbedCode}</pre>
                  </div>

                  {/* iframe embed */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5"><Monitor className="h-4 w-4" /> iframe Embed</Label>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => copyToClipboard(iframeEmbedCode, "iframe Code")}>
                        <Copy className="h-3.5 w-3.5" /> {t("common.copy")}
                      </Button>
                    </div>
                    <div className="flex gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Width (px)</Label>
                        <Input value={widgetWidth} onChange={(e) => setWidgetWidth(e.target.value)} className="w-28 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Height (px)</Label>
                        <Input value={widgetHeight} onChange={(e) => setWidgetHeight(e.target.value)} className="w-28 rounded-xl" />
                      </div>
                    </div>
                    <pre className="bg-muted rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{iframeEmbedCode}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card className="rounded-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{t("detail.widgetPreview")}</CardTitle>
                      <CardDescription>{t("detail.widgetPreviewDesc")}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Dark</Label>
                      <Switch checked={previewTheme === "dark"} onCheckedChange={(v) => setPreviewTheme(v ? "dark" : "light")} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div
                    className="rounded-2xl border-2 border-border overflow-hidden shadow-lg"
                    style={{ width: Math.min(Number(widgetWidth) || 400, 420), height: Math.min(Number(widgetHeight) || 600, 620) }}
                  >
                    <iframe
                      src={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget?agent_id=${agentId}&mode=fullpage&theme=${previewTheme}&auto_open=true&color=${encodeURIComponent(primaryColor)}&brand=${encodeURIComponent(brandName || agent?.name || "")}&position=${widgetPosition}&bubble_size=${bubbleSize[0]}&lang=${widgetLang}${welcomeParam}`}
                      className="w-full h-full border-none"
                      title="Widget Preview"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="apikey">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">{t("detail.apiKey")}</CardTitle>
                  <CardDescription>{t("detail.apiKeyDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("detail.secretKey")}</Label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm font-mono break-all">
                        {showKey ? apiKey : maskedKey}
                      </code>
                      <Button size="icon" variant="outline" className="shrink-0 rounded-xl" onClick={() => setShowKey(!showKey)}>
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="outline" className="shrink-0 rounded-xl" onClick={() => copyToClipboard(apiKey, "API Key")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl"
                    onClick={() => {
                      setApiKey(generateApiKey());
                      setShowKey(false);
                      toast.success(t("detail.keyRegenerated"));
                    }}
                  >
                    <RefreshCw className="h-4 w-4" /> {t("detail.regenerateKey")}
                  </Button>
                  <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{t("detail.keyWarning")}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
