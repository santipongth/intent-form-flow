import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, Search, Sparkles, Timer, Send } from "lucide-react";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-agent`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface DemoDoc { file_name: string; file_size: number; content: string }
interface DemoSource { file: string; similarity: number; excerpt: string }
interface DemoTimings {
  embed_ms: number; search_ms: number; retrieval_ms: number; answer_ms: number; total_ms: number;
}
interface DemoInfo {
  agent: { name: string; avatar: string; objective: string; model: string; skills: string[] };
  documents: DemoDoc[];
  indexed_chunks: number;
  sample_questions: string[];
}

async function callDemo(payload: Record<string, unknown>) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
  return json;
}

export default function Demo() {
  const [info, setInfo] = useState<DemoInfo | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [sources, setSources] = useState<DemoSource[]>([]);
  const [timings, setTimings] = useState<DemoTimings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDoc, setOpenDoc] = useState<string | null>(null);

  useEffect(() => {
    document.title = "ตัวอย่าง Agent ที่ตอบจากเอกสารจริง | ThoughtMind";
    callDemo({ action: "info" })
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, []);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setAnswer("");
    setSources([]);
    setTimings(null);
    try {
      const r = await callDemo({ question: text });
      setAnswer(r.answer || "");
      setSources(r.sources || []);
      setTimings(r.timings || null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> กลับหน้าแรก
          </Link>
          <Link to="/docs/api" className="text-sm text-primary hover:underline">เอกสารสำหรับนักพัฒนา →</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <section className="space-y-3">
          <Badge variant="secondary" className="rounded-full">Live demo</Badge>
          <h1 className="font-display text-3xl font-bold">
            Agent ตัวอย่าง — ถามแล้วตอบจากไฟล์จริงที่อัปโหลดไว้
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            เอกสารสองไฟล์ด้านล่างถูกอัปโหลดและทำดัชนีไว้จริงในระบบ ทุกคำตอบมาจากเนื้อหาในไฟล์เท่านั้น
            พร้อมแสดงข้อความต้นทางที่ถูกค้นเจอ และเวลาที่ใช้ค้นเอกสารกับเวลาที่ใช้ตอบ
          </p>
          {info && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{info.agent.avatar} <strong className="text-foreground">{info.agent.name}</strong></span>
              <Badge variant="outline" className="rounded-full">{info.agent.model}</Badge>
              <Badge variant="outline" className="rounded-full">{info.indexed_chunks} ชิ้นส่วนที่ทำดัชนีแล้ว</Badge>
              {info.agent.skills.map((s) => (
                <Badge key={s} variant="secondary" className="rounded-full">{s}</Badge>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {(info?.documents || []).map((d) => (
            <Card key={d.file_name} className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> {d.file_name}
                </CardTitle>
                <CardDescription>{(d.file_size / 1024).toFixed(1)} KB · เอกสารจริงที่ Agent ใช้ตอบ</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className={`text-xs whitespace-pre-wrap font-mono text-muted-foreground overflow-hidden ${openDoc === d.file_name ? "" : "max-h-32"}`}>
                  {d.content}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 px-0"
                  onClick={() => setOpenDoc(openDoc === d.file_name ? null : d.file_name)}
                >
                  {openDoc === d.file_name ? "ย่อเอกสาร" : "ดูเอกสารทั้งไฟล์"}
                </Button>
              </CardContent>
            </Card>
          ))}
          {!info && !error && (
            <>
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(info?.sample_questions || []).map((q) => (
              <Button key={q} variant="outline" size="sm" className="rounded-full" onClick={() => { setQuestion(q); ask(q); }}>
                {q}
              </Button>
            ))}
          </div>

          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="ถามอะไรก็ได้เกี่ยวกับราคา แพ็กเกจ SLA หรือการคืนเงินในเอกสารด้านบน"
                className="rounded-xl min-h-24"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(question);
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">กด ⌘/Ctrl + Enter เพื่อส่ง</p>
                <Button onClick={() => ask(question)} disabled={loading || !question.trim()} className="rounded-xl gap-2">
                  <Send className="h-4 w-4" /> {loading ? "กำลังคิด..." : "ถาม Agent"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="rounded-2xl border-destructive/40">
              <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
            </Card>
          )}

          {loading && <Skeleton className="h-32 rounded-2xl" />}

          {answer && !loading && (
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> คำตอบจากเอกสาร
                </CardTitle>
                {timings && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary" className="rounded-full gap-1">
                      <Search className="h-3 w-3" /> ค้นเอกสาร {timings.retrieval_ms}ms
                    </Badge>
                    <Badge variant="secondary" className="rounded-full gap-1">
                      <Sparkles className="h-3 w-3" /> ตอบ {timings.answer_ms}ms
                    </Badge>
                    <Badge variant="outline" className="rounded-full gap-1">
                      <Timer className="h-3 w-3" /> รวม {timings.total_ms}ms
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{answer}</p>
                {sources.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">ข้อความต้นทางที่ใช้ตอบ</p>
                    {sources.map((s, i) => (
                      <div key={i} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-medium truncate">{s.file}</span>
                          {s.similarity > 0 && (
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              ความใกล้เคียง {(s.similarity * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground whitespace-pre-wrap">{s.excerpt}…</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
