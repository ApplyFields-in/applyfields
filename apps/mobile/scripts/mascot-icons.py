"""
Builds the per-platform launcher icons from the six 1024x1024 mascot masters in
assets/icons/<state>.png. Re-run after replacing any master:

    python scripts/mascot-icons.py          (from apps/mobile, needs Pillow)

Writes:
    assets/icons/ios/<state>.png        1024x1024, opaque, full square (iOS applies its own mask)
    assets/icons/android/<state>.png    432x432 adaptive foreground, transparent outside the art

The Android 13+ themed (monochrome) icon is the existing hood + orb mark,
assets/images/android-icon-monochrome.png, for every state.

INTERIM: the current masters are draft previews with a rounded card + bezel baked
in and no separate mascot layer, so this crops the bezel and frames the whole
square inside the adaptive safe zone. When final art arrives (see
docs/mascot-app-icon.md, "Final artwork"), drop a transparent mascot-only PNG in
assets/icons/foreground/<state>.png and it is used for Android as-is.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

STATES = ["default", "sleeping", "active", "notification", "thinking", "achievement"]
ROOT = Path(__file__).resolve().parent.parent / "assets" / "icons"
BEZEL = 40  # px trimmed from each edge of the draft to drop the baked card frame
ADAPTIVE = 432  # xxxhdpi adaptive canvas (108dp); the visible mask is the middle 288px (72dp)
ART = 304  # framed art size on the adaptive canvas: just over the 288px visible area


def ios_icon(master: Image.Image) -> Image.Image:
    box = (BEZEL, BEZEL, master.width - BEZEL, master.height - BEZEL)
    return master.convert("RGB").crop(box).resize((1024, 1024), Image.LANCZOS)


def android_foreground(state: str, ios: Image.Image) -> Image.Image:
    final = ROOT / "foreground" / f"{state}.png"
    if final.exists():  # real transparent mascot layer: use it untouched
        return Image.open(final).convert("RGBA").resize((ADAPTIVE, ADAPTIVE), Image.LANCZOS)
    art = ios.resize((ART, ART), Image.LANCZOS).convert("RGBA")
    # Feather the square's edge into the #071A43 adaptive background so no seam shows.
    mask = Image.new("L", (ART, ART), 0)
    ImageDraw.Draw(mask).rounded_rectangle((10, 10, ART - 10, ART - 10), radius=60, fill=255)
    art.putalpha(mask.filter(ImageFilter.GaussianBlur(8)))
    canvas = Image.new("RGBA", (ADAPTIVE, ADAPTIVE), (0, 0, 0, 0))
    off = (ADAPTIVE - ART) // 2
    canvas.alpha_composite(art, (off, off))
    return canvas


def main() -> None:
    (ROOT / "ios").mkdir(exist_ok=True)
    (ROOT / "android").mkdir(exist_ok=True)
    for state in STATES:
        master = Image.open(ROOT / f"{state}.png")
        if master.size != (1024, 1024):
            raise SystemExit(f"{state}.png is {master.size}, expected 1024x1024")
        ios = ios_icon(master)
        ios.save(ROOT / "ios" / f"{state}.png", optimize=True)
        android_foreground(state, ios).save(ROOT / "android" / f"{state}.png", optimize=True)
        print("ok", state)


if __name__ == "__main__":
    main()
