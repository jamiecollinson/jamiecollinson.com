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
    for raw_line in lines:
        line = raw_line.rstrip()
        line = line.lstrip()
        line = line.replace("** **", " ")
        line = ITALIC_WITH_EXTRA_STAR_RE.sub(r"*\1*", line)

        m = BULLET_STAR_RE.match(line)
        if m:
            line = f"{m.group(1)}- {m.group(2)}"
        else:
            m = BULLET_ENDASH_RE.match(line)
            if m:
                line = f"{m.group(1)}- {m.group(2)}"

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
