import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Activity, Users, CheckCircle, TrendingUp, TrendingDown, MessageSquare, Download, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportCSV, exportPDF } from "@/lib/exportAnalytics";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalyticsEvents } from "@/hooks/useAnalytics";
import { useAgents } from "@/hooks/useAgents";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function aggregateDaily(events: any[]) {
  const map: Record<string, { count: number; totalRT: number; totalTokens: number }> = {};
  for (const e of events) {
    const day = (e.created_at || "").slice(0, 10);
    if (!day) continue;
    if (!map[day]) map[day] = { count: 0, totalRT: 0, totalTokens: 0 };
    map[day].count++;
    map[day].totalRT += e.response_time_ms || 0;
    map[day].totalTokens += e.tokens_used || 0;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date: date.slice(5), // MM-DD
      apiCalls: v.count,
      avgResponseTime: v.count > 0 ? Math.round(v.totalRT / v.count) : 0,
      tokensUsed: v.totalTokens,
    }));
}

function aggregateByAgent(events: any[], agents: any[]) {
  const map: Record<string, { count: number; totalRT: number; errors: number }> = {};
  for (const e of events) {
    const aid = e.agent_id || "unknown";
    if (!map[aid]) map[aid] = { count: 0, totalRT: 0, errors: 0 };
    map[aid].count++;
    map[aid].totalRT += e.response_time_ms || 0;
    if (e.status !== "success") map[aid].errors++;
  }
  const agentMap = Object.fromEntries((agents || []).map((a: any) => [a.id, a.name]));
  return Object.entries(map)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([id, v]) => ({
      agentId: id,
      agentName: agentMap[id] || "Unknown Agent",
      totalCalls: v.count,
      avgResponseTime: v.count > 0 ? Math.round(v.totalRT / v.count) : 0,
      errorRate: v.count > 0 ? +((v.errors / v.count) * 100).toFixed(1) : 0,
      successRate: v.count > 0 ? +((1 - v.errors / v.count) * 100).toFixed(1) : 0,
    }));
}

export default function Analytics() {
  const { t } = useLanguage();
  const daysOptions = [
    { label: t("analytics.7days"), days: 7 },
    { label: t("analytics.30days"), days: 30 },
    { label: t("analytics.90days"), days: 90 },
  ];
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedAgent, setSelectedAgent] = useState<string>("all");

  const { data: agents } = useAgents();
  const { data: events, isLoading } = useAnalyticsEvents(
    selectedAgent === "all" ? undefined : selectedAgent,
    selectedDays
  );

  const daily = useMemo(() => aggregateDaily(events || []), [events]);
  const agentPerf = useMemo(() => aggregateByAgent(events || [], agents || []), [events, agents]);

  const totalCalls = (events || []).length;
  const avgRT = totalCalls > 0 ? Math.round((events || []).reduce((s: number, e: any) => s + (e.response_time_ms || 0), 0) / totalCalls) : 0;
  const successCount = (events || []).filter((e: any) => e.status === "success").length;
  const successRate = totalCalls > 0 ? +((successCount / totalCalls) * 100).toFixed(1) : 0;
  const totalTokens = (events || []).reduce((s: number, e: any) => s + (e.tokens_used || 0), 0);

  const stats = [
    { label: "Total API Calls", value: totalCalls.toLocaleString(), icon: BarChart3, color: "text-primary", bg: "bg-secondary" },
    { label: "Avg Response Time", value: `${avgRT}ms`, icon: Activity, color: "text-brand-green", bg: "bg-brand-green/10" },
    { label: "Total Tokens", value: totalTokens.toLocaleString(), icon: Users, color: "text-brand-orange", bg: "bg-brand-orange/10" },
    { label: "Success Rate", value: `${successRate}%`, icon: CheckCircle, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  ];

  const isEmpty = !isLoading && totalCalls === 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("analytics.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("analytics.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl no-print" disabled={isEmpty || isLoading}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportCSV(daily, agentPerf, { totalCalls, avgRT, totalTokens, successRate }, selectedDays)}>
                <FileText className="h-4 w-4 mr-2" /> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF}>
                <FileText className="h-4 w-4 mr-2" /> Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {(agents || []).map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.avatar} {a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {daysOptions.map((r) => (
              <Button key={r.days} size="sm" variant={selectedDays === r.days ? "default" : "ghost"} className="rounded-lg text-xs" onClick={() => setSelectedDays(r.days)}>
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="rounded-2xl">
              <CardContent className="p-5">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                        <s.icon className={`h-5 w-5 ${s.color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold font-display">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {isEmpty ? (
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">ยังไม่มีข้อมูล Analytics</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              เริ่มสนทนากับ Agent ของคุณเพื่อสร้างข้อมูล Analytics — ทุกข้อความจะถูกบันทึกและแสดงผลที่นี่แบบ real-time
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="rounded-2xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">API Calls per Day</CardTitle></CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-[250px] w-full rounded-xl" /> : (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={daily}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        <Line type="monotone" dataKey="apiCalls" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="rounded-2xl">
                <CardHeader className="pb-2"><CardTitle className="text-base">Response Time (ms)</CardTitle></CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-[250px] w-full rounded-xl" /> : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={daily}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        <Bar dataKey="avgResponseTime" fill="hsl(var(--brand-orange))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-base">Token Usage Trend</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-[250px] w-full rounded-xl" /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={daily}>
                      <defs>
                        <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--brand-cyan))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--brand-cyan))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                      <Area type="monotone" dataKey="tokensUsed" stroke="hsl(var(--brand-cyan))" strokeWidth={2.5} fill="url(#tokenGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Agent Comparison Charts */}
          {agentPerf.length >= 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <div className="grid lg:grid-cols-3 gap-6">
                {[
                  { title: "Total Calls by Agent", dataKey: "totalCalls", fill: "hsl(var(--primary))" },
                  { title: "Avg Response Time by Agent", dataKey: "avgResponseTime", fill: "hsl(var(--brand-orange))" },
                  { title: "Success Rate by Agent", dataKey: "successRate", fill: "hsl(var(--brand-green))" },
                ].map((chart) => (
                  <Card key={chart.dataKey} className="rounded-2xl">
                    <CardHeader className="pb-2"><CardTitle className="text-base">{chart.title}</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={Math.max(150, agentPerf.length * 50)}>
                        <BarChart data={agentPerf} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={chart.dataKey === "successRate" ? [0, 100] : undefined} />
                          <YAxis type="category" dataKey="agentName" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={80} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Bar dataKey={chart.dataKey} fill={chart.fill} radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Agent Performance Table */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">Agent Performance</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Total Calls</TableHead>
                      <TableHead className="text-right">Avg Response</TableHead>
                      <TableHead className="text-right">Error Rate</TableHead>
                      <TableHead className="text-right">Success Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerf.map((agent) => (
                      <TableRow key={agent.agentId}>
                        <TableCell className="font-medium">{agent.agentName}</TableCell>
                        <TableCell className="text-right">{agent.totalCalls.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{agent.avgResponseTime}ms</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={agent.errorRate > 2 ? "destructive" : "secondary"} className="rounded-full text-xs">{agent.errorRate}%</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-brand-green font-medium">{agent.successRate}%</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
