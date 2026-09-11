import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizePublicUrl } from "./url-safety.ts";

Deno.test("normalizes a public URL", () => {
  assertEquals(normalizePublicUrl(" https://example.com/docs#part "), "https://example.com/docs");
});

Deno.test("rejects unsupported and private URLs", () => {
  for (const url of ["file:///etc/passwd", "http://localhost/x", "http://127.0.0.1", "http://10.0.0.2", "http://192.168.1.1"]) {
    assertThrows(() => normalizePublicUrl(url));
  }
});