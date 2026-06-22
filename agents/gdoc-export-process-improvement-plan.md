# Google Docs Export/Import Process Improvement Plan

## Objective

Make the next review cycle safe and repeatable:

1. Export one Google Docs-friendly review file per docs page.
2. Let teammates edit copy in Google Docs.
3. Download the edited Google Docs export zip.
4. Import the edited copy back into `content/**/*.mdx` without losing MDX structure, links, paragraphs, tables, callouts, code blocks, formulas, or generated artifacts.

The key change is to treat Google Docs as a copy-review surface, not as the source of truth for page structure.

## Current Process

Current support is mostly one-way:

- `npm run export:gdocs` runs `scripts/export-gdocs-review.py`.
- The exporter writes one DOCX per MDX page plus `review-docs/_manifest.md`.
- Reviewers upload/open those DOCX files as Google Docs, edit them, then export a zip.
- The import back into the repo is currently manual or ad hoc.
- Existing checks catch many repo issues after the fact: `lint:content`, `check:links`, `check:generated`, build, artifact checks, navigation checks, and Playwright smoke tests.

This explains the last failure mode: Google Docs edits were synced back as copy, but the structural MDX round trip was not guarded.

## Failure Modes Observed

The previous import damaged multiple page structures:

- Paragraph boundaries collapsed, producing long wall-of-text paragraphs.
- Heading spacing and section boundaries were lost.
- Some next-step/link structures became plain text like `peth: ...` instead of Markdown links.
- Homepage-specific structured content was replaced by simplified copy.
- Code/math/formula blocks needed manual restoration.
- Tables and risk/mitigation layouts needed manual cleanup.
- Duplicate or misplaced H1s appeared on some pages.
- Generated `public/*.md`, `llms*.txt`, and `sitemap.xml` artifacts could drift unless regenerated and checked.

The repair work required several content batches plus generated-artifact refreshes. That is the signal that the import path needs to become deterministic.

## Process Principles

- MDX remains the source of truth.
- Google Docs should only edit copy-bearing blocks unless a maintainer explicitly handles a structural change.
- An untouched export/import round trip must produce zero MDX changes.
- The importer should preserve unknown or protected MDX exactly from the baseline.
- Import should produce a report before writing, and a diff after writing.
- CI should catch structural regressions before commit.

## Proposed Workflow

### 1. Export

Run:

```bash
npm run export:gdocs -- --out review-docs
```

Exporter improvements:

- Write `review-docs/_manifest.json` in addition to `_manifest.md`.
- Include for each page:
  - route
  - source path
  - page title
  - source hash
  - export timestamp
  - ordered block inventory
- Add stable block IDs to exported review blocks.
- Mark protected blocks with explicit sentinels, for example:

```text
[[POLARIS:LOCKED_BLOCK id=abc123 type=component label="NextSteps"]]
This block is generated from MDX and will be restored from source during import.
[[/POLARIS:LOCKED_BLOCK]]
```

Protected blocks should include:

- frontmatter
- imports/exports
- JSX components
- code fences
- math/formula blocks
- raw HTML/MDX constructs
- image/component placeholders
- any block the exporter cannot faithfully re-import

Editable blocks should include:

- normal paragraphs
- headings
- blockquotes/callouts that can be safely mapped back to Markdown
- simple lists
- simple Markdown tables if the importer supports them well

### 2. Review In Google Docs

Create a short reviewer note at the top of every exported doc:

- Edit normal prose directly.
- Use comments for structural requests, new tables, new components, new pages, or changed links.
- Do not edit the source path, route, or locked-block markers.
- Do not delete locked-block placeholders.
- Keep one document per docs page.

Use Suggesting mode when possible. Comments are acceptable for questions, but the importer should only consume final document text.

### 3. Download

Download the Google Drive folder as a zip.

Expected zip contract:

- It contains one DOCX per route in the same relative path layout as `review-docs`.
- It contains no renamed pages unless the manifest maps the rename.
- Missing files are treated as unchanged pages, not deletions.
- Extra files are reported and ignored unless explicitly mapped.

### 4. Import

Add a real importer:

```bash
npm run import:gdocs -- --zip "/path/to/User Docs Content.zip" --manifest review-docs/_manifest.json --out content
```

Importer behavior:

- Parse DOCX structurally with `python-docx` or a controlled DOCX parser, not by scraping plain text.
- Use paragraph/table styles created by `export-gdocs-review.py` to recover Markdown structure.
- Match files by manifest route/source path, not by fuzzy filename inference.
- Restore protected blocks from the original source snapshot.
- Convert editable blocks back into MDX/Markdown with stable spacing:
  - blank line after frontmatter
  - blank line around headings
  - blank line between paragraphs
  - blank line before and after lists/tables/code
- Keep frontmatter unless a maintainer explicitly changes it.
- Refuse to import a page if source hash changed since export, unless run with an explicit `--allow-stale-source` flag.
- Produce an import report:
  - pages changed
  - pages skipped
  - missing exported docs
  - extra exported docs
  - protected blocks restored
  - links changed
  - headings changed
  - suspicious long paragraphs
  - table/list/code block count changes

### 5. Validate

After import:

```bash
npm run generate
npm run lint:content
npm run check:links
npm run check:generated
npm run build
npm run ci:artifact
```

For a full gate before push:

```bash
npm run ci
```

## Tooling Improvements

### Add `scripts/import-gdocs-review.py`

Responsibilities:

- Read Google Docs-exported DOCX files from a zip.
- Read `_manifest.json`.
- Rebuild only `content/**/*.mdx`.
- Preserve protected MDX blocks from the source snapshot.
- Write a machine-readable report, for example `review-docs/_import-report.json`.
- Support dry run:

```bash
npm run import:gdocs -- --zip edited.zip --dry-run
```

### Add Round-Trip Test

Add a test script:

```bash
npm run test:gdocs-roundtrip
```

Expected behavior:

1. Export current `content/**/*.mdx`.
2. Import the untouched export into a temp directory.
3. Compare the temp output to current `content/**/*.mdx`.
4. Fail if any source file changes.

This is the most important guard. If an untouched Google Docs cycle changes the repo, the process is unsafe.

### Add Source Formatting Heuristics

Extend `scripts/check-content.mjs` with Google Docs damage checks:

- fail on body paragraphs above a threshold, for example 520 characters, excluding tables/code
- fail on a heading immediately following prose without a blank line
- fail on text patterns like `Name (/route)` when it should be `[Name](/route)`
- fail on duplicate H1s
- fail on pages with no H1
- warn or fail when a page loses all Markdown links but previously had several
- warn or fail when a page has large table/list/code count drops versus the export baseline

Some checks require a baseline, so those belong in the import report rather than global content lint.

### Add Rendered Artifact Heuristics

Add a small rendered HTML check after build:

- exactly one visible H1 per article
- no article paragraph text over a threshold
- table count does not unexpectedly drop versus baseline
- code block count does not unexpectedly drop versus baseline
- no bare route-looking text such as `(/peth)` in article copy

This can run as part of `ci:artifact` or as a separate `check:gdocs-import` script.

### Improve Exporter Metadata

Update `scripts/export-gdocs-review.py` to:

- emit `_manifest.json`
- store page source hash in DOCX core properties
- add a visible route/source header
- add a non-editable-looking reviewer instruction block
- preserve more structure in the review output:
  - actual links, not only `Label (href)`, if importer can read relationships
  - Word tables for Markdown tables
  - blockquote/callout styles
  - code/math placeholder blocks with lock markers

## Import Review Checklist

Before committing an imported round:

- `git diff -- content` is reviewed page by page.
- Homepage and `why-polaris` are manually opened locally because they are high-visibility pages.
- Any page with changed table/list/code/link counts is manually inspected.
- Generated artifacts are regenerated in a separate commit or clearly separated from source commits.
- The final local gate passes.

Recommended commit structure:

1. Source copy updates by topic.
2. Any manual structural/MDX fixes.
3. Generated artifacts (`public/*.md`, `llms*.txt`, sitemap, Pagefind if changed).

## Suggested Scripts

Add package scripts:

```json
{
  "import:gdocs": "python3 scripts/import-gdocs-review.py",
  "test:gdocs-roundtrip": "python3 scripts/test-gdocs-roundtrip.py",
  "check:gdocs-import": "node scripts/check-gdocs-import.mjs"
}
```

`test-gdocs-roundtrip.py` can call the exporter and importer against a temp directory and then use file comparison. `check-gdocs-import.mjs` can inspect source and rendered output for the structural heuristics above.

## Rollout Plan

### Phase 1: Guardrails

- Add `_manifest.json` export.
- Add untouched round-trip test.
- Add source checks for long paragraphs, duplicate/missing H1s, and raw `Label (/route)` link regressions.

This prevents a repeat of the worst formatting damage even before the importer is fully sophisticated.

### Phase 2: Controlled Importer

- Build `scripts/import-gdocs-review.py`.
- Preserve locked blocks from baseline.
- Support paragraphs, headings, lists, quotes, simple tables, and links.
- Produce an import report.
- Add dry-run mode.

### Phase 3: Better Reviewer Experience

- Add reviewer instructions to each exported doc.
- Use clearer Word styles for editable vs locked blocks.
- Add a summary CSV/Markdown for reviewers showing route, title, owner, and status.

### Phase 4: CI Integration

- Add `test:gdocs-roundtrip` to CI or at least to `local:push-gate`.
- Add `check:gdocs-import` to the import workflow.
- Keep the full `npm run ci` as the final gate.

## Acceptance Criteria

The process is ready for the next Google Docs review round when:

- Untouched export/import produces zero MDX diffs.
- A sample edited DOCX imports only the edited copy and preserves MDX structure.
- Import report flags changed links/headings/tables/lists/code blocks.
- The importer refuses stale source by default.
- `npm run ci` passes after an imported sample.
- A reviewer can understand what to edit and what not to edit without repo knowledge.

## Recommendation

Do not run another full Google Docs edit cycle using the current manual import path. The export side is useful, but the import side needs at least Phase 1 and Phase 2 before the next round. The minimum safe bar is:

- `_manifest.json`
- controlled importer
- protected-block restoration
- untouched round-trip test
- long-paragraph/rendered-H1 checks

That should turn the next round from a manual reconstruction exercise into a normal review-and-merge workflow.
