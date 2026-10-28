"""Compare one completed candidate against v1 on identical, frozen evaluations."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from common import ROOT


def compare(baseline_dir, candidate_dir):
    baseline = json.loads((baseline_dir / "metadata.json").read_text())
    candidate = json.loads((candidate_dir / "metadata.json").read_text())
    checks = {}
    for split in ["validation", "test", "heldout_generator"]:
        old_split = baseline["dataProvenance"]["splits"][split]
        new_split = candidate["dataProvenance"]["splits"][split]
        if old_split["sha256"] != new_split["sha256"]:
            raise ValueError("Cannot compare models against changed evaluation documents")
        old, new = baseline["metrics"][split], candidate["metrics"][split]
        checks[split] = {"examples": new["examples"], "evaluationSha256": new_split["sha256"], "v1": old, "v2": new,
                         "deltas": {key: new[key] - old[key] for key in ["accuracy", "auroc", "falsePositiveRateAtHalf", "truePositiveRateAtHalf", "brierScore"]}}
    # Do not silently promote a more-data model that worsens either held-out
    # ranking or human false positives. Report other trade-offs explicitly.
    improved = all(checks[split]["v2"]["auroc"] >= checks[split]["v1"]["auroc"]
                   and checks[split]["v2"]["falsePositiveRateAtHalf"] <= checks[split]["v1"]["falsePositiveRateAtHalf"]
                   and checks[split]["v2"]["accuracy"] >= checks[split]["v1"]["accuracy"]
                   for split in ["test", "heldout_generator"])
    return {"baselineModelVersion": baseline["modelVersion"], "candidateModelVersion": candidate["modelVersion"],
            "baselineTrainingExamples": baseline["trainingExamples"], "candidateTrainingExamples": candidate["trainingExamples"],
            "expansionFactor": candidate["trainingExamples"] / baseline["trainingExamples"], "evaluations": checks,
            "promotionRecommended": improved,
            "recommendation": "Candidate improves or preserves held-out AUROC, accuracy and human false-positive rate; candidate is suitable for prototype promotion, subject to IPC domain validation." if improved else "Retain v1 as the default. The more-data candidate has measured regressions or trade-offs; inspect all metrics before any promotion.",
            "limitations": "Both checkpoints are experimental and uncalibrated. These fixed public-corpus evaluations do not establish accuracy on IPC policy briefs or every generator. Test results were consulted only after validation-based checkpoint selection."}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", type=Path, default=ROOT / ".local/ml-model-v1")
    parser.add_argument("--candidate", type=Path, default=ROOT / ".local/ml-model-v2")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = compare(args.baseline, args.candidate)
    if args.output:
        args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2), flush=True)


if __name__ == "__main__":
    main()
