"""Prepare a bounded fine-tuning corpus from an explicitly source-grouped dataset."""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import random
import time

from common import ROOT, sha256

DATASET = "rasbt/human-vs-ai-50k"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=ROOT / ".local/ml-data")
    args = parser.parse_args()
    import pyarrow.parquet as pq

    revision = json.loads((args.data / "rasbt-revision.json").read_text())["revision"]
    original = {split: pq.read_table(args.data / f"{split}-00000-of-00001.parquet").to_pylist() for split in ["train", "validation", "test"]}
    # Dataset card explicitly maps0=human and1=AI. Preserve metadata for audit.
    counts = Counter(row["generator_model"] for row in original["test"] if row["label"] == 1)
    preferred = [name for name in counts if name and "gpt" in name.lower()]
    heldout = max(preferred or list(counts), key=counts.get)
    seen_hashes = set()
    eligible = {}
    for split, rows in original.items():
        prepared = []
        for row in rows:
            if row["public_hub_eligible"] is not True:
                continue
            text = row["text"].strip()
            if len(text) < 300 or len(text) > 60000:
                continue
            digest = hashlib.sha256(" ".join(text.lower().split()).encode()).hexdigest()
            if digest in seen_hashes:
                continue
            seen_hashes.add(digest)
            prepared.append({"text": text, "label": int(row["label"]), "source_id": row["group_id"],
                             "record_id": str(row["id"]), "model": row["generator_model"] or "human",
                             "domain": row["source_collection"], "text_sha256": digest, "split": split,
                             "source_document_id": row["source_document_id"], "source_name": row["source_name"],
                             "source_url": row["source_url"], "source_license": row["source_license"],
                             "source_license_url": row["source_license_url"], "source_authors": row["source_authors"],
                             "attribution_name": row["attribution_name"], "attribution_url": row["attribution_url"],
                             "sample_type": row["sample_type"], "seed_sample_id": row["seed_sample_id"]})
        eligible[split] = prepared
    rng = random.Random(20261027)

    def sample_balanced(rows, per_class):
        rows = rows[:]
        rng.shuffle(rows)
        by_label = {0: [], 1: []}
        groups = Counter()
        for row in rows:
            if groups[(row["source_id"], row["label"])] >= 2:
                continue
            groups[(row["source_id"], row["label"]) ] += 1
            by_label[row["label"]].append(row)
        count = min(len(by_label[0]), len(by_label[1]), per_class)
        selected = by_label[0][:count] + by_label[1][:count]
        rng.shuffle(selected)
        return selected

    splits = {name: sample_balanced([row for row in rows if row["model"] != heldout], 1800 if name == "train" else 400) for name, rows in eligible.items()}
    heldout_ai = [row for row in eligible["test"] if row["model"] == heldout]
    heldout_domains = {row["domain"] for row in heldout_ai}
    heldout_human = [row for row in eligible["test"] if row["label"] == 0 and row["domain"] in heldout_domains]
    splits["heldout_generator"] = sample_balanced(heldout_human + heldout_ai, 400)
    source_sets = {name: {row["source_id"] for row in rows} for name, rows in splits.items()}
    for a, b in [("train", "validation"), ("train", "test"), ("train", "heldout_generator"), ("validation", "test"), ("validation", "heldout_generator")]:
        if source_sets[a] & source_sets[b]:
            raise ValueError(f"Source-group leakage between{a} and{b}")
    if len(splits["train"]) < 500 or min(len(splits["validation"]), len(splits["test"]), len(splits["heldout_generator"])) < 100:
        raise ValueError("The bounded corpus has too few independent examples")
    for name, rows in splits.items():
        (args.data / f"{name}.jsonl").write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows))
    metadata = {"dataset": DATASET, "datasetURL": "https://huggingface.co/datasets/" + DATASET, "datasetRevision": revision,
                "license": "Mixed row-level source licenses; full provenance and attribution retained in JSONL",
                "retrievedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "splitRule": "Dataset's original source-grouped train/validation/test partitions; max2 examples per source-group/class; exact normalized text dedup across partitions",
                "trainGenerators": sorted({row["model"] for row in splits["train"] if row["label"] == 1}),
                "heldoutGenerator": heldout, "domains": sorted({row["domain"] for rows in splits.values() for row in rows}),
                "labelDefinition": {"0": "Dataset class label human", "1": "Dataset class label ai"},
                "policyBriefValidation": False, "experimental": True,
                "sourceLicenses": sorted({row["source_license"] for rows in splits.values() for row in rows}),
                "originalDatasetFiles": {name: {"sha256": sha256(args.data / f"{name}-00000-of-00001.parquet"), "rows": len(original[name])} for name in original},
                "splits": {name: {"examples": len(rows), "sourceGroups": len(source_sets[name]), "human": sum(row["label"] == 0 for row in rows), "ai": sum(row["label"] == 1 for row in rows), "models": sorted({row["model"] for row in rows}), "domains": dict(Counter(row["domain"] for row in rows)), "sha256": sha256(args.data / f"{name}.jsonl")} for name, rows in splits.items()}}
    (args.data / "provenance.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps(metadata, indent=2), flush=True)


if __name__ == "__main__":
    main()
