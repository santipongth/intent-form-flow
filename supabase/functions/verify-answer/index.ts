// Groundedness check: compare an agent answer against the passages that were
// actually indexed from the user's uploaded knowledge files, so the UI can warn
// when the agent said something the documents do not support.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { retrieveKnowledge } from "../_shared/embeddings.ts";
import { TraceRecorder } from "../_shared/traces.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const VERDICTS = ["supported", "partially_supported", "unsupported", "contradicted"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id, question, answer, conversation_id } = await req.json();
    if (!agent_id || typeof answer !== "string" || !answer.trim()) {
      return json({ error: "agent_id and answer are required" }, 400);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY is not configured" }, 500);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: agent } = await supabase
      .from("agents").select("id").eq("id", agent_id).eq("user_id", user.id).maybeSingle();
    if (!agent) return json({ error: "Agent not found" }, 404);

    const query = `${String(question || "").slice(0, 1000)}\n${answer.slice(0, 2000)}`;
    const passages = await retrieveKnowledge(supabase, agent_id, query, apiKey);
    if (!passages || passages.length === 0) {
      return json({ status: "skipped", reason: "no_indexed_knowledge" });
    }

    const excerpts = passages
      .map((p: any, i: number) => `[${i + 1}] (${p.file_name})\n${String(p.content).slice(0, 1500)}`)
      .join("\n\n");

    const prompt = `คุณคือผู้ตรวจสอบข้อเท็จจริง ตรวจว่า "คำตอบ" สอดคล้องกับ "ข้อความจากเอกสารที่ผู้ใช้อัปโหลด" หรือไม่

ข้อความจากเอกสาร:
${excerpts}

คำถามผู้ใช้: ${String(question || "").slice(0, 1000)}

คำตอบของ Agent:
${answer.slice(0, 6000)}

ตอบกลับเป็น JSON เท่านั้น รูปแบบ:
{"verdict":"supported|partially_supported|unsupported|contradicted","issues":["ข้อความในคำตอบที่ไม่ตรงหรือไม่มีในเอกสาร"],"summary":"สรุปสั้น 1 ประโยคเป็นภาษาเดียวกับคำตอบ"}

เกณฑ์: supported = ทุกข้อเท็จจริงมีในเอกสาร, partially_supported = บางส่วนไม่มีในเอกสาร,
unsupported = สาระสำคัญไม่มีในเอกสาร, contradicted = ขัดแย้งกับเอกสาร
ถ้าคำตอบเป็นการทักทาย/ถามกลับ/ไม่มีข้อเท็จจริงให้ตอบ verdict = "supported" และ issues = []`;

    const trace = new TraceRecorder(supabase, {
      agentId: agent_id, userId: user.id, conversationId: conversation_id ?? null, source: "chat",
    });
    const started = Date.now();

    const r = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        stream: false,
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error("[verify-answer] gateway error", r.status, detail.slice(0, 300));
      return json({ status: "skipped", reason: "verifier_unavailable" });
    }

    const raw = (await r.json()).choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw.replace(/^```json/i, "").replace(/```$/, "").trim());
    } catch { /* ignore */ }

    const verdict = VERDICTS.includes(parsed.verdict) ? parsed.verdict : "supported";
    const issues = Array.isArray(parsed.issues)
      ? parsed.issues.filter((i: unknown) => typeof i === "string" && i.trim()).slice(0, 5)
      : [];

    const result = {
      status: "checked",
      verdict,
      grounded: verdict === "supported",
      issues,
      summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 400) : "",
      sources: passages.map((p: any) => ({
        file_name: p.file_name,
        similarity: Number(Number(p.similarity ?? 0).toFixed(3)),
      })),
    };

    trace.record({
      span_type: "answer",
      name: "groundedness check",
      input: { question: String(question || "").slice(0, 500) },
      output: { verdict, issues, sources: result.sources },
      status: result.grounded ? "success" : "error",
      duration_ms: Date.now() - started,
    });
    await trace.flush();

    return json(result);
  } catch (e) {
    console.error("verify-answer error:", e);
    return json({ status: "skipped", reason: "error" });
  }
});
