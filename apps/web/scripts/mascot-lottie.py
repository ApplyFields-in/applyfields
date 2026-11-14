"""
Shrinks the Fieldy mascot Lotties for the chatbot. The sources are frame-by-frame
Lotties (one 1280x720 WebP per frame on a light-grey backdrop); this crops every
frame to the square around the mascot, keys out the backdrop (transparent WebP),
scales it down and re-encodes it, so each
mood drops from ~500 KB to ~200 KB. Animation timing is untouched.

    python apps/web/scripts/mascot-lottie.py <folder with mascot_<mood>.json>

Writes <mood>.json plus the first greeting frame as a still (shown before an
animation has loaded) to apps/web/public/mascot/ (poster.webp) and
apps/mobile/assets/mascot/ (poster.png). Re-run when the artwork changes.
"""
import base64
import io
import json
import sys
from pathlib import Path

from PIL import Image

MOODS = ["greeting", "bored-idle", "thinking", "working", "success"]
# Square around the mascot in the 1280x720 source frames: holds the stars (success),
# the loader ring (thinking) and the holo screens (working) in every frame.
CROP = (290, 10, 990, 710)
SIZE = 224  # 2x the largest size the widget draws (112 px)
QUALITY = 70

APPS = Path(__file__).resolve().parent.parent.parent
WEB = APPS / "web" / "public" / "mascot"
MOBILE = APPS / "mobile" / "assets" / "mascot"


def key_out_backdrop(im: Image.Image) -> Image.Image:
    """Make the grey backdrop transparent so the mascot floats on any light page.
    Backdrop = smooth, unsaturated, light pixels connected to the frame edge; the
    white body is kept because its outline (a gradient edge) stops the region."""
    import numpy as np
    from scipy import ndimage as nd

    rgb = np.asarray(im.convert("RGB")).astype(float)
    lum = rgb.mean(2)
    sat = rgb.max(2) - rgb.min(2)
    smooth = nd.gaussian_filter(lum, 0.7)
    grad = np.hypot(nd.sobel(smooth, 0), nd.sobel(smooth, 1))
    lab, _ = nd.label((sat < 14) & (lum > 200) & (grad < 40))
    edge = np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])
    bg = nd.binary_closing(np.isin(lab, edge[edge > 0]), iterations=1)
    fg = nd.binary_opening(~bg, iterations=1)  # drop stray specks
    alpha = np.clip((nd.gaussian_filter(fg.astype(float), 0.9) - 0.15) / 0.7, 0, 1)
    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype("uint8"), "RGBA")


def shrink(data_uri: str) -> Image.Image:
    raw = base64.b64decode(data_uri.split(",", 1)[1])
    im = Image.open(io.BytesIO(raw)).convert("RGB").crop(CROP).resize((SIZE, SIZE), Image.LANCZOS)
    return key_out_backdrop(im)


def webp_uri(im: Image.Image) -> str:
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=QUALITY, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def main(src: Path) -> None:
    for out in (WEB, MOBILE):
        out.mkdir(parents=True, exist_ok=True)
    for mood in MOODS:
        j = json.loads((src / f"mascot_{mood}.json").read_text(encoding="utf-8"))
        if (j["w"], j["h"]) != (1280, 720):
            raise SystemExit(f"{mood}: expected 1280x720, got {j['w']}x{j['h']} (update CROP)")
        j["w"] = j["h"] = SIZE
        j["nm"] = f"fieldy-{mood}"
        for i, asset in enumerate(j["assets"]):
            im = shrink(asset["p"])
            if mood == "greeting" and i == 0:
                im.save(WEB / "poster.webp", "WEBP", quality=85, method=6)
                im.save(MOBILE / "poster.png", optimize=True)
            asset.update(w=SIZE, h=SIZE, p=webp_uri(im))
        data = json.dumps(j, separators=(",", ":"))
        for out in (WEB, MOBILE):
            (out / f"{mood}.json").write_text(data, encoding="utf-8")
        print(f"ok {mood}: {len(j['assets'])} frames, {len(data) // 1024} KB")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(Path(sys.argv[1]))
