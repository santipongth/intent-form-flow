import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Remove null bytes and control characters that PostgreSQL text columns cannot store */
function sanitizeText(text: string): string {
  // Remove \u0000 and control chars except \t \n \r
  return text.replace(/[\u0000]/g, "").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

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

    try {
      if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".csv")) {
        textContent = await fileData.text();
      } else if (fileName.endsWith(".json")) {
        const raw = await fileData.text();
        try {
          const parsed = JSON.parse(raw);
          textContent = JSON.stringify(parsed, null, 2);
        } catch {
          textContent = raw;
        }
      } else if (fileName.endsWith(".docx")) {
        textContent = await extractTextFromDocx(fileData);
      } else if (fileName.endsWith(".pdf")) {
        const bytes = new Uint8Array(await fileData.arrayBuffer());
        textContent = extractTextFromPdf(bytes);
      } else {
        textContent = await fileData.text();
      }
    } catch (extractErr) {
      console.error("Extraction error:", extractErr);
      await supabase
        .from("knowledge_files")
        .update({ status: "error" })
        .eq("id", knowledge_file_id);
      throw extractErr;
    }

    // Sanitize to remove null bytes and invalid control characters
    textContent = sanitizeText(textContent);

    // Truncate if too large (100k chars max)
    if (textContent.length > 100000) {
      textContent = textContent.substring(0, 100000);
    }

    // Update knowledge_files record
    const { error: updateError } = await supabase
      .from("knowledge_files")
      .update({ content: textContent, status: textContent.length > 0 ? "ready" : "error" })
      .eq("id", knowledge_file_id);

    if (updateError) {
      await supabase
        .from("knowledge_files")
        .update({ status: "error" })
        .eq("id", knowledge_file_id);
      throw updateError;
    }

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

function decodeOctalEscapes(s: string): string {
  return s.replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function extractTextFromPdf(bytes: Uint8Array): string {
  const text: string[] = [];
  const str = new TextDecoder("latin1").decode(bytes);

  // Extract text from PDF stream objects
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match;

  while ((match = streamRegex.exec(str)) !== null) {
    const streamContent = match[1];

    // Tj operator
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
      text.push(decodeOctalEscapes(tjMatch[1]));
    }

    // TJ array operator
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(streamContent)) !== null) {
      const innerRegex = /\(([^)]*)\)/g;
      let innerMatch;
      while ((innerMatch = innerRegex.exec(tjArrMatch[1])) !== null) {
        text.push(decodeOctalEscapes(innerMatch[1]));
      }
    }

    // ' and " operators (text with newline)
    const quoteRegex = /\(([^)]*)\)\s*['"]/g;
    let qMatch;
    while ((qMatch = quoteRegex.exec(streamContent)) !== null) {
      text.push(decodeOctalEscapes(qMatch[1]));
    }
  }

  const result = text.join(" ").replace(/\\n/g, "\n").replace(/\\r/g, "").trim();
  return result || "[Could not extract text from this PDF. Please try uploading a TXT file instead.]";
}

async function extractTextFromDocx(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const zipStr = new TextDecoder("latin1").decode(bytes);

  const xmlParts: string[] = [];
  const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;

  // Track paragraph boundaries
  let lastIndex = 0;
  const pEndRegex = /<\/w:p>/g;
  const pBreaks = new Set<number>();
  let pMatch;
  while ((pMatch = pEndRegex.exec(zipStr)) !== null) {
    pBreaks.add(pMatch.index);
  }

  while ((match = wtRegex.exec(zipStr)) !== null) {
    xmlParts.push(match[1]);
    // Check if there's a </w:p> between lastIndex and current match
    for (const idx of pBreaks) {
      if (idx > lastIndex && idx < match.index) {
        xmlParts.push("\n");
        pBreaks.delete(idx);
      }
    }
    lastIndex = match.index + match[0].length;
  }

  const result = xmlParts.join("");
  return result || "[Could not extract text from this DOCX. Please try uploading a TXT file instead.]";
}
