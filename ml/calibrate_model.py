"""Fit confidence correction on validation only, then measure frozen test sets."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import time

from common import ROOT, load_jsonl, metrics, sha256
from runtime import Detector


def fit_validation_adjustment(labels, scores):
    import torch

    y = torch.tensor(labels, dtype=torch.float64)
    probabilities = torch.tensor(scores, dtype=torch.float64).clamp(1e-6, 1 - 1e-6)
    logits = torch.logit(probabilities)
    log_scale = torch.tensor(0.0, dtype=torch.float64, requires_grad=True)
    intercept = torch.tensor(0.0, dtype=torch.float64, requires_grad=True)
    optimizer = torch.optim.LBFGS([log_scale, intercept], max_iter=100, line_search_fn="strong_wolfe")
    def objective():
        optimizer.zero_grad()
        corrected = log_scale.exp() * logits + intercept
        loss = torch.nn.functional.binary_cross_entropy_with_logits(corrected, y) + .001 * (log_scale ** 2 + intercept ** 2)
        loss.backward()
        return loss
    optimizer.step(objective)
    scale = float(log_scale.detach().exp())
    bias = float(intercept.detach())
    return {"method": "positive_scale_logit_intercept", "scale": scale, "intercept": bias,
            "fittedExamples": len(labels), "scope": "Frozen public validation distribution only; not IPC authorship probability",
            "regularization": .001}


def adjust(score, calibration):
    import math

    value = min(1 - 1e-6, max(1e-6, score))
    logit = calibration["scale"] * math.log(value / (1 - value)) + calibration["intercept"]
    return 1 / (1 + math.exp(-max(-50, min(50, logit))))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, default=ROOT / ".local/ml-model-v2")
    parser.add_argument("--data", type=Path, default=ROOT / ".local/ml-data-v2")
    parser.add_argument("--enable", action="store_true", help="Enable this optional confidence correction in the runtime; default retains the raw model")
    args = parser.parse_args()
    metadata = json.loads((args.model / "metadata.json").read_text())
    if metadata.get("validationCalibration"):
        raise ValueError("This candidate already has frozen calibration; do not refit it after test inspection")
    detector = Detector(args.model)
    validation = load_jsonl(args.data / "validation.jsonl")
    if sha256(args.data / "validation.jsonl") != metadata["dataProvenance"]["splits"]["validation"]["sha256"]:
        raise ValueError("Validation documents changed")
    validation_scores = [detector.predict(row["text"], max_windows=8)["score"] for row in validation]
    calibration = fit_validation_adjustment([row["label"] for row in validation], validation_scores)
    calibration["validationSha256"] = sha256(args.data / "validation.jsonl")
    calibration["fittedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    calibration["checkpointSha256"] = sha256(args.model / "model.safetensors")
    # Freeze fitted parameters before calculating any new test predictions.
    frozen_calibration = args.model / "validation-calibration.json"
    frozen_calibration.write_text(json.dumps(calibration, indent=2) + "\n")
    print(json.dumps({"validationOnlyCalibrationFrozen": calibration}), flush=True)
    raw_metrics, adjusted_metrics, predictions = {}, {}, {}
    for split in ["validation", "test", "heldout_generator"]:
        rows = validation if split == "validation" else load_jsonl(args.data / f"{split}.jsonl")
        if sha256(args.data / f"{split}.jsonl") != metadata["dataProvenance"]["splits"][split]["sha256"]:
            raise ValueError("Frozen evaluation documents changed")
        raw_scores = validation_scores if split == "validation" else [detector.predict(row["text"], max_windows=8)["score"] for row in rows]
        adjusted = [adjust(score, calibration) for score in raw_scores]
        labels = [row["label"] for row in rows]
        raw_metrics[split] = metrics(labels, raw_scores)
        adjusted_metrics[split] = metrics(labels, adjusted)
        predictions[split] = [{"record_id": row["record_id"], "source_id": row["source_id"], "generator": row["model"], "domain": row["domain"], "label": row["label"], "raw_score": raw, "validation_adjusted_score": score, "score": score if args.enable else raw} for row, raw, score in zip(rows, raw_scores, adjusted)]
    metadata["rawMetrics"] = raw_metrics
    metadata["validationAdjustedMetrics"] = adjusted_metrics
    metadata["metrics"] = adjusted_metrics if args.enable else raw_metrics
    metadata["validationCalibration"] = calibration
    metadata["validationCalibrationEnabled"] = args.enable
    metadata["scoreVariant"] = "public_validation_adjusted" if args.enable else "raw"
    if args.enable:
        metadata["rawModelVersion"] = metadata["modelVersion"]
        metadata["modelVersion"] = metadata["modelVersion"] + "-validation-adjusted"
    metadata["calibrationSha256"] = sha256(frozen_calibration)
    metadata["calibrated"] = False  # Never imply calibration on the actual IPC population.
    metadata["scoreAdjustment"] = "Validation-fitted confidence correction; still experimental, not an IPC authorship probability" if args.enable else "none; validation-fitted correction retained as an optional experimental variant"
    metadata["selectedEpoch"] = max(metadata["history"], key=lambda item: item["validation"]["auroc"])["epoch"]
    (args.model / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    (args.model / "evaluation-predictions.json").write_text(json.dumps(predictions, indent=2) + "\n")
    print(json.dumps({"rawMetrics": raw_metrics, "validationAdjustedMetrics": adjusted_metrics}, indent=2), flush=True)


if __name__ == "__main__":
    main()
