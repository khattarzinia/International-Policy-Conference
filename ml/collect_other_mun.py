"""Collect official historical SRMUN papers for an untouched conference holdout.

Only public archive links are followed. No scoring, training, or generation occurs.
Full texts/PDFs remain in ignored local storage; topics.jsonl contains metadata only.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path
import re
import subprocess
import time
import unicodedata
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = "https://www.srmun.org/papers/historical.php"
USER_AGENT = "Mozilla/5.0 (compatible; IPC public-research collection)"
QA_INSPECTED = {
    "ATL2018_gaplen_china_44.pdf",  # Visual and text QA sample.
    "ATL2016_gaplen_holy_see_180.pdf",  # Primary-source web inspection.
    "ATL_2011_SC.pdf",  # Primary-source web inspection.
    "ATL_2012_IAEA.pdf",  # Header/topic inconsistency inspected; quarantined below.
}
QUARANTINED = {
    "ATL_2012_IAEA.pdf": {
        "reason": "paper_agenda_inconsistent_with_stated_committee",
        "observed_pdf_sha256": "fa8003d90ea8888c4f6bbc7a1bcb1dd930edb72a9b0bddf6dede36b735669b42",
        "evidence": "Archive and PDF header identify Germany/IAEA, but all three agenda headings match the 2012 General Assembly agenda. Retained raw; excluded from evaluation and generation pending independent verification.",
    },
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def slug(text):
    plain = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain.lower()).strip("-")


def clean_html(text):
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", text)).split())


def fetch(url, limit, kind="application/pdf"):
    if urlparse(url).hostname != "www.srmun.org":
        raise ValueError("Only official SRMUN archive URLs are permitted")
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": kind})
    with urlopen(request, timeout=25) as response:
        if urlparse(response.url).hostname != "www.srmun.org":
            raise ValueError("Unexpected off-site redirect")
        data = response.read(limit + 1)
        if len(data) > limit:
            raise ValueError("Download exceeds configured bound")
        return data, dict(response.headers)


def archive_records(page):
    """Associate each public table row with its preceding conference heading."""
    conference = None
    result = []
    for match in re.finditer(r"<h5\b[^>]*>.*?</h5>|<tr\b[^>]*>.*?</tr>", page, re.I | re.S):
        fragment = match.group()
        if fragment.lower().startswith("<h5"):
            heading = clean_html(fragment)
            year = re.search(r"\b(20\d{2})\b", heading)
            city = re.search(r"SRMUN\s+(Atlanta|Charlotte|Charlote)", heading, re.I)
            conference = {"year": int(year.group()), "city": city.group(1).replace("Charlote", "Charlotte"),
                          "conference_heading": heading} if year and city else None
            continue
        cells = re.findall(r"<td\b[^>]*>(.*?)</td>", fragment, re.I | re.S)
        if not conference or len(cells) != 3:
            continue
        # The official page contains spaced attributes and malformed closing anchors.
        # Read the URL and table cell independently instead of requiring valid nesting.
        link = re.search(r'<a\b[^>]*href\s*=\s*["\x27]([^"\x27]+\.pdf)["\x27]', cells[0], re.I | re.S)
        if not link:
            continue
        url = urljoin(ARCHIVE, html.unescape(link.group(1)))
        filename = Path(urlparse(url).path).name
        filename_year = re.search(r"20\d{2}", filename)
        result.append({**conference, "source_url": url, "filename": filename,
                       "committee": re.sub(r"^\d+\.\s*", "", clean_html(cells[0])), "delegation": clean_html(cells[1]),
                       "school": clean_html(cells[2]),
                       "filename_year": int(filename_year.group()) if filename_year else None})
    return result


def topic_headings(text):
    """Conservatively extract Roman-numeral topic headings, never full paragraphs."""
    lines = text.replace("\f", "\n").splitlines()
    result = []
    for index, line in enumerate(lines):
        value = " ".join(line.split())
        match = re.match(r"^(?:[IVX]{1,5})[.)]\s+(.+)$", value)
        if not match or not 5 <= len(match.group(1)) <= 180 or not match.group(1)[0].isupper():
            continue
        title = match.group(1)
        # A heading may wrap once; paragraph starts generally have blank separation.
        if index + 1 < len(lines):
            following = " ".join(lines[index + 1].split())
            if following and len(following) < 75 and not re.match(r"^[IVX]+[.)]", following) and not re.search(r"[.!?]$", following):
                title += " " + following
        if title not in result:
            result.append(title)
    return result


def normalized(text):
    return " ".join(unicodedata.normalize("NFKC", text).lower().split())


def write_jsonl(path, records):
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in records))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / ".local/mun-expansion/other")
    parser.add_argument("--minimum-year", type=int, default=2008)
    parser.add_argument("--maximum-year", type=int, default=2021)
    parser.add_argument("--max-papers", type=int, default=200)
    parser.add_argument("--max-total-mb", type=int, default=120)
    parser.add_argument("--refresh-index", action="store_true")
    args = parser.parse_args()
    if args.maximum_year > 2021:
        raise ValueError("This historical proxy collection excludes papers after 2021")
    out = args.output
    for folder in [out, out / "pdf", out / "raw-text", out / "text", out / "qa"]:
        folder.mkdir(parents=True, exist_ok=True)
    listing = out / "srmun-index.html"
    if not listing.exists() or args.refresh_index:
        listing.write_bytes(fetch(ARCHIVE, 3_000_000, "text/html")[0])
    candidates = archive_records(listing.read_text(errors="replace"))
    selected, exclusions, seen_urls = [], [], set()
    for item in candidates:
        if not args.minimum_year <= item["year"] <= args.maximum_year:
            continue
        if item["filename_year"] and item["filename_year"] != item["year"]:
            exclusions.append({**item, "reason": "archive_link_year_disagrees_with_heading"})
            continue
        if item["committee"] in {"International Court of Justice", "International Criminal Court"}:
            exclusions.append({**item, "reason": "court_case_brief_not_general_position_paper_genre"})
            continue
        if "unesco" in item["filename"].lower() and "Environmental" in item["committee"]:
            exclusions.append({**item, "reason": "archive_committee_disagrees_with_link_filename"})
            continue
        if item["source_url"] in seen_urls:
            exclusions.append({**item, "reason": "duplicate_or_mislinked_archive_url"})
            continue
        seen_urls.add(item["source_url"])
        selected.append(item)
    selected = selected[:args.max_papers]
    records, raw_records, prompts, failures = [], [], [], []
    seen_text, seen_pdf = set(), set()
    total_bytes = 0
    fetched_at = datetime.now(timezone.utc).isoformat()
    for index, item in enumerate(selected):
        name = item["filename"]
        pdf = out / "pdf" / name
        try:
            if not pdf.exists():
                if total_bytes + 4_000_000 > args.max_total_mb * 1024 * 1024:
                    raise ValueError("Collection download budget reached")
                content, headers = fetch(item["source_url"], 4_000_000)
                if not content.startswith(b"%PDF-"):
                    raise ValueError("Official link did not return PDF bytes")
                pdf.write_bytes(content)
                time.sleep(.12)
            content = pdf.read_bytes()
            total_bytes += len(content)
            if total_bytes > args.max_total_mb * 1024 * 1024:
                raise ValueError("Existing collection exceeds download budget")
            pdf_hash = digest(content)
            if pdf_hash in seen_pdf:
                exclusions.append({**item, "reason": "duplicate_pdf_hash"})
                continue
            raw = out / "raw-text" / (pdf.stem + ".txt")
            subprocess.run(["pdftotext", "-layout", str(pdf), str(raw)], check=True, capture_output=True, timeout=30)
            raw_text = raw.read_text(errors="replace")
            text = raw_text.replace("\x00", "").strip()
            # Keep original wording and internal line layout; no paraphrasing/OCR guesses.
            text_hash = digest(normalized(text).encode())
            if text_hash in seen_text:
                exclusions.append({**item, "reason": "duplicate_normalized_text"})
                continue
            words = len(text.split())
            if words < 250 or len(text) > 150000:
                exclusions.append({**item, "reason": "unreadable_short_or_oversized_extraction", "words": words})
                continue
            source_id = "srmun-" + slug(pdf.stem)
            text_path = out / "text" / (source_id + ".txt")
            text_path.write_text(text)
            info = subprocess.run(["pdfinfo", "-isodates", str(pdf)], capture_output=True, text=True, timeout=15)
            pdf_info = {line.split(":", 1)[0].strip(): line.split(":", 1)[1].strip()
                        for line in info.stdout.splitlines() if ":" in line}
            family = f"srmun-{slug(item['city'])}-{item['year']}"
            group = family + "-" + slug(item["committee"])
            school_group = "school-" + slug(item["school"])
            row = {**item, "record_id": source_id, "source_id": source_id,
                   "parent_document_id": source_id, "source_group_id": source_id,
                   "conference": "Southern Regional Model United Nations", "conference_id": "srmun",
                   "conference_group_id": family, "committee_topic_group_id": group,
                   "school_group_id": school_group, "group_id": group,
                   "source_name": "Official SRMUN highest-scoring position-paper archive",
                   "archive_url": ARCHIVE, "archive_sha256": digest(listing.read_bytes()),
                   "year_evidence": "Official conference heading in archive, checked against URL filename where available",
                   "school_evidence": "Official archive table column: Represented by",
                   "topics": topic_headings(text), "pdf_path": str(pdf.relative_to(ROOT)),
                   "raw_text_path": str(raw.relative_to(ROOT)), "text_path": str(text_path.relative_to(ROOT)),
                   "pdf_sha256": pdf_hash, "text_sha256": text_hash,
                   "exact_text_sha256": digest(text.encode()), "words": words,
                   "characters": len(text), "pdf_bytes": len(content), "pdf_metadata": pdf_info,
                   "label": 0, "model": "historical_human_proxy", "authorship_verified": False,
                   "label_basis": "Official archive attributes historical delegate paper to an institution; pre-2022 conference date is a human-authorship proxy, not individual attestation",
                   "selection_bias": "Archive contains highest-scoring papers, not representative all-submission sampling",
                   "source_license": "No reuse license identified; official site states All Rights Reserved",
                   "rights_status": "Publicly accessible copyrighted text; local research evaluation only; no redistribution permission inferred",
                   "split": "external_conference_holdout", "training_allowed": False,
                   "validation_allowed": False, "evaluation_only": True, "scores_seen": False,
                   "retrieved_at": fetched_at, "generation_pairing_excluded": name in QA_INSPECTED}
            raw_records.append(row)
            if name in QUARANTINED:
                quarantine = QUARANTINED[name]
                row.update(quarantined=True, quarantine_reason=quarantine["reason"],
                           evaluation_allowed=False, generation_pairing_excluded=True)
                exclusions.append({**item, **quarantine, "pdf_sha256": pdf_hash,
                                   "source_id": source_id, "retained_raw": True})
                # Keep exact downloaded text and provenance, but never expose this
                # record to the usable evaluation or metadata-generation manifests.
                continue
            records.append(row)
            prompts.append({key: row[key] for key in ["record_id", "source_id", "parent_document_id", "source_group_id",
                           "conference", "conference_id", "conference_group_id", "year", "committee", "delegation",
                           "topics", "committee_topic_group_id", "school_group_id", "source_url", "archive_url",
                           "words", "generation_pairing_excluded", "split", "training_allowed", "validation_allowed"]})
            seen_text.add(text_hash)
            seen_pdf.add(pdf_hash)
        except Exception as error:
            failures.append({**item, "error": type(error).__name__, "message": str(error)[:250]})
        write_jsonl(out / "records.jsonl", records)
        write_jsonl(out / "topics.jsonl", prompts)
        if (index + 1) % 10 == 0:
            print(json.dumps({"processed": index + 1, "accepted": len(records), "failed": len(failures)}), flush=True)
    write_jsonl(out / "exclusions.jsonl", exclusions)
    write_jsonl(out / "failures.jsonl", failures)
    write_jsonl(out / "records-raw.jsonl", raw_records)
    # Final writes also cover the case where the last candidate was quarantined.
    write_jsonl(out / "records.jsonl", records)
    write_jsonl(out / "topics.jsonl", prompts)
    summary = {"conferenceHoldout": "srmun", "reservedForFinalEvaluation": True,
               "trainingAllowed": False, "validationAllowed": False, "scoringPerformed": False,
               "archive": ARCHIVE, "archiveSha256": digest(listing.read_bytes()),
               "records": len(records), "rawCollectedRecords": len(raw_records),
               "quarantinedRecords": sum(bool(r.get("quarantined")) for r in raw_records),
               "uniquePdfHashes": len(seen_pdf), "uniqueTextHashes": len(seen_text),
               "years": dict(sorted(Counter(row["year"] for row in records).items())),
               "institutions": len({row["school_group_id"] for row in records}),
               "committeeYearGroups": len({row["committee_topic_group_id"] for row in records}),
               "recordsWithTopics": sum(bool(row["topics"]) for row in records),
               "pdfBytes": total_bytes, "failed": len(failures), "excluded": len(exclusions),
               "words": {"min": min((r["words"] for r in records), default=0),
                         "max": max((r["words"] for r in records), default=0)},
               "recordsSha256": digest((out / "records.jsonl").read_bytes()),
               "rawRecordsSha256": digest((out / "records-raw.jsonl").read_bytes()),
               "topicsSha256": digest((out / "topics.jsonl").read_bytes()),
               "retrievedAt": fetched_at,
               "limitations": ["Historical human proxy; not authorship attestation", "High-scoring-paper selection bias",
                               "PDF extraction includes citations and formatting artifacts", "Public access does not grant redistribution rights"]}
    (out / "provenance.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
