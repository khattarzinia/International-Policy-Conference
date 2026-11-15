"""Regression checks for source leakage and training/serving score parity."""
import json
from pathlib import Path
import tempfile
import unittest

from common import ROOT, load_jsonl, sha256
from compare_models import compare
from evaluate_candidate import wilson_interval
from prepare_mun_training import assign_splits, group_documents, normalized_hash
from runtime import Detector, window_indices
from train import predict_token_documents, load_training_records, low_false_positive_rank
from prepare_v4_data import near_duplicate_pairs


class SplitTests(unittest.TestCase):
    def test_validation_only_never_opens_a_test_file(self):
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            metadata = {"validationSplits": ["validation", "nmun_validation"], "splits": {}}
            for name in ["train", "validation", "nmun_validation"]:
                path = directory / f"{name}.jsonl"
                path.write_text('{"label": 0}\n')
                metadata["splits"][name] = {"sha256": sha256(path)}
            # A nonexistent test path would fail if the training loader opened it.
            metadata["splits"]["fresh_public_test"] = {"sha256": "must-never-be-read"}
            records, validations = load_training_records(directory, metadata, True)
            self.assertEqual(set(records), {"train", "validation", "nmun_validation"})
            self.assertEqual(validations, ["validation", "nmun_validation"])
            with self.assertRaises(FileNotFoundError):
                load_training_records(directory, metadata, False)

    def test_false_positive_objective_keeps_human_safety_ahead_of_recall(self):
        def metric(fp, recall):
            return {"humanExamples": 100, "aiExamples": 100, "falsePositiveRateAtHalf": fp,
                    "truePositiveRateAtHalf": recall, "auroc": .99}
        self.assertGreater(low_false_positive_rank([metric(0, .95), metric(0, .9)]),
                           low_false_positive_rank([metric(.01, 1), metric(0, 1)]))
        self.assertGreater(low_false_positive_rank([metric(0, .95), metric(0, .9)]),
                           low_false_positive_rank([metric(0, 1), metric(0, .8)]))
        with self.assertRaises(ValueError):
            low_false_positive_rank([{**metric(0, 1), "aiExamples": 0}])

    def test_indexed_near_duplicate_check_catches_contained_paper(self):
        body = " ".join(f"word{i}" for i in range(250))
        rows = [{"text": body}, {"text": "new introduction " + body + " new conclusion"},
                {"text": " ".join(f"different{i}" for i in range(250))}]
        self.assertEqual(near_duplicate_pairs(rows), [(1, 0)])

    def test_parent_topic_and_descendants_never_cross_splits(self):
        rows = [{"source_id": f"topic-{g}", "label": label, "record_id": f"{g}-{label}"}
                for g in range(20) for label in [0, 1]]
        splits, assignment = assign_splits(rows)
        sets = [{r["source_id"] for r in splits[name]} for name in splits]
        self.assertTrue(all(not sets[a] & sets[b] for a in range(3) for b in range(a + 1, 3)))
        self.assertEqual(len(assignment), 20)
        self.assertTrue(all(len(r) >= 4 for r in splits.values()))

    def test_near_copies_with_different_source_ids_stay_together(self):
        body = " ".join(f"word{i}" for i in range(250))
        rows = [{"source_id": "topic-a", "record_id": "a", "text": body},
                {"source_id": "topic-b", "record_id": "b", "text": "Preamble " + body + " Conclusion"},
                {"source_id": "topic-c", "record_id": "c", "text": " ".join(f"other{i}" for i in range(250))}]
        pairs = group_documents(rows)
        self.assertEqual(len(pairs), 1)
        self.assertEqual(rows[0]["source_id"], rows[1]["source_id"])
        self.assertNotEqual(rows[0]["source_id"], rows[2]["source_id"])

    def test_zero_observed_false_positives_does_not_imply_zero_risk(self):
        interval = wilson_interval(0, 30)
        self.assertGreater(interval[1], .1)
        self.assertIsNone(wilson_interval(0, 0))

    def test_legacy_report_cannot_compare_different_window_budgets(self):
        with tempfile.TemporaryDirectory() as directory:
            paths = [Path(directory) / name for name in ["old", "new"]]
            for path, metadata in zip(paths, [{}, {"evaluationMaxWindows": 32}]):
                path.mkdir()
                (path / "metadata.json").write_text(json.dumps(metadata))
            with self.assertRaisesRegex(ValueError, "same serving path"):
                compare(*paths)


@unittest.skipUnless((ROOT / ".local/ml-model-v2/model.safetensors").exists(), "Needs actual v2 checkpoint")
class ServingParity(unittest.TestCase):
    def test_long_documents_have_same_training_and_serving_scores(self):
        detector = Detector(ROOT / ".local/ml-model-v2")
        rows = load_jsonl(ROOT / ".local/ml-data-v2/test.jsonl")
        document = "\n\n".join(r["text"] for r in rows[:6])[:60000]
        ids = detector.tokenizer(document, add_special_tokens=False, truncation=False)["input_ids"]
        self.assertGreater(len(window_indices(len(ids))), 8)
        score = predict_token_documents(detector.model, detector.tokenizer, [ids], detector.device)[0]
        self.assertAlmostEqual(score, detector.predict(document)["rawScore"], places=5)


@unittest.skipUnless((ROOT / ".local/ml-data-v3/provenance.json").exists(), "Prepare MUN corpus first")
class FrozenCorpusAudit(unittest.TestCase):
    def test_frozen_public_evaluations_and_v2_training_retained(self):
        directory = ROOT / ".local/ml-data-v3"
        metadata = json.loads((directory / "provenance.json").read_text())
        for split in ["validation", "test", "heldout_generator"]:
            self.assertEqual(sha256(directory / f"{split}.jsonl"), sha256(ROOT / f".local/ml-data-v2/{split}.jsonl"))
        training = load_jsonl(directory / "train.jsonl")
        old = load_jsonl(ROOT / ".local/ml-data-v2/train.jsonl")
        self.assertTrue({r["record_id"] for r in old} <= {r["record_id"] for r in training})
        self.assertEqual(metadata["retainedV2TrainingExamples"], len(old))

    def test_no_domain_parent_topic_or_text_leaks_into_evaluation(self):
        directory = ROOT / ".local/ml-data-v3"
        splits = {s: load_jsonl(directory / f"{s}.jsonl") for s in ["train", "mun_validation", "mun_test"]}
        for key in ["source_id", "parent_document_id", "text_sha256"]:
            sets = [{r[key] for r in rows if r.get(key)} for rows in splits.values()]
            self.assertTrue(all(not sets[a] & sets[b] for a in range(3) for b in range(a + 1, 3)), key)
        for row in [r for rows in splits.values() for r in rows if r["domain"] == "mun_position_paper"]:
            self.assertEqual(row["text_sha256"], normalized_hash(row["text"]))
            if row["label"] == 0:
                self.assertFalse(row["authorship_verified"])
                self.assertEqual(row["label_evidence"], "historical_human_proxy")


if __name__ == "__main__":
    unittest.main()
