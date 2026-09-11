import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { streamChat, type ChatMsg } from "@/lib/streamChat";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

/**
 * Lets the user try the agent's persona before it exists in the database.
 * The composed system prompt is sent as a system message; no agent id, so
 * knowledge base and tools are not involved yet.
 */
export function PreviewChat({ systemPrompt }: { systemPrompt: string }) {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const history: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    await streamChat({
      messages: [{ role: "system", content: systemPrompt }, ...history],
      onDelta: (d) =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: next[next.length - 1].content + d };
          return next;
        }),
      onDone: () => setBusy(false),
      onError: (e) => {
        setBusy(false);
        toast.error(e);
      },
    });
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div>
          <p className="font-semibold text-sm">{t("builder.tryIt")}</p>
          <p className="text-xs text-muted-foreground">{t("builder.tryItHelp")}</p>
        </div>
        {messages.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto rounded-xl bg-secondary/40 p-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"
                  }`}
                >
                  {m.content || (busy ? "…" : "")}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
            placeholder={t("builder.tryItPlaceholder")}
            className="rounded-xl"
          />
          <Button onClick={send} disabled={busy || !input.trim()} className="rounded-xl gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">{t("builder.tryItSend")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
