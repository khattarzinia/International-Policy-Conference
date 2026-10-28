# IPC experimental AI-likelihood model

This is an actual full-encoder fine-tune of [Google BERT-Tiny](https://huggingface.co/google/bert_uncased_L-2_H-128_A-2), with 4,386,178 trainable parameters. It supplies a separate AI-writing confidence signal to the submission portal. Cross-submission text overlap is handled by the independent comparison engine.

The model is experimental. Its output is an **uncalibrated model confidence**, not proof of authorship, the probability that a student cheated, or the percentage of AI-written words. It has not been validated on IPC policy briefs. Never use its score to automatically reject an entry.

## October 28 expanded-data checkpoint

The v2 candidate uses **22,022 balanced examples** (11,011 human and 11,011 AI), versus 3,600 in v1: 6.12 times as much training data. Source groups increase from 2,222 to 4,825. Every original training example is retained, and the maximum examples per source-group/class increases from two to four. All new data comes from the same pinned public corpus; no IPC submissions or private briefs are used.

The original 800-document validation, 800-document test and 800-document held-out-generator files are frozen byte for byte. Their source-group IDs and normalized text hashes are explicitly excluded from expanded training. `deepseek-v4-flash-0731` stays absent from training/validation. The three evaluation SHA-256 hashes are recorded in both versions' metadata and checked by `compare_models.py`.

V2 model version: `ipc-bert-tiny-public-v2-20261028T013033Z-raw`.

| Same frozen evaluation | v1 accuracy | Raw v2 accuracy | v1 human false positives | Raw v2 human false positives | v1 AUROC | Raw v2 AUROC |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Test, 800 documents | 97.25% | 98% | 8/400 (2%) | 2/400 (0.5%) | 0.99649 | 0.99804 |
| Held-out generator, 800 documents | 94% | 96% | 12/400 (3%) | 7/400 (1.75%) | 0.98615 | 0.99259 |

Raw v2's seen-family AI recall stays 96.5%; held-out-generator recall rises from 91% to 93.75%. Test Brier score decreases from 0.02208 to 0.01571 and held-out Brier score from 0.05027 to 0.03481. Four epochs completed over 5,508 optimizer steps; epoch 3 was selected using validation AUROC, before final test measurement. The observed run took 119.53 seconds on local MPS. The encoder query-weight L2 change is 1.3756541. V1 remains intact in `.local/ml-model` and a verified backup at `.local/ml-model-v1`; v2 is a separate directory at `.local/ml-model-v2`.

An optional two-parameter positive-scale/intercept confidence correction was fitted on the frozen validation set. Its parameters were saved before its test predictions were calculated. It improves public-test Brier scores and AI recall but produces more human false positives than raw v2. The raw variant is the default, with `scoreVariant:"raw"` and `validationCalibrationEnabled:false`. The fitted parameters and both raw/adjusted measurements remain in metadata for audit. Enabling an adjusted variant must use a different model version; it must never imply validated authorship probabilities for IPC.

These results are a measured improvement on the same public evaluations. They do not establish accuracy on actual policy briefs, student populations or all AI generators. The regular and held-out-generator tests may reuse human test examples, as in v1.

To reproduce the expansion without moving the evaluations:

```sh
.local/ml-venv/bin/python ml/prepare_more_data.py
.local/ml-venv/bin/python ml/train.py --data .local/ml-data-v2 --output .local/ml-model-v2-new --epochs 4 --seconds 480 --model-version-prefix ipc-bert-tiny-public-v2-raw
.local/ml-venv/bin/python ml/test_more_data.py
.local/ml-venv/bin/python ml/compare_models.py --candidate .local/ml-model-v2
IPC_MODEL_TEST_DIR=.local/ml-model-v2 .local/ml-venv/bin/python ml/test_server.py
```

Training refuses to overwrite an existing checkpoint. `prepare_more_data.py` freezes the original evaluation files, verifies their hashes, backs up v1 and checks all source/text exclusions before writing the larger training set. `calibrate_model.py` is an optional validation-only experiment and defaults to leaving its confidence correction disabled. It refuses to refit a candidate whose parameters are already frozen. No further training or parameter tuning was performed after inspecting these test results.

To run raw v2, set the private service's `IPC_MODEL_DIR=.local/ml-model-v2` and restart that service. Historical submission scores retain their original model version; changing the model directory does not silently recompute them. The Node backend manages any explicit version-aware reanalysis.

## What was actually trained

The following describes the original v1 baseline, preserved for comparison.

- Base model: `google/bert_uncased_L-2_H-128_A-2`, Apache-2.0.
- Pinned base revision: `30b0a37ccaaa32f332884b96992754e246e48c5f`.
- Public corpus: [`rasbt/human-vs-ai-50k`](https://huggingface.co/datasets/rasbt/human-vs-ai-50k), revision `d458a1676e0be8155c29cab3a550283dd1ef9476`.
- The dataset card defines label 0 as human and label 1 as AI. Source-document groups and AI texts derived from them stay in the dataset's original train/validation/test partition. The dataset authors document the construction in their [source repository](https://github.com/rasbt/ai-detector-from-scratch).
- We retain row-level source URLs, licenses, authors, attribution, group IDs, generator names, and text hashes in the prepared JSONL files. The corpus combines CC BY, CC BY-SA, CC0 and public-domain sources; it is not a uniformly licensed collection.
- Training used 3,600 examples (1,800 per class), covering 2,222 source groups. Validation, test, and held-out-generator evaluation each used 800 examples (400 per class).
- Exact normalized-text duplicates were removed across partitions. Every variant of a source group remains in one partition; no source group is shared between training, validation, or either test evaluation. Sampling caps each source group/class at two examples.
- `deepseek-v4-flash-0731` is absent from training and validation and appears only in the held-out-generator evaluation. Other generator names are recorded in `metadata.json`. The regular and generator-held-out evaluations both draw from the original test partition and may reuse human examples; they are not independent benchmarks.
- All encoder and classifier parameters were updated over 900 optimizer steps and four epochs. The saved checkpoint is epoch 3, selected solely by validation AUROC. A first-layer encoder query-weight L2 change of 0.5952246 confirms the encoder changed rather than only its classifier head.

The labels above are dataset provenance, not newly verified authorship of every source. The IPC website's sample PDF briefs were not labeled or used as training data. Private competition submissions are never automatically added to this corpus.

## Observed held-out results

Model version: `ipc-bert-tiny-public-20261027T124510Z`.

| Evaluation | Documents | Accuracy at 0.5 | AUROC | Human false positives | AI detected |
| --- | ---: | ---: | ---: | ---: | ---: |
| Validation | 800 | 97.875% | 0.99702 | 5/400 (1.25%) | 388/400 (97%) |
| Test, seen generator families | 800 | 97.25% | 0.99649 | 8/400 (2%) | 386/400 (96.5%) |
| Held-out DeepSeek generator | 800 | 94% | 0.98615 | 12/400 (3%) | 364/400 (91%) |

The 0.5 threshold is used only to report a conventional confusion matrix. The application has no automatic eligibility decision at that threshold. These results do not establish performance on policy briefs, different student populations, every current generator, mixed human/AI editing, or adversarial paraphrasing. The measured human false positives are a concrete reason to require review.

The observed training run took 27.45 seconds on the available local MPS device, excluding downloads and setup. Reproduction on a CPU or another machine can take longer. Exact bitwise reproduction is not guaranteed across accelerators; the data, revisions, seed, hyperparameters, split hashes and checkpoint-selection rule are recorded.

## Reproduce locally without paid APIs

Use Python 3.12 from the repository root:

```sh
python3.12 -m venv .local/ml-venv
.local/ml-venv/bin/python -m pip install --no-cache-dir -r ml/requirements-lock.txt
.local/ml-venv/bin/python ml/download_data.py
.local/ml-venv/bin/python ml/prepare_public_data.py
.local/ml-venv/bin/python ml/train.py --epochs 4 --seconds 480
.local/ml-venv/bin/python ml/test_server.py
```

The download helper pins and verifies the three public Parquet files (84 MB total) before preparing a bounded sample. Model weights and Hugging Face caches stay in `.local/ml-*`, excluded from Git. No paid inference API, external model-generation call, or paid compute is used.

The checkpoint directory contains safetensors weights, tokenizer files, `metadata.json`, `evaluation-predictions.json`, and a model card. Metadata records the base/data revisions, exact split counts and hashes, held-out metrics, and encoder update evidence. Evaluation predictions contain source IDs and scores rather than full submitted text.

## Run the private model service

The Node backend and model service need the same private `IPC_MODEL_TOKEN` of at least 24 characters. Store it in the ignored `.env.local` file, never browser code:

```sh
IPC_AI_PROVIDER=local
IPC_AI_ENDPOINT=http://127.0.0.1:4319
IPC_MODEL_DIR=.local/ml-model
IPC_MODEL_TOKEN=your-private-random-token
```

Then run:

```sh
.local/ml-venv/bin/python ml/server.py --env-file .env.local
```

The service binds only to 127.0.0.1. It loads a completed checkpoint at startup and refuses to report readiness if training metadata or weights are absent. `GET /health` returns readiness and model version. `POST /predict` requires `Authorization: Bearer <IPC_MODEL_TOKEN>` and a JSON `document` string. It rejects malformed requests, documents below 300 characters or above 150,000 UTF-16 code units, and request bodies over 1 MB.

The response provides `score`, `modelVersion`, `experimental:true`, `scoreType:"model_confidence"`, and window-level `segments`. It reports analyzed/total token and character counts. Offsets and character counts use JavaScript-compatible UTF-16 code units, including emoji. Longer inputs use up to 32 overlapping windows distributed across the complete document; `coverageComplete:false` and the coverage counts disclose any sampling. They are never silently truncated.

Scores are aggregated from the confidence of analyzed windows, weighted by newly covered token positions. This aggregation is a research implementation and has not been calibrated as a document-level authorship probability. Text is processed in memory and request bodies and tokens are not logged or saved by the model service. The submission backend still retains the original private brief according to its separate storage configuration.

The local Mac endpoint is not reachable from a hosted Vercel function. A production deployment requires this model service on suitable infrastructure behind HTTPS and authentication, then a corresponding server-only endpoint configuration. No production model host is provisioned here.
