# Percaal — Egyptian Cotton

A fully **static** storefront for Percaal: plain HTML + Tailwind (Play CDN) +
vanilla JavaScript. No React, no build step, no server runtime. Every page is a
standalone `.html` file you can open in a browser or drop on any static host.

Forked from the OrderBase template as it stood in the Exception build, so it
inherits the complete **OrderBase checkout** (two-step stepper, option rows,
store and schedule pickers, gift orders, promo, wallet, one-owner summary math)
and the mature component layer beneath it. Everything visual, every product and
all copy is Percaal's own.

```bash
python3 tools/serve.py 8899      # then open http://127.0.0.1:8899/
```

`tools/serve.py` is a thin wrapper around `http.server` that chdirs into the
project first and sends `Cache-Control: no-store`, so edits show up on reload.
Any static server works; the pages need an internet connection for the Tailwind
CDN and Google Fonts.

`.claude/launch.json` runs a **separate** inline Node static server on the same
port for the in-editor preview. Python is deliberately not used there: the
preview launcher's sandbox denies its child process every stat and read under
this directory, so `SimpleHTTPRequestHandler` 404s on everything — including
`index.html` — while Node reads the files fine. Don't run both at once; they
both want port 8899.

---

## The brand

Source of truth: **`Percaal logo guidelines.pdf`** plus the Pantone secondary
sheet. Both are encoded in `tw-config.js` and `styles.css` rather than being
re-derived per page.

| | |
|---|---|
| **Primary** | Teal `#47B5B2` — the only colour named in the logo guideline |
| **Ink** | `#111A19` — a very slightly teal-shifted charcoal; all text and every "selected" state |
| **Secondary** | Pantone TCX: Pastel Parchment `#E0D5C7` · Arctic Wolf `#E3DCC9` · Macaroon `#A5714E` · Praline `#94765C` · Frosted Mint `#C0CDC2` |
| **Display type** | STIX Two Text — the logotype face, reused for every headline |
| **UI type** | Inter, small and neat: body sits at 13–14px |
| **Radius** | **4px everywhere.** Circles (avatars, dots, the bag badge) and the one physical switch are the only exceptions |

Four house rules drive every decision, and they are written at the top of
`styles.css` so they stay visible to whoever edits it next:

1. **Radius is 4px.** Not 6, not 8, not "just this once".
2. **Contrast is ink on paper.** Mid-greys are hairlines and secondary labels only.
3. **Teal means action.** Links, prompts, focus, the selected swatch ring —
   never decoration, never a background wash. Prices are ink, because a price
   is information, not a call to action.
4. **The secondary palette is the product.** Parchment, Arctic Wolf, Macaroon,
   Praline and Frosted Mint are undyed-cotton colours, so they carry the large
   calm surfaces while ink and teal handle text and action.
5. **Space does the work.** Structure comes from whitespace and 1px rules.
   Shadows are near-invisible by design.

### Logo

`images/logos/` holds vector artwork extracted from the guideline PDF, plus the
official `percaal-logo-official.svg` you supplied, kept for provenance.

- `logo-h-{dark,light,teal}.svg` — horizontal lockup (used in the header/footer)
- `logo-v-*.svg` — the vertical lockup as drawn in the guideline
- `mark-*.svg`, `wordmark-*.svg` — the parts on their own
- `favicon.svg` — the mark in brand teal

The guideline's rules are enforced in CSS (`.brand-logo` in `styles.css`) rather
than left to discipline: minimum 100px width, clear space of half the logo
height on every side, and `filter`/`box-shadow`/`transform` locked off so no
stray utility class can distort, rotate, recolour or shadow the mark.

---

## Layout: the Zara Home widget

The reference you gave has one defining move, and the whole storefront is built
on it: **a large picture with small, quiet, left-aligned text under it.**

- `.egrid` — 3-up on desktop, 2-up on tablet and phone. Never more than 4 columns.
- `.tile` — a 4:5 portrait media box (`--portrait` 3:4, `--tall` 2:3, `--square`,
  `--wide`) with a 13px title, a 12px meta line and a 13px price.
- `.tile--overlay` — caption laid over the picture, for category destinations
  that have no price to line up.

The ratio between how big the image is and how small the text is *is* the
design. Growing the captions or centring them turns the page back into an
ordinary e-commerce grid.

---

## The catalogue

`scripts.js` holds a single `PRODUCTS` array plus `COLOURWAYS`, `FABRICS` and
`SIZES`, modelled directly on the supplier sheet's **Category → Sub-Category →
Title/Size** hierarchy with Fabric and Colour as the two variation axes. Every
product surface reads from it, so a homepage shelf, a category grid, the PDP and
the related rail can never disagree about a price or a colourway.

```
COLOURWAYS  White · Off-white · Greige · Silver · Light Blue · Pale Blue · Lila
            (+ Coffee, Camel, Brown, Dark Grey, Grey for spreads and duvets)
FABRICS     Percale 400 · Percale 200 · Easy-Care Blend
            (+ Pure Cotton, Microfiber, Memory Foam, Pollydown)
SIZES       120×200 Single · 160×200 Queen · 180×200 King · 200×200 Super King
```

Rendering hooks:

| Hook | What it does |
|---|---|
| `<div data-shelf="all" data-limit="4">` | fills with product cards. The value is `all`, a category, a sub-category, a fabric key, or a comma-separated list of slugs |
| `window.percaalCard(product)` | the card renderer, for pages that need to build their own list |
| `window.percaalProducts` / `percaalFabrics` / `percaalColourways` / `percaalArt` / `percaalMoney` | published so page-level scripts render from the same tables |

**Prices are representative placeholders in EGP.** The supplier sheet's price
column is a stub (every row reads `1`), so the figures in `PRODUCTS[].price` are
plausible A-class Egyptian pricing to be replaced at integration.

---

## Imagery

There is no product photography, so every picture on the site is a **generated
SVG** built by `tools/make-fabric-art.py`:

```bash
python3 tools/make-fabric-art.py     # rewrites images/{products,categories,editorial}
```

Each file is five stacked layers — a graded studio wall, the shadow the object
casts on it, a percale weave `<pattern>` whose pitch scales with the canvas, the
object itself (folded stack, pillow, drape, towel roll, made bed) and a soft key
light. They are honest abstractions rather than fake photographs, and they are
drop-in replaceable: keep the filenames and real photography takes over with no
markup changes.

- `images/products/{form}-{colour}.svg` — every form in every colourway
- `images/products/swatch-{colour}.svg` — flat cloth, for colour pickers
- `images/categories/{slug}.svg` — category art in the secondary palette
- `images/editorial/*.svg` — heroes and story images (`hero-bed.svg` is built on
  a dark "night" ground because white display type sits over it)

Icons are two small line sets drawn on a 24 grid at 1.4px:
`images/icons/line/` (checkout option rows, callouts) and `images/icons/account/`
(the account sidebar). The base template's colour illustrations are gone.

---

## Pages

| Route | File | Notes |
|---|---|---|
| `/` | `index.html` | Hero · the 3-column widget · new in · ink editorial band · category tiles · the seven-colour story · bestsellers · journal · service band |
| `/shop` | `shop.html` | Shop by fabric, by category, by colour, then the full range |
| `/shop/:slug` | `shop-category.html` | `?c=` accepts a category, a sub-category **or** a fabric key. Live fabric/colour filters built from what the set actually contains, plus sort |
| `/products/:slug` | `product.html` | `?p=slug`. Gallery + sticky buy box, fabric/colour/size variations, price recomputed per fabric, spec, care, related |
| `/cart` | `cart.html` | Line items, promo, order note, summary, cross-sell shelf |
| `/checkout` | `checkout.html` | The full OrderBase flow — see below |
| `/thank-you` | `thank-you.html` | Order confirmation, totals matching the checkout |
| `/about` | `about.html` | Brand story, three commitments, field-to-bed sequence, numbers |
| `/branches` | `branches.html` | 11 stores with live city/area filtering |
| `/faqs` | `faqs.html` | Care guide: size table (anchored `#sizes`, linked from the PDP), wash rules, FAQs by category |
| `/blogs`, `/blogs/:slug` | `blogs.html`, `blog.html` | Journal index and article |
| `/contact-us` | `contact-us.html` | Split form, contact tiles, store-finder band |
| auth | `login` · `register` · `forget-password` · `reset-password` | OTP flow, navigable |
| account | `my-account*.html` (9 pages) | Dashboard, profile, orders, order detail, addresses, saved, wallet, vouchers, points |
| misc | `privacy-policy` · `terms-conditions` · `return-policy` · `store-closed` | |

---

## The OrderBase checkout

Preserved in full from the blueprint; only the tokens, icons, copy and data
changed. Everything is driven by `data-*` attribute APIs — see
`initCheckoutSteps` / `initCheckoutOptions` / `initGiftToggle` / `initPromo` /
`initWalletToggle` / `syncSummary` in `scripts.js`.

**Verified working end to end in the browser:**

- Two-step flow with the stepper; step 1 validates every required field before
  advancing, and the tabs only allow jumping *back*
- The page heading follows the step (Shipping → Payment Information)
- Pickup from store → store picker, City→Area cascade, confirm writes the branch
  name into the row's meta and drops its turquoise prompt styling
- Schedule for later → 7 day chips, 6 slots, confirm writes `Day | Slot`
- Gift toggle → recipient fields appear; Pickup dims with a red
  "Not available for gift orders" and a selected Pickup auto-flips to Deliver;
  Cash on delivery dims and payment falls back to card. Toggling off restores
  everything **including the store name that was there before**
- Promo `PERCAAL10` → −10% (EGP 408 on the demo bag), confetti, discount row
- Wallet → EGP 1,250 applied against the balance after the promo, clamped to
  the bill so it can never overpay
- Sticky order summary (`overflow-x-clip`, never `-hidden`)

**Project constants to swap at integration** (all in `scripts.js`):
`STORE_TREE` (11 stores — kept in step with `branches.html`), `PROMO_CODES`
(`PERCAAL10` must match what the header announcement bar advertises),
`FREE_SHIP_THRESHOLD` (2500, also matching the bar), `DELIVERY_PLACE`,
`DELIVERY_ETA`, `WALLET_BASE`, and the country code on the phone fields.

---

## How it works

Every page is its own content plus two mount points:

```html
<div id="site-header"></div>
<main class="overflow-x-clip">…</main>
<div id="site-footer"></div>
```

`scripts.js` injects the header (announcement bar, masthead, mega menus, fabric
rail, utilities), the footer, and every overlay (bag drawer, mobile menu,
search, location sheet, store/schedule pickers) on load. Two body attributes
control the shell: `data-page="checkout"` renders the minimal header/footer, and
`data-path="/route"` drives nav active state. Call `window.kInit(scope)` after
injecting new markup.

**`overflow-x-clip`, never `overflow-x-hidden`** on `main`: `-hidden` makes
`overflow-y` compute to `auto`, which creates a scroll container and silently
kills `position: sticky` further down the page.

Interaction contracts (all auto-wired):

| Widget | Markup hook |
|---|---|
| Product shelf | `[data-shelf]`, optional `[data-limit]` |
| Carousel | `.carousel > .carousel-track > .carousel-slide*` |
| Accordion | `[data-accordion] > .accordion-item > .accordion-trigger + .accordion-panel` |
| Tabs | `[data-tabs]` with `.tab-btn[data-tab]` + `.tab-panel[data-panel]` |
| Quantity | `[data-stepper]` with `[data-step="-1\|1"]` + `[data-qty]` |
| Demo form | `<form data-demo-form="…" data-redirect="page.html">` |
| Overlays | `[data-open="cart\|menu\|search\|location\|lang"]`, close via `[data-close]`, backdrop or `Esc` |
| Add to bag | `window.kAddToCart(qty, sourceEl)` |

---

## Known limitations

- **Prices, stock and copy are placeholders.** The product names, sizes,
  fabrics, colourways and SKU structure come from your sheet; the money does not.
- **Imagery is generated, not photographed.** See *Imagery* above.
- **Arabic is partially wired.** The EN⇄AR toggle flips `dir` and persists the
  choice, and the whole layout uses logical properties, but no Arabic copy or
  Arabic logo lockup was supplied — `applyLang()` has the logo-swap loop ready
  and inert for the moment artwork arrives.
- **No backend.** Search, bag totals, auth and orders are illustrative. Forms
  validate natively, then navigate.
- **Tailwind runs from the Play CDN** and prints a "not for production" console
  notice. Compile before launch:
  ```bash
  npx tailwindcss -i ./styles.css -o ./dist.css --content "./*.html" --minify
  ```
  then replace the two CDN `<script>` tags with `<link rel="stylesheet" href="dist.css">`.
- **The Bugger feedback widget** (bottom of `boot()` in `scripts.js`) is
  Mitchdesigns' review tool, carried over from the Exception build. It is
  **disabled**: its ingest key belonged to that project, so the worker returned
  403 and the widget retried, burying real console output under ~50 errors per
  page load. Put a Percaal ingest key in `BUGGER_KEY` to switch it back on.

---

*Brand: Percaal — Egyptian Cotton. Built on the OrderBase static template.*
