// Per-agent token / message budgets with daily + monthly windows (Asia/Bangkok).

export interface BudgetLimits {
  enabled: boolean;
  daily_token_limit: number | null;
  monthly_token_limit: number | null;
  daily_message_limit: number | null;
  monthly_message_limit: number | null;
}

export interface BudgetUsage {
  dayTokens: number;
  dayMessages: number;
  monthTokens: number;
  monthMessages: number;
}

export interface BudgetStatus {
  /** true when the agent must stop answering */
  blocked: boolean;
  /** true when usage is at or above 80% of any configured limit */
  warning: boolean;
  reason?: string;
  usage: BudgetUsage;
  limits: BudgetLimits;
}

const EMPTY_USAGE: BudgetUsage = { dayTokens: 0, dayMessages: 0, monthTokens: 0, monthMessages: 0 };

/** Current day / month window starts in Bangkok time, as YYYY-MM-DD. */
export function currentPeriods(now = new Date()): { day: string; month: string } {
  const bkk = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const y = bkk.getUTCFullYear();
  const m = String(bkk.getUTCMonth() + 1).padStart(2, "0");
  const d = String(bkk.getUTCDate()).padStart(2, "0");
  return { day: `${y}-${m}-${d}`, month: `${y}-${m}-01` };
}

/** Pure evaluation, exported for tests. */
export function evaluateBudget(limits: BudgetLimits, usage: BudgetUsage): BudgetStatus {
  const base: BudgetStatus = { blocked: false, warning: false, usage, limits };
  if (!limits.enabled) return base;

  const checks: { used: number; limit: number | null; label: string }[] = [
    { used: usage.dayTokens, limit: limits.daily_token_limit, label: "เพดาน token รายวัน" },
    { used: usage.monthTokens, limit: limits.monthly_token_limit, label: "เพดาน token รายเดือน" },
    { used: usage.dayMessages, limit: limits.daily_message_limit, label: "เพดานจำนวนข้อความรายวัน" },
    { used: usage.monthMessages, limit: limits.monthly_message_limit, label: "เพดานจำนวนข้อความรายเดือน" },
  ];

  for (const c of checks) {
    if (!c.limit || c.limit <= 0) continue;
    if (c.used >= c.limit) {
      return { ...base, blocked: true, reason: `${c.label} (${c.used}/${c.limit})` };
    }
    if (c.used >= c.limit * 0.8) base.warning = true;
  }
  return base;
}

/** Read limits + counters and decide whether the agent may answer. */
export async function checkBudget(supabase: any, agentId: string | null): Promise<BudgetStatus> {
  const none: BudgetStatus = {
    blocked: false,
    warning: false,
    usage: EMPTY_USAGE,
    limits: {
      enabled: false,
      daily_token_limit: null,
      monthly_token_limit: null,
      daily_message_limit: null,
      monthly_message_limit: null,
    },
  };
  if (!agentId) return none;
  try {
    const { data: budget } = await supabase
      .from("agent_budgets")
      .select("enabled, daily_token_limit, monthly_token_limit, daily_message_limit, monthly_message_limit")
      .eq("agent_id", agentId)
      .maybeSingle();
    if (!budget || !budget.enabled) return none;

    const { day, month } = currentPeriods();
    const { data: rows } = await supabase
      .from("agent_usage_counters")
      .select("period_type, period_start, tokens, messages")
      .eq("agent_id", agentId)
      .in("period_start", [day, month]);

    const usage: BudgetUsage = { ...EMPTY_USAGE };
    for (const r of rows || []) {
      if (r.period_type === "day" && r.period_start === day) {
        usage.dayTokens = Number(r.tokens) || 0;
        usage.dayMessages = Number(r.messages) || 0;
      } else if (r.period_type === "month" && r.period_start === month) {
        usage.monthTokens = Number(r.tokens) || 0;
        usage.monthMessages = Number(r.messages) || 0;
      }
    }
    return evaluateBudget(budget as BudgetLimits, usage);
  } catch (e) {
    console.error("[budget] check failed", (e as Error).message);
    return none;
  }
}

/** Record one answered message and its token cost. Never throws. */
export async function recordUsage(
  supabase: any,
  agentId: string | null,
  userId: string | null,
  tokens: number,
): Promise<void> {
  if (!agentId || !userId) return;
  try {
    await supabase.rpc("increment_agent_usage", {
      _agent_id: agentId,
      _user_id: userId,
      _tokens: Math.max(Math.round(tokens || 0), 0),
      _messages: 1,
    });
  } catch (e) {
    console.error("[budget] record failed", (e as Error).message);
  }
}

export const BUDGET_EXCEEDED_MESSAGE =
  "Agent นี้ใช้งบประมาณครบตามเพดานที่กำหนดแล้ว กรุณาติดต่อเจ้าของ Agent หรือรอรอบถัดไป";
