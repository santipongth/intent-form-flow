import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type Citation = {
  index: number;
  file_id: string | null;
  file_name: string;
  chunk_index: number | null;
  similarity: number;
  excerpt: string;
};

/** Numbered sources shown under an answer, linking into the document. */
export function CitationList({ citations }: { citations: Citation[] }) {
  const { t } = useLanguage();
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border/60 pt-2 space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground">{t("citations.title")}</p>
      <ul className="space-y-1">
        {citations.map((c) => {
          const label = `[${c.index}] ${c.file_name}${
            c.chunk_index != null ? ` · ${t("citations.part")} ${c.chunk_index + 1}` : ""
          }`;
          const inner = (
            <span className="inline-flex items-start gap-1.5">
              <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                <span className="font-medium">{label}</span>
                {c.excerpt && (
                  <span className="block text-muted-foreground line-clamp-2">{c.excerpt}</span>
                )}
              </span>
            </span>
          );
          return (
            <li key={`${c.index}-${c.file_id ?? c.file_name}`} className="text-[11px]">
              {c.file_id ? (
                <Link
                  to={`/knowledge/${c.file_id}?chunk=${c.chunk_index ?? 0}`}
                  className="text-primary hover:underline"
                >
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
