# V4 validation protocol review

Predeclared 2026-10-31, before V4 training or fresh-holdout scoring. This review inspected V2/V3 **validation predictions only**. It did not inspect their test predictions, score a new model, or expose/score unused public text. Website files are outside this work.

## Evidence motivating the protocol

Actual serving-path validation predictions in `.local/mun-v3-evaluation.json` give:

| Model / validation domain | Human false positives at 0.5 | AI detected at 0.5 |
| --- | ---: | ---: |
| V2 public | 0 / 400 | 393 / 400 |
| V3 public | 1 / 400 | 396 / 400 |
| V2 historical/generated MUN | 0 / 34 | 9 / 9 |
| V3 historical/generated MUN | 0 / 34 | 9 / 9 |

The MUN validation partition has only three topic groups. The V3 public false positive has confidence 0.998847. Raising V3's threshold to 0.999 removes that validation error but reduces public AI recall to 369/400; V2 at 0.5 retains 393/400 with zero observed human false positives. Thus a threshold-only change does not improve this measured trade-off. The probabilities are uncalibrated classifier scores, not probabilities of cheating.

## Fixed search, before looking at new test results

Keep the frozen V2 checkpoint as an eligible unchanged anchor. Start each of four independent trials from that same V2 checkpoint:

| Trial | Learning rate | Human cross-entropy weight | AI weight |
| --- | ---: | ---: | ---: |
| A | 0.00001 | 1.0 | 1.0 |
| B | 0.00001 | 1.5 | 1.0 |
| C | 0.00003 | 1.0 | 1.0 |
| D | 0.00003 | 1.5 | 1.0 |

Use two epochs, MUN sampling weight 2, batch size 16, and the same fixed seed/data/windowing/optimizer settings for all trials. Consider all eight epoch candidates, retain full history metrics, and save only the best epoch checkpoint per trial; the V2 anchor remains eligible. Do not add trials after seeing results. The higher human loss weight makes human errors more expensive during training; it does not calibrate the score or guarantee lower deployment false positives. The learning-rate contrast tests whether smaller updates better retain the existing model's behavior.

Freeze all new training and validation files, source groups, label evidence, and hashes first. Training may load only `train` and named validation partitions. New NMUN examples may join training/validation through a group assignment fixed before scoring; related parent documents, prompt descendants, duplicates, and near duplicates must remain together. Original held-out MUN topic groups remain excluded. Neither the fresh SRMUN corpus nor a reserved public audit enters training, epoch selection, threshold fitting, or calibration.

## Checkpoint selection

Use the same runtime window aggregation for every model. Rank all eligible checkpoints by the following predeclared rule, using **only validation** and the fixed score threshold 0.5:

1. Prefer checkpoints with zero observed human false positives in every validation domain.
2. Among those, maximize the minimum domain AI recall, then mean domain AI recall, then mean domain AUROC.
3. If none qualifies, minimize the maximum domain human false-positive rate, then the sum of domain false-positive rates, with the same recall and AUROC tie-breaks.
4. Exact ties retain the V2 anchor; otherwise prefer lower learning rate, lower human loss weight, and the earlier epoch in that order.

Show counts alongside rates for each of the three validation domains: public, MUNOL, and NMUN. NMUN is a separate validation domain with the identical ranking rule, not pooled with the larger public set. NMUN report bundles and their generated descendants cannot cross partitions. Length-controlled diagnostics reuse documents and are not additional independent validation examples. Source-group counts and group-level error summaries should accompany document averages.

This rule prioritizes observed false positives while preserving recall and leaves an unchanged model eligible. Winning validation is not deployment approval. If no candidate improves the selected trade-off, retaining V2 is a valid completed experiment.

## Review and abstention thresholds

Keep checkpoint selection at 0.5 so model improvement is not confused with changing the decision rule. As a separately labeled validation diagnostic, an upper review threshold can be computed **after** selecting the model as the smallest representable score strictly above the largest observed human validation score, with a floor of 0.5. If that threshold exceeds the valid score range, no high-score category is available. Freeze the threshold before fresh evaluation. Report the resulting human flag rate, AI recall, and fraction of documents routed for review separately; do not reinterpret a high score as proof of authorship.

A lower threshold for a low-signal category needs its own false-negative objective and validation evidence. Do not invent a “verified human” category or silently force all intermediate scores into human/AI labels. Until that objective is specified, uncertain results remain review cases. Partial coverage, insufficient readable content, out-of-domain text, and detector disagreement are reasons to retain uncertainty, not assign a zero AI score.

Thresholds fitted to validation can overfit those humans. The rule above describes empirical validation behavior only; its false-positive rate must be checked once on fresh source-disjoint data. Do not choose a new threshold after observing the fresh audit and continue calling that audit untouched.

## Fresh unused public audit: feasible, with limited size

Verified the three existing Parquet files against `ml/download_data.py` hashes at pinned revision `d458a1676e0be8155c29cab3a550283dd1ef9476`. The count-only audit excluded every prior record ID, source-group ID, source-document ID, and normalized text hash found across the existing V1/V2/V3 training, validation, and test data directories, including provenance copies. It also required public eligibility, 300–60,000 characters, and normalized-text uniqueness. Text was read only to compute exclusion hashes/lengths; no candidate prose was printed, selected, saved, or scored.

| Original Parquet partition | Unused human rows | Unused AI rows | Unused source groups |
| --- | ---: | ---: | ---: |
| Train | 88 | 0 | 87 |
| Validation | 337 | 211 | 214 |
| Test | 162 | 24 | 130 |
| Total | 587 | 235 | 431 |

All 431 remaining groups have human examples; 55 also have AI examples. Remaining generator labels are Qwen, Sol, Luna, DeepSeek, Kimi, and Gemini variants already represented in this public corpus. This would be a new **source-disjoint** audit, not proof of unseen-generator robustness or IPC-domain performance. The remaining rows are a filtered remainder rather than a random sample of future submissions.

The full census with input-file hashes is `.local/v4-unused-source-feasibility.json`. Following the coordinator's narrower freeze instruction, the actual fresh audit uses only the original validation/test Parquets, leaves the 88 training-partition humans unused, additionally excludes seed-parent IDs, and selects at most two rows per source-group/class in deterministic hash order without balancing. The frozen result is **526 rows: 422 human and 104 AI across 344 groups**. Its JSONL SHA-256 is `647f40f80f4a215972e6c268bf86e6c9f66c5c6d64febe5137132be420f5936e`; files are `.local/v4-fresh-audit/test.jsonl` and `provenance.json`. No prose was displayed or scored during freezing. The provenance records prior data hashes and all filtering rules.

The requested near-duplicate check is complete: **zero hits against 31,980 unique prior texts**, using casefolded Unicode word 9-grams, at least 100 shingles, and intersection/minimum-set-size containment of at least 80%. No filtering or overwrite was needed. The input hashes, method and empty hit list are recorded in `.local/v4-public-audit-near-duplicate-check.json`; no detector scores or prose inspection were involved.

Exclude those frozen groups from any future training expansion. This audit is for one final comparison, not calibration or trial ranking. The new official SRMUN holdout is the more relevant conference-domain audit and also remains entirely outside training/selection.

## NMUN generation delivered before training

Frozen `.local/mun-expansion/nmun/synthetic.jsonl` contains 24 original session-generated papers paired with 12 individual human parents across all eight NMUN report/delegation bundles. All four MacEwan source PDFs retain the shared delegation bundle. Each record preserves its individual human parent ID separately from the bundle ID, the metadata-only generation prompt, label evidence, and exact text hash. No NMUN source prose or detector scores were consulted. The output SHA-256 is `ed9b5a70e86a3886512f2bd58b20cdf3c26b4d70ebbb201702298e48624f0e8d`.

The papers contain 502–535 words each (12,284 total). All 24 normalized hashes are unique, with no within-generation pairs reaching the same 80% 9-gram containment criterion. Provenance is in `synthetic-provenance.json`. These remain one Codex session with an unverified underlying model, not 24 generator families or verified official national policies. Historical NMUN papers are substantially longer; the predeclared 500-word controls are necessary to diagnose that difference. No additional papers were generated after the 24 were frozen.

## Empirical rates are not guaranteed population bounds

“Zero false positives” means zero observed errors in a stated sample. Even under independent, identically distributed Bernoulli trials at a fixed threshold, zero errors in `n` observations gives a one-sided 95% exact upper limit `1 - 0.05^(1/n)`: approximately 0.75% for 400 humans, 8.43% for 34 humans, and 1.56% for 190 humans. At least 299 independent human examples with zero errors are needed for that particular upper limit to fall below 1%. [NIST exact binomial confidence limits](https://www.itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbici.htm) describes the exact-binomial method.

Those idealized numbers **are not valid guarantees for this project**: papers cluster by institution/topic/template, historical labels are authorship proxies, thresholds and models were selected using validation, and future students/generators may differ. Report document rates and source-group structure; avoid presenting an ordinary document-level binomial interval as a guaranteed future false-positive cap. Small synthetic samples also leave substantial uncertainty in recall.

After all four trials, checkpoint selection, and any threshold diagnostic are frozen, compare the chosen candidate with V2 once on the fresh holdout and report every failure. If the new audit contradicts validation, keep the safer existing behavior and treat that audit as consumed; do not tune to it and reuse its headline as fresh evidence.
