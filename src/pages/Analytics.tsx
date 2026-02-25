import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_ANALYTICS_DAILY, MOCK_AGENT_ANALYTICS } from "@/data/mockData";
import { BarChart3, Activity, Users, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const timeRanges = ["7 วัน", "30 วัน", "90 วัน"] as const;

const stats = [
  {
    label: "Total API Calls",
    value: "12,450",
    change: "+18.2%",
    trending: "up" as const,
    icon: BarChart3,
    color: "text-primary",
    bg: "bg-secondary",
  },
  {
    label: "Avg Response Time",
    value: "288ms",
    change: "-12.5%",
    trending: "down" as const,
    icon: Activity,
    color: "text-brand-green",
    bg: "bg-brand-green/10",
  },
  {
    label: "Active Sessions",
    value: "92",
    change: "+24.3%",
    trending: "up" as const,
    icon: Users,
    color: "text-brand-orange",
    bg: "bg-brand-orange/10",
  },
  {
    label: "Success Rate",
    value: "97.8%",
    change: "+0.5%",
    trending: "up" as const,
    icon: CheckCircle,
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
  },
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<string>("7 วัน");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">สถิติการใช้งาน Agent ทั้งหมด</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {timeRanges.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={timeRange === r ? "default" : "ghost"}
              className="rounded-lg text-xs"
              onClick={() => setTimeRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${s.trending === "up" ? "text-brand-green" : "text-brand-orange"}`}>
                    {s.trending === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {s.change}
                  </div>
                </div>
                <p className="text-2xl font-bold font-display">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Line Chart - API Calls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">API Calls per Day</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={MOCK_ANALYTICS_DAILY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Line type="monotone" dataKey="apiCalls" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar Chart - Response Time */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Response Time (ms)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={MOCK_ANALYTICS_DAILY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="avgResponseTime" fill="hsl(var(--brand-orange))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Area Chart - Token Usage (full width) */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Token Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={MOCK_ANALYTICS_DAILY}>
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Agent Performance Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Agent Performance</CardTitle>
          </CardHeader>
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
                {MOCK_AGENT_ANALYTICS.sort((a, b) => b.totalCalls - a.totalCalls).map((agent) => (
                  <TableRow key={agent.agentId}>
                    <TableCell className="font-medium">{agent.agentName}</TableCell>
                    <TableCell className="text-right">{agent.totalCalls.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{agent.avgResponseTime}ms</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={agent.errorRate > 2 ? "destructive" : "secondary"} className="rounded-full text-xs">
                        {agent.errorRate}%
                      </Badge>
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
    </div>
  );
}
