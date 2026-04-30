import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Webhook, Trash2, Plus } from "lucide-react";
import { useWebhooks, useCreateWebhook, useToggleWebhook, useDeleteWebhook } from "@/hooks/useWebhooks";

export function WebhooksSection({ agentId }: { agentId: string }) {
  const { data: hooks = [], isLoading } = useWebhooks(agentId);
  const create = useCreateWebhook();
  const toggle = useToggleWebhook();
  const del = useDeleteWebhook();
  const [url, setUrl] = useState("");

  const handleAdd = () => {
    if (!url.startsWith("http")) return;
    create.mutate({ agent_id: agentId, url }, { onSuccess: () => setUrl("") });
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Webhook className="h-5 w-5" /> Webhooks
        </CardTitle>
        <CardDescription>
          Receive POST notifications on every chat completion. Verify with header <code className="text-xs">x-tm-signature</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://your-app.com/webhooks/agent"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded-xl"
          />
          <Button onClick={handleAdd} disabled={create.isPending || !url} className="rounded-xl gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {!isLoading && hooks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No webhooks configured.</p>
          )}
          {hooks.map((h) => (
            <div key={h.id} className="p-3 rounded-xl border bg-card space-y-2">
              <div className="flex items-center gap-2">
                <code className="text-xs flex-1 truncate">{h.url}</code>
                <Switch
                  checked={h.enabled}
                  onCheckedChange={(v) => toggle.mutate({ id: h.id, enabled: v, agent_id: agentId })}
                />
                <Button size="icon" variant="ghost" className="rounded-lg text-destructive"
                  onClick={() => del.mutate({ id: h.id, agent_id: agentId })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {h.events.map((e) => <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>)}
                {h.last_status && <span>· last: {h.last_status}</span>}
              </div>
              <details className="text-[10px]">
                <summary className="cursor-pointer text-muted-foreground">Show signing secret</summary>
                <code className="block mt-1 p-2 bg-muted rounded break-all">{h.secret}</code>
              </details>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}