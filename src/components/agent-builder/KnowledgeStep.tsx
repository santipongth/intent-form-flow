import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Link, X, FileText, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const PREVIEWABLE_EXTS = [".txt", ".md", ".csv", ".json"];
const PREVIEW_MAX_CHARS = 200;

function canPreview(file: File): boolean {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return PREVIEWABLE_EXTS.includes(ext);
}

const ACCEPTED_TYPES = [".pdf", ".txt", ".md", ".csv", ".json", ".docx", ".xlsx", ".xls"];
const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toUpperCase() || "FILE";
}

function isValidFileType(file: File): boolean {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return ACCEPTED_TYPES.includes(ext);
}

interface KnowledgeStepProps {
  files: File[];
  setFiles: (files: File[]) => void;
  urls: string[];
  setUrls: (urls: string[]) => void;
  urlInput: string;
  setUrlInput: (v: string) => void;
  onAddUrl: () => void;
}

export default function KnowledgeStep({ files, setFiles, urls, setUrls, urlInput, setUrlInput, onAddUrl }: KnowledgeStepProps) {
  const { t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [expandedPreviews, setExpandedPreviews] = useState<Record<number, boolean>>({});

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const storagePercent = Math.min((totalSize / MAX_TOTAL_SIZE) * 100, 100);

  // Read previewable files
  useEffect(() => {
    files.forEach((file, idx) => {
      if (previews[idx] !== undefined) return;
      if (!canPreview(file)) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || "";
        setPreviews((prev) => ({ ...prev, [idx]: text.slice(0, PREVIEW_MAX_CHARS) }));
      };
      reader.readAsText(file);
    });
  }, [files]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePreview = (idx: number) => {
    setExpandedPreviews((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const incoming = Array.from(newFiles);
    const valid: File[] = [];
    let blocked = 0;

    for (const file of incoming) {
      if (!isValidFileType(file)) {
        blocked++;
        continue;
      }
      valid.push(file);
    }

    if (blocked > 0) {
      toast.error(`${blocked} ไฟล์ไม่รองรับ — ใช้ได้เฉพาะ ${ACCEPTED_TYPES.join(", ")}`);
    }

    const combined = [...files, ...valid];
    if (combined.length > MAX_FILES) {
      toast.error(`${t("knowledge.limitFiles")} (${MAX_FILES})`);
      return;
    }

    const newTotal = combined.reduce((s, f) => s + f.size, 0);
    if (newTotal > MAX_TOTAL_SIZE) {
      toast.error(t("knowledge.limitSize"));
      return;
    }

    setFiles(combined);
  }, [files, setFiles, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-semibold">{t("builder.knowledge")}</h2>

      {/* Storage indicators */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("knowledge.fileCount")}: {files.length}/{MAX_FILES}</span>
        <span>{t("knowledge.storageUsed")}: {formatFileSize(totalSize)} / 50 MB</span>
      </div>
      <Progress value={storagePercent} className="h-1.5 rounded-full" />

      {/* Drop zone */}
      <Card
        className={`rounded-2xl border-dashed border-2 transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-primary/30 hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-8 text-center">
          <Upload className={`h-10 w-10 mx-auto mb-3 transition-colors ${isDragOver ? "text-primary" : "text-primary/50"}`} />
          <p className="font-medium mb-1">
            {isDragOver ? t("knowledge.dropHere") : t("builder.dragDrop")}
          </p>
          <p className="text-sm text-muted-foreground mb-3">{t("builder.fileTypes")}</p>
          <label>
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button variant="outline" className="rounded-xl" asChild>
              <span>{t("builder.selectFile")}</span>
            </Button>
          </label>
        </CardContent>
      </Card>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="bg-secondary rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate">{f.name}</span>
                  <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                    {getFileExtension(f.name)}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(f.size)}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {canPreview(f) && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePreview(i)}>
                      {expandedPreviews[i] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                    setFiles(files.filter((_, idx) => idx !== i));
                    setPreviews((prev) => { const n = { ...prev }; delete n[i]; return n; });
                    setExpandedPreviews((prev) => { const n = { ...prev }; delete n[i]; return n; });
                  }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {expandedPreviews[i] && previews[i] !== undefined && (
                <div className="px-4 pb-3">
                  <pre className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3 whitespace-pre-wrap break-all max-h-32 overflow-auto font-mono">
                    {previews[i]}{previews[i].length >= PREVIEW_MAX_CHARS ? "…" : ""}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* URL input */}
      <div>
        <Label>{t("builder.addUrl")}</Label>
        <div className="flex gap-2 mt-1">
          <Input placeholder="https://example.com" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="rounded-xl" onKeyDown={(e) => e.key === "Enter" && onAddUrl()} />
          <Button variant="outline" className="rounded-xl" onClick={onAddUrl}><Link className="h-4 w-4" /></Button>
        </div>
        {urls.map((u, i) => (
          <div key={i} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-2 mt-2">
            <span className="text-sm truncate">🔗 {u}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
