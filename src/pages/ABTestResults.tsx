import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Trophy } from "lucide-react";
import { useABTests, useAllABTestVotes } from "@/hooks/useABTesting";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ABTestResults() {
  const navigate = useNavigate();
  const { data: tests } = useABTests();
  const { data: allVotes } = useAllABTestVotes();

  const chartData = (tests || []).map((test) => {
    const v = allVotes?.find((v) => v.test_id === test.id);
    return {
      name: test.name.length > 18 ? test.name.slice(0, 18) + "…" : test.name,
      fullName: test.name,
      testId: test.id,
      "Agent A": v?.a || 0,
      "Agent B": v?.b || 0,
      Tie: v?.tie || 0,
    };
  });

  const getWinner = (a: number, b: number, tie: number) => {
    if (a === 0 && b === 0 && tie === 0) return "-";
    if (a > b && a > tie) return "Agent A";
    if (b > a && b > tie) return "Agent B";
    if (tie > a && tie > b) return "Tie";
    return "Draw";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/ab-testing")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> A/B Test Results
          </h1>
          <p className="text-muted-foreground text-sm">ภาพรวมผลโหวตทุก test</p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Bar dataKey="Agent A" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Agent B" fill="hsl(280 60% 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Tie" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-2xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead className="text-center">Agent A</TableHead>
                      <TableHead className="text-center">Agent B</TableHead>
                      <TableHead className="text-center">Tie</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Winner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((row) => {
                      const total = row["Agent A"] + row["Agent B"] + row.Tie;
                      const winner = getWinner(row["Agent A"], row["Agent B"], row.Tie);
                      return (
                        <TableRow key={row.testId} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/ab-testing/${row.testId}`)}>
                          <TableCell className="font-medium">{row.fullName}</TableCell>
                          <TableCell className="text-center">{row["Agent A"]} {total > 0 && <span className="text-muted-foreground text-xs">({Math.round((row["Agent A"] / total) * 100)}%)</span>}</TableCell>
                          <TableCell className="text-center">{row["Agent B"]} {total > 0 && <span className="text-muted-foreground text-xs">({Math.round((row["Agent B"] / total) * 100)}%)</span>}</TableCell>
                          <TableCell className="text-center">{row.Tie}</TableCell>
                          <TableCell className="text-center">{total}</TableCell>
                          <TableCell className="text-center">
                            {winner !== "-" ? (
                              <Badge variant={winner === "Draw" ? "secondary" : "default"} className="rounded-full gap-1">
                                {winner !== "Draw" && winner !== "Tie" && <Trophy className="h-3 w-3" />}
                                {winner}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">No votes</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-10 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No tests found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
