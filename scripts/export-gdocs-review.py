#!/usr/bin/env python3
"""Export each MDX docs page as a Google-Docs-friendly DOCX review file."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from xml.sax.saxutils import escape


ROOT = Path.cwd()
CONTENT_DIR = ROOT / "content"
DEFAULT_OUT_DIR = ROOT / "review-docs"


@dataclass
class ReviewBlock:
    id: str
    type: str
    mode: str
    raw: str
    text: str
    separator: str
    level: int | None = None
    rows: list[list[str]] | None = None


@dataclass
class Page:
    source: Path
    route: str
    title: str
    description: str
    frontmatter: str
    source_hash: str
    blocks: list[ReviewBlock]


def xml_text(value: str) -> str:
    return escape(value, {'"': "&quot;"})


def attr(value: str) -> str:
    return xml_text(value)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export content/**/*.mdx to one DOCX review file per page."
    )
    parser.add_argument(
        "--out",
        default=str(DEFAULT_OUT_DIR),
        help="Output directory for DOCX files and _manifest.md. Default: review-docs",
    )
    parser.add_argument(
        "--no-clean",
        action="store_true",
        help="Do not delete the output directory before writing files.",
    )
    return parser.parse_args()


def walk_mdx_files() -> list[Path]:
    return sorted(CONTENT_DIR.rglob("*.mdx"), key=lambda page: route_for_file(page))


def route_for_file(path: Path) -> str:
    relative = path.relative_to(CONTENT_DIR).with_suffix("")
    route = relative.as_posix()
    if route == "index":
        return "/"
    if route.endswith("/index"):
        return "/" + route[: -len("/index")]
    return "/" + route


def output_path_for_route(out_dir: Path, route: str) -> Path:
    if route == "/":
        return out_dir / "index.docx"
    return out_dir / route.strip("/") / "index.docx"


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---\n"):
        return {}, text

    end = text.find("\n---", 4)
    if end == -1:
        return {}, text

    frontmatter = text[4:end]
    body = text[end + len("\n---") :].lstrip("\r\n")
    values: dict[str, str] = {}
    for line in frontmatter.splitlines():
        match = re.match(r"^([A-Za-z][\w-]*):\s*(.+?)\s*$", line)
        if match:
            values[match.group(1)] = match.group(2).strip().strip("\"'")
    return values, body


def read_page(path: Path) -> Page:
    text = path.read_text(encoding="utf8")
    frontmatter, body = parse_frontmatter(text)
    route = route_for_file(path)
    title = frontmatter.get("title") or title_from_body(body) or route.strip("/") or "Introduction"
    description = frontmatter.get("description", "")
    return Page(
        source=path,
        route=route,
        title=title,
        description=description,
        frontmatter=frontmatter_to_text(frontmatter),
        source_hash=sha256_text(text),
        blocks=review_blocks_for_body(body),
    )


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf8")).hexdigest()


def frontmatter_to_text(values: dict[str, str]) -> str:
    if not values:
        return ""
    lines = ["---"]
    for key, value in values.items():
        quoted = json.dumps(value, ensure_ascii=False)
        lines.append(f"{key}: {quoted}")
    lines.append("---")
    return "\n".join(lines)


def title_from_body(body: str) -> str | None:
    match = re.search(r"^#\s+(.+?)\s*$", body, flags=re.MULTILINE)
    return strip_inline_markup(match.group(1)) if match else None


def prop_value(props: str, name: str) -> str:
    match = re.search(rf"{name}\s*=\s*([\"'])(.*?)\1", props, flags=re.DOTALL)
    return match.group(2).strip() if match else ""


def render_image_alt(props: str) -> str:
    alt = prop_value(props, "alt") or prop_value(props, "aria-label") or prop_value(props, "title")
    return f"Image: {alt}" if alt else ""


def render_next_steps(props: str) -> str:
    block_match = re.search(r"steps=\{\[([\s\S]*?)\]\}", props)
    block = block_match.group(1) if block_match else props
    steps = re.findall(
        r"href:\s*(['\"])(.*?)\1\s*,\s*title:\s*(['\"])(.*?)\3(?:\s*,\s*description:\s*(['\"])(.*?)\5)?",
        block,
        flags=re.DOTALL,
    )
    if not steps:
        return ""

    lines = ["Next steps:"]
    for _href_quote, href, _title_quote, title, _desc_quote, description in steps:
        suffix = f": {description}" if description else ""
        lines.append(f"- {title} ({href}){suffix}")
    return "\n".join(lines)


def render_page_status(props: str) -> str:
    updated = prop_value(props, "lastUpdated")
    return f"Page status: last updated {updated}." if updated else "Page status banner."


def sanitize_mdx(body: str) -> str:
    value = body
    value = re.sub(r"\{/\*[\s\S]*?\*/\}", "", value)
    value = re.sub(r"<style[\s\S]*?</style>", "", value, flags=re.IGNORECASE)
    value = re.sub(r"<svg[\s\S]*?</svg>", "Image: inline diagram omitted.", value, flags=re.IGNORECASE)
    value = re.sub(r"^\s*(import|export)\s.+$", "", value, flags=re.MULTILINE)
    value = re.sub(r"<NextSteps\s+([\s\S]*?)/>", lambda m: render_next_steps(m.group(1)), value)
    value = re.sub(r"<PageStatusBanner\s+([\s\S]*?)/>", lambda m: render_page_status(m.group(1)), value)
    value = re.sub(r"<LaunchTimeline\s*/>", "Image: launch timeline.", value)
    value = re.sub(r"<SystemOverviewFigure\s*/>", "Image: Polaris system overview figure.", value)
    value = re.sub(r"<TokenHarmonyFigure\s*/>", "Image: token harmony figure.", value)
    value = re.sub(r"<BondingCurveExplorer\s*/>", "Interactive component: bonding curve explorer.", value)
    value = re.sub(r"<PositionSimulator\s*/>", "Interactive component: position simulator.", value)
    value = re.sub(r"<img\s+([^>]*?)/?>", lambda m: render_image_alt(m.group(1)), value, flags=re.IGNORECASE)
    value = re.sub(r"<Image\s+([^>]*?)/?>", lambda m: render_image_alt(m.group(1)), value)
    value = re.sub(r"!\[([^\]]*)]\([^)]+\)", lambda m: f"Image: {m.group(1)}" if m.group(1) else "", value)
    value = re.sub(r"<(strong|b)>([\s\S]*?)</\1>", r"**\2**", value, flags=re.IGNORECASE)
    value = re.sub(r"<(em|i)>([\s\S]*?)</\1>", r"*\2*", value, flags=re.IGNORECASE)
    value = re.sub(r"<code>([\s\S]*?)</code>", r"`\1`", value, flags=re.IGNORECASE)
    value = re.sub(r"</?(?:Callout|Steps|DefinitionCard|div|span|a|figure|figcaption|aside)[^>]*>", "", value)
    value = re.sub(r"<[A-Z][A-Za-z0-9]*\s*[^>]*?/>", "", value)
    value = re.sub(r"</?[A-Z][A-Za-z0-9]*[^>]*>", "", value)
    value = re.sub(r"</?[a-z][^>]*>", "", value)
    value = value.replace("&nbsp;", " ").replace("&amp;", "&")
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def strip_inline_markup(value: str) -> str:
    value = re.sub(r"\[([^\]]+)]\([^)]+\)", r"\1", value)
    value = re.sub(r"`([^`]+)`", r"\1", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"\1", value)
    value = re.sub(r"\*([^*]+)\*", r"\1", value)
    return re.sub(r"\s+", " ", value).strip()


def review_inline_text(value: str) -> str:
    value = re.sub(r"`([^`]+)`", r"\1", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"\1", value)
    value = re.sub(r"\*([^*]+)\*", r"\1", value)
    value = value.replace("&nbsp;", " ").replace("&amp;", "&")
    return re.sub(r"[ \t]+", " ", value).strip()


def strip_content_newline(value: str) -> tuple[str, str]:
    match = re.search(r"((?:\r?\n)+)$", value)
    if not match:
        return value, ""
    suffix = match.group(1)
    return value[: -len(suffix)], suffix


def is_locked_start(stripped: str) -> bool:
    return (
        stripped.startswith("import ")
        or stripped.startswith("export ")
        or stripped.startswith("{/*")
        or stripped.startswith("<")
        or stripped.startswith("![")
        or stripped.startswith("$$")
        or stripped.startswith("```")
    )


def block_id(index: int, raw: str) -> str:
    digest = sha256_text(raw)[:8]
    return f"b{index:04d}-{digest}"


def make_block(index: int, block_type: str, mode: str, raw_with_newline: str) -> ReviewBlock:
    raw, separator = strip_content_newline(raw_with_newline)
    level: int | None = None
    rows: list[list[str]] | None = None

    if block_type == "heading":
        match = re.match(r"^(#{1,6})\s+(.+?)\s*$", raw)
        level = min(len(match.group(1)), 6) if match else 2
        text = review_inline_text(match.group(2)) if match else review_inline_text(raw)
    elif block_type == "table":
        rows = [split_table_row(line) for line in raw.splitlines() if line.strip().startswith("|")]
        rows = [
            [review_inline_text(cell) for cell in row]
            for row in rows
            if not all(re.fullmatch(r":?-{3,}:?", cell.strip() or "") for cell in row)
        ]
        text = "\n".join(" | ".join(row) for row in rows)
    elif block_type == "quote":
        text = " ".join(re.sub(r"^>\s?", "", line).strip() for line in raw.splitlines()).strip()
        text = review_inline_text(text)
    elif block_type == "list":
        text = "\n".join(review_inline_text(line) for line in raw.splitlines())
    elif block_type == "paragraph":
        text = review_inline_text(" ".join(line.strip() for line in raw.splitlines()))
    else:
        text = locked_placeholder(block_type, raw)

    return ReviewBlock(
        id=block_id(index, raw),
        type=block_type,
        mode=mode,
        raw=raw,
        text=text,
        separator=separator,
        level=level,
        rows=rows,
    )


def locked_placeholder(block_type: str, raw: str) -> str:
    if block_type == "code":
        first = raw.splitlines()[0] if raw.splitlines() else "code block"
        return f"Locked code block preserved from source: {first}"
    if block_type == "math":
        return "Locked math/formula block preserved from source."
    if block_type == "component":
        match = re.match(r"</?([A-Za-z][A-Za-z0-9]*)", raw.strip())
        label = match.group(1) if match else "MDX component"
        return f"Locked MDX component preserved from source: {label}."
    if block_type == "image":
        alt = re.match(r"!\[([^\]]*)]", raw.strip())
        return f"Locked image preserved from source: {alt.group(1)}." if alt else "Locked image."
    return f"Locked {block_type} block preserved from source."


def review_blocks_for_body(body: str) -> list[ReviewBlock]:
    lines = body.splitlines(keepends=True)
    blocks: list[ReviewBlock] = []
    index = 0

    def append_block(block_type: str, mode: str, raw_lines: list[str]) -> None:
        if not raw_lines:
            return
        blocks.append(make_block(len(blocks) + 1, block_type, mode, "".join(raw_lines)))

    while index < len(lines):
        stripped = lines[index].strip()

        if not stripped:
            if blocks:
                blocks[-1].separator += lines[index]
            index += 1
            continue

        start = index

        if stripped.startswith("```"):
            index += 1
            while index < len(lines):
                if lines[index].strip().startswith("```"):
                    index += 1
                    break
                index += 1
            append_block("code", "locked", lines[start:index])
            continue

        if stripped.startswith("$$"):
            index += 1
            while index < len(lines):
                if lines[index].strip().startswith("$$"):
                    index += 1
                    break
                index += 1
            append_block("math", "locked", lines[start:index])
            continue

        if re.match(r"^#{1,6}\s+", stripped):
            index += 1
            append_block("heading", "editable", lines[start:index])
            continue

        if (
            stripped.startswith("|")
            and index + 1 < len(lines)
            and is_table_separator(lines[index + 1].strip())
        ):
            index += 2
            while index < len(lines) and lines[index].strip().startswith("|"):
                index += 1
            append_block("table", "editable", lines[start:index])
            continue

        if stripped.startswith(">"):
            index += 1
            while index < len(lines) and lines[index].strip().startswith(">"):
                index += 1
            append_block("quote", "editable", lines[start:index])
            continue

        if re.match(r"^(?:[-*]|\d+\.)\s+", stripped):
            index += 1
            while index < len(lines):
                next_stripped = lines[index].strip()
                if not next_stripped:
                    break
                if re.match(r"^(?:[-*]|\d+\.)\s+", next_stripped) or re.match(
                    r"^\s{2,}\S", lines[index]
                ):
                    index += 1
                    continue
                break
            append_block("list", "editable", lines[start:index])
            continue

        if is_locked_start(stripped):
            index += 1
            while index < len(lines) and lines[index].strip():
                # Treat multi-line JSX/components as one protected block.
                if not lines[index].startswith((" ", "\t")) and not lines[index].strip().startswith(
                    ("/", "}", "]")
                ):
                    break
                index += 1
            block_type = "image" if stripped.startswith("![") else "component"
            append_block(block_type, "locked", lines[start:index])
            continue

        index += 1
        while index < len(lines):
            next_stripped = lines[index].strip()
            if not next_stripped:
                break
            if (
                re.match(r"^#{1,6}\s+", next_stripped)
                or next_stripped.startswith(("```", "$$", "|", ">", "<", "!["))
                or re.match(r"^(?:[-*]|\d+\.)\s+", next_stripped)
                or is_locked_start(next_stripped)
            ):
                break
            index += 1
        append_block("paragraph", "editable", lines[start:index])

    return blocks


def is_table_separator(line: str) -> bool:
    cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell or "") for cell in cells)


def split_table_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def parse_blocks(markdown: str) -> list[dict[str, object]]:
    lines = markdown.splitlines()
    blocks: list[dict[str, object]] = []
    paragraph: list[str] = []
    index = 0
    in_code = False
    code_lines: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            blocks.append({"type": "paragraph", "text": " ".join(line.strip() for line in paragraph)})
            paragraph = []

    while index < len(lines):
        line = lines[index]
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                blocks.append({"type": "code", "text": "\n".join(code_lines)})
                code_lines = []
                in_code = False
            else:
                flush_paragraph()
                in_code = True
            index += 1
            continue

        if in_code:
            code_lines.append(line)
            index += 1
            continue

        if not stripped:
            flush_paragraph()
            index += 1
            continue

        heading = re.match(r"^(#{1,6})\s+(.+)$", stripped)
        if heading:
            flush_paragraph()
            blocks.append(
                {
                    "type": "heading",
                    "level": min(len(heading.group(1)), 6),
                    "text": strip_inline_markup(heading.group(2)),
                }
            )
            index += 1
            continue

        if (
            stripped.startswith("|")
            and index + 1 < len(lines)
            and is_table_separator(lines[index + 1].strip())
        ):
            flush_paragraph()
            rows = [split_table_row(stripped)]
            index += 2
            while index < len(lines) and lines[index].strip().startswith("|"):
                rows.append(split_table_row(lines[index]))
                index += 1
            blocks.append({"type": "table", "rows": rows})
            continue

        quote = re.match(r"^>\s?(.*)$", stripped)
        if quote:
            flush_paragraph()
            quote_lines = [quote.group(1)]
            index += 1
            while index < len(lines):
                next_quote = re.match(r"^>\s?(.*)$", lines[index].strip())
                if not next_quote:
                    break
                quote_lines.append(next_quote.group(1))
                index += 1
            blocks.append({"type": "quote", "text": " ".join(quote_lines).strip()})
            continue

        item = re.match(r"^((?:[-*])|\d+\.)\s+(.+)$", stripped)
        if item:
            flush_paragraph()
            blocks.append({"type": "list", "text": f"{item.group(1)} {strip_inline_markup(item.group(2))}"})
            index += 1
            continue

        if stripped == "---":
            flush_paragraph()
            blocks.append({"type": "rule"})
            index += 1
            continue

        paragraph.append(line)
        index += 1

    flush_paragraph()
    if code_lines:
        blocks.append({"type": "code", "text": "\n".join(code_lines)})
    return blocks


def size_props(half_points: int) -> list[str]:
    value = str(half_points)
    return [f'<w:sz w:val="{value}"/>', f'<w:szCs w:val="{value}"/>']


META_RUN_PROPS = ['<w:color w:val="64748B"/>', *size_props(18)]
MARKER_RUN_PROPS = ['<w:color w:val="E2E8F0"/>', *size_props(8)]
MARKER_PARAGRAPH_PROPS = (
    '<w:spacing w:before="0" w:after="0" w:line="120" w:lineRule="exact"/>'
)
DIRECT_RUN_PROPS_BY_STYLE = {
    "Title": ["<w:b/>", *size_props(40)],
    "Heading1": ["<w:b/>", *size_props(32)],
    "Heading2": ["<w:b/>", *size_props(28)],
    "Heading3": ["<w:b/>", *size_props(24)],
    "Heading4": ["<w:b/>", *size_props(22)],
    "Heading5": ["<w:b/>", *size_props(22)],
    "Heading6": ["<w:b/>", *size_props(22)],
    "Meta": META_RUN_PROPS,
    "Quote": ['<w:color w:val="4B5563"/>'],
    "CodeBlock": [
        '<w:rFonts w:ascii="Aptos Mono" w:hAnsi="Aptos Mono"/>',
        *size_props(19),
    ],
}
DIRECT_PARAGRAPH_PROPS_BY_STYLE = {
    "Title": ['<w:spacing w:after="240"/>'],
    "Heading1": ['<w:spacing w:before="360" w:after="160"/>'],
    "Heading2": ['<w:spacing w:before="280" w:after="120"/>'],
    "Heading3": ['<w:spacing w:before="220" w:after="100"/>'],
    "Quote": ['<w:ind w:left="360"/>', '<w:spacing w:after="160"/>'],
    "ListParagraph": ['<w:ind w:left="360" w:hanging="240"/>'],
    "CodeBlock": ['<w:spacing w:before="80" w:after="80"/>'],
}


def run_xml(
    text: str,
    bold: bool = False,
    italic: bool = False,
    code: bool = False,
    base_props: Iterable[str] | None = None,
) -> str:
    props = list(base_props or [])
    if bold:
        props.append("<w:b/>")
    if italic:
        props.append("<w:i/>")
    if code:
        props.append('<w:rStyle w:val="CodeChar"/>')
    rpr = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
    preserve = ' xml:space="preserve"' if text[:1].isspace() or text[-1:].isspace() else ""
    return f"<w:r>{rpr}<w:t{preserve}>{xml_text(text)}</w:t></w:r>"


INLINE_TOKEN = re.compile(r"(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+]\([^)]+\))")


def inline_runs(value: str, base_props: Iterable[str] | None = None) -> str:
    runs: list[str] = []
    cursor = 0
    for match in INLINE_TOKEN.finditer(value):
        if match.start() > cursor:
            runs.append(run_xml(value[cursor : match.start()], base_props=base_props))
        token = match.group(0)
        if token.startswith("`"):
            runs.append(run_xml(token[1:-1], code=True, base_props=base_props))
        elif token.startswith("**"):
            runs.append(run_xml(token[2:-2], bold=True, base_props=base_props))
        elif token.startswith("*"):
            runs.append(run_xml(token[1:-1], italic=True, base_props=base_props))
        else:
            link = re.match(r"\[([^\]]+)]\(([^)]+)\)", token)
            if link:
                runs.append(run_xml(token, base_props=base_props))
        cursor = match.end()
    if cursor < len(value):
        runs.append(run_xml(value[cursor:], base_props=base_props))
    return "".join(runs) or run_xml("", base_props=base_props)


def paragraph_xml(
    text: str,
    style: str | None = None,
    *,
    run_props: Iterable[str] | None = None,
    paragraph_props: Iterable[str] | None = None,
) -> str:
    ppr_parts = []
    if style:
        ppr_parts.append(f'<w:pStyle w:val="{attr(style)}"/>')
        ppr_parts.extend(DIRECT_PARAGRAPH_PROPS_BY_STYLE.get(style, []))
    ppr_parts.extend(paragraph_props or [])
    ppr = f"<w:pPr>{''.join(ppr_parts)}</w:pPr>" if ppr_parts else ""
    if run_props is None:
        run_props = DIRECT_RUN_PROPS_BY_STYLE.get(style or "")
    return f"<w:p>{ppr}{inline_runs(text, base_props=run_props)}</w:p>"


def marker_xml(block: ReviewBlock) -> str:
    return paragraph_xml(
        block_marker(block),
        "Marker",
        run_props=MARKER_RUN_PROPS,
        paragraph_props=[MARKER_PARAGRAPH_PROPS],
    )


def code_xml(text: str) -> str:
    return "\n".join(paragraph_xml(line, "CodeBlock") for line in text.splitlines() or [""])


def table_xml(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    max_cols = max(len(row) for row in rows)
    grid = "".join('<w:gridCol w:w="2400"/>' for _ in range(max_cols))
    body = []
    for row in rows:
        cells = []
        for index in range(max_cols):
            text = row[index] if index < len(row) else ""
            cells.append(
                "<w:tc><w:tcPr><w:tcW w:w=\"2400\" w:type=\"dxa\"/></w:tcPr>"
                f"{paragraph_xml(text)}"
                "</w:tc>"
            )
        body.append(f"<w:tr>{''.join(cells)}</w:tr>")
    return (
        "<w:tbl>"
        "<w:tblPr><w:tblStyle w:val=\"TableGrid\"/><w:tblW w:w=\"0\" w:type=\"auto\"/>"
        "<w:tblBorders><w:top w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"B8C2CC\"/>"
        "<w:left w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"B8C2CC\"/>"
        "<w:bottom w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"B8C2CC\"/>"
        "<w:right w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"B8C2CC\"/>"
        "<w:insideH w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"B8C2CC\"/>"
        "<w:insideV w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"B8C2CC\"/>"
        "</w:tblBorders></w:tblPr>"
        f"<w:tblGrid>{grid}</w:tblGrid>{''.join(body)}</w:tbl>"
    )


EDITOR_INSTRUCTIONS = (
    "How to edit this page: rewrite the normal text just like any Google Doc. "
    "You can ignore the faint gray bookmark lines — they keep your edits in "
    "sync and disappear once the page is published."
)


def document_xml(page: Page) -> str:
    title_block_index = next(
        (
            index
            for index, block in enumerate(page.blocks)
            if block.type == "heading" and (block.level or 2) == 1
        ),
        None,
    )
    pieces = [paragraph_xml(EDITOR_INSTRUCTIONS, "Meta")]
    if title_block_index is None:
        pieces.append(paragraph_xml(page.title, "Title"))
    if page.description:
        pieces.append(paragraph_xml(page.description, "Quote"))
    pieces.append(paragraph_xml(""))

    for index, block in enumerate(page.blocks):
        pieces.append(marker_xml(block))
        if block.mode == "locked":
            pieces.append(paragraph_xml(block.text, "Meta"))
        elif block.type == "heading":
            style = "Title" if index == title_block_index else f"Heading{block.level or 2}"
            pieces.append(paragraph_xml(block.text, style))
        elif block.type == "quote":
            pieces.append(paragraph_xml(block.text, "Quote"))
        elif block.type == "list":
            for line in block.text.splitlines() or [""]:
                pieces.append(paragraph_xml(line, "ListParagraph"))
        elif block.type == "table":
            pieces.append(table_xml(block.rows or []))
        else:
            pieces.append(paragraph_xml(block.text))

    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{''.join(pieces)}"
        '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" '
        'w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>'
        "</w:body></w:document>"
    )


CONTENT_TYPES_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"""


RELS_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""


DOCUMENT_RELS_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>
"""


APP_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Polaris Docs export</Application>
</Properties>
"""


def core_xml(page: Page) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        f"<dc:title>{xml_text(page.title)}</dc:title>"
        f"<dc:subject>{xml_text(page.route)}</dc:subject>"
        "<dc:creator>Polaris Docs export</dc:creator>"
        f"<cp:keywords>{xml_text(page.source_hash)}</cp:keywords>"
        "</cp:coreProperties>"
    )


STYLES_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="240"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="40"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="360" w:after="160"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="280" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="220" w:after="100"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/><w:basedOn w:val="Heading3"/><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading5"><w:name w:val="heading 5"/><w:basedOn w:val="Heading4"/><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading6"><w:name w:val="heading 6"/><w:basedOn w:val="Heading5"/><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Quote">
    <w:name w:val="Quote"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="360"/><w:spacing w:after="160"/></w:pPr>
    <w:rPr><w:i/><w:color w:val="4B5563"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Meta">
    <w:name w:val="Meta"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Marker">
    <w:name w:val="Marker"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="0" w:after="0" w:line="120" w:lineRule="exact"/></w:pPr>
    <w:rPr><w:color w:val="E2E8F0"/><w:sz w:val="8"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="360" w:hanging="240"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="CodeBlock">
    <w:name w:val="Code Block"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Aptos Mono" w:hAnsi="Aptos Mono"/><w:sz w:val="19"/></w:rPr>
  </w:style>
  <w:style w:type="character" w:styleId="CodeChar">
    <w:name w:val="Code Char"/>
    <w:rPr><w:rFonts w:ascii="Aptos Mono" w:hAnsi="Aptos Mono"/></w:rPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="B8C2CC"/><w:left w:val="single" w:sz="4" w:color="B8C2CC"/><w:bottom w:val="single" w:sz="4" w:color="B8C2CC"/><w:right w:val="single" w:sz="4" w:color="B8C2CC"/><w:insideH w:val="single" w:sz="4" w:color="B8C2CC"/><w:insideV w:val="single" w:sz="4" w:color="B8C2CC"/></w:tblBorders></w:tblPr>
  </w:style>
</w:styles>
"""


def write_docx(page: Page, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", CONTENT_TYPES_XML)
        archive.writestr("_rels/.rels", RELS_XML)
        archive.writestr("word/_rels/document.xml.rels", DOCUMENT_RELS_XML)
        archive.writestr("word/document.xml", document_xml(page))
        archive.writestr("word/styles.xml", STYLES_XML)
        archive.writestr("docProps/core.xml", core_xml(page))
        archive.writestr("docProps/app.xml", APP_XML)


def block_marker(block: ReviewBlock) -> str:
    return f"[[POLARIS {block.id} {block.mode} {block.type}]]"


def page_to_manifest(page: Page, out_dir: Path) -> dict[str, object]:
    return {
        "route": page.route,
        "source": page.source.relative_to(ROOT).as_posix(),
        "docx": output_path_for_route(out_dir, page.route).relative_to(out_dir).as_posix(),
        "title": page.title,
        "description": page.description,
        "frontmatter": page.frontmatter,
        "source_hash": page.source_hash,
        "blocks": [
            {
                "id": block.id,
                "type": block.type,
                "mode": block.mode,
                "raw": block.raw,
                "text": block.text,
                "separator": block.separator,
                "level": block.level,
                "rows": block.rows,
            }
            for block in page.blocks
        ],
    }


def json_manifest(pages: Iterable[Page], out_dir: Path) -> str:
    payload = {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "tool": "scripts/export-gdocs-review.py",
        "pages": [page_to_manifest(page, out_dir) for page in pages],
    }
    return json.dumps(payload, indent=2, ensure_ascii=False) + "\n"


def manifest(pages: Iterable[Page], out_dir: Path) -> str:
    lines = [
        "# Polaris Docs Google Docs review export",
        "",
        "Generated DOCX files are review copies. Keep source-of-truth edits in `content/**/*.mdx`.",
        "Machine-readable import metadata is in `_manifest.json`; do not edit it.",
        "",
        "| Route | Source | DOCX |",
        "| --- | --- | --- |",
    ]
    for page in pages:
        docx_path = output_path_for_route(out_dir, page.route).relative_to(out_dir).as_posix()
        source = page.source.relative_to(ROOT).as_posix()
        lines.append(f"| {page.route} | `{source}` | `{docx_path}` |")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    out_dir = Path(args.out).resolve()
    if not CONTENT_DIR.exists():
        print(f"Missing content directory: {CONTENT_DIR}", file=sys.stderr)
        return 1

    if out_dir.exists() and not args.no_clean:
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    pages = [read_page(path) for path in walk_mdx_files()]
    for page in pages:
        write_docx(page, output_path_for_route(out_dir, page.route))
    (out_dir / "_manifest.md").write_text(manifest(pages, out_dir), encoding="utf8")
    (out_dir / "_manifest.json").write_text(json_manifest(pages, out_dir), encoding="utf8")

    try:
        display_out_dir = out_dir.relative_to(ROOT)
    except ValueError:
        display_out_dir = out_dir
    print(f"Exported {len(pages)} DOCX review files to {display_out_dir}")
    print("Upload that folder to Google Drive and open the DOCX files as Google Docs for comments.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
