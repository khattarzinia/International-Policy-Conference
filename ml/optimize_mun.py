"""Run the fixed four-trial, validation-only MUN experiment and freeze selection."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import subprocess
import sys
import time

from common import ROOT, metrics, sha256
from runtime import ANALYSIS_MAX_WINDOWS, Detector
from train import load_training_records, low_false_positive_rank, predict_token_documents

TRIALS = [("a", 1e-5, 1.0), ("b", 1e-5, 1.5), ("c", 3e-5, 1.0), ("d", 3e-5, 1.5)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=ROOT / ".local/ml-data-v4")
    parser.add_argument("--baseline", type=Path, default=ROOT / ".local/ml-model-v2")
    parser.add_argument("--output", type=Path, default=ROOT / ".local/mun-v4-campaign")
    parser.add_argument("--device", choices=["cpu", "mps"], default="mps")
    args = parser.parse_args()
    if args.output.exists():
        parser.error("Refusing to overwrite a campaign; preserve all trial results")
    provenance = json.loads((args.data / "provenance.json").read_text())
    records, validation_splits = load_training_records(args.data, provenance, True)
    del records["train"]
    args.output.mkdir(parents=True)
    protocol = {"createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "dataProvenanceSha256": sha256(args.data / "provenance.json"),
                "baselineCheckpointSha256": sha256(args.baseline / "model.safetensors"),
                "codeSha256": {name: sha256(ROOT / "ml" / name) for name in ["train.py", "optimize_mun.py", "runtime.py"]},
                "trials": [{"name": n, "learningRate": lr, "humanLossWeight": w} for n, lr, w in TRIALS],
                "epochs": 2, "domainSamplingWeight": 2, "batchSize": 16, "seed": 20261027,
                "validationSplits": validation_splits, "selectionThreshold": .5,
                "ranking": "Zero FPs in every domain; lower worst FPR; lower summed FPR; higher minimum recall; higher mean recall; higher mean AUROC. Exact ties retain baseline, then lower LR/weight and earlier epoch.",
                "testUse": "No test file is read or scored in this campaign. Final selection is frozen before separate evaluation."}
    (args.output / "protocol.json").write_text(json.dumps(protocol, indent=2) + "\n")
    detector = Detector(args.baseline, device=args.device)
    baseline_metrics, baseline_predictions = {}, {}
    for split in validation_splits:
        tokens = detector.tokenizer([r["text"] for r in records[split]], add_special_tokens=False, truncation=False)["input_ids"]
        scores = predict_token_documents(detector.model, detector.tokenizer, tokens, detector.device)
        predictions = [{"record_id": r["record_id"], "label": r["label"], "score": float(score)} for r, score in zip(records[split], scores)]
        baseline_predictions[split] = predictions
        baseline_metrics[split] = metrics([r["label"] for r in predictions], [r["score"] for r in predictions])
    del detector
    (args.output / "baseline-validation.json").write_text(json.dumps({"metrics": baseline_metrics, "predictions": baseline_predictions}, indent=2) + "\n")
    entries = [{"name": "baseline", "path": str(args.baseline.resolve()), "rank": low_false_positive_rank(list(baseline_metrics.values())),
                "metrics": baseline_metrics, "checkpointSha256": protocol["baselineCheckpointSha256"], "selectedEpoch": None}]
    print(json.dumps({"model": "baseline", "validation": baseline_metrics}), flush=True)
    for name, lr, weight in TRIALS:
        output = args.output / f"trial-{name}"
        command = [sys.executable, str(ROOT / "ml/train.py"), "--data", str(args.data), "--output", str(output),
                   "--resume-from", str(args.baseline), "--epochs", "2", "--batch-size", "16", "--seconds", "600",
                   "--learning-rate", str(lr), "--domain-sampling-weight", "2", "--human-loss-weight", str(weight),
                   "--selection", "low-fpr", "--validation-only", "--device", args.device,
                   "--model-version-prefix", f"ipc-bert-tiny-mun-v4-{name}-raw"]
        with (args.output / f"trial-{name}.log").open("w") as log:
            subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, cwd=ROOT, check=True)
        metadata = json.loads((output / "metadata.json").read_text())
        if metadata["timeLimited"] or metadata["completedEpochs"] != 2 or set(metadata["metrics"]) != set(validation_splits):
            raise ValueError("Trial did not complete the declared validation-only protocol")
        entry = {"name": name, "path": str(output.resolve()), "rank": low_false_positive_rank(list(metadata["metrics"].values())),
                 "metrics": metadata["metrics"], "checkpointSha256": sha256(output / "model.safetensors"),
                 "selectedEpoch": metadata["selectedEpoch"], "learningRate": lr, "humanLossWeight": weight}
        entries.append(entry)
        print(json.dumps({"completedTrial": name, "rank": entry["rank"], "validation": entry["metrics"]}), flush=True)
    # Python max retains the first item on ties: baseline, then declared LR/weight order.
    chosen = max(entries, key=lambda e: e["rank"])
    predictions = baseline_predictions if chosen["name"] == "baseline" else json.loads((Path(chosen["path"]) / "evaluation-predictions.json").read_text())
    highest_human = max(r["score"] for rows in predictions.values() for r in rows if r["label"] == 0)
    threshold = max(.5, math.nextafter(highest_human, math.inf))
    selection = {"frozenAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                 "protocolSha256": sha256(args.output / "protocol.json"), "selected": chosen,
                 "dataProvenanceSha256": protocol["dataProvenanceSha256"],
                 "allCandidates": entries, "validationOnly": True, "testScoresSeen": False,
                 "reviewThresholdDiagnostic": threshold if threshold <= 1 else None,
                 "reviewThresholdMeaning": "Validation-fitted diagnostic only; never proof of authorship and not deployed.",
                 "inferenceMaxWindows": ANALYSIS_MAX_WINDOWS, "automaticActivation": False}
    (args.output / "selection.json").write_text(json.dumps(selection, indent=2) + "\n")
    print(json.dumps({"selectionFrozen": str(args.output / "selection.json"), "selected": chosen["name"]}), flush=True)


if __name__ == "__main__":
    main()
