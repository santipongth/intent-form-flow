import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Webhook, Trash2, Plus, Send, Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useWebhooks, useCreateWebhook, useToggleWebhook, useDeleteWebhook,
  useUpdateWebhookEvents, useTestWebhook, WEBHOOK_EVENTS,
} from "@/hooks/useWebhooks";

export function WebhooksSection({ agentId }: { agentId: string }) {
  const { data: hooks = [], isLoading } = useWebhooks(agentId);
  const create = useCreateWebhook();
  const toggle = useToggleWebhook();
  const del = useDeleteWebhook();
  const updateEvents = useUpdateWebhookEvents();
  const testHook = useTestWebhook();
  const [url, setUrl] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const revealSecret = async (id: string) => {
    if (revealed[id]) {
      const { [id]: _, ...rest } = revealed;
      setRevealed(rest);
      return;
    }
    const { data, error } = await supabase
      .from("agent_webhooks")
      .select("secret")
      .eq("id", id)
      .maybeSingle();
    if (!error && data?.secret) setRevealed((r) => ({ ...r, [id]: data.secret }));
  };

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
          {hooks.map((h) => {
            const isTesting = testingId === h.id && testHook.isPending;
            const lastOk = h.last_status?.match(/\b2\d\d\b/) || h.last_status?.includes("OK");
            const lastBad = h.last_status?.includes("error") || h.last_status?.match(/\b[45]\d\d\b/);
            return (
              <div key={h.id} className="p-3 rounded-xl border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <code className="text-xs flex-1 truncate">{h.url}</code>
                  <Switch
                    checked={h.enabled}
                    onCheckedChange={(v) => toggle.mutate({ id: h.id, enabled: v, agent_id: agentId })}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg gap-1.5"
                    disabled={isTesting}
                    onClick={() => {
                      setTestingId(h.id);
                      testHook.mutate({ webhook_id: h.id });
                    }}
                  >
                    {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Test
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-lg text-destructive"
                    onClick={() => del.mutate({ id: h.id, agent_id: agentId })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Event selection */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">Events</p>
                  <div className="flex flex-wrap gap-3">
                    {WEBHOOK_EVENTS.map((evt) => {
                      const checked = h.events?.includes(evt) ?? false;
                      return (
                        <label key={evt} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const next = v
                                ? Array.from(new Set([...(h.events || []), evt]))
                                : (h.events || []).filter((x) => x !== evt);
                              updateEvents.mutate({ id: h.id, events: next, agent_id: agentId });
                            }}
                          />
                          <code className="text-[11px]">{evt}</code>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Last status */}
                {h.last_status && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {lastOk && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    {lastBad && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                    <span className="text-muted-foreground">
                      Last: {h.last_status}
                      {h.last_triggered_at && ` · ${new Date(h.last_triggered_at).toLocaleString()}`}
                    </span>
                  </div>
                )}

                <div className="text-[10px]">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => revealSecret(h.id)}>
                    <Eye className="h-3 w-3 mr-1" />
                    {revealed[h.id] ? "Hide signing secret" : "Show signing secret"}
                  </Button>
                  {revealed[h.id] && (
                    <>
                      <code className="block mt-1 p-2 bg-muted rounded break-all">{revealed[h.id]}</code>
                      <p className="mt-1 text-muted-foreground">
                        Verify: SHA-256 of <code>(body + secret)</code> matches header <code>x-tm-signature</code>
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}