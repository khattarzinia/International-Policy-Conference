"""Expand public training data while freezing v1 evaluation bytes and source groups."""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import random
import shutil
import time

from common import ROOT, load_jsonl, sha256
from download_data import FILES, REVISION

EVAL_SPLITS = ("validation", "test", "heldout_generator")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline-data", type=Path, default=ROOT / ".local/ml-data")
    parser.add_argument("--output", type=Path, default=ROOT / ".local/ml-data-v2")
    parser.add_argument("--baseline-model", type=Path, default=ROOT / ".local/ml-model")
    parser.add_argument("--backup-model", type=Path, default=ROOT / ".local/ml-model-v1")
    parser.add_argument("--source-class-cap", type=int, default=4)
    parser.add_argument("--per-class", type=int, default=12000)
    args = parser.parse_args()
    if args.source_class_cap < 1 or args.per_class < 250:
        raise ValueError("Use a positive source cap and enough examples")
    if args.output.resolve() == args.baseline_data.resolve():
        raise ValueError("The expanded data directory must differ from the baseline")
    import pyarrow.parquet as pq

    old = json.loads((args.baseline_data / "provenance.json").read_text())
    if old["datasetRevision"] != REVISION:
        raise ValueError("Baseline data revision differs from the pinned public corpus")
    raw_path = args.baseline_data / "train-00000-of-00001.parquet"
    if sha256(raw_path) != FILES["train"]:
        raise ValueError("Public training Parquet hash differs from the pinned corpus")
    if not args.backup_model.exists():
        shutil.copytree(args.baseline_model, args.backup_model)
    if sha256(args.backup_model / "model.safetensors") != sha256(args.baseline_model / "model.safetensors"):
        raise ValueError("An existing v1 backup has different model weights; refusing to overwrite it")
    args.output.mkdir(parents=True, exist_ok=True)
    frozen = {}
    for split in EVAL_SPLITS:
        source = args.baseline_data / f"{split}.jsonl"
        digest = sha256(source)
        if digest != old["splits"][split]["sha256"]:
            raise ValueError("The original evaluation bytes changed; do not expand against a moving test set")
        destination = args.output / source.name
        shutil.copyfile(source, destination)
        if sha256(destination) != digest:
            raise ValueError("Evaluation freeze copy failed")
        frozen[split] = load_jsonl(destination)
    protected_sources = {row["source_id"] for rows in frozen.values() for row in rows}
    protected_hashes = {row["text_sha256"] for rows in frozen.values() for row in rows}
    heldout = old["heldoutGenerator"]
    eligible = []
    exclusions = Counter()
    seen = set()
    raw = pq.read_table(raw_path).to_pylist()
    for row in raw:
        text = row["text"].strip()
        digest = hashlib.sha256(" ".join(text.lower().split()).encode()).hexdigest()
        if row["public_hub_eligible"] is not True or len(text) < 300 or len(text) > 60000:
            exclusions["ineligibleText"] += 1
            continue
        if digest in seen:
            exclusions["normalizedDuplicate"] += 1
            continue
        seen.add(digest)
        if row["group_id"] in protected_sources or digest in protected_hashes:
            exclusions["frozenEvaluationSourceOrText"] += 1
            continue
        if row["generator_model"] == heldout:
            exclusions["heldoutGenerator"] += 1
            continue
        eligible.append({"text": text, "label": int(row["label"]), "source_id": row["group_id"],
                         "record_id": str(row["id"]), "model": row["generator_model"] or "human",
                         "domain": row["source_collection"], "text_sha256": digest, "split": "train",
                         "source_document_id": row["source_document_id"], "source_name": row["source_name"],
                         "source_url": row["source_url"], "source_license": row["source_license"],
                         "source_license_url": row["source_license_url"], "source_authors": row["source_authors"],
                         "attribution_name": row["attribution_name"], "attribution_url": row["attribution_url"],
                         "sample_type": row["sample_type"], "seed_sample_id": row["seed_sample_id"]})
    # Same deterministic order as v1; raising the cap retains its original examples.
    rng = random.Random(20261027)
    rng.shuffle(eligible)
    groups = Counter()
    by_label = {0: [], 1: []}
    for row in eligible:
        key = (row["source_id"], row["label"])
        if groups[key] >= args.source_class_cap:
            continue
        groups[key] += 1
        by_label[row["label"]].append(row)
    count = min(len(by_label[0]), len(by_label[1]), args.per_class)
    training = by_label[0][:count] + by_label[1][:count]
    rng.shuffle(training)
    baseline_training = load_jsonl(args.baseline_data / "train.jsonl")
    selected_ids = {row["record_id"] for row in training}
    missing_baseline = {row["record_id"] for row in baseline_training} - selected_ids
    if missing_baseline:
        raise ValueError("Expanded selection lost baseline training examples; investigate sampling order")
    if {row["source_id"] for row in training} & protected_sources or {row["text_sha256"] for row in training} & protected_hashes:
        raise ValueError("Training leaked a frozen evaluation source or text")
    if any(row["model"] == heldout for row in training):
        raise ValueError("Held-out generator leaked into training")
    (args.output / "train.jsonl").write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in training))
    splits = {"train": training, **frozen}
    provenance = {
        **old,
        "preparedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "datasetRevision": REVISION,
        "splitRule": "Expanded original training partition only; v1 validation/test/generator-holdout JSONL are byte-identical; source IDs and normalized text hashes excluded; held-out generator excluded",
        "baselineTrainingExamples": len(baseline_training), "retainedBaselineTrainingExamples": len(baseline_training),
        "sourceClassCap": args.source_class_cap, "eligibleCountsBeforeCap": dict(Counter(row["label"] for row in eligible)),
        "availableCountsAfterCap": {label: len(values) for label, values in by_label.items()},
        "trainingExpansionFactor": len(training) / len(baseline_training),
        "dataExclusions": dict(exclusions),
        "baselineModelVersion": json.loads((args.backup_model / "metadata.json").read_text())["modelVersion"],
        "baselineCheckpointSha256": sha256(args.backup_model / "model.safetensors"),
        "trainGenerators": sorted({row["model"] for row in training if row["label"] == 1}),
        "sourceLicenses": sorted({row["source_license"] for rows in splits.values() for row in rows}),
        "splits": {name: {"examples": len(rows), "sourceGroups": len({row["source_id"] for row in rows}),
                          "human": sum(row["label"] == 0 for row in rows), "ai": sum(row["label"] == 1 for row in rows),
                          "models": sorted({row["model"] for row in rows}), "domains": dict(Counter(row["domain"] for row in rows)),
                          "sha256": sha256(args.output / f"{name}.jsonl")} for name, rows in splits.items()},
    }
    (args.output / "provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
    print(json.dumps({"trainingExamples": len(training), "sourceGroups": provenance["splits"]["train"]["sourceGroups"],
                      "classBalance": {"human": count, "ai": count}, "expansionFactor": provenance["trainingExpansionFactor"],
                      "sourceClassCap": args.source_class_cap, "baselineExamplesRetained": len(baseline_training),
                      "heldoutGenerator": heldout, "frozenEvalHashes": {name: provenance["splits"][name]["sha256"] for name in EVAL_SPLITS}}, indent=2), flush=True)


if __name__ == "__main__":
    main()
