"""Audit actual prepared expansion for protected-evaluation leakage."""
from collections import Counter
import json
import unittest

from common import ROOT, load_jsonl, sha256
from runtime import Detector


@unittest.skipUnless((ROOT / ".local/ml-data-v2/provenance.json").exists(), "Prepare the expanded corpus before its data audit")
class ExpandedDataAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.old = ROOT / ".local/ml-data"
        cls.new = ROOT / ".local/ml-data-v2"
        cls.provenance = json.loads((cls.new / "provenance.json").read_text())
        cls.training = load_jsonl(cls.new / "train.jsonl")
        cls.evaluations = {split: load_jsonl(cls.new / f"{split}.jsonl") for split in ["validation", "test", "heldout_generator"]}

    def test_frozen_evaluation_bytes_are_identical(self):
        for split in self.evaluations:
            self.assertEqual(sha256(self.old / f"{split}.jsonl"), sha256(self.new / f"{split}.jsonl"))
            self.assertEqual(len(self.evaluations[split]), 800)

    def test_no_protected_source_or_text_is_used_for_training(self):
        sources = {row["source_id"] for rows in self.evaluations.values() for row in rows}
        texts = {row["text_sha256"] for rows in self.evaluations.values() for row in rows}
        self.assertFalse(sources & {row["source_id"] for row in self.training})
        self.assertFalse(texts & {row["text_sha256"] for row in self.training})

    def test_larger_balanced_training_and_original_examples_retained(self):
        labels = Counter(row["label"] for row in self.training)
        self.assertGreaterEqual(len(self.training), 20000)
        self.assertEqual(labels[0], labels[1])
        old_ids = {row["record_id"] for row in load_jsonl(self.old / "train.jsonl")}
        self.assertTrue(old_ids <= {row["record_id"] for row in self.training})
        groups = Counter((row["source_id"], row["label"]) for row in self.training)
        self.assertLessEqual(max(groups.values()), self.provenance["sourceClassCap"])

    def test_heldout_generator_and_attribution(self):
        self.assertFalse(any(row["model"] == "deepseek-v4-flash-0731" for row in self.training))
        self.assertTrue(all(row["source_license"] and row["source_url"] and row["source_document_id"] for row in self.training))
        self.assertEqual(self.provenance["datasetRevision"], "d458a1676e0be8155c29cab3a550283dd1ef9476")

    def test_v1_weights_and_known_predictions_remain_unchanged(self):
        self.assertEqual(sha256(ROOT / ".local/ml-model/model.safetensors"), sha256(ROOT / ".local/ml-model-v1/model.safetensors"))
        detector = Detector(ROOT / ".local/ml-model-v1")
        expected = {"14920": .001815, "43567": .993323}
        rows = {row["record_id"]: row for row in self.evaluations["heldout_generator"]}
        for record_id, score in expected.items():
            result = detector.predict(rows[record_id]["text"])
            self.assertAlmostEqual(result["score"], score, places=5)
            self.assertEqual(result["scoreAdjustment"], "none")

    @unittest.skipUnless((ROOT / ".local/ml-model-v2/metadata.json").exists(), "Train v2 before checking its runtime variant")
    def test_v2_defaults_to_raw_confidence_with_calibration_disabled(self):
        detector = Detector(ROOT / ".local/ml-model-v2")
        self.assertFalse(detector.metadata["validationCalibrationEnabled"])
        self.assertEqual(detector.metadata["scoreVariant"], "raw")
        result = detector.predict(self.evaluations["heldout_generator"][0]["text"])
        self.assertEqual(result["score"], result["rawScore"])
        self.assertEqual(result["scoreAdjustment"], "none")
        self.assertEqual(result["scoreType"], "model_confidence")


if __name__ == "__main__":
    unittest.main()
