"""짧게 내려가는 동전 잔향을 외부 샘플 없이 합성한다."""

import math
from pathlib import Path
import random
import struct
import wave

SAMPLE_RATE = 44_100
DURATION = 0.34
PEAK = 0.55
output = Path(__file__).resolve().parents[1] / "public/assets/coin-tower/game-over.wav"
rng = random.Random(20261019)
samples = []
phase = 0.0
for index in range(round(SAMPLE_RATE * DURATION)):
    time = index / SAMPLE_RATE
    phase += 2 * math.pi * (150 + 600 * math.exp(-time / 0.12)) / SAMPLE_RATE
    attack = min(1, time / 0.006)
    fade = min(1, (DURATION - time) / 0.015)
    ring = (0.55 * math.sin(phase) + 0.12 * math.sin(2.05 * phase)
            + 0.07 * math.sin(3.14 * phase)) * math.exp(-time * 12)
    contact = 0.12 * math.sin(2 * math.pi * 90 * time) * math.exp(-time * 32)
    air = 0.025 * rng.uniform(-1, 1) * math.exp(-time * 60)
    samples.append((ring + contact + air) * attack * fade)
scale = PEAK / max(abs(value) for value in samples)
with wave.open(str(output), "wb") as sound:
    sound.setparams((1, 2, SAMPLE_RATE, 0, "NONE", "not compressed"))
    sound.writeframes(b"".join(struct.pack("<h", round(value * scale * 32767))
                             for value in samples))
print(f"{output.name}: {DURATION}s, {SAMPLE_RATE}Hz mono PCM16, {output.stat().st_size} bytes")
