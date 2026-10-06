import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Upload,
  MessageSquarePlus,
  BookOpen,
  History,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { UploadZone } from '../components/UploadZone';

export const DashboardPage: React.FC = () => {
  const { documents, sessions, selectDocument, setActiveSessionId, deleteSession, uploadFiles } = useStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const readyDocs = documents.filter((d) => d.status === 'ready');

  const handleStartNewChat = (docId?: string) => {
    if (docId) selectDocument(docId);
    setActiveSessionId(undefined);
    navigate('/tutor');
  };

  const handleResumeSession = (sessionId: string, docId?: string) => {
    setActiveSessionId(sessionId);
    if (docId) selectDocument(docId);
    navigate('/tutor');
  };

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {getGreeting()} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">What are we learning today?</p>
        </div>
        <div className="flex items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border bg-card px-3.5 py-2 text-xs font-medium shadow-sm hover:bg-muted transition-colors"
          >
            <Upload className="size-3.5 text-primary" /> Quick Upload
          </button>
          <button
            onClick={() => handleStartNewChat()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <MessageSquarePlus className="size-3.5" /> Start New Chat
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Documents</span>
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{readyDocs.length}</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="size-3" /> Ready to study
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Indexed in FAISS vector store</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Study Sessions</span>
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <History className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{sessions.length}</span>
            <span className="text-xs text-muted-foreground">Saved conversations</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Synced to local SQLite database</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">AI Tutor Mode</span>
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-semibold text-foreground">Explain Like I'm 5</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Grounds answers directly in cited pages</p>
        </div>
      </div>

      {/* Main Grid: Continue Learning & Document Library */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Continue Learning / Recent Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Recent Study Sessions</h2>
            <Link to="/sessions" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card/50 p-8 text-center">
              <History className="size-8 text-muted-foreground mx-auto mb-2 opacity-60" />
              <h3 className="font-medium text-sm text-foreground">No sessions yet</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Pick a document and ask your tutor anything — your sessions will automatically save here.
              </p>
              <button
                onClick={() => handleStartNewChat()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                <MessageSquarePlus className="size-3.5" /> Start First Chat
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sessions.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="group relative flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => handleResumeSession(s.id, s.document_id)}
                  >
                    <h3 className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                      {s.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      {s.document_name && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <FileText className="size-3 text-primary" /> {s.document_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {new Date(s.updated_at).toLocaleDateString()}
                      </span>
                      <span>{s.message_count || 0} messages</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleResumeSession(s.id, s.document_id)}
                      className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      Resume
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(s.id);
                      }}
                      className="p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Library Preview & Dropzone */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Document Library</h2>
            <Link to="/documents" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all ({documents.length}) <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {/* Upload Zone */}
            <UploadZone />

            {/* Top Documents List */}
            <div className="space-y-2 mt-4">
              {documents.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border bg-card p-3 shadow-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary uppercase text-xs font-bold shrink-0">
                      {doc.kind}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate text-foreground">{doc.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatFileSize(doc.size_bytes)} · {doc.pages || 1} pages
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartNewChat(doc.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0 px-2 py-1"
                  >
                    Study <ArrowRight className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
