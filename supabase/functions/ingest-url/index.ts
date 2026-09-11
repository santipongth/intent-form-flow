import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chunkText, embedTexts } from "../_shared/embeddings.ts";
import { normalizePublicUrl } from "../_shared/url-safety.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

function cleanText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, 100_000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let recordId = "";
  let admin: ReturnType<typeof createClient> | null = null;
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey || !firecrawlKey || !aiKey) {
      throw new Error("URL ingestion is not configured");
    }

    const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authError } = await caller.auth.getUser();
    if (authError || !authData.user) return json({ error: "Invalid session" }, 401);

    const body = await req.json().catch(() => ({}));
    recordId = typeof body.knowledge_file_id === "string" ? body.knowledge_file_id : "";
    if (!recordId) return json({ error: "knowledge_file_id is required" }, 400);

    admin = createClient(supabaseUrl, serviceKey);
    const { data: source, error: sourceError } = await admin
      .from("knowledge_files")
      .select("id, agent_id, user_id, source_url, source_type")
      .eq("id", recordId)
      .eq("user_id", authData.user.id)
      .single();
    if (sourceError || !source || source.source_type !== "url" || !source.source_url) {
      return json({ error: "URL source not found" }, 404);
    }

    const sourceUrl = normalizePublicUrl(source.source_url);
    await admin.from("knowledge_files").update({ status: "processing", error_message: null }).eq("id", recordId);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    let response: Response;
    try {
      response = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl, formats: ["markdown"], onlyMainContent: true, timeout: 15000 }),
      });
    } finally {
      clearTimeout(timeout);
    }
    const raw = await response.text();
    if (!response.ok) throw new Error(`Page extraction failed (${response.status}): ${raw.slice(0, 300)}`);
    const result = JSON.parse(raw);
    const payload = result.data ?? result;
    const content = cleanText(payload.markdown ?? "");
    const title = cleanText(payload.metadata?.title ?? new URL(sourceUrl).hostname).slice(0, 255);
    if (!content) throw new Error("No readable content was found on this page");

    const chunks = chunkText(content).slice(0, 400);
    await admin.from("knowledge_chunks").delete().eq("file_id", recordId);
    for (let i = 0; i < chunks.length; i += 32) {
      const batch = chunks.slice(i, i + 32);
      const vectors = await embedTexts(batch, aiKey);
      const rows = batch.map((text, offset) => ({
        file_id: recordId,
        agent_id: source.agent_id,
        user_id: source.user_id,
        file_name: title,
        chunk_index: i + offset,
        content: text,
        embedding: vectors[offset] ? JSON.stringify(vectors[offset]) : null,
      }));
      const { error } = await admin.from("knowledge_chunks").insert(rows);
      if (error) throw new Error(error.message);
    }

    const { error: updateError } = await admin.from("knowledge_files").update({
      file_name: title,
      source_title: title,
      source_url: sourceUrl,
      file_size: new TextEncoder().encode(content).length,
      content,
      status: "ready",
      error_message: null,
      last_crawled_at: new Date().toISOString(),
    }).eq("id", recordId);
    if (updateError) throw new Error(updateError.message);
    return json({ success: true, chars: content.length, chunks: chunks.length, title });
  } catch (error) {
    const message = error instanceof Error ? error.message : "URL ingestion failed";
    console.error("ingest-url error:", message);
    if (admin && recordId) {
      await admin.from("knowledge_files").update({ status: "error", error_message: message.slice(0, 500) }).eq("id", recordId);
    }
    return json({ error: message }, 422);
  }
});