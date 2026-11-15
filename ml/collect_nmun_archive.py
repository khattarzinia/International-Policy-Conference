#!/usr/bin/env python3
"""Collect explicitly bounded, historical NMUN participant position papers.

Run from any directory. Requires requests and Poppler's pdftotext. All source
PDFs/full texts remain under ignored .local/mun-expansion/nmun/. This is a
small, reviewed catalogue, not a claim to archive all NMUN submissions.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import unicodedata

import requests

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / ".local/mun-expansion/nmun"
KIEL = "https://www.alumniundfreunde.uni-kiel.de/projekte/2019/"
TUEBINGEN = "https://nmun-tuebingen.de/"
MACEWAN = "https://macewanhmun.weebly.com/position-papers.html"
PROGRAM_2016 = "https://www.nmun.org/assets/documents/conference-archives/new-york/2016/NY16-Program-web.pdf"

# PDF page numbers are one-based physical pages, not printed report folios.
# Each range was checked against an explicit Delegation/Position Paper header
# and the next paper or the following report section (Auszeichnungen).
CATALOG = [
    dict(key="kiel2019", year=2019, delegation="Cyprus", school="christian-albrechts-universitat-zu-kiel", school_name="Christian-Albrechts-Universität zu Kiel", url=KIEL + "nmun-2019-bericht.pdf", archive=KIEL, kind="university_hosted_delegation_report", sha="45530e701aea170ec2f15895bdeb6a47ddcd9d2906c3f672f8904e369c0e08df", papers=[("GA1",37,38),("GA2",39,40),("GA3",41,42),("UNEA",43,44),("COP-UNFCCC",45,46),("UNHCR",47,48),("C34",49,50),("UNIDO",51,52)]),
    dict(key="tuebingen2013", year=2013, delegation="Australia", sha="51442e486fdc12aa77c4638172c1fdfece6acc13bf0f1881cfd2bcd61f3af2f9", url=TUEBINGEN+"wp-content/uploads/2013/11/nmun-2013_abschlussbericht-1.pdf", papers=[("C34",64,65),("UNCTAD",66,67)]),
    dict(key="tuebingen2014", year=2014, delegation="Montenegro", sha="5f9c279104e51b95d82b82cded5424a2b789d57e43eb8a38ce5ad9a7af494fce", url=TUEBINGEN+"wp-content/uploads/2012/11/abschlussbericht-nmun-2014-1.pdf", papers=[("GA2",55,57),("GA4",58,59),("UNFPA",60,62),("OPCW",63,65)]),
    dict(key="tuebingen2015", year=2015, delegation="Iraq", sha="ce1076dac70f8b9da6628235f281cc6f1020da89920210987feaa6f8a4b39a40", url=TUEBINGEN+"wp-content/uploads/2012/11/abschlussbericht-nmun-2015-final-1.pdf", papers=[("GA2",57,58),("GA1",59,60),("C34",61,63),("NPT-RevCon",64,65)]),
    dict(key="tuebingen2016", year=2016, delegation="Chile", sha="e63492b741682ef9575df64d840f9f99c056e62f6b5952193414c62bea18c476", url=TUEBINGEN+"wp-content/uploads/2016/08/001final-report-nmun-20161-1.pdf", papers=[("GA2",55,56),("GA1",57,58),("UNEP",59,60)]),
    dict(key="tuebingen2017", year=2017, delegation="Philippines", sha="79d2a306e9df26c0f4c8e3e074af685e16933315e7a46c6c50e52db9ca851aa2", url=TUEBINGEN+"wp-content/uploads/2012/11/final-report-2017-1.pdf", papers=[("GA1",53,54),("UNHCR",55,56),("IAEA",57,58)]),
    dict(key="tuebingen2018", year=2018, delegation="Bahrain", sha="1c3da2fe052e2f1ce445d5e968ab41ffb957f0b00e480b40b90c3c0b0f5a2655", url=TUEBINGEN+"wp-content/uploads/2018/12/final-report_nmun2018_final-1.pdf", papers=[("IOM",60,61),("CSW",62,63)]),
    dict(key="macewan-cnd", sha="065c13379b2862bb4f8f8bc21051f22011ae1f2c4df1fd26cdc9ac6e6637e1fe", filename="cnd-nigeria_.pdf", papers=[("CND",1,2)]),
    dict(key="macewan-ga2", sha="abd0ee5a0b544ebb5986e263f527250194fccb338c3e49c195469b16d8431ed3", filename="ga2-nigeria.pdf", papers=[("GA2",1,2)]),
    dict(key="macewan-unesco", sha="184199ec8fcf5519d4becd2d305ad3eabbea92cde41302a68dc3dc955739cd5d", filename="unesco-nigeria_.pdf", papers=[("UNESCO",1,2)]),
    dict(key="macewan-unhcr", sha="4e05ed0b55f8eb45ecd09ee28654b45588352adab0bd221a61a8e0513b1dd428", filename="unhcr-nigeria.pdf", papers=[("UNHCR",1,2)]),
]


def digest(data: bytes | str) -> str:
    return hashlib.sha256(data.encode("utf-8") if isinstance(data, str) else data).hexdigest()


def canonical(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def extract_topics(raw: str) -> list[str]:
    lines = raw.splitlines()
    result = []
    for i, line in enumerate(lines):
        match = re.match(r"^\s*(?:I|II|III)\.\s*(\S.*)$", line)
        if not match:
            continue
        title = match.group(1).strip()
        # A wrapped centered heading has a heavily indented continuation.
        # Body paragraphs in these reviewed documents begin near the margin.
        if i + 1 < len(lines) and re.match(r"^ {15,}\S", lines[i + 1]):
            continuation = lines[i + 1].strip()
            if not re.fullmatch(r"[\divxlc]+", continuation):
                title = title[:-1] + continuation if title.endswith("-") else title + " " + continuation
        result.append(re.sub(r"\s+", " ", title))
    return result


def clean_paper(raw: str) -> str:
    # Retain the paper's original delegation/school header, remove report-only
    # titles and page folios. The unaltered page extraction is saved separately.
    raw = raw[raw.lower().index("delegation from"):]
    lines = []
    for line in raw.splitlines():
        line = line.strip()
        if re.fullmatch(r"(?:\d{1,3}|[ivxlc]{1,8})", line):
            continue
        lines.append(line)
    text = "\n".join(lines)
    text = re.sub(r"(?<=\w)-\n(?=[a-z])", "", text)
    paragraphs = re.split(r"\n\s*\n", text)
    return "\n\n".join(re.sub(r"\s+", " ", p).strip() for p in paragraphs if p.strip()) + "\n"


def relpath(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def bundle_metadata(spec: dict) -> dict:
    s = dict(spec)
    if s["key"].startswith("tuebingen"):
        s.update(school="eberhard-karls-universitat-tubingen", school_name="Eberhard Karls Universität Tübingen", archive=TUEBINGEN+"wp-json/wp/v2/media?search=report&per_page=100", kind="participant_delegation_report")
        if s["year"] <= 2014:
            s["archive"] = TUEBINGEN+"wp-json/wp/v2/media?search=bericht&per_page=100"
    elif s["key"].startswith("macewan"):
        s.update(year=2016, delegation="Nigeria", school="macewan-university", school_name="MacEwan University", archive=MACEWAN, kind="participant_club_original_paper", url="https://macewanhmun.weebly.com/uploads/8/7/7/2/87720974/"+s["filename"])
    return s


def collect(output: Path, max_bytes: int) -> dict:
    output.mkdir(parents=True, exist_ok=True)
    for sub in ("texts", "raw-papers", "provenance"):
        (output / sub).mkdir(exist_ok=True)
    session = requests.Session()
    session.headers["User-Agent"] = "Historical-MUN-local-research/1.0"
    retrieved = datetime.now(timezone.utc).isoformat()
    rows, bundles, total_bytes, seen = [], [], 0, set()
    for original in CATALOG:
        s = bundle_metadata(original)
        pdf = output / (s["key"] + ".pdf")
        if not pdf.exists():
            with session.get(s["url"], timeout=(15, 60), stream=True) as response:
                response.raise_for_status()
                data = bytearray()
                for chunk in response.iter_content(65536):
                    data.extend(chunk)
                    if total_bytes + len(data) > max_bytes:
                        raise RuntimeError("Download budget exceeded")
                if digest(data) != s["sha"]:
                    raise RuntimeError(f"Source changed: {s['key']}; review before accepting new PDF")
                pdf.write_bytes(data)
        data = pdf.read_bytes()
        if digest(data) != s["sha"]:
            raise RuntimeError(f"Cached PDF hash mismatch: {s['key']}")
        total_bytes += len(data)
        if total_bytes > max_bytes:
            raise RuntimeError("PDF byte budget exceeded")
        extracted = output / (s["key"] + ".txt")
        subprocess.run(["pdftotext", "-layout", str(pdf), str(extracted)], check=True, capture_output=True)
        pages = extracted.read_text(encoding="utf-8").split("\f")
        parent = f"nmun-{s['key'].replace('2019', '-2019')}-{s['sha'][:16]}"
        bundle_group = "nmun-ny-2016-macewan-delegation" if s["key"].startswith("macewan") else parent
        for committee, start, end in s["papers"]:
            raw = "\f".join(pages[start-1:end])
            if len(re.findall(r"Position Paper for", raw, re.I)) != 1:
                raise RuntimeError(f"Ambiguous explicit paper boundary: {s['key']}:{start}-{end}")
            text = clean_paper(raw)
            topics = extract_topics(raw)
            if not 2 <= len(topics) <= 3 or not 350 <= len(text.split()) <= 3500:
                raise RuntimeError(f"Unexpected paper shape: {s['key']}:{start}-{end}")
            normhash = digest(canonical(text))
            if normhash in seen:
                raise RuntimeError("Duplicate paper in catalogue")
            seen.add(normhash)
            institution = "kiel" if s["key"].startswith("kiel") else "tuebingen" if s["key"].startswith("tuebingen") else "macewan"
            sid = f"nmun-{s['year']}-{institution}-{committee.lower()}-p{start:03d}-{s['sha'][:8]}"
            path = output / "texts" / (sid + ".txt")
            path.write_text(text, encoding="utf-8")
            rawpath = output / "raw-papers" / (sid + ".txt")
            rawpath.write_text(raw, encoding="utf-8")
            rows.append(dict(source_id=sid, conference="NMUN-NY", year=s["year"], committee=committee,
                committee_topic_group_id=f"nmun-ny-{s['year']}-{committee.lower()}", parent_document_id=parent,
                parent_bundle_id=bundle_group, school_group_id=s["school"], school=s["school_name"],
                school_year_group_id=f"nmun-ny-{s['year']}-{s['school']}", delegation=s["delegation"], topics=topics,
                topic_family_sha256=digest(canonical(" | ".join(topics))), page_start=start, page_end=end,
                boundary_basis="Reviewed explicit delegation/committee header and next paper or report-section boundary",
                text_path=relpath(path), raw_text_path=relpath(rawpath), pdf_path=relpath(pdf),
                pdf_sha256=s["sha"], text_sha256=digest(text), normalized_text_sha256=normhash,
                raw_text_sha256=digest(raw), word_count=len(text.split()), label=0,
                label_kind="historical_human_proxy", authorship_verified=False,
                source_url=s["url"], archive_url=s["archive"], source_kind=s["kind"],
                date_basis="Dated delegation report" if institution != "macewan" else "Club archive attribution plus NMUN 2016 official programme delegation-school assignment",
                date_corroboration_url=PROGRAM_2016 if institution == "macewan" else None,
                rights="Copyright status retained; no open redistribution/training licence located; public access is not a licence",
                redistribution_allowed=None, reuse_permission_verified=False,
                template_group_id="nmun-position-paper-format", collected_at=retrieved))
        bundles.append(dict(parent_document_id=parent, parent_bundle_id=bundle_group, key=s["key"], year=s["year"], school_group_id=s["school"], source_url=s["url"], pdf_sha256=s["sha"], pdf_bytes=len(data), paper_count=len(s["papers"])))
    def jsonl(path: Path, values: list[dict]):
        path.write_text("".join(json.dumps(v, ensure_ascii=False, sort_keys=True)+"\n" for v in values), encoding="utf-8")
    jsonl(output / "manifest.jsonl", rows)
    topic_keys = ("source_id", "conference", "year", "committee", "committee_topic_group_id", "parent_document_id", "parent_bundle_id", "delegation", "topics", "school_group_id", "school_year_group_id", "source_url", "archive_url", "page_start", "page_end", "text_path")
    jsonl(output / "topics.jsonl", [dict({k:r[k] for k in topic_keys}, metadata_only=True) for r in rows])
    jsonl(output / "bundles.jsonl", bundles)
    summary = dict(papers=len(rows), parent_pdfs=len(bundles), pdf_bytes=total_bytes,
        parent_bundle_groups=len({r["parent_bundle_id"] for r in rows}),
        years=dict(sorted(Counter(str(r["year"]) for r in rows).items())),
        schools=dict(Counter(r["school_group_id"] for r in rows)),
        committee_topic_groups=len({r["committee_topic_group_id"] for r in rows}),
        exact_unique=len({r["text_sha256"] for r in rows}), normalized_unique=len(seen),
        topics=sum(len(r["topics"]) for r in rows), word_min=min(r["word_count"] for r in rows),
        word_max=max(r["word_count"] for r in rows), collected_at=retrieved,
        label_kind="historical_human_proxy", authorship_verified=False)
    (output / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--max-mb", type=int, default=200)
    args = parser.parse_args()
    print(json.dumps(collect(args.output.resolve(), args.max_mb * 1_000_000), indent=2))
