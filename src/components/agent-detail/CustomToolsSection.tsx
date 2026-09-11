import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plug, Plus, Trash2, FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useCustomTools, useSaveCustomTool, useDeleteCustomTool, useTestCustomTool,
  MAX_CUSTOM_TOOLS, type CustomTool, type CustomToolParam,
} from "@/hooks/useEnterprise";

type Draft = {
  id?: string;
  name: string;
  description: string;
  method: string;
  url: string;
  parameters: CustomToolParam[];
  auth_type: "none" | "header" | "bearer";
  auth_header_name: string;
  auth_secret: string;
  enabled: boolean;
};

const emptyDraft = (): Draft => ({
  name: "", description: "", method: "GET", url: "",
  parameters: [], auth_type: "none", auth_header_name: "x-api-key", auth_secret: "", enabled: true,
});

export function CustomToolsSection({ agentId }: { agentId: string }) {
  const { t } = useLanguage();
  const { data: tools = [], isLoading } = useCustomTools(agentId);
  const save = useSaveCustomTool(agentId);
  const del = useDeleteCustomTool(agentId);
  const test = useTestCustomTool();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const startEdit = (tool: CustomTool) => {
    setTestResult(null);
    setDraft({
      id: tool.id,
      name: tool.name,
      description: tool.description || "",
      method: tool.method,
      url: tool.url,
      parameters: tool.parameters || [],
      auth_type: tool.auth_type,
      auth_header_name: tool.auth_header_name || "x-api-key",
      auth_secret: "",
      enabled: tool.enabled,
    });
  };

  const validate = (d: Draft): string | null => {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(d.name)) return t("tools.errName");
    if (!/^https:\/\//i.test(d.url)) return t("tools.errUrl");
    if (!d.description.trim()) return t("tools.errDescription");
    if (d.auth_type !== "none" && !d.id && !d.auth_secret) return t("tools.errSecret");
    if (d.parameters.some((p) => !/^[a-zA-Z][a-zA-Z0-9_]{0,30}$/.test(p.name))) return t("tools.errParam");
    return null;
  };

  const handleSave = async () => {
    if (!draft) return;
    const err = validate(draft);
    if (err) { toast.error(err); return; }
    if (!draft.id && tools.length >= MAX_CUSTOM_TOOLS) {
      toast.error(t("tools.errMax")); return;
    }
    try {
      await save.mutateAsync({ ...draft, auth_secret: draft.auth_secret || null });
      toast.success(t("tools.saved"));
      setDraft(null);
    } catch (e: any) {
      toast.error(e?.message || t("tools.errSave"));
    }
  };

  const handleTest = async (toolId: string, params: CustomToolParam[]) => {
    setTestResult(null);
    try {
      const args: Record<string, unknown> = {};
      for (const p of params) if (p.required) args[p.name] = p.type === "number" ? 1 : p.type === "boolean" ? true : "test";
      const r = await test.mutateAsync({ toolId, args });
      setTestResult(
        r.ok
          ? `${t("tools.testOk")} (HTTP ${r.status}, ${r.duration_ms}ms)\n${(r.body || "").slice(0, 600)}`
          : `${t("tools.testFail")}: ${r.error || `HTTP ${r.status}`}`,
      );
      r.ok ? toast.success(t("tools.testOk")) : toast.error(t("tools.testFail"));
    } catch (e: any) {
      toast.error(e?.message || t("tools.testFail"));
    }
  };

  const updateParam = (i: number, patch: Partial<CustomToolParam>) => {
    if (!draft) return;
    const next = [...draft.parameters];
    next[i] = { ...next[i], ...patch };
    setDraft({ ...draft, parameters: next });
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plug className="h-4 w-4" /> {t("tools.title")}
          </CardTitle>
          <CardDescription>{t("tools.subtitle")}</CardDescription>
        </div>
        <Button
          size="sm" variant="outline" className="rounded-xl gap-1.5 shrink-0"
          onClick={() => { setTestResult(null); setDraft(emptyDraft()); }}
          disabled={tools.length >= MAX_CUSTOM_TOOLS}
        >
          <Plus className="h-4 w-4" /> {t("tools.add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}

        {!isLoading && tools.length === 0 && !draft && (
          <p className="text-sm text-muted-foreground">{t("tools.empty")}</p>
        )}

        {tools.map((tool) => (
          <div key={tool.id} className="rounded-xl border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{tool.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{tool.method}</Badge>
                  {!tool.enabled && <Badge variant="outline" className="text-[10px]">{t("tools.disabled")}</Badge>}
                  {tool.auth_type !== "none" && <Badge variant="outline" className="text-[10px]">{t("tools.secured")}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground break-all">{tool.url}</p>
                {tool.last_test_status && (
                  <p className="text-[11px] text-muted-foreground mt-1">{t("tools.lastTest")}: {tool.last_test_status}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => handleTest(tool.id, tool.parameters)} disabled={test.isPending}>
                  {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => startEdit(tool)}>{t("common.edit")}</Button>
                <Button
                  size="sm" variant="ghost" className="rounded-lg text-destructive"
                  onClick={async () => { await del.mutateAsync(tool.id); toast.success(t("tools.deleted")); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {testResult && (
          <pre className="text-[11px] bg-muted rounded-xl p-3 whitespace-pre-wrap break-all max-h-48 overflow-auto">{testResult}</pre>
        )}

        {draft && (
          <div className="rounded-xl border p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("tools.name")}</Label>
                <Input className="rounded-xl" value={draft.name} placeholder="order_status"
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">{t("tools.method")}</Label>
                <Select value={draft.method} onValueChange={(v) => setDraft({ ...draft, method: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">{t("tools.url")}</Label>
              <Input className="rounded-xl" value={draft.url} placeholder="https://api.example.com/orders"
                onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">{t("tools.description")}</Label>
              <Textarea className="rounded-xl" rows={2} value={draft.description}
                placeholder={t("tools.descriptionHint")}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>

            {/* Parameters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t("tools.parameters")}</Label>
                <Button size="sm" variant="ghost" className="rounded-lg gap-1"
                  onClick={() => setDraft({ ...draft, parameters: [...draft.parameters, { name: "", type: "string", required: false }] })}>
                  <Plus className="h-3.5 w-3.5" /> {t("tools.addParam")}
                </Button>
              </div>
              {draft.parameters.map((p, i) => (
                <div key={i} className="grid grid-cols-[1fr_110px_110px_auto] gap-2 items-center">
                  <Input className="rounded-xl h-9" placeholder="order_id" value={p.name}
                    onChange={(e) => updateParam(i, { name: e.target.value })} />
                  <Select value={p.type} onValueChange={(v) => updateParam(i, { type: v as any })}>
                    <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">string</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="boolean">boolean</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={p.required ? "required" : "optional"} onValueChange={(v) => updateParam(i, { required: v === "required" })}>
                    <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">{t("tools.required")}</SelectItem>
                      <SelectItem value="optional">{t("tools.optional")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" className="rounded-lg text-destructive"
                    onClick={() => setDraft({ ...draft, parameters: draft.parameters.filter((_, j) => j !== i) })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Auth */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("tools.auth")}</Label>
                <Select value={draft.auth_type} onValueChange={(v) => setDraft({ ...draft, auth_type: v as any })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("tools.authNone")}</SelectItem>
                    <SelectItem value="header">{t("tools.authHeader")}</SelectItem>
                    <SelectItem value="bearer">{t("tools.authBearer")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.auth_type === "header" && (
                <div>
                  <Label className="text-xs">{t("tools.headerName")}</Label>
                  <Input className="rounded-xl" value={draft.auth_header_name}
                    onChange={(e) => setDraft({ ...draft, auth_header_name: e.target.value })} />
                </div>
              )}
              {draft.auth_type !== "none" && (
                <div className="sm:col-span-2">
                  <Label className="text-xs">{t("tools.secret")}</Label>
                  <Input className="rounded-xl" type="password" value={draft.auth_secret}
                    placeholder={draft.id ? t("tools.secretKeep") : "••••••••"}
                    onChange={(e) => setDraft({ ...draft, auth_secret: e.target.value })} />
                  <p className="text-[11px] text-muted-foreground mt-1">{t("tools.secretHint")}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={draft.enabled} onCheckedChange={(v) => setDraft({ ...draft, enabled: v })} />
                <span className="text-sm">{t("tools.enabled")}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setDraft(null)}>{t("common.cancel")}</Button>
                <Button className="rounded-xl gradient-primary text-primary-foreground" onClick={handleSave} disabled={save.isPending}>
                  {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
