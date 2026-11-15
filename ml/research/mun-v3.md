# MUN data expansion and three-signal investigation

Run date: 2026-10-31. No paid APIs or compute. Website design files were not changed.

## Result: candidate saved, v2 remains active

V3 improves AI recall and aggregate accuracy, but raises human false positives on
the regular public test. It is **not promoted**. Both checkpoints below were
measured through the actual 32-window serving implementation.

| Evaluation | v2 accuracy | v3 accuracy | Human falsely flagged, v2 → v3 | AI detected, v2 → v3 |
| --- | ---: | ---: | --- | --- |
| Public test, 800 | 98.125% | 98.625% | 2/400 → 5/400 | 387/400 → 394/400 |
| Unseen generator, 800 | 96% | 97.875% | 7/400 → 7/400 | 375/400 → 390/400 |
| MUN holdout, 36 | 97.222% | 100% | 0/27 → 0/27 | 8/9 → 9/9 |
| Same MUN documents, 250-word excerpts | 97.222% | 100% | 0/27 → 0/27 | 8/9 → 9/9 |

Public-test AUROC also decreases slightly, from 0.998044 to 0.997713. MUN's perfect
observed result is only 27 historical proxies and nine generated papers from
three agenda groups. Zero observed human false positives has a document-level
95% Wilson upper bound of about **12.46%** at this sample size, before accounting
for correlated topics/schools. This does not establish flawless detection.

The saved checkpoint is `.local/ml-model-v3`, version
`ipc-bert-tiny-mun-v3-raw-20261031T080017Z`. Three epochs completed, with 6,111
optimizer steps; validation selected epoch 1. The completed run took 128.07
seconds and the selected encoder's query weights changed by L2 norm 0.1739565.
The first training attempt was interrupted solely to record a generation-context
disclosure; text/labels and the chosen hyperparameters were unchanged, and no
test results were used for tuning.

Evidence: `.local/mun-v3-evaluation.json` contains both checkpoint hashes, exact
evaluation hashes, every prediction, coverage, intervals and regression flags.
The 32 Python checks (including actual-checkpoint HTTP service tests) and 63
application tests all pass; syntax, public build and diff-whitespace checks pass.
The six online-comparison MUN excerpts were also scored locally with v3; all six
reference labels matched, without repeating any remote requests.

## Data and labels

Collected **225 real position papers** from the official MUNOL archive: 106 from 2016, 63 from 2017, and 56 from 2019. Downloads total 45.96 MB. PDF/source hashes, archive links, topic sections and extraction records are retained locally. These are **historical human proxies**, not authenticated authorship records. Public availability does not establish reuse rights; full documents remain ignored under `.local/mun-data/`. See [source audit](mun-sources.md).

Two Codex sessions authored **60 original synthetic papers** across the same 20 committee/year families, with full generation specifications and hashes. This is one generator family, not 60 independent generators. No detector scores were consulted during generation. One generated Afghanistan/GA1 example had prior exposure to its paired source during extraction QA; this is disclosed and that group is in **training**, not validation/test. See [generation record](synthetic-generation.md) and the two frozen JSONL files.

The public training pool increased from 22,022 to **28,650** distinct examples. Every v2 training record is retained. Adding 164 historical and 42 generated MUN training examples gives **28,856 distinct training examples**. Public validation/test/held-out-generator files remain byte-identical to v2.

| MUN partition | Historical proxies | Generated | Topic/year groups |
| --- | ---: | ---: | ---: |
| Training | 164 | 42 | 14 |
| Validation | 34 | 9 | 3 |
| Test | 27 | 9 | 3 |

Paired sources, all prompts for the same committee/year agenda, and substantial near duplicates stay together. Split assignment is fixed before scoring. Schools can overlap (16 school groups between MUN training and test), so this is **not an unseen-school or independent-student benchmark**. Full historical documents are longer than generated documents; an additional 250-word excerpt test reuses the same held-out documents to diagnose length effects. It is not extra independent evidence.

## Training and evaluation

The candidate continues from the preserved v2 weights: three epochs, learning rate 0.00003, batch size 16, at most 900 training seconds. MUN exposures are balanced by class and weighted 12 times; repeated exposures are never counted as new examples. Checkpoint selection uses the mean of public and MUN validation AUROC. Test sets are evaluated after selection.

The previous eight-window evaluation versus 32-window serving discrepancy is fixed. Training evaluation, confidence-adjustment fitting and serving now use the same 32-window default. A regression test compares training and serving scores against the actual v2 checkpoint on a document longer than eight windows.

Final candidate/baseline comparisons use `runtime.Detector.predict` for both checkpoints, with exact input hashes, coverage, false-positive counts, recall and document-level Wilson intervals. Those intervals do not remove uncertainty from topic correlation, proxy labels or the small three-group MUN holdout. No checkpoint is activated automatically.

## Other signals

- **Watermark:** the supplied DevDrift video's own description uses open SynthID with a researcher-owned key, not Anthropic's production detector. Official Claude text-watermark detection is in private preview. The current status is **unavailable**, not negative. See [watermark investigation](claude-watermark.md).
- **External detectors:** real, free online Fakespot and RADAR checks use identical public/synthetic excerpts and save raw responses. Scores stay separate and never become training labels. Commercial GPTZero/Sapling adapters require explicit API/cost opt-in and were not called. See [actual comparison results](external-comparison.md).

## Reproduce

Historical collection needs the existing Python environment and `pdftotext`. Generated outputs are frozen research inputs, not regenerations claimed to be byte-reproducible from a model API.

```sh
.local/ml-venv/bin/python ml/prepare_more_data.py \
  --output .local/ml-data-v3-public --source-class-cap 8 --per-class 18000

.local/ml-venv/bin/python ml/prepare_mun_training.py \
  --synthetic .local/mun-data/synthetic.jsonl \
  --synthetic .local/mun-data/synthetic-extra.jsonl

.local/ml-venv/bin/python ml/train.py \
  --data .local/ml-data-v3 --output .local/ml-model-v3 \
  --resume-from .local/ml-model-v2 --epochs 3 --learning-rate 0.00003 \
  --domain-sampling-weight 12 --seconds 900 \
  --model-version-prefix ipc-bert-tiny-mun-v3-raw

.local/ml-venv/bin/python ml/evaluate_candidate.py \
  --data .local/ml-data-v3 --baseline .local/ml-model-v2 \
  --candidate .local/ml-model-v3 --output .local/mun-v3-evaluation.json

IPC_MODEL_TEST_DIR=.local/ml-model-v3 .local/ml-venv/bin/python \
  -m unittest discover -s ml -p 'test_*.py'
```

Use fresh output paths for repeat experiments. Existing frozen corpora, checkpoints and reports must not be overwritten. Evaluate future changes on new, independently sourced data rather than repeatedly tuning to this holdout.
