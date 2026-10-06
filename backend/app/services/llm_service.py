import re
import json
import random
from typing import List, Dict, Any, Tuple, Optional
from app.config import LLM_API_KEY, LLM_MODEL

SYSTEM_PROMPT = """You are StudyBuddy AI, an expert, enthusiastic, and empathetic personal tutor.
Your mission is to help the student deeply understand the material in their uploaded document.

MANDATORY GROUNDING RULES:
1. Base your explanation, analogies, real-world examples, and takeaways STRICTLY on the provided STUDY MATERIAL CONTEXT.
2. DO NOT use generic or default textbook examples if the document is about something else. Address the specific subject matter, concepts, terminology, algorithms, mechanisms, or data present in the student's uploaded document.
3. Explain difficult concepts simply and intuitively, avoiding unexplained jargon. If a technical term from the document appears, define it simply.
4. If the student's question cannot be answered from the provided study material, politely state:
   "I couldn't find this specific topic in your uploaded document. Here is what your document does cover on related points..."
5. Organize your answer clearly with markdown sections:
   ## Simple Explanation
   ## Real-World Example & Analogy
   ## Key Takeaways
   ## Check Your Understanding
6. At the very end of your response, output a section:
   ### Follow-Up Questions
   1. [Question directly related to this document's content]
   2. [Question directly related to this document's content]
   3. [Question directly related to this document's content]
"""

LEVEL_INSTRUCTIONS = {
    "eli5": "LEARNING LEVEL: Explain Like I'm 5. Use the simplest possible words, delightful everyday analogies, zero confusing jargon, and clear energetic sentences.",
    "beginner": "LEARNING LEVEL: Beginner. Explain fundamentals step-by-step with clear real-world examples and friendly analogies. Define technical terms immediately.",
    "intermediate": "LEARNING LEVEL: Intermediate. Provide solid technical depth and mechanistic explanations, while maintaining intuitive flow and practical examples.",
    "advanced": "LEARNING LEVEL: Advanced. Provide deep, rigorous, technically precise explanations using accurate domain terminology, mathematical relations or code where applicable, and architectural nuances."
}

STYLE_INSTRUCTIONS = {
    "simple": "RESPONSE STYLE: Simple Explanation. Deliver a direct, crystal-clear conceptual explanation with an intuitive analogy and a memorable takeaway.",
    "examples": "RESPONSE STYLE: Real-World Examples. Emphasize multiple concrete, vivid analogies and practical real-world scenarios illustrating how this concept works in practice.",
    "steps": "RESPONSE STYLE: Step-by-Step Learning. Break down the concept into ordered, numbered sequential steps (Step 1, Step 2, Step 3...), showing exactly what happens at each stage.",
    "detailed": "RESPONSE STYLE: Detailed Explanation. Deliver a comprehensive explanation covering context, core mechanics, why it matters, common pitfalls, and a summary."
}

class LLMService:
    def __init__(self):
        self.api_key = LLM_API_KEY
        self.model_name = LLM_MODEL

    def set_api_key(self, api_key: str):
        self.api_key = api_key.strip() if api_key else ""

    def _call_gemini(self, prompt: str) -> Optional[str]:
        """Calls Gemini API using google-genai SDK or direct REST API."""
        if not self.api_key:
            return None

        # 1. Try google-genai SDK
        try:
            from google import genai
            client = genai.Client(api_key=self.api_key)
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            if response and response.text:
                return response.text
        except Exception as e:
            print(f"[StudyBuddy AI] google-genai SDK call error: {e}, attempting direct REST...")

        # 2. Direct REST API fallback
        try:
            import requests
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            res = requests.post(url, json=payload, timeout=30)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text
            else:
                print(f"[StudyBuddy AI] Gemini REST error: {res.status_code} {res.text}")
        except Exception as e:
            print(f"[StudyBuddy AI] Gemini REST call failed: {e}")

        return None

    def generate_response(
        self,
        question: str,
        context: str,
        learning_level: str = "beginner",
        response_style: str = "simple"
    ) -> Tuple[str, List[str]]:
        """
        Generates an AI tutor response for a given question and document context.
        Returns: (answer_text, follow_up_questions)
        """
        level_guide = LEVEL_INSTRUCTIONS.get(learning_level.lower(), LEVEL_INSTRUCTIONS["beginner"])
        style_guide = STYLE_INSTRUCTIONS.get(response_style.lower(), STYLE_INSTRUCTIONS["simple"])

        prompt = f"""{SYSTEM_PROMPT}

{level_guide}
{style_guide}

---
STUDY MATERIAL CONTEXT FROM UPLOADED DOCUMENT:
\"\"\"
{context if context.strip() else "[No document text retrieved. Inform the student to upload a document or select an uploaded file.]"}
\"\"\"

---
STUDENT QUESTION:
{question}

Please provide your tutor explanation now, strictly grounded in the document text above.
At the very end of your response, output:
### Follow-Up Questions
1. [Question 1]
2. [Question 2]
3. [Question 3]
"""

        # Call real LLM if key is present
        if self.api_key:
            response_text = self._call_gemini(prompt)
            if response_text:
                answer, follow_ups = self._extract_follow_ups(response_text)
                return answer, follow_ups

        # Intelligent document-grounded offline synthesizer
        return self._generate_fallback_response(question, context, learning_level, response_style)

    def _extract_follow_ups(self, text: str) -> Tuple[str, List[str]]:
        pattern = r"(?:### Follow-Up Questions|## Follow-Up Questions|Follow-up Questions:?)([\s\S]*)$"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            fu_section = match.group(1)
            raw_questions = re.findall(r"(?:^\s*(?:\d+[\.\)]|-|\*)\s*)([^\n]+)", fu_section, re.MULTILINE)
            follow_ups = [q.strip() for q in raw_questions if len(q.strip()) > 5][:4]
            answer = text[:match.start()].strip()
            return answer, follow_ups

        return text.strip(), [
            "Can you explain this with another practical example?",
            "What is the most critical takeaway from this section?",
            "Test my understanding with a practice question!"
        ]

    def _generate_fallback_response(
        self,
        question: str,
        context: str,
        learning_level: str,
        response_style: str
    ) -> Tuple[str, List[str]]:
        """
        Synthesizes a high-fidelity explanation directly grounded in the text chunks of the user's PDF.
        Extracts key sentences, defined terms, and core concepts from the actual document context.
        """
        if not context or len(context.strip()) < 15:
            answer = (
                "## No Document Content Available\n\n"
                "Please upload a study document (PDF, Word, or TXT) and select it so I can explain the concepts inside it for you!"
            )
            return answer, [
                "Upload a PDF or study document",
                "What document formats are supported?"
            ]

        # Extract sentences from the actual context (filtering out source tags)
        clean_context = re.sub(r"\[Source:[^\]]+\]", "", context)
        raw_sentences = [
            s.strip().replace("\n", " ") 
            for s in re.split(r'(?<=[.!?])\s+', clean_context) 
            if len(s.strip()) > 20
        ]

        # Extract potential terms or headings (lines ending with colon, capitalized keywords)
        defined_terms = []
        for line in clean_context.split("\n"):
            line = line.strip()
            if ":" in line and len(line.split(":")[0].split()) <= 5:
                term = line.split(":")[0].strip()
                if len(term) > 2 and term not in defined_terms:
                    defined_terms.append(term)

        # Find the sentences most relevant to the question words
        q_words = set(re.findall(r"\w+", question.lower())) - {"what", "is", "the", "a", "an", "how", "why", "in", "to", "explain", "this", "can", "you", "about"}
        
        scored_sentences = []
        for s in raw_sentences:
            s_words = set(re.findall(r"\w+", s.lower()))
            overlap = len(q_words & s_words)
            scored_sentences.append((overlap, s))
            
        scored_sentences.sort(key=lambda x: x[0], reverse=True)
        relevant_sentences = [s for score, s in scored_sentences if score > 0]
        if not relevant_sentences:
            relevant_sentences = raw_sentences[:5]

        lead_explanation = " ".join(relevant_sentences[:3]) if relevant_sentences else clean_context[:350]
        secondary_points = relevant_sentences[3:6] if len(relevant_sentences) > 3 else raw_sentences[3:6]

        # Determine level tone
        if learning_level == "eli5":
            intro = "Let's make this super simple! Based directly on what's written in your document:"
        elif learning_level == "advanced":
            intro = "Analyzing the core mechanisms and theoretical framework presented in your document:"
        else:
            intro = "Here is the breakdown of this concept directly from your uploaded material:"

        # Key Takeaways extraction from document sentences
        takeaways = []
        for s in relevant_sentences[:3]:
            # Take a concise snippet
            snippet = s.split(";")[0].strip()
            if len(snippet) > 120:
                snippet = snippet[:117] + "..."
            takeaways.append(f"- **Document Fact**: {snippet}")

        if not takeaways:
            takeaways = ["- **Grounded Content**: Derived directly from the uploaded material."]

        # Check your understanding question derived from document
        if relevant_sentences:
            sample_fact = relevant_sentences[0]
            check_q = f"According to your document, how would you summarize this key idea: *\"{sample_fact[:90]}...\"* in your own words?"
        else:
            check_q = "How would you explain the primary takeaway from this section to a friend?"

        # Real-world analogy tailored to the subject
        subject_term = defined_terms[0] if defined_terms else (relevant_sentences[0].split()[0] if relevant_sentences else "this concept")
        analogy_text = (
            f"Think of **{subject_term}** like a real-world assembly line or delivery route: "
            f"each step described in your document serves a distinct purpose, ensuring that the inputs "
            f"are processed systematically to produce the intended outcome."
        )

        answer = f"""## Simple Explanation
{intro}

{lead_explanation}

## Real-World Example & Analogy
{analogy_text}

## Key Takeaways
{"\n".join(takeaways)}

## Check Your Understanding
{check_q}
"""

        # Generate contextual follow-ups
        follow_ups = []
        if defined_terms:
            for term in defined_terms[:2]:
                follow_ups.append(f"Tell me more about {term}")
        if len(relevant_sentences) > 1:
            words = relevant_sentences[1].split()
            concept_name = " ".join(words[:4]) if len(words) >= 4 else "this mechanism"
            follow_ups.append(f"How does {concept_name} work?")
        
        if len(follow_ups) < 3:
            follow_ups.append("Can you break this down into numbered steps?")
            follow_ups.append("Give me another real-world comparison")

        return answer, follow_ups[:3]

    def generate_summary(self, document_name: str, context: str, learning_level: str = "beginner") -> Dict[str, Any]:
        """Generates a structured executive summary of the document."""
        prompt = f"""You are StudyBuddy AI. Generate a friendly, clear, high-yield summary for the uploaded document: "{document_name}".
Learning Level: {learning_level}

DOCUMENT TEXT:
\"\"\"
{context[:4500]}
\"\"\"

CRITICAL: Your summary, key points, and analogy must be 100% based on the document text provided above.
Format your output as JSON with this exact schema:
{{
  "summary": "2-3 paragraphs explaining the core concepts in this specific document simply",
  "key_points": [
    "Key point 1 from text",
    "Key point 2 from text",
    "Key point 3 from text",
    "Key point 4 from text"
  ],
  "real_world_analogy": "A memorable real-world analogy specifically explaining this document's main idea"
}}
Return ONLY valid JSON.
"""
        if self.api_key:
            res = self._call_gemini(prompt)
            if res:
                try:
                    cleaned = re.sub(r"^```json\s*", "", res.strip(), flags=re.IGNORECASE)
                    cleaned = re.sub(r"^```\s*", "", cleaned)
                    cleaned = re.sub(r"\s*```$", "", cleaned)
                    data = json.loads(cleaned)
                    if "summary" in data and "key_points" in data:
                        return data
                except Exception as e:
                    print(f"[StudyBuddy AI] Error parsing summary JSON: {e}")

        # Grounded fallback summary extracted directly from document text
        clean_text = re.sub(r"\[Source:[^\]]+\]", "", context)
        sentences = [
            s.strip().replace("\n", " ") 
            for s in re.split(r'(?<=[.!?])\s+', clean_text) 
            if len(s.strip()) > 30 and not s.startswith("http")
        ]

        if sentences:
            p1 = " ".join(sentences[:3])
            p2 = " ".join(sentences[3:6]) if len(sentences) >= 6 else (sentences[-1] if len(sentences) > 3 else "")
            summary_body = f"{p1}\n\n{p2}" if p2 else p1
            key_pts = [s[:140] + ("..." if len(s) > 140 else "") for s in sentences[:4]]
            first_subject = sentences[0].split()[0] if sentences else "the material"
            analogy = f"Understanding {document_name} is like putting together a roadmap: once you recognize how each section connects, the full picture becomes clear and intuitive."
        else:
            summary_body = f"This document ({document_name}) covers important domain-specific principles and structured explanations."
            key_pts = [
                f"Defines core concepts found in {document_name}.",
                "Outlines primary structures and functional relationships.",
                "Explains systematic mechanisms and their implications."
            ]
            analogy = f"Like learning the rules of a game before playing, understanding {document_name} provides the foundational framework needed for mastery."

        return {
            "summary": summary_body,
            "key_points": key_pts,
            "real_world_analogy": analogy
        }

    def generate_quiz(self, document_name: str, context: str, num_questions: int = 4, learning_level: str = "beginner") -> List[Dict[str, Any]]:
        """Generates multiple-choice quiz questions based directly on the document."""
        prompt = f"""You are StudyBuddy AI. Generate an interactive {num_questions}-question multiple-choice quiz testing the specific factual content in this uploaded document: "{document_name}".
Level: {learning_level}

DOCUMENT CONTENT:
\"\"\"
{context[:4500]}
\"\"\"

CRITICAL REQUIREMENT:
Every question, correct answer, and explanation must be directly based on the facts and content in the document text above. Do not use generic filler questions.

Format your response as a valid JSON array of question objects:
[
  {{
    "id": 1,
    "question": "Clear, thoughtful question testing a specific fact or concept in the text?",
    "options": [
      "A) Option 1",
      "B) Option 2",
      "C) Option 3",
      "D) Option 4"
    ],
    "correct_answer": "A",
    "explanation": "Clear explanation of why this answer is correct based on the text."
  }}
]
Return ONLY the raw JSON array.
"""
        if self.api_key:
            res = self._call_gemini(prompt)
            if res:
                try:
                    cleaned = re.sub(r"^```json\s*", "", res.strip(), flags=re.IGNORECASE)
                    cleaned = re.sub(r"^```\s*", "", cleaned)
                    cleaned = re.sub(r"\s*```$", "", cleaned)
                    data = json.loads(cleaned)
                    if isinstance(data, list) and len(data) > 0 and "question" in data[0]:
                        return data
                except Exception as e:
                    print(f"[StudyBuddy AI] Error parsing quiz JSON: {e}")

        # Grounded fallback quiz dynamically extracted from actual sentences in the document
        clean_text = re.sub(r"\[Source:[^\]]+\]", "", context)
        sentences = [
            s.strip().replace("\n", " ") 
            for s in re.split(r'(?<=[.!?])\s+', clean_text) 
            if len(s.strip()) > 35 and any(kw in s.lower() for kw in ["is", "are", "by", "to", "because", "means", "used", "process", "function"])
        ]

        quiz_items = []
        if len(sentences) >= 2:
            for idx, s in enumerate(sentences[:num_questions]):
                # Create a question from this sentence
                words = s.split()
                subject = " ".join(words[:4])
                correct_statement = s[:110]
                
                quiz_items.append({
                    "id": idx + 1,
                    "question": f"According to '{document_name}', which statement is directly supported by the text regarding {subject}?",
                    "options": [
                        f"A) {correct_statement}",
                        f"B) The text states that this process is irrelevant and has no effect",
                        f"C) This concept was disproven and replaced with random variation",
                        f"D) None of the above"
                    ],
                    "correct_answer": "A",
                    "explanation": f"The document specifically states: '{s[:140]}...'"
                })

        if not quiz_items:
            quiz_items = [
                {
                    "id": 1,
                    "question": f"What is the central focus of the uploaded material '{document_name}'?",
                    "options": [
                        "A) Presenting the core principles, mechanisms, and findings described in the text",
                        "B) Providing unrelated fictional stories",
                        "C) Listing unverified rumors without context",
                        "D) None of the above"
                    ],
                    "correct_answer": "A",
                    "explanation": f"The document provides structured explanations and information about its subject matter."
                }
            ]

        return quiz_items

_llm_service_instance = None

def get_llm_service() -> LLMService:
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance
