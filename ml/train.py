"""Full tiny-encoder fine-tune with source-separated document evaluation."""
from __future__ import annotations

import argparse
import copy
import json
import math
from pathlib import Path
import random
import time

from common import ROOT, load_jsonl, metrics, sha256
from runtime import window_indices


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=ROOT / ".local/ml-data")
    parser.add_argument("--output", type=Path, default=ROOT / ".local/ml-model")
    parser.add_argument("--base-model", default="google/bert_uncased_L-2_H-128_A-2")
    parser.add_argument("--base-revision", default="30b0a37ccaaa32f332884b96992754e246e48c5f")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    parser.add_argument("--seconds", type=int, default=540)
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "mps"])
    parser.add_argument("--model-version-prefix", default="ipc-bert-tiny-public")
    args = parser.parse_args()
    if (args.output / "model.safetensors").exists():
        parser.error("Refusing to overwrite an existing checkpoint; choose a fresh --output directory")
    import numpy as np
    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    random.seed(20261027)
    np.random.seed(20261027)
    torch.manual_seed(20261027)
    torch.set_num_threads(4)
    device = torch.device("mps" if args.device == "auto" and torch.backends.mps.is_available() else "cpu" if args.device == "auto" else args.device)
    provenance = json.loads((args.data / "provenance.json").read_text())
    records = {split: load_jsonl(args.data / f"{split}.jsonl") for split in provenance["splits"]}
    for split, values in records.items():
        if sha256(args.data / f"{split}.jsonl") != provenance["splits"][split]["sha256"]:
            raise ValueError("Training data hash differs from provenance")
    tokenizer = AutoTokenizer.from_pretrained(args.base_model, revision=args.base_revision, trust_remote_code=False)
    model = AutoModelForSequenceClassification.from_pretrained(args.base_model, revision=args.base_revision, num_labels=2, id2label={0: "human", 1: "ai"}, label2id={"human": 0, "ai": 1}, trust_remote_code=False, use_safetensors=True)
    model.to(device)
    if not all(parameter.requires_grad for parameter in model.parameters()):
        raise RuntimeError("All encoder and classifier parameters must be trainable")
    encoded = {}
    for split, values in records.items():
        encoded[split] = tokenizer([row["text"] for row in values], add_special_tokens=False, truncation=False)["input_ids"]
    initial_encoder = model.bert.encoder.layer[0].attention.self.query.weight.detach().cpu().clone()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=.01)
    rng = random.Random(20261027)

    def batch_inputs(token_windows):
        items = [tokenizer.prepare_for_model(window, add_special_tokens=True, return_attention_mask=True, truncation=False) for window in token_windows]
        batch = tokenizer.pad(items, padding=True, return_tensors="pt")
        return {key: value.to(device) for key, value in batch.items()}

    def evaluate(split, return_scores=False):
        model.eval()
        windows, owners, weights = [], [], []
        for index, ids in enumerate(encoded[split]):
            covered = set()
            for start in window_indices(len(ids), max_windows=8):
                finish = min(start + 254, len(ids))
                novel = len(set(range(start, finish)) - covered)
                covered.update(range(start, finish))
                windows.append(ids[start:finish])
                owners.append(index)
                weights.append(novel)
        sums, counts = np.zeros(len(encoded[split])), np.zeros(len(encoded[split]))
        with torch.inference_mode():
            for index in range(0, len(windows), 32):
                values = model(**batch_inputs(windows[index:index + 32])).logits.softmax(-1)[:, 1].cpu().tolist()
                for owner, weight, value in zip(owners[index:index + 32], weights[index:index + 32], values):
                    sums[owner] += value * weight
                    counts[owner] += weight
        scores = sums / np.maximum(counts, 1)
        result = metrics([row["label"] for row in records[split]], scores)
        return (result, scores.tolist()) if return_scores else result

    start_time = time.monotonic()
    history = []
    best = None
    best_score = -math.inf
    best_epoch = None
    steps = 0
    timed_out = False
    print(json.dumps({"training": True, "device": str(device), "parameters": sum(p.numel() for p in model.parameters()), "examples": len(records["train"])}), flush=True)
    for epoch in range(args.epochs):
        model.train()
        order = list(range(len(records["train"])))
        rng.shuffle(order)
        losses = []
        for offset in range(0, len(order), args.batch_size):
            if time.monotonic() - start_time > args.seconds:
                timed_out = True
                break
            selected = order[offset:offset + args.batch_size]
            token_windows = []
            for index in selected:
                ids = encoded["train"][index]
                window_start = rng.randint(0, max(0, len(ids) - 254))
                token_windows.append(ids[window_start:window_start + 254])
            batch = batch_inputs(token_windows)
            labels = torch.tensor([records["train"][i]["label"] for i in selected], dtype=torch.long, device=device)
            optimizer.zero_grad(set_to_none=True)
            loss = model(**batch, labels=labels).loss
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            steps += 1
            losses.append(float(loss.detach().cpu()))
            if steps % 50 == 0:
                print(json.dumps({"epoch": epoch + 1, "step": steps, "meanLoss": sum(losses) / len(losses), "elapsedSeconds": round(time.monotonic() - start_time, 1)}), flush=True)
        validation = evaluate("validation")
        entry = {"epoch": epoch + 1, "trainingLoss": sum(losses) / max(1, len(losses)), "steps": steps, "validation": validation}
        history.append(entry)
        print(json.dumps(entry), flush=True)
        selection = validation["auroc"] if validation["auroc"] is not None else -validation["brierScore"]
        if selection > best_score:
            best_score = selection
            best_epoch = epoch + 1
            best = {key: value.detach().cpu().clone() for key, value in model.state_dict().items()}
        if timed_out:
            break
    if best is None or steps < 20:
        raise RuntimeError("Training did not finish enough updates to create a usable prototype")
    model.load_state_dict(best)
    encoder_delta = float((model.bert.encoder.layer[0].attention.self.query.weight.detach().cpu() - initial_encoder).norm())
    if encoder_delta <= 1e-8:
        raise RuntimeError("Encoder weights did not change; refusing to claim fine-tuning")
    results = {}
    predictions = {}
    for split in ["validation", "test", "heldout_generator"]:
        result, scores = evaluate(split, return_scores=True)
        results[split] = result
        predictions[split] = [{"record_id": row["record_id"], "source_id": row["source_id"], "generator": row["model"], "domain": row["domain"], "label": row["label"], "score": score} for row, score in zip(records[split], scores)]
    args.output.mkdir(parents=True, exist_ok=True)
    model.to("cpu").save_pretrained(args.output, safe_serialization=True)
    tokenizer.save_pretrained(args.output)
    version = args.model_version_prefix + "-" + time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    metadata = {"status": "trained", "modelVersion": version, "baseModel": args.base_model, "baseModelRevision": args.base_revision,
                "baseModelLicense": "Apache-2.0", "experimental": True, "scoreType": "model_confidence",
                "scoreVariant": "raw", "validationCalibrationEnabled": False,
                "domainValidation": "Public research prose; not validated on IPC policy briefs",
                "calibrated": False, "encoderUpdated": True, "encoderQueryWeightL2Delta": encoder_delta,
                "trainedParameters": sum(p.numel() for p in model.parameters()), "trainingExamples": len(records["train"]),
                "trainingSteps": steps, "completedEpochs": len(history), "selectedEpoch": best_epoch, "timeLimited": timed_out,
                "learningRate": args.learning_rate, "batchSize": args.batch_size, "maxTokensPerWindow": 256,
                "trainingSeconds": round(time.monotonic() - start_time, 2), "deviceUsed": str(device),
                "checkpointSelection": "Best validation AUROC; test sets untouched until final evaluation", "metrics": results,
                "dataProvenance": provenance, "history": history}
    metadata["checkpointSha256"] = sha256(args.output / "model.safetensors")
    (args.output / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    (args.output / "evaluation-predictions.json").write_text(json.dumps(predictions, indent=2) + "\n")
    (args.output / "MODEL_CARD.md").write_text("# IPC AI-text research prototype\n\nExperimental full BERT-Tiny encoder fine-tune on source-separated public research data: " + provenance["dataset"] + ".\n\nThe score is uncalibrated model confidence, not the fraction of AI-written words or proof of authorship. No automatic competition decisions are appropriate. The model has not been validated on IPC policy briefs, every current generator, non-native English subgroups, or adversarially edited/mixed documents. See metadata.json for real held-out metrics, row-level data provenance, and encoder-weight update evidence.\n")
    print(json.dumps({"savedModel": str(args.output), "modelVersion": version, "encoderL2Delta": encoder_delta, "metrics": results, "trainingSeconds": metadata["trainingSeconds"]}, indent=2), flush=True)


if __name__ == "__main__":
    main()
