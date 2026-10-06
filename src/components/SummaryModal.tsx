import React, { useState, useEffect } from 'react';
import { X, BookOpen, Lightbulb, Check, Copy, Loader2, AlertCircle } from 'lucide-react';
import { summarizeDocument } from '../services/api';
import { SummaryResponse } from '../types/api';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
  documentName?: string;
  learningLevel?: string;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentName,
  learningLevel = 'beginner',
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      setError(null);
      setData(null);
      summarizeDocument(documentId, learningLevel)
        .then((res) => setData(res))
        .catch((err) => setError(err.message || 'Failed to generate summary'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, documentId, learningLevel]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!data) return;
    const text = `Summary of ${data.document_name}:\n\n${data.summary}\n\nKey Takeaways:\n${data.key_points.map((p) => `- ${p}`).join('\n')}\n\nAnalogy:\n${data.real_world_analogy || ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-4.5" />
            </span>
            <div>
              <h2 className="font-semibold text-lg leading-tight">Document Summary</h2>
              <p className="text-xs text-muted-foreground truncate max-w-xs">{documentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-5 flex-1 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="size-8 animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">Distilling document into a clear summary...</p>
              <p className="text-xs text-muted-foreground mt-1">Extracting core principles, takeaways, and analogies</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <AlertCircle className="size-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-5">
              {/* Executive Summary */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">
                  Core Overview
                </p>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                  {data.summary}
                </p>
              </div>

              {/* Real World Analogy */}
              {data.real_world_analogy && (
                <div className="rounded-xl border bg-muted/50 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                    <Lightbulb className="size-3.5" />
                    <span>Real-World Analogy</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {data.real_world_analogy}
                  </p>
                </div>
              )}

              {/* Key Takeaways */}
              {data.key_points && data.key_points.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                    Key Takeaways
                  </p>
                  <ul className="space-y-2">
                    {data.key_points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                        <span className="leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {data && (
          <div className="pt-4 border-t flex items-center justify-between shrink-0">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              <span>{copied ? 'Copied to clipboard' : 'Copy summary'}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
