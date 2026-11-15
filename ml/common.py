"""Shared local paths and lightweight evaluation for the IPC research model."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault("HF_HOME", str(ROOT / ".local/ml-cache"))
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")


def load_jsonl(path):
    with open(path, encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def metrics(labels, scores):
    """Document-level metrics. AI is1. Ties count half in AUROC."""
    import numpy as np

    y = np.asarray(labels, dtype=int)
    s = np.asarray(scores, dtype=float)
    if not len(y) or not np.isfinite(s).all():
        raise ValueError("Evaluation requires finite predictions and labeled examples")
    ai = s[y == 1]
    human = s[y == 0]
    pred = s >= 0.5
    tp = int(((y == 1) & pred).sum())
    fp = int(((y == 0) & pred).sum())
    fn = int(((y == 1) & ~pred).sum())
    tn = int(((y == 0) & ~pred).sum())
    # Bounded corpora make direct pairwise AUROC simple and easy to audit.
    auc = float(((ai[:, None] > human).mean() + .5 * (ai[:, None] == human).mean())) if len(ai) and len(human) else None
    return {"examples": len(y), "humanExamples": len(human), "aiExamples": len(ai),
            "accuracy": float((pred == y).mean()), "auroc": auc,
            "falsePositiveRateAtHalf": fp / max(1, fp + tn),
            "truePositiveRateAtHalf": tp / max(1, tp + fn),
            "brierScore": float(((s - y) ** 2).mean()),
            "confusionAtHalf": {"truePositive": tp, "falsePositive": fp, "falseNegative": fn, "trueNegative": tn}}
