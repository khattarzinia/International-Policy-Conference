"""Fetch only the pinned84MB public dataset; never call paid model APIs."""
from __future__ import annotations

import concurrent.futures
import json
from pathlib import Path
import urllib.request

from common import ROOT, sha256

REVISION = "d458a1676e0be8155c29cab3a550283dd1ef9476"
FILES = {
    "train": "9cc863804d42e473832c2dd485a6551aa92f33c1223aa1a5c83ccfd1d412cf45",
    "validation": "dfb499b211b3125aea56c868f6d991316733b43c4a0de0bddbc33f466f42f6a9",
    "test": "8444233e096d3b8636bf911ca0175d07c6951775ba41472cbc6f88500e4c7ac7",
}


def main():
    out = ROOT / ".local/ml-data"
    out.mkdir(parents=True, exist_ok=True)
    def download(split):
        name = f"{split}-00000-of-00001.parquet"
        destination = out / name
        if not destination.exists() or sha256(destination) != FILES[split]:
            temporary = destination.with_suffix(".download")
            url = f"https://huggingface.co/datasets/rasbt/human-vs-ai-50k/resolve/{REVISION}/data/{name}"
            with urllib.request.urlopen(url, timeout=60) as source, temporary.open("wb") as target:
                while chunk := source.read(1024 * 1024):
                    target.write(chunk)
            if sha256(temporary) != FILES[split]:
                temporary.unlink(missing_ok=True)
                raise RuntimeError(f"Dataset hash mismatch for{split}")
            temporary.replace(destination)
        return {"split": split, "bytes": destination.stat().st_size, "sha256": FILES[split]}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for result in pool.map(download, FILES):
            print(json.dumps(result), flush=True)
    (out / "rasbt-revision.json").write_text(json.dumps({"dataset": "rasbt/human-vs-ai-50k", "revision": REVISION}) + "\n")


if __name__ == "__main__":
    main()
