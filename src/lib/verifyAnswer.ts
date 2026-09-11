import { supabase } from "@/integrations/supabase/client";

export interface GroundingResult {
  status: "checked" | "skipped";
  verdict?: "supported" | "partially_supported" | "unsupported" | "contradicted";
  grounded?: boolean;
  issues?: string[];
  summary?: string;
  sources?: { file_name: string; similarity: number }[];
}

/**
 * Ask the backend whether an agent answer is actually supported by the files
 * the user uploaded. Returns `skipped` when the agent has no indexed knowledge.
 */
export async function verifyAnswer(params: {
  agentId: string;
  question: string;
  answer: string;
  conversationId?: string;
}): Promise<GroundingResult> {
  const { data, error } = await supabase.functions.invoke("verify-answer", {
    body: {
      agent_id: params.agentId,
      question: params.question,
      answer: params.answer,
      conversation_id: params.conversationId,
    },
  });
  if (error) return { status: "skipped" };
  return (data || { status: "skipped" }) as GroundingResult;
}
