from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageDraw, ImageFilter
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


def _lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def _vertical_gradient(size: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    for y in range(size):
        t = y / max(1, size - 1)
        r = _lerp(top[0], bottom[0], t)
        g = _lerp(top[1], bottom[1], t)
        b = _lerp(top[2], bottom[2], t)
        for x in range(size):
            px[x, y] = (r, g, b, 255)
    return img


def make_icon(size: int) -> Image.Image:
    """Generate a clean, store-ready PNG icon.

    Design:
    - Rounded square with red/pink gradient + subtle shadow
    - Inner border + glossy highlight
    - White play triangle with soft shadow

    Notes:
    - Draws at a larger scale and downsamples for smoother edges.
    """

    scale = 6  # supersampling for anti-aliasing
    s = size * scale

    canvas = Image.new("RGBA", (s, s), (0, 0, 0, 0))

    pad = max(1, s // 14)
    radius = max(8, s // 5)

    # Shadow
    shadow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ds = ImageDraw.Draw(shadow)
    ds.rounded_rectangle(
        [pad + scale, pad + int(scale * 1.2), s - pad + scale, s - pad + int(scale * 1.2)],
        radius=radius,
        fill=(0, 0, 0, 150),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=scale * 2))
    canvas = Image.alpha_composite(canvas, shadow)

    # Gradient base
    grad = _vertical_gradient(s, top=(255, 0, 51), bottom=(255, 45, 85))

    # Rounded mask
    mask = Image.new("L", (s, s), 0)
    dm = ImageDraw.Draw(mask)
    dm.rounded_rectangle([pad, pad, s - pad, s - pad], radius=radius, fill=255)

    base = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    base.paste(grad, (0, 0), mask=mask)

    # Slight vignette
    vignette = Image.new("L", (s, s), 0)
    dv = ImageDraw.Draw(vignette)
    dv.ellipse([-s * 0.2, -s * 0.25, s * 1.05, s * 0.95], fill=170)
    vignette = vignette.filter(ImageFilter.GaussianBlur(radius=scale * 5))
    base = ImageChops.multiply(base, Image.merge("RGBA", [vignette] * 3 + [mask]))

    canvas = Image.alpha_composite(canvas, base)

    d = ImageDraw.Draw(canvas)

    # Inner border
    d.rounded_rectangle(
        [pad + scale, pad + scale, s - pad - scale, s - pad - scale],
        radius=max(6, radius - scale),
        outline=(255, 255, 255, 45),
        width=max(1, scale),
    )

    # Gloss highlight (top)
    gloss = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    dg = ImageDraw.Draw(gloss)
    dg.rounded_rectangle(
        [pad + int(scale * 1.2), pad + int(scale * 1.2), s - pad - int(scale * 1.2), pad + int(s * 0.55)],
        radius=max(6, radius - scale),
        fill=(255, 255, 255, 38),
    )
    gloss = gloss.filter(ImageFilter.GaussianBlur(radius=scale * 2))
    canvas = Image.alpha_composite(canvas, gloss)

    # Play triangle shadow
    tri = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    dt = ImageDraw.Draw(tri)
    tri_pad = s * 0.30
    x1, y1 = tri_pad, tri_pad
    x2, y2 = tri_pad, s - tri_pad
    x3, y3 = s - tri_pad * 0.80, s / 2
    dt.polygon(
        [(x1 + scale, y1 + scale), (x2 + scale, y2 + scale), (x3 + scale, y3 + scale)],
        fill=(0, 0, 0, 140),
    )
    tri = tri.filter(ImageFilter.GaussianBlur(radius=scale * 1.6))
    canvas = Image.alpha_composite(canvas, tri)

    # Play triangle
    d.polygon([(x1, y1), (x2, y2), (x3, y3)], fill=(255, 255, 255, 245))

    # Downsample for smooth edges
    out = canvas.resize((size, size), resample=Image.Resampling.LANCZOS)
    return out


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
        icon.save(DIST / "icons" / f"icon-{size}.png", format="PNG", optimize=True)

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
