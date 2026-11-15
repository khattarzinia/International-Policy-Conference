"""Freeze a larger public corpus and topic-grouped historical/synthetic MUN split.

Historical dates are authorship proxies, not certified human labels. Downloaded
papers remain private local research inputs; this script grants no reuse rights.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import random
import re
import shutil
import time

from common import ROOT, load_jsonl, sha256

EVALUATIONS = ("validation", "test", "heldout_generator")


def normalized_hash(text):
    return hashlib.sha256(" ".join(text.lower().split()).encode()).hexdigest()


def group_documents(rows):
    """Keep prompt/topic families and substantially duplicated text together."""
    parent = {r["source_id"]: r["source_id"] for r in rows}

    def root(group):
        while parent[group] != group:
            parent[group] = parent[parent[group]]
            group = parent[group]
        return group

    shingles, joined = [], []
    for i, row in enumerate(rows):
        words = re.findall(r"\w+", row["text"].casefold())
        current = {tuple(words[j:j + 9]) for j in range(max(0, len(words) - 8))}
        for j, prior in enumerate(shingles):
            denominator = min(len(current), len(prior))
            if denominator >= 100 and len(current & prior) / denominator >= .8:
                a, b = root(row["source_id"]), root(rows[j]["source_id"])
                parent[max(a, b)] = min(a, b)
                joined.append([row["record_id"], rows[j]["record_id"]])
        shingles.append(current)
    for row in rows:
        row["source_id"] = root(row["source_id"])
    return joined


def assign_splits(rows):
    groups = sorted({r["source_id"] for r in rows})
    if len(groups) < 10:
        raise ValueError("At least ten independent topic/duplicate groups are required")
    random.Random(20261031).shuffle(groups)
    heldout_count = max(2, round(len(groups) * .15))
    assignment = {g: "mun_test" if i < heldout_count else "mun_validation" if i < 2 * heldout_count else "train"
                  for i, g in enumerate(groups)}
    splits = {s: [] for s in ["train", "mun_validation", "mun_test"]}
    for row in rows:
        row["split"] = assignment[row["source_id"]]
        splits[row["split"]].append(row)
    for name, records in splits.items():
        if set(r["label"] for r in records) != {0, 1}:
            raise ValueError(f"{name} needs both historical and generated examples; add topic coverage, do not move test groups")
    return splits, assignment


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--expanded-public", type=Path, default=ROOT / ".local/ml-data-v3-public")
    parser.add_argument("--baseline", type=Path, default=ROOT / ".local/ml-data-v2")
    parser.add_argument("--mun", type=Path, default=ROOT / ".local/mun-data")
    parser.add_argument("--synthetic", type=Path, action="append", help="Frozen synthetic JSONL; repeat for multiple generation sessions")
    parser.add_argument("--output", type=Path, default=ROOT / ".local/ml-data-v3")
    args = parser.parse_args()
    if args.output.exists():
        parser.error("Refusing to overwrite frozen data; use a fresh output directory")
    old = json.loads((args.baseline / "provenance.json").read_text())
    expanded = json.loads((args.expanded_public / "provenance.json").read_text())
    if old["datasetRevision"] != expanded["datasetRevision"]:
        raise ValueError("Public expansion must use the same pinned corpus revision")
    # Retain every v2 example, even when the raised cap changes sampling order.
    baseline = load_jsonl(args.baseline / "train.jsonl")
    extra = load_jsonl(args.expanded_public / "train.jsonl")
    for directory, metadata in [(args.baseline, old), (args.expanded_public, expanded)]:
        for name in ["train", *EVALUATIONS]:
            if sha256(directory / f"{name}.jsonl") != metadata["splits"][name]["sha256"]:
                raise ValueError("Public source data differs from its recorded hash")
    pool = {0: [], 1: []}
    seen = set()
    for row in baseline + extra:
        if row["record_id"] not in seen:
            pool[row["label"]].append(row)
            seen.add(row["record_id"])
    count = min(map(len, pool.values()))
    public_training = pool[0][:count] + pool[1][:count]
    if not {r["record_id"] for r in baseline} <= {r["record_id"] for r in public_training}:
        raise ValueError("The expanded corpus must retain every v2 training example")
    human_manifest = load_jsonl(args.mun / "manifest.jsonl")
    humans = {r["source_id"]: r for r in human_manifest}
    synthetic_paths = args.synthetic or [args.mun / "synthetic.jsonl"]
    generated = [row for path in synthetic_paths for row in load_jsonl(path)]
    if len({r["record_id"] for r in generated}) != len(generated):
        raise ValueError("Synthetic record IDs must be unique across generation sessions")
    domain, duplicates, seen_hashes = [], [], set()
    for item, synthetic in [(r, False) for r in human_manifest] + [(r, True) for r in generated]:
        if synthetic and (item.get("label") != 1 or item.get("scores_seen_before_freeze") is not False):
            raise ValueError("Synthetic labels and score-blind generation provenance are required")
        parent_id = item.get("parent_document_id") if synthetic else item["source_id"]
        if parent_id not in humans:
            raise ValueError("A generated prompt must reference a collected parent document")
        source = humans[parent_id]
        text = item["text"] if synthetic else (ROOT / source["text_path"]).read_text()
        # Remove extraction-specific spacing for BOTH classes without rewriting words.
        text = " ".join(text.split())
        if len(text) < 300 or len(text) > 150000:
            raise ValueError("Invalid document length")
        digest = normalized_hash(text)
        record_id = item.get("record_id", f"synthetic-{digest[:16]}") if synthetic else f"human-{parent_id}"
        if digest in seen_hashes:
            duplicates.append(record_id)
            continue
        seen_hashes.add(digest)
        domain.append({"text": text, "label": int(synthetic), "record_id": record_id,
                       "source_id": source["committee_topic_group_id"], "parent_document_id": parent_id,
                       "source_document_id": source["pdf_sha256"], "domain": "mun_position_paper",
                       "model": item.get("model", "Codex session (exact underlying model not attested)") if synthetic else "historical_human_proxy",
                       "text_sha256": digest, "source_url": source["archive_url"],
                       "source_license": "Session-generated" if synthetic else source["license"],
                       "label_evidence": "generated_in_recorded_codex_session" if synthetic else "historical_human_proxy",
                       "authorship_verified": bool(synthetic), "year": source["year"],
                       "prior_paired_source_exposure": item.get("prior_paired_source_exposure", False) if synthetic else None,
                       "generation_context_note": item.get("prior_source_exposure_note") if synthetic else None,
                       "school_group_id": source.get("school_group_id"),
                       "committee_topic_group_id": source["committee_topic_group_id"],
                       "prompt_family_id": item.get("prompt_family_id") if synthetic else None})
    near_duplicates = group_documents(domain)
    mun_splits, assignment = assign_splits(domain)
    frozen = {s: load_jsonl(args.baseline / f"{s}.jsonl") for s in EVALUATIONS}
    protected_sources = {r["source_id"] for rows in frozen.values() for r in rows}
    protected_hashes = {r["text_sha256"] for rows in frozen.values() for r in rows}
    training = public_training + mun_splits["train"]
    if protected_sources & {r["source_id"] for r in training} or protected_hashes & {normalized_hash(r["text"]) for r in training}:
        raise ValueError("Frozen evaluation leakage")
    if any(r["model"] == old["heldoutGenerator"] for r in training):
        raise ValueError("Held-out generator leaked into training")
    all_splits = {"train": training, **frozen, "mun_validation": mun_splits["mun_validation"], "mun_test": mun_splits["mun_test"]}
    # Same held-out documents, equal-sized excerpts: diagnose length/aggregation
    # confounding without pretending this is independent extra evidence.
    excerpts = []
    for row in mun_splits["mun_test"]:
        words = row["text"].split()
        if len(words) >= 250:
            text = " ".join(words[:250])
            excerpts.append({**row, "text": text, "record_id": row["record_id"] + "-first250",
                             "text_sha256": normalized_hash(text), "split": "mun_test_excerpt250",
                             "parent_evaluation_record_id": row["record_id"]})
    if set(r["label"] for r in excerpts) == {0, 1}:
        all_splits["mun_test_excerpt250"] = excerpts
    school_sets = {s: {r["school_group_id"] for r in rs if r.get("school_group_id")} for s, rs in mun_splits.items()}
    school_overlap = {f"{a}/{b}": len(school_sets[a] & school_sets[b])
                      for a, b in [("train", "mun_validation"), ("train", "mun_test"), ("mun_validation", "mun_test")]}
    args.output.mkdir(parents=True)
    for name, rows in all_splits.items():
        if name in EVALUATIONS:
            shutil.copyfile(args.baseline / f"{name}.jsonl", args.output / f"{name}.jsonl")
        else:
            (args.output / f"{name}.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows))
    provenance = {**expanded, "preparedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                  "dataset": "Expanded public corpus plus historical MUNOL and session-generated MUN papers",
                  "retainedV2TrainingExamples": len(baseline), "publicTrainingExamples": len(public_training),
                  "baselineTrainingExamples": len(baseline), "trainingExpansionFactor": len(training) / len(baseline),
                  "sourceClassCapScope": "Public corpus only; MUN papers stay in whole topic/year groups",
                  "trainGenerators": sorted({r["model"] for r in training if r["label"] == 1}),
                  "sourceLicenses": sorted({r["source_license"] for rows in all_splits.values() for r in rows}),
                  "munHistoricalExamples": sum(r["label"] == 0 for r in domain),
                  "munSyntheticExamples": sum(r["label"] == 1 for r in domain),
                  "munPriorPairedSourceExposure": [{"record_id": r["record_id"], "split": r["split"]}
                                                  for r in domain if r.get("prior_paired_source_exposure")],
                  "munManifestSha256": sha256(args.mun / "manifest.jsonl"),
                  "munSyntheticSources": [{"path": str(path), "sha256": sha256(path)} for path in synthetic_paths],
                  "munGroupAssignments": assignment, "munNearDuplicatePairs": near_duplicates,
                  "munExactDuplicatesExcluded": duplicates, "schoolOverlapsAcrossMunSplits": school_overlap,
                  "munSplitRule": "Fixed-seed committee/year/topic families; paired synthetic descendants and near duplicates stay together. Schools can overlap; this is not an unseen-school benchmark.",
                  "excerptEvaluation": "mun_test_excerpt250 reuses mun_test documents at exactly 250 words. It is a length-control diagnostic, not independent test data.",
                  "labelLimitations": "Historical archive dates are human-authorship proxies; not authenticated drafts. Synthetic MUN text is Codex-session-generated, not multiple generator families. Full source texts stay local; rights remain unverified.",
                  "policyBriefValidation": False,
                  "splits": {name: {"examples": len(rows), "sourceGroups": len({r["source_id"] for r in rows}),
                                    "human": sum(r["label"] == 0 for r in rows), "ai": sum(r["label"] == 1 for r in rows),
                                    "models": sorted({r["model"] for r in rows}),
                                    "domains": dict(Counter(r["domain"] for r in rows)),
                                    "sha256": sha256(args.output / f"{name}.jsonl")} for name, rows in all_splits.items()}}
    (args.output / "provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
    print(json.dumps({k: provenance[k] for k in ["publicTrainingExamples", "retainedV2TrainingExamples", "munHistoricalExamples", "munSyntheticExamples", "schoolOverlapsAcrossMunSplits", "splits"]}, indent=2))


if __name__ == "__main__":
    main()
