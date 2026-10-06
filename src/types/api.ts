export type LearningLevel = 'eli5' | 'beginner' | 'intermediate' | 'advanced';
export type ResponseStyle = 'simple' | 'examples' | 'steps' | 'detailed';

export interface DocumentItem {
  id: string;
  name: string;
  kind: string;
  size_bytes: number;
  pages: number;
  uploaded_at: string;
  status: 'uploading' | 'extracting' | 'processing' | 'indexing' | 'ready' | 'failed';
  is_demo?: boolean;
}

export interface SourceReference {
  document_id?: string;
  document_name?: string;
  page?: number;
  excerpt?: string;
  score?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceReference[];
  follow_ups?: string[];
  created_at: string;
}

export interface StudySession {
  id: string;
  title: string;
  document_id?: string;
  document_name?: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  messages?: ChatMessage[];
  last_message?: {
    role: string;
    content: string;
    created_at: string;
  };
}

export interface ChatRequest {
  question: string;
  document_ids?: string[];
  session_id?: string;
  learning_level?: LearningLevel;
  response_style?: ResponseStyle;
}

export interface ChatResponse {
  answer: string;
  sources: SourceReference[];
  follow_ups: string[];
  session_id?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface QuizResponse {
  document_id: string;
  document_name: string;
  quiz: QuizQuestion[];
}

export interface SummaryResponse {
  document_id: string;
  document_name: string;
  summary: string;
  key_points: string[];
  real_world_analogy?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  explanationLevel: LearningLevel;
  responseStyle: ResponseStyle;
  showSources: boolean;
  compactChat: boolean;
}
