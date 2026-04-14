"""
telemetry.py
────────────
Per-chunk pipeline latency and audio throughput tracking.
"""

import base64
import time
from dataclasses import dataclass, field


@dataclass
class PipelineTimer:
    """
    Tracks wall-clock time for a single audio chunk pipeline run.
    Instantiate fresh for every chunk — no shared state.
    """
    _start: float = field(default=0.0, init=False)

    def start(self) -> None:
        self._start = time.perf_counter()

    def finish(self, audio_b64: str) -> dict:
        """
        Returns total_latency_ms and throughput_kbps.
        Call immediately before broadcasting the result.
        """
        elapsed = time.perf_counter() - self._start
        total_ms = round(elapsed * 1000, 2)

        try:
            audio_bytes = len(base64.b64decode(audio_b64))
            throughput_kbps = round((audio_bytes * 8) / (max(elapsed, 0.001) * 1000), 2)
        except Exception:
            throughput_kbps = 0.0

        return {
            "total_latency_ms": total_ms,
            "throughput_kbps": throughput_kbps,
        }
