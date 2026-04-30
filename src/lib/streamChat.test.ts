import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "test-token" } } }),
    },
  },
}));

import { streamChat } from "./streamChat";

function makeStreamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

describe("streamChat", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("parses delta tokens and calls onDone", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeStreamResponse([
        `data: ${JSON.stringify({ choices: [{ delta: { content: "Hi " } }] })}\n`,
        `data: ${JSON.stringify({ choices: [{ delta: { content: "there" } }] })}\n`,
        `data: [DONE]\n`,
      ])
    );
    vi.stubGlobal("fetch", fetchMock);

    const deltas: string[] = [];
    const onDone = vi.fn();
    await streamChat({
      messages: [{ role: "user", content: "hello" }],
      onDelta: (d) => deltas.push(d),
      onDone,
    });

    expect(deltas.join("")).toBe("Hi there");
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("retries on 5xx response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("err", { status: 503 }))
      .mockResolvedValueOnce(
        makeStreamResponse([`data: ${JSON.stringify({ choices: [{ delta: { content: "ok" } }] })}\n`, `data: [DONE]\n`])
      );
    vi.stubGlobal("fetch", fetchMock);

    const deltas: string[] = [];
    await streamChat({
      messages: [{ role: "user", content: "x" }],
      onDelta: (d) => deltas.push(d),
      onDone: () => {},
      maxRetries: 2,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(deltas.join("")).toBe("ok");
  });

  it("does not retry on 4xx", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: "bad" }), { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    const onError = vi.fn();
    await streamChat({
      messages: [{ role: "user", content: "x" }],
      onDelta: () => {},
      onDone: () => {},
      onError,
      maxRetries: 3,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("bad");
  });

  it("handles abort signal", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn().mockImplementation((_url, init) => {
      if (init?.signal?.aborted) {
        const err = new Error("aborted");
        err.name = "AbortError";
        return Promise.reject(err);
      }
      return Promise.resolve(new Response("ok"));
    });
    vi.stubGlobal("fetch", fetchMock);

    const onError = vi.fn();
    await streamChat({
      messages: [{ role: "user", content: "x" }],
      onDelta: () => {},
      onDone: () => {},
      onError,
      signal: controller.signal,
      maxRetries: 0,
    });

    expect(onError).toHaveBeenCalledWith("aborted");
  });
});