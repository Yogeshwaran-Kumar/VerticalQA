"""
websocket.py
────────────
WebSocket route — the pipeline orchestrator.

Endpoint: /ws/{session_id}
Accepts: customer, agent, supervisor connections

Pipeline per audio_chunk:
  1. Validate → 2. Timer start → 3. ASR + SER (concurrent) →
  4. Update session → 5. Build context → 6. LLM eval →
  7. Compute escalation → 8. Conditional TTS → 9. Broadcast
"""

import asyncio
import base64
import json

import structlog
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.context_fuser import build_fused_context, compute_escalation_risk
from app.core.session_manager import SessionManager
from app.core.telemetry import PipelineTimer
from app.models.schemas import (
    AgentWhisperMessage,
    AudioChunkMessage,
    EscalationRisk,
    EvaluationBlock,
    MetricsBlock,
    SessionEndMessage,
    SessionStartMessage,
    UpdateMessage,
)
from app.services import acoustic_service, asr_service, llm_service, tts_service

logger = structlog.get_logger()


def build_ws_router(session_manager: SessionManager) -> APIRouter:
    router = APIRouter()

    @router.websocket("/ws/{session_id}")
    async def websocket_endpoint(websocket: WebSocket, session_id: str):
        await websocket.accept()
        await session_manager.add_subscriber(session_id, websocket)
        logger.info("WebSocket connected", session_id=session_id)

        try:
            while True:
                try:
                    raw = await websocket.receive_text()
                    data = json.loads(raw)
                except json.JSONDecodeError:
                    await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                    continue

                msg_type = data.get("type")

                if msg_type == "start":
                    try:
                        SessionStartMessage(**data)
                    except Exception as e:
                        await websocket.send_json({"type": "error", "message": str(e)})
                        continue
                    await session_manager.get_or_create(session_id)
                    await websocket.send_json({
                        "type": "ack",
                        "session_id": session_id,
                        "message": "Session started. Ready to receive audio chunks.",
                    })
                    logger.info("Session started", session_id=session_id)

                elif msg_type == "audio_chunk":
                    await _process_audio_chunk(data, session_id, websocket, session_manager)

                elif msg_type == "end":
                    try:
                        SessionEndMessage(**data)
                    except Exception:
                        pass
                    await asr_service.close_session(session_id)
                    await session_manager.close_session(session_id)
                    await websocket.send_json({"type": "session_closed", "session_id": session_id})
                    logger.info("Session ended", session_id=session_id)
                    break

                elif msg_type in ["webrtc_offer", "webrtc_answer", "webrtc_ice_candidate"]:
                    logger.info("WebRTC signaling", session_id=session_id, type=msg_type)
                    await session_manager.broadcast(session_id, data, exclude=websocket)

                else:
                    logger.warning("Unknown message type", session_id=session_id, type=msg_type)
                    await session_manager.broadcast(session_id, data, exclude=websocket)

        except WebSocketDisconnect:
            logger.info("WebSocket disconnected", session_id=session_id)
            await session_manager.remove_subscriber(session_id, websocket)
        except Exception as e:
            logger.error("WebSocket error", session_id=session_id, error=str(e))
            await session_manager.remove_subscriber(session_id, websocket)

    return router


async def _process_audio_chunk(
    data: dict,
    session_id: str,
    websocket: WebSocket,
    session_manager: SessionManager,
) -> None:
    """Core pipeline execution for a single audio chunk."""

    try:
        chunk = AudioChunkMessage(**data)
    except Exception as e:
        await websocket.send_json({"type": "error", "message": f"Invalid chunk: {e}"})
        return

    role = chunk.role.value

    if role == "agent":
        await session_manager.register_agent(session_id, websocket)

    timer = PipelineTimer()
    timer.start()

    try:
        audio_bytes = base64.b64decode(chunk.audio)
    except Exception:
        await websocket.send_json({"type": "error", "message": "Invalid base64 audio"})
        return

    # Concurrent ASR + SER
    try:
        asr_result, ser_result = await asyncio.gather(
            asr_service.stream_and_poll(chunk.audio, session_id, role),
            acoustic_service.analyze(audio_bytes, role),
            return_exceptions=False,
        )
    except Exception as e:
        logger.error("ASR/SER fork failed", error=str(e))
        await websocket.send_json({"type": "error", "message": "Processing failed"})
        return

    # Skip if no sentence ready yet
    if not asr_result.transcript_segment.strip():
        return

    await session_manager.append_turn(
        session_id=session_id,
        role=role,
        text=asr_result.transcript_segment,
        voice_emotion=ser_result.voice_emotion.value,
        emotion_urgency_score=ser_result.emotion_urgency_score,
    )
    session_manager.update_asr_confidence(session_id, asr_result.confidence)

    fused = build_fused_context(
        session_id=session_id,
        session_manager=session_manager,
        latest_voice_emotion=ser_result.voice_emotion.value,
        latest_vocal_tension=ser_result.vocal_tension.value,
    )

    llm_result = await llm_service.evaluate(fused)

    escalation_risk, escalation_score = compute_escalation_risk(
        intent=llm_result.intent.value,
        voice_emotion=ser_result.voice_emotion.value,
        toxicity_flag=llm_result.toxicity_flag,
        asr_confidence=asr_result.confidence,
    )

    # Conditional TTS whisper
    tts_audio = await tts_service.generate_whisper(
        suggestion=llm_result.agent_suggestion,
        escalation_risk=escalation_risk,
        toxicity_flag=llm_result.toxicity_flag,
    )

    if tts_audio:
        trigger_reason = "high_risk_and_toxicity"
        if escalation_risk == EscalationRisk.high and not llm_result.toxicity_flag:
            trigger_reason = "high_risk"
        elif llm_result.toxicity_flag and escalation_risk != EscalationRisk.high:
            trigger_reason = "toxicity"

        whisper = AgentWhisperMessage(
            session_id=session_id,
            trigger=trigger_reason,
            escalation_risk=escalation_risk,
            toxicity_flag=llm_result.toxicity_flag,
            agent_suggestion=llm_result.agent_suggestion,
            tts_audio=tts_audio,
        )
        await session_manager.send_to_agent(session_id, whisper.model_dump(mode="json"))

    raw_metrics = timer.finish(audio_b64=chunk.audio)
    metrics = MetricsBlock(
        total_latency_ms=raw_metrics["total_latency_ms"],
        throughput_kbps=raw_metrics["throughput_kbps"],
        asr_confidence=asr_result.confidence,
    )

    evaluation = EvaluationBlock(
        intent=llm_result.intent,
        sentiment=llm_result.sentiment,
        toxicity_flag=llm_result.toxicity_flag,
        compliance_flags=llm_result.compliance_flags,
        escalation_risk=escalation_risk,
        escalation_score=escalation_score,
        agent_suggestion=llm_result.agent_suggestion,
    )

    update = UpdateMessage(
        session_id=session_id,
        role=chunk.role,
        transcript=asr_result.transcript_segment,
        voice_emotion=ser_result.voice_emotion,
        vocal_tension=ser_result.vocal_tension,
        evaluation=evaluation,
        metrics=metrics,
    )

    payload = update.model_dump(mode="json", exclude_none=True)
    await session_manager.broadcast(session_id, payload)

    logger.info(
        "Chunk processed",
        session_id=session_id,
        role=role,
        intent=llm_result.intent.value,
        risk=escalation_risk.value,
        score=escalation_score,
        latency_ms=raw_metrics["total_latency_ms"],
    )
