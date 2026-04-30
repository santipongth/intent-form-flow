import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { useErrorLogs } from "@/hooks/useErrorLogs";

export function ErrorLogsSection({ agentId }: { agentId?: string }) {
  const { data: logs = [], isLoading } = useErrorLogs(agentId, 50);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="h-5 w-5" /> Recent Errors
        </CardTitle>
        <CardDescription>Last 50 errors from your agent's edge functions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && logs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No errors. Everything is healthy ✨</p>
        )}
        <div className="space-y-2 max-h-[400px] overflow-auto">
          {logs.map((l) => (
            <div key={l.id} className="p-3 rounded-lg border bg-card text-xs">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={l.level === "error" ? "destructive" : "secondary"} className="text-[10px]">
                  {l.level}
                </Badge>
                <Badge variant="outline" className="text-[10px]">{l.source}</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {new Date(l.created_at).toLocaleString()}
                </span>
              </div>
              <p className="font-mono">{l.message}</p>
              {l.context && Object.keys(l.context).length > 0 && (
                <pre className="mt-1 text-[10px] text-muted-foreground overflow-auto">
                  {JSON.stringify(l.context, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}