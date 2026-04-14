"""
asr_service.py
──────────────
Real-time Soniox ASR — two-speed streaming pipeline.

FAST PATH  (~32ms cadence):
  audio_chunk → decode → amplify 8× → binary frame to Soniox (fire-and-forget)

ANALYSIS TRIGGER (~2–5s cadence, on Soniox sentence boundary):
  Background listener detects empty token packet → assembles sentence →
  puts into asyncio.Queue → pipeline picks up and runs LLM + escalation.

One SonioxStreamSession per (session_id, role) — customer and agent are
always independent channels.
"""

import asyncio
import base64
import json
import time
from typing import Dict, Optional, Tuple

import numpy as np
import structlog
import websockets
from websockets.exceptions import ConnectionClosed

from app.core.config import settings
from app.models.schemas import ASRResult

logger = structlog.get_logger()

SONIOX_WS_URL = "wss://stt-rt.soniox.com/transcribe-websocket"
AUDIO_GAIN = 8
SENTENCE_GAP_S = 0.10


class SonioxStreamSession:
    """Long-lived WebSocket to Soniox for a single (session_id, role) stream."""

    def __init__(self, session_id: str, role: str) -> None:
        self.session_id = session_id
        self.role = role
        self._ws: Optional[websockets.WebSocketClientProtocol] = None
        self._connected = False
        self._token_snapshot: Dict[int, str] = {}
        self._last_token_time: float = 0.0
        self._sentences: asyncio.Queue = asyncio.Queue(maxsize=50)
        self._listen_task: Optional[asyncio.Task] = None

    async def connect(self) -> None:
        try:
            self._ws = await websockets.connect(
                SONIOX_WS_URL,
                ping_interval=20,
                ping_timeout=10,
                open_timeout=10,
            )
            await self._ws.send(json.dumps({
                "api_key": settings.SONIOX_API_KEY,
                "model": "stt-rt-preview",
                "audio_format": "s16le",
                "sample_rate": settings.ASR_SAMPLE_RATE,
                "num_channels": 1,
                "language_hints": ["en"],
            }))
            self._connected = True
            self._listen_task = asyncio.create_task(
                self._listen_loop(),
                name=f"soniox_{self.session_id}_{self.role}",
            )
            logger.info("Soniox connected", session_id=self.session_id, role=self.role)
        except Exception as e:
            logger.error("Soniox connect failed", session_id=self.session_id, error=str(e))
            self._connected = False

    async def close(self) -> None:
        self._connected = False
        if self._listen_task and not self._listen_task.done():
            self._listen_task.cancel()
            try:
                await self._listen_task
            except asyncio.CancelledError:
                pass
        if self._ws:
            try:
                await self._ws.send(b"")
                await self._ws.close()
            except Exception:
                pass

    async def stream_audio(self, audio_bytes: bytes) -> None:
        """Amplify and forward raw PCM to Soniox (fire-and-forget)."""
        if not self._connected or self._ws is None:
            return
        try:
            pcm = np.frombuffer(audio_bytes, dtype=np.int16)
            amplified = np.clip(
                pcm.astype(np.int32) * AUDIO_GAIN, -32768, 32767
            ).astype(np.int16)
            await self._ws.send(amplified.tobytes())
        except ConnectionClosed:
            self._connected = False
        except Exception as e:
            logger.warning("Soniox send error", role=self.role, error=str(e))

    async def _listen_loop(self) -> None:
        """Background task — accumulates tokens and emits completed sentences."""
        try:
            async for raw in self._ws:
                try:
                    response = json.loads(raw)
                except json.JSONDecodeError:
                    continue

                tokens = response.get("tokens", [])
                if tokens:
                    for t in tokens:
                        self._token_snapshot[t.get("start_ms", 0)] = t.get("text", "")
                    self._last_token_time = time.monotonic()
                elif self._token_snapshot:
                    if time.monotonic() - self._last_token_time >= SENTENCE_GAP_S:
                        sentence = self._flush_sentence()
                        if sentence:
                            try:
                                self._sentences.put_nowait(sentence)
                            except asyncio.QueueFull:
                                try:
                                    self._sentences.get_nowait()
                                    self._sentences.put_nowait(sentence)
                                except Exception:
                                    pass
        except (ConnectionClosed, asyncio.CancelledError):
            pass
        except Exception as e:
            logger.error("Soniox listener error", role=self.role, error=str(e))
        finally:
            if self._token_snapshot:
                sentence = self._flush_sentence()
                if sentence:
                    try:
                        self._sentences.put_nowait(sentence)
                    except Exception:
                        pass
            self._connected = False

    def _flush_sentence(self) -> str:
        sentence = "".join(
            self._token_snapshot[k] for k in sorted(self._token_snapshot)
        ).strip()
        self._token_snapshot = {}
        return sentence

    def poll_sentence(self) -> Tuple[str, float]:
        """Non-blocking poll — returns ("", 0.90) when no sentence is ready."""
        try:
            return self._sentences.get_nowait(), 0.90
        except asyncio.QueueEmpty:
            return "", 0.90

    @property
    def is_connected(self) -> bool:
        return self._connected


# ─── Session Registry ─────────────────────────────────────────────────────────

_sessions: Dict[Tuple[str, str], SonioxStreamSession] = {}
_registry_lock = asyncio.Lock()


async def _get_or_create(session_id: str, role: str) -> SonioxStreamSession:
    key = (session_id, role)
    async with _registry_lock:
        if key not in _sessions:
            sess = SonioxStreamSession(session_id=session_id, role=role)
            await sess.connect()
            _sessions[key] = sess
    return _sessions[key]


# ─── Public API ───────────────────────────────────────────────────────────────

async def stream_and_poll(audio_b64: str, session_id: str, role: str) -> ASRResult:
    """
    Fast path: decode → amplify → stream to Soniox.
    Analysis trigger: poll for any completed sentence.
    """
    try:
        audio_bytes = base64.b64decode(audio_b64)
    except Exception:
        return ASRResult(transcript_segment="", confidence=0.0, is_final=False)

    sess = await _get_or_create(session_id, role)
    await sess.stream_audio(audio_bytes)
    transcript, confidence = sess.poll_sentence()

    return ASRResult(
        transcript_segment=transcript,
        confidence=confidence,
        is_final=bool(transcript),
    )


async def close_session(session_id: str) -> None:
    """Close both customer and agent Soniox channels for a session."""
    async with _registry_lock:
        for role in ("customer", "agent"):
            key = (session_id, role)
            if key in _sessions:
                await _sessions[key].close()
                del _sessions[key]
