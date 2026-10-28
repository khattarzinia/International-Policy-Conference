"""Actual checkpoint inference; never substitutes a heuristic for absent weights."""
from __future__ import annotations

import json
import math
from pathlib import Path
import threading

from common import ROOT  # Set local caches before importing model libraries.


def utf16_length(text):
    return len(text.encode("utf-16-le")) // 2


def window_indices(token_count, size=254, overlap=64, max_windows=32):
    if max_windows < 1:
        raise ValueError("At least one analysis window is required")
    if token_count <= size:
        return [0]
    starts = list(range(0, token_count - size + 1, size - overlap))
    if starts[-1] + size < token_count:
        starts.append(token_count - size)
    if len(starts) <= max_windows:
        return starts
    if max_windows == 1:
        return [starts[len(starts) // 2]]
    # Cover the document uniformly; report sampled coverage, never silent truncation.
    return sorted({starts[round(i * (len(starts) - 1) / (max_windows - 1))] for i in range(max_windows)})


class Detector:
    def __init__(self, model_dir, device="cpu"):
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        self.path = Path(model_dir)
        self.metadata = json.loads((self.path / "metadata.json").read_text())
        if self.metadata.get("status") != "trained" or not self.metadata.get("encoderUpdated"):
            raise ValueError("A completed, verified encoder fine-tune is required")
        self.tokenizer = AutoTokenizer.from_pretrained(self.path, local_files_only=True, trust_remote_code=False)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.path, local_files_only=True, trust_remote_code=False, use_safetensors=True)
        self.device = torch.device(device)
        torch.set_num_threads(4)
        self.model.to(self.device).eval()
        self.lock = threading.Lock()

    def predict(self, document, max_windows=32):
        import torch

        if not isinstance(document, str) or len(document.strip()) < 300:
            raise ValueError("At least300 readable characters are required")
        if utf16_length(document) > 150000:
            raise ValueError("The document exceeds150,000 characters")
        encoded = self.tokenizer(document, add_special_tokens=False, return_offsets_mapping=True, truncation=False)
        ids, offsets = encoded["input_ids"], encoded["offset_mapping"]
        if not ids:
            raise ValueError("No readable text was found")
        starts = window_indices(len(ids), max_windows=max_windows)
        windows = []
        for start in starts:
            piece = ids[start:start + 254]
            windows.append(self.tokenizer.prepare_for_model(piece, add_special_tokens=True, return_attention_mask=True, truncation=False))
        probabilities = []
        with self.lock, torch.inference_mode():
            for index in range(0, len(windows), 8):
                batch = self.tokenizer.pad(windows[index:index + 8], padding=True, return_tensors="pt")
                logits = self.model(**{key: value.to(self.device) for key, value in batch.items()}).logits
                probabilities.extend(logits.softmax(-1)[:, 1].cpu().tolist())
        segments = []
        covered = set()
        weighted = []
        for start, probability in zip(starts, probabilities):
            finish = min(start + 254, len(ids))
            novel = len(set(range(start, finish)) - covered)
            covered.update(range(start, finish))
            weighted.append((probability, novel))
            segments.append({"start": offsets[start][0], "end": offsets[finish - 1][1], "score": round(probability, 6)})
        denominator = sum(weight for _, weight in weighted)
        raw_score = sum(value * weight for value, weight in weighted) / max(denominator, 1)
        score = raw_score
        calibration = self.metadata.get("validationCalibration") if self.metadata.get("validationCalibrationEnabled", False) else None
        if calibration:
            value = min(1 - 1e-6, max(1e-6, raw_score))
            logit = calibration["scale"] * math.log(value / (1 - value)) + calibration["intercept"]
            score = 1 / (1 + math.exp(-max(-50, min(50, logit))))
        char_ranges = sorted((item["start"], item["end"]) for item in segments)
        analyzed = 0
        previous = -1
        for start, end in char_ranges:
            analyzed += utf16_length(document[max(start, previous):end]) if end > max(start, previous) else 0
            previous = max(end, previous)
        # Node and browser strings count UTF-16 code units, including astral emoji.
        for item in segments:
            item["start"] = utf16_length(document[:item["start"]])
            item["end"] = utf16_length(document[:item["end"]])
        complete = len(covered) == len(ids)
        return {"score": round(float(score), 6), "rawScore": round(float(raw_score), 6), "modelVersion": self.metadata["modelVersion"],
                "experimental": True, "scoreType": "model_confidence", "label": "ai" if score >= .5 else "human",
                "segments": segments, "analyzedCharacters": analyzed, "totalCharacters": utf16_length(document),
                "analyzedTokens": len(covered), "totalTokens": len(ids), "coverageComplete": complete,
                "scoreAdjustment": "public_validation_logit_correction" if calibration else "none",
                "segmentScoreType": "raw_window_model_confidence",
                "message": "Experimental model confidence, not a calibrated authorship probability or percentage of AI-written words. Trained on public research text, not validated on IPC policy briefs. " +
                           ("All token windows were analyzed." if complete else "Long-document analysis sampled windows across the document; coverage counts are provided.")}
