"""Protocol/evidence tests; these do not claim remote detector accuracy."""
import copy
import json
from pathlib import Path
import tempfile
import unittest

from compare_external import (
    attach_result, check_remote_consent, digest, import_manual, load_samples,
    parse_commercial, parse_gradio, parse_sse, prepare_samples, summarize,
    utf16_length, validate_sample,
)


def sample():
    text = "Public research fixture. " * 20 + "🌏"
    return {"sampleId": "test-1", "dataScope": "synthetic", "sourceUrl": "https://example.org/fixture",
        "text": text, "inputSha256": digest(text), "originalSha256": digest(text),
        "submittedCharacters": len(text), "submittedUtf16Units": utf16_length(text),
        "originalCharacters": len(text), "referenceLabel": 1, "labelBasis": "synthetic_fixture"}


class ExternalComparisonTests(unittest.TestCase):
    def test_exact_text_hash_and_unicode_units_are_required(self):
        s = sample()
        self.assertEqual(validate_sample(s), s)
        self.assertEqual(s["submittedUtf16Units"], s["submittedCharacters"] + 1)
        for patch in [{"text": s["text"] + "x"}, {"submittedUtf16Units": len(s["text"])}, {"dataScope": "private"}, {"originalCharacters": 1}]:
            with self.assertRaises(ValueError):
                validate_sample({**s, **patch})

    def test_remote_and_potential_billing_need_separate_optins(self):
        check_remote_consent(["ipc"], env={})
        with self.assertRaises(ValueError):
            check_remote_consent(["fakespot"], env={})
        check_remote_consent(["fakespot", "radar"], allow_remote=True, env={})
        with self.assertRaises(ValueError):
            check_remote_consent(["sapling"], allow_remote=True, env={"SAPLING_API_KEY": "test"})
        with self.assertRaises(ValueError):
            check_remote_consent(["gptzero"], allow_remote=True, allow_billed=True, env={})
        with self.assertRaises(ValueError):
            check_remote_consent(["unknown"], allow_remote=True, env={})

    def test_actual_zero_preserved_missing_nan_and_wrong_classes_rejected(self):
        result = [{"label": "Human", "confidences": [{"label": "Human", "confidence": 1}, {"label": "AI", "confidence": 0}]}]
        self.assertEqual(parse_gradio("fakespot", result)["score"], 0)
        self.assertIsNone(parse_gradio("fakespot", result)["analyzedUtf16Units"])
        for value in [None, "0.7", float("nan"), True, -0.1, 1.1]:
            bad = copy.deepcopy(result)
            bad[0]["confidences"][1]["confidence"] = value
            with self.assertRaises(ValueError):
                parse_gradio("fakespot", bad)
        with self.assertRaises(ValueError):
            parse_gradio("radar", result)
        with self.assertRaises(ValueError):
            parse_gradio("fakespot", [{"label": "AI"}])

    def test_duplicate_classes_and_conflicting_label_rejected(self):
        for result in [
            [{"label": "AI", "confidences": [{"label": "AI", "confidence": .5}, {"label": "AI", "confidence": .5}]}],
            [{"label": "AI", "confidences": [{"label": "AI", "confidence": .1}, {"label": "Human", "confidence": .9}]}],
        ]:
            with self.assertRaises(ValueError):
                parse_gradio("fakespot", result)

    def test_sse_error_and_missing_completion_are_not_clean_results(self):
        self.assertEqual(parse_sse(b'event: heartbeat\ndata: null\n\nevent: complete\ndata: [{"label":"Human"}]\n\n'), [{"label": "Human"}])
        for raw in [b'event: error\ndata: null\n', b'event: heartbeat\ndata: null\n']:
            with self.assertRaises(ValueError):
                parse_sse(raw)

    def test_provider_semantics_are_kept_separate(self):
        gpt = parse_commercial("gptzero", {"documents": [{"predicted_class": "mixed", "class_probabilities": {"ai": 0, "mixed": .9, "human": .1}}]})
        sapling = parse_commercial("sapling", {"score": .8, "ai_fraction": .2, "verdict": "mixed"})
        self.assertEqual(gpt["score"], 0)
        self.assertEqual(gpt["classification"], "mixed")
        self.assertEqual(gpt["scoreMeaning"], "provider_ai_only_class_probability")
        self.assertEqual(sapling["score"], .8)
        self.assertEqual(sapling["providerAiFraction"], .2)
        self.assertNotEqual(gpt["scoreMeaning"], sapling["scoreMeaning"])
        with self.assertRaises(ValueError):
            parse_commercial("sapling", {})

    def test_unknown_coverage_stays_unknown_and_cannot_exceed_input(self):
        s = sample()
        r = attach_result(s, "test", {"score": .7, "classification": "ai", "scoreMeaning": "unknown_vendor_score", "analyzedUtf16Units": None})
        self.assertIsNone(r["analyzedUtf16Units"])
        self.assertEqual(r["documentExcerptFraction"], 1)
        with self.assertRaises(ValueError):
            attach_result(s, "test", {"score": .7, "classification": "ai", "analyzedUtf16Units": s["submittedUtf16Units"] + 1})

    def test_disagreement_does_not_overwrite_source_label_or_average(self):
        s = sample()
        a = attach_result(s, "one", {"score": .1, "classification": "human", "scoreMeaning": "binary_classifier_confidence"})
        b = attach_result(s, "two", {"score": .8, "classification": "ai", "scoreMeaning": "provider_ai_content_fraction"})
        report = summarize([s], [a, b, {"sampleId": s["sampleId"], "status": "unavailable", "score": None}])
        self.assertTrue(report["samples"][0]["classificationDisagreement"])
        self.assertEqual(report["samples"][0]["referenceLabel"], 1)
        self.assertEqual(report["completed"], 2)
        self.assertEqual(report["unavailable"], 1)
        self.assertNotIn("average", report["samples"][0])

    def test_manual_observations_bound_to_both_input_and_evidence(self):
        s = sample()
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            evidence = b"Actual human-observed fixture response: AI 0%"
            (root / "capture.txt").write_bytes(evidence)
            row = {"sampleId": s["sampleId"], "inputSha256": s["inputSha256"], "provider": "manual-provider",
                "status": "completed", "displayedScore": 0, "scoreScale": "0-100", "scoreMeaning": "unknown_vendor_score",
                "observedAt": "2026-10-31T00:00:00Z", "evidenceFile": "capture.txt", "evidenceSha256": digest(evidence)}
            self.assertEqual(import_manual([s], [row], root)["samples"][0]["results"][0]["score"], 0)
            for patch in [{"inputSha256": "0" * 64}, {"evidenceSha256": "0" * 64}, {"evidenceFile": "../outside.txt"}, {"observedAt": "2026-10-31"}, {"displayedScore": None}, {"scoreMeaning": "percentage_cheated"}, {"status": "unavailable"}]:
                with self.assertRaises(ValueError):
                    import_manual([s], [{**row, **patch}], root)
            with self.assertRaises(ValueError):
                import_manual([s], [row, row], root)

    def test_prepare_discloses_excerpt_and_refuses_to_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d)
            source = path / "source.jsonl"
            source.write_text("\n".join(json.dumps({"text": "A long public research paragraph. " * 50, "label": label}) for label in (0, 1)))
            out = path / "samples.jsonl"
            rows = prepare_samples(source, out, "https://example.org/dataset", 2, 500)
            self.assertTrue(all(x["submittedCharacters"] < x["originalCharacters"] for x in rows))
            self.assertEqual(len(load_samples(out)), 2)
            with self.assertRaises(FileExistsError):
                prepare_samples(source, out, "https://example.org/dataset", 2, 500)

    def test_prepare_preserves_authorship_evidence_and_synthetic_scope(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d)
            evidence = ["historical_human_proxy", "generated_in_recorded_codex_session"]
            source = path / "source.jsonl"
            source.write_text("\n".join(json.dumps({"text": "A long research paragraph. " * 50,
                "label": label, "label_evidence": evidence[label], "parent_document_id": "paper-1",
                "source_id": "topic-1"}) for label in (0, 1)))
            rows = prepare_samples(source, path / "samples.jsonl", "https://example.org/dataset", 2, 500)
            self.assertEqual([x["labelBasis"] for x in rows], evidence)
            self.assertEqual([x["dataScope"] for x in rows], ["public", "synthetic"])
            self.assertEqual([x["sourceParentRecordId"] for x in rows], ["paper-1", "paper-1"])
            self.assertEqual([x["sourceGroupId"] for x in rows], ["topic-1", "topic-1"])


if __name__ == "__main__":
    unittest.main()
