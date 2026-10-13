"""원본 PNG를 보존하며 배포용 WebP와 해시 기록을 생성한다."""

import concurrent.futures
import hashlib
import json
from pathlib import Path

from PIL import Image, __version__ as pillow_version, features

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public/assets/coin-tower"
MANIFEST = ROOT / "src/game/art-manifest.json"
REPORT = ROOT / "src/game/art-generated.json"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    manifest = json.loads(MANIFEST.read_text())
    encoding = manifest["encoding"]
    codec = {"pillow": pillow_version, "webp": features.version("webp")}
    if not features.check("webp"):
        raise RuntimeError("Pillow requires WebP support. See docs/art/optimized-assets.md")
    previous = json.loads(REPORT.read_text()) if REPORT.exists() else {}
    cached = {row["source"]: row for row in previous.get("files", [])}
    sources = [item["source"] for item in manifest["files"]]
    if len(sources) != len(set(sources)):
        raise ValueError("Duplicate art sources")
    if set(sources) != {str(path.relative_to(ART)) for path in ART.rglob("*.png")}:
        raise ValueError("Register every source PNG in src/game/art-manifest.json")

    def convert(item):
        name = item["source"]
        relative = Path(name)
        if relative.is_absolute() or ".." in relative.parts or relative.suffix != ".png":
            raise ValueError(f"Invalid source path: {name}")
        source, output = ART / relative, ART / relative.with_suffix(".webp")
        before = digest(source)
        prior = cached.get(name)
        if (
            prior
            and previous.get("encoding") == encoding
            and previous.get("codec") == codec
            and prior["sourceSha256"] == before
            and prior.get("maxEdge") == item.get("maxEdge")
            and output.exists()
            and prior["outputSha256"] == digest(output)
        ):
            return prior
        with Image.open(source) as image:
            image.load()
            expected = image.copy()
            size = list(image.size)
            if item.get("maxEdge"):
                expected.thumbnail((item["maxEdge"], item["maxEdge"]), Image.Resampling.LANCZOS)
            output.parent.mkdir(parents=True, exist_ok=True)
            expected.save(output, format="WEBP", **encoding)
            with Image.open(output) as decoded:
                equal = decoded.convert(expected.mode).tobytes() == expected.tobytes()
            if not equal:
                raise ValueError(f"WebP lossless decode mismatch: {name}")
            if digest(source) != before:
                raise ValueError(f"Source changed while converting: {name}")
            row = {
                "source": name,
                "output": str(relative.with_suffix(".webp")),
                "sourceBytes": source.stat().st_size,
                "outputBytes": output.stat().st_size,
                "sourceSha256": before,
                "outputSha256": digest(output),
                "sourceSize": size,
                "outputSize": list(expected.size),
                "maxEdge": item.get("maxEdge"),
                "decodedEqualsPreparedPixels": equal,
            }
            print(f"{name}: {row['sourceBytes']:,} -> {row['outputBytes']:,} bytes", flush=True)
            return row

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(convert, manifest["files"]))
    report = {"codec": codec, "encoding": encoding, "files": rows}
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"PNG {sum(row['sourceBytes'] for row in rows):,} -> WebP {sum(row['outputBytes'] for row in rows):,} bytes")


if __name__ == "__main__":
    main()
