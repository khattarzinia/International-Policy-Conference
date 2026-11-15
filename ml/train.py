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
from runtime import ANALYSIS_MAX_WINDOWS, window_indices


def low_false_positive_rank(domain_metrics):
    """Predeclared validation-only order; never use test results for selection."""
    if not domain_metrics or any(m["humanExamples"] == 0 or m["aiExamples"] == 0 for m in domain_metrics):
        raise ValueError("Selection domains need both human and AI validation examples")
    fprs = [m["falsePositiveRateAtHalf"] for m in domain_metrics]
    recalls = [m["truePositiveRateAtHalf"] for m in domain_metrics]
    aucs = [m["auroc"] for m in domain_metrics]
    return (int(all(fpr == 0 for fpr in fprs)), -max(fprs), -sum(fprs),
            min(recalls), sum(recalls) / len(recalls), sum(aucs) / len(aucs))


def load_training_records(directory, provenance, validation_only=False):
    validation_splits = provenance.get("validationSplits", [s for s in ["validation", "mun_validation"] if s in provenance["splits"]])
    if "validation" not in validation_splits or any(s != "validation" and not s.endswith("_validation") for s in validation_splits):
        raise ValueError("Validation split names must explicitly identify validation data")
    allowed = {"train", *validation_splits} if validation_only else set(provenance["splits"])
    records = {}
    for split in provenance["splits"]:
        if split not in allowed:
            continue
        path = directory / f"{split}.jsonl"
        if sha256(path) != provenance["splits"][split]["sha256"]:
            raise ValueError("Training data hash differs from provenance")
        records[split] = load_jsonl(path)
    return records, validation_splits


def predict_token_documents(model, tokenizer, token_documents, device, batch_size=32):
    """Training evaluation uses the same window budget/weighting as serving."""
    import numpy as np
    import torch

    model.eval()
    windows, owners, weights = [], [], []
    for owner, ids in enumerate(token_documents):
        covered = set()
        for start in window_indices(len(ids)):
            finish = min(start + 254, len(ids))
            novel = len(set(range(start, finish)) - covered)
            covered.update(range(start, finish))
            windows.append(ids[start:finish]); owners.append(owner); weights.append(novel)
    sums, counts = np.zeros(len(token_documents)), np.zeros(len(token_documents))
    with torch.inference_mode():
        for index in range(0, len(windows), batch_size):
            items = [tokenizer.prepare_for_model(window, add_special_tokens=True, return_attention_mask=True,
                                                truncation=False) for window in windows[index:index + batch_size]]
            batch = tokenizer.pad(items, padding=True, return_tensors="pt")
            values = model(**{k: v.to(device) for k, v in batch.items()}).logits.softmax(-1)[:, 1].cpu().tolist()
            for owner, weight, value in zip(owners[index:index + batch_size], weights[index:index + batch_size], values):
                sums[owner] += value * weight
                counts[owner] += weight
    return sums / np.maximum(counts, 1)


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
    parser.add_argument("--resume-from", type=Path, help="Continue from a local checkpoint; never overwrite that checkpoint")
    parser.add_argument("--domain-sampling-weight", type=int, default=1,
                        help="Training exposures per MUN record; distinct example counts stay unchanged")
    parser.add_argument("--human-loss-weight", type=float, default=1.0,
                        help="Relative human-class cross-entropy weight; chosen before test evaluation")
    parser.add_argument("--selection", choices=["auroc", "low-fpr"], default="auroc")
    parser.add_argument("--validation-only", action="store_true",
                        help="Do not load or score any test documents while choosing a candidate")
    args = parser.parse_args()
    if not 1 <= args.domain_sampling_weight <= 32:
        parser.error("Domain sampling weight must be between 1 and 32")
    if not math.isfinite(args.human_loss_weight) or not 1 <= args.human_loss_weight <= 10:
        parser.error("Human loss weight must be finite and between 1 and 10")
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
    records, validation_splits = load_training_records(args.data, provenance, args.validation_only)
    model_source = args.resume_from or args.base_model
    load_options = {"local_files_only": True} if args.resume_from else {"revision": args.base_revision}
    tokenizer = AutoTokenizer.from_pretrained(model_source, trust_remote_code=False, **load_options)
    model = AutoModelForSequenceClassification.from_pretrained(model_source, num_labels=2, id2label={0: "human", 1: "ai"}, label2id={"human": 0, "ai": 1}, trust_remote_code=False, use_safetensors=True, **load_options)
    model.to(device)
    if not all(parameter.requires_grad for parameter in model.parameters()):
        raise RuntimeError("All encoder and classifier parameters must be trainable")
    encoded = {}
    for split, values in records.items():
        encoded[split] = tokenizer([row["text"] for row in values], add_special_tokens=False, truncation=False)["input_ids"]
    initial_encoder = model.bert.encoder.layer[0].attention.self.query.weight.detach().cpu().clone()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=.01)
    class_weights = torch.tensor([args.human_loss_weight, 1.0], dtype=torch.float32, device=device)
    rng = random.Random(20261027)

    def batch_inputs(token_windows):
        items = [tokenizer.prepare_for_model(window, add_special_tokens=True, return_attention_mask=True, truncation=False) for window in token_windows]
        batch = tokenizer.pad(items, padding=True, return_tensors="pt")
        return {key: value.to(device) for key, value in batch.items()}

    def evaluate(split, return_scores=False):
        scores = predict_token_documents(model, tokenizer, encoded[split], device)
        result = metrics([row["label"] for row in records[split]], scores)
        return (result, scores.tolist()) if return_scores else result

    start_time = time.monotonic()
    history = []
    best = None
    best_score = None
    best_epoch = None
    steps = 0
    timed_out = False
    print(json.dumps({"training": True, "device": str(device), "parameters": sum(p.numel() for p in model.parameters()), "examples": len(records["train"])}), flush=True)
    for epoch in range(args.epochs):
        model.train()
        domain_indices = {label: [i for i, row in enumerate(records["train"])
                                  if row["domain"] == "mun_position_paper" and row["label"] == label]
                          for label in [0, 1]}
        order = [i for i, row in enumerate(records["train"]) if row["domain"] != "mun_position_paper"]
        if all(domain_indices.values()):
            exposures = max(map(len, domain_indices.values())) * args.domain_sampling_weight
            for indices in domain_indices.values():
                order.extend((indices * math.ceil(exposures / len(indices)))[:exposures])
        else:
            order.extend(i for indices in domain_indices.values() for i in indices)
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
            logits = model(**batch).logits
            loss = torch.nn.functional.cross_entropy(logits, labels, weight=class_weights)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            steps += 1
            losses.append(float(loss.detach().cpu()))
            if steps % 50 == 0:
                print(json.dumps({"epoch": epoch + 1, "step": steps, "meanLoss": sum(losses) / len(losses), "elapsedSeconds": round(time.monotonic() - start_time, 1)}), flush=True)
        validation = evaluate("validation")
        entry = {"epoch": epoch + 1, "trainingLoss": sum(losses) / max(1, len(losses)), "steps": steps, "validation": validation}
        validation_domains = {s: validation if s == "validation" else evaluate(s) for s in validation_splits}
        entry["validationDomains"] = validation_domains
        if "mun_validation" in validation_domains:
            entry["munValidation"] = validation_domains["mun_validation"]
        history.append(entry)
        print(json.dumps(entry), flush=True)
        selection = validation["auroc"] if validation["auroc"] is not None else -validation["brierScore"]
        aucs = [m["auroc"] for m in validation_domains.values() if m["auroc"] is not None]
        if aucs:
            selection = sum(aucs) / len(aucs)
        if args.selection == "low-fpr":
            selection = low_false_positive_rank(list(validation_domains.values()))
        if best_score is None or selection > best_score:
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
    for split in [name for name in records if name != "train"]:
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
                "domainValidation": ("Public corpus plus historical/synthetic MUN proxy evaluations; not validated on current IPC submissions"
                                     if provenance.get("munHistoricalExamples") else "Public research prose; not validated on IPC policy briefs"),
                "calibrated": False, "encoderUpdated": True, "encoderQueryWeightL2Delta": encoder_delta,
                "trainedParameters": sum(p.numel() for p in model.parameters()), "trainingExamples": len(records["train"]),
                "trainingSteps": steps, "completedEpochs": len(history), "selectedEpoch": best_epoch, "timeLimited": timed_out,
                "continuedFromCheckpointSha256": sha256(args.resume_from / "model.safetensors") if args.resume_from else None,
                "continuedFromModelVersion": json.loads((args.resume_from / "metadata.json").read_text())["modelVersion"] if args.resume_from else None,
                "domainSamplingWeight": args.domain_sampling_weight,
                "humanLossWeight": args.human_loss_weight,
                "validationOnly": args.validation_only,
                "domainSamplingPolicy": "Equal human/AI MUN exposures per epoch; repeated exposures are not counted as new examples",
                "evaluationMaxWindows": ANALYSIS_MAX_WINDOWS,
                "learningRate": args.learning_rate, "batchSize": args.batch_size, "maxTokensPerWindow": 256,
                "trainingSeconds": round(time.monotonic() - start_time, 2), "deviceUsed": str(device),
                "checkpointSelection": ("Validation only: zero empirical human false positives in all domains, then worst-domain FPR, summed FPR, worst-domain AI recall, mean recall, mean AUROC"
                                        if args.selection == "low-fpr" else "Mean public and MUN validation AUROC when MUN validation is available; otherwise public validation AUROC. Test sets untouched until final evaluation"),
                "selectionRank": best_score, "metrics": results,
                "dataProvenance": provenance, "history": history}
    metadata["checkpointSha256"] = sha256(args.output / "model.safetensors")
    (args.output / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    (args.output / "evaluation-predictions.json").write_text(json.dumps(predictions, indent=2) + "\n")
    (args.output / "MODEL_CARD.md").write_text("# IPC AI-text research prototype\n\nExperimental full BERT-Tiny encoder fine-tune on source-separated public research data: " + provenance["dataset"] + ".\n\nThe score is uncalibrated model confidence, not the fraction of AI-written words or proof of authorship. No automatic competition decisions are appropriate. The model has not been validated on IPC policy briefs, every current generator, non-native English subgroups, or adversarially edited/mixed documents. See metadata.json for real held-out metrics, row-level data provenance, and encoder-weight update evidence.\n")
    print(json.dumps({"savedModel": str(args.output), "modelVersion": version, "encoderL2Delta": encoder_delta, "metrics": results, "trainingSeconds": metadata["trainingSeconds"]}, indent=2), flush=True)


if __name__ == "__main__":
    main()
