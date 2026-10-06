# StudyBuddy AI — Complete Project Implementation

> **"Upload your study material and learn it with an AI tutor that explains difficult concepts like you're a kid."**

StudyBuddy AI transforms complex study materials (PDFs, DOCX, TXT notes) into crystal-clear, intuitive learning experiences. It features a complete RAG (Retrieval-Augmented Generation) pipeline, FAISS vector search, page-level citation references, adaptive explanation levels (from ELI5 to Advanced), response styles, interactive quizzes, document summarization, and persistent study sessions.

---

## 🏗️ Architecture

```text
                    STUDYBUDDY AI
                         │
                         ▼
             React 18 + Vite Frontend
            (Matching Lovable UI/UX)
                         │
                         ▼  (REST API / CORS / Proxy)
                   FastAPI Backend
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
      Document Service          Chat Service
             │                       │
             ▼                       ▼
     Text Extraction              RAG Pipeline
    (pypdf / docx / txt)             │
             │                       ▼
             ▼                 Vector Search
       Text Chunking          (FAISS IndexFlatIP)
      (Page-preserving)              │
             │                       ▼
             ▼                   LLM Service
       Embeddings            (Gemini 2.5 Flash /
     (Dense vectors)          Built-in Synthesizer)
             │                       │
             ▼                       ▼
        FAISS Index          AI Tutor Response
                         (Markdown, Sources, Follow-ups)
```

---

## ✨ Features

1. **Document Upload & Processing Pipeline**:
   - Supported formats: **PDF**, **DOCX**, **TXT** (up to 20 MB).
   - Real-time processing states: `Uploading...` → `Extracting...` → `Processing...` → `Indexing...` → `Ready`.
   - Page-preserving text extraction with `pypdf` and `python-docx`.

2. **RAG Pipeline & FAISS Vector Indexing**:
   - Chunks text into dense semantic passages preserving document name and page number.
   - Fast cosine similarity search in FAISS (`IndexFlatIP`).
   - Cites exact document names and page numbers (e.g., `Biology Ch.4 — Photosynthesis.pdf — Page 2`).

3. **"Explain Like I'm 5" & Adaptive Learning Levels**:
   - **Explain Like I'm 5 (eli5)**: Playful everyday analogies, simple language, no confusing jargon.
   - **Beginner**: Gentle step-by-step technical explanations with clear examples.
   - **Intermediate**: Moderate technical depth and mechanistic understanding.
   - **Advanced**: Formal terminology, mathematical relationships, and deeper nuance.

4. **Response Styles**:
   - **Simple Explanation**: Crystal-clear conceptual explanation with an intuitive analogy.
   - **Real-World Examples**: Multiple concrete real-world comparisons and scenarios.
   - **Step-by-Step Learning**: Ordered, sequential numbered steps.
   - **Detailed Explanation**: Comprehensive deep-dive with background, mechanics, and key takeaways.

5. **Study Features**:
   - **Interactive Practice Quiz**: Generates multiple-choice questions (A, B, C, D) with instant feedback, scoring, and explanations.
   - **Document Summarization**: Produces core overview, bulleted key takeaways, and memorable real-world analogies.
   - **Suggested Follow-up Questions**: One-click continuation chips for ongoing learning.

6. **Persistent Study Sessions**:
   - Saved in local SQLite database (`backend/data/studybuddy.db`).
   - Resume past study conversations or delete obsolete sessions.

7. **Appearance & Customization**:
   - Light and Dark modes.
   - Toggle for source citations and compact view.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on v22)
- **Python** 3.10+ (tested on Python 3.13)
- **npm** or **yarn**

---

### 2. Backend Setup

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment (recommended):

**On Windows:**
```powershell
python -m venv .venv
.venv\Scripts\activate
```

**On macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install backend dependencies:
```bash
pip install -r requirements.txt
```

*(Optional)* Configure your Google Gemini API key:
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env`:
```env
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.5-flash
EMBEDDING_PROVIDER=local
MAX_FILE_SIZE_MB=20
```
> *Note:* If no `LLM_API_KEY` is provided, StudyBuddy AI uses its built-in intelligent synthesizer to answer questions grounded in the retrieved document chunks, so the application remains completely functional out-of-the-box!

Start the FastAPI backend server:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be live at:
- **API Base**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

---

### 3. Frontend Setup

In a new terminal window at the project root directory:

Install frontend dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

Open your browser at:
`http://localhost:5173`

---

## 🧪 Testing Checklist

Verify the full end-to-end flow:

- [x] **Test 1 — Upload a PDF / Text file**: Drop a `.pdf`, `.docx`, or `.txt` file into the upload zone.
- [x] **Test 2 — Text Extraction**: Confirm text is extracted page-by-page.
- [x] **Test 3 — Chunking**: Confirm document is split into page-attributed chunks.
- [x] **Test 4 — Embeddings**: Dense semantic vectors generated for chunks.
- [x] **Test 5 — FAISS Indexing**: Chunks indexed into `faiss.IndexFlatIP`.
- [x] **Test 6 — Ask a Question**: Select a document and ask a specific question.
- [x] **Test 7 — Document Grounding**: Answer is formulated directly from the document.
- [x] **Test 8 — Source References**: Answer displays cited document name and page number.
- [x] **Test 9 — Learning Level**: Switch between *Explain Like I'm 5*, *Beginner*, *Intermediate*, *Advanced*.
- [x] **Test 10 — Response Style**: Switch between *Simple*, *Real-World Examples*, *Step-by-Step*, *Detailed*.
- [x] **Test 11 — Invalid Upload**: Upload unsupported extensions; verify error message displayed.
- [x] **Test 12 — Unrelated Question**: Ask question not in document; verify friendly notice.
- [x] **Test 13 — Chat History & Sessions**: Check study sessions list and resume previous conversation.
- [x] **Test 14 — Document Deletion**: Delete document; verify removal from database, disk, and FAISS index.
- [x] **Test 15 — Quiz Generation**: Open practice quiz and test multiple-choice answering.
- [x] **Test 16 — Summarization**: Open document summary and review key takeaways and analogies.

---

## 📁 Repository Structure

```text
studybuddy/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── documents.py    # Document upload, list, delete
│   │   │   ├── chat.py         # RAG question answering
│   │   │   ├── sessions.py     # Session history management
│   │   │   └── study.py        # Summarization & Quiz generation
│   │   ├── models/
│   │   │   ├── database.py     # SQLite persistence
│   │   │   └── schemas.py      # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── document_service.py # Document processing pipeline
│   │   │   ├── embedding_service.py# Dense embedding models
│   │   │   ├── vector_store_service.py # FAISS vector store
│   │   │   ├── llm_service.py  # Gemini & prompt engineering
│   │   │   └── rag_service.py  # End-to-end RAG orchestrator
│   │   ├── utils/
│   │   │   ├── file_processing.py # PDF/DOCX/TXT extractors
│   │   │   ├── text_processing.py # Text cleaner & chunker
│   │   │   └── init_demo_data.py  # Standard demo materials
│   │   ├── config.py           # Configuration & environment
│   │   └── main.py             # FastAPI entry point
│   ├── data/
│   │   ├── uploads/            # Uploaded files storage
│   │   ├── vector_store/       # FAISS index and metadata
│   │   └── studybuddy.db       # SQLite database
│   ├── requirements.txt
│   └── .env.example
│
├── src/
│   ├── components/
│   │   ├── AppShell.tsx        # Collapsible workspace layout
│   │   ├── Navbar.tsx          # Landing page navigation
│   │   ├── QuizModal.tsx       # Interactive practice quiz
│   │   ├── SummaryModal.tsx    # Document summary modal
│   │   └── UploadZone.tsx      # Drag & drop upload component
│   ├── context/
│   │   └── StoreContext.tsx    # Global React state
│   ├── pages/
│   │   ├── LandingPage.tsx     # Public hero & feature overview
│   │   ├── DashboardPage.tsx   # Workspace overview & quick actions
│   │   ├── TutorPage.tsx       # AI Tutor chat & RAG controls
│   │   ├── DocumentsPage.tsx   # Document library management
│   │   ├── SessionsPage.tsx    # Conversation history
│   │   └── SettingsPage.tsx    # Preferences & learning levels
│   ├── services/
│   │   └── api.ts              # API client
│   ├── types/
│   │   └── api.ts              # TypeScript interfaces
│   ├── App.tsx                 # Router setup
│   ├── index.css               # Lovable styling system
│   └── main.tsx                # React root
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── .env.example
└── README.md
```
