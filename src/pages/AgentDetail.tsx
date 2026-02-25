import { useState, useMemo, useEffect } from "react";
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
import { Copy, Eye, EyeOff, RefreshCw, Globe, Code, Monitor, Key, AlertTriangle, Send, Bot, User, ArrowLeft, Info, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUpdateAgent } from "@/hooks/useUpdateAgent";
import type { AgentRow } from "@/hooks/useAgents";

function generateApiKey() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `sk-tm-${rand(8)}-${rand(8)}-${rand(8)}-${rand(8)}`;
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

  const agentName = agent?.name || "Agent";
  const agentId = agent?.id || "unknown";
  const endpoint = `https://api.thoughtmind.ai/v1/agents/${agentId}/chat`;

  const curlSnippet = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "สวัสดี", "session_id": "user-123"}'`;

  const embedCode = `<iframe
  src="https://widget.thoughtmind.ai/chat/${agentId}"
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
        <TabsList className="grid grid-cols-2 rounded-xl h-11 w-fit">
          <TabsTrigger value="overview" className="rounded-lg gap-1.5">
            <Info className="h-4 w-4" /> {t("detail.overview")}
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
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="space-y-1.5">
                      <Label>Width (px)</Label>
                      <Input value={widgetWidth} onChange={(e) => setWidgetWidth(e.target.value)} className="w-28 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Height (px)</Label>
                      <Input value={widgetHeight} onChange={(e) => setWidgetHeight(e.target.value)} className="w-28 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t("detail.embedSnippet")}</Label>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => copyToClipboard(embedCode, "Embed Code")}>
                        <Copy className="h-3.5 w-3.5" /> {t("common.copy")}
                      </Button>
                    </div>
                    <pre className="bg-muted rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{embedCode}</pre>
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
                    <div className={`h-full flex flex-col ${previewTheme === "dark" ? "bg-zinc-900 text-zinc-100" : "bg-background text-foreground"}`}>
                      <div className={`px-4 py-3 flex items-center gap-2 border-b ${previewTheme === "dark" ? "border-zinc-700 bg-zinc-800" : "border-border bg-muted/50"}`}>
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm">🧠</div>
                        <div>
                          <p className="text-sm font-semibold">{agentName}</p>
                          <p className={`text-xs ${previewTheme === "dark" ? "text-zinc-400" : "text-muted-foreground"}`}>Online</p>
                        </div>
                      </div>
                      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                        <div className="flex gap-2 items-end">
                          <Bot className="h-5 w-5 shrink-0 text-primary" />
                          <div className={`rounded-2xl rounded-bl-sm px-3 py-2 text-sm max-w-[80%] ${previewTheme === "dark" ? "bg-zinc-800" : "bg-muted"}`}>
                            สวัสดีค่ะ! 👋 มีอะไรให้ช่วยไหมคะ?
                          </div>
                        </div>
                        <div className="flex gap-2 items-end justify-end">
                          <div className="rounded-2xl rounded-br-sm px-3 py-2 text-sm max-w-[80%] gradient-primary text-primary-foreground">
                            อยากรู้เกี่ยวกับ ThoughtMind
                          </div>
                          <User className="h-5 w-5 shrink-0 text-muted-foreground" />
                        </div>
                        <div className="flex gap-2 items-end">
                          <Bot className="h-5 w-5 shrink-0 text-primary" />
                          <div className={`rounded-2xl rounded-bl-sm px-3 py-2 text-sm max-w-[80%] ${previewTheme === "dark" ? "bg-zinc-800" : "bg-muted"}`}>
                            ThoughtMind เป็นแพลตฟอร์มสร้าง AI Agent อัจฉริยะที่ช่วยให้คุณ...
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-2 border-t ${previewTheme === "dark" ? "border-zinc-700" : "border-border"}`}>
                        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${previewTheme === "dark" ? "bg-zinc-800" : "bg-muted"}`}>
                          <span className={`text-sm flex-1 ${previewTheme === "dark" ? "text-zinc-500" : "text-muted-foreground"}`}>{t("chat.typePlaceholder")}</span>
                          <Send className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </div>
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
