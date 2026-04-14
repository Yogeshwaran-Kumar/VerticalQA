"""
acoustic_service.py
────────────────────
SpeechBrain Speech Emotion Recognition (SER).

SpeechBrain runs PyTorch (CPU-bound). It runs in a ProcessPoolExecutor
to avoid blocking FastAPI's async event loop.

Falls back to weighted mock when the model is unavailable.
"""

import asyncio
import random
from concurrent.futures import ProcessPoolExecutor
from typing import Optional

import numpy as np
import structlog

from app.core.config import settings
from app.models.schemas import SERResult, VoiceEmotion, VocalTension

logger = structlog.get_logger()

_executor = ProcessPoolExecutor(max_workers=2)
_model = None
_USE_MOCK = True


async def preload_model() -> None:
    """Load ECAPA-TDNN model at startup to avoid per-request cold start."""
    global _model, _USE_MOCK
    try:
        from speechbrain.pretrained import EncoderClassifier  # type: ignore
        _model = EncoderClassifier.from_hparams(
            source=settings.SER_MODEL_SOURCE,
            savedir="models/speechbrain_ser",
            run_opts={"device": "cpu"},
        )
        _USE_MOCK = False
        logger.info("SpeechBrain SER model loaded", source=settings.SER_MODEL_SOURCE)
    except Exception as e:
        logger.warning("SpeechBrain unavailable — mock mode", error=str(e))
        _USE_MOCK = True


async def analyze(audio_bytes: bytes, role: str) -> SERResult:
    """Entry point — routes to real SpeechBrain or mock."""
    if _USE_MOCK:
        return await _mock_analyze(role)
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _sync_analyze, audio_bytes, role)


# ─── Real Analysis (runs in subprocess) ──────────────────────────────────────

def _sync_analyze(audio_bytes: bytes, role: str) -> SERResult:
    import librosa
    import torch

    sr = settings.ASR_SAMPLE_RATE

    try:
        audio = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    except Exception:
        return _fallback()

    if len(audio) < 100:
        return _fallback()

    # Pitch
    try:
        f0, voiced, _ = librosa.pyin(
            audio,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            sr=sr,
        )
        pitch_spike = float(np.nanmean(f0[voiced])) > 250.0 if voiced.any() else False
    except Exception:
        pitch_spike = False

    rms = float(np.sqrt(np.mean(audio ** 2)))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(audio)))

    # ECAPA-TDNN classification
    waveform = torch.tensor(audio).unsqueeze(0)
    with torch.no_grad():
        _, score, _, label = _model.classify_batch(waveform)

    emotion = _normalize_emotion(label[0].lower().strip())
    tension = _compute_tension(rms, zcr, pitch_spike)
    urgency = settings.EMOTION_URGENCY.get(emotion, 0.40)

    return SERResult(
        voice_emotion=VoiceEmotion(emotion),
        emotion_confidence=round(float(score[0].max()), 2),
        vocal_tension=tension,
        emotion_urgency_score=round(urgency, 2),
    )


def _normalize_emotion(raw: str) -> str:
    mapping = {
        "ang": "anger", "angry": "anger",
        "sad": "sadness", "sadness": "sadness",
        "neu": "neutral", "neutral": "neutral",
        "hap": "happiness", "happy": "happiness", "happiness": "happiness",
        "fea": "fear", "fear": "fear",
        "dis": "disgust", "disgust": "disgust",
        "exc": "happiness",
        "fru": "anger",
    }
    return mapping.get(raw, "neutral")


def _compute_tension(rms: float, zcr: float, pitch_spike: bool) -> VocalTension:
    score = sum([rms > 0.15, zcr > 0.15, pitch_spike])
    if score >= 2:
        return VocalTension.high
    if score == 1:
        return VocalTension.medium
    return VocalTension.low


def _fallback() -> SERResult:
    return SERResult(
        voice_emotion=VoiceEmotion.neutral,
        emotion_confidence=0.5,
        vocal_tension=VocalTension.low,
        emotion_urgency_score=0.4,
    )


# ─── Mock ─────────────────────────────────────────────────────────────────────

_CUSTOMER_POOL = [
    (VoiceEmotion.anger, 0.30), (VoiceEmotion.neutral, 0.30),
    (VoiceEmotion.sadness, 0.15), (VoiceEmotion.fear, 0.10),
    (VoiceEmotion.disgust, 0.10), (VoiceEmotion.happiness, 0.05),
]
_AGENT_POOL = [
    (VoiceEmotion.neutral, 0.70), (VoiceEmotion.happiness, 0.20),
    (VoiceEmotion.sadness, 0.05), (VoiceEmotion.fear, 0.03),
    (VoiceEmotion.disgust, 0.01), (VoiceEmotion.anger, 0.01),
]


async def _mock_analyze(role: str) -> SERResult:
    await asyncio.sleep(random.uniform(0.07, 0.09))
    pool = _CUSTOMER_POOL if role == "customer" else _AGENT_POOL
    emotions, weights = zip(*pool)
    emotion: VoiceEmotion = random.choices(emotions, weights=weights, k=1)[0]
    urgency = settings.EMOTION_URGENCY.get(emotion.value, 0.40)
    high_tension = {VoiceEmotion.anger, VoiceEmotion.fear, VoiceEmotion.disgust}
    tension = (
        VocalTension.high if emotion in high_tension and random.random() > 0.3
        else VocalTension.medium if emotion in high_tension
        else VocalTension.low
    )
    return SERResult(
        voice_emotion=emotion,
        emotion_confidence=round(random.uniform(0.72, 0.95), 2),
        vocal_tension=tension,
        emotion_urgency_score=round(urgency, 2),
    )
