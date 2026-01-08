from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except Exception as e:
    raise SystemExit(
        "Missing dependency Pillow. Install it with: pip install -r requirements.txt"
    ) from e

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
RELEASE = ROOT / "release"

FILES_TO_COPY = [
    "manifest.json",
    "content.js",
    "popup.html",
    "popup.js",
    "popup.css",
    "PRIVACY.md",
    "README.md",
]


def make_icon(size: int) -> Image.Image:
    # Simple high-contrast icon: red rounded rectangle + white play triangle
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    r = max(2, size // 6)
    pad = max(1, size // 14)

    # Background rounded rect
    d.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=r,
        fill=(255, 0, 51, 255),
    )

    # Play triangle
    tri_pad = size * 0.28
    x1 = tri_pad
    y1 = tri_pad
    x2 = tri_pad
    y2 = size - tri_pad
    x3 = size - tri_pad * 0.82
    y3 = size / 2

    d.polygon([(x1, y1), (x2, y2), (x3, y3)], fill=(255, 255, 255, 255))
    return img


def build_dist() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)

    (DIST / "icons").mkdir(parents=True, exist_ok=True)

    # Copy source files
    for rel in FILES_TO_COPY:
        src = ROOT / rel
        if src.exists():
            shutil.copy2(src, DIST / rel)

    # Generate icons
    for size in (16, 48, 128):
        icon = make_icon(size)
        icon.save(DIST / "icons" / f"icon-{size}.png", format="PNG")

    # Patch manifest in dist to include icons (keep repo manifest dev-friendly)
    manifest_path = DIST / "manifest.json"
    manifest = manifest_path.read_text(encoding="utf-8")

    # Naive insert: add icons + default_icon under action
    # (kept simple to avoid extra deps)
    if '"default_icon"' not in manifest:
        manifest = manifest.replace(
            '"action": {\n    "default_popup": "popup.html",\n    "default_title": "YouTube Auto Quality"\n  }',
            '"action": {\n    "default_popup": "popup.html",\n    "default_title": "YouTube Auto Quality",\n    "default_icon": {\n      "16": "icons/icon-16.png",\n      "48": "icons/icon-48.png",\n      "128": "icons/icon-128.png"\n    }\n  },\n  "icons": {\n    "16": "icons/icon-16.png",\n    "48": "icons/icon-48.png",\n    "128": "icons/icon-128.png"\n  }',
        )

    manifest_path.write_text(manifest, encoding="utf-8")


def zip_dist() -> Path:
    RELEASE.mkdir(parents=True, exist_ok=True)
    zip_path = RELEASE / "youtube-auto-quality.zip"
    if zip_path.exists():
        zip_path.unlink()

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for p in DIST.rglob("*"):
            if p.is_file():
                z.write(p, p.relative_to(DIST))

    return zip_path


if __name__ == "__main__":
    build_dist()
    out = zip_dist()
    print(str(out))
