#!/usr/bin/env python3
"""
make-fabric-art.py — generates Percaal's placeholder product imagery.

Every picture on the storefront is a generated SVG rather than a photo,
because Percaal's catalogue is one cloth in seven colourways: shooting it
badly would look far worse than not shooting it at all. These are honest
abstractions — a real percale weave at real thread spacing, folded the way
the product folds — so the shelf reads as a linen house from the first
glance and any real photography can drop straight in later on the same
filenames.

Each file is built from five stacked layers:

  1. GROUND     a warm graded studio wall. Not the colourway — the palest
                colourways (White, Off-white) would otherwise float on a
                white page with nothing to read them against.
  2. SHADOW     the pool the object casts onto that ground. Small thing,
                but it is what seats an object in a scene; without it every
                form reads as a sticker.
  3. WEAVE      a <pattern> of warp and weft lines whose pitch scales with
                the canvas, so the texture keeps its apparent size once the
                SVG is scaled down into a tile. This is the percale itself,
                and it is why a fill reads as cloth and not as a colour chip.
  4. FORM       the object: a folded stack, a pillow, a draped spread. Soft
                shapes with gradient shading rather than outlines, so it
                suggests fabric instead of drawing a diagram of one.
  5. LIGHT      one soft key from the upper left plus a wide vignette.

Run from the project root:  python3 tools/make-fabric-art.py
"""

import os
import math

OUT_PRODUCTS = "images/products"
OUT_CATEGORY = "images/categories"
OUT_EDITORIAL = "images/editorial"

# --- the colourways, straight off the product sheet -----------------------
# Values are cotton-realistic: undyed and pale-dyed percale, never saturated.
COLOURS = {
    "white":          "#F7F6F3",
    "off-white":      "#EFE9E0",
    "greige":         "#CBC1B3",
    "silver":         "#D2D4D3",
    "light-blue":     "#BCD0DE",
    "l-light-blue":   "#DCE6EC",
    "lila":           "#CDC4D4",
    # spread-sheet / duvet extras
    "coffee":         "#8B7355",
    "camel":          "#C2A278",
    "brown":          "#7A6250",
    "dark-gray":      "#6E7273",
    "grey":           "#A9ADAE",
    # brand secondaries, for category art
    "parchment":      "#E0D5C7",
    "arctic-wolf":    "#E3DCC9",
    "frosted-mint":   "#C0CDC2",
    "macaroon":       "#A5714E",
    "praline":        "#94765C",
}


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return "#%02X%02X%02X" % tuple(max(0, min(255, int(round(c)))) for c in rgb)


def shade(hexcol, amount):
    """amount > 0 lightens toward white, < 0 darkens toward the ink."""
    r, g, b = hex_to_rgb(hexcol)
    if amount >= 0:
        t = amount
        return rgb_to_hex((r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t))
    t = -amount
    ir, ig, ib = hex_to_rgb("#111A19")
    return rgb_to_hex((r + (ir - r) * t, g + (ig - g) * t, b + (ib - b) * t))


def defs(cid, base, w):
    """Shared <defs>: weave pattern, studio wall, key light, cast shadow,
    vignette and the fold gradient.

    The weave pitch is DERIVED FROM THE CANVAS WIDTH rather than fixed, so
    the texture keeps the same apparent size once the SVG is scaled into a
    tile. The first version used a flat 5px pitch and the weave was simply
    invisible at every size the site actually renders these at."""
    # Equal-weight warp and weft. An earlier pass gave the warp full width
    # and the weft only a narrow band, which read as a ticking STRIPE — wrong
    # for a catalogue where nearly every item is described as "Plain".
    # Half-and-half in both directions gives the four-tone checker that a
    # plain weave actually is.
    pitch = max(5.0, w / 70.0)
    warp = shade(base, 0.11)
    weft = shade(base, -0.075)
    return f"""
  <defs>
    <pattern id="weave{cid}" width="{pitch:.2f}" height="{pitch:.2f}" patternUnits="userSpaceOnUse">
      <rect width="{pitch:.2f}" height="{pitch:.2f}" fill="{base}"/>
      <rect width="{pitch:.2f}" height="{pitch * .5:.2f}" fill="{warp}" opacity=".55"/>
      <rect width="{pitch * .5:.2f}" height="{pitch:.2f}" fill="{weft}" opacity=".50"/>
    </pattern>
    <!-- Studio wall. Pale colourways have almost no contrast against paper
         white, so they are given a warm graded ground to sit against
         instead of being left to float. -->
    <linearGradient id="wall{cid}" x1="0" y1="0" x2=".3" y2="1">
      <stop offset="0" stop-color="#F4F0EA"/>
      <stop offset=".62" stop-color="#E8E2D9"/>
      <stop offset="1" stop-color="#DCD4C8"/>
    </linearGradient>
    <!-- The night ground, for hero art that has to carry white display
         type across the picture rather than in a band beside it. -->
    <linearGradient id="night{cid}" x1="0" y1="0" x2=".25" y2="1">
      <stop offset="0" stop-color="#3B3733"/>
      <stop offset=".55" stop-color="#2A2724"/>
      <stop offset="1" stop-color="#191715"/>
    </linearGradient>
    <!-- Key light, upper left. Deliberately restrained — the first pass
         washed the palette out until greige and silver looked identical. -->
    <linearGradient id="key{cid}" x1="0" y1="0" x2=".85" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity=".14"/>
      <stop offset=".5" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="1" stop-color="#111A19" stop-opacity=".13"/>
    </linearGradient>
    <radialGradient id="vig{cid}" cx=".5" cy=".40" r=".80">
      <stop offset=".45" stop-color="#111A19" stop-opacity="0"/>
      <stop offset="1" stop-color="#111A19" stop-opacity=".18"/>
    </radialGradient>
    <!-- The pool of shadow the object drops onto the ground. This is what
         actually seats an object in a scene; without it every form reads
         as a sticker. -->
    <radialGradient id="cast{cid}" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#111A19" stop-opacity=".34"/>
      <stop offset=".6" stop-color="#111A19" stop-opacity=".11"/>
      <stop offset="1" stop-color="#111A19" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fold{cid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity=".24"/>
      <stop offset=".45" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="1" stop-color="#111A19" stop-opacity=".20"/>
    </linearGradient>
  </defs>"""


def wrap(cid, base, w, h, form, bg=None):
    if bg == "night":
        ground = f"url(#night{cid})"
    else:
        ground = bg or f"url(#wall{cid})"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">{defs(cid, base, w)}
  <rect width="{w}" height="{h}" fill="{ground}"/>
{form}
  <rect width="{w}" height="{h}" fill="url(#key{cid})"/>
  <rect width="{w}" height="{h}" fill="url(#vig{cid})"/>
</svg>"""


def cast(cid, cx, cy, rx, ry):
    """A soft contact shadow under an object."""
    return (f'  <ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" '
            f'fill="url(#cast{cid})"/>')


# --------------------------------------------------------------------------
# FORMS — one function per product silhouette.
# --------------------------------------------------------------------------

def form_stack(cid, base, w, h):
    """A folded stack of sheets, seen slightly from above — the hero shape
    for flat sheets, fitted sheets and duvet covers."""
    out = []
    n = 4
    pad = w * 0.16
    sw = w - pad * 2
    top = h * 0.30
    sh = h * 0.115
    gap = sh * 1.02
    out.append(cast(cid, w * 0.5, top + n * gap + h * 0.012, w * 0.42, h * 0.045))
    for i in range(n):
        y = top + i * gap
        # each layer down is fractionally wider and a touch darker
        grow = i * w * 0.014
        x = pad - grow
        ww = sw + grow * 2
        tone = shade(base, -0.03 * i)
        out.append(
            f'  <rect x="{x:.1f}" y="{y:.1f}" width="{ww:.1f}" height="{sh:.1f}" rx="3" '
            f'fill="url(#weave{cid})"/>'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{ww:.1f}" height="{sh:.1f}" rx="3" '
            f'fill="{tone}" opacity=".22"/>'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{ww:.1f}" height="{sh:.1f}" rx="3" '
            f'fill="url(#fold{cid})"/>')
        # the folded edge — a hairline of highlight along the front
        out.append(
            f'  <rect x="{x:.1f}" y="{y + sh - 2:.1f}" width="{ww:.1f}" height="2" '
            f'fill="{shade(base, -0.16)}" opacity=".35"/>')
    return "\n".join(out)


def form_pillow(cid, base, w, h):
    """A pillow: a soft-cornered rectangle pinched at the middle of each
    side, which is what makes it read as filled rather than as a card."""
    cx, cy = w / 2, h * 0.52
    pw, ph = w * 0.62, h * 0.42
    x0, y0, x1, y1 = cx - pw / 2, cy - ph / 2, cx + pw / 2, cy + ph / 2
    k = pw * 0.16
    shadow = cast(cid, cx, y1 + ph * 0.06, pw * 0.56, ph * 0.16)
    d = (f"M{x0 + k:.1f},{y0:.1f} "
         f"C{cx - k * .3:.1f},{y0 - ph * .10:.1f} {cx + k * .3:.1f},{y0 - ph * .10:.1f} {x1 - k:.1f},{y0:.1f} "
         f"C{x1 + k * .55:.1f},{y0 + ph * .12:.1f} {x1 + k * .55:.1f},{y1 - ph * .12:.1f} {x1 - k:.1f},{y1:.1f} "
         f"C{cx + k * .3:.1f},{y1 + ph * .10:.1f} {cx - k * .3:.1f},{y1 + ph * .10:.1f} {x0 + k:.1f},{y1:.1f} "
         f"C{x0 - k * .55:.1f},{y1 - ph * .12:.1f} {x0 - k * .55:.1f},{y0 + ph * .12:.1f} {x0 + k:.1f},{y0:.1f} Z")
    return (shadow + "\n"
            f'  <path d="{d}" fill="url(#weave{cid})"/>\n'
            f'  <path d="{d}" fill="url(#fold{cid})"/>\n'
            # the seam, inset from the edge
            f'  <path d="{d}" fill="none" stroke="{shade(base, -0.18)}" stroke-opacity=".35" '
            f'stroke-width="1" transform="translate({cx:.1f} {cy:.1f}) scale(.93) translate({-cx:.1f} {-cy:.1f})"/>')


def form_drape(cid, base, w, h):
    """Cloth falling in folds — the spread sheets and handmade pieces."""
    out = [f'  <rect width="{w}" height="{h}" fill="url(#weave{cid})"/>']
    # vertical folds, sine-shaded so light rolls across them
    n = 7
    for i in range(n):
        x = w * (i + 0.5) / n
        amp = w / n * 0.5
        dark = shade(base, -0.14)
        light = shade(base, 0.16)
        t = math.sin(i / (n - 1) * math.pi)
        out.append(
            f'  <path d="M{x - amp:.1f},0 C{x - amp * .3:.1f},{h * .35:.1f} '
            f'{x + amp * .3:.1f},{h * .65:.1f} {x - amp * .6:.1f},{h:.1f} '
            f'L{x + amp:.1f},{h:.1f} C{x + amp * .5:.1f},{h * .6:.1f} '
            f'{x + amp * .1:.1f},{h * .3:.1f} {x + amp * .7:.1f},0 Z" '
            f'fill="{dark if i % 2 else light}" opacity="{0.10 + 0.10 * t:.2f}"/>')
    return "\n".join(out)


def form_towel(cid, base, w, h):
    """Rolled and folded towels: two rolls behind a folded stack."""
    out = []
    cy = h * 0.58
    r = w * 0.13
    out.append(cast(cid, w * 0.5, h * 0.78, w * 0.40, h * 0.035))
    for i, cx in enumerate((w * 0.34, w * 0.66)):
        out.append(
            f'  <ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{r:.1f}" ry="{r:.1f}" fill="url(#weave{cid})"/>'
            f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{r:.1f}" ry="{r:.1f}" fill="url(#fold{cid})"/>')
        # the spiral of the roll
        for k in range(1, 4):
            rr = r * (1 - k * 0.24)
            out.append(f'  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rr:.1f}" fill="none" '
                       f'stroke="{shade(base, -0.16)}" stroke-opacity=".28" stroke-width="1"/>')
    # a folded towel in front
    fx, fy, fw, fh = w * 0.22, cy + r * 0.72, w * 0.56, h * 0.11
    out.append(f'  <rect x="{fx:.1f}" y="{fy:.1f}" width="{fw:.1f}" height="{fh:.1f}" rx="3" '
               f'fill="url(#weave{cid})"/>'
               f'<rect x="{fx:.1f}" y="{fy:.1f}" width="{fw:.1f}" height="{fh:.1f}" rx="3" '
               f'fill="url(#fold{cid})"/>')
    return "\n".join(out)


def form_bed(cid, base, w, h):
    """A made bed seen from the foot — used for duvet sets and the big
    editorial tiles. Headboard, two pillows, a turned-down duvet."""
    ink = "#111A19"
    out = []
    # headboard
    out.append(f'  <rect x="{w*.14:.1f}" y="{h*.16:.1f}" width="{w*.72:.1f}" height="{h*.22:.1f}" rx="4" '
               f'fill="{shade(base, -0.34)}" opacity=".45"/>')
    # pillows
    for cx in (w * 0.34, w * 0.66):
        pw, ph = w * 0.26, h * 0.10
        out.append(f'  <rect x="{cx-pw/2:.1f}" y="{h*.31:.1f}" width="{pw:.1f}" height="{ph:.1f}" rx="{ph/2.6:.1f}" '
                   f'fill="url(#weave{cid})"/>'
                   f'<rect x="{cx-pw/2:.1f}" y="{h*.31:.1f}" width="{pw:.1f}" height="{ph:.1f}" rx="{ph/2.6:.1f}" '
                   f'fill="url(#fold{cid})"/>')
    # mattress + duvet
    out.append(f'  <path d="M{w*.10:.1f},{h*.86:.1f} L{w*.18:.1f},{h*.40:.1f} '
               f'L{w*.82:.1f},{h*.40:.1f} L{w*.90:.1f},{h*.86:.1f} Z" fill="url(#weave{cid})"/>')
    out.append(f'  <path d="M{w*.10:.1f},{h*.86:.1f} L{w*.18:.1f},{h*.40:.1f} '
               f'L{w*.82:.1f},{h*.40:.1f} L{w*.90:.1f},{h*.86:.1f} Z" fill="url(#fold{cid})"/>')
    # the turn-down
    out.append(f'  <path d="M{w*.155:.1f},{h*.49:.1f} L{w*.845:.1f},{h*.49:.1f} '
               f'L{w*.855:.1f},{h*.55:.1f} L{w*.145:.1f},{h*.55:.1f} Z" '
               f'fill="{shade(base, 0.22)}" opacity=".75"/>')
    out.append(f'  <path d="M{w*.10:.1f},{h*.86:.1f} L{w*.90:.1f},{h*.86:.1f} '
               f'L{w*.90:.1f},{h:.1f} L{w*.10:.1f},{h:.1f} Z" fill="{ink}" opacity=".08"/>')
    return "\n".join(out)


def form_swatch(cid, base, w, h):
    """Pure cloth, edge to edge — the colour-picker thumbnails."""
    return f'  <rect width="{w}" height="{h}" fill="url(#weave{cid})"/>'


FORMS = {
    "stack": form_stack,
    "pillow": form_pillow,
    "drape": form_drape,
    "towel": form_towel,
    "bed": form_bed,
    "swatch": form_swatch,
}


def build(path, colour, form, w=800, h=1000, bg=None):
    base = COLOURS[colour]
    cid = abs(hash((path, colour, form))) % 100000
    svg = wrap(cid, base, w, h, FORMS[form](cid, base, w, h), bg=bg)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(svg)
    return path


def main():
    made = []

    # --- product shots: every form in every colourway ---------------------
    wearable = ["white", "off-white", "greige", "silver",
                "light-blue", "l-light-blue", "lila"]
    for form in ("stack", "pillow", "drape", "towel", "bed"):
        for c in wearable:
            made.append(build(f"{OUT_PRODUCTS}/{form}-{c}.svg", c, form))
    for c in ("coffee", "camel", "brown", "dark-gray", "grey"):
        made.append(build(f"{OUT_PRODUCTS}/drape-{c}.svg", c, "drape"))
        made.append(build(f"{OUT_PRODUCTS}/stack-{c}.svg", c, "stack"))

    # --- flat swatches for the colour pickers -----------------------------
    for c in wearable + ["coffee", "camel", "brown", "dark-gray", "grey"]:
        made.append(build(f"{OUT_PRODUCTS}/swatch-{c}.svg", c, "swatch", w=120, h=120))

    # --- category art: the secondary palette carries these ----------------
    cats = [
        ("bedding",        "parchment",    "bed"),
        ("fitted-sheets",  "l-light-blue", "stack"),
        ("flat-sheets",    "arctic-wolf",  "stack"),
        ("duvet-covers",   "greige",       "bed"),
        ("duvets",         "white",        "stack"),
        ("pillows",        "off-white",    "pillow"),
        ("pillow-cases",   "silver",       "pillow"),
        ("spread-sheets",  "camel",        "drape"),
        ("mattress-topper", "white",       "stack"),
        ("towels",         "frosted-mint", "towel"),
        ("home-decor",     "praline",      "drape"),
        ("handmade",       "macaroon",     "drape"),
    ]
    for slug, colour, form in cats:
        made.append(build(f"{OUT_CATEGORY}/{slug}.svg", colour, form, w=900, h=1200))

    # --- editorial / hero art --------------------------------------------
    # Hero art sits under white display type, so it is built on the night
    # ground: a pale bed on a pale wall gives the headline nothing to sit
    # against, and no amount of scrim gradient fixes a picture that light.
    made.append(build(f"{OUT_EDITORIAL}/hero-bed.svg", "parchment", "bed", w=2000, h=1100, bg="night"))
    made.append(build(f"{OUT_EDITORIAL}/hero-drape.svg", "l-light-blue", "drape", w=2000, h=1100))
    made.append(build(f"{OUT_EDITORIAL}/hero-stack.svg", "arctic-wolf", "stack", w=2000, h=1100))
    made.append(build(f"{OUT_EDITORIAL}/story-weave.svg", "greige", "swatch", w=1400, h=900))
    made.append(build(f"{OUT_EDITORIAL}/story-cotton.svg", "off-white", "drape", w=1400, h=900))
    made.append(build(f"{OUT_EDITORIAL}/story-craft.svg", "macaroon", "drape", w=1400, h=900))
    made.append(build(f"{OUT_EDITORIAL}/band-ink.svg", "praline", "drape", w=2000, h=760))
    for n, (c, f) in enumerate([("white", "stack"), ("light-blue", "pillow"),
                                ("greige", "bed"), ("lila", "drape")], 1):
        made.append(build(f"{OUT_EDITORIAL}/look-{n}.svg", c, f, w=1000, h=1250))

    print(f"wrote {len(made)} SVGs")
    for group in (OUT_PRODUCTS, OUT_CATEGORY, OUT_EDITORIAL):
        print(f"  {group}: {len([m for m in made if m.startswith(group)])}")


if __name__ == "__main__":
    main()
