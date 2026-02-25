import { useMemo } from "react";
import { motion } from "framer-motion";
import { CreditCard, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalyticsEvents } from "@/hooks/useAnalytics";
import { useAgents } from "@/hooks/useAgents";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay } from "date-fns";

const PIE_COLORS = ["hsl(262 83% 58%)", "hsl(220 90% 56%)", "hsl(160 70% 45%)", "hsl(30 90% 55%)"];
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const COST_PER_1K = 0.002;
const TOKEN_LIMIT = 1_000_000;

export default function UsageBilling() {
  const { t } = useLanguage();
  const { data: events, isLoading } = useAnalyticsEvents(undefined, 30);
  const { data: agents } = useAgents();

  const agentMap = useMemo(() => new Map(agents?.map(a => [a.id, a]) || []), [agents]);

  const { totalTokens, usageByAgent, dailyUsage } = useMemo(() => {
    if (!events) return { totalTokens: 0, usageByAgent: [], dailyUsage: [] };

    let totalTokens = 0;
    const byAgent: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    for (const e of events) {
      const tokens = e.tokens_used || 0;
      totalTokens += tokens;
      const aid = e.agent_id || "unknown";
      byAgent[aid] = (byAgent[aid] || 0) + tokens;
      const day = e.created_at ? format(new Date(e.created_at), "MM/dd") : "unknown";
      byDay[day] = (byDay[day] || 0) + tokens;
    }

    const usageByAgent = Object.entries(byAgent).map(([agentId, tokensUsed]) => {
      const agent = agentMap.get(agentId);
      return {
        agentName: agent ? `${agent.avatar} ${agent.name}` : "Unknown",
        tokensUsed,
        percentage: totalTokens > 0 ? Math.round((tokensUsed / totalTokens) * 100) : 0,
        cost: (tokensUsed / 1000) * COST_PER_1K,
      };
    }).sort((a, b) => b.tokensUsed - a.tokensUsed);

    const dailyUsage = Object.entries(byDay).map(([date, tokens]) => ({
      date,
      tokens,
    }));

    return { totalTokens, usageByAgent, dailyUsage };
  }, [events, agentMap]);

  const usagePercent = Math.round((totalTokens / TOKEN_LIMIT) * 100);
  const estimatedCost = ((totalTokens / 1000) * COST_PER_1K).toFixed(2);
  const totalCost = usageByAgent.reduce((s, a) => s + a.cost, 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div {...fadeUp} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">{t("usage.title")}</h1>
          <p className="text-muted-foreground mt-1">Last 30 days</p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-1">Free Plan</Badge>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tokens Used</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(totalTokens / 1000).toFixed(0)}K <span className="text-sm font-normal text-muted-foreground">/ {(TOKEN_LIMIT / 1000000).toFixed(0)}M</span></div>
              <Progress value={usagePercent} className="mt-3 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{usagePercent}% {t("usage.ofLimit")}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${estimatedCost}</div>
              <p className="text-xs text-muted-foreground mt-1">{t("usage.thisMonth")}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Free</div>
              <Button size="sm" variant="outline" className="mt-2 rounded-xl">{t("usage.upgrade")}</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-lg">{t("usage.dailyUsage")}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}K`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} formatter={(value: number) => value.toLocaleString()} />
                  <Bar dataKey="tokens" name="Tokens" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-lg">{t("usage.usageByAgent")}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={usageByAgent} dataKey="tokensUsed" nameKey="agentName" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3}>
                    {usageByAgent.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} formatter={(value: number) => value.toLocaleString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="text-lg">{t("usage.breakdown")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Tokens Used</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageByAgent.map((agent) => (
                  <TableRow key={agent.agentName}>
                    <TableCell className="font-medium">{agent.agentName}</TableCell>
                    <TableCell className="text-right">{agent.tokensUsed.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{agent.percentage}%</TableCell>
                    <TableCell className="text-right">${agent.cost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {usageByAgent.length > 0 && (
                  <TableRow className="font-bold border-t-2">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{totalTokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                    <TableCell className="text-right">${totalCost.toFixed(2)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
