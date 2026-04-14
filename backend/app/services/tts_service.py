"""
tts_service.py
──────────────
Text-to-Speech whisper engine for the agent.

TRIGGER: escalation_risk == "high" OR toxicity_flag == True
DELIVERY: Audio sent ONLY to agent's WebSocket (private coaching)
IMPLEMENTATION: gTTS runs in ThreadPoolExecutor (never blocks event loop)
"""

import asyncio
import base64
import io
import random

import structlog

from app.models.schemas import EscalationRisk

logger = structlog.get_logger()

try:
    from gtts import gTTS
    _GTTS_AVAILABLE = True
except ImportError:
    _GTTS_AVAILABLE = False
    logger.warning("gTTS not installed — TTS mock mode. pip install gtts")


def _should_trigger(escalation_risk: EscalationRisk, toxicity_flag: bool) -> bool:
    return escalation_risk == EscalationRisk.high or toxicity_flag


def _gtts_to_base64(text: str) -> str:
    tts = gTTS(text=text, lang="en", slow=False)
    buffer = io.BytesIO()
    tts.write_to_fp(buffer)
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


async def generate_whisper(
    suggestion: str,
    escalation_risk: EscalationRisk,
    toxicity_flag: bool = False,
) -> str | None:
    """
    Returns base64 MP3 string if triggered, else None.
    Delivered exclusively to the agent WebSocket.
    """
    if not _should_trigger(escalation_risk, toxicity_flag):
        return None

    if not suggestion or len(suggestion.strip()) < 3:
        return None

    reason = "high_risk" if escalation_risk == EscalationRisk.high else "toxicity"
    logger.info("TTS whisper triggered", trigger=reason, escalation_risk=escalation_risk.value)

    if not _GTTS_AVAILABLE:
        return await _mock_generate()

    try:
        loop = asyncio.get_event_loop()
        audio_b64 = await loop.run_in_executor(None, _gtts_to_base64, suggestion)
        logger.info("TTS whisper generated", bytes_len=len(audio_b64))
        return audio_b64
    except Exception as e:
        logger.error("gTTS generation failed", error=str(e))
        return None


async def _mock_generate() -> str:
    await asyncio.sleep(random.uniform(0.05, 0.08))
    return base64.b64encode(b"MOCK_AGENT_WHISPER_AUDIO").decode("utf-8")
