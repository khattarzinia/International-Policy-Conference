"""Integrity checks for real source artifacts and generated-paper descendants."""
from __future__ import annotations

from collections import defaultdict
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from common import ROOT, load_jsonl, sha256
from prepare_mun_training import normalized_hash
from prepare_v4_data import domain_rows


class SourceIntegrityTests(unittest.TestCase):
    def fixture(self, directory):
        text_path = directory / "paper.txt"
        text_path.write_text("Delegation policy and research evidence. " * 40)
        pdf_path = directory / "paper.pdf"
        pdf_path.write_bytes(b"fixture artifact whose bytes must remain unchanged")
        source = dict(source_id="paper-one", parent_document_id="pdf-one",
                      parent_bundle_id="delegation-bundle", committee_topic_group_id="conference-year-agenda",
                      text_path=str(text_path), text_sha256=sha256(text_path),
                      pdf_path=str(pdf_path), pdf_sha256=sha256(pdf_path),
                      year=2016, school_group_id="institution", source_url="https://example.invalid/paper.pdf")
        manifest = directory / "manifest.jsonl"
        manifest.write_text(json.dumps(source) + "\n")
        return manifest, source, text_path, pdf_path

    def test_changed_source_text_is_rejected_even_if_manifest_is_unchanged(self):
        with tempfile.TemporaryDirectory() as temporary:
            manifest, _, text, _ = self.fixture(Path(temporary))
            self.assertEqual(len(domain_rows(manifest, [], "nmun")), 1)
            text.write_text(text.read_text() + " Unrecorded edit.")
            with self.assertRaisesRegex(ValueError, "text differs"):
                domain_rows(manifest, [], "nmun")

    def test_changed_parent_pdf_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            manifest, _, _, pdf = self.fixture(Path(temporary))
            pdf.write_bytes(pdf.read_bytes() + b"changed")
            with self.assertRaisesRegex(ValueError, "PDF differs"):
                domain_rows(manifest, [], "nmun")

    def test_generated_descendant_inherits_real_parent_bundle(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            manifest, source, _, _ = self.fixture(directory)
            generated = directory / "synthetic.jsonl"
            item = dict(record_id="generated-one", source_document_id=source["source_id"],
                        parent_bundle_id="untrusted-other-bundle", label=1,
                        scores_seen_before_freeze=False, text="Original generated policy proposal. " * 40)
            generated.write_text(json.dumps(item) + "\n")
            rows = domain_rows(manifest, [generated], "nmun")
            self.assertEqual({r["source_id"] for r in rows}, {"delegation-bundle"})
            self.assertEqual({r["paired_source_id"] for r in rows}, {"paper-one"})
            item["scores_seen_before_freeze"] = True
            generated.write_text(json.dumps(item) + "\n")
            with self.assertRaisesRegex(ValueError, "score-blind"):
                domain_rows(manifest, [generated], "nmun")


NMUN = ROOT / ".local/mun-expansion/nmun/manifest.jsonl"


@unittest.skipUnless(NMUN.exists(), "Historical source PDFs are local-only research assets")
class CollectedNMUNIntegrityTests(unittest.TestCase):
    def test_all_recorded_artifacts_match_and_proxy_labels_stay_honest(self):
        records = load_jsonl(NMUN)
        self.assertTrue(records)
        for row in records:
            with self.subTest(source=row["source_id"]):
                for path_key, hash_key in [("pdf_path", "pdf_sha256"), ("text_path", "text_sha256"),
                                           ("raw_text_path", "raw_text_sha256")]:
                    self.assertEqual(sha256(ROOT / row[path_key]), row[hash_key])
                self.assertEqual(row["label"], 0)
                self.assertEqual(row["label_kind"], "historical_human_proxy")
                self.assertIs(row["authorship_verified"], False)
                self.assertIs(row["reuse_permission_verified"], False)
        self.assertEqual(len(records), len({r["normalized_text_sha256"] for r in records}))

    def test_pdf_siblings_and_single_delegation_stay_in_one_bundle(self):
        records = load_jsonl(NMUN)
        pdf_groups = defaultdict(set)
        delegation_groups = defaultdict(set)
        for row in records:
            pdf_groups[row["pdf_sha256"]].add(row["parent_bundle_id"])
            delegation_groups[(row["year"], row["school_group_id"], row["delegation"])].add(row["parent_bundle_id"])
        self.assertTrue(all(len(groups) == 1 for groups in pdf_groups.values()))
        self.assertTrue(all(len(groups) == 1 for groups in delegation_groups.values()))
        macewan = [r for r in records if r["school_group_id"] == "macewan-university"]
        self.assertGreater(len({r["parent_document_id"] for r in macewan}), 1)
        self.assertEqual(len({r["parent_bundle_id"] for r in macewan}), 1)


V3 = ROOT / ".local/ml-data-v3"
V4 = ROOT / ".local/ml-data-v4"
EXCERPTS = {"mun_test_excerpt250": "mun_test", "srmun_test_excerpt500": "srmun_test"}


def record_fingerprint(row):
    """Compare every field while ignoring JSON serialization whitespace/order."""
    return hashlib.sha256(json.dumps(row, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()


@unittest.skipUnless((V4 / "provenance.json").exists(), "Needs the finalized local v4 corpus")
class FrozenV4IntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.provenance = json.loads((V4 / "provenance.json").read_text())
        cls.baseline = json.loads((V3 / "provenance.json").read_text())
        cls.rows = {}
        # Keep only identifiers/hashes in memory, not the full training/test prose.
        fields = ("record_id", "label", "source_id", "source_document_id", "parent_document_id",
                  "conference_family", "paired_source_id", "committee_topic_group_id", "school_group_id",
                  "parent_evaluation_record_id")
        for split in cls.provenance["splits"]:
            values = []
            with (V4 / f"{split}.jsonl").open(encoding="utf-8") as handle:
                for line in handle:
                    row = json.loads(line)
                    values.append({**{key: row.get(key) for key in fields},
                                   "normalized_text_hash": normalized_hash(row["text"]),
                                   "record_fingerprint": record_fingerprint(row)})
            cls.rows[split] = values

    def test_all_frozen_files_match_recorded_hashes_and_counts(self):
        for split, details in self.provenance["splits"].items():
            with self.subTest(split=split):
                self.assertEqual(sha256(V4 / f"{split}.jsonl"), details["sha256"])
                self.assertEqual(len(self.rows[split]), details["examples"])
                self.assertEqual(len(self.rows[split]), len({r["record_id"] for r in self.rows[split]}))

    def test_every_v3_training_record_survives_unchanged(self):
        self.assertEqual(sha256(V3 / "train.jsonl"), self.baseline["splits"]["train"]["sha256"])
        current = {r["record_id"]: r["record_fingerprint"] for r in self.rows["train"]}
        previous_ids = set()
        with (V3 / "train.jsonl").open(encoding="utf-8") as handle:
            for line in handle:
                row = json.loads(line)
                previous_ids.add(row["record_id"])
                self.assertEqual(current.get(row["record_id"]), record_fingerprint(row), row["record_id"])
        self.assertEqual(len(previous_ids), self.provenance["retainedV3TrainingExamples"])

    def test_all_previous_nontraining_files_remain_byte_identical(self):
        for split, details in self.baseline["splits"].items():
            if split == "train":
                continue
            with self.subTest(split=split):
                original_hash = sha256(V3 / f"{split}.jsonl")
                self.assertEqual(original_hash, details["sha256"])
                self.assertEqual(sha256(V4 / f"{split}.jsonl"), original_hash)

    def test_training_does_not_share_source_parent_record_or_text_with_evaluations(self):
        training = self.rows["train"]
        for split, evaluation in self.rows.items():
            if split == "train" or split in EXCERPTS:
                continue
            for field in ("record_id", "source_id", "source_document_id", "parent_document_id", "normalized_text_hash"):
                with self.subTest(split=split, identifier=field):
                    train_ids = {r[field] for r in training if r.get(field)}
                    evaluation_ids = {r[field] for r in evaluation if r.get(field)}
                    self.assertFalse(train_ids & evaluation_ids)

    def test_srmun_occurs_only_in_final_evaluation(self):
        found = []
        for split, rows in self.rows.items():
            for row in rows:
                if row["conference_family"] == "srmun":
                    found.append(row)
                    self.assertIn(split, {"srmun_test", "srmun_test_excerpt500"})
        self.assertTrue(found)
        self.assertEqual({r["label"] for r in self.rows["srmun_test"]}, {0, 1})
        self.assertNotIn("srmun_test", self.provenance["validationSplits"])

    def test_nmun_bundle_and_topic_splits_follow_collected_parents(self):
        parents = {r["source_id"]: r for r in load_jsonl(NMUN)}
        group_splits, topic_splits, schools = defaultdict(set), defaultdict(set), defaultdict(set)
        found = []
        for split, rows in self.rows.items():
            for row in rows:
                if row["conference_family"] != "nmun":
                    continue
                found.append(row)
                source = parents[row["paired_source_id"]]
                self.assertEqual(row["source_id"], source["parent_bundle_id"])
                self.assertEqual(row["parent_document_id"], source["parent_document_id"])
                self.assertEqual(row["source_document_id"], source["pdf_sha256"])
                self.assertEqual(row["committee_topic_group_id"], source["committee_topic_group_id"])
                self.assertEqual(split, self.provenance["nmunParentReportAssignments"][source["parent_bundle_id"]])
                self.assertIn(split, {"train", "nmun_validation"})
                group_splits[source["parent_bundle_id"]].add(split)
                topic_splits[source["committee_topic_group_id"]].add(split)
                schools[source["school_group_id"]].add(split)
        self.assertTrue(found)
        self.assertTrue(all(len(splits) == 1 for splits in group_splits.values()))
        self.assertTrue(all(len(splits) == 1 for splits in topic_splits.values()))
        actual_school_overlap = {school for school, splits in schools.items() if len(splits) > 1}
        self.assertEqual(actual_school_overlap, set(self.provenance["nmunSchoolsInBothTrainingAndValidation"]))

    def test_excerpts_reference_only_their_heldout_originals(self):
        # These deliberate repeated observations are excluded from independence
        # counts above, but must remain attached to the original held-out rows.
        for excerpt_split, original_split in EXCERPTS.items():
            originals = {r["record_id"]: r for r in self.rows[original_split]}
            for row in self.rows[excerpt_split]:
                original = originals[row["parent_evaluation_record_id"]]
                for field in ("source_id", "parent_document_id", "source_document_id", "label"):
                    self.assertEqual(row[field], original[field])


if __name__ == "__main__":
    unittest.main()
