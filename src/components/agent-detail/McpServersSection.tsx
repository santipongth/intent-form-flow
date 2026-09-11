import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Network, Plus, Trash2, RefreshCw, FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useMcpServers, useSaveMcpServer, useDeleteMcpServer, useMcpConnect,
  MAX_MCP_SERVERS, type McpServer, type McpToolDef,
} from "@/hooks/useMcpServers";

type Draft = {
  id?: string;
  name: string;
  url: string;
  auth_type: "none" | "bearer" | "header";
  auth_header_name: string;
  auth_secret: string;
  enabled: boolean;
  allowed_tools: string[];
};

const emptyDraft = (): Draft => ({
  name: "", url: "", auth_type: "none", auth_header_name: "Authorization",
  auth_secret: "", enabled: true, allowed_tools: [],
});

export function McpServersSection({ agentId }: { agentId: string }) {
  const { t } = useLanguage();
  const { data: servers = [], isLoading } = useMcpServers(agentId);
  const save = useSaveMcpServer(agentId);
  const del = useDeleteMcpServer(agentId);
  const connect = useMcpConnect(agentId);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [probed, setProbed] = useState<McpToolDef[] | null>(null);

  const startEdit = (s: McpServer) => {
    setProbed(s.cached_tools ?? null);
    setDraft({
      id: s.id, name: s.name, url: s.url, auth_type: s.auth_type,
      auth_header_name: s.auth_header_name || "Authorization",
      auth_secret: "", enabled: s.enabled, allowed_tools: s.allowed_tools ?? [],
    });
  };

  const validate = (d: Draft): string | null => {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,30}$/.test(d.name)) return t("mcp.errName");
    if (!/^https:\/\//i.test(d.url)) return t("mcp.errUrl");
    if (d.auth_type !== "none" && !d.id && !d.auth_secret) return t("mcp.errSecret");
    return null;
  };

  const handleTest = async () => {
    if (!draft) return;
    const err = validate(draft);
    if (err) return toast.error(err);
    const res = await connect.mutateAsync({
      action: "test",
      server_id: draft.id,
      url: draft.url,
      auth_type: draft.auth_type,
      auth_header_name: draft.auth_header_name,
      auth_secret: draft.auth_secret || undefined,
    }).catch((e) => ({ ok: false, error: (e as Error).message }) as const);
    if (!res.ok) return toast.error(res.error || t("mcp.testFailed"));
    setProbed((res as { tools?: McpToolDef[] }).tools ?? []);
    toast.success(t("mcp.testOk").replace("{n}", String((res as { tools?: McpToolDef[] }).tools?.length ?? 0)));
  };

  const handleSave = async () => {
    if (!draft) return;
    const err = validate(draft);
    if (err) return toast.error(err);
    if (!draft.id && servers.length >= MAX_MCP_SERVERS) return toast.error(t("mcp.errMax"));
    try {
      const id = await save.mutateAsync(draft);
      // Pull the server's tool list so chat turns can use it without a round-trip.
      const res = await connect.mutateAsync({ action: "sync", server_id: id });
      if (!res.ok) toast.warning(res.error || t("mcp.syncFailed"));
      else toast.success(t("mcp.saved"));
      setDraft(null);
      setProbed(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleTool = (name: string) => {
    if (!draft) return;
    const has = draft.allowed_tools.includes(name);
    setDraft({
      ...draft,
      allowed_tools: has
        ? draft.allowed_tools.filter((n) => n !== name)
        : [...draft.allowed_tools, name],
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" /> {t("mcp.title")}
            </CardTitle>
            <CardDescription>{t("mcp.description")}</CardDescription>
          </div>
          {!draft && (
            <Button size="sm" onClick={() => { setDraft(emptyDraft()); setProbed(null); }}>
              <Plus className="h-4 w-4 mr-1" /> {t("mcp.add")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}

        {!isLoading && servers.length === 0 && !draft && (
          <p className="text-sm text-muted-foreground">{t("mcp.empty")}</p>
        )}

        {servers.map((s) => (
          <div key={s.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{s.name}</span>
                <Badge variant={s.enabled ? "secondary" : "outline"}>
                  {s.enabled ? t("mcp.enabled") : t("mcp.disabled")}
                </Badge>
                <Badge variant="outline">
                  {t("mcp.toolCount").replace("{n}", String(s.cached_tools?.length ?? 0))}
                </Badge>
                {s.last_status === "error" && (
                  <Badge variant="destructive">{t("mcp.statusError")}</Badge>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{s.url}</p>
              {s.last_error && <p className="mt-1 text-xs text-destructive">{s.last_error}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                size="icon" variant="ghost" title={t("mcp.sync")}
                onClick={async () => {
                  const res = await connect.mutateAsync({ action: "sync", server_id: s.id })
                    .catch((e) => ({ ok: false, error: (e as Error).message }) as const);
                  if (res.ok) toast.success(t("mcp.syncOk"));
                  else toast.error(res.error || t("mcp.syncFailed"));
                }}
              >
                {connect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={() => startEdit(s)}>{t("common.edit")}</Button>
              <Button
                size="icon" variant="ghost"
                onClick={() => del.mutate(s.id, { onSuccess: () => toast.success(t("mcp.deleted")) })}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        {draft && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("mcp.name")}</Label>
                <Input
                  value={draft.name}
                  placeholder="notion"
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("mcp.url")}</Label>
                <Input
                  value={draft.url}
                  placeholder="https://mcp.example.com/mcp"
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("mcp.auth")}</Label>
                <Select
                  value={draft.auth_type}
                  onValueChange={(v) => setDraft({ ...draft, auth_type: v as Draft["auth_type"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("mcp.authNone")}</SelectItem>
                    <SelectItem value="bearer">{t("mcp.authBearer")}</SelectItem>
                    <SelectItem value="header">{t("mcp.authHeader")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.auth_type === "header" && (
                <div className="space-y-1.5">
                  <Label>{t("mcp.headerName")}</Label>
                  <Input
                    value={draft.auth_header_name}
                    onChange={(e) => setDraft({ ...draft, auth_header_name: e.target.value })}
                  />
                </div>
              )}
              {draft.auth_type !== "none" && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t("mcp.token")}</Label>
                  <Input
                    type="password"
                    value={draft.auth_secret}
                    placeholder={draft.id ? t("mcp.tokenKeep") : ""}
                    onChange={(e) => setDraft({ ...draft, auth_secret: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={draft.enabled}
                onCheckedChange={(v) => setDraft({ ...draft, enabled: v })}
              />
              <span className="text-sm">{t("mcp.enableForAgent")}</span>
            </div>

            {probed && probed.length > 0 && (
              <div className="space-y-2">
                <Label>{t("mcp.selectTools")}</Label>
                <p className="text-xs text-muted-foreground">{t("mcp.selectToolsHint")}</p>
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2">
                  {probed.map((tool) => (
                    <label key={tool.name} className="flex items-start gap-2 text-sm">
                      <Checkbox
                        checked={draft.allowed_tools.length === 0 || draft.allowed_tools.includes(tool.name)}
                        onCheckedChange={() => toggleTool(tool.name)}
                      />
                      <span className="min-w-0">
                        <span className="font-mono text-xs">{tool.name}</span>
                        {tool.description && (
                          <span className="block text-xs text-muted-foreground line-clamp-2">
                            {tool.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleTest} disabled={connect.isPending}>
                {connect.isPending
                  ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  : <FlaskConical className="h-4 w-4 mr-1" />}
                {t("mcp.test")}
              </Button>
              <Button onClick={handleSave} disabled={save.isPending}>{t("common.save")}</Button>
              <Button variant="ghost" onClick={() => { setDraft(null); setProbed(null); }}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
