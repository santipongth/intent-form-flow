import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { embedTexts } from "../_shared/embeddings.ts";
serve(async () => {
  try {
    const v = await embedTexts(["hello world"], Deno.env.get("LOVABLE_API_KEY") || "");
    return new Response(JSON.stringify({ ok: true, dims: v[0]?.length ?? 0 }));
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { status: 500 });
  }
});
