import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const MAX_MCP_SERVERS = 5;
export const MAX_MCP_TOOLS = 30;

export type McpToolDef = { name: string; description?: string; inputSchema?: unknown };

export type McpServer = {
  id: string;
  agent_id: string;
  name: string;
  url: string;
  auth_type: "none" | "bearer" | "header";
  auth_header_name: string | null;
  enabled: boolean;
  allowed_tools: string[];
  cached_tools: McpToolDef[];
  last_synced_at: string | null;
  last_status: string | null;
  last_error: string | null;
};

const SELECT =
  "id, agent_id, name, url, auth_type, auth_header_name, enabled, allowed_tools, cached_tools, last_synced_at, last_status, last_error";

export function useMcpServers(agentId?: string) {
  return useQuery({
    queryKey: ["mcp-servers", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_mcp_servers")
        .select(SELECT)
        .eq("agent_id", agentId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as McpServer[];
    },
    enabled: !!agentId,
  });
}

export type McpServerInput = {
  id?: string;
  name: string;
  url: string;
  auth_type: "none" | "bearer" | "header";
  auth_header_name?: string | null;
  /** Only sent when the user typed a new secret. */
  auth_secret?: string;
  enabled: boolean;
  allowed_tools: string[];
};

export function useSaveMcpServer(agentId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: McpServerInput) => {
      const payload: Record<string, unknown> = {
        agent_id: agentId,
        user_id: user!.id,
        name: input.name.trim(),
        url: input.url.trim(),
        auth_type: input.auth_type,
        auth_header_name: input.auth_type === "header" ? input.auth_header_name ?? null : null,
        enabled: input.enabled,
        allowed_tools: input.allowed_tools,
      };
      if (input.auth_secret) payload.auth_secret = input.auth_secret;
      if (input.auth_type === "none") payload.auth_secret = null;

      if (input.id) {
        const { error } = await supabase
          .from("agent_mcp_servers")
          .update(payload as never)
          .eq("id", input.id);
        if (error) throw error;
        return input.id;
      }
      const { data, error } = await supabase
        .from("agent_mcp_servers")
        .insert(payload as never)
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-servers", agentId] }),
  });
}

export function useDeleteMcpServer(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agent_mcp_servers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-servers", agentId] }),
  });
}

type ConnectArgs = {
  action: "test" | "sync";
  server_id?: string;
  url?: string;
  auth_type?: "none" | "bearer" | "header";
  auth_header_name?: string | null;
  auth_secret?: string;
};

/** Calls the mcp-connect function to probe a server or refresh its tool list. */
export function useMcpConnect(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: ConnectArgs) => {
      const { data, error } = await supabase.functions.invoke("mcp-connect", { body: args });
      if (error) throw error;
      return data as { ok: boolean; error?: string; tools?: McpToolDef[]; server?: { serverName?: string } };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-servers", agentId] }),
  });
}
