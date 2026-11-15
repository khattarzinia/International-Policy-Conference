"""Auditable, opt-in comparisons; external predictions never become training labels.

Public HF Gradio APIs: https://huggingface.co/docs/hub/spaces-api-endpoints
Run `python ml/compare_external.py --help`. No network calls occur on import.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import time
from urllib.error import HTTPError
from urllib.request import Request, HTTPRedirectHandler, build_opener

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = "ipc-external-comparison-v1"
SPECS = {
    "fakespot": {"base": "https://fakespot-ai-ai-text-detector.hf.space", "prefix": "/gradio_api",
        "space": "fakespot-ai/ai-text-detector", "model": "fakespot-ai/roberta-base-ai-text-detection-v1",
        "aiLabel": "AI", "humanLabel": "Human", "scoreMeaning": "binary_classifier_confidence",
        "processing": "Provider removes markdown/HTML and normalizes whitespace. Analyzed coverage is not returned."},
    "radar": {"base": "https://trustsafeai-radar-ai-text-detector.hf.space", "prefix": "",
        "space": "TrustSafeAI/RADAR-AI-Text-Detector", "model": "TrustSafeAI/RADAR-Vicuna-7B",
        "aiLabel": "AI-generated", "humanLabel": "Human-written", "scoreMeaning": "binary_classifier_confidence",
        "processing": "Provider tokenizes with truncation at 512 tokens. Analyzed coverage is not returned."},
}


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def digest(data):
    return hashlib.sha256(data.encode("utf-8") if isinstance(data, str) else data).hexdigest()


def utf16_length(text):
    return len(text.encode("utf-16-le")) // 2


def finite_score(value, high=1):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= high:
        raise ValueError("Score must be a finite numeric value in the documented range")
    return float(value)


def validate_sample(sample):
    text = sample.get("text")
    if not isinstance(text, str) or not text or len(text) > 16000:
        raise ValueError("Samples need nonempty text of at most 16000 codepoints")
    if sample.get("inputSha256") != digest(text):
        raise ValueError("Sample text hash does not match")
    if sample.get("submittedCharacters") != len(text) or sample.get("submittedUtf16Units") != utf16_length(text):
        raise ValueError("Sample length does not match")
    if not isinstance(sample.get("sampleId"), str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", sample["sampleId"]):
        raise ValueError("Invalid sample ID")
    if sample.get("dataScope") not in {"public", "synthetic"}:
        raise ValueError("Only explicitly public or synthetic samples are supported")
    if not isinstance(sample.get("sourceUrl"), str) or not sample["sourceUrl"].startswith(("https://", "http://")):
        raise ValueError("Samples require a source/provenance URL")
    original = sample.get("originalCharacters")
    if isinstance(original, bool) or not isinstance(original, int) or original < len(text):
        raise ValueError("Invalid original character count")
    if not re.fullmatch(r"[a-f0-9]{64}", sample.get("originalSha256", "")):
        raise ValueError("Missing original document hash")
    return sample


def load_samples(path):
    rows = [validate_sample(json.loads(line)) for line in Path(path).read_text().splitlines() if line.strip()]
    if not rows or len({x["sampleId"] for x in rows}) != len(rows):
        raise ValueError("Samples must have unique IDs and cannot be empty")
    return rows


def prepare_samples(input_path, output_path, source_url, count=4, max_chars=900):
    """Build explicitly disclosed prefix excerpts; label provenance remains separate."""
    if not 2 <= count <= 16 or count % 2 or not 300 <= max_chars <= 1600:
        raise ValueError("Use an even count 2-16 and excerpt length 300-1600")
    rows = [json.loads(line) for line in Path(input_path).read_text().splitlines() if line.strip()]
    chosen = []
    for label in (0, 1):
        eligible = [x for x in rows if type(x.get("label")) is int and x["label"] == label and isinstance(x.get("text"), str) and len(x["text"]) >= 300]
        if len(eligible) < count // 2:
            raise ValueError("Not enough examples in each source-labeled class")
        for row in eligible[:count // 2]:
            text = row["text"][:max_chars]
            if len(text) < len(row["text"]):
                boundary = text.rfind(" ")
                if boundary >= 300:
                    text = text[:boundary]
            label_evidence = row.get("label_evidence") or "source_dataset_label_not_independently_verified"
            sample = {"sampleId": f"sample-{len(chosen) + 1:03d}",
                "dataScope": "synthetic" if label_evidence == "generated_in_recorded_codex_session" else "public",
                "text": text, "sourceUrl": row.get("source_url") or source_url,
                "datasetUrl": source_url, "sourceRecordId": str(row.get("record_id", row.get("source_id", ""))),
                "sourceParentRecordId": row.get("parent_document_id"), "sourceGroupId": row.get("source_id"),
                "referenceLabel": label, "labelBasis": label_evidence,
                "sourceLicense": row.get("source_license"), "sourceModel": row.get("model"),
                "originalSha256": digest(row["text"]), "inputSha256": digest(text),
                "originalCharacters": len(row["text"]), "submittedCharacters": len(text),
                "submittedUtf16Units": utf16_length(text), "excerptRangeCodepoints": [0, len(text)],
                "excerptPolicy": "first characters, ending at a word boundary; identical excerpt sent to every provider"}
            chosen.append(validate_sample(sample))
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("x", encoding="utf-8") as handle:
        for row in chosen:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    return chosen


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Detector redirects are not followed")


def request_bytes(url, payload=None, headers=None):
    body = None if payload is None else json.dumps(payload, allow_nan=False).encode()
    request = Request(url, data=body, headers={"User-Agent": "IPC-Research-Comparison/1", **({"Content-Type": "application/json"} if body else {}), **(headers or {})})
    with build_opener(NoRedirects()).open(request, timeout=40) as response:
        raw = response.read(2_000_001)
        if len(raw) > 2_000_000:
            raise ValueError("Detector response exceeds the evidence limit")
        return raw


def parse_sse(raw):
    event_type = None
    for line in raw.decode("utf-8").splitlines():
        if line.startswith("event:"):
            event_type = line[6:].strip()
        elif line.startswith("data:") and event_type == "error":
            raise ValueError("Public detector returned an error event")
        elif line.startswith("data:") and event_type == "complete":
            return json.loads(line[5:].strip())
    raise ValueError("Public detector did not return a complete event")


def parse_gradio(provider, data):
    spec = SPECS[provider]
    if not isinstance(data, list) or len(data) != 1 or not isinstance(data[0], dict):
        raise ValueError("Unexpected Gradio output")
    conf = data[0].get("confidences")
    if not isinstance(conf, list):
        raise ValueError("Gradio result has no class confidences")
    if len(conf) != 2 or len({x.get("label") for x in conf}) != 2:
        raise ValueError("Expected two distinct binary classes")
    scores = {x["label"]: finite_score(x.get("confidence")) for x in conf}
    if set(scores) != {spec["aiLabel"], spec["humanLabel"]} or abs(sum(scores.values()) - 1) > 0.0001:
        raise ValueError("Unexpected class labels or probabilities")
    label = data[0].get("label")
    if label not in scores or scores[label] < max(scores.values()) - 0.0001:
        raise ValueError("Provider label conflicts with its class scores")
    return {"score": scores[spec["aiLabel"]], "scoreMeaning": spec["scoreMeaning"],
        "classification": "ai" if label == spec["aiLabel"] else "human", "providerClassScores": scores,
        "analyzedUtf16Units": None, "processingNote": spec["processing"]}


def parse_commercial(provider, result):
    if provider == "sapling":
        score = finite_score(result.get("score"))
        out = {"score": score, "scoreMeaning": "provider_ai_probability", "classification": result.get("verdict"), "analyzedUtf16Units": None}
        if result.get("ai_fraction") is not None:
            out["providerAiFraction"] = finite_score(result["ai_fraction"])
        return out
    documents = result.get("documents")
    if not isinstance(documents, list) or len(documents) != 1:
        raise ValueError("GPTZero must return one document")
    doc = documents[0]
    probs = doc.get("class_probabilities", {})
    score = finite_score(probs.get("ai", doc.get("completely_generated_prob")))
    out = {"score": score, "scoreMeaning": "provider_ai_only_class_probability",
        "classification": doc.get("predicted_class"), "analyzedUtf16Units": None, "modelVersion": result.get("version")}
    if probs:
        out["providerClassScores"] = {k: finite_score(v) for k, v in probs.items()}
    return out


def check_remote_consent(providers, allow_remote=False, allow_billed=False, env=None):
    env = os.environ if env is None else env
    unknown = set(providers) - set(SPECS) - {"sapling", "gptzero", "ipc"}
    if unknown:
        raise ValueError("Unknown providers: " + ", ".join(sorted(unknown)))
    if any(p != "ipc" for p in providers) and not allow_remote:
        raise ValueError("Remote requests require --allow-remote-public-text")
    if any(p in {"sapling", "gptzero"} for p in providers):
        if not allow_billed:
            raise ValueError("Keyed provider APIs require --allow-potentially-billed-api; account quotas are not a billing cap")
        for provider in providers:
            if provider in {"sapling", "gptzero"} and not env.get("SAPLING_API_KEY" if provider == "sapling" else "GPTZERO_API_KEY"):
                raise ValueError(f"{provider} API key is absent")


def call_provider(provider, text):
    if provider in SPECS:
        spec = SPECS[provider]
        url = spec["base"] + spec["prefix"] + "/call/predict"
        event = json.loads(request_bytes(url, {"data": [text]}))
        event_id = event.get("event_id", "")
        if not isinstance(event_id, str) or not re.fullmatch(r"[a-fA-F0-9-]{8,80}", event_id):
            raise ValueError("Invalid public detector event ID")
        raw = request_bytes(url + "/" + event_id)
        return parse_gradio(provider, parse_sse(raw)), raw, url
    if provider == "sapling":
        url = "https://api.sapling.ai/api/v1/aidetect"
        raw = request_bytes(url, {"key": os.environ["SAPLING_API_KEY"], "text": text, "sent_scores": False, "zero_retention": True})
    else:
        url = "https://api.gptzero.me/v2/predict/text"
        raw = request_bytes(url, {"document": text}, {"x-api-key": os.environ["GPTZERO_API_KEY"]})
    return parse_commercial(provider, json.loads(raw)), raw, url


def attach_result(sample, provider, result, evidence_hash=None, endpoint=None, version=None):
    score = finite_score(result.get("score"))
    analyzed = result.get("analyzedUtf16Units")
    if analyzed is not None and (type(analyzed) is not int or not 0 < analyzed <= sample["submittedUtf16Units"]):
        raise ValueError("Invalid analyzed coverage")
    label = result.get("classification")
    if label not in {"ai", "human", "mixed", None}:
        raise ValueError("Unknown provider classification")
    return {"schema": SCHEMA, "sampleId": sample["sampleId"], "inputSha256": sample["inputSha256"],
        "provider": provider, "status": "completed", "observedAt": utc_now(),
        "submittedCharacters": sample["submittedCharacters"], "submittedUtf16Units": sample["submittedUtf16Units"],
        "documentExcerptFraction": sample["submittedCharacters"] / sample["originalCharacters"],
        "providerSnapshot": version, "modelVersion": None, "endpoint": endpoint, "evidenceSha256": evidence_hash,
        **result, "score": score}


def summarize(samples, results):
    rows = []
    for sample in samples:
        records = [x for x in results if x["sampleId"] == sample["sampleId"]]
        classes = {x.get("classification") for x in records if x["status"] == "completed" and x.get("classification") is not None}
        rows.append({"sampleId": sample["sampleId"], "inputSha256": sample["inputSha256"],
            "referenceLabel": sample.get("referenceLabel"), "labelBasis": sample.get("labelBasis"),
            "results": records, "classificationDisagreement": len(classes) > 1})
    return {"schema": SCHEMA, "createdAt": utc_now(), "samples": rows,
        "completed": sum(x["status"] == "completed" for x in results), "unavailable": sum(x["status"] != "completed" for x in results),
        "interpretation": "Small excerpt comparison, not a representative accuracy benchmark. Scores have different semantics and are not averaged. Provider agreement is not ground truth or independent evidence. Missing results are unavailable, never zero. Source labels are not replaced by provider predictions."}


def run(samples, providers, output_dir, allow_remote=False, allow_billed=False, model_dir=None):
    check_remote_consent(providers, allow_remote, allow_billed)
    if len(samples) * len(providers) > 48 or len(samples) > 16 or len(set(providers)) != len(providers):
        raise ValueError("At most 16 samples, 48 comparisons, and unique providers")
    for sample in samples:
        validate_sample(sample)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=False)
    (output_dir / "evidence").mkdir()
    (output_dir / "samples.jsonl").write_text("".join(json.dumps(x, ensure_ascii=False) + "\n" for x in samples))
    versions, detector = {}, None
    for provider in providers:
        if provider == "ipc":
            from runtime import Detector
            detector = Detector(model_dir or ROOT / ".local/ml-model-v2")
        elif provider in SPECS:
            try:
                raw = request_bytes("https://huggingface.co/api/spaces/" + SPECS[provider]["space"])
                info = json.loads(raw)
                versions[provider] = {"spaceRevision": info.get("sha"), "runtimeStage": info.get("runtime", {}).get("stage"), "modelId": SPECS[provider]["model"]}
            except Exception as error:
                versions[provider] = {"metadataUnavailable": type(error).__name__}
    results = []
    for sample in samples:
        for provider in providers:
            try:
                if provider == "ipc":
                    response = detector.predict(sample["text"])
                    raw = json.dumps(response, allow_nan=False).encode()
                    parsed = {"score": response["score"], "classification": response["label"], "scoreMeaning": "uncalibrated_ipc_model_confidence", "modelVersion": response["modelVersion"], "analyzedUtf16Units": response["analyzedCharacters"]}
                    endpoint = "local-in-process"
                else:
                    parsed, raw, endpoint = call_provider(provider, sample["text"])
                evidence_path = output_dir / "evidence" / f"{sample['sampleId']}-{provider}.txt"
                evidence_path.write_bytes(raw)
                record = attach_result(sample, provider, parsed, digest(raw), endpoint, versions.get(provider))
                record["evidenceFile"] = str(evidence_path.relative_to(output_dir))
            except Exception as error:
                # Never persist response bodies or exception strings that could echo credentials/text.
                record = {"schema": SCHEMA, "sampleId": sample["sampleId"], "inputSha256": sample["inputSha256"],
                    "provider": provider, "status": "unavailable", "score": None, "classification": None,
                    "observedAt": utc_now(), "errorType": type(error).__name__, "httpStatus": error.code if isinstance(error, HTTPError) else None}
            results.append(record)
            with (output_dir / "results.jsonl").open("a") as handle:
                handle.write(json.dumps(record, allow_nan=False) + "\n")
            if provider != "ipc":
                time.sleep(1)  # Modest sequential public-demo use; no retry loops.
    report = summarize(samples, results)
    (output_dir / "report.json").write_text(json.dumps(report, indent=2, allow_nan=False))
    return report


def import_manual(samples, observations, evidence_root):
    """Import actual observations only, bound to exact text and saved evidence."""
    by_id = {x["sampleId"]: validate_sample(x) for x in samples}
    root = Path(evidence_root).resolve()
    results = []
    seen = set()
    for row in observations:
        sample = by_id.get(row.get("sampleId"))
        if not sample or row.get("inputSha256") != sample["inputSha256"]:
            raise ValueError("Manual observation does not match the exact sample hash")
        provider = row.get("provider")
        if not isinstance(provider, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,80}", provider):
            raise ValueError("Manual observations require a provider name")
        if (sample["sampleId"], provider) in seen:
            raise ValueError("Duplicate provider observation")
        seen.add((sample["sampleId"], provider))
        observed = datetime.fromisoformat(row.get("observedAt", "").replace("Z", "+00:00"))
        if observed.tzinfo is None:
            raise ValueError("Observation time needs a timezone")
        path = (root / row.get("evidenceFile", "")).resolve()
        if not path.is_relative_to(root) or not path.is_file() or digest(path.read_bytes()) != row.get("evidenceSha256"):
            raise ValueError("Manual evidence file/hash is invalid")
        status = row.get("status")
        if status not in {"completed", "unavailable"}:
            raise ValueError("Manual status must be completed or unavailable")
        if status == "completed":
            if row.get("scoreMeaning") not in {"binary_classifier_confidence", "provider_ai_probability", "provider_ai_only_class_probability", "provider_ai_content_fraction", "unknown_vendor_score"}:
                raise ValueError("State the actual displayed score semantics")
            scale = row.get("scoreScale")
            if scale not in {"0-1", "0-100"}:
                raise ValueError("Manual observation requires explicit score scale")
            normalized = finite_score(row.get("displayedScore"), 1 if scale == "0-1" else 100) / (1 if scale == "0-1" else 100)
            record = attach_result(sample, provider, {"score": normalized, "scoreMeaning": row["scoreMeaning"], "classification": row.get("classification"), "analyzedUtf16Units": row.get("analyzedUtf16Units")}, row["evidenceSha256"])
        else:
            if row.get("displayedScore") is not None:
                raise ValueError("Unavailable observations cannot carry a score")
            record = {"schema": SCHEMA, "sampleId": sample["sampleId"], "inputSha256": sample["inputSha256"], "provider": provider, "status": status, "score": None, "classification": None}
        record.update({"observedAt": row["observedAt"], "evidenceFile": row["evidenceFile"], "evidenceSha256": row["evidenceSha256"], "observationMethod": "manual_import"})
        results.append(record)
    return summarize(samples, results)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("prepare", help="Create explicit shared excerpts from a public labeled JSONL corpus")
    p.add_argument("--input", required=True); p.add_argument("--output", required=True)
    p.add_argument("--source-url", required=True); p.add_argument("--count", type=int, default=4); p.add_argument("--max-chars", type=int, default=900)
    p.add_argument("--confirm-public-source", action="store_true", required=True)
    r = sub.add_parser("run", help="No remote or keyed provider runs without explicit opt-in")
    r.add_argument("--samples", required=True); r.add_argument("--output-dir", required=True)
    r.add_argument("--providers", nargs="+", default=["ipc"]); r.add_argument("--ipc-model")
    r.add_argument("--allow-remote-public-text", action="store_true")
    r.add_argument("--allow-potentially-billed-api", action="store_true")
    m = sub.add_parser("import", help="Import exact hashed observations, including saved evidence")
    m.add_argument("--samples", required=True); m.add_argument("--observations", required=True); m.add_argument("--evidence-root", required=True); m.add_argument("--output", required=True)
    args = parser.parse_args()
    if args.command == "prepare":
        rows = prepare_samples(args.input, args.output, args.source_url, args.count, args.max_chars)
        print(json.dumps({"samples": len(rows), "output": args.output}))
    elif args.command == "run":
        report = run(load_samples(args.samples), args.providers, args.output_dir, args.allow_remote_public_text, args.allow_potentially_billed_api, args.ipc_model)
        print(json.dumps({"completed": report["completed"], "unavailable": report["unavailable"], "report": str(Path(args.output_dir) / "report.json")}))
    else:
        rows = [json.loads(x) for x in Path(args.observations).read_text().splitlines() if x.strip()]
        report = import_manual(load_samples(args.samples), rows, args.evidence_root)
        with Path(args.output).open("x") as handle:
            json.dump(report, handle, indent=2, allow_nan=False)
        print(json.dumps({"completed": report["completed"], "unavailable": report["unavailable"], "report": args.output}))


if __name__ == "__main__":
    main()
