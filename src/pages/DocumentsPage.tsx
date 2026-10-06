import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Trash2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { UploadZone } from '../components/UploadZone';
import { QuizModal } from '../components/QuizModal';
import { SummaryModal } from '../components/SummaryModal';

export const DocumentsPage: React.FC = () => {
  const { documents, selectDocument, removeDocument } = useStore();
  const navigate = useNavigate();

  // Modals state
  const [quizDoc, setQuizDoc] = useState<{ id: string; name: string } | null>(null);
  const [summaryDoc, setSummaryDoc] = useState<{ id: string; name: string } | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleOpenInTutor = (docId: string) => {
    selectDocument(docId);
    navigate('/tutor');
  };

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl text-foreground">
          My Documents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you've uploaded to study with.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className="mb-8">
        <UploadZone />
      </div>

      {/* Document Library Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Document Library ({documents.length})
          </h2>
          <span className="text-xs text-muted-foreground">
            Processed & indexed for page-level retrieval
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
            <FileText className="size-10 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="font-semibold text-base text-foreground">No documents uploaded yet</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Drop PDFs, Word documents or text notes above to begin studying with your personal AI tutor.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {documents.map((doc) => {
              const isReady = doc.status === 'ready';
              const isFailed = doc.status === 'failed';

              return (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border bg-card p-4 shadow-xs hover:border-primary/40 transition-all gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary uppercase font-bold text-xs shrink-0">
                      {doc.kind}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm text-foreground truncate max-w-md">
                          {doc.name}
                        </h3>
                        {doc.is_demo && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Demo
                          </span>
                        )}
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" /> Ready
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                            <AlertCircle className="size-3" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            <Loader2 className="size-3 animate-spin" /> {doc.status}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="uppercase">{doc.kind}</span>
                        <span>·</span>
                        <span>{formatFileSize(doc.size_bytes)}</span>
                        <span>·</span>
                        <span>{doc.pages || 1} pages</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" /> {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      disabled={!isReady}
                      onClick={() => setSummaryDoc({ id: doc.id, name: doc.name })}
                      title="Summarize document"
                      className="inline-flex items-center gap-1 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors"
                    >
                      <BookOpen className="size-3.5 text-primary" /> Summarize
                    </button>

                    <button
                      disabled={!isReady}
                      onClick={() => setQuizDoc({ id: doc.id, name: doc.name })}
                      title="Generate practice quiz"
                      className="inline-flex items-center gap-1 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors"
                    >
                      <Sparkles className="size-3.5 text-primary" /> Quiz
                    </button>

                    <button
                      disabled={!isReady}
                      onClick={() => handleOpenInTutor(doc.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      Open in AI Tutor <ArrowRight className="size-3.5" />
                    </button>

                    <button
                      onClick={() => removeDocument(doc.id)}
                      title="Delete document"
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={Boolean(quizDoc)}
        onClose={() => setQuizDoc(null)}
        documentId={quizDoc?.id}
        documentName={quizDoc?.name}
      />

      {/* Summary Modal */}
      <SummaryModal
        isOpen={Boolean(summaryDoc)}
        onClose={() => setSummaryDoc(null)}
        documentId={summaryDoc?.id}
        documentName={summaryDoc?.name}
      />
    </div>
  );
};
