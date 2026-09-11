// Lightweight run tracing: every step of an agent run (retrieval, tool probe,
// tool call, final answer) is persisted so the Monitor page can replay it.

export interface TraceSpan {
  span_type: "retrieval" | "tool_probe" | "tool_call" | "answer" | "error";
  name: string;
  input?: unknown;
  output?: unknown;
  status?: "success" | "error";
  duration_ms?: number;
}

export class TraceRecorder {
  readonly runId: string;
  private step = 0;
  private pending: Promise<unknown>[] = [];

  constructor(
    private supabase: any,
    private ctx: {
      agentId: string | null;
      userId: string | null;
      conversationId?: string | null;
      source: "chat" | "api" | "widget";
    },
  ) {
    this.runId = crypto.randomUUID();
  }

  record(span: TraceSpan) {
    if (!this.ctx.userId) return;
    const row = {
      agent_id: this.ctx.agentId,
      user_id: this.ctx.userId,
      conversation_id: this.ctx.conversationId ?? null,
      run_id: this.runId,
      source: this.ctx.source,
      step_index: this.step++,
      span_type: span.span_type,
      name: span.name,
      input: truncate(span.input),
      output: truncate(span.output),
      status: span.status || "success",
      duration_ms: Math.round(span.duration_ms || 0),
    };
    this.pending.push(
      this.supabase.from("agent_traces").insert(row).then((r: any) => {
        if (r?.error) console.error("[trace] insert failed", r.error.message);
      }),
    );
  }

  async flush() {
    const p = this.pending;
    this.pending = [];
    await Promise.allSettled(p);
  }
}

function truncate(value: unknown) {
  if (value === undefined || value === null) return {};
  try {
    const s = JSON.stringify(value);
    if (s.length <= 4000) return JSON.parse(s);
    return { truncated: true, preview: s.slice(0, 4000) };
  } catch {
    return { unserializable: true };
  }
}
