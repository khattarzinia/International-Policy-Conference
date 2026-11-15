# Claude watermark investigation

Checked 2026-10-31. Research only: no third-party code executed, no paid calls, no participant text uploaded.

## Conclusion for IPC

Claude's statistical text watermark is real. The public projects found under the reverse-engineering claim do **not** provide a verified detector for Anthropic's production watermark. Keep a future watermark result separate from IPC's learned AI-writing classifier and from cross-submission wording matches. For now, its truthful state is **unavailable**, not negative.

## The exact video supplied by Johnny

[DevDrift, “Claudes Watermark Is Laughably Easy”](https://www.youtube.com/watch?v=2hVMEooWgHk&t=32s), published **October 12, 2026**, duration 9:51. YouTube's oEmbed and watch-page metadata confirmed the title, author, date, description, and linked sources. The description explicitly says the experiment used Google's open SynthID implementation with the creator's own key, **not Anthropic's actual detector**. It does not claim to have recovered Anthropic's production key. English caption URLs were present, but the caption endpoint returned an empty response; the spoken transcript was not verified. The conclusions here rely on the creator's own description and the linked primary research, not an invented transcript.

The description links Anthropic's explanation/help page, DeepMind's implementation/Nature paper, [Tamim and Khan's July 17, 2026 preprint](https://arxiv.org/abs/2607.16010), and [Jovanović, Staab and Vechev's ICML 2024 paper](https://arxiv.org/abs/2402.19361). The July study tests KGW, Unigram, and **MarkLLM's SynthID implementation**; its reported 98.3% conditional removal for SynthID is not a test of deployed Claude. The 2024 paper demonstrates watermark stealing against its studied schemes, before Claude's 2026 deployment. Neither establishes a working Claude-paper detector for IPC.

The additional repositories below were investigated as related public work, not assumed to be the video's own implementation.

## What Anthropic confirms

Anthropic's explanation was published **August 14, 2026**, with a **September 1** detection-access update. The mechanism is a variant of Google DeepMind's SynthID-Text: a secret key affects token sampling; it does not insert invisible characters. The pattern contains no user/chat identity. A key-compatible check addresses Claude involvement, not all AI authorship. Short or highly constrained passages carry less useful signal. Source: [Anthropic explanation](https://www.anthropic.com/news/claude-text-watermark).

The help page read on October 31 says the detection API is in **private preview**, including eligible educational and research organizations. It offers an [access-request form](https://forms.gle/9tGA33hPJJwtHsMk9); no form was submitted. Supported models are listed in a changing table, so production code must not assume every historical Claude output is marked. The page warns that a positive can reflect editing, translation, or processing of existing work, and that absence cannot establish human authorship. Its public file Content Checker verifies supported **C2PA credentials**, a separate mechanism from plain-text watermark detection. Source: [Claude marking help](https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content).

## What was actually reverse-engineered or reproduced

### `claude-awm` / “Invisible Ink”

Inspected revision `9476e1a966c85ad82147f7f5c6ffead018ffae06`, committed **September 3, 2026**. This is a robustness study on open models with researcher-owned keys. The [connector documentation](https://github.com/aloshdenny/claude-awm/blob/9476e1a966c85ad82147f7f5c6ffead018ffae06/connector/README.md) explicitly excludes identifying Claude, ChatGPT, Gemini, or other production output. The [source](https://github.com/aloshdenny/claude-awm/blob/9476e1a966c85ad82147f7f5c6ffead018ffae06/src/synthid_robustness.py) generates its own `TRUE_KEYS` and wrong-key controls; it does not recover Anthropic's key.

Its [study](https://github.com/aloshdenny/claude-awm/blob/9476e1a966c85ad82147f7f5c6ffead018ffae06/README.md) finds weaknesses involving variation selectors and low-entropy text in its experimental detector. The experiment uses an untrained mean-g scorer and small samples per condition. These results motivate defensive Unicode tests; they are not measured Claude production false-positive/false-negative rates. The [interactive companion](https://aloshdenny.com/claude-awm/) also states it cannot determine whether pasted text came from Claude.

### Older `reverse-SynthID-text`

Inspected revision `7f78e64722bbc183d16df46904041a1c201fe3e8`. Its two commits are from **December 23, 2025**, before the announced Claude rollout; the initial commit says “synthid removal for gemma.” Its [test](https://github.com/aloshdenny/reverse-SynthID-text/blob/7f78e64722bbc183d16df46904041a1c201fe3e8/analysis/test_removal.py) generates and detects a known-key GPT-2 watermark. Its [analyzer](https://github.com/aloshdenny/reverse-SynthID-text/blob/7f78e64722bbc183d16df46904041a1c201fe3e8/analysis/analyze_watermark.py) defaults to GPT-2 tokenization and hard-coded research keys. This does not implement a compatible Claude detector.

### Claude Code prompt fingerprinting

A **June 30, 2026** [researcher's report](https://dodu.se/research/anthropic-endgame) describes date punctuation and timezone/proxy-dependent markers in a Claude Code **system prompt**. That concerns request fingerprinting. Even if the reported binary behavior is accurate, it is not a way to identify Claude-written MUN papers. The installed binary was not independently audited in this task.

DeepMind's [official reference implementation](https://github.com/google-deepmind/synthid-text) is expressly for research and reproducibility, with supplied model configurations. Availability of that implementation is not availability of Anthropic's production key/configuration.

## Engineering implications

These are IPC recommendations, not reported results from the sources:

1. Preserve original bytes and extracted text. Report Unicode character counts/types as input-quality diagnostics, with original offsets. Never call an unusual character a Claude watermark.
2. Add robustness fixtures covering zero-width characters, compatibility forms, variation selectors, legitimate emoji/CJK, and mixed scripts. Compare inference on original and explicitly documented analysis variants; a material score change should request review.
3. Do not blanket-delete combining marks or format characters from originals: some are meaningful in legitimate writing. Never use diagnostic counts alone as an AI label.
4. If official detector access is obtained, retain provider/version, input hash, coverage, timestamp, provider threshold semantics, and any uncertainty. Missing access, errors, and unsupported content must stay unavailable.
5. Do not average a keyed watermark statistic into a generic AI percentage, and do not treat agreement among learned detectors as independent proof. Report each signal and disagreement separately.

No production Claude watermark verification was performed. No independently validated public substitute was established in this investigation.
