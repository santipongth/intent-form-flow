// Shared tool-calling loop used by both the chat function and the public
// agent API, so external API/Widget callers get the same tool abilities.

import {
  TOOL_SCHEMAS,
  runTool,
  chooseToolChoice,
  TOOL_MODEL_CHAIN,
  isToolModelFallbackError,
} from "./agent-tools.ts";
import type { TraceRecorder } from "./traces.ts";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const TOOL_KEYS = ["web-search", "calculator", "read-excel"] as const;

export function activeToolSchemas(toolsEnabled: Record<string, unknown>): any[] {
  const out: any[] = [];
  for (const key of TOOL_KEYS) {
    if (toolsEnabled?.[key]) out.push(TOOL_SCHEMAS[key]);
  }
  return out;
}

export interface ToolLoopResult {
  /** Messages including assistant tool calls and tool results. */
  messages: any[];
  iterations: number;
  /** Set when the loop had to abort (rate limit / no tool-capable model). */
  failure?: { status: number; error: string };
}

export async function runToolLoop(opts: {
  messages: any[];
  activeTools: any[];
  toolsEnabled: Record<string, unknown>;
  apiKey: string;
  temperature?: number;
  supabase: any;
  agentId: string | null;
  userId: string | null;
  trace?: TraceRecorder;
  maxIterations?: number;
  logPrefix?: string;
}): Promise<ToolLoopResult> {
  const {
    activeTools, toolsEnabled, apiKey, supabase, agentId, userId, trace,
  } = opts;
  const messages = [...opts.messages];
  const maxIterations = opts.maxIterations ?? 4;
  const prefix = opts.logPrefix || "[tools]";
  let iterations = 0;
  let toolModelIdx = 0;

  if (activeTools.length === 0) return { messages, iterations };

  while (iterations < maxIterations) {
    const toolChoice = chooseToolChoice(
      messages,
      { calculator: !!toolsEnabled["calculator"], webSearch: !!toolsEnabled["web-search"] },
      iterations,
    );

    let probeRes: Response | null = null;
    let probeErrBody = "";
    let probeModel = TOOL_MODEL_CHAIN[toolModelIdx];
    const probeStart = Date.now();

    while (toolModelIdx < TOOL_MODEL_CHAIN.length) {
      const candidate = TOOL_MODEL_CHAIN[toolModelIdx];
      const r = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: candidate,
          messages,
          ...(opts.temperature != null && !candidate.startsWith("openai/gpt-5")
            ? { temperature: opts.temperature }
            : {}),
          tools: activeTools,
          tool_choice: toolChoice,
          stream: false,
        }),
      });
      if (r.ok) {
        probeRes = r;
        probeModel = candidate;
        if (toolModelIdx > 0) console.log(`${prefix} tool model fallback in use:`, candidate);
        break;
      }
      if (r.status === 429 || r.status === 402) {
        const error = r.status === 429
          ? "Rate limit exceeded. Please try again later."
          : "Payment required. Please add credits to your workspace.";
        trace?.record({ span_type: "error", name: "tool_probe", status: "error", output: { status: r.status } });
        return { messages, iterations, failure: { status: r.status, error } };
      }
      probeErrBody = await r.text();
      const shouldFallback = isToolModelFallbackError(r.status, probeErrBody);
      console.error(`${prefix} tool probe failed`, {
        model: candidate, status: r.status, fallback: shouldFallback, body: probeErrBody.slice(0, 300),
      });
      if (!shouldFallback) {
        trace?.record({ span_type: "error", name: "tool_probe", status: "error", output: { status: r.status } });
        return { messages, iterations, failure: { status: 500, error: "AI gateway error" } };
      }
      toolModelIdx++;
    }

    if (!probeRes) {
      console.error(`${prefix} all tool models exhausted`, probeErrBody.slice(0, 300));
      trace?.record({ span_type: "error", name: "tool_probe", status: "error", output: { reason: "no tool model" } });
      return { messages, iterations, failure: { status: 502, error: "No tool-capable model available" } };
    }

    const probe = await probeRes.json();
    const choice = probe.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;
    trace?.record({
      span_type: "tool_probe",
      name: `iteration ${iterations}`,
      input: { model: probeModel, tool_choice: typeof toolChoice === "string" ? toolChoice : toolChoice.function.name },
      output: { finish_reason: choice?.finish_reason, tool_calls: (toolCalls || []).map((t: any) => t.function?.name) },
      duration_ms: Date.now() - probeStart,
    });
    console.log(
      `${prefix} tool probe iter`, iterations,
      "model:", probeModel,
      "finish:", choice?.finish_reason,
      "tool_calls:", toolCalls?.length || 0,
    );

    if (!toolCalls || toolCalls.length === 0) break;

    messages.push({ role: "assistant", content: choice.message.content || "", tool_calls: toolCalls });

    for (const tc of toolCalls) {
      const started = Date.now();
      const result = await runTool(tc.function?.name, tc.function?.arguments, { supabase, agentId, userId });
      messages.push({ role: "tool", tool_call_id: tc.id, content: result });
      trace?.record({
        span_type: "tool_call",
        name: tc.function?.name || "unknown",
        input: safeParse(tc.function?.arguments),
        output: safeParse(result),
        duration_ms: Date.now() - started,
      });
    }
    iterations++;
  }

  return { messages, iterations };
}

function safeParse(value: unknown) {
  if (typeof value !== "string") return value ?? {};
  try { return JSON.parse(value); } catch { return { raw: value.slice(0, 1000) }; }
}
