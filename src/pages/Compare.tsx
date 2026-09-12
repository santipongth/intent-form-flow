import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GitCompare, Coins, MessageSquare, Gauge, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAgents } from "@/hooks/useAgents";
import { useAnalyticsEvents } from "@/hooks/useAnalytics";
import { useFeedbackAnalytics } from "@/hooks/useFeedbackAnalytics";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
} from "recharts";

const PRICE_KEY = "tm_compare_price_per_million";

interface Row {
  agentId: string;
  name: string;
  avatar: string;
  model: string;
  messages: number;
  tokens: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  successRate: number;
  satisfactionRate: number | null;
  feedbackCount: number;
  cost: number;
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx]);
}

export default function Compare() {
  const { t } = useLanguage();
  const [days, setDays] = useState(7);
  const [selected, setSelected] = useState<string[]>([]);
  const [price, setPrice] = useState<string>(() => localStorage.getItem(PRICE_KEY) ?? "");

  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: events, isLoading } = useAnalyticsEvents(undefined, days);
  const { data: feedback } = useFeedbackAnalytics(days);

  useEffect(() => {
    localStorage.setItem(PRICE_KEY, price);
  }, [price]);

  useEffect(() => {
    if (agents && agents.length > 0 && selected.length === 0) {
      setSelected(agents.slice(0, Math.min(3, agents.length)).map((a) => a.id));
    }
  }, [agents]); // eslint-disable-line react-hooks/exhaustive-deps

  const pricePerMillion = Number(price) > 0 ? Number(price) : 0;

  const rows: Row[] = useMemo(() => {
    const byAgent: Record<string, { tokens: number; rts: number[]; count: number; errors: number }> = {};
    for (const e of (events || []) as any[]) {
      const id = e.agent_id;
      if (!id) continue;
      if (!byAgent[id]) byAgent[id] = { tokens: 0, rts: [], count: 0, errors: 0 };
      byAgent[id].count++;
      byAgent[id].tokens += e.tokens_used || 0;
      if (e.response_time_ms) byAgent[id].rts.push(e.response_time_ms);
      if (e.status && e.status !== "success") byAgent[id].errors++;
    }
    const fbMap = Object.fromEntries((feedback?.byAgent || []).map((f: any) => [f.agentId, f]));

    return (agents || [])
      .filter((a) => selected.includes(a.id))
      .map((a) => {
        const s = byAgent[a.id] || { tokens: 0, rts: [], count: 0, errors: 0 };
        const fb = fbMap[a.id];
        const avg = s.rts.length > 0 ? Math.round(s.rts.reduce((x, y) => x + y, 0) / s.rts.length) : 0;
        return {
          agentId: a.id,
          name: a.name,
          avatar: a.avatar || "🤖",
          model: a.model || "-",
          messages: s.count,
          tokens: s.tokens,
          avgResponseTime: avg,
          p95ResponseTime: percentile(s.rts, 95),
          successRate: s.count > 0 ? +((1 - s.errors / s.count) * 100).toFixed(1) : 0,
          satisfactionRate: fb ? fb.satisfactionRate : null,
          feedbackCount: fb ? fb.total : 0,
          cost: (s.tokens / 1_000_000) * pricePerMillion,
        };
      });
  }, [agents, events, feedback, selected, pricePerMillion]);

  const chartData = rows.map((r) => ({
    name: r.name.length > 14 ? r.name.slice(0, 14) + "…" : r.name,
    ...r,
  }));

  const maxTokens = Math.max(1, ...rows.map((r) => r.tokens));
  const maxMessages = Math.max(1, ...rows.map((r) => r.messages));
  const maxRt = Math.max(1, ...rows.map((r) => r.avgResponseTime));
  const radarData = [
    { metric: t("compare.metric.volume"), ...Object.fromEntries(rows.map((r) => [r.name, Math.round((r.messages / maxMessages) * 100)])) },
    { metric: t("compare.metric.speed"), ...Object.fromEntries(rows.map((r) => [r.name, r.avgResponseTime > 0 ? Math.round((1 - r.avgResponseTime / maxRt) * 100) : 0])) },
    { metric: t("compare.metric.efficiency"), ...Object.fromEntries(rows.map((r) => [r.name, Math.round((1 - r.tokens / maxTokens) * 100)])) },
    { metric: t("compare.metric.success"), ...Object.fromEntries(rows.map((r) => [r.name, r.successRate])) },
    { metric: t("compare.metric.accuracy"), ...Object.fromEntries(rows.map((r) => [r.name, r.satisfactionRate ?? 0])) },
  ];

  const radarColors = ["hsl(var(--primary))", "hsl(280 60% 55%)", "hsl(var(--brand-green))", "hsl(var(--brand-orange))", "hsl(var(--brand-cyan))"];
  const tooltipStyle = { borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" };

  const totals = rows.reduce(
    (acc, r) => ({ messages: acc.messages + r.messages, tokens: acc.tokens + r.tokens, cost: acc.cost + r.cost }),
    { messages: 0, tokens: 0, cost: 0 }
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const hasData = rows.some((r) => r.messages > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-primary" /> {t("compare.title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("compare.subtitle")}</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {[7, 30, 90].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "default" : "ghost"} className="rounded-lg text-xs" onClick={() => setDays(d)}>
              {d} {t("compare.days")}
            </Button>
          ))}
        </div>
      </div>

      {/* Agent picker + price */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3"><CardTitle className="text-base">{t("compare.pickAgents")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {agentsLoading ? (
            <div className="flex gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-40 rounded-xl" />)}</div>
          ) : (agents || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("compare.noAgents")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(agents || []).map((a) => (
                <label
                  key={a.id}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors ${
                    selected.includes(a.id) ? "border-primary bg-secondary" : "border-border hover:bg-muted"
                  }`}
                >
                  <Checkbox checked={selected.includes(a.id)} onCheckedChange={() => toggle(a.id)} />
                  <span>{a.avatar} {a.name}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs">{t("compare.priceLabel")}</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-48 rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground pb-2">{t("compare.priceHint")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("compare.totalAgents"), value: rows.length.toString(), icon: GitCompare, color: "text-primary", bg: "bg-secondary" },
          { label: t("compare.totalMessages"), value: totals.messages.toLocaleString(), icon: MessageSquare, color: "text-brand-green", bg: "bg-brand-green/10" },
          { label: t("compare.totalTokens"), value: totals.tokens.toLocaleString(), icon: Gauge, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
          { label: t("compare.totalCost"), value: pricePerMillion > 0 ? totals.cost.toFixed(2) : "—", icon: Coins, color: "text-brand-orange", bg: "bg-brand-orange/10" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold font-display">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      ) : rows.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center">
            <GitCompare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">{t("compare.selectPrompt")}</p>
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">{t("compare.noData")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("compare.chart.messages")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="messages" name={t("compare.chart.messages")} fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-base">{pricePerMillion > 0 ? t("compare.chart.cost") : t("compare.chart.tokens")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey={pricePerMillion > 0 ? "cost" : "tokens"}
                      name={pricePerMillion > 0 ? t("compare.chart.cost") : t("compare.chart.tokens")}
                      fill="hsl(var(--brand-orange))"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("compare.chart.speed")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="avgResponseTime" name={t("compare.avgRt")} fill="hsl(var(--brand-green))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="p95ResponseTime" name={t("compare.p95Rt")} fill="hsl(var(--brand-cyan))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-base">{t("compare.chart.radar")}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    {rows.map((r, i) => (
                      <Radar
                        key={r.agentId}
                        name={r.name}
                        dataKey={r.name}
                        stroke={radarColors[i % radarColors.length]}
                        fill={radarColors[i % radarColors.length]}
                        fillOpacity={0.18}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> {t("compare.tableTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>{t("compare.colModel")}</TableHead>
                    <TableHead className="text-right">{t("compare.colMessages")}</TableHead>
                    <TableHead className="text-right">{t("compare.colTokens")}</TableHead>
                    <TableHead className="text-right">{t("compare.colCost")}</TableHead>
                    <TableHead className="text-right">{t("compare.avgRt")}</TableHead>
                    <TableHead className="text-right">{t("compare.p95Rt")}</TableHead>
                    <TableHead className="text-right">{t("compare.colSuccess")}</TableHead>
                    <TableHead className="text-right">{t("compare.colAccuracy")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.agentId}>
                      <TableCell className="font-medium whitespace-nowrap">{r.avatar} {r.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{r.model}</TableCell>
                      <TableCell className="text-right">{r.messages.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.tokens.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{pricePerMillion > 0 ? r.cost.toFixed(2) : "—"}</TableCell>
                      <TableCell className="text-right">{r.avgResponseTime}ms</TableCell>
                      <TableCell className="text-right">{r.p95ResponseTime}ms</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={r.successRate >= 95 ? "secondary" : "destructive"} className="rounded-full text-xs">{r.successRate}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.satisfactionRate === null ? (
                          <span className="text-xs text-muted-foreground">{t("compare.noFeedback")}</span>
                        ) : (
                          <span className="text-sm">{r.satisfactionRate}% <span className="text-xs text-muted-foreground">({r.feedbackCount})</span></span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-4">{t("compare.accuracyHint")}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
