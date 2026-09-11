import { useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/** Read-only viewer for one uploaded file, with the cited part highlighted. */
export default function KnowledgeFile() {
  const { fileId } = useParams<{ fileId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const targetChunk = Number(params.get("chunk"));
  const targetRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge-file-view", fileId],
    queryFn: async () => {
      const [{ data: file, error: fileErr }, { data: chunks, error: chunkErr }] = await Promise.all([
        supabase.from("knowledge_files").select("id, agent_id, file_name, content, status").eq("id", fileId!).maybeSingle(),
        supabase.from("knowledge_chunks").select("id, chunk_index, content").eq("file_id", fileId!).order("chunk_index", { ascending: true }),
      ]);
      if (fileErr) throw fileErr;
      if (chunkErr) throw chunkErr;
      return { file, chunks: chunks ?? [] };
    },
    enabled: !!fileId,
  });

  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data]);

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">{t("common.loading")}</div>;
  if (!data?.file) return <div className="p-6 text-sm text-muted-foreground">{t("citations.notFound")}</div>;

  const { file, chunks } = data;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
      <Button variant="ghost" className="rounded-xl gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Button>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" /> {file.file_name}
            <Badge variant="secondary" className="text-[10px]">{file.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {chunks.length === 0 && (
            <pre className="text-sm whitespace-pre-wrap">{file.content || t("citations.noContent")}</pre>
          )}
          {chunks.map((c: any) => {
            const isTarget = c.chunk_index === targetChunk;
            return (
              <div
                key={c.id}
                ref={isTarget ? targetRef : undefined}
                className={`rounded-xl p-3 text-sm whitespace-pre-wrap border ${
                  isTarget ? "border-primary bg-primary/5" : "border-border/60"
                }`}
              >
                <p className="text-[11px] text-muted-foreground mb-1">
                  {t("citations.part")} {c.chunk_index + 1}
                </p>
                {c.content}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
