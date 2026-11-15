"""Collect historical MUNOL position papers, with provenance and uncertain labels.

Full downloads/text stay in ignored .local/mun-data. Public availability does not
confer a redistribution or training licence. No OCR, authorship certification,
model fitting, or automatic train/test assignment is performed here.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path
import re
import subprocess
import threading
import unicodedata
from urllib.parse import urlencode

import requests

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = "https://munol.org/conference/delegate-center/"
# These directories are linked by the official archive, not inferred PDF URLs.
DIRECTORIES = {
    2016: ["ECOSOC Sub 1", "ECOSOC Sub 2", "GA1", "GA2", "GA4", "GA6", "HRC", "PBC", "SCOR"],
    2017: ["EC", "GA1", "GA3", "GA4", "SC", "SCOR"],
    2019: ["GA1", "GA2", "GA4", "HRC", "SC"],
}
TOPIC_KEYS = ["source_id", "parent_document_id", "year", "committee", "delegation", "topics", "source_group_id", "group_id", "school_group_id", "conference_group_id", "committee_topic_group_id", "template_family_id", "words", "archive_url"]


def digest(value):
    return hashlib.sha256(value if isinstance(value, bytes) else value.encode()).hexdigest()


def slug(value):
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def plain(value):
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", value)).split())


def discover(year, committee, output):
    url = ARCHIVE + "?" + urlencode({"drawer1": f"{year}*{committee}"})
    response = requests.get(url, timeout=35)
    response.raise_for_status()
    page = response.text
    target = re.search(rf'<h3[^>]*>Position Papers {year}</h3>(.*?)(?=<h3|$)', page, re.S)
    if not target:
        raise ValueError(f"Historical section missing: {year} {committee}")
    archive_id = f"munol-{year}-{slug(committee)}"
    (output / "archive-pages" / f"{archive_id}.html").write_text(page)
    items, seen = [], set()
    for row in re.findall(r"<tr\b[^>]*>.*?</tr>", target.group(1), re.S):
        name = re.search(r"class=['\"]ssfa-filename['\"][^>]*>(.*?)</span>", row, re.S)
        link = re.search(r'href="([^"]*class\.fileaway_downloader\.php\?[^"]+)"', row)
        if not name or not link or not re.search(r"<br\s*/?>\s*pdf\b", row, re.I):
            continue
        label = plain(name.group(1))
        if label in seen:
            continue
        seen.add(label)
        modified = re.search(r"class=['\"]ssfa-sortdate['\"][^>]*data-value=['\"](\d+)['\"]", row)
        source_id = f"{archive_id}-{slug(label)}-{digest(label)[:8]}"
        items.append({"source_id": source_id, "parent_document_id": source_id,
                      "conference": "Model United Nations of Lubeck (MUNOL)", "year": year,
                      "committee": committee, "archive_label": label, "archive_url": url,
                      "source_url": html.unescape(link.group(1)), "archive_page_sha256": digest(response.content),
                      "archive_modified_value": modified.group(1) if modified else None,
                      "conference_group_id": f"munol-{year}",
                      "committee_topic_group_id": archive_id,
                      "template_family_id": "munol-position-paper"})
    return items


def extract_topics(lines):
    topics = []
    for i, line in enumerate(lines):
        match = re.match(r"^\s*([IVX]{1,4})[.)]\s+(.+)", line)
        if not match or not 8 <= len(match.group(2)) <= 190:
            continue
        title = match.group(2).strip()
        # A heading wrapped at the margin is contiguous and followed by a blank.
        if i + 2 < len(lines) and lines[i + 1].strip() and not lines[i + 2].strip():
            continuation = lines[i + 1].strip()
            if len(continuation) < 95 and not re.match(r"^[IVX]{1,4}[.)]", continuation):
                title += " " + continuation
        if title not in topics:
            topics.append(title)
    return topics


def extract_school(lines):
    pattern = re.compile(r"gymnasium|gymnasi|school|college|lyc[eé]|lyze|liceo|university|gimnaz|skola|schule|lise|katedr|johanneum|katharineum|ernestinum", re.I)
    header_end = next((i for i, line in enumerate(lines[:24]) if re.search(r"position paper for", line, re.I)), 24)
    for line_index, line in enumerate(lines[:header_end]):
        parts = re.split(r"\s{3,}", line.strip())
        for value in reversed(parts):
            if pattern.search(value) and not re.search(r"position paper|name of|school name|student and school|^school$|committee", value, re.I):
                # Older templates put "delegate name, institution" on one line.
                # Discard leading chunks lacking an institutional word; never
                # use the delegate name as a school or cross-split identity key.
                chunks = re.split(r"[,;]|\.\s+", value)
                first = next((i for i, chunk in enumerate(chunks) if pattern.search(chunk)), None)
                if first is not None:
                    institution = ", ".join(chunk.strip() for chunk in chunks[first:] if chunk.strip())
                    if institution.lower() in {"gymnasium", "school", "college"}:
                        previous = re.split(r"\s{3,}", lines[line_index - 1].strip())[-1] if line_index else ""
                        if "," in previous and previous.rsplit(",", 1)[1].strip():
                            institution = previous.rsplit(",", 1)[1].strip() + " " + institution
                        elif line_index + 1 < header_end and lines[line_index + 1].strip():
                            institution += " " + re.split(r"\s{3,}", lines[line_index + 1].strip())[-1]
                        else:
                            return None
                    for canonical, expression in [
                        ("Carl-Jacob-Burckhardt-Gymnasium", r"carl[- ]jacob[- ]burckhardt[- ]gymnasium"),
                        ("Nyborg Gymnasium", r"nyborg\s+gymnasium"),
                        ("Liceo Farnesina", r"liceo\s+farnesina"),
                    ]:
                        if re.search(expression, institution, re.I):
                            return canonical
                    return institution
    return None


def school_group(school):
    if not school:
        return None
    normalized = slug(school).replace("internationalschool", "international-school").replace("-school", "-schule").replace("tallin-", "tallinn-")
    normalized = normalized.replace("leibnizgymnasium", "leibniz-gymnasium")
    normalized = normalized.replace("cheng-gong", "chenggong").replace("theodorianium", "theodorianum")
    normalized = normalized.replace("schwarzenbeck", "schwarzenbek")
    # Conservative known aliases collapse translations/location suffixes. These
    # are institution strings from the archive, not identity inferences.
    for stem in ["thomas-mann", "carl-jacob-burckhardt", "leibniz-gymnasium",
                 "malmo-borgarskola", "gymnasium-rahlstedt", "gymnasium-klosterschule",
                 "gymnasium-meiendorf", "helene-lange-gymnasium", "luisengymnasium",
                 "gymnasium-theodorianum", "johanneum", "katharineum",
                 "gymnasium-schwarzenbek", "lutherschule", "rupprecht-gymnasium",
                 "leibniz-gymnasium", "stormarnschule", "kursunoglu", "metu",
                 "klosterschule", "am-sonnenkamp", "alstergymnasium", "enskilda-gymnasiet",
                 "manara", "chenggong", "mihai-viteazul", "schule-groningen"]:
        if stem in normalized:
            normalized = stem
            break
    return "school-" + normalized


def delegation_from_label(label, committee):
    result = re.sub(r"\s+(?:GA\s*\d|HRC|SCOR|SC|PBC|ECOSOC.*|EC)(?:[- _]\d+)?$", "", label, flags=re.I)
    return re.sub(r"^" + re.escape(committee) + r"[\s_-]+", "", result, flags=re.I).strip()


def clean_body(raw):
    lines = raw.replace("\x0c", "\n").splitlines()
    start = next((i for i, line in enumerate(lines) if re.match(r"^\s*I[.)]\s+\S", line)), None)
    if start is None:
        start = next((i + 1 for i, line in enumerate(lines) if re.search(r"position paper for", line, re.I)), 0)
    kept = []
    for line in lines[start:]:
        if re.search(r"Position Paper\s+.*Model United Nations|Model United Nations of L[uü]beck\s+20\d\d", line):
            continue
        if re.fullmatch(r"\s*(?:Page\s+)?\d+(?:\s+of\s+\d+)?\s*", line):
            continue
        kept.append(line.rstrip())
    # Preserve paragraph breaks, remove PDF layout line wraps, and do not rewrite prose.
    text = "\n\n".join(" ".join(block.split()) for block in re.split(r"\n\s*\n", "\n".join(kept)) if block.strip())
    return text, start


def topic_sections(text, topics):
    """Offsets into unchanged cleaned text; keep all sections with their parent."""
    matches = list(re.finditer(r"(?:^|\n\n)([IVX]{1,4})[.)]\s+", text))
    result = []
    for i, match in enumerate(matches):
        start = match.start(1)
        end = matches[i + 1].start(1) if i + 1 < len(matches) else len(text)
        section = text[start:end].strip()
        after_marker = text[match.end():end]
        title = next((topic for topic in topics if after_marker.lower().startswith(topic.lower())), None)
        result.append({"section_index": i, "roman_marker": match.group(1), "topic": title,
                       "start": start, "end": end, "offset_encoding": "unicode_code_points",
                       "words": len(section.split()), "text_sha256": digest(" ".join(section.lower().split())),
                       "boundary_method": "blank-line-roman-section-heading"})
    return result


def refresh_metadata(output):
    """Reparse local metadata after collector changes; never fetch or relabel text."""
    manifest = output / "manifest.jsonl"
    records = [json.loads(line) for line in manifest.read_text().splitlines() if line]
    for record in records:
        raw = (ROOT / record["raw_text_path"]).read_text()
        record["school"] = extract_school(raw.replace("\x0c", "\n").splitlines())
        record["school_group_id"] = school_group(record["school"])
        record["group_id"] = record["school_group_id"] or record["conference_group_id"] + "-unknown-school"
        record["school_parse_status"] = "heuristic_from_pdf_header" if record["school"] else "unknown"
        record["delegation"] = delegation_from_label(record["archive_label"], record["committee"])
        record["delegation_provenance"] = "official_archive_filename_not_independently_validated"
        record["historical_year_in_header"] = str(record["year"]) in raw[:600]
        record["topic_sections"] = topic_sections((ROOT / record["text_path"]).read_text(), record["topics"])
    temporary = output / "manifest-refreshed.jsonl"
    temporary.write_text("".join(json.dumps(record, ensure_ascii=False) + "\n" for record in records))
    temporary.replace(manifest)
    (output / "topics.jsonl").write_text("".join(json.dumps({key: r[key] for key in TOPIC_KEYS}, ensure_ascii=False) + "\n" for r in records))
    summary_path = output / "summary.json"
    summary = json.loads(summary_path.read_text())
    summary.update({"school_known": sum(r["school"] is not None for r in records),
                    "unique_schools": len({r["school_group_id"] for r in records if r["school_group_id"]}),
                    "historical_year_in_header": sum(r["historical_year_in_header"] for r in records)})
    summary_path.write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / ".local/mun-data")
    parser.add_argument("--per-directory", type=int, default=12)
    parser.add_argument("--max-papers", type=int, default=240)
    parser.add_argument("--max-mb", type=int, default=140)
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--refresh-metadata", action="store_true", help="Reparse existing local headers without network requests")
    parser.add_argument("--reuse-discovery", action="store_true", help="Use the saved download manifest without requesting archive pages again")
    args = parser.parse_args()
    output = args.output.resolve()
    for directory in ["pdf", "raw-text", "text", "archive-pages", "preview"]:
        (output / directory).mkdir(parents=True, exist_ok=True)
    if args.refresh_metadata:
        refresh_metadata(output)
        return
    candidates, discovery_errors = [], []
    if args.reuse_discovery:
        candidates = json.loads((output / "download-manifest.json").read_text())
    for year, directories in ({} if args.reuse_discovery else DIRECTORIES).items():
        for committee in directories:
            try:
                found = discover(year, committee, output)
                # Spread over alphabetic country list rather than taking its prefix.
                count = min(len(found), args.per_directory)
                chosen = [found[round(i * (len(found) - 1) / max(count - 1, 1))] for i in range(count)]
                candidates.extend(chosen)
                print(json.dumps({"discovered": len(found), "selected": len(chosen), "year": year, "committee": committee}), flush=True)
            except Exception as error:
                discovery_errors.append({"year": year, "committee": committee, "error": str(error)})
    candidates = candidates[:args.max_papers]
    (output / "download-manifest.json").write_text(json.dumps(candidates, indent=2))
    lock = threading.Lock()
    bytes_used = sum(path.stat().st_size for path in (output / "pdf").glob("*.pdf"))

    def collect(item):
        nonlocal bytes_used
        source_id = item["source_id"]
        path = output / "pdf" / f"{source_id}.pdf"
        if not path.exists():
            response = requests.get(item["source_url"], timeout=45)
            response.raise_for_status()
            data = response.content
            if not data.startswith(b"%PDF-") or len(data) > 8_000_000:
                raise ValueError("Not a bounded PDF response")
            with lock:
                if bytes_used + len(data) > args.max_mb * 1_000_000:
                    raise ValueError("Download byte budget reached")
                bytes_used += len(data)
                path.write_bytes(data)
        data = path.read_bytes()
        raw_path = output / "raw-text" / f"{source_id}.txt"
        subprocess.run(["pdftotext", "-layout", str(path), str(raw_path)], check=True, capture_output=True, timeout=25)
        raw = raw_path.read_text(errors="replace")
        text, removed_header_lines = clean_body(raw)
        if len(text) < 300:
            raise ValueError("Insufficient extracted text; OCR not attempted")
        text_path = output / "text" / f"{source_id}.txt"
        text_path.write_text(text)
        school = extract_school(raw.replace("\x0c", "\n").splitlines())
        delegation = delegation_from_label(item["archive_label"], item["committee"])
        school_id = school_group(school)
        result = {**item,
                  "delegation": delegation, "school": school, "school_group_id": school_id,
                  "delegation_provenance": "official_archive_filename_not_independently_validated",
                  "school_parse_status": "heuristic_from_pdf_header" if school else "unknown",
                  "source_group_id": source_id,
                  "group_id": school_id or item["conference_group_id"] + "-unknown-school",
                  "topics": extract_topics(raw.replace("\x0c", "\n").splitlines()),
                  "pdf_sha256": digest(data), "pdf_bytes": len(data),
                  "text_sha256": digest(" ".join(text.lower().split())),
                  "text_path": str(text_path.relative_to(ROOT)), "raw_text_path": str(raw_path.relative_to(ROOT)),
                  "pdf_path": str(path.relative_to(ROOT)), "characters": len(text), "words": len(text.split()),
                  "pages": raw.count("\x0c"), "removed_header_lines": removed_header_lines,
                  "historical_year_in_header": str(item["year"]) in raw[:600],
                  "topic_sections": topic_sections(text, extract_topics(raw.replace("\x0c", "\n").splitlines())),
                  "label": 0, "label_type": "historical_human_proxy",
                  "label_confidence": "historical_provenance_not_verified_authorship",
                  "authorship_verified": False, "source_type": "official_conference_archive",
                  "license": "No reuse license identified; public access is not a redistribution license",
                  "redistribution_allowed": False, "training_rights_status": "unverified",
                  "retrieved_at": datetime.now(timezone.utc).isoformat(), "split": "unassigned"}
        return result

    records, errors = [], discovery_errors
    # Incremental metadata helps downstream generation start before collection ends.
    manifest_path = output / "manifest.jsonl"
    topics_path = output / "topics.jsonl"
    with manifest_path.open("w") as manifest, topics_path.open("w") as topics_file:
        with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 4))) as pool:
            futures = [(item, pool.submit(collect, item)) for item in candidates]
            for item, future in futures:
                try:
                    record = future.result()
                    records.append(record)
                    manifest.write(json.dumps(record, ensure_ascii=False) + "\n"); manifest.flush()
                    metadata = {key: record[key] for key in TOPIC_KEYS}
                    topics_file.write(json.dumps(metadata, ensure_ascii=False) + "\n"); topics_file.flush()
                    if len(records) % 12 == 0:
                        print(json.dumps({"extracted": len(records), "pdf_bytes": bytes_used}), flush=True)
                except Exception as error:
                    errors.append({"source_id": item["source_id"], "error": str(error)})
    exact = {}
    for record in records:
        exact.setdefault(record["text_sha256"], []).append(record["source_id"])
    summary = {"records": len(records), "pdf_bytes": bytes_used,
               "years": {str(year): sum(r["year"] == year for r in records) for year in DIRECTORIES},
               "school_known": sum(r["school"] is not None for r in records),
               "topic_headings_found": sum(bool(r["topics"]) for r in records),
               "unique_schools": len({r["school_group_id"] for r in records if r["school_group_id"]}),
               "exact_duplicate_groups": [ids for ids in exact.values() if len(ids) > 1],
               "errors": errors, "automatic_split_assignment": False,
               "authorship_note": "Historical pre-2020 conference provenance is a human-writing proxy, not certified authorship.",
               "rights_note": "Full texts/downloads remain ignored and local. No open reuse licence identified."}
    (output / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
