#!/usr/bin/env python3
"""Verify an untouched Google Docs export/import round trip is lossless."""

from __future__ import annotations

import filecmp
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path.cwd()
CONTENT_DIR = ROOT / "content"


def run(command: list[str]) -> None:
    subprocess.run(command, cwd=ROOT, check=True)


def collect_mdx(directory: Path) -> dict[str, Path]:
    return {
        path.relative_to(directory).as_posix(): path
        for path in directory.rglob("*.mdx")
        if path.is_file()
    }


def compare_content(original: Path, candidate: Path) -> list[str]:
    original_files = collect_mdx(original)
    candidate_files = collect_mdx(candidate)
    failures: list[str] = []

    for rel in sorted(set(original_files) | set(candidate_files)):
        left = original_files.get(rel)
        right = candidate_files.get(rel)
        if left is None:
            failures.append(f"Unexpected file after round trip: {rel}")
        elif right is None:
            failures.append(f"Missing file after round trip: {rel}")
        elif not filecmp.cmp(left, right, shallow=False):
            failures.append(f"Round trip changed {rel}")

    return failures


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="polaris-gdocs-roundtrip-") as tmp:
        tmp_dir = Path(tmp)
        review_dir = tmp_dir / "review-docs"
        roundtrip_content = tmp_dir / "content"

        run(["python3", "scripts/export-gdocs-review.py", "--out", str(review_dir)])
        shutil.copytree(CONTENT_DIR, roundtrip_content)
        run(
            [
                "python3",
                "scripts/import-gdocs-review.py",
                "--zip",
                str(review_dir),
                "--manifest",
                str(review_dir / "_manifest.json"),
                "--out",
                str(roundtrip_content),
            ]
        )

        failures = compare_content(CONTENT_DIR, roundtrip_content)
        if failures:
            print("Google Docs export/import round trip is not lossless:\n", file=sys.stderr)
            for failure in failures:
                print(f"- {failure}", file=sys.stderr)
            return 1

    print("Google Docs export/import round trip is lossless.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
