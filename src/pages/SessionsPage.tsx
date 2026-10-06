import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  FileText,
  Clock,
  ArrowRight,
  Trash2,
  MessageSquarePlus
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const SessionsPage: React.FC = () => {
  const { sessions, setActiveSessionId, selectDocument, deleteSession } = useStore();
  const navigate = useNavigate();

  const handleResume = (sessionId: string, docId?: string) => {
    setActiveSessionId(sessionId);
    if (docId) selectDocument(docId);
    navigate('/tutor');
  };

  const handleStartNew = () => {
    setActiveSessionId(undefined);
    navigate('/tutor');
  };

  return (
    <div className="mx-auto max-w-4xl p-5 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl text-foreground">
            Study Sessions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every tutoring conversation, saved so you can pick up where you left off.
          </p>
        </div>
        <button
          onClick={handleStartNew}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <MessageSquarePlus className="size-3.5" /> New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
          <History className="size-10 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="font-semibold text-base text-foreground">No sessions yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Conversations with your tutor will automatically appear here.
          </p>
          <button
            onClick={handleStartNew}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <MessageSquarePlus className="size-3.5" /> Start Learning Now
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="group flex items-center justify-between rounded-xl border bg-card p-4 shadow-xs hover:border-primary/40 transition-all"
            >
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => handleResume(s.id, s.document_id)}
              >
                <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {s.title}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {s.document_name && (
                    <span className="flex items-center gap-1 truncate max-w-[240px]">
                      <FileText className="size-3 text-primary" /> {s.document_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" /> Updated {new Date(s.updated_at).toLocaleDateString()}
                  </span>
                  <span>{s.message_count || 0} messages</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResume(s.id, s.document_id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Resume <ArrowRight className="size-3.5" />
                </button>
                <button
                  onClick={() => deleteSession(s.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Delete session"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
