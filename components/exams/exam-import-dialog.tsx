"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileJson, Upload, X, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importExamJsonAction } from "@/app/(dashboard)/exams/actions";
import { examImportArraySchema, type ExamImport } from "@/lib/validations/exam-import";

// ─── Parse & preview helpers ─────────────────────────────────────────────────

function parseInput(raw: string): { exams: ExamImport[] } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Invalid JSON — check for missing commas, brackets, or quotes." };
  }
  const result = examImportArraySchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.errors[0];
    return { error: `${first.path.join(" → ") || "root"}: ${first.message}` };
  }
  const exams = Array.isArray(result.data) ? result.data : [result.data];
  return { exams };
}

function PreviewCard({ exam }: { exam: ExamImport }) {
  const totalChapters = exam.subjects.reduce((s, sub) => s + sub.chapters.length, 0);
  const totalTopics = exam.subjects.reduce(
    (s, sub) => s + sub.chapters.reduce((cs, ch) => cs + ch.topics.length, 0),
    0
  );
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
      <p className="font-semibold text-foreground">{exam.name}</p>
      {exam.description && (
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{exam.description}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>📚 {exam.subjects.length} subjects</span>
        <span>📑 {totalChapters} chapters</span>
        <span>✏️ {totalTopics} topics</span>
        {exam.priority && <span className="capitalize">🎯 {exam.priority} priority</span>}
        {exam.exam_date && <span>📅 {exam.exam_date}</span>}
      </div>
    </div>
  );
}

const SCHEMA_HINT = `[
  {
    "name": "Exam Name",
    "description": "Optional",
    "priority": "high",
    "exam_date": "2025-06-01",
    "subjects": [
      {
        "name": "Subject Name",
        "weightage": 20,
        "chapters": [
          {
            "name": "Chapter Name",
            "topics": ["Topic A", "Topic B"]
          }
        ]
      }
    ]
  }
]`;

// ─── Main dialog ──────────────────────────────────────────────────────────────

export function ExamImportDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Live parse result
  const parseResult = raw.trim() ? parseInput(raw) : null;
  const preview = parseResult && "exams" in parseResult ? parseResult.exams : null;
  const parseError = parseResult && "error" in parseResult ? parseResult.error : null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRaw((ev.target?.result as string) ?? "");
      setActiveTab("paste"); // show in textarea for review
    };
    reader.readAsText(file);
    // reset input so same file can be re-uploaded
    e.target.value = "";
  }

  async function handleImport() {
    if (!preview) return;
    setLoading(true);
    try {
      const results = await importExamJsonAction(JSON.parse(raw));
      const summary = results
        .map((r) => `"${r.name}" (${r.subjectCount} subjects, ${r.topicCount} topics)`)
        .join(", ");
      toast.success(`Imported: ${summary}`);
      setOpen(false);
      setRaw("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setRaw("");
      setSchemaOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            Import Exam from JSON
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
            {(["paste", "upload"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {tab === "paste" ? "Paste JSON" : "Upload File"}
              </button>
            ))}
          </div>

          {/* Upload input (hidden, triggered by button) */}
          {activeTab === "upload" ? (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 p-10 cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Click to choose a <code className="text-foreground">.json</code> file<br />
                <span className="text-xs">Single exam object or array of exams</span>
              </p>
              {raw && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> File loaded — switch to "Paste JSON" to review
                </p>
              )}
            </div>
          ) : (
            <div className="relative">
              <Textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={`Paste your JSON here…\n\nTip: It can be a single exam object or an array [ ] of exams.`}
                className="font-mono text-xs min-h-[200px] resize-y"
              />
              {raw && (
                <button
                  onClick={() => setRaw("")}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Validation feedback */}
          {parseError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Preview — {preview.length} exam{preview.length > 1 ? "s" : ""} will be imported
              </p>
              <div className="space-y-2">
                {preview.map((exam, i) => (
                  <PreviewCard key={i} exam={exam} />
                ))}
              </div>
            </div>
          )}

          {/* Schema hint (collapsible) */}
          <div className="rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setSchemaOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <span>📐 Expected JSON format</span>
              {schemaOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {schemaOpen && (
              <pre className="bg-muted/60 px-3 py-3 text-xs font-mono overflow-x-auto text-muted-foreground whitespace-pre-wrap">
                {SCHEMA_HINT}
              </pre>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!preview || loading}
              className="min-w-[120px]"
            >
              {loading
                ? "Importing…"
                : preview
                ? `Import ${preview.length} exam${preview.length > 1 ? "s" : ""}`
                : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
