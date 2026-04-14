"""
config.py
─────────
Single source of truth for all constants, weights, and thresholds.
Every tunable value lives here — nothing is hardcoded inline.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Dict, List


class Settings(BaseSettings):

    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME: str = "Vertical QA"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── API Keys ──────────────────────────────────────────────────────────────
    SONIAX_API_KEY: str = Field(default="", env="SONIAX_API_KEY")
    OPENROUTER_API_KEY: str = Field(default="", env="OPENROUTER_API_KEY")

    # ── LLM ───────────────────────────────────────────────────────────────────
    OPENROUTER_BASE_URL: str = Field(
        default="https://openrouter.ai/api/v1", env="OPENROUTER_BASE_URL"
    )
    LLM_MODEL: str = "anthropic/claude-sonnet-4-5"
    LLM_TEMPERATURE: float = 0.0        # Deterministic — critical for JSON output
    LLM_MAX_TOKENS: int = 512

    # ── ASR ───────────────────────────────────────────────────────────────────
    ASR_SAMPLE_RATE: int = 16000
    ASR_LANGUAGE: str = "en"
    ASR_CONFIDENCE_GATE: float = 0.40   # Below this → dampen escalation by 30%
    ASR_DAMPEN_FACTOR: float = 0.70

    # ── SpeechBrain SER ───────────────────────────────────────────────────────
    SER_MODEL_SOURCE: str = "speechbrain/emotion-recognition-wav2vec2-IEMOCAP"
    SER_CHUNK_DURATION_S: float = 2.0
    SER_CUSTOMER_SKEW: float = 0.80     # Weight customer acoustics vs agent

    # ── Context Fuser ─────────────────────────────────────────────────────────
    WINDOW_SIZE: int = 10               # Rolling turns kept for acoustic state
    ACOUSTIC_WEIGHT_DECAY: float = 0.85
    SILENCE_THRESHOLD_MS: int = 3000
    INTERRUPTION_OVERLAP_MS: int = 500

    # ── Escalation Algorithm ──────────────────────────────────────────────────
    INTENT_WEIGHT: float = 0.65
    SEMANTIC_WEIGHT: float = 0.35
    ESCALATION_LOW_THRESHOLD: float = 0.50
    ESCALATION_HIGH_THRESHOLD: float = 0.75

    # ── Intent → Severity Mapping ─────────────────────────────────────────────
    INTENT_SEVERITY: Dict[str, float] = {
        "general_query": 0.10,
        "billing_query": 0.30,
        "technical_support": 0.40,
        "complaint_service": 0.55,
        "complaint_product": 0.55,
        "refund_request": 0.65,
        "cancellation_request": 0.85,
        "account_closure": 0.90,
        "supervisor_escalation_request": 1.00,
        "legal_or_regulatory_threat": 1.00,
    }

    # ── Emotion → Urgency Mapping ─────────────────────────────────────────────
    EMOTION_URGENCY: Dict[str, float] = {
        "happiness": 0.00,
        "neutral": 0.40,
        "sadness": 0.50,
        "fear": 0.65,
        "disgust": 0.75,
        "anger": 1.00,
    }

    # ── Override Intents (always → High risk) ─────────────────────────────────
    OVERRIDE_INTENTS: List[str] = [
        "supervisor_escalation_request",
        "legal_or_regulatory_threat",
    ]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
