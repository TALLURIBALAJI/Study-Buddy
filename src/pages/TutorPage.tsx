import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  MessageSquarePlus,
  BookOpen,
  Sparkles,
  Layers,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  ChevronRight,
  SlidersHorizontal,
  Lightbulb,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { UploadZone } from '../components/UploadZone';
import { QuizModal } from '../components/QuizModal';
import { SummaryModal } from '../components/SummaryModal';
import { sendChatMessage, fetchSessionDetails } from '../services/api';
import { ChatMessage, LearningLevel, ResponseStyle, SourceReference } from '../types/api';

export const TutorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    documents,
    selectedDocId,
    selectDocument,
    sessions,
    activeSessionId,
    setActiveSessionId,
    refreshSessions,
    preferences,
    setPreferences,
    removeDocument
  } = useStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Modals
  const [quizOpen, setQuizOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeDoc = documents.find((d) => d.id === selectedDocId);

  // Check URL query parameters (e.g. ?doc=... or ?session=... or ?q=...)
  useEffect(() => {
    const docParam = searchParams.get('doc');
    const sessionParam = searchParams.get('session');
    const queryParam = searchParams.get('q');

    if (docParam && documents.some((d) => d.id === docParam)) {
      selectDocument(docParam);
    }
    if (sessionParam) {
      setActiveSessionId(sessionParam);
    }
    if (queryParam) {
      setInput(queryParam);
    }
  }, [searchParams, documents, selectDocument, setActiveSessionId]);

  // Load active session messages if activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      fetchSessionDetails(activeSessionId)
        .then((s) => {
          if (s.messages) setMessages(s.messages);
          if (s.document_id) selectDocument(s.document_id);
        })
        .catch((e) => console.warn('Could not load session:', e));
    } else {
      setMessages([]);
    }
  }, [activeSessionId, selectDocument]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleStartNewChat = () => {
    setActiveSessionId(undefined);
    setMessages([]);
    setInput('');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage({
        question: query,
        document_ids: selectedDocId ? [selectedDocId] : undefined,
        session_id: activeSessionId,
        learning_level: preferences.explanationLevel,
        response_style: preferences.responseStyle,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        follow_ups: res.follow_ups,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (res.session_id && res.session_id !== activeSessionId) {
        setActiveSessionId(res.session_id);
      }
      refreshSessions();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Tutor Error:** ${err.message || "Couldn't connect to AI tutor. Please check if the backend is running."}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Find latest sources cited in conversation
  const latestSources: SourceReference[] =
    [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.sources && m.sources.length > 0)
      ?.sources || [];

  const promptStarters = [
    "Explain this topic like I'm 10.",
    "Summarize this document.",
    "Give me a real-world example.",
    "Explain this step by step.",
    "Ask me interview questions.",
    "What are the main key takeaways?"
  ];

  const levels: { id: LearningLevel; label: string }[] = [
    { id: 'eli5', label: "Explain Like I'm 5" },
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ];

  const styles: { id: ResponseStyle; label: string }[] = [
    { id: 'simple', label: 'Simple Explanation' },
    { id: 'examples', label: 'Real-World Examples' },
    { id: 'steps', label: 'Step-by-Step Learning' },
    { id: 'detailed', label: 'Detailed Explanation' },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      {/* 1. Left Column: Study Materials */}
      <aside className="hidden lg:flex w-72 flex-col border-r bg-card/40 p-4 shrink-0 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Study Materials</h2>
          <span className="text-xs text-muted-foreground">{documents.length}</span>
        </div>

        {/* Compact Upload Zone */}
        <div className="mb-3">
          <UploadZone compact />
        </div>

        {/* Documents List */}
        <div className="space-y-1.5 flex-1 overflow-y-auto">
          {documents.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-center">
              <FileText className="size-6 text-muted-foreground mx-auto mb-1.5 opacity-50" />
              <p className="text-xs font-medium text-foreground">No documents yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Drop your PDF or notes above to start learning!
              </p>
            </div>
          ) : (
            documents.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  className={`group relative flex items-center justify-between rounded-xl border p-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary/50 bg-primary/5 shadow-xs'
                      : 'border-transparent hover:bg-muted/70'
                  }`}
                  onClick={() => selectDocument(isSelected ? undefined : doc.id)}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary uppercase text-[11px] font-bold shrink-0">
                      {doc.kind}
                    </span>
                    <div className="min-w-0 pr-4">
                      <p className={`text-xs font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {doc.kind} · {doc.pages || 1} pgs
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDocument(doc.id);
                    }}
                    className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-background transition-all"
                    title="Remove document"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Center Column: Chat Conversation */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        {/* Tutor Top Bar */}
        <header className="flex h-13 items-center justify-between border-b bg-card/60 px-4 py-2 backdrop-blur shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleStartNewChat}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors shrink-0"
            >
              <MessageSquarePlus className="size-3.5 text-primary" /> New
            </button>

            {activeDoc ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary truncate max-w-xs">
                <FileText className="size-3 shrink-0" />
                <span className="truncate">{activeDoc.name}</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">General Study Mode</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeDoc && (
              <>
                <button
                  onClick={() => setSummaryOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1 rounded-lg border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <BookOpen className="size-3 text-primary" /> Summarize
                </button>
                <button
                  onClick={() => setQuizOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1 rounded-lg border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Sparkles className="size-3 text-primary" /> Quiz
                </button>
              </>
            )}

            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className="lg:hidden inline-flex items-center gap-1 rounded-lg border p-1.5 text-xs text-muted-foreground"
            >
              <SlidersHorizontal className="size-4" />
            </button>
          </div>
        </header>

        {/* Chat Messages Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="mx-auto max-w-xl py-10 text-center animate-fade-in">
              <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
                <Lightbulb className="size-7" />
              </span>

              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                What would you like to learn today?
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                {activeDoc
                  ? `Studying "${activeDoc.name}". Pick a prompt below or ask your own question about this document.`
                  : documents.length > 0
                  ? 'Select a document from the left or ask anything to get started.'
                  : 'Upload your PDF or study notes above to begin learning with your AI tutor.'}
              </p>

              {/* Status Pill */}
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-[11px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="capitalize">{preferences.explanationLevel}</span>
                <span>·</span>
                <span className="capitalize">{preferences.responseStyle.replace('-', ' ')}</span>
              </div>

              {/* Prompt Starters */}
              <div className="mt-8 grid gap-2 sm:grid-cols-2 text-left">
                {promptStarters.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(starter)}
                    className="flex items-center justify-between rounded-xl border bg-card p-3 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-muted/40 transition-all shadow-2xs group"
                  >
                    <span>{starter}</span>
                    <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message Feed */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {msg.role === 'user' ? (
                  /* User Bubble */
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  /* Assistant Bubble */
                  <div className="max-w-[92%] rounded-2xl border bg-card p-5 shadow-xs space-y-3 w-full">
                    {/* Assistant Message Content (Rendered Markdown) */}
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>

                    {/* Sources Badge / Citation */}
                    {msg.sources && msg.sources.length > 0 && preferences.showSources && (
                      <div className="mt-4 pt-3 border-t">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                          <Layers className="size-3" /> Grounded In Uploaded Notes
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
                            >
                              <FileText className="size-3 text-primary" />
                              <span className="font-medium text-foreground truncate max-w-[180px]">
                                {src.document_name}
                              </span>
                              <span className="text-[11px] font-mono text-primary font-semibold">
                                Page {src.page || 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Question Chips */}
                    {msg.follow_ups && msg.follow_ups.length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-1.5">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Suggested follow-ups:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.follow_ups.map((fu, fIdx) => (
                            <button
                              key={fIdx}
                              onClick={() => handleSendMessage(fu)}
                              className="rounded-lg border bg-background/80 px-2.5 py-1 text-xs text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors"
                            >
                              {fu}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="size-3 text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground p-3 rounded-xl border bg-card w-fit animate-pulse">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>StudyBuddy is searching your notes & formulating an intuitive answer...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 md:p-4 border-t bg-card/40 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-xs focus-within:border-primary/50 transition-colors"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeDoc
                  ? `Ask a question about ${activeDoc.name}...`
                  : 'Ask your AI tutor anything...'
              }
              className="w-full resize-none bg-transparent px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-32"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <Send className="size-4" />
            </button>
          </form>
          <p className="mt-1 text-[11px] text-center text-muted-foreground">
            Press <b>Enter</b> to send, <b>Shift + Enter</b> for new line. Grounded in your uploaded study notes.
          </p>
        </div>
      </div>

      {/* 3. Right Column: Explanation Controls & Sources */}
      {showRightPanel && (
        <aside className="w-72 border-l bg-card/30 p-4 shrink-0 overflow-y-auto hidden lg:flex flex-col gap-6">
          {/* Explanation Level */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" /> Explanation Level
            </h3>
            <div className="grid gap-1.5">
              {levels.map((lvl) => {
                const active = preferences.explanationLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => setPreferences({ explanationLevel: lvl.id })}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all ${
                      active
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                        : 'border-border/60 hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <span>{lvl.label}</span>
                    {active && <Check className="size-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Response Style */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <SlidersHorizontal className="size-3.5" /> Response Style
            </h3>
            <div className="grid gap-1.5">
              {styles.map((st) => {
                const active = preferences.responseStyle === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setPreferences({ responseStyle: st.id })}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all ${
                      active
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                        : 'border-border/60 hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <span>{st.label}</span>
                    {active && <Check className="size-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground leading-tight">
              Changes how the tutor formats explanations in real time.
            </p>
          </div>

          {/* Source References */}
          <div className="flex-1">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Layers className="size-3.5" /> Active Sources
            </h3>
            {latestSources.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  References appear here when an answer cites your study document.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {latestSources.map((src, idx) => (
                  <div key={idx} className="rounded-xl border bg-card p-3 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">
                        {src.document_name}
                      </span>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary font-bold">
                        p. {src.page || 1}
                      </span>
                    </div>
                    {src.excerpt && (
                      <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                        "{src.excerpt}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Quiz Modal */}
      <QuizModal
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
        documentId={activeDoc?.id}
        documentName={activeDoc?.name}
        learningLevel={preferences.explanationLevel}
      />

      {/* Summary Modal */}
      <SummaryModal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        documentId={activeDoc?.id}
        documentName={activeDoc?.name}
        learningLevel={preferences.explanationLevel}
      />
    </div>
  );
};
