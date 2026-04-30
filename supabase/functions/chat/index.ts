import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, agent_id, conversation_id } = await req.json();

    // Basic input validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages must be a non-empty array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > 100) {
      return new Response(JSON.stringify({ error: "Too many messages (max 100)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Get auth user
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Resolve user from JWT
    let userId: string | null = null;
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) userId = user.id;

    // Public access path: allow unauthenticated chat ONLY when targeting a
    // published agent (used by the embeddable widget). Anonymous calls cannot
    // persist conversations and are scoped to the agent owner.
    let isPublicSession = false;
    if (!userId) {
      if (!agent_id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: pub } = await supabase
        .from("agents")
        .select("user_id, status")
        .eq("id", agent_id)
        .eq("status", "published")
        .maybeSingle();
      if (!pub) {
        return new Response(JSON.stringify({ error: "Agent not available" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = pub.user_id; // analytics/knowledge scoped to owner
      isPublicSession = true;
    }

    // Get agent config if agent_id provided
    let systemPrompt = "You are a helpful AI assistant. Keep answers clear and concise.";
    let model = "google/gemini-3-flash-preview";
    let temperature = 0.7;

    if (agent_id) {
      const { data: agent } = await supabase
        .from("agents")
        .select("system_prompt, model, temperature, name, objective")
        .eq("id", agent_id)
        .eq("user_id", userId)
        .single();

      if (agent) {
        if (agent.system_prompt) {
          systemPrompt = agent.system_prompt;
        } else if (agent.objective) {
          systemPrompt = `You are ${agent.name}. Your objective: ${agent.objective}. Be helpful and respond naturally.`;
        }
        if (agent.temperature != null) temperature = agent.temperature;
      }

      // Inject knowledge base content
      const { data: knowledgeFiles } = await supabase
        .from("knowledge_files")
        .select("file_name, content")
        .eq("agent_id", agent_id)
        .eq("user_id", userId)
        .eq("status", "ready");

      if (knowledgeFiles && knowledgeFiles.length > 0) {
        let knowledgeContext = "\n\n---\nReference Documents:\n";
        let totalChars = 0;
        const MAX_CHARS = 50000;

        for (const kf of knowledgeFiles) {
          if (!kf.content) continue;
          const chunk = kf.content.substring(0, MAX_CHARS - totalChars);
          knowledgeContext += `[Document: ${kf.file_name}]\n${chunk}\n\n`;
          totalChars += chunk.length;
          if (totalChars >= MAX_CHARS) break;
        }

        knowledgeContext += "---\n\nUse the above documents as reference to answer questions accurately.";
        systemPrompt += knowledgeContext;
      }
    }

    const startTime = Date.now();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature,
      }),
    });

    if (!response.ok) {
      const responseTime = Date.now() - startTime;
      
      // Log analytics event for errors (no longer requires conversation_id)
      if (agent_id && userId) {
        await supabase.from("agent_analytics_events").insert({
          agent_id,
          user_id: userId,
          event_type: "chat",
          status: "error",
          response_time_ms: responseTime,
          metadata: { error_status: response.status },
        });
        await supabase.from("error_logs").insert({
          user_id: userId,
          agent_id,
          source: "chat",
          level: "error",
          message: `AI gateway returned ${response.status}`,
          context: { status: response.status },
        });
      }

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use TransformStream to intercept tokens_used from streaming response
    let totalTokens = 0;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // Pass through the chunk as-is
        controller.enqueue(chunk);

        // Try to extract usage/tokens from the chunk
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            // OpenAI-compatible APIs send usage in the last chunk
            if (parsed.usage?.total_tokens) {
              totalTokens = parsed.usage.total_tokens;
            }
            // Some APIs use prompt_tokens + completion_tokens
            if (parsed.usage?.prompt_tokens && parsed.usage?.completion_tokens) {
              totalTokens = parsed.usage.prompt_tokens + parsed.usage.completion_tokens;
            }
          } catch { /* ignore parse errors */ }
        }
      },
      flush() {
        // After stream ends, log analytics (fire-and-forget)
        const responseTime = Date.now() - startTime;
        if (agent_id && userId) {
          supabase.from("agent_analytics_events").insert({
            agent_id,
            user_id: userId,
            event_type: "chat",
            status: "success",
            response_time_ms: responseTime,
            tokens_used: totalTokens || null,
          }).then(() => {});

          // Webhook fan-out (fire-and-forget)
          (async () => {
            try {
              const { data: hooks } = await supabase
                .from("agent_webhooks")
                .select("id, url, secret, events")
                .eq("agent_id", agent_id)
                .eq("enabled", true);
              if (!hooks || hooks.length === 0) return;
              const payload = JSON.stringify({
                event: "chat.completed",
                agent_id,
                data: { messages, tokens_used: totalTokens, response_time_ms: responseTime },
                timestamp: new Date().toISOString(),
              });
              await Promise.allSettled(
                hooks.filter((h: any) => (h.events || []).includes("chat.completed")).map(async (h: any) => {
                  try {
                    const sigBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload + h.secret));
                    const sig = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
                    const r = await fetch(h.url, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "x-tm-signature": sig, "x-tm-event": "chat.completed" },
                      body: payload,
                    });
                    await supabase.from("agent_webhooks").update({
                      last_triggered_at: new Date().toISOString(),
                      last_status: `${r.status}`,
                    }).eq("id", h.id);
                  } catch (e) {
                    await supabase.from("agent_webhooks").update({
                      last_triggered_at: new Date().toISOString(),
                      last_status: `error: ${(e as Error).message}`,
                    }).eq("id", h.id);
                  }
                })
              );
            } catch (_) { /* ignore */ }
          })();
        }
      },
    });

    const streamedBody = response.body!.pipeThrough(transformStream);

    return new Response(streamedBody, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabase.from("error_logs").insert({
        source: "chat",
        level: "error",
        message: (e as Error).message || "unknown",
        context: {},
      });
    } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
