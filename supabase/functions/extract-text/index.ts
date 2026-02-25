import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Remove null bytes and control characters that PostgreSQL text columns cannot store */
function sanitizeText(text: string): string {
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
        // Use AI-based extraction for PDFs (handles all languages including Thai)
        textContent = await extractTextWithAI(fileData, "pdf");
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

/**
 * Use Lovable AI (Gemini Flash) to extract text from binary documents.
 * This handles all languages including Thai, Chinese, Japanese, etc.
 */
async function extractTextWithAI(blob: Blob, fileType: string): Promise<string> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    console.warn("LOVABLE_API_KEY not set, falling back to basic extraction");
    if (fileType === "pdf") {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      return extractTextFromPdfBasic(bytes);
    }
    return await blob.text();
  }

  // Convert blob to base64
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  const mimeType = fileType === "pdf" ? "application/pdf" : "application/octet-stream";

  try {
    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract ALL text content from this document. Preserve the original language (Thai, English, or any other language). Output ONLY the extracted text, maintaining paragraph structure with line breaks. Do not add any commentary, headers, or formatting beyond what's in the document. If there are tables, format them in a readable way."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 16000,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI extraction failed:", response.status, errText);
      // Fallback to basic extraction
      if (fileType === "pdf") {
        const bytes2 = new Uint8Array(arrayBuffer);
        return extractTextFromPdfBasic(bytes2);
      }
      return "[Could not extract text from this file]";
    }

    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content || "";
    
    if (extractedText.length > 0) {
      return extractedText;
    }

    // Fallback if AI returned empty
    if (fileType === "pdf") {
      const bytes2 = new Uint8Array(arrayBuffer);
      return extractTextFromPdfBasic(bytes2);
    }
    return "[Could not extract text from this file]";
  } catch (err) {
    console.error("AI extraction error:", err);
    if (fileType === "pdf") {
      const bytes2 = new Uint8Array(arrayBuffer);
      return extractTextFromPdfBasic(bytes2);
    }
    return "[Could not extract text from this file]";
  }
}

/** Basic PDF text extraction fallback - works for simple ASCII/Latin PDFs */
function extractTextFromPdfBasic(bytes: Uint8Array): string {
  const text: string[] = [];
  const str = new TextDecoder("latin1").decode(bytes);

  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match;

  while ((match = streamRegex.exec(str)) !== null) {
    const streamContent = match[1];

    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
      text.push(tjMatch[1]);
    }

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

async function extractTextFromDocx(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const zipStr = new TextDecoder("latin1").decode(bytes);

  const xmlParts: string[] = [];
  const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;

  let lastIndex = 0;
  const pEndRegex = /<\/w:p>/g;
  const pBreaks = new Set<number>();
  let pMatch;
  while ((pMatch = pEndRegex.exec(zipStr)) !== null) {
    pBreaks.add(pMatch.index);
  }

  while ((match = wtRegex.exec(zipStr)) !== null) {
    xmlParts.push(match[1]);
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
