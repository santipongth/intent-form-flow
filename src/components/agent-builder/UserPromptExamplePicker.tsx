import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { USER_PROMPT_CATEGORIES, USER_PROMPT_SAMPLE_ANSWERS } from "@/data/userPromptExamples";

interface Props {
  currentValue: string;
  onInsert: (text: string) => void;
}

export function UserPromptExamplePicker({ currentValue, onInsert }: Props) {
  const { t, locale } = useLanguage();
  const lang = locale === "en" ? "en" : "th";
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(USER_PROMPT_CATEGORIES[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const category = useMemo(
    () => USER_PROMPT_CATEGORIES.find((c) => c.id === categoryId) ?? USER_PROMPT_CATEGORIES[0],
    [categoryId]
  );
  const selected = category.examples.find((e) => e.id === selectedId) ?? category.examples[0];
  const sampleAnswer = USER_PROMPT_SAMPLE_ANSWERS[selected.id]?.[lang];
  const [tab, setTab] = useState("prompt");

  const insert = (mode: "replace" | "append") => {
    const text = selected.prompt[lang];
    if (mode === "append" && currentValue.trim()) {
      onInsert(`${currentValue.trimEnd()}\n\n${text}`);
    } else {
      onInsert(text);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs rounded-lg gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          {t("builder.userPromptExamples")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("builder.userPromptExamplesTitle")}</DialogTitle>
          <DialogDescription>{t("builder.userPromptExamplesDesc")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {USER_PROMPT_CATEGORIES.map((c) => (
            <Button
              key={c.id}
              type="button"
              size="sm"
              variant={c.id === category.id ? "default" : "outline"}
              className="h-7 rounded-full text-xs"
              onClick={() => {
                setCategoryId(c.id);
                setSelectedId(null);
              }}
            >
              {c.name[lang]}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
          <div className="space-y-1.5">
            {category.examples.map((e) => {
              const active = e.id === selected.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={`w-full text-left rounded-xl border p-2.5 transition-colors ${
                    active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{e.title[lang]}</span>
                    {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.description[lang]}</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border bg-muted/30">
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
              <span className="text-xs font-medium">{selected.title[lang]}</span>
              <Badge variant="secondary" className="text-[10px]">{"{{question}}"}</Badge>
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <div className="px-3 pt-2">
                <TabsList className="h-7">
                  <TabsTrigger value="prompt" className="text-[11px] h-6">
                    {lang === "th" ? "คำสั่ง" : "Prompt"}
                  </TabsTrigger>
                  <TabsTrigger value="answer" className="text-[11px] h-6" disabled={!sampleAnswer}>
                    {lang === "th" ? "ตัวอย่างคำตอบ" : "Sample answer"}
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="prompt" className="m-0">
                <ScrollArea className="h-[240px]">
                  <pre className="p-3 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                    {selected.prompt[lang]}
                  </pre>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="answer" className="m-0">
                <ScrollArea className="h-[240px]">
                  <pre className="p-3 text-xs whitespace-pre-wrap leading-relaxed">
                    {sampleAnswer ??
                      (lang === "th" ? "ยังไม่มีตัวอย่างคำตอบสำหรับแบบนี้" : "No sample answer for this template yet")}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => insert("append")}>
            {t("builder.userPromptAppend")}
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => insert("replace")}>
            {t("builder.userPromptUse")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
