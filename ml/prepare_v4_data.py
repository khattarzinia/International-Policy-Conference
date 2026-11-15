"""Freeze conference-separated MUN expansion without changing previous holdouts."""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import random
import re
import shutil
import time

from common import ROOT, load_jsonl, sha256
from prepare_mun_training import normalized_hash


def near_duplicate_pairs(rows):
    """Candidate retrieval by 9-word shingles, verified before reporting a pair."""
    index, sizes, words_by_row = defaultdict(list), [], []
    pairs = []
    for i, row in enumerate(rows):
        words = re.findall(r"\w+", row["text"].casefold())
        shingles = {tuple(words[j:j + 9]) for j in range(max(0, len(words) - 8))}
        hashes = {hash(s) for s in shingles}
        counts = Counter(j for h in hashes for j in index[h])
        for j, count in counts.items():
            denominator = min(len(shingles), sizes[j])
            if denominator >= 100 and count / denominator >= .8:
                prior = words_by_row[j]
                prior_shingles = {tuple(prior[k:k + 9]) for k in range(max(0, len(prior) - 8))}
                if len(shingles & prior_shingles) / denominator >= .8:
                    pairs.append((i, j))
        for h in hashes:
            index[h].append(i)
        sizes.append(len(shingles))
        words_by_row.append(words)
    return pairs


def domain_rows(manifest_path, synthetic_paths, family):
    manifest = load_jsonl(manifest_path)
    parents = {r["source_id"]: r for r in manifest}
    generated = [r for p in synthetic_paths for r in load_jsonl(p)]
    rows = []
    for item, synthetic in [(r, False) for r in manifest] + [(r, True) for r in generated]:
        source = parents[item.get("source_document_id", item.get("parent_document_id"))] if synthetic else item
        if synthetic and (item.get("label") != 1 or item.get("scores_seen_before_freeze") is not False):
            raise ValueError("Generated examples require score-blind provenance and an AI label")
        if synthetic and item.get("exact_text_sha256") and hashlib.sha256(item["text"].encode()).hexdigest() != item["exact_text_sha256"]:
            raise ValueError("Generated paper differs from its frozen text hash")
        path = ROOT / source["text_path"]
        raw = path.read_text()
        expected = source.get("exact_text_sha256") or (source["text_sha256"] if family == "nmun" else None)
        if (expected and sha256(path) != expected) or (family == "munol" and normalized_hash(raw) != source["text_sha256"]):
            raise ValueError("Human paper text differs from collected provenance")
        if sha256(ROOT / source["pdf_path"]) != source["pdf_sha256"]:
            raise ValueError("Source PDF differs from collected provenance")
        text = " ".join((item["text"] if synthetic else raw).split())
        if len(text) < 300 or len(text) > 150000:
            raise ValueError("Unusable paper length")
        group = source.get("parent_bundle_id", source["parent_document_id"]) if family == "nmun" else source["committee_topic_group_id"]
        rows.append({"text": text, "label": int(synthetic), "record_id": item["record_id"] if synthetic else f"human-{source['source_id']}",
                     "source_id": group, "parent_document_id": source["parent_document_id"],
                     "paired_source_id": source["source_id"], "source_document_id": source["pdf_sha256"],
                     "domain": "mun_position_paper", "conference_family": family,
                     "model": item.get("model", "Codex session (exact underlying model not attested)") if synthetic else "historical_human_proxy",
                     "text_sha256": normalized_hash(text), "source_url": source["source_url"],
                     "source_license": "Session-generated" if synthetic else source.get("source_license", source.get("license", "No reuse licence identified")),
                     "label_evidence": "generated_in_recorded_codex_session" if synthetic else "historical_human_proxy",
                     "authorship_verified": bool(synthetic), "year": source["year"],
                     "school_group_id": source.get("school_group_id"), "committee_topic_group_id": source["committee_topic_group_id"],
                     "prompt_family_id": item.get("prompt_family_id") if synthetic else None})
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", type=Path, default=ROOT / ".local/ml-data-v3")
    parser.add_argument("--munol", type=Path, default=ROOT / ".local/mun-expansion/munol/manifest.jsonl")
    parser.add_argument("--nmun", type=Path, required=True)
    parser.add_argument("--nmun-synthetic", type=Path, required=True)
    parser.add_argument("--srmun", type=Path, required=True)
    parser.add_argument("--srmun-synthetic", type=Path, required=True)
    parser.add_argument("--fresh-public", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=ROOT / ".local/ml-data-v4")
    args = parser.parse_args()
    if args.output.exists():
        parser.error("Refusing to overwrite frozen data")
    provenance = json.loads((args.baseline / "provenance.json").read_text())
    splits = {}
    for name, info in provenance["splits"].items():
        path = args.baseline / f"{name}.jsonl"
        if sha256(path) != info["sha256"]:
            raise ValueError("Baseline corpus changed")
        splits[name] = load_jsonl(path)
    original_counts = {name: len(rows) for name, rows in splits.items()}
    seen_ids = {r["record_id"] for rows in splits.values() for r in rows}
    seen_hashes = {normalized_hash(r["text"]) for rows in splits.values() for r in rows}
    additions, exclusions = [], []
    for row in domain_rows(args.munol, [], "munol"):
        if row["record_id"] in seen_ids:
            continue
        split = provenance["munGroupAssignments"][row["source_id"]]
        if split != "train":
            exclusions.append({"record_id": row["record_id"], "reason": "new paper from a previously held-out topic; reserved unused"})
            continue
        row["split"] = "train"
        additions.append(row)
    nmun = domain_rows(args.nmun, [args.nmun_synthetic], "nmun")
    groups = sorted({r["source_id"] for r in nmun})
    if len(groups) < 5:
        raise ValueError("NMUN requires at least five independent parent reports")
    random.Random(20261031).shuffle(groups)
    nmun_assignment = {g: "nmun_validation" if i < 2 else "train" for i, g in enumerate(groups)}
    for row in nmun:
        row["split"] = nmun_assignment[row["source_id"]]
        additions.append(row)
    for row in domain_rows(args.srmun, [args.srmun_synthetic], "srmun"):
        row["split"] = "srmun_test"
        additions.append(row)
    unique = []
    for row in additions:
        if row["record_id"] in seen_ids or row["text_sha256"] in seen_hashes:
            exclusions.append({"record_id": row["record_id"], "reason": "exact duplicate"})
            continue
        seen_ids.add(row["record_id"]); seen_hashes.add(row["text_sha256"])
        unique.append(row)
    existing_domain = [{**r, "split": name} for name, rows in splits.items() if "excerpt" not in name
                       for r in rows if r["domain"] == "mun_position_paper"]
    domain = existing_domain + unique
    pairs = near_duplicate_pairs(domain)
    # Preserve frozen old partitions. Quarantine whole new source groups if a
    # near duplicate would bridge training/validation or the conference holdout.
    quarantined = set()
    for a, b in pairs:
        if domain[a]["split"] != domain[b]["split"]:
            for index in [a, b]:
                if index >= len(existing_domain):
                    quarantined.add(domain[index]["source_id"])
            if max(a, b) < len(existing_domain):
                raise ValueError("Previously frozen MUN partitions contain near duplicates")
    kept = []
    for row in unique:
        if row["source_id"] in quarantined:
            exclusions.append({"record_id": row["record_id"], "reason": "whole source group quarantined for cross-split near duplication"})
            continue
        kept.append(row)
        splits.setdefault(row["split"], []).append(row)
    for name in ["nmun_validation", "srmun_test"]:
        if {r["label"] for r in splits[name]} != {0, 1}:
            raise ValueError(f"{name} needs both classes after leakage filtering")
    nmun_train = [r for r in kept if r["conference_family"] == "nmun" and r["split"] == "train"]
    nmun_validation = splits["nmun_validation"]
    if {r["committee_topic_group_id"] for r in nmun_train} & {r["committee_topic_group_id"] for r in nmun_validation}:
        raise ValueError("NMUN committee/year topic families cross training and validation")
    school_overlap = sorted({r["school_group_id"] for r in nmun_train} & {r["school_group_id"] for r in nmun_validation})
    fresh_provenance = json.loads((args.fresh_public / "provenance.json").read_text())
    if sha256(args.fresh_public / "test.jsonl") != fresh_provenance["splits"]["test"]["sha256"]:
        raise ValueError("Fresh public audit changed after its score-blind freeze")
    fresh = load_jsonl(args.fresh_public / "test.jsonl")
    occupied_sources = {r["source_id"] for rows in splits.values() for r in rows}
    occupied_hashes = {normalized_hash(r["text"]) for rows in splits.values() for r in rows}
    if occupied_sources & {r["source_id"] for r in fresh} or occupied_hashes & {normalized_hash(r["text"]) for r in fresh}:
        raise ValueError("Fresh public audit overlaps existing data")
    cross_audit = kept + fresh
    if any((a < len(kept)) != (b < len(kept)) for a, b in near_duplicate_pairs(cross_audit)):
        raise ValueError("Fresh public audit contains a near duplicate of newly collected MUN data")
    splits["fresh_public_test"] = fresh
    splits["srmun_test_excerpt500"] = []
    for row in splits["srmun_test"]:
        if len(row["text"].split()) >= 500:
            text = " ".join(row["text"].split()[:500])
            splits["srmun_test_excerpt500"].append({**row, "text": text, "text_sha256": normalized_hash(text),
                "record_id": row["record_id"] + "-first500", "parent_evaluation_record_id": row["record_id"], "split": "srmun_test_excerpt500"})
    args.output.mkdir(parents=True)
    for name, rows in splits.items():
        if name in original_counts and name != "train":
            shutil.copyfile(args.baseline / f"{name}.jsonl", args.output / f"{name}.jsonl")
        elif name == "fresh_public_test":
            shutil.copyfile(args.fresh_public / "test.jsonl", args.output / f"{name}.jsonl")
        else:
            (args.output / f"{name}.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows))
    metadata = {**provenance, "preparedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "dataset": "V3 retained plus expanded MUNOL and parent-report-grouped NMUN; untouched SRMUN/public audits",
                "trainingExpansionFactor": len(splits["train"]) / provenance["baselineTrainingExamples"],
                "trainGenerators": sorted({r["model"] for r in splits["train"] if r["label"] == 1}),
                "munHistoricalExamples": sum(r["domain"] == "mun_position_paper" and r["label"] == 0 for name, rows in splits.items() if "excerpt" not in name for r in rows),
                "munSyntheticExamples": sum(r["domain"] == "mun_position_paper" and r["label"] == 1 for name, rows in splits.items() if "excerpt" not in name for r in rows),
                "munCountScope": "Distinct examples actually assigned to training, validation or full-document tests; excludes reserved unused papers, quarantines and excerpt copies",
                "sourceLicenses": sorted({r.get("source_license", "Unspecified") for rows in splits.values() for r in rows}),
                "validationSplits": ["validation", "mun_validation", "nmun_validation"],
                "retainedV3TrainingExamples": original_counts["train"], "nmunParentReportAssignments": nmun_assignment,
                "nmunSchoolsInBothTrainingAndValidation": school_overlap,
                "nmunGeneralizationScope": "Held-out report/year/topic families, not an unseen-school benchmark",
                "addedExamples": dict(Counter(f"{r['conference_family']}/{r['split']}/{r['label']}" for r in kept)),
                "expansionInputHashes": {str(p): sha256(p) for p in [args.munol, args.nmun, args.nmun_synthetic, args.srmun, args.srmun_synthetic, args.fresh_public / "test.jsonl", args.fresh_public / "provenance.json"]},
                "freshPublicAudit": json.loads((args.fresh_public / "provenance.json").read_text()),
                "expansionExclusions": exclusions,
                "expansionNearDuplicatePairs": [[domain[a]["record_id"], domain[b]["record_id"]] for a, b in pairs],
                "expansionSplitRule": "All SRMUN reserved for final evaluation. NMUN split by whole parent report. Original MUNOL holdout families and prior evaluation files remain frozen.",
                "excerptEvaluation": "Excerpt diagnostics reuse held-out documents; not independent observations.",
                "splits": {name: {"examples": len(rows), "human": sum(r["label"] == 0 for r in rows), "ai": sum(r["label"] == 1 for r in rows),
                    "sourceGroups": len({r["source_id"] for r in rows}), "sha256": sha256(args.output / f"{name}.jsonl")}
                    for name, rows in splits.items()}}
    (args.output / "provenance.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps({"addedExamples": metadata["addedExamples"], "splits": metadata["splits"], "excluded": len(exclusions)}, indent=2))


if __name__ == "__main__":
    main()
