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

// ─── ZIP helpers ───────────────────────────────────────────────────────────────

/** Extract a file from a ZIP archive by path. Supports stored (0) and deflated (8). */
async function extractFileFromZip(zipBytes: Uint8Array, targetPath: string): Promise<Uint8Array | null> {
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);

  // Scan Local File Headers (signature 0x04034b50)
  let offset = 0;
  while (offset + 30 <= zipBytes.length) {
    if (view.getUint32(offset, true) !== 0x04034b50) break;

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const nameBytes = zipBytes.slice(offset + 30, offset + 30 + nameLen);
    const fileName = new TextDecoder().decode(nameBytes);
    const dataStart = offset + 30 + nameLen + extraLen;

    if (fileName === targetPath) {
      const raw = zipBytes.slice(dataStart, dataStart + compressedSize);
      if (compressionMethod === 0) {
        return raw; // stored
      }
      if (compressionMethod === 8) {
        // deflated – use DecompressionStream with raw deflate
        const ds = new DecompressionStream("raw");
        const writer = ds.writable.getWriter();
        writer.write(raw);
        writer.close();
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        let totalLen = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalLen += value.length;
        }
        const result = new Uint8Array(totalLen);
        let pos = 0;
        for (const c of chunks) {
          result.set(c, pos);
          pos += c.length;
        }
        return result;
      }
      // unsupported compression
      return null;
    }

    offset = dataStart + compressedSize;
  }
  return null;
}

/** List all file names inside a ZIP archive */
function listZipEntries(zipBytes: Uint8Array): string[] {
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  const names: string[] = [];
  let offset = 0;
  while (offset + 30 <= zipBytes.length) {
    if (view.getUint32(offset, true) !== 0x04034b50) break;
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const nameBytes = zipBytes.slice(offset + 30, offset + 30 + nameLen);
    names.push(new TextDecoder().decode(nameBytes));
    offset = offset + 30 + nameLen + extraLen + compressedSize;
  }
  return names;
}

/** Extract XML content from DOCX (word/document.xml) */
async function extractDocxXml(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const xml = await extractFileFromZip(bytes, "word/document.xml");
  if (!xml) return "";
  return new TextDecoder("utf-8").decode(xml);
}

/** Extract XML content from XLSX (shared strings + sheet XMLs) */
async function extractXlsxXml(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const entries = listZipEntries(bytes);
  const parts: string[] = [];

  // shared strings
  const ss = await extractFileFromZip(bytes, "xl/sharedStrings.xml");
  if (ss) {
    parts.push("=== sharedStrings.xml ===\n" + new TextDecoder("utf-8").decode(ss));
  }

  // worksheets
  const sheetFiles = entries.filter(e => e.startsWith("xl/worksheets/sheet") && e.endsWith(".xml"));
  sheetFiles.sort();
  for (const sf of sheetFiles) {
    const data = await extractFileFromZip(bytes, sf);
    if (data) {
      parts.push(`=== ${sf} ===\n` + new TextDecoder("utf-8").decode(data));
    }
  }

  return parts.join("\n\n");
}

// ─── AI extraction ─────────────────────────────────────────────────────────────

async function extractTextWithAI(textContent: string, fileType: string): Promise<string> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    console.warn("LOVABLE_API_KEY not set, returning raw content");
    return textContent;
  }

  const prompts: Record<string, string> = {
    docx: "Below is the raw XML content from a DOCX file (word/document.xml). Extract ALL text content preserving paragraph structure. Preserve the original language (Thai, English, or any other). Output ONLY the extracted text with line breaks between paragraphs. Do not add commentary.",
    xlsx: "Below is the raw XML content from an XLSX spreadsheet (shared strings + worksheet XMLs). Extract ALL data and format it as readable markdown tables. Preserve the original language (Thai, English, etc). Output ONLY the extracted tables. Do not add commentary.",
    pdf: "Below is text extracted from a PDF. Clean it up, fix any garbled characters, and preserve the original language. Output ONLY the cleaned text.",
  };

  const prompt = prompts[fileType] || "Extract and clean the text content below. Preserve original language. Output ONLY the text.";

  // Truncate XML to avoid exceeding token limits
  const maxInputChars = 80000;
  const truncated = textContent.length > maxInputChars
    ? textContent.substring(0, maxInputChars) + "\n[TRUNCATED]"
    : textContent;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: `${prompt}\n\n---\n\n${truncated}`
          }
        ],
        max_tokens: 16000,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI extraction failed:", response.status, errText);
      return textContent; // fallback to raw content
    }

    const result = await response.json();
    const extracted = result.choices?.[0]?.message?.content || "";
    return extracted.length > 0 ? extracted : textContent;
  } catch (err) {
    console.error("AI extraction error:", err);
    return textContent;
  }
}

// ─── PDF basic fallback ────────────────────────────────────────────────────────

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
  return result || "[Could not extract text from this PDF]";
}

// ─── DOCX basic fallback ───────────────────────────────────────────────────────

function extractTextFromDocxBasic(xmlContent: string): string {
  const parts: string[] = [];
  const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;
  while ((match = wtRegex.exec(xmlContent)) !== null) {
    parts.push(match[1]);
  }
  // Add line breaks at paragraph boundaries
  const result = xmlContent.replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return result || parts.join(" ") || "[Could not extract text from this DOCX]";
}

// ─── Main handler ──────────────────────────────────────────────────────────────

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

    // Server-side validation: confirm record exists and check size
    const { data: fileInfo, error: infoError } = await supabase
      .from("knowledge_files")
      .select("file_size, file_name, file_path")
      .eq("id", knowledge_file_id)
      .single();

    if (infoError || !fileInfo) {
      return new Response(JSON.stringify({ error: "File record not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
    if (fileInfo.file_size > MAX_SIZE) {
      await supabase.from("knowledge_files").update({ status: "error" }).eq("id", knowledge_file_id);
      return new Response(JSON.stringify({ error: "File exceeds size limit" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Allowlist extensions
    const allowedExt = ["pdf", "txt", "md", "csv", "json", "docx", "xlsx", "xls"];
    const ext = (fileInfo.file_name.split(".").pop() || "").toLowerCase();
    if (!allowedExt.includes(ext)) {
      await supabase.from("knowledge_files").update({ status: "error" }).eq("id", knowledge_file_id);
      return new Response(JSON.stringify({ error: "File type not allowed" }), {
        status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("knowledge-files")
      .download(file_path);

    if (downloadError || !fileData) {
      await supabase.from("knowledge_files").update({ status: "error" }).eq("id", knowledge_file_id);
      console.error("Download failed:", downloadError);
      throw new Error("Failed to download file");
    }

    // Magic-byte validation for binary formats
    const head = new Uint8Array(await fileData.slice(0, 8).arrayBuffer());
    const isPDF = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
    const isZip = head[0] === 0x50 && head[1] === 0x4b && (head[2] === 0x03 || head[2] === 0x05); // docx/xlsx
    const isOleXls = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0; // legacy .xls
    if (ext === "pdf" && !isPDF) {
      await supabase.from("knowledge_files").update({ status: "error" }).eq("id", knowledge_file_id);
      return new Response(JSON.stringify({ error: "File contents do not match type" }), {
        status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((ext === "docx" || ext === "xlsx") && !isZip) {
      await supabase.from("knowledge_files").update({ status: "error" }).eq("id", knowledge_file_id);
      return new Response(JSON.stringify({ error: "File contents do not match type" }), {
        status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (ext === "xls" && !isOleXls && !isZip) {
      await supabase.from("knowledge_files").update({ status: "error" }).eq("id", knowledge_file_id);
      return new Response(JSON.stringify({ error: "File contents do not match type" }), {
        status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let textContent = "";
    const fileName = file_path.split("/").pop()?.toLowerCase() || "";

    try {
      if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".csv")) {
        textContent = await fileData.text();
      } else if (fileName.endsWith(".json")) {
        const raw = await fileData.text();
        try {
          textContent = JSON.stringify(JSON.parse(raw), null, 2);
        } catch {
          textContent = raw;
        }
      } else if (fileName.endsWith(".docx")) {
        // Extract XML from ZIP, then send to AI as text
        const xml = await extractDocxXml(fileData);
        if (xml.length > 0) {
          textContent = await extractTextWithAI(xml, "docx");
        } else {
          textContent = "[Could not extract content from DOCX]";
        }
        // If AI returned the raw XML, fallback to basic
        if (textContent.includes("<w:") || textContent.includes("</w:")) {
          textContent = extractTextFromDocxBasic(textContent);
        }
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const xml = await extractXlsxXml(fileData);
        if (xml.length > 0) {
          textContent = await extractTextWithAI(xml, "xlsx");
        } else {
          textContent = "[Could not extract content from Excel file]";
        }
      } else if (fileName.endsWith(".pdf")) {
        // For PDF, try AI with base64 image_url first
        textContent = await extractPdfWithAI(fileData);
      } else {
        textContent = await fileData.text();
      }
    } catch (extractErr) {
      console.error("Extraction error:", extractErr);
      await supabase.from("knowledge_files").update({ status: "error" }).eq("id", knowledge_file_id);
      throw extractErr;
    }

    textContent = sanitizeText(textContent);
    if (textContent.length > 100000) {
      textContent = textContent.substring(0, 100000);
    }

    const { error: updateError } = await supabase
      .from("knowledge_files")
      .update({ content: textContent, status: textContent.length > 0 ? "ready" : "error" })
      .eq("id", knowledge_file_id);

    if (updateError) {
      await supabase.from("knowledge_files").update({ status: "error" }).eq("id", knowledge_file_id);
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, chars: textContent.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-text error:", e);
    return new Response(JSON.stringify({ error: "Failed to process file" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── PDF extraction (uses image_url for binary) ────────────────────────────────

async function extractPdfWithAI(blob: Blob): Promise<string> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (!lovableApiKey) {
    return extractTextFromPdfBasic(bytes);
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract ALL text content from this PDF document. Preserve the original language (Thai, English, or any other). Output ONLY the extracted text with paragraph structure. Do not add commentary."
            },
            {
              type: "image_url",
              image_url: { url: `data:application/pdf;base64,${base64Data}` }
            }
          ]
        }],
        max_tokens: 16000,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.error("PDF AI extraction failed:", response.status);
      return extractTextFromPdfBasic(bytes);
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || "";
    return text.length > 0 ? text : extractTextFromPdfBasic(bytes);
  } catch (err) {
    console.error("PDF AI error:", err);
    return extractTextFromPdfBasic(bytes);
  }
}
