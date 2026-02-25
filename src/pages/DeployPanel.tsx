import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Eye, EyeOff, RefreshCw, Globe, Code, Monitor, Key, Rocket, AlertTriangle, Send, Bot, User } from "lucide-react";
import { toast } from "sonner";

function generateApiKey() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `sk-tm-${rand(8)}-${rand(8)}-${rand(8)}-${rand(8)}`;
}

export default function DeployPanel() {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("agent") || "my-agent";
  const agentName = agentId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const [published, setPublished] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState(() => generateApiKey());
  const [widgetWidth, setWidgetWidth] = useState("400");
  const [widgetHeight, setWidgetHeight] = useState("600");
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");

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

  const maskedKey = useMemo(() => {
    return apiKey.slice(0, 8) + "••••••••••••••••" + apiKey.slice(-4);
  }, [apiKey]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก ${label} แล้ว!`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{agentName}</h1>
            <Badge variant={published ? "default" : "secondary"}>
              {published ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">จัดการการ Deploy และ Integration ของ Agent</p>
        </div>
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

      {/* Tabs */}
      <Tabs defaultValue="api" className="space-y-4">
        <TabsList className="grid grid-cols-4 rounded-xl h-11">
          <TabsTrigger value="api" className="rounded-lg gap-1.5 text-xs sm:text-sm">
            <Globe className="h-4 w-4 hidden sm:block" /> API Endpoint
          </TabsTrigger>
          <TabsTrigger value="embed" className="rounded-lg gap-1.5 text-xs sm:text-sm">
            <Code className="h-4 w-4 hidden sm:block" /> Embed Code
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-lg gap-1.5 text-xs sm:text-sm">
            <Monitor className="h-4 w-4 hidden sm:block" /> Widget Preview
          </TabsTrigger>
          <TabsTrigger value="apikey" className="rounded-lg gap-1.5 text-xs sm:text-sm">
            <Key className="h-4 w-4 hidden sm:block" /> API Key
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: API Endpoint */}
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
                  <code className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm font-mono break-all">
                    {endpoint}
                  </code>
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
                <pre className="bg-muted rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {curlSnippet}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Embed Code */}
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
                <pre className="bg-muted rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {embedCode}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Widget Preview */}
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
                  {/* Widget header */}
                  <div className={`px-4 py-3 flex items-center gap-2 border-b ${previewTheme === "dark" ? "border-zinc-700 bg-zinc-800" : "border-border bg-muted/50"}`}>
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm">🧠</div>
                    <div>
                      <p className="text-sm font-semibold">{agentName}</p>
                      <p className={`text-xs ${previewTheme === "dark" ? "text-zinc-400" : "text-muted-foreground"}`}>Online</p>
                    </div>
                  </div>
                  {/* Chat body */}
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
                  {/* Input */}
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

        {/* Tab 4: API Key */}
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
    </div>
  );
}
