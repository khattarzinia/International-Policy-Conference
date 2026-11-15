# External detector comparison

Checked and run 2026-10-31. No paid API calls. Only explicit public-corpus and session-generated excerpts were transmitted; no IPC submissions were used. Two remote batches were run; neither commercial API was called.

## Held-out MUN comparison

The second batch compared six identical excerpts across IPC v2 and the two online research demos. All **18 results completed**, including **12 real remote predictions**. Inputs came from the frozen v3 MUN test partition: its SHA-256 was checked against `provenance.json` before selection. One generated paper and its historical parent were selected from each of the three held-out topic groups, before any comparison scores were seen. The excerpts are 1,589–1,599 Unicode codepoints, ending at word boundaries.

| Reference evidence / sample | IPC v2 score | Fakespot score | RADAR score |
| --- | ---: | ---: | ---: |
| Historical human proxy, Brazil GA4 2016 (001) | 0.000173 | 0.173779 | 0.119163 |
| Historical human proxy, Amnesty HRC 2016 (002) | 0.000171 | 0.218955 | 0.009608 |
| Historical human proxy, Australia GA3 2017 (003) | 0.000172 | 0.812737 | 0.082613 |
| Recorded AI generation, Brazil GA4 2016 (004) | 0.997474 | 0.987550 | 0.104857 |
| Recorded AI generation, Amnesty HRC 2016 (005) | 0.999286 | 0.989843 | 0.010475 |
| Recorded AI generation, Australia GA3 2017 (006) | 0.997482 | 0.982267 | 0.288796 |

On these six excerpts, IPC v2's labels match all six reference labels; Fakespot flags the historical Australia excerpt as AI, and RADAR calls all three generated excerpts human. Four of six excerpts therefore produce classification disagreement. **This tiny comparison does not establish comparative accuracy or a flawless detector.** Historical archive dates are human-authorship proxies; the generated examples share a Codex generating session, and the three prompt/parent pairs are related. Prefix excerpts omit much of each paper; neither remote provider returns actual analyzed coverage. These results cannot establish performance on complete IPC submissions, other generators, mixed authorship, or edited text.

The historical source text had author/school headers removed by the archive collector. Each exact excerpt was inspected before sending; no personal or school header names were present. Original labels remain `historical_human_proxy` and `generated_in_recorded_codex_session`, with synthetic scope explicitly recorded. Synthetic rows' source URLs identify their historical prompt context, not a public host for the generated text.

Local, Git-ignored evidence:

- `.local/external-comparison/mun-samples-20261031.jsonl`: frozen exact excerpts, parent record IDs, topic groups, label evidence, source cleanup, selection policy, source-corpus hash, and excerpt hashes.
- `.local/external-comparison/mun-run-20261031/samples.jsonl`: immutable input snapshot used in the run.
- `.local/external-comparison/mun-run-20261031/results.jsonl` and `report.json`: all 18 actual observations and the side-by-side comparison.
- `.local/external-comparison/mun-run-20261031/evidence/`: all 18 raw responses, each bound to its result by SHA-256.

No remote reruns were made to select more favorable results. IPC v3 can later be scored **locally** on the same saved excerpts without resending them to external services. This table reports IPC v2 only.

## Earlier public-corpus smoke comparison

`ml/compare_external.py` compared four identical excerpts across IPC v2 and two online public research demos. All **12 results completed**, including **eight real remote predictions**. Each excerpt is at most 900 Unicode codepoints; full-document accuracy is not being claimed.

| Source dataset label | IPC v2 score | Fakespot score | RADAR score |
| --- | ---: | ---: | ---: |
| Human, sample-001 | 0.000179 | 0.996412 | 0.935523 |
| Human, sample-002 | 0.000171 | 0.159007 | 0.763843 |
| AI, sample-003 | 0.999730 | 0.999781 | 0.173207 |
| AI, sample-004 | 0.999414 | 0.999877 | 0.764513 |

These are each classifier's AI-class confidence, **not percentages of AI-written words**. Three of four excerpts produce disagreement in their returned human/AI labels. This tiny, deliberately balanced smoke comparison cannot rank providers or validate IPC. The source labels came from the existing public dataset and were not replaced by vendor predictions; the human authorship labels were not independently authenticated in this experiment.

Reproducibility evidence is local and ignored by Git:

- `.local/external-comparison/public-samples-20261031.jsonl`: exact excerpts, original/excerpt hashes, source URLs, licenses, label basis, lengths, and excerpt boundaries.
- `.local/external-comparison/public-run-20261031/results.jsonl`: actual per-provider observations and timestamps.
- `.local/external-comparison/public-run-20261031/evidence/`: raw provider responses with SHA-256 hashes in result records.
- `.local/external-comparison/public-run-20261031/report.json`: side-by-side results and disagreement, without a combined score.

## Public providers used

**Fakespot:** [author-hosted Space](https://huggingface.co/spaces/fakespot-ai/ai-text-detector), [source](https://huggingface.co/spaces/fakespot-ai/ai-text-detector/blob/main/app.py), [model](https://huggingface.co/fakespot-ai/roberta-base-ai-text-detection-v1). The live Space exposes the documented Gradio `/predict` API. Its source cleans markdown/HTML and whitespace before classifying. It does not return analyzed coverage. Observed Space revision: `a4ae333a1f98f1e5226347999c42298ca7e1928d`; this records the application revision, not a verified model-weights hash.

**RADAR:** [author-hosted Space](https://huggingface.co/spaces/TrustSafeAI/RADAR-AI-Text-Detector), [source](https://huggingface.co/spaces/TrustSafeAI/RADAR-AI-Text-Detector/blob/main/app.py), [paper](https://arxiv.org/abs/2307.03838). The live Space exposes `/predict`, backed by `TrustSafeAI/RADAR-Vicuna-7B`. The source truncates to 512 tokens. Actual analyzed character coverage is not returned, so the report leaves it unknown. Observed Space revision: `0b17bd20035a44d5bd4df265c03d088ea9389960`.

These are public research models served online, **not GPTZero/Sapling commercial scans**. Their public Space APIs follow [Hugging Face's API documentation](https://huggingface.co/docs/hub/spaces-api-endpoints); no browser automation, private endpoints, authentication workarounds, or copied website credentials were used.

Two older demos were unavailable: `openai/openai-detector` returned HTTP 503 and a paused runtime; `Hello-SimpleAI/chatgpt-detector-ling` and `chatgpt-detector-single` had runtime errors. No predictions were inferred from those failures.

## Run another comparison

Use the existing model Python environment:

```sh
.local/ml-venv/bin/python ml/compare_external.py prepare \
  --input .local/ml-data-v2/test.jsonl \
  --output .local/external-comparison/new-samples.jsonl \
  --source-url https://huggingface.co/datasets/rasbt/human-vs-ai-50k \
  --count 4 --max-chars 900 --confirm-public-source

.local/ml-venv/bin/python ml/compare_external.py run \
  --samples .local/external-comparison/new-samples.jsonl \
  --providers ipc fakespot radar \
  --ipc-model .local/ml-model-v2 \
  --output-dir .local/external-comparison/new-run \
  --allow-remote-public-text

.local/ml-venv/bin/python ml/test_compare_external.py
```

Each output directory must be new, and the tool refuses to overwrite a prepared sample file. Calls are sequential with no retry loop; errors remain `unavailable` with `score: null`. The exact submitted text/hash is shared across providers. Submitted excerpt coverage and provider-analyzed coverage remain separate.

## Commercial and manual results

Documented [GPTZero](https://docs.gptzero.me/api-reference/) and [Sapling](https://sapling.ai/docs/api/detector/) adapters are available but **disabled by default**. Running either requires both remote-transmission opt-in and `--allow-potentially-billed-api`, plus its server-side key. Having a free trial is not treated as authorization for charges. Neither was called during this task. GPTZero's AI-only class probability stays distinct from its mixed probability; Sapling's score stays distinct from any `ai_fraction`.

`import` accepts manually observed result JSONL only when the exact sample hash, provider, timezone-qualified timestamp, explicit score scale/meaning, and a saved evidence file with matching SHA-256 are supplied. Evidence must reside within the specified directory. An unavailable observation cannot carry a score. This supports real commercial UI observations without inventing an API response or treating an absent score as zero.

External outputs are never used as authorship ground truth or fed automatically into training. Agreement among related classifiers is not independent proof. No score averaging is performed.
