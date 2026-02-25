interface DailyData {
  date: string;
  apiCalls: number;
  avgResponseTime: number;
  tokensUsed: number;
}

interface AgentPerfData {
  agentName: string;
  totalCalls: number;
  avgResponseTime: number;
  errorRate: number;
  successRate: number;
}

interface SummaryData {
  totalCalls: number;
  avgRT: number;
  totalTokens: number;
  successRate: number;
}

export function exportCSV(
  daily: DailyData[],
  agentPerf: AgentPerfData[],
  summary: SummaryData,
  days: number
) {
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `Analytics Report - Generated ${today}`,
    `Period: Last ${days} days`,
    "",
    "--- Summary ---",
    `Total API Calls,${summary.totalCalls}`,
    `Avg Response Time,${summary.avgRT}ms`,
    `Total Tokens,${summary.totalTokens}`,
    `Success Rate,${summary.successRate}%`,
    "",
    "--- Daily Breakdown ---",
    "Date,API Calls,Avg Response Time (ms),Tokens Used",
    ...daily.map((d) => `${d.date},${d.apiCalls},${d.avgResponseTime},${d.tokensUsed}`),
    "",
    "--- Agent Performance ---",
    "Agent,Total Calls,Avg Response (ms),Error Rate (%),Success Rate (%)",
    ...agentPerf.map((a) => `${a.agentName},${a.totalCalls},${a.avgResponseTime},${a.errorRate},${a.successRate}`),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-report-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF() {
  window.print();
}
