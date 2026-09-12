import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, MessageCircle, Send, Timer, Quote, Sparkles, Plus, Square } from "lucide-react";
import { useAgents, type AgentRow } from "@/hooks/useAgents";
import { useLanguage } from "@/contexts/LanguageContext";
import { WORK_CATEGORIES, workCategoryOfTemplate, type WorkCategory } from "@/data/constants";
import { streamChat, type ChatMeta } from "@/lib/streamChat";
import { getSkills } from "@/lib/agentTools";

interface RunState {
  answer: string;
  question: string;
  citations: ChatMeta["citations"];
  ms: number | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_RUN: RunState = { answer: "", question: "", citations: [], ms: null, loading: false, error: null };

function AgentShowcaseCard({ agent, category }: { agent: AgentRow; category?: WorkCategory }) {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [run, setRun] = useState<RunState>(EMPTY_RUN);
  const abortRef = useRef<AbortController | null>(null);

  const skills = getSkills(agent.tools as Record<string, unknown>);
  const suggestions = category?.sampleQuestions.map((q) => q[locale]) ?? [];

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || run.loading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = performance.now();
    setRun({ ...EMPTY_RUN, question: text, loading: true });

    await streamChat({
      messages: [{ role: "user", content: text }],
      agentId: agent.id,
      signal: controller.signal,
      onDelta: (delta) => setRun((prev) => ({ ...prev, answer: prev.answer + delta })),
      onMeta: (meta) => setRun((prev) => ({ ...prev, citations: meta.citations ?? prev.citations })),
      onError: (err) =>
        setRun((prev) => ({
          ...prev,
          loading: false,
          error: err === "aborted" ? null : err,
        })),
      onDone: () =>
        setRun((prev) => ({ ...prev, loading: false, ms: Math.round(performance.now() - startedAt) })),
    });
  };

  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-xl">
              {agent.avatar || "🤖"}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{agent.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{agent.objective}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 rounded-xl gap-1.5" onClick={() => navigate(`/chat?agent=${agent.id}`)}>
            <MessageCircle className="h-3.5 w-3.5" /> {t("showcase.chatWith")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="rounded-full text-[10px] font-normal">{agent.model}</Badge>
          {skills.slice(0, 3).map((s) => (
            <Badge key={s} variant="outline" className="rounded-full text-[10px] font-normal">{s}</Badge>
          ))}
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                disabled={run.loading}
                onClick={() => ask(q)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); }
            }}
            placeholder={t("showcase.askPlaceholder")}
            rows={1}
            className="min-h-10 resize-none rounded-xl"
          />
          {run.loading ? (
            <Button size="icon" variant="outline" className="rounded-xl" onClick={() => abortRef.current?.abort()} aria-label={t("showcase.stop")}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" className="rounded-xl gradient-primary text-primary-foreground" onClick={() => ask(input)} aria-label={t("showcase.ask")}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>

        {(run.question || run.loading) && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/30 p-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{t("showcase.question")}:</span> {run.question}
            </p>
            {run.error ? (
              <p className="text-sm text-destructive">{run.error}</p>
            ) : run.answer ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{run.answer}</p>
            ) : (
              <Skeleton className="h-4 w-2/3" />
            )}
            {run.citations && run.citations.length > 0 && (
              <div className="space-y-1.5 border-t border-border/60 pt-2">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Quote className="h-3 w-3" /> {t("showcase.sources")}
                </p>
                {run.citations.map((c) => (
                  <p key={`${c.index}-${c.file_name}`} className="text-[11px] text-muted-foreground">
                    [{c.index}] {c.file_name} · {Math.round(c.similarity * 100)}%
                  </p>
                ))}
              </div>
            )}
            {run.ms !== null && !run.loading && (
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Timer className="h-3 w-3" /> {t("showcase.answeredIn")} {(run.ms / 1000).toFixed(1)}s
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Showcase() {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const { data: agents, isLoading } = useAgents();

  const groups = useMemo(() => {
    const byCategory = new Map<string, AgentRow[]>();
    const others: AgentRow[] = [];
    (agents ?? []).forEach((agent) => {
      const cat = workCategoryOfTemplate(agent.template);
      if (!cat) { others.push(agent); return; }
      const list = byCategory.get(cat.id) ?? [];
      list.push(agent);
      byCategory.set(cat.id, list);
    });
    const ordered = WORK_CATEGORIES
      .filter((c) => byCategory.has(c.id))
      .map((c) => ({ category: c as WorkCategory | undefined, agents: byCategory.get(c.id)! }));
    if (others.length > 0) ordered.push({ category: undefined, agents: others });
    return ordered;
  }, [agents]);

  return (
    <div className="px-4 py-6 sm:p-8 max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{t("showcase.title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("showcase.subtitle")}</p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="rounded-2xl"><CardContent className="space-y-3 p-5">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </CardContent></Card>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-10 text-center space-y-4">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{t("showcase.empty")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button className="gradient-primary text-primary-foreground rounded-xl gap-2" onClick={() => navigate("/marketplace")}>
                <Sparkles className="h-4 w-4" /> {t("showcase.browseTemplates")}
              </Button>
              <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate("/agents/new")}>
                <Plus className="h-4 w-4" /> {t("dashboard.createAgent")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        groups.map(({ category, agents: list }) => (
          <section key={category?.id ?? "other"} className="space-y-4 border-t border-border/60 pt-6 first:border-t-0 first:pt-0">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-semibold">
                {category ? <><span aria-hidden="true" className="mr-1.5">{category.icon}</span>{category.name[locale]}</> : t("showcase.otherCategory")}
              </h2>
              {category && <p className="max-w-2xl text-sm text-muted-foreground">{category.description[locale]}</p>}
            </div>
            <div className="space-y-4">
              {list.map((agent) => (
                <AgentShowcaseCard key={agent.id} agent={agent} category={category} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
