# Historical NMUN position-paper collection

Collected 31 October 2026. **30 distinct position papers**, 2013–2019, from
11 PDFs representing eight report/delegation groups and three institutions.
The retained source PDFs total **33,892,978 bytes**. These are participant papers,
not background guides, award lists, resolutions, or windows counted as papers.
The original aim of 150–400 could not be supported by the accessible historical
archives; the collector deliberately retains only reviewed papers.

## Sources and explicit boundaries

Page numbers below are physical PDF pages, starting at one, not printed folios.
Report appendices identify the papers by delegation and committee. Tübingen
calls its appendix “Beispiele von Positionspapieren” (examples of position
papers); these are the delegation's actual country/committee papers reproduced
in its report, not generic fictional sample papers from NMUN's writing guide.

| Institution / year | Delegation | Papers | Physical pages | Primary source |
|---|---|---:|---|---|
| Kiel 2019 | Cyprus | 8 | 37–38,39–40,41–42,43–44,45–46,47–48,49–50,51–52 | [University-hosted report](https://www.alumniundfreunde.uni-kiel.de/projekte/2019/nmun-2019-bericht.pdf) |
| Tübingen 2013 | Australia | 2 | 64–65,66–67 | [Delegation report](https://nmun-tuebingen.de/wp-content/uploads/2013/11/nmun-2013_abschlussbericht-1.pdf) |
| Tübingen 2014 | Montenegro | 4 | 55–57,58–59,60–62,63–65 | [Delegation report](https://nmun-tuebingen.de/wp-content/uploads/2012/11/abschlussbericht-nmun-2014-1.pdf) |
| Tübingen 2015 | Iraq | 4 | 57–58,59–60,61–63,64–65 | [Delegation report](https://nmun-tuebingen.de/wp-content/uploads/2012/11/abschlussbericht-nmun-2015-final-1.pdf) |
| Tübingen 2016 | Chile | 3 | 55–56,57–58,59–60 | [Delegation report](https://nmun-tuebingen.de/wp-content/uploads/2016/08/001final-report-nmun-20161-1.pdf) |
| Tübingen 2017 | Philippines | 3 | 53–54,55–56,57–58 | [Delegation report](https://nmun-tuebingen.de/wp-content/uploads/2012/11/final-report-2017-1.pdf) |
| Tübingen 2018 | Bahrain | 2 | 60–61,62–63 | [Delegation report](https://nmun-tuebingen.de/wp-content/uploads/2018/12/final-report_nmun2018_final-1.pdf) |
| MacEwan 2016 | Nigeria | 4 | Four separate two-page PDFs | [Club's original-paper links](https://macewanhmun.weebly.com/position-papers.html) |

MacEwan's four direct files are [CND](https://macewanhmun.weebly.com/uploads/8/7/7/2/87720974/cnd-nigeria_.pdf),
[GA2](https://macewanhmun.weebly.com/uploads/8/7/7/2/87720974/ga2-nigeria.pdf),
[UNESCO](https://macewanhmun.weebly.com/uploads/8/7/7/2/87720974/unesco-nigeria_.pdf),
and [UNHCR](https://macewanhmun.weebly.com/uploads/8/7/7/2/87720974/unhcr-nigeria.pdf).
The hosting page is titled HMUN 2017, but it explicitly attributes these papers
to MacEwan club members' previous NMUN New York participation. Their country and
school headers match the [official 2016 NMUN programme](https://www.nmun.org/assets/documents/conference-archives/new-york/2016/NY16-Program-web.pdf).
The assigned year is therefore **2016**, with this inference recorded in each
manifest record. It does not come from the site's HMUN 2017 title.

The Kiel document is on the university's domain. Tübingen and MacEwan documents
are on their participant delegation/club sites, rather than the NMUN conference
domain; the manifest distinguishes these provenance types. Tübingen's public
[report media index](https://nmun-tuebingen.de/wp-json/wp/v2/media?search=report&per_page=100)
and [earlier report index](https://nmun-tuebingen.de/wp-json/wp/v2/media?search=bericht&per_page=100)
provide upload metadata. URL upload-directory years are not used as the event
year: several later reports reside in a `2012/11/` directory.

## Reproduction and local files

```sh
python3 ml/collect_nmun_archive.py
```

Requires `requests` and Poppler `pdftotext`. The collector contains the reviewed
source catalogue, pinned PDF SHA-256 values, and explicit paper page ranges.
It stops if a PDF changes or a range no longer contains exactly one paper header.
Cached PDFs are reused and verified; missing PDFs are downloaded with a 200 MB
budget. It never reads private IPC submissions or changes the earlier MUNOL data.

All downloaded PDFs and full extracted texts stay in ignored
`.local/mun-expansion/nmun/`. Files:

- `manifest.jsonl`: 30 complete provenance records, with text stored separately.
- `topics.jsonl`: metadata only, suitable for original topic-matched generation.
- `bundles.jsonl`: 11 source PDF records; **eight** unique `parent_bundle_id`s.
- `texts/`: whole paper texts, one file per actual paper.
- `raw-papers/`: unchanged selected-page `pdftotext -layout` output.
- `summary.json`: counts, years, institutions, sizes, topic and length totals.
- `provenance/`: supplementary source-page snapshots and official 2016 programme.

Each record includes `source_id`, `conference`, `year`, `delegation`, `committee`,
`topics`, `committee_topic_group_id`, `school_group_id`, `school_year_group_id`,
`parent_document_id`, `parent_bundle_id`, explicit page range, source/archive
URLs, PDF/extracted/normalized text SHA-256 values, local paths, label provenance,
and reuse-rights status. Paths are repository-root relative by default.

The clean text removes report-only titles and standalone page numbers, repairs
lowercase line-end hyphenation, and joins wrapped paragraph lines. Original
delegation/school headers remain. Normalized hashes use NFKC, case folding and
collapsed whitespace; raw selected-page hashes and clean text hashes are also
retained. Changes in Poppler versions can alter text extraction, even when PDF
hashes remain identical. Collection timestamps change when rerunning the
collector; pinned PDF hashes and source/page identities do not.

## What this evidence supports

All 30 clean texts and normalized texts are unique within this collection. They
contain 89 explicit topic headings across 29 conference/year/committee groups,
with 1,141–1,810 words per paper. Topics include disarmament, peacekeeping,
migration, refugees, energy/development, environmental governance, women's
participation and industrial development. Counts are whole papers, not the 89
topic sections or arbitrary text chunks.

Every label is `0` / `historical_human_proxy`, with `authorship_verified=false`.
The dated reports and historical conference attribution are evidence of context,
not an authorship audit. Templates, collaboration, translation tools, copied
policy language, later file replacement, or other assistance cannot be ruled out.
No open redistribution or model-training licence was identified. Public access
does not establish reuse rights; full copyrighted documents remain local and
are not added to Git. No claim of redistribution permission is made.

## Split requirements and limitations

Keep every paper from one report in the same split. MacEwan's four separate
PDFs share `parent_bundle_id=nmun-ny-2016-macewan-delegation`, because they come
from one school delegation; `parent_document_id` still identifies each PDF.
All generated examples must inherit the paired paper's bundle/group assignment.

Also check committee/topic-family overlap: Tübingen and MacEwan share the 2016
GA2 agenda. Keeping parent reports separate alone does not guarantee unseen
topics. Institutional overlap is another limitation: six reports come from
Tübingen, so report/year splits should not be described as unseen-school tests.
All documents share the NMUN position-paper format. The material is unusually
long and university-level, and reproduced appendix examples may be selected
for quality. Comparing them with much shorter generated papers creates a
length cue; matched-length and conference-held-out evaluations remain necessary.

This collection involved no detector scoring or training. It leaves all earlier
frozen data unchanged. The NMUN-wide historical pages examined primarily linked
guides, resolutions, awards and programmes. Kiel 2014/2017 short reports and an
FU Berlin 2017 report lacked actual position-paper appendices and were excluded.
Their exploratory downloads, where retained locally, are not manifest records.
