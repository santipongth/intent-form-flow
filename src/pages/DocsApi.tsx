import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ArrowLeft, Key, Zap, RefreshCw, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-api`;

const copy = (text: string, label = "code") => {
  navigator.clipboard.writeText(text);
  toast.success(`Copied ${label}`);
};

const Block = ({ code, label }: { code: string; label?: string }) => (
  <div className="relative">
    <pre className="bg-muted rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{code}</pre>
    <Button
      size="sm"
      variant="ghost"
      className="absolute top-2 right-2 gap-1.5 text-xs"
      onClick={() => copy(code, label)}
    >
      <Copy className="h-3.5 w-3.5" /> Copy
    </Button>
  </div>
);

const curl = `curl -X POST "${endpoint}" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello",
    "session_id": "user-123"
  }'`;

const curlStream = `curl -N -X POST "${endpoint}" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "message": "Tell me a story", "stream": true }'`;

const curlReset = `curl -X POST "${endpoint}" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "session_id": "user-123", "reset": true }'`;

const js = `const res = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "x-api-key": process.env.AGENT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: "Hello",
    session_id: "user-123", // optional — reuse to keep memory
  }),
});
if (!res.ok) throw new Error(await res.text());
const data = await res.json();
console.log(data.reply);`;

const jsStream = `const res = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "x-api-key": process.env.AGENT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ message: "Tell me a story", stream: true }),
});
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buf = "";
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  let i;
  while ((i = buf.indexOf("\\n")) !== -1) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line.startsWith("data: ")) continue;
    const payload = line.slice(6);
    if (payload === "[DONE]") return;
    const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
    if (delta) process.stdout.write(delta);
  }
}`;

const py = `import os, requests

r = requests.post(
    "${endpoint}",
    headers={"x-api-key": os.environ["AGENT_API_KEY"]},
    json={"message": "Hello", "session_id": "user-123"},
    timeout=60,
)
r.raise_for_status()
print(r.json()["reply"])`;

const pyStream = `import os, json, requests

with requests.post(
    "${endpoint}",
    headers={"x-api-key": os.environ["AGENT_API_KEY"]},
    json={"message": "Tell me a story", "stream": True},
    stream=True,
    timeout=120,
) as r:
    r.raise_for_status()
    for line in r.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data: "):
            continue
        payload = line[6:]
        if payload == "[DONE]":
            break
        delta = json.loads(payload)["choices"][0]["delta"].get("content")
        if delta:
            print(delta, end="", flush=True)`;

const response200 = `{
  "reply": "Hi! How can I help?",
  "tokens_used": 128,
  "response_time_ms": 842,
  "model": "google/gemini-2.5-flash",
  "session_id": "user-123",
  "conversation_id": "5f0e..."
}`;

const errors: Array<[string, string]> = [
  ["400", "Body missing message/messages, or messages array > 100 / message > 32k chars"],
  ["401", "Missing or invalid x-api-key (revoked, malformed, or unknown)"],
  ["403", "Agent is not Published — toggle Publish in the Deploy tab"],
  ["404", "Agent for this API key no longer exists"],
  ["413", "Request body exceeds 256 KB"],
  ["429", "Rate limit 60 req/min per key — read Retry-After header"],
  ["402", "Lovable AI credits exhausted — top up workspace credits"],
  ["502", "Upstream AI provider error (transient — retry with backoff)"],
];

export default function DocsApi() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>API Docs — ThoughtMind Agent API</title>
        <meta name="description" content="Developer reference for the ThoughtMind Agent API: authentication, endpoints, streaming, session memory and error codes." />
        <link rel="canonical" href="/docs/api" />
      </Helmet>

      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="rounded-xl gap-1.5">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl gap-1.5">
            <Link to="/dashboard"><Key className="h-4 w-4" /> Get an API key</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <section className="space-y-3">
          <h1 className="font-display text-4xl font-bold">Agent API</h1>
          <p className="text-muted-foreground text-lg">
            One REST endpoint to chat with any of your published agents. Stateless by default,
            stateful with <code className="px-1.5 py-0.5 rounded bg-muted text-sm">session_id</code>, streaming with <code className="px-1.5 py-0.5 rounded bg-muted text-sm">stream: true</code>.
          </p>
        </section>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Base endpoint</CardTitle>
            <CardDescription>All requests are <code>POST</code> JSON to the same URL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <code className="block bg-muted rounded-xl px-4 py-3 text-sm font-mono break-all">{endpoint}</code>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Authenticate with header <code className="px-1 rounded bg-muted">x-api-key: sk-tm-...</code></li>
              <li>Content-Type <code className="px-1 rounded bg-muted">application/json</code></li>
              <li>Body ≤ 256 KB · message ≤ 32 000 chars · messages ≤ 100 entries</li>
              <li>Rate limit <strong>60 req/min</strong> per API key</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Key className="h-5 w-5" /> Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Create a key from your agent's <strong>Deploy → API Keys</strong> section. Keys look like <code className="px-1 rounded bg-muted">sk-tm-&lt;48 hex chars&gt;</code> and are shown <strong>once</strong> on creation.</p>
            <p className="text-muted-foreground">Each key is bound to a single agent and a single owner. Revoking a key in the dashboard immediately rejects further requests with <code>401</code>.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Request body</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden text-sm">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr><th className="text-left p-3">Field</th><th className="text-left p-3">Type</th><th className="text-left p-3">Description</th></tr>
                </thead>
                <tbody>
                  <tr className="border-t"><td className="p-3 font-mono">message</td><td className="p-3">string</td><td className="p-3">A single user message. Mutually exclusive with <code>messages</code>.</td></tr>
                  <tr className="border-t"><td className="p-3 font-mono">messages</td><td className="p-3">array</td><td className="p-3">Multi-turn list <code>{`{role, content}`}</code> (roles: user / assistant / system). 1–100 items.</td></tr>
                  <tr className="border-t"><td className="p-3 font-mono">session_id</td><td className="p-3">string?</td><td className="p-3">Opaque ID (≤128 chars). Reuse to make the agent remember previous turns server-side.</td></tr>
                  <tr className="border-t"><td className="p-3 font-mono">stream</td><td className="p-3">boolean?</td><td className="p-3">When <code>true</code>, response is <code>text/event-stream</code> SSE chunks.</td></tr>
                  <tr className="border-t"><td className="p-3 font-mono">reset</td><td className="p-3">boolean?</td><td className="p-3">With <code>session_id</code>, deletes that session's history. Combine with <code>message</code> to start fresh.</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Examples</CardTitle>
            <CardDescription>Copy-paste ready. Replace <code>YOUR_API_KEY</code>.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="curl" className="space-y-3">
              <TabsList className="rounded-xl">
                <TabsTrigger value="curl" className="rounded-lg">cURL</TabsTrigger>
                <TabsTrigger value="js" className="rounded-lg">JavaScript</TabsTrigger>
                <TabsTrigger value="py" className="rounded-lg">Python</TabsTrigger>
              </TabsList>
              <TabsContent value="curl" className="space-y-4">
                <div><h3 className="text-sm font-semibold mb-2">Single message</h3><Block code={curl} label="curl" /></div>
                <div><h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Zap className="h-4 w-4" /> Streaming (SSE)</h3><Block code={curlStream} label="curl stream" /></div>
                <div><h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><RefreshCw className="h-4 w-4" /> Reset session memory</h3><Block code={curlReset} label="curl reset" /></div>
              </TabsContent>
              <TabsContent value="js" className="space-y-4">
                <div><h3 className="text-sm font-semibold mb-2">fetch</h3><Block code={js} label="JS" /></div>
                <div><h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Zap className="h-4 w-4" /> Streaming</h3><Block code={jsStream} label="JS stream" /></div>
              </TabsContent>
              <TabsContent value="py" className="space-y-4">
                <div><h3 className="text-sm font-semibold mb-2">requests</h3><Block code={py} label="Python" /></div>
                <div><h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Zap className="h-4 w-4" /> Streaming</h3><Block code={pyStream} label="Python stream" /></div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Response (200 OK)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Block code={response200} label="response" />
            <p className="text-xs text-muted-foreground">For <code>stream: true</code> the body is a sequence of <code>data: {`{json}`}</code> SSE lines terminated by <code>data: [DONE]</code>, identical in shape to OpenAI's chat-completions stream.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Session memory</CardTitle>
            <CardDescription>How <code>session_id</code> behaves on the server.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>• Same <code>session_id</code> + same API key ⇒ same conversation. The server prepends up to the last 40 messages to the prompt automatically.</p>
            <p>• Omit <code>session_id</code> for stateless one-off calls.</p>
            <p>• To wipe memory (e.g. between test runs), POST <code>{`{ "session_id": "...", "reset": true }`}</code>. Add <code>message</code> in the same call to immediately start a new conversation.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden text-sm">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr><th className="text-left p-3 w-24">Status</th><th className="text-left p-3">Meaning</th></tr>
                </thead>
                <tbody>
                  {errors.map(([code, desc]) => (
                    <tr key={code} className="border-t"><td className="p-3 font-mono">{code}</td><td className="p-3">{desc}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Error body shape: <code>{`{ "error": "...", "status"?: number }`}</code>. Retry <code>429</code> after the seconds in <code>Retry-After</code>; retry <code>502</code> with exponential backoff.</p>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground pt-6">
          Need help? Open the Deploy tab on any agent for the same examples pre-filled with that agent's endpoint.
        </div>
      </main>
    </div>
  );
}