import sqlite3
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.config import DB_PATH

def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            kind TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            pages INTEGER DEFAULT 1,
            uploaded_at TEXT NOT NULL,
            status TEXT NOT NULL,
            file_path TEXT NOT NULL,
            is_demo BOOLEAN DEFAULT 0
        )
    """)
    
    # Study sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            document_id TEXT,
            document_name TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    
    # Messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            sources_json TEXT,
            follow_ups_json TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()

# Document Operations
def db_insert_document(doc_id: str, name: str, kind: str, size_bytes: int, pages: int, status: str, file_path: str, is_demo: bool = False):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    cursor.execute("""
        INSERT OR REPLACE INTO documents (id, name, kind, size_bytes, pages, uploaded_at, status, file_path, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (doc_id, name, kind, size_bytes, pages, now, status, file_path, 1 if is_demo else 0))
    conn.commit()
    conn.close()

def db_update_document_status(doc_id: str, status: str, pages: Optional[int] = None):
    conn = get_db()
    cursor = conn.cursor()
    if pages is not None:
        cursor.execute("UPDATE documents SET status = ?, pages = ? WHERE id = ?", (status, pages, doc_id))
    else:
        cursor.execute("UPDATE documents SET status = ? WHERE id = ?", (status, doc_id))
    conn.commit()
    conn.close()

def db_get_all_documents() -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents ORDER BY uploaded_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def db_get_document(doc_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def db_delete_document(doc_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

# Session Operations
def db_create_session(session_id: str, title: str, document_id: Optional[str], document_name: Optional[str]) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    cursor.execute("""
        INSERT INTO sessions (id, title, document_id, document_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (session_id, title, document_id, document_name, now, now))
    conn.commit()
    conn.close()
    return {
        "id": session_id,
        "title": title,
        "document_id": document_id,
        "document_name": document_name,
        "created_at": now,
        "updated_at": now,
        "messages": []
    }

def db_upsert_session(session_id: str, title: str, document_id: Optional[str], document_name: Optional[str], updated_at: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    now = updated_at or (datetime.utcnow().isoformat() + "Z")
    cursor.execute("""
        INSERT INTO sessions (id, title, document_id, document_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            document_id = COALESCE(excluded.document_id, sessions.document_id),
            document_name = COALESCE(excluded.document_name, sessions.document_name),
            updated_at = excluded.updated_at
    """, (session_id, title, document_id, document_name, now, now))
    conn.commit()
    conn.close()

def db_get_all_sessions() -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions ORDER BY updated_at DESC")
    sessions = [dict(r) for r in cursor.fetchall()]
    
    # Attach message count or last message
    for s in sessions:
        cursor.execute("SELECT COUNT(*) as count FROM messages WHERE session_id = ?", (s["id"],))
        s["message_count"] = cursor.fetchone()["count"]
        cursor.execute("SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 1", (s["id"],))
        last_msg = cursor.fetchone()
        s["last_message"] = dict(last_msg) if last_msg else None
        
    conn.close()
    return sessions

def db_get_session_details(session_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    if not session:
        conn.close()
        return None
    
    res = dict(session)
    cursor.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
    messages = []
    for r in cursor.fetchall():
        msg = dict(r)
        if msg.get("sources_json"):
            try:
                msg["sources"] = json.loads(msg["sources_json"])
            except Exception:
                msg["sources"] = []
        else:
            msg["sources"] = []
            
        if msg.get("follow_ups_json"):
            try:
                msg["follow_ups"] = json.loads(msg["follow_ups_json"])
            except Exception:
                msg["follow_ups"] = []
        else:
            msg["follow_ups"] = []
        messages.append(msg)
        
    res["messages"] = messages
    conn.close()
    return res

def db_delete_session(session_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
    cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()

def db_add_message(message_id: str, session_id: str, role: str, content: str, sources: Optional[List[Dict[str, Any]]] = None, follow_ups: Optional[List[str]] = None):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    sources_json = json.dumps(sources) if sources else None
    follow_ups_json = json.dumps(follow_ups) if follow_ups else None
    cursor.execute("""
        INSERT INTO messages (id, session_id, role, content, sources_json, follow_ups_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (message_id, session_id, role, content, sources_json, follow_ups_json, now))
    
    # Update session updated_at
    cursor.execute("UPDATE sessions SET updated_at = ? WHERE id = ?", (now, session_id))
    conn.commit()
    conn.close()
