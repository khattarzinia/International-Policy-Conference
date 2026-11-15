# Cross-conference MUN expansion and V4 optimization

Completed 31 October 2026 at $0 API/compute cost. **V2 remains active.** Four
new fine-tunes caught slightly more AI in validation but added human false
positives, so none passed the predeclared selection rule. The fresh audit also
exposed sensitivity to shorter excerpts. This is a completed experiment, not
a claim that the deployed model improved or became flawless.

## Data collected and actually used

The historical collection grew from **225 to 576 usable distinct papers**:
351 additional usable papers. There are 577 distinct collected texts before
one unresolved SRMUN metadata inconsistency is quarantined.

| Source | Usable distinct papers | Dates | Role |
| --- | ---: | --- | --- |
| [MUNOL official archive](https://munol.org/conference/delegate-center/) | 364 | 2016, 2017, 2019 | Existing topic splits retained; 106 additional humans enter training |
| [NMUN university/delegation reports](nmun-sources.md) | 30 | 2013–2019 | 25 train, five validate; whole report/delegation bundles stay together |
| [SRMUN official archive](https://www.srmun.org/papers/historical.php) | 182 | 2008–2021 | Entire conference reserved for final evaluation |

MUNOL has 365 archive entries with one exact duplicate, and 55 identified
institutions. NMUN has 11 PDFs, eight report/delegation bundles and three
institutions. SRMUN has 54 institutions; its archive deliberately selects
high-scoring papers. These institution counts are not a deduplicated global
total. See [MUNOL provenance](mun-sources.md), [NMUN provenance](nmun-sources.md)
and [SRMUN provenance](other-mun-sources.md) for sources and exclusions.

Added **48 original Codex-generated papers**: 24 NMUN and 24 SRMUN counterparts,
bringing the MUN synthetic collection to 108. Generation used topic/country/
committee metadata, without paired source prose or detector scores. Full
prompts, parent IDs, text hashes and generation limitations are retained locally.
These are one generator family, not a multi-provider MUN benchmark.

The training set contains **29,007 distinct examples**: 28,650 public examples
plus 295 historical MUN papers and 62 generated MUN papers. Every one of the
28,856 V3 training records is retained unchanged. The new training additions
are 131 historical papers and 20 generated papers; collection totals must not
be presented as training totals. Thirty-three new MUNOL papers belong to old
held-out topic groups and remain reserved and unused.

All previous evaluation files remain byte-identical. NMUN validation uses two
Tübingen report/year groups, containing only five humans and four AI papers;
the university also occurs in training, so this is not an unseen-school test.
MacEwan's four separate PDFs share one delegation bundle. Exact/near-duplicate,
parent-document and committee/year checks prevent training/evaluation overlap.

A separate public audit contains **526 documents: 422 human and 104 AI**, across
344 previously unused source groups. It uses only the original public dataset's
validation/test partitions. Its 9-word-shingle containment check found no near
duplicates against 31,980 distinct earlier texts; the preparer also checked
against the new MUN collection. No fresh audit scores were used for training,
selection or threshold fitting.

## Fixed optimization experiment

Each trial resumed the same V2 checkpoint, trained the full 4,386,178-parameter
BERT-Tiny encoder for two epochs, and used MUN sampling weight 2, batch size 16
and the same seed. Human-class loss weights were 1 or 1.5; learning rates were
0.00001 or 0.00003. Each trial completed 3,730 optimizer updates. The four
completed training timers total 316.14 seconds on local MPS, excluding setup
and tokenization. Encoder-weight changes are recorded in every checkpoint.

Selection used three validation domains and the fixed 0.5 score threshold.
Zero observed human false positives in every domain takes priority, followed
by lower worst/summed false-positive rates and higher minimum/mean AI recall
and mean AUROC. Exact ties retain V2. All eight epoch candidates were considered;
the best epoch per trial is saved. See [the protocol](v4-protocol-review.md).

| Candidate | Learning rate | Human loss weight | Selected epoch | Public human false positives | Public AI detected |
| --- | ---: | ---: | ---: | ---: | ---: |
| **V2 retained** | — | — | — | **0/400** | 393/400 |
| A | 0.00001 | 1.0 | 1 | 1/400 | 394/400 |
| B | 0.00001 | 1.5 | 1 | 1/400 | 394/400 |
| C | 0.00003 | 1.0 | 2 | 2/400 | 396/400 |
| D | 0.00003 | 1.5 | 2 | 2/400 | 396/400 |

All five candidates had 0/34 human flags and 9/9 AI detections on MUNOL
validation, and 0/5 human flags and 4/4 AI detections on NMUN validation.
The validation-fitted review-threshold diagnostic stayed at 0.5; it was not
changed after seeing the fresh tests. These scores are uncalibrated confidence,
not authorship probabilities.

An initial run was interrupted to correct inherited V3 summary counts in the
new provenance. Every training/evaluation JSONL hash remained identical; only
metadata changed. Hyperparameters and the selection rule were unchanged, and
fresh tests had not been scored. The interrupted artifacts are retained in
`.local/*v4*-interrupted-provenance*` for audit.

## Once-only fresh evaluation of retained V2

Selection was frozen before evaluation. All results below use the actual CPU
`runtime.Detector.predict` path with 32 windows. Every evaluated document had
complete token coverage. Because V2 won, the baseline and selected checkpoint
are identical; the report explicitly reuses one inference run rather than
pretending to evaluate two different models.

| Evaluation | Human false positives | AI detected | Interpretation |
| --- | ---: | ---: | --- |
| Fresh SRMUN, whole papers | **0/182** | **24/24** | Unseen conference; historical human proxies and one AI generator |
| Same SRMUN papers, first 500 words | **4/182 (2.20%)** | **24/24** | Prespecified length control; same documents, not independent evidence |
| Fresh public source groups | **0/422** | **100/104 (96.15%)** | Four AI misses, despite zero observed human false positives |
| Old public test, regression check | 2/400 | 387/400 | Previously inspected benchmark |
| Old held-out-generator test | 7/400 | 375/400 | Previously inspected benchmark; shares some humans with old public test |
| Old MUNOL test | 0/27 | 8/9 | Previously inspected three-topic-group benchmark |

The short-excerpt failures are material: four historical papers moved from
whole-document scores of 0.142–0.323 to 500-word scores of 0.577–0.700. They
span four committee/year groups and three institutions. The fresh public AI
misses have dataset generator labels Gemini, Luna, DeepSeek and Qwen; three
are Wikimedia-domain examples and one is StackExchange. Their recorded scores
range from 0.000179 to 0.311834. A low score therefore cannot certify human
authorship either. Row-level evidence is in `.local/v4-error-analysis.json`.

The whole-paper result cannot be described as general 100% accuracy. Length
changes the result; the synthetic texts are shorter and lack some human PDF/
citation artifacts; historical provenance is not authenticated authorship;
high-scoring university papers may differ from ordinary IPC submissions.
The zero-error 182-human sample has an illustrative document-level 95% Wilson
upper limit of about 2.07%, before considering institution/topic correlation
and proxy labels. It is not a guaranteed future false-positive bound.

No model, threshold or example was revised using these fresh scores. These
audits are now consumed: they may serve as regression checks, but future tuning
to their failures requires another genuinely untouched final assessment.
The next research priority is length and mixed/edited-text robustness, with
more generator families and provenance-backed IPC-style drafts. Current
scores remain advisory and must not automatically reject submissions.

## Reproduction and artifacts

Run commands from `/Users/johnny/Documents/Codex/2026-10-27/goi/work/ipc-submissions`.

```sh
.local/ml-venv/bin/python ml/prepare_v4_data.py --nmun .local/mun-expansion/nmun/manifest.jsonl --nmun-synthetic .local/mun-expansion/nmun/synthetic.jsonl --srmun .local/mun-expansion/other/records.jsonl --srmun-synthetic .local/mun-expansion/other/synthetic-heldout.jsonl --fresh-public .local/v4-fresh-audit --output .local/ml-data-v4-reproduction
.local/ml-venv/bin/python ml/optimize_mun.py --data .local/ml-data-v4-reproduction --output .local/mun-v4-reproduction --device mps
```

Use fresh output directories; scripts refuse to overwrite frozen experiments.
Final evaluation requires the campaign's `selection.json`, matching checkpoint
and data hashes. Reproducing on another accelerator may change floating-point
results. The retained version is `ipc-bert-tiny-public-v2-20261028T013033Z-raw`.

Key local evidence: `.local/ml-data-v4/provenance.json`,
`.local/mun-v4-campaign/{protocol,selection}.json`, four `trial-*` checkpoints,
`.local/mun-v4-evaluation.json`, `.local/v4-source-index.json` (576 source links),
and `.local/v4-error-analysis.json`.

Verification passed: **47 Python tests and 63 application tests (110 total)**,
JavaScript syntax checks, site build, Python compilation and Git whitespace
checks. Python checks include real checkpoint/HTTP behavior, serving/training
window parity, frozen source hashes, split integrity and a test proving that
validation-only training never opens test files. Website HTTP and model health
were checked locally. Website design files were not changed.

Full papers and weights remain in ignored local research storage; no source
reuse/redistribution licence was inferred from public access. No private IPC
submissions, paid APIs or external detector calls were used in this round.
