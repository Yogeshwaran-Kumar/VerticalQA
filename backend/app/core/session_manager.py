"""
session_manager.py
──────────────────
Manages per-call session state across concurrent WebSocket connections.

Design:
  - full_transcript  → every sentence from call start; passed to LLM for full context
  - acoustic_window  → bounded deque of last N turns for emotion state tracking only
  - Thread-safe via asyncio.Lock
"""

import asyncio
from collections import deque
from dataclasses import dataclass, field
from typing import Deque, Dict, List, Optional

from fastapi import WebSocket

from app.core.config import settings


@dataclass
class Turn:
    """One complete utterance from a Soniox sentence boundary."""
    role: str
    text: str
    voice_emotion: str
    emotion_urgency_score: float


@dataclass
class Session:
    """Complete state for one phone call."""
    session_id: str
    full_transcript: List[Turn] = field(default_factory=list)
    acoustic_window: Deque[Turn] = field(
        default_factory=lambda: deque(maxlen=settings.WINDOW_SIZE)
    )
    subscribers: List[WebSocket] = field(default_factory=list)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    agent_ws: Optional[WebSocket] = field(default=None)
    last_asr_confidence: float = 1.0
    is_active: bool = True


class SessionManager:
    """
    Global registry of all active call sessions.
    Instantiated once in main.py and injected into the WebSocket router.
    """

    def __init__(self) -> None:
        self._sessions: Dict[str, Session] = {}
        self._global_lock = asyncio.Lock()

    async def get_or_create(self, session_id: str) -> Session:
        if session_id in self._sessions:
            return self._sessions[session_id]
        async with self._global_lock:
            if session_id not in self._sessions:
                self._sessions[session_id] = Session(session_id=session_id)
        return self._sessions[session_id]

    async def add_subscriber(self, session_id: str, ws: WebSocket) -> None:
        session = await self.get_or_create(session_id)
        async with session.lock:
            if ws not in session.subscribers:
                session.subscribers.append(ws)

    async def remove_subscriber(self, session_id: str, ws: WebSocket) -> None:
        if session_id not in self._sessions:
            return
        session = self._sessions[session_id]
        async with session.lock:
            if ws in session.subscribers:
                session.subscribers.remove(ws)

    async def append_turn(
        self,
        session_id: str,
        role: str,
        text: str,
        voice_emotion: str,
        emotion_urgency_score: float,
    ) -> None:
        """Appends a completed sentence to both full_transcript and acoustic_window."""
        session = await self.get_or_create(session_id)
        turn = Turn(
            role=role,
            text=text,
            voice_emotion=voice_emotion,
            emotion_urgency_score=emotion_urgency_score,
        )
        async with session.lock:
            session.full_transcript.append(turn)
            session.acoustic_window.append(turn)

    def get_full_transcript(self, session_id: str) -> List[Turn]:
        """Returns the complete conversation history for LLM context."""
        if session_id not in self._sessions:
            return []
        return list(self._sessions[session_id].full_transcript)

    def get_acoustic_window(self, session_id: str) -> List[Turn]:
        """Returns the last N turns for acoustic state tracking."""
        if session_id not in self._sessions:
            return []
        return list(self._sessions[session_id].acoustic_window)

    def update_asr_confidence(self, session_id: str, confidence: float) -> None:
        if session_id in self._sessions:
            self._sessions[session_id].last_asr_confidence = confidence

    def get_asr_confidence(self, session_id: str) -> float:
        if session_id not in self._sessions:
            return 1.0
        return self._sessions[session_id].last_asr_confidence

    async def broadcast(
        self,
        session_id: str,
        payload: dict,
        exclude: Optional[WebSocket] = None,
    ) -> None:
        """Sends payload to all subscribers, optionally excluding one socket."""
        if session_id not in self._sessions:
            return
        session = self._sessions[session_id]
        dead: List[WebSocket] = []
        for ws in session.subscribers:
            if exclude is not None and ws is exclude:
                continue
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        async with session.lock:
            for ws in dead:
                if ws in session.subscribers:
                    session.subscribers.remove(ws)

    async def register_agent(self, session_id: str, ws: WebSocket) -> None:
        """Marks a WebSocket as the agent connection for private TTS whispers."""
        session = await self.get_or_create(session_id)
        async with session.lock:
            session.agent_ws = ws

    async def send_to_agent(self, session_id: str, payload: dict) -> None:
        """Sends payload exclusively to the registered agent socket."""
        if session_id not in self._sessions:
            return
        agent_ws = self._sessions[session_id].agent_ws
        if agent_ws is None:
            return
        try:
            await agent_ws.send_json(payload)
        except Exception:
            async with self._sessions[session_id].lock:
                self._sessions[session_id].agent_ws = None

    async def close_session(self, session_id: str) -> None:
        """Closes and removes a session at call end."""
        if session_id in self._sessions:
            self._sessions[session_id].is_active = False
            del self._sessions[session_id]

    def active_session_count(self) -> int:
        return len(self._sessions)
