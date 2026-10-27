# IPC experimental AI-likelihood model

This is an actual full-encoder fine-tune of [Google BERT-Tiny](https://huggingface.co/google/bert_uncased_L-2_H-128_A-2), with 4,386,178 trainable parameters. It supplies a separate AI-writing confidence signal to the submission portal. Cross-submission text overlap is handled by the independent comparison engine.

The model is experimental. Its output is an **uncalibrated model confidence**, not proof of authorship, the probability that a student cheated, or the percentage of AI-written words. It has not been validated on IPC policy briefs. Never use its score to automatically reject an entry.

## What was actually trained

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
