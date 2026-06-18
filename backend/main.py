"""
PageAI Backend — FastAPI + Claude API
=====================================
Powers the Chrome extension: summarization, translation, data extraction.

Deploy: railway.app or render.com (free tier to start)
"""

import os
import hashlib
import time
from datetime import datetime, date
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

# ============== Config ==============
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
FREE_DAILY_LIMIT = int(os.getenv("FREE_DAILY_LIMIT", "10"))
CLAUDE_MODEL = "claude-haiku-4-5-20251001"  # Fast & cheap for summarization

# ============== App Setup ==============
app = FastAPI(
    title="PageAI API",
    description="AI-powered web page assistant — summarize, translate, extract data",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Chrome extension can come from any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Clients ==============
claude = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None


# ============== Models ==============
class SummarizeRequest(BaseModel):
    url: str = ""
    title: str = ""
    text: str = Field(..., min_length=1, max_length=15000)

class TranslateRequest(BaseModel):
    url: str = ""
    text: str = Field(..., min_length=1, max_length=5000)

class ExtractRequest(BaseModel):
    url: str = ""
    text: str = Field(..., min_length=1, max_length=15000)

class AskRequest(BaseModel):
    url: str = ""
    text: str = Field(..., max_length=10000)
    question: str = Field(..., min_length=1, max_length=500)

class AIResponse(BaseModel):
    result: str
    model: str
    tokens_used: int


# ============== Claude Helper ==============
def call_claude(system_prompt: str, user_message: str, max_tokens: int = 1000) -> AIResponse:
    """Unified Claude API call with error handling."""
    if not claude:
        raise HTTPException(
            status_code=503,
            detail="AI service not configured. Set ANTHROPIC_API_KEY environment variable."
        )

    try:
        response = claude.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )

        return AIResponse(
            result=response.content[0].text,
            model=CLAUDE_MODEL,
            tokens_used=response.usage.output_tokens,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


# ============== API Routes ==============
@app.get("/")
def root():
    return {
        "service": "PageAI API",
        "version": "1.0.0",
        "endpoints": ["/api/summarize", "/api/translate", "/api/extract", "/api/ask"],
        "docs": "/docs",
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "claude_configured": claude is not None,
    }


@app.post("/api/summarize", response_model=AIResponse)
def summarize(req: SummarizeRequest):
    """Summarize a webpage in 3-5 bullet points."""
    system_prompt = """You are a professional content summarizer.
Summarize the given webpage text into 3-5 concise bullet points.
Focus on key information: who, what, when, why, and key numbers.
Write in the same language as the original text.
Be accurate — don't add information not in the source."""

    user_message = f"Title: {req.title}\nURL: {req.url}\n\nContent:\n{req.text[:8000]}"

    return call_claude(system_prompt, user_message, max_tokens=500)


@app.post("/api/translate", response_model=AIResponse)
def translate(req: TranslateRequest):
    """Translate selected text to English (or vice versa)."""
    system_prompt = """You are a professional translator.
Translate the given text to natural, fluent English.
If the text is already in English, translate it to Chinese.
Preserve the original meaning and tone.
Output ONLY the translation, no explanations."""

    return call_claude(system_prompt, req.text[:3000], max_tokens=800)


@app.post("/api/extract", response_model=AIResponse)
def extract(req: ExtractRequest):
    """Extract structured data from webpage content."""
    system_prompt = """You are a data extraction expert.
Extract structured information from the webpage content.
Look for: names, prices, dates, contact info, addresses, product specs, statistics.
Return the data in a clean, organized format (key-value pairs or table).
Be precise — only extract what's actually in the text."""

    user_message = f"URL: {req.url}\n\nContent:\n{req.text[:8000]}"

    return call_claude(system_prompt, user_message, max_tokens=800)


@app.post("/api/ask", response_model=AIResponse)
def ask(req: AskRequest):
    """Answer a custom question about the webpage."""
    system_prompt = """You are a helpful AI assistant.
Answer the user's question based on the webpage content provided.
If the answer isn't in the content, say so honestly.
Be concise and direct."""

    user_message = f"Webpage: {req.title if hasattr(req, 'title') else ''}\nURL: {req.url}\n\nContent:\n{req.text[:6000]}\n\nQuestion: {req.question}"

    return call_claude(system_prompt, user_message, max_tokens=600)


# ============== Run ==============
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
