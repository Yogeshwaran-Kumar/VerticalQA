"""
llm_service.py
──────────────
LLM-based conversation intelligence evaluation.

CRITICAL: The LLM evaluates ONLY intent, sentiment, toxicity, and agent_suggestion.
Escalation risk is computed deterministically by context_fuser.compute_escalation_risk().

Provider: OpenRouter → Claude Sonnet 4.5
Falls back to mock if OPENROUTER_API_KEY is not set.
"""

import asyncio
import json
import random
import re

import structlog

from app.core.config import settings
from app.models.schemas import (
    ComplianceFlag,
    FusedContext,
    Intent,
    LLMEvaluationResult,
    Sentiment,
)

logger = structlog.get_logger()

_USE_MOCK = not bool(settings.OPENROUTER_API_KEY)

if not _USE_MOCK:
    try:
        from openai import AsyncOpenAI
        _client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
        )
        logger.info("LLM client initialized", provider="openrouter", model=settings.LLM_MODEL)
    except Exception as e:
        logger.warning("LLM client init failed — mock mode", error=str(e))
        _USE_MOCK = True


_SYSTEM_PROMPT = """
You are a real-time Call Center Quality Auditor AI.

Analyze the conversation and acoustic summary.
Return ONLY valid JSON — no explanation, no markdown.

JSON Schema:
{
  "intent": one of [general_query, billing_query, technical_support, complaint_service,
                   complaint_product, refund_request, cancellation_request, account_closure,
                   supervisor_escalation_request, legal_or_regulatory_threat],
  "sentiment": one of [positive, neutral, negative],
  "toxicity_flag": boolean,
  "compliance_flags": array or null (ONLY if toxicity_flag is true,
                      values: abusive_language, fraud_accusation, legal_threat,
                      personal_information_breach, policy_violation, harassment),
  "agent_suggestion": string (max 20 words, actionable)
}

Rules:
- Base intent on CUSTOMER's primary goal
- Base sentiment on text + voice_emotion
- toxicity_flag = true ONLY for abusive language or explicit legal threats
- agent_suggestion must be concrete and immediately actionable
""".strip()


def _build_user_prompt(fused: FusedContext) -> str:
    conversation = fused.conversation_window
    summary = fused.acoustic_summary

    lines = [f"=== FULL CALL TRANSCRIPT ({len(conversation)} turns) ==="]
    for i, turn in enumerate(conversation, start=1):
        role = turn.get("role", "unknown").upper()
        text = turn.get("text", "")
        emotion = turn.get("voice_emotion", "neutral")
        lines.append(f"[{i}] [{role}] (voice_emotion: {emotion}): {text}")

    lines.append("")
    lines.append("=== CURRENT ACOUSTIC STATE ===")
    lines.append(f"Latest voice emotion: {summary.get('voice_emotion', 'neutral')}")
    lines.append(f"Vocal tension level:  {summary.get('vocal_tension', 'low')}")
    lines.append("")
    lines.append("Analyze the FULL call history to determine the customer's current intent.")

    return "\n".join(lines)


async def evaluate(fused: FusedContext) -> LLMEvaluationResult:
    if _USE_MOCK:
        return await _mock_evaluate(fused)
    return await _llm_evaluate(fused)


async def _llm_evaluate(fused: FusedContext) -> LLMEvaluationResult:
    user_prompt = _build_user_prompt(fused)

    for attempt in range(1, 4):
        try:
            response = await _client.chat.completions.create(
                model=settings.LLM_MODEL,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
            )

            raw = response.choices[0].message.content.strip()
            raw = re.sub(r"```(?:json)?", "", raw).strip().strip("`").strip()

            start = raw.find("{")
            end = raw.rfind("}")
            if start == -1 or end == -1:
                raise ValueError(f"No JSON in LLM response: {raw}")
            data = json.loads(raw[start : end + 1])

            return LLMEvaluationResult(
                intent=Intent(data["intent"]),
                sentiment=Sentiment(data["sentiment"]),
                toxicity_flag=bool(data["toxicity_flag"]),
                compliance_flags=[
                    ComplianceFlag(f) for f in (data.get("compliance_flags") or [])
                ] or None,
                agent_suggestion=data["agent_suggestion"],
            )

        except (json.JSONDecodeError, KeyError) as e:
            logger.error("LLM JSON error", error=str(e))
            return _safe_fallback()

        except Exception as e:
            err_str = str(e).lower()
            is_transient = any(
                kw in err_str for kw in ("connection", "timeout", "rate", "503", "502", "429")
            )
            if is_transient and attempt < 3:
                wait_s = 2 ** (attempt - 1)
                logger.warning("LLM transient error — retrying", attempt=attempt, wait_s=wait_s)
                await asyncio.sleep(wait_s)
                continue
            logger.error("LLM call failed", attempt=attempt, error=str(e))
            return _safe_fallback()

    return _safe_fallback()


def _safe_fallback() -> LLMEvaluationResult:
    return LLMEvaluationResult(
        intent=Intent.general_query,
        sentiment=Sentiment.neutral,
        toxicity_flag=False,
        compliance_flags=None,
        agent_suggestion="Continue the conversation calmly.",
    )


# ─── Mock ─────────────────────────────────────────────────────────────────────

_MOCK_SCENARIOS = [
    (Intent.billing_query, Sentiment.neutral, False, None,
     "Explain the billing cycle clearly.", "neutral"),
    (Intent.complaint_service, Sentiment.negative, False, None,
     "Acknowledge the issue and offer immediate resolution.", "sadness"),
    (Intent.refund_request, Sentiment.negative, False, None,
     "Initiate refund process and set timeline expectation.", "anger"),
    (Intent.cancellation_request, Sentiment.negative, False, None,
     "Offer retention incentive before processing cancellation.", "anger"),
    (Intent.legal_or_regulatory_threat, Sentiment.negative, True,
     [ComplianceFlag.legal_threat],
     "Stay calm. Escalate to supervisor immediately.", "anger"),
    (Intent.general_query, Sentiment.positive, False, None,
     "Answer the query and confirm customer satisfaction.", "happiness"),
    (Intent.technical_support, Sentiment.neutral, False, None,
     "Walk the customer through troubleshooting steps.", "neutral"),
    (Intent.supervisor_escalation_request, Sentiment.negative, False, None,
     "Acknowledge and transfer to supervisor now.", "fear"),
    (Intent.complaint_service, Sentiment.negative, True,
     [ComplianceFlag.abusive_language],
     "Do not match hostility. Warn once, then escalate.", "disgust"),
]


async def _mock_evaluate(fused: FusedContext) -> LLMEvaluationResult:
    await asyncio.sleep(random.uniform(0.06, 0.09))
    emotion = fused.acoustic_summary.get("voice_emotion", "neutral")
    matching = [s for s in _MOCK_SCENARIOS if s[5] == emotion]
    scenario = random.choice(matching if matching else _MOCK_SCENARIOS)
    intent, sentiment, toxicity, compliance, suggestion, _ = scenario
    return LLMEvaluationResult(
        intent=intent,
        sentiment=sentiment,
        toxicity_flag=toxicity,
        compliance_flags=compliance,
        agent_suggestion=suggestion,
    )
