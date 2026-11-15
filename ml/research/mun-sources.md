# Historical MUN position-paper corpus

Collected 2026-10-31 for an IPC detector domain-shift experiment. The source is
the official [Model United Nations of Lubeck delegate archive](https://munol.org/conference/delegate-center/).
The archive exposes position papers for **2016, 2017 and 2019**, including
General Assembly, human rights, environment, economics, peacebuilding and
Security Council committees. These are actual archived student position papers,
not newly invented human examples or conference background guides.

The completed collection contains **225 PDFs / 45,964,053 bytes**: 106 from
2016, 63 from 2017, and 56 from 2019. All selected files downloaded and extracted
without errors. Expected historical years appear in the first 600 extracted
characters of 213 PDFs; the other 12 retain archive-year provenance only until
additional document review. School headers were recovered for 204 papers,
mapping conservatively to 45 institution groups. The grouping is heuristic and
does not certify school independence.

There are 206 papers with recovered topic headings/section spans, totaling 656
sections. Document lengths range from 329 to 3,447 words (median 977). No exact
normalized-text duplicates were found. A local lowercase five-word-shingle
audit flagged two near-duplicate pairs (shorter-text containment >= 0.35 or
Jaccard >= 0.25); both lie within existing conference-year/committee groups.
The audit details are in ignored `near-duplicates.json`. This simple check does
not prove that all paraphrases, repeated templates or reused background sources
have been detected.

## Evidence and authorship labels

Each PDF is linked from a year/committee folder on the conference's own website.
The manifest preserves that listing URL, its downloaded HTML hash, the visible
filename, the listing's modification value where available, the exact download
URL and the downloaded PDF SHA-256. The PDFs themselves carry historical
conference-year headers. The archive was fetched now: a year printed in an
archive and PDF is historical provenance, **not independent certification of
when every byte was first published or who wrote it**.

Records therefore use `label_type: historical_human_proxy`,
`authorship_verified: false`, and `label_confidence:
historical_provenance_not_verified_authorship`. The numeric `label: 0` is only
the experimental proxy class. Do not describe these as verified human-authored
competition submissions. Historical papers can include quotations, templates,
copying, teacher assistance, and editing; the archive does not prove otherwise.

## Local collection

```sh
.local/ml-venv/bin/python ml/collect_mun_archive.py \
  --per-directory 12 --max-papers 240 --max-mb 140 --workers 3
```

The collector uses the existing `requests` dependency and local Poppler
`pdftotext`; it makes no model calls. It visits the official folder links,
samples across the country-name ordering, downloads at most 240 PDFs with a
140 MB download ceiling, and rejects non-PDF responses and extracted bodies
shorter than 300 characters. Each PDF has an 8 MB cap. It does not OCR scans or
fill missing text with invented content.

All source material stays in ignored `.local/mun-data/`:

- `pdf/`: unchanged downloads.
- `raw-text/`: Poppler layout-preserving extraction.
- `text/`: body text with the first-page identity header and recurring page
  headers removed where recognized; layout line wraps are joined without
  rewriting the prose.
- `archive-pages/`: HTML provenance snapshots.
- `manifest.jsonl`: one record per downloaded paper, including extraction paths.
- `topics.jsonl`: topic/delegation/group metadata only, for matched synthetic
  examples. It contains no full paper body or student names.
- `summary.json`: actual counts, byte total, missing school/topic metadata,
  exact duplicate groups, and collection errors.

The WordPress download URLs contain changing nonces. For reproducibility use
`archive_url + archive_label`, then verify `pdf_sha256`; old download URLs may
expire. The collector re-discovers download links on every run and reuses local
PDFs. A new collection is not promised to be byte-identical if the public archive
changes.

## Manifest and split controls

Key fields include `source_id`, `parent_document_id`, `year`, `committee`,
`delegation`, `topics`, `school`, `school_group_id`, `conference_group_id`,
`committee_topic_group_id`, `template_family_id`, `source_url`, `archive_url`,
`archive_page_sha256`, `pdf_sha256`, `text_sha256`, `words`, `characters`, `pages`,
`text_path`, `label_type`, `authorship_verified`, `license`, and
`training_rights_status`.

`topic_sections` contains heading-derived start/end offsets into the unchanged
cleaned body, word counts and normalized text hashes. Offsets explicitly use
Unicode code points. A missing topic title or empty section list signals that
the heuristic did not confidently recover that structure; it is not filled in
by a model. Section excerpts must retain their whole-paper parent group.

No split is assigned by the collector. These keys serve distinct purposes:

1. `parent_document_id` and `source_group_id` identify the whole source paper.
   Every topic excerpt, perturbation, translated version and synthetic example
   prompted from its metadata must retain that parent and stay in one split.
2. `committee_topic_group_id` groups the common conference-year/committee
   assignment. Splitting country variants of the same assignment randomly is an
   easy way to leak topic and template cues.
3. `school_group_id` is heuristically extracted from the PDF header, with
   `school_parse_status` documenting uncertainty. Spelling variants and renamed
   schools need normalization before claiming school-disjoint evaluation.
   An unknown school is not evidence that it is distinct from known schools.
4. `conference_group_id` supports a strict conference-year holdout. A year split
   alone does not guarantee school or author independence.
5. `template_family_id` is shared by all MUNOL papers. This collection therefore
   cannot independently establish generalization to another conference's
   template or IPC policy briefs. Identity headers should not be predictive
   model inputs; compare equivalent body-only formatting for both classes.

`group_id` uses the parsed school when available, otherwise the conference-year
unknown-school group. It is a conservative convenience key, not a replacement
for all the constraints above. Exact normalized text duplicate groups are
reported; near-duplicate/template review is still required in data preparation.

## Rights and privacy

No explicit open redistribution or model-training licence was identified.
Public access does not establish either permission. Each record says
`redistribution_allowed: false` and `training_rights_status: unverified`.
Keep full text, PDFs, extracted names, and trained-data artifacts out of Git and
public releases. No private IPC submissions are collected, and no archived
paper is uploaded to an external detector by this collector.

The source PDFs often contain names and schools. Names remain only in the local
original and raw extraction; model body extraction removes the identity header
where recognized. School metadata exists to prevent leakage, not to infer
individual demographics or infer language background from names.

## Initial source review

Representative PDFs from 2016, 2017 and 2019 were rendered locally and visually
compared with their text extraction: headings, paragraphs and historical
headers are real, and the extractor preserves the body. Some originals contain
reused or inconsistent country headers; `delegation` is therefore the official
archive filename label and is not independently verified against geopolitical
content. Broader checks should use the actual collection summary.

The [NMUN archive](https://www.nmun.org/about-nmun/conference-archives/new-york/new-york-2019.html)
was inspected but primarily linked awards, background guides and resolutions,
so those were not substituted for position papers. The
[SRMUN top-paper index](https://www.srmun.org/papers/historical.php) initially
returned HTTP 406 to a default client. Subsequent collection succeeded with
ordinary descriptive request headers; see [the separate SRMUN source audit](other-mun-sources.md).

This dataset is useful for exposing false positives on authentic historical
MUN prose. It does not justify a promise of flawless AI detection.

## Subsequent full historical expansion

The same 20 historical MUNOL directories were expanded to every listed PDF:
365 archive entries (2016: 167; 2017: 89; 2019: 109), 74,633,286 PDF bytes,
321 parsed school headers and 55 normalized institutions. One exact duplicate
pair is recorded and excluded when preparing model data. These are therefore
364 distinct normalized texts, not 365 independent examples. This adds 140
archive entries to the initial collection; only new papers from previously
assigned training topic families can join V4 training. New papers from old
validation/test families remain reserved and unused.

Files are in ignored `.local/mun-expansion/munol/`. The collector supports
`--reuse-discovery` to reconstruct metadata from the saved archive manifest
and cached PDFs without repeating network downloads. Its output path is
resolved before recording repository-relative paths. A failed first metadata
pass caused by relative-path handling was repaired from cached downloads;
the successful final pass reports zero collection errors.
