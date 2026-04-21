#!/usr/bin/env python3
"""
Harmonize markdown formatting for above-the-parapet archive posts.

Modes:
- report: write an ambiguity report to tmp/parapet-format-report.md
- apply: apply deterministic normalizations only
"""

from __future__ import annotations

import argparse
import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "above-the-parapet"
REPORT_PATH = ROOT / "tmp" / "parapet-format-report.md"

DATE_ONLY_RE = re.compile(r"^\d{1,2} [A-Za-z]+ \d{4}$")
LEN_SIGNATURE_RE = re.compile(r"^[\s*_.`-]*len\s+collinson[\s*_.`-]*$", re.IGNORECASE)
LEADIN_RE = re.compile(r"^\*\*([^*]+?)\*\*(?:\s+(.*))?$")
BULLET_STAR_RE = re.compile(r"^(\s*)\*\s+(.*)$")
BULLET_ENDASH_RE = re.compile(r"^([\s\u00A0]*)[–—]\s+(.*)$")
JOINED_WORD_RE = re.compile(r"(?<![A-Za-z])[a-z]{2,}[A-Z][a-z]{2,}")
ITALIC_WITH_EXTRA_STAR_RE = re.compile(r"\*([^*\n]+?)\*\*")
DOUBLE_STAR_GAP_RE = re.compile(r"(?<=[.!?'\u2019\"”])\*\*\s+\*\*")
EMPHASIS_SPAN_RE = re.compile(r"\*\*[^*\n]+\*\*|\*[^*\n]+\*")
CITATION_SPLIT_RE = re.compile(
    r"(?:(?<=[.;),])|(?<=\*))\s+"
    r"(Quoted in|quoted in|quoted on|according to|On the|on the|In The|in The|In the|in the)\b"
)
CITATION_PREFIX_RE = re.compile(
    r"^(Quoted in|quoted in|quoted on|according to|On the|on the|In The|in The|In the|in the)\b"
)
SPLIT_APOSTROPHE_RE = re.compile(
    r"([A-Za-z])([’'])\s+"
    r"(ll|re|ve|nt|d|m|s|t)\b",
    re.IGNORECASE,
)

# Common proper names/brands that contain intentional internal capitals.
JOINED_WORD_ALLOWLIST = {
    "MoneyWeek",
    "PowerPoint",
    "MotleyFool",
    "BlackBerry",
    "AmericanThinker",
    "RefDesk",
    "TheWeek",
    "CareerBuilder",
    "NextDraft",
    "YouGov",
    "LnikedIn",
}


@dataclass
class FileReport:
    path: Path
    joined_words: list[tuple[int, str]]
    malformed_emphasis: list[tuple[int, str]]
    collapsed_structures: list[tuple[int, str]]

    @property
    def has_findings(self) -> bool:
        return bool(self.joined_words or self.malformed_emphasis or self.collapsed_structures)


def iter_post_files() -> Iterable[Path]:
    for path in sorted(CONTENT_DIR.glob("*.md")):
        if path.name == "_index.md":
            continue
        yield path


def split_front_matter(raw: str) -> tuple[str, str]:
    """Preserve front matter block exactly when present."""
    lines = raw.splitlines(keepends=True)
    if not lines:
        return "", ""
    if lines[0].strip() != "---":
        return "", raw

    for idx in range(1, len(lines)):
        if lines[idx].strip() == "---":
            return "".join(lines[: idx + 1]), "".join(lines[idx + 1 :])
    # Malformed front matter: treat as plain body.
    return "", raw


def normalize_body(body: str) -> str:
    body = body.replace("\r\n", "\n").replace("\r", "\n")
    # Common extraction artifact: marker-only separator within a paragraph.
    body = re.sub(r"[ \t]*\*\*\*\*[ \t]*", "\n\n", body)
    # Adjacent closed/open strong markers after sentence punctuation are usually
    # missing paragraph boundaries from source extraction.
    body = DOUBLE_STAR_GAP_RE.sub("**\n\n**", body)
    lines = body.split("\n")

    out: list[str] = []
    pending_quote_opener: str | None = None
    for raw_line in lines:
        line = raw_line.rstrip()
        line = line.lstrip()
        line = line.replace("** **", " ")
        line = fix_split_apostrophes(line)
        line = ITALIC_WITH_EXTRA_STAR_RE.sub(r"*\1*", line)

        if pending_quote_opener and line:
            if first_quote_index(line) != 0 and not line.startswith(("#", "- ", "> ", "|")):
                line = f"{pending_quote_opener}{line}"
            pending_quote_opener = None

        m = BULLET_STAR_RE.match(line)
        if m:
            line = f"{m.group(1)}- {m.group(2)}"
        else:
            m = BULLET_ENDASH_RE.match(line)
            if m:
                line = f"{m.group(1)}- {m.group(2)}"

        dangling_heading_quote = re.match(r"^(###\s+.+?)\s+([‘'\"])\s*$", line)
        if dangling_heading_quote:
            line = dangling_heading_quote.group(1).rstrip()
            pending_quote_opener = dangling_heading_quote.group(2)

        quote_leadin_block = normalize_quote_leadin_line(line)
        if quote_leadin_block is not None:
            out.extend(quote_leadin_block)
            continue

        line = normalize_quote_attribution_line(line)

        m = LEADIN_RE.match(line)
        # Safe conversion only when line starts with exactly one opening lead-in
        # and no additional bold markers in the trailing part.
        if m:
            heading = m.group(1).strip()
            remainder = (m.group(2) or "").strip()
            if heading and ("**" not in heading) and ("**" not in remainder):
                out.append(f"### {heading}")
                if remainder:
                    out.append("")
                    out.append(remainder)
                continue

        # If strong markers remain unbalanced on a single line, strip them
        # rather than keeping malformed markdown in the rendered archive.
        if line.count("**") % 2 == 1:
            line = line.replace("**", "")

        line = strip_stray_asterisks(line)

        out.append(line)

    # Collapse multiple blank lines.
    collapsed: list[str] = []
    prev_blank = False
    for line in out:
        blank = line.strip() == ""
        if blank and prev_blank:
            continue
        collapsed.append(line)
        prev_blank = blank

    collapsed = merge_split_quote_attributions(collapsed)

    # Remove trailing blank lines first.
    while collapsed and collapsed[-1].strip() == "":
        collapsed.pop()

    # Remove terminal standalone signature/date lines at EOF.
    while collapsed:
        tail = collapsed[-1].strip()
        if DATE_ONLY_RE.match(tail) or LEN_SIGNATURE_RE.match(tail):
            collapsed.pop()
            while collapsed and collapsed[-1].strip() == "":
                collapsed.pop()
            continue
        break

    return "\n".join(collapsed) + "\n"


def strip_stray_asterisks(line: str) -> str:
    """Remove unmatched '*' while preserving valid emphasis spans."""
    placeholders: list[str] = []

    def store_emphasis(match: re.Match[str]) -> str:
        placeholders.append(match.group(0))
        return f"@@EMPHASIS{len(placeholders) - 1}@@"

    protected = EMPHASIS_SPAN_RE.sub(store_emphasis, line)
    cleaned = protected.replace("*", "")

    for idx, token in enumerate(placeholders):
        cleaned = cleaned.replace(f"@@EMPHASIS{idx}@@", token)

    return cleaned


def normalize_quote_leadin_line(line: str) -> list[str] | None:
    s = line.strip()
    if not s or s.startswith(("#", "-", ">")):
        return None

    quote_start = first_quote_index(s)
    if quote_start <= 0:
        return None

    leadin = s[:quote_start].strip()
    if not is_short_leadin(leadin):
        return None

    parsed = split_quote_and_remainder(s[quote_start:].strip())
    if parsed is None:
        return None

    quote_text, remainder = parsed
    quote_text = clean_quote_text(quote_text)
    remainder = unwrap_non_attribution_italics(remainder)
    quote_line = quote_text
    if remainder and looks_like_attribution(remainder):
        quote_line = f"{quote_text} {italicize_attribution(remainder)}"
    elif remainder:
        quote_line = f"{quote_text} {remainder}"

    return [f"### {leadin}", "", quote_line]


def normalize_quote_attribution_line(line: str) -> str:
    s = line.strip()
    if not s or first_quote_index(s) != 0:
        return line

    parsed = split_quote_and_remainder(s)
    if parsed is None:
        return line

    quote_text, remainder = parsed
    quote_text = clean_quote_text(quote_text)
    remainder = unwrap_non_attribution_italics(remainder)
    if not remainder:
        return quote_text

    if not looks_like_attribution(remainder):
        return f"{quote_text} {remainder}".strip()

    return f"{quote_text} {italicize_attribution(remainder)}"


def first_quote_index(text: str) -> int:
    candidates = [idx for char in ("‘", "\"", "'") if (idx := text.find(char)) != -1]
    if not candidates:
        return -1
    return min(candidates)


def split_quote_and_remainder(text: str) -> tuple[str, str] | None:
    if not text:
        return None

    opener = text[0]
    if opener == "‘":
        closer = "’"
    elif opener == '"':
        closer = '"'
    elif opener == "'":
        closer = "'"
    else:
        return None

    for idx in range(1, len(text)):
        if text[idx] != closer:
            continue

        prev = text[idx - 1] if idx > 0 else ""
        tail = text[idx + 1 :]

        # Apostrophe inside a word.
        if prev.isalpha() and tail and tail[0].isalpha():
            continue

        # Split contraction/possessive artifact, for example "country’ s".
        if prev.isalpha() and re.match(r"^\s+(ll|re|ve|nt|d|m|s|t)\b", tail, re.IGNORECASE):
            continue

        if tail and not (tail[0].isspace() or tail[0] in ",.;:!?)]}\"”’" or tail[0].isupper()):
            continue
        return text[: idx + 1].strip(), tail.strip()

    end = text.rfind(closer)
    if end <= 0:
        return None
    return text[: end + 1].strip(), text[end + 1 :].strip()


def italicize_attribution(remainder: str) -> str:
    remainder = remainder.strip()
    already_italic = re.match(r"^(\*[^*\n]+\*)(?:\s+(.*))?$", remainder)
    if already_italic:
        attribution = already_italic.group(1)
        tail = (already_italic.group(2) or "").strip()
        if not tail or CITATION_PREFIX_RE.match(tail):
            return f"{attribution} {tail}".strip()

    marker = CITATION_SPLIT_RE.search(remainder)
    if marker:
        attribution = remainder[: marker.start()].strip()
        tail = remainder[marker.start() :].strip()
    else:
        attribution = remainder
        tail = ""

    attribution = attribution.rstrip("* ").strip()

    if not attribution:
        return remainder

    if attribution.startswith("*") and attribution.endswith("*"):
        formatted = attribution
    else:
        formatted = f"*{attribution}*"

    return f"{formatted} {tail}".strip()


def is_short_leadin(text: str) -> bool:
    if not text:
        return False

    words = text.split()
    if len(words) > 9 or len(text) > 72:
        return False

    if text.endswith((".", "?", "!")):
        return True

    return len(words) <= 4


def looks_like_attribution(text: str) -> bool:
    s = text.strip()
    if not s:
        return False

    if len(s) > 240:
        return False

    if s.count(".") > 4 and "quoted in" not in s.lower():
        return False

    if CITATION_PREFIX_RE.match(s):
        return False

    token_source = s.lstrip("*").strip()
    if not token_source:
        return False

    first_token = token_source.split()[0].strip("“”\"'‘’([{(")
    if not first_token:
        return False

    return first_token[0].isupper()


def clean_quote_text(text: str) -> str:
    cleaned = re.sub(r"([’'])\s+\*([A-Za-z])", r"\1\2", text)
    cleaned = re.sub(r"([’'])\*([A-Za-z])", r"\1\2", cleaned)
    cleaned = re.sub(r"\s+\*(?=[.,;:!?])", "", cleaned)
    return cleaned


def unwrap_non_attribution_italics(text: str) -> str:
    s = text.strip()
    m = re.match(r"^\*([^*\n].*?)\*$", s)
    if not m:
        return s

    inner = m.group(1).strip()
    if looks_like_attribution(inner):
        return s
    return inner


def fix_split_apostrophes(text: str) -> str:
    # Extraction frequently inserts a space after apostrophes in contractions
    # and possessives (for example "you’ ll" or "country’ s").
    return SPLIT_APOSTROPHE_RE.sub(r"\1\2\3", text)


def merge_split_quote_attributions(lines: list[str]) -> list[str]:
    merged = lines[:]
    i = 0
    while i + 2 < len(merged):
        first = merged[i].strip()
        spacer = merged[i + 1].strip()
        second = merged[i + 2].strip()

        if not first or spacer != "" or not second:
            i += 1
            continue

        if should_merge_attribution_pair(first, second):
            merged[i] = f"{first} {second}"
            del merged[i + 1 : i + 3]
            continue

        i += 1

    return merged


def should_merge_attribution_pair(first: str, second: str) -> bool:
    if "‘" not in first and "'" not in first:
        return False

    if not re.search(r"\*[A-Z][^*]{1,40}\*\s*$", first):
        return False

    if second.startswith(("#", "-", ">")):
        return False

    # Typical extracted surname/citation continuation, e.g.:
    # "Douglas, quoted on..." or "Crothers. The Gentle Reader."
    if re.match(r"^[A-Z][A-Za-z.'’\\-]+(?:,|\\.)\\s+.*", second):
        return True

    return False


def find_file_issues(path: Path, raw: str) -> FileReport:
    _, body = split_front_matter(raw.replace("\r\n", "\n").replace("\r", "\n"))
    lines = body.split("\n")

    joined_words: list[tuple[int, str]] = []
    malformed_emphasis: list[tuple[int, str]] = []
    collapsed_structures: list[tuple[int, str]] = []

    for idx, line in enumerate(lines, start=1):
        # Joined words from extraction (exclude known intentional cases).
        for match in JOINED_WORD_RE.finditer(line):
            token = match.group(0)
            if token in JOINED_WORD_ALLOWLIST:
                continue
            joined_words.append((idx, token))

        # Malformed emphasis artifacts.
        if "****" in line or "** **" in line:
            malformed_emphasis.append((idx, line.strip()))
        elif line.count("**") % 2 == 1:
            malformed_emphasis.append((idx, line.strip()))

        # Collapsed pseudo list/table heuristics.
        s = line.strip()
        if not s:
            continue
        if s.startswith(("#", "- ", "* ", "> ", "|")):
            continue

        joined_in_line = False
        for match in JOINED_WORD_RE.finditer(s):
            token = match.group(0)
            if token in JOINED_WORD_ALLOWLIST:
                continue
            joined_in_line = True
            break
        if joined_in_line:
            collapsed_structures.append((idx, s))
            continue

        # Sentence boundary likely lost during extraction.
        if re.search(r"[a-z0-9][.!?][A-Z]", s):
            collapsed_structures.append((idx, s))
            continue

        if re.search(
            r"\b(?:friendly environment|key position|self-motivated|work under pressure|hands-on managerial style)\b",
            s,
            re.IGNORECASE,
        ):
            collapsed_structures.append((idx, s))

    return FileReport(
        path=path,
        joined_words=dedupe_line_items(joined_words),
        malformed_emphasis=dedupe_line_items(malformed_emphasis),
        collapsed_structures=dedupe_line_items(collapsed_structures),
    )


def dedupe_line_items(items: list[tuple[int, str]]) -> list[tuple[int, str]]:
    seen: set[tuple[int, str]] = set()
    out: list[tuple[int, str]] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out


def write_report(reports: list[FileReport]) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

    findings = [r for r in reports if r.has_findings]
    lines: list[str] = []
    lines.append("# Above the Parapet Formatting Ambiguity Report")
    lines.append("")
    lines.append(f"- Total files scanned: {len(reports)}")
    lines.append(f"- Files with findings: {len(findings)}")
    lines.append("")

    for report in findings:
        rel = report.path.relative_to(ROOT)
        lines.append(f"## {rel}")
        lines.append("")
        if report.joined_words:
            lines.append("### Joined words")
            for line_no, token in report.joined_words:
                lines.append(f"- `{rel}:{line_no}` `{token}`")
            lines.append("")
        if report.malformed_emphasis:
            lines.append("### Malformed emphasis")
            for line_no, snippet in report.malformed_emphasis:
                lines.append(f"- `{rel}:{line_no}` `{snippet}`")
            lines.append("")
        if report.collapsed_structures:
            lines.append("### Collapsed structures")
            for line_no, snippet in report.collapsed_structures:
                lines.append(f"- `{rel}:{line_no}` `{snippet}`")
            lines.append("")

    REPORT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def file_sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def run_apply(dry_run: bool) -> tuple[int, int]:
    changed = 0
    scanned = 0
    for path in iter_post_files():
        scanned += 1
        raw = path.read_text(encoding="utf-8")
        front_matter, body = split_front_matter(raw)
        normalized_body = normalize_body(body)
        next_raw = front_matter + normalized_body if front_matter else normalized_body

        if file_sha(raw.replace("\r\n", "\n").replace("\r", "\n")) != file_sha(next_raw):
            changed += 1
            if not dry_run:
                path.write_text(next_raw, encoding="utf-8")
    return scanned, changed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)

    report_parser = sub.add_parser("report", help="Generate ambiguity report.")
    report_parser.add_argument(
        "--stdout",
        action="store_true",
        help="Print report summary to stdout in addition to writing report file.",
    )

    apply_parser = sub.add_parser("apply", help="Apply deterministic normalization.")
    apply_parser.add_argument("--dry-run", action="store_true", help="Do not write files.")

    args = parser.parse_args()

    if args.cmd == "report":
        reports = [find_file_issues(path, path.read_text(encoding="utf-8")) for path in iter_post_files()]
        write_report(reports)
        findings = sum(1 for r in reports if r.has_findings)
        if args.stdout:
            print(f"Scanned {len(reports)} files. Findings in {findings} files.")
            print(f"Report written to {REPORT_PATH.relative_to(ROOT)}")
        return

    if args.cmd == "apply":
        scanned, changed = run_apply(dry_run=args.dry_run)
        mode = "dry-run" if args.dry_run else "write"
        print(f"[{mode}] scanned={scanned} changed={changed}")
        return

    raise RuntimeError("Unknown command")


if __name__ == "__main__":
    main()
