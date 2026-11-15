# SRMUN external conference evaluation corpus

Collected on 2026-10-31 from the official [Southern Regional Model United Nations historical position-paper archive](https://www.srmun.org/papers/historical.php). This is a separate conference from the existing MUNOL corpus. The entire SRMUN collection is reserved for final evaluation: no training, validation, threshold tuning, feature selection or example selection using detector scores.

## Collection and provenance

`ml/collect_other_mun.py` collected 183 unique readable historical position papers, of which 182 are usable and one is quarantined. The usable records span 2008–2021, 54 institutions and 182 conference-city/year/committee groups. Raw PDF storage totals 21,114,205 bytes. One linked PDF returned HTTP 404, and five other archive entries were excluded before collection. The quarantine brings the exclusion log to six entries.

The archive identifies these as highest-scoring papers. It supplies the conference date and city, committee, delegation and represented institution. Each record preserves the official listing URL, direct PDF URL, exact filename, archive snapshot hash, source/group IDs, PDF metadata, extraction paths and hashes. Historical conference dates support a **human-authorship proxy**, not an individual authorship attestation. Neither the archive nor this collector verifies who wrote every sentence.

The collector uses Python's standard library and the installed Poppler `pdftotext` and `pdfinfo` utilities. PDFs are downloaded only from the public `www.srmun.org` host. A descriptive User-Agent and an ordinary Accept header are needed because the default urllib request received HTTP 406; no authentication, access-control workaround or paid service was used. Requests have timeouts and per-file/aggregate byte bounds. Extraction preserves wording and internal layout, removing only NUL characters and surrounding whitespace. It does not paraphrase, repair prose or infer missing text.

To reproduce into a separate local directory after installing Poppler:

```sh
python3 ml/collect_other_mun.py --output .local/mun-expansion/srmun-reproduction
```

Do not rerun into the frozen original directory. The upstream archive may change; the original HTML snapshot and hashes identify the version used here. The script's output path must remain inside the repository because manifest paths are stored relative to its root.

## Local files

All data are under ignored `.local/mun-expansion/other/`:

| File or directory | Purpose |
| --- | --- |
| `records.jsonl` | 182 usable human-proxy metadata records; no paper prose |
| `records-raw.jsonl` | All 183 collected metadata records, including quarantine |
| `topics.jsonl` | Metadata-only generation manifest with country, committee, agenda headings, year and source/group IDs |
| `pdf/`, `raw-text/`, `text/` | Original PDFs, Poppler output and minimally cleaned full text |
| `srmun-index.html` | Official archive snapshot used for provenance |
| `failures.jsonl`, `exclusions.jsonl` | Explicit failures, archive errors, genre exclusions and quarantine |
| `provenance.json`, `corpus-freeze.json` | Collection statistics and immutable evaluation hashes |
| `synthetic-heldout.jsonl` | 24 fresh AI-authored counterparts, with full prompts and generation provenance |
| `synthetic-heldout-freeze.json` | Synthetic freeze time, counts and hash |

`source_id`, `parent_document_id` and `source_group_id` identify the exact human source document. `conference_group_id` identifies city/year; `committee_topic_group_id` adds committee; `school_group_id` is derived from the official archive's institution column. Synthetic records preserve their paired human IDs and use the same committee/topic family as `prompt_family_id`. All descendants must stay with their source group. More strongly, the entire `conference_id=srmun` is excluded from model development.

Topic headings are extracted conservatively from numbered headings, without copying paragraphs into the prompt manifest. Extraction is not a fully verified agenda transcription: wrapped or unusual headings may be incomplete, and unselected records can contain a false heading. The 24 chosen pairs have coherent agenda metadata. Model-visible inspection during generation was limited to metadata; paired human prose was not read.

## Exclusions and QA

The collector reproducibly excludes court case briefs, a filename/year disagreement and a committee/filename disagreement. It preserves the official 404 failure for `nterpol_ireland_198.pdf`; no guessed replacement is silently substituted.

`ATL_2012_IAEA.pdf` is retained in raw storage and `records-raw.jsonl`, but excluded from `records.jsonl`, `topics.jsonl` and generation. Both its archive entry and PDF header identify Germany and the IAEA, while its three agenda headings match the 2012 General Assembly agenda. The collector contains the filename, observed PDF hash and rationale in `QUARANTINED`. This is an unresolved agenda/committee inconsistency, not proof of inauthentic authorship.

A 2018 China General Assembly paper was rendered and visually inspected as a PDF quality sample. That paper, two sources previously inspected through primary-source web text, and the quarantined 2012 paper are marked as ineligible for generation pairing. None is among the 24 generated pairs. Integrity checks recomputed every PDF hash and exact/normalized text hash, verified unique IDs and hashes, validated years and split flags, and resolved every synthetic parent to the frozen human manifest. These checks did not run any detector.

## Fresh AI counterparts

The 24 counterparts were composed directly in the current Codex subscription session using only the chosen sources' year, committee, delegation and topic metadata. They cover two papers per year from 2010 through 2021, with 24 distinct committee/topic families. No model API, subprocess text generation, outside provider or paid service was used. This is a **single-generator** collection; it does not establish robustness across model families. Model identity is recorded as `Codex session (exact underlying model not attested)`.

Each record includes a structured prompt, canonical prompt SHA-256, text hashes, word count, generation batch/date, exact parent ID, no-source-prose declaration and no-scores-before-freeze declaration. The prompt is an agent-recorded specification, not a provider-exported request log. The papers express synthetic negotiating positions and are not verified statements of historical government policy. No fabricated quotations, exact statistics or official citation identifiers were inserted.

The papers contain 519–582 whitespace-separated words, median 551, and 13,218 words in total. Synthetic outputs were frozen before any detector scores were seen and must not be revised in response to evaluation. Their freeze time is `2026-10-31T08:18:06.704202+00:00`.

## Evaluation limitations and rights

The usable human papers have 665–2,117 words, median 1,458.5. The 24 paired human papers have median 1,549 words. Human papers also contain citations, PDF line breaks and formatting artifacts that the new synthetic papers do not reproduce. Whole-document results therefore contain length and formatting confounds. A prespecified equal-length excerpt diagnostic, alongside the full-text results, is necessary to distinguish some of these effects. It does not remove selection bias, generator-style effects or all citation differences.

Highest-scoring college conference papers may differ from the writing of typical IPC participants. Historical proxies are not proof of unaided composition. A single heldout conference and one generation source cannot support a claim of flawless AI detection, nor justify treating a detector score as proof of misconduct.

The official site states All Rights Reserved; no open reuse license was identified. Public access does not imply permission to redistribute the PDFs or extracted prose. Full texts remain in ignored local research storage. The source-link collector and this documentation can be reviewed separately from those texts. No full paper was uploaded to an online detector in this task.

## Frozen hashes

| Artifact | SHA-256 |
| --- | --- |
| `records.jsonl` | `ee2e04aabd792be34f1af9b853cc1d54992178f378529c7ffcbc0eb98bb566d4` |
| `records-raw.jsonl` | `344b581bd1a7e5b09078882df4d6f591417312c632bb9aad4a012f6fd1b50b14` |
| `topics.jsonl` | `3541b1dafabf4bc91a07f9691812e70080077eda9a91f778fa3120d8a8745d17` |
| `synthetic-heldout.jsonl` | `d26aba4973f64a35747988379feef6af6fe9f1560ebf780a7e028e931e28fe9e` |
| `srmun-index.html` | `a922b1aac64ef19e444c5bbc3275a6567bb0ee6fd7446d99b056a4954e1b5a3e` |

No scoring, training, validation or model-selection work was performed by this collection/generation task. Total paid API cost: $0.
