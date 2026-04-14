"""
context_fuser.py
─────────────────
Builds the multimodal LLM context and runs the deterministic
Escalation Unified Decision Algorithm.

Escalation Algorithm (post-LLM, never delegated to the LLM):
  Step 1 — Override:  toxicity or critical intent → High immediately
  Step 2 — Score:     (0.65 × intent_severity) + (0.35 × emotion_urgency)
  Step 3 — ASR Gate:  dampen 30% if audio confidence < 0.40
  Step 4 — Threshold: <0.50 Low | <0.75 Medium | ≥0.75 High
"""

from typing import List, Tuple

from app.core.config import settings
from app.core.session_manager import SessionManager, Turn
from app.models.schemas import EscalationRisk, FusedContext


def build_fused_context(
    session_id: str,
    session_manager: SessionManager,
    latest_voice_emotion: str,
    latest_vocal_tension: str,
) -> FusedContext:
    """
    Assembles the complete LLM context from the full call history.

    Passes every sentence from call start so the LLM sees the full
    conversation arc, not just a sliding window.
    """
    full_history: List[Turn] = session_manager.get_full_transcript(session_id)

    conversation_history = [
        {
            "role": turn.role,
            "text": turn.text,
            "voice_emotion": turn.voice_emotion,
        }
        for turn in full_history
    ]

    acoustic_summary = {
        "voice_emotion": latest_voice_emotion,
        "vocal_tension": latest_vocal_tension,
    }

    return FusedContext(
        conversation_window=conversation_history,
        acoustic_summary=acoustic_summary,
        asr_confidence=session_manager.get_asr_confidence(session_id),
    )


def compute_escalation_risk(
    intent: str,
    voice_emotion: str,
    toxicity_flag: bool,
    asr_confidence: float,
) -> Tuple[EscalationRisk, float]:
    """
    Deterministic escalation scoring — the LLM never computes this.

    Returns (EscalationRisk, raw_score).
    """
    # Step 1 — Unconditional override
    if toxicity_flag or intent in settings.OVERRIDE_INTENTS:
        return EscalationRisk.high, 1.0

    # Step 2 — Weighted score
    intent_severity = settings.INTENT_SEVERITY.get(intent, 0.10)
    emotion_urgency = settings.EMOTION_URGENCY.get(voice_emotion, 0.40)
    raw_score = (
        settings.INTENT_WEIGHT * intent_severity
        + settings.SEMANTIC_WEIGHT * emotion_urgency
    )

    # Step 3 — ASR confidence gate
    if asr_confidence < settings.ASR_CONFIDENCE_GATE:
        raw_score *= settings.ASR_DAMPEN_FACTOR

    raw_score = round(min(raw_score, 1.0), 4)

    # Step 4 — Threshold matrix
    if raw_score < settings.ESCALATION_LOW_THRESHOLD:
        return EscalationRisk.low, raw_score
    if raw_score < settings.ESCALATION_HIGH_THRESHOLD:
        return EscalationRisk.medium, raw_score
    return EscalationRisk.high, raw_score
