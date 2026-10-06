from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Learning Levels and Response Styles
class LearningLevel(str):
    ELI5 = "eli5"
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class ResponseStyle(str):
    SIMPLE = "simple"
    EXAMPLES = "examples"
    STEPS = "steps"
    DETAILED = "detailed"

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    name: str
    kind: str
    size_bytes: int
    pages: int = 1
    uploaded_at: str
    status: str  # uploading, extracting, processing, indexing, ready, failed
    is_demo: bool = False

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int

# Chat & RAG Schemas
class SourceReference(BaseModel):
    document_id: Optional[str] = None
    document_name: Optional[str] = None
    page: Optional[int] = 1
    excerpt: Optional[str] = None
    score: Optional[float] = None

class ChatRequest(BaseModel):
    question: str
    document_ids: Optional[List[str]] = Field(default_factory=list)
    session_id: Optional[str] = None
    learning_level: Optional[str] = "beginner"
    response_style: Optional[str] = "simple"

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceReference] = Field(default_factory=list)
    follow_ups: List[str] = Field(default_factory=list)
    session_id: Optional[str] = None

# Session Schemas
class MessageSchema(BaseModel):
    id: str
    session_id: str
    role: str  # user or assistant
    content: str
    sources: Optional[List[SourceReference]] = Field(default_factory=list)
    follow_ups: Optional[List[str]] = Field(default_factory=list)
    created_at: str

class SessionCreate(BaseModel):
    title: Optional[str] = "New Study Session"
    document_id: Optional[str] = None
    document_name: Optional[str] = None

class SessionSummary(BaseModel):
    id: str
    title: str
    document_id: Optional[str] = None
    document_name: Optional[str] = None
    created_at: str
    updated_at: str
    message_count: int = 0
    last_message: Optional[Dict[str, Any]] = None

class SessionDetail(BaseModel):
    id: str
    title: str
    document_id: Optional[str] = None
    document_name: Optional[str] = None
    created_at: str
    updated_at: str
    messages: List[MessageSchema] = Field(default_factory=list)

# Study Features Schemas
class SummarizeRequest(BaseModel):
    document_id: str
    learning_level: Optional[str] = "beginner"

class SummaryResponse(BaseModel):
    document_id: str
    document_name: str
    summary: str
    key_points: List[str] = Field(default_factory=list)
    real_world_analogy: Optional[str] = None

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_answer: str  # "A", "B", "C", or "D"
    explanation: str

class QuizRequest(BaseModel):
    document_id: str
    num_questions: Optional[int] = 4
    learning_level: Optional[str] = "beginner"

class QuizResponse(BaseModel):
    document_id: str
    document_name: str
    quiz: List[QuizQuestion]
