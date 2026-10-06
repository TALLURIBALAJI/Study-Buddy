import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Gauge,
  Sparkles,
  BookOpen,
  Trash2,
  Check,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { LearningLevel, ResponseStyle } from '../types/api';
import { fetchSettings, saveApiKey, clearAllProjectData } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { preferences, setPreferences, theme, toggleTheme, refreshDocuments, refreshSessions } = useStore();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<{
    has_api_key: boolean;
    masked_api_key: string;
    llm_provider: string;
    model: string;
    indexed_chunks: number;
  } | null>(null);

  const [clearingAll, setClearingAll] = useState(false);

  const levels: { id: LearningLevel; label: string; desc: string }[] = [
    { id: 'eli5', label: "Explain Like I'm 5", desc: 'Extremely simple words and playful everyday analogies' },
    { id: 'beginner', label: 'Beginner', desc: 'Clear, gentle technical explanations with real-world examples' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Moderate technical detail, mechanisms and relationships' },
    { id: 'advanced', label: 'Advanced', desc: 'Formal domain definitions, mathematical rigor and deep nuances' },
  ];

  const styles: { id: ResponseStyle; label: string; desc: string }[] = [
    { id: 'simple', label: 'Simple Explanation', desc: 'Direct, clear conceptual explanation with intuitive analogy' },
    { id: 'examples', label: 'Real-World Examples', desc: 'Rich with vivid real-world scenarios and comparisons' },
    { id: 'steps', label: 'Step-by-Step Learning', desc: 'Ordered, sequential steps explaining each phase' },
    { id: 'detailed', label: 'Detailed Explanation', desc: 'Comprehensive deep dive with context and takeaways' },
  ];

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      setSettingsStatus(data);
    } catch (e) {
      console.warn('Could not fetch settings:', e);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyLoading(true);
    setSaveSuccess(null);
    setSaveError(null);
    try {
      const res = await saveApiKey(apiKeyInput);
      setSaveSuccess(res.message);
      setApiKeyInput('');
      await loadSettings();
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update API key');
    } finally {
      setKeyLoading(false);
    }
  };

  const handleEraseAllDocuments = async () => {
    if (!confirm('Are you sure you want to permanently erase EVERY document and study session? This cannot be undone.')) {
      return;
    }
    setClearingAll(true);
    try {
      await clearAllProjectData();
      await refreshDocuments();
      await refreshSessions();
      await loadSettings();
      alert('All documents and sessions have been erased. You can now upload your own document!');
    } catch (e: any) {
      alert(`Error erasing documents: ${e.message}`);
    } finally {
      setClearingAll(false);
    }
  };

  const handleResetPreferences = () => {
    if (confirm('Are you sure you want to reset your local preferences?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-5 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your AI model, document storage, and tutor behavior.
        </p>
      </div>

      <div className="space-y-6">
        {/* AI Provider & Gemini API Key */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <KeyRound className="size-4 text-primary" /> Google Gemini API Key
            </h3>
            {settingsStatus?.has_api_key ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" /> Gemini Active ({settingsStatus.model})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Offline Tutor Active
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Provide a Google Gemini API key to power explanations, quizzes, and summaries with Google's state-of-the-art Gemini 2.5 Flash model. If no key is set, the application uses the built-in RAG document synthesizer.
          </p>

          {settingsStatus?.has_api_key && (
            <div className="mb-3 rounded-lg border bg-muted/30 px-3 py-2 text-xs flex items-center justify-between">
              <span className="text-muted-foreground">Current Key:</span>
              <span className="font-mono font-semibold text-foreground">{settingsStatus.masked_api_key}</span>
            </div>
          )}

          <form onSubmit={handleSaveApiKey} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={settingsStatus?.has_api_key ? "Enter new API key to replace..." : "Paste Gemini API Key (AIzaSy...)"}
                className="flex-1 rounded-xl border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!apiKeyInput.trim() || keyLoading}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {keyLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                Save Key
              </button>
            </div>

            {saveSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="size-3.5" /> {saveSuccess}
              </p>
            )}
            {saveError && (
              <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                <AlertTriangle className="size-3.5" /> {saveError}
              </p>
            )}
          </form>
        </div>

        {/* Local Student Workspace */}
        <div className="flex items-start gap-3.5 rounded-2xl border bg-card p-5 shadow-xs">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Local Student Workspace</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Your uploaded files are processed and indexed into a local FAISS vector store. Questions and quizzes are strictly grounded in your uploaded documents.
            </p>
          </div>
        </div>

        {/* Appearance / Dark Mode */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {theme === 'dark' ? <Moon className="size-4 text-primary" /> : <Sun className="size-4 text-primary" />}
                Dark Mode
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Switch between light and dark appearance.
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                theme === 'dark' ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block size-4 transform rounded-full bg-background transition-transform shadow-md ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Default Explanation Level */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
            <Gauge className="size-4 text-primary" /> Default Explanation Level
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            How simple the tutor's answers should be by default.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {levels.map((lvl) => {
              const active = preferences.explanationLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => setPreferences({ explanationLevel: lvl.id })}
                  className={`flex flex-col text-left rounded-xl border p-3.5 transition-all ${
                    active
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-border/70 hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{lvl.label}</span>
                    {active && <Check className="size-3.5 text-primary" />}
                  </div>
                  <span className="mt-1 text-[11px] text-muted-foreground leading-normal">
                    {lvl.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Response Style */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
            <Sparkles className="size-4 text-primary" /> Default Response Style
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            The shape of explanations you prefer.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {styles.map((st) => {
              const active = preferences.responseStyle === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setPreferences({ responseStyle: st.id })}
                  className={`flex flex-col text-left rounded-xl border p-3.5 transition-all ${
                    active
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-border/70 hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{st.label}</span>
                    {active && <Check className="size-3.5 text-primary" />}
                  </div>
                  <span className="mt-1 text-[11px] text-muted-foreground leading-normal">
                    {st.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Display Toggles */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> Show Source References
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Display document and page citations next to answers.
              </p>
            </div>
            <button
              onClick={() => setPreferences({ showSources: !preferences.showSources })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.showSources ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block size-4 transform rounded-full bg-background transition-transform shadow-md ${
                  preferences.showSources ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Erase Every Document & Reset Project */}
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                <Trash2 className="size-4" /> Erase All Documents & Reset Project
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Purges all uploaded files, vector indexes, and chat sessions so you start with a clean slate.
              </p>
            </div>
            <button
              onClick={handleEraseAllDocuments}
              disabled={clearingAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {clearingAll ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Erase All Data
            </button>
          </div>
        </div>

        {/* Clear Browser Preferences */}
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <RefreshCw className="size-4 text-muted-foreground" /> Reset UI Preferences
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Restores default explanation settings and theme in this browser.
              </p>
            </div>
            <button
              onClick={handleResetPreferences}
              className="rounded-lg border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Reset UI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
