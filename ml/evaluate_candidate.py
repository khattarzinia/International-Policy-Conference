"""Compare immutable checkpoints through the actual serving path on frozen data."""
from __future__ import annotations

import argparse
from collections import Counter
import copy
import json
import math
from pathlib import Path
import time

from common import ROOT, load_jsonl, metrics, sha256
from runtime import ANALYSIS_MAX_WINDOWS, Detector


def wilson_interval(successes, total, z=1.96):
    if not total:
        return None
    p = successes / total
    denominator = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denominator
    half = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator
    return [max(0, center - half), min(1, center + half)]


def summarize(rows, predictions):
    result = metrics([r["label"] for r in rows], [p["score"] for p in predictions])
    result["humanFalsePositiveRate95PercentWilsonInterval"] = wilson_interval(
        result["confusionAtHalf"]["falsePositive"], result["humanExamples"])
    result["partialCoverageDocuments"] = sum(not p["coverageComplete"] for p in predictions)
    result["sourceGroups"] = len({r["source_id"] for r in rows})
    result["humanSourceGroups"] = len({r["source_id"] for r in rows if r["label"] == 0})
    result["aiSourceGroups"] = len({r["source_id"] for r in rows if r["label"] == 1})
    result["sourceGroupsWithHumanFalsePositives"] = len({r["source_id"] for r, p in zip(rows, predictions) if r["label"] == 0 and p["score"] >= .5})
    result["sourceGroupsWithMissedAI"] = len({r["source_id"] for r, p in zip(rows, predictions) if r["label"] == 1 and p["score"] < .5})
    result["labelEvidence"] = dict(Counter(r.get("label_evidence", "public_dataset_label") for r in rows))
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=ROOT / ".local/ml-data-v3")
    parser.add_argument("--baseline", type=Path, default=ROOT / ".local/ml-model-v2")
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--device", choices=["cpu", "mps"], default="cpu")
    parser.add_argument("--selection", type=Path, help="Frozen validation-only selection; required for V4 final audits")
    args = parser.parse_args()
    if args.output.exists():
        parser.error("Refusing to overwrite an existing evaluation report")
    provenance = json.loads((args.data / "provenance.json").read_text())
    selection = json.loads(args.selection.read_text()) if args.selection else None
    if "fresh_public_test" in provenance["splits"] and selection is None:
        parser.error("Fresh audit requires a frozen validation-only selection")
    if selection and (selection.get("testScoresSeen") is not False or not selection.get("validationOnly") or
                      selection["selected"]["checkpointSha256"] != sha256(args.candidate / "model.safetensors")):
        raise ValueError("Candidate differs from the score-blind frozen selection")
    if selection and (selection["dataProvenanceSha256"] != sha256(args.data / "provenance.json") or
                      selection["protocolSha256"] != sha256(args.selection.parent / "protocol.json")):
        raise ValueError("Final audit differs from the protocol frozen before training")
    splits = {}
    for name, entry in provenance["splits"].items():
        if name == "train":
            continue
        if sha256(args.data / f"{name}.jsonl") != entry["sha256"]:
            raise ValueError("Evaluation dataset changed after being frozen")
        splits[name] = load_jsonl(args.data / f"{name}.jsonl")
    report = {"createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
              "inferenceMaxWindows": ANALYSIS_MAX_WINDOWS, "inferencePath": "runtime.Detector.predict",
              "evaluationHashes": {s: provenance["splits"][s]["sha256"] for s in splits},
              "selectionSha256": sha256(args.selection) if args.selection else None,
              "results": {}, "limitations": [
                  "Historical MUN papers are human proxies, not verified authorship records.",
                  "New synthetic MUN papers are from Codex sessions; this is not unseen-generator validation.",
                  "Public test and heldout-generator sets may share human examples.",
                  "Wilson intervals are document-level summaries; topic/school correlation and proxy labels limit population-level interpretation.",
                  "Confidence is uncalibrated; aggregate accuracy is not proof of authorship.",
                  "This report is a model comparison, not authorization to deploy or reject submissions."]}
    for label, path in [("baseline", args.baseline), ("candidate", args.candidate)]:
        if label == "candidate" and args.candidate.resolve() == args.baseline.resolve():
            report["results"][label] = copy.deepcopy(report["results"]["baseline"])
            report["results"][label]["identicalCheckpointInferenceReused"] = True
            continue
        detector = Detector(path, device=args.device)
        entry = {"modelVersion": detector.metadata["modelVersion"],
                 "checkpointSha256": sha256(path / "model.safetensors"), "splits": {}, "predictions": {}}
        for split, rows in splits.items():
            predictions = []
            for row in rows:
                p = detector.predict(row["text"])
                predictions.append({"record_id": row["record_id"], "label": row["label"],
                                    "source_id": row["source_id"], "text_sha256": row["text_sha256"],
                                    "score": p["score"], "coverageComplete": p["coverageComplete"],
                                    "analyzedTokens": p["analyzedTokens"], "totalTokens": p["totalTokens"]})
            entry["splits"][split] = summarize(rows, predictions)
            if selection and selection["reviewThresholdDiagnostic"] is not None:
                threshold = selection["reviewThresholdDiagnostic"]
                entry["splits"][split]["frozenReviewThresholdDiagnostic"] = {
                    "threshold": threshold, "humanFlagged": sum(r["label"] == 0 and p["score"] >= threshold for r, p in zip(rows, predictions)),
                    "aiFlagged": sum(r["label"] == 1 and p["score"] >= threshold for r, p in zip(rows, predictions))}
            entry["predictions"][split] = predictions
            print(json.dumps({"model": label, "split": split, "metrics": entry["splits"][split]}), flush=True)
        report["results"][label] = entry
        del detector
    evaluated = [s for s in splits if ("test" in s or s == "heldout_generator") and "excerpt" not in s]
    regressions = []
    for split in evaluated:
        a, b = [report["results"][label]["splits"][split] for label in ["baseline", "candidate"]]
        for key in ["accuracy", "auroc", "truePositiveRateAtHalf"]:
            if a[key] is not None and b[key] is not None and b[key] < a[key]:
                regressions.append({"split": split, "metric": key, "baseline": a[key], "candidate": b[key]})
        if b["falsePositiveRateAtHalf"] > a["falsePositiveRateAtHalf"]:
            regressions.append({"split": split, "metric": "falsePositiveRateAtHalf",
                                "baseline": a["falsePositiveRateAtHalf"], "candidate": b["falsePositiveRateAtHalf"]})
    report["regressions"] = regressions
    report["activateAutomatically"] = False
    report["recommendation"] = ("Keep baseline active: candidate has measured trade-offs." if regressions else
                                "Candidate preserves measured metrics; target-population validation remains required before operational use.")
    if selection and selection["selected"]["name"] == "baseline":
        report["recommendation"] = "Keep baseline active: no trained candidate improved the predeclared validation objective. Fresh audit evaluates the retained model, not a model upgrade."
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"report": str(args.output), "recommendation": report["recommendation"]}), flush=True)


if __name__ == "__main__":
    main()
