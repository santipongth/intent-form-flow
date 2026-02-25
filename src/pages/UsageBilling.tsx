import { motion } from "framer-motion";
import { CreditCard, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  MOCK_USAGE_BY_AGENT,
  MOCK_DAILY_USAGE,
  MOCK_BILLING_INFO,
} from "@/data/mockData";

const PIE_COLORS = [
  "hsl(262 83% 58%)",
  "hsl(220 90% 56%)",
  "hsl(160 70% 45%)",
  "hsl(30 90% 55%)",
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const usagePercent = Math.round(
  (MOCK_BILLING_INFO.tokensUsed / MOCK_BILLING_INFO.tokenLimit) * 100
);
const estimatedCost = (
  (MOCK_BILLING_INFO.tokensUsed / 1000) *
  MOCK_BILLING_INFO.costPerThousandTokens
).toFixed(2);
const totalCost = MOCK_USAGE_BY_AGENT.reduce((s, a) => s + a.cost, 0);

export default function UsageBilling() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Usage & Billing</h1>
          <p className="text-muted-foreground mt-1">
            {MOCK_BILLING_INFO.billingPeriod}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-1">
          {MOCK_BILLING_INFO.planName} Plan
        </Badge>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tokens Used
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(MOCK_BILLING_INFO.tokensUsed / 1000).toFixed(0)}K{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {(MOCK_BILLING_INFO.tokenLimit / 1000000).toFixed(0)}M
                </span>
              </div>
              <Progress value={usagePercent} className="mt-3 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {usagePercent}% ของ limit
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estimated Cost
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${estimatedCost}</div>
              <p className="text-xs text-muted-foreground mt-1">
                เดือนนี้ (based on usage)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Plan
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {MOCK_BILLING_INFO.planName}
              </div>
              <Button size="sm" variant="outline" className="mt-2 rounded-xl">
                Upgrade
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked Bar Chart */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Daily Token Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MOCK_DAILY_USAGE}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}K`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                    }}
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Legend />
                  <Bar dataKey="promptTokens" name="Prompt" stackId="tokens" fill="hsl(262 83% 58%)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="completionTokens" name="Completion" stackId="tokens" fill="hsl(220 90% 56%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Usage by Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={MOCK_USAGE_BY_AGENT}
                    dataKey="tokensUsed"
                    nameKey="agentName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {MOCK_USAGE_BY_AGENT.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                    }}
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Breakdown Table */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Usage Breakdown</CardTitle>
          </CardHeader>
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
                {MOCK_USAGE_BY_AGENT.map((agent) => (
                  <TableRow key={agent.agentName}>
                    <TableCell className="font-medium">
                      {agent.agentName}
                    </TableCell>
                    <TableCell className="text-right">
                      {agent.tokensUsed.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {agent.percentage}%
                    </TableCell>
                    <TableCell className="text-right">
                      ${agent.cost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold border-t-2">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">
                    {MOCK_BILLING_INFO.tokensUsed.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">100%</TableCell>
                  <TableCell className="text-right">
                    ${totalCost.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
