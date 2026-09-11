// Public showcase endpoint for the /demo page.
// Runs a real, published demo agent over real uploaded documents so developers
// can see grounded answers, sources and per-stage timings without signing in.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  chunkText,
  embedTexts,
  renderKnowledgeContext,
  retrieveKnowledgeDetailed,
} from "../_shared/embeddings.ts";
import { TraceRecorder } from "../_shared/traces.ts";
import { supportsCustomTemperature } from "../_shared/models.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEMO_MODEL = "openai/gpt-5";

const SAMPLE_QUESTIONS = [
  "แพ็กเกจ Pro ราคาเท่าไหร่ และได้กี่ข้อความต่อเดือน?",
  "ถ้าใช้ Business แล้วส่งข้อความเกินโควตา คิดเงินยังไง?",
  "P1 บนแพ็กเกจ Business ต้องตอบกลับภายในกี่ชั่วโมง?",
  "ถ้า uptime เดือนนี้อยู่ที่ 97% จะได้เครดิตคืนกี่เปอร์เซ็นต์?",
  "ขอคืนเงินได้ภายในกี่วัน?",
];

// naive per-instance rate limit: 20 questions / 10 min / IP
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 600_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 20;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const apiKey = Deno.env.get("LOVABLE_API_KEY") || "";

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "info" ? "info" : "ask";

    const { data: agent } = await supabase
      .from("agents")
      .select("id, user_id, name, avatar, objective, model, temperature, system_prompt, tools, status")
      .eq("template", "__demo__")
      .eq("status", "published")
      .maybeSingle();

    if (!agent) return json({ error: "Demo agent is not available" }, 404);

    const { data: files } = await supabase
      .from("knowledge_files")
      .select("id, file_name, file_size, content")
      .eq("agent_id", agent.id)
      .eq("status", "ready")
      .order("file_name", { ascending: true });

    const skills: string[] = Array.isArray((agent.tools as any)?._skills)
      ? (agent.tools as any)._skills
      : [];

    if (action === "info") {
      const { count } = await supabase
        .from("knowledge_chunks")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agent.id);
      return json({
        agent: {
          name: agent.name,
          avatar: agent.avatar,
          objective: agent.objective,
          model: agent.model || DEMO_MODEL,
          skills,
          system_prompt: agent.system_prompt,
        },
        documents: (files || []).map((f) => ({
          file_name: f.file_name,
          file_size: f.file_size,
          content: f.content,
        })),
        indexed_chunks: count || 0,
        sample_questions: SAMPLE_QUESTIONS,
      });
    }

    const question = typeof body?.question === "string" ? body.question.trim() : "";
    if (!question || question.length > 1000) {
      return json({ error: "question must be a non-empty string up to 1000 chars" }, 400);
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    if (rateLimited(ip)) return json({ error: "Too many demo questions. Try again in a few minutes." }, 429);

    const trace = new TraceRecorder(supabase, {
      agentId: agent.id,
      userId: agent.user_id,
      source: "widget",
    });

    // ---- Lazy indexing: embed demo documents once, then reuse ----
    const indexStart = Date.now();
    let indexedNow = 0;
    const { count: chunkCount } = await supabase
      .from("knowledge_chunks")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agent.id);
    if (!chunkCount && files && files.length > 0 && apiKey) {
      for (const f of files) {
        const chunks = chunkText(f.content || "", 900, 120);
        if (chunks.length === 0) continue;
        const vectors = await embedTexts(chunks, apiKey);
        const rows = chunks.map((c, i) => ({
          file_id: f.id,
          agent_id: agent.id,
          user_id: agent.user_id,
          file_name: f.file_name,
          chunk_index: i,
          content: c,
          embedding: JSON.stringify(vectors[i]),
        }));
        const { error } = await supabase.from("knowledge_chunks").insert(rows);
        if (error) console.error("[demo] index insert failed", error.message);
        else indexedNow += rows.length;
      }
      if (indexedNow > 0) {
        trace.record({
          span_type: "retrieval",
          name: "index demo documents",
          output: { chunks: indexedNow },
          duration_ms: Date.now() - indexStart,
        });
      }
    }

    // ---- Retrieval ----
    const rag = await retrieveKnowledgeDetailed(supabase, agent.id, question, apiKey);
    let systemPrompt = agent.system_prompt || "Answer only from the reference documents.";
    let sources: { file: string; similarity: number; excerpt: string }[] = [];

    if (rag.passages && rag.passages.length > 0) {
      systemPrompt += renderKnowledgeContext(rag.passages);
      sources = rag.passages.map((p) => ({
        file: p.file_name,
        similarity: Number((p.similarity ?? 0).toFixed(3)),
        excerpt: p.content.slice(0, 320),
      }));
    } else if (files && files.length > 0) {
      let ctx = "\n\n---\nReference Documents:\n";
      for (const f of files) ctx += `[${f.file_name}]\n${(f.content || "").slice(0, 8000)}\n\n`;
      systemPrompt += ctx + "---";
      sources = files.map((f) => ({ file: f.file_name, similarity: 0, excerpt: (f.content || "").slice(0, 320) }));
    }

    trace.record({
      span_type: "retrieval",
      name: rag.passages ? "semantic knowledge search" : "full document context",
      input: { question: question.slice(0, 500) },
      output: {
        matches: sources.map((s) => ({ file: s.file, similarity: s.similarity })),
        embed_ms: rag.embedMs,
        search_ms: rag.searchMs,
      },
      duration_ms: rag.totalMs,
    });

    if (skills.length > 0) {
      systemPrompt += `\n\n---\nSpecialised skills you must apply:\n${skills.map((s) => `- ${s}`).join("\n")}\n---`;
    }

    // ---- Answer ----
    const answerStart = Date.now();
    const model = agent.model || DEMO_MODEL;
    const resp = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        ...(supportsCustomTemperature(model) ? { temperature: agent.temperature ?? 0.7 } : {}),
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.error("[demo] gateway error", resp.status, detail.slice(0, 300));
      trace.record({ span_type: "error", name: "ai gateway", status: "error", output: { status: resp.status } });
      await trace.flush();
      const status = resp.status === 429 ? 429 : resp.status === 402 ? 402 : 502;
      return json({ error: "AI provider error", status: resp.status }, status);
    }

    const data = await resp.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "";
    const answerMs = Date.now() - answerStart;

    trace.record({
      span_type: "answer",
      name: model,
      output: { tokens_used: data.usage?.total_tokens ?? null },
      duration_ms: answerMs,
    });
    await trace.flush();

    try {
      await supabase.from("agent_analytics_events").insert({
        agent_id: agent.id,
        user_id: agent.user_id,
        event_type: "demo_chat",
        status: "success",
        response_time_ms: rag.totalMs + answerMs,
        tokens_used: data.usage?.total_tokens ?? null,
        metadata: { search_ms: rag.totalMs, answer_ms: answerMs },
      });
    } catch (_) { /* ignore */ }

    return json({
      answer,
      model,
      sources,
      timings: {
        embed_ms: rag.embedMs,
        search_ms: rag.searchMs,
        retrieval_ms: rag.totalMs,
        answer_ms: answerMs,
        total_ms: rag.totalMs + answerMs,
      },
      indexed_now: indexedNow,
      tokens_used: data.usage?.total_tokens ?? null,
    });
  } catch (e) {
    console.error("[demo] error", (e as Error).message);
    return json({ error: "Demo request failed" }, 500);
  }
});
