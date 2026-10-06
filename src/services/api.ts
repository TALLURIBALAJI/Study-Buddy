import {
  DocumentItem,
  ChatRequest,
  ChatResponse,
  StudySession,
  QuizResponse,
  SummaryResponse,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) {
    throw new Error('Failed to load documents');
  }
  const data = await res.json();
  return data.documents || [];
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }

  return await res.json();
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete document');
  }
}

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'AI Tutor is unavailable' }));
    throw new Error(err.detail || 'Failed to get answer');
  }

  return await res.json();
}

export async function fetchSessions(): Promise<StudySession[]> {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) {
    throw new Error('Failed to load sessions');
  }
  return await res.json();
}

export async function fetchSessionDetails(sessionId: string): Promise<StudySession> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  if (!res.ok) {
    throw new Error('Failed to load session details');
  }
  return await res.json();
}

export async function createSession(data: {
  title?: string;
  document_id?: string;
  document_name?: string;
}): Promise<StudySession> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to create session');
  }
  return await res.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete session');
  }
}

export async function summarizeDocument(
  documentId: string,
  level: string = 'beginner'
): Promise<SummaryResponse> {
  const res = await fetch(`${API_BASE}/study/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId, learning_level: level }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Summarization failed' }));
    throw new Error(err.detail || 'Failed to summarize document');
  }

  return await res.json();
}

export async function generateQuiz(
  documentId: string,
  numQuestions: number = 4,
  level: string = 'beginner'
): Promise<QuizResponse> {
  const res = await fetch(`${API_BASE}/study/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: documentId,
      num_questions: numQuestions,
      learning_level: level,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Quiz generation failed' }));
    throw new Error(err.detail || 'Failed to generate quiz');
  }

  return await res.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchSettings(): Promise<{
  has_api_key: boolean;
  masked_api_key: string;
  llm_provider: string;
  model: string;
  indexed_chunks: number;
}> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return await res.json();
}

export async function saveApiKey(apiKey: string): Promise<{
  success: boolean;
  message: string;
  has_api_key: boolean;
}> {
  const res = await fetch(`${API_BASE}/settings/api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) throw new Error('Failed to update API key');
  return await res.json();
}

export async function clearAllProjectData(): Promise<void> {
  const res = await fetch(`${API_BASE}/settings/clear-all`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to clear project data');
}

