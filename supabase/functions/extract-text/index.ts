import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { file_path, knowledge_file_id } = await req.json();
    if (!file_path || !knowledge_file_id) {
      throw new Error("file_path and knowledge_file_id are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("knowledge-files")
      .download(file_path);

    if (downloadError || !fileData) {
      await supabase
        .from("knowledge_files")
        .update({ status: "error" })
        .eq("id", knowledge_file_id);
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Extract text based on file type
    let textContent = "";
    const fileName = file_path.split("/").pop()?.toLowerCase() || "";

    if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".csv")) {
      textContent = await fileData.text();
    } else if (fileName.endsWith(".pdf")) {
      // Basic PDF text extraction - extract readable text from PDF binary
      const bytes = new Uint8Array(await fileData.arrayBuffer());
      textContent = extractTextFromPdf(bytes);
    } else {
      textContent = await fileData.text();
    }

    // Truncate if too large (100k chars max)
    if (textContent.length > 100000) {
      textContent = textContent.substring(0, 100000);
    }

    // Update knowledge_files record
    const { error: updateError } = await supabase
      .from("knowledge_files")
      .update({ content: textContent, status: textContent.length > 0 ? "ready" : "error" })
      .eq("id", knowledge_file_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, chars: textContent.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractTextFromPdf(bytes: Uint8Array): string {
  // Simple PDF text extraction - finds text between BT/ET blocks and parentheses
  const text: string[] = [];
  const str = new TextDecoder("latin1").decode(bytes);
  
  // Extract text from PDF stream objects
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match;
  
  while ((match = streamRegex.exec(str)) !== null) {
    const streamContent = match[1];
    // Find text show operators: Tj, TJ, ', "
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
      text.push(tjMatch[1]);
    }
    
    // TJ array operator
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(streamContent)) !== null) {
      const innerRegex = /\(([^)]*)\)/g;
      let innerMatch;
      while ((innerMatch = innerRegex.exec(tjArrMatch[1])) !== null) {
        text.push(innerMatch[1]);
      }
    }
  }
  
  const result = text.join(" ").replace(/\\n/g, "\n").replace(/\\r/g, "").trim();
  return result || "[Could not extract text from this PDF. Please try uploading a TXT file instead.]";
}
