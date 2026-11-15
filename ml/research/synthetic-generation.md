# MUN synthetic generation — primary batch

Date: 2026-10-31. Generated directly by the Codex subscription session, with no model API calls, paid compute, provider keys, or subprocess-based generation. The exact underlying model is not independently attested. This is one generator family, not a multi-model benchmark.

## Frozen artifact

- Local ignored artifact: `.local/mun-data/synthetic.jsonl`
- 36 original documents; 12 committee/year topic families; three documents per family.
- Word counts: 344–465; median 422; 14,965 total words.
- SHA-256: `190a3588890cf57deb0d8b247b321071823d3714ab5e91a8589575edb36d5d93`
- Frozen at: `2026-10-31T07:54:56.600001+00:00`
- No detector scores were viewed before generating or freezing this batch. Text was not revised in response to detector feedback.

The additional batch assigned to the corpus collector is separate (`synthetic-extra.jsonl`). Its counts and integrity must be checked independently before merging. This document covers only the primary 36 records.

## Method and provenance

The composing agent received official MUNOL archive metadata: historical year, committee, delegation and topic headings. It authored new policy arguments in varied three/four-topic formats. It did not copy the selected source papers' prose, create factual citations or invent exact statistics. These are synthetic negotiating positions, not authenticated government statements, actual student submissions, or fact-checked reference material.

Every record is `label: 1`, `synthetic: true`. Each retains the parent source/document ID, committee/topic group, conference group, historical context, generation date and batch, structured prompt specification, prompt hash, exact and normalized text hashes, and word count. The prompt specification is a record of instructions used by the composing agent, not a provider-exported request log. The archive URL is a prompt-metadata source, not the origin of the generated prose.

Three paired papers had empty extracted heading lists: Angola 2016 GA2, Angola 2016 GA6, and Yemen 2017 GA1. Their prompts used the shared committee headings observed in sibling official papers. Each record explicitly retains `topics_metadata_source_id` and `topics_metadata_basis`; no missing heading is claimed to have been extracted from its paired source.

`prompt_family_id` equals `committee_topic_group_id`. All human records and synthetic descendants in a conference-year/committee group must stay together in a train, validation or test partition. Do not split a paired human source from its generated descendants. School/source overlap also needs reporting by the downstream preparer; no claim of school-disjoint evaluation is made here.

## Limits

The documents are generally shorter than the corresponding complete human PDFs (which can contain much longer discussions). Use length-balanced, topic-aware evaluation or report this confound explicitly; random token crops alone do not establish a fair document-level benchmark. A single current generator cannot establish performance on Claude, every other model family, human-edited AI writing or student populations. Historic human papers remain historical-human proxies, not individually attested authorship.

Publicly visible formal writing and these polished synthetic papers may share genre conventions. Neither a model score nor agreement between detectors should become a ground-truth label. This generation batch is frozen for an honest first domain evaluation; later experiments require a fresh evaluation set rather than revising examples to increase apparent accuracy.
