import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Key, Trash2, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/hooks/useApiKeys";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function ApiKeysSection({ agentId }: { agentId: string }) {
  const { data: keys = [], isLoading } = useApiKeys(agentId);
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const [name, setName] = useState("");
  const [newlyCreated, setNewlyCreated] = useState<string | null>(null);

  const handleCreate = () => {
    createKey.mutate({ agent_id: agentId, name: name || "Default" }, {
      onSuccess: (d) => {
        setNewlyCreated(d.key);
        setName("");
      },
    });
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-api`;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Key className="h-5 w-5" /> API Keys
        </CardTitle>
        <CardDescription>
          Use these keys to call your Agent from external apps via{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{apiUrl}</code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Key name (e.g. Production, Staging)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl"
          />
          <Button onClick={handleCreate} disabled={createKey.isPending} className="rounded-xl gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Generate
          </Button>
        </div>

        {newlyCreated && (
          <div className="p-4 rounded-xl border-2 border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Save this key now. It will not be shown again.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 text-xs p-2 bg-background rounded-lg break-all">{newlyCreated}</code>
                  <Button size="icon" variant="outline" className="rounded-lg" onClick={() => copy(newlyCreated)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => setNewlyCreated(null)}>
                  I have saved it
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {!isLoading && keys.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No keys yet. Generate one above.</p>
          )}
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{k.name}</span>
                  {k.revoked_at ? (
                    <Badge variant="destructive" className="text-[10px]">Revoked</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {k.key_prefix}••••••••
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Created {new Date(k.created_at).toLocaleDateString()}
                  {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                </p>
              </div>
              {!k.revoked_at && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="rounded-lg text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke this API key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apps using this key will immediately stop working. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => revokeKey.mutate({ id: k.id, agent_id: agentId })}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}