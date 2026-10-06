import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DocumentItem,
  StudySession,
  UserPreferences,
  LearningLevel,
  ResponseStyle,
} from '../types/api';
import {
  fetchDocuments,
  uploadDocument as apiUploadDocument,
  deleteDocument as apiDeleteDocument,
  fetchSessions,
  deleteSession as apiDeleteSession,
  checkBackendHealth,
} from '../services/api';

interface StoreContextType {
  documents: DocumentItem[];
  selectedDocId?: string;
  selectDocument: (id?: string) => void;
  refreshDocuments: () => Promise<void>;
  uploadFiles: (files: FileList | File[]) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;

  sessions: StudySession[];
  activeSessionId?: string;
  setActiveSessionId: (id?: string) => void;
  refreshSessions: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  backendConnected: boolean;
  uploadingDocName: string | null;
  uploadingState: string | null;
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  explanationLevel: 'beginner',
  responseStyle: 'simple',
  showSources: true,
  compactChat: false,
};

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(undefined);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [uploadingDocName, setUploadingDocName] = useState<string | null>(null);
  const [uploadingState, setUploadingState] = useState<string | null>(null);

  const [preferences, setPreferencesState] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('studybuddy:preferences');
      return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
    } catch {
      return defaultPreferences;
    }
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('studybuddy:theme');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('studybuddy:theme', theme);
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setPreferences = (updates: Partial<UserPreferences>) => {
    setPreferencesState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('studybuddy:preferences', JSON.stringify(next));
      return next;
    });
  };

  // Load documents and sessions
  const refreshDocuments = useCallback(async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
      // If selected doc is not in list or none selected, pick the first ready doc
      if (docs.length > 0) {
        setSelectedDocId((prev) => {
          if (prev && docs.some((d) => d.id === prev)) return prev;
          return docs[0].id;
        });
      } else {
        setSelectedDocId(undefined);
      }
      setBackendConnected(true);
    } catch (e) {
      console.warn('Backend not yet reachable or document fetch failed:', e);
      setBackendConnected(false);
    }
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      const sess = await fetchSessions();
      setSessions(sess);
    } catch (e) {
      console.warn('Session fetch failed:', e);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
    refreshSessions();
    const interval = setInterval(() => {
      checkBackendHealth().then((ok) => setBackendConnected(ok));
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshDocuments, refreshSessions]);

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      setUploadingDocName(file.name);
      setUploadingState('Uploading...');
      
      // Temporary optimistic item
      const tempId = `temp-${Date.now()}`;
      const tempDoc: DocumentItem = {
        id: tempId,
        name: file.name,
        kind: file.name.split('.').pop()?.toLowerCase() || 'txt',
        size_bytes: file.size,
        pages: 1,
        uploaded_at: new Date().toISOString(),
        status: 'uploading',
      };
      setDocuments((prev) => [tempDoc, ...prev]);

      try {
        setUploadingState('Extracting text...');
        // Small delay for UI smoothness
        await new Promise((r) => setTimeout(r, 400));
        setUploadingState('Processing & Chunking...');
        await new Promise((r) => setTimeout(r, 400));
        setUploadingState('Indexing with FAISS...');
        
        const realDoc = await apiUploadDocument(file);
        
        setDocuments((prev) =>
          prev.map((d) => (d.id === tempId ? realDoc : d))
        );
        setSelectedDocId(realDoc.id);
        setUploadingState('Ready!');
      } catch (err: any) {
        console.error('Upload failed:', err);
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === tempId
              ? { ...d, status: 'failed' }
              : d
          )
        );
        alert(err.message || 'Processing failed. Try uploading again.');
      } finally {
        setTimeout(() => {
          setUploadingDocName(null);
          setUploadingState(null);
        }, 1000);
      }
    }
  };

  const removeDocument = async (id: string) => {
    try {
      await apiDeleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDocId === id) {
        setSelectedDocId(undefined);
      }
    } catch (e: any) {
      alert(`Could not delete document: ${e.message}`);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await apiDeleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(undefined);
      }
    } catch (e: any) {
      alert(`Could not delete session: ${e.message}`);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        documents,
        selectedDocId,
        selectDocument: setSelectedDocId,
        refreshDocuments,
        uploadFiles,
        removeDocument,
        sessions,
        activeSessionId,
        setActiveSessionId,
        refreshSessions,
        deleteSession,
        preferences,
        setPreferences,
        theme,
        setTheme,
        toggleTheme,
        backendConnected,
        uploadingDocName,
        uploadingState,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return ctx;
};
