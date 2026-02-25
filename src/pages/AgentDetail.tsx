import { useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Eye, EyeOff, RefreshCw, Globe, Code, Monitor, Key, AlertTriangle, Send, Bot, User, ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";
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
    toast.success(`คัดลอก ${label} แล้ว!`);
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
        <p className="text-muted-foreground">ไม่พบ Agent</p>
        <Button variant="outline" className="rounded-xl" onClick={() => navigate("/dashboard")}>กลับ Dashboard</Button>
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">{agent.avatar}</div>
          <div>
            <h1 className="font-display text-2xl font-bold">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">{agent.objective || "ไม่มีคำอธิบาย"}</p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 rounded-xl h-11 w-fit">
          <TabsTrigger value="overview" className="rounded-lg gap-1.5">
            <Info className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="deploy" className="rounded-lg gap-1.5">
            <Globe className="h-4 w-4" /> Deploy
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">รายละเอียด Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">ชื่อ</Label>
                  <p className="font-medium">{agent.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">สถานะ</Label>
                  <div>
                    <Badge variant={agent.status === "published" ? "default" : "secondary"} className="rounded-full">
                      {agent.status === "published" ? "🟢 Published" : "📝 Draft"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Model</Label>
                  <p className="font-medium">{agent.model || "ไม่ระบุ"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Provider</Label>
                  <p className="font-medium">{agent.provider || "ไม่ระบุ"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Temperature</Label>
                  <p className="font-medium">{agent.temperature}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Max Tokens</Label>
                  <p className="font-medium">{agent.max_tokens}</p>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-muted-foreground text-xs">System Prompt</Label>
                  <p className="font-medium text-sm whitespace-pre-wrap">{agent.system_prompt || "ไม่ระบุ"}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                สร้างเมื่อ: {new Date(agent.created_at).toLocaleString("th-TH")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deploy Tab */}
        <TabsContent value="deploy" className="space-y-4">
          {/* Publish toggle */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">เผยแพร่ Agent เพื่อใช้งานผ่าน API และ Widget</p>
            <div className="flex items-center gap-3">
              <Label htmlFor="publish-toggle" className="text-sm">Publish</Label>
              <Switch
                id="publish-toggle"
                checked={published}
                onCheckedChange={(val) => {
                  setPublished(val);
                  toast.success(val ? "Agent เผยแพร่แล้ว!" : "Agent ถูกเปลี่ยนเป็น Draft");
                }}
              />
            </div>
          </div>

          {/* Deploy sub-tabs */}
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
                  <CardTitle className="text-lg">API Endpoint</CardTitle>
                  <CardDescription>ใช้ endpoint นี้เพื่อส่งข้อความไปยัง Agent ผ่าน REST API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Endpoint URL</Label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm font-mono break-all">{endpoint}</code>
                      <Button size="icon" variant="outline" className="shrink-0 rounded-xl" onClick={() => copyToClipboard(endpoint, "Endpoint")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>cURL Example</Label>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => copyToClipboard(curlSnippet, "cURL")}>
                        <Copy className="h-3.5 w-3.5" /> Copy
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
                  <CardTitle className="text-lg">Embed Code</CardTitle>
                  <CardDescription>วาง code นี้ในเว็บไซต์ของคุณเพื่อแสดง chat widget</CardDescription>
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
                      <Label>Embed Snippet</Label>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => copyToClipboard(embedCode, "Embed Code")}>
                        <Copy className="h-3.5 w-3.5" /> Copy
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
                      <CardTitle className="text-lg">Widget Preview</CardTitle>
                      <CardDescription>ตัวอย่างการแสดงผล chat widget</CardDescription>
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
                          <span className={`text-sm flex-1 ${previewTheme === "dark" ? "text-zinc-500" : "text-muted-foreground"}`}>พิมพ์ข้อความ...</span>
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
                  <CardTitle className="text-lg">API Key</CardTitle>
                  <CardDescription>ใช้ key นี้สำหรับ authentication เมื่อเรียก API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
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
                      toast.success("API Key ถูกสร้างใหม่แล้ว!");
                    }}
                  >
                    <RefreshCw className="h-4 w-4" /> Regenerate Key
                  </Button>
                  <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>อย่าแชร์ API Key กับผู้อื่น — ใช้ฝั่ง server เท่านั้น ห้ามใส่ใน client-side code</span>
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
