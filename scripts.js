/* =====================================================================
   scripts.js — shared behaviour for the static PERCAAL storefront.

   Replaces the React runtime with vanilla JS:
     • Injects the shared header, footer and overlay chrome into every
       page (each page only ships a #site-header / #site-footer mount
       point, so markup stays DRY and works from the file:// protocol).
     • Re-implements the interactive pieces that were React components:
       mobile menu drawer, cart drawer, search modal, location bottom
       sheet, sticky-on-scroll navbar, mega-menu hover, language toggle.
     • Provides page-level helpers: carousels (replacing Swiper),
       accordions, tabs, quantity steppers, toasts and demo forms.

   Content that the CMS used to supply (menus, footer columns, socials)
   is baked in below as representative placeholder data.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------
     Placeholder content (formerly fetched from the CMS)
     --------------------------------------------------------------- */
  /* Utility-row links, top-left of the masthead (Figma 92:2386). */
  const SUPPORT_MENU = [
    { title: "About", url: "/about" },
    { title: "FAQs", url: "/faqs" },
    { title: "Blog", url: "/blogs" },
    { title: "Contact Us", url: "/contact-us" },
  ];

  /* The category rail. Labels are uppercased by CSS, so they are stored in
     their natural case — "Décor & Accessories" has to keep its accent. */
  const MAIN_MENU = [
    { name: "Offers", url: "/shop/offers" },
    { name: "Bedding", url: "/shop/bedding" },
    { name: "Décor & Accessories", url: "/shop/decor" },
    { name: "Towels", url: "/shop/towels" },
    { name: "Household", url: "/shop/household" },
  ];

  /* Footer columns (Figma 41:55693 / 41:55692). The footer's category list
     is deliberately NOT the same as the header's — it carries Dresses and
     drops Offers. */
  const FOOTER_COLUMNS = [
    {
      name: "Percaal",
      links: [
        { title: "Home", url: "/" },
        { title: "About Us", url: "/about" },
        { title: "Blog", url: "/blogs" },
        { title: "FAQ", url: "/faqs" },
        { title: "Contact Us", url: "/contact-us" },
      ],
    },
    {
      name: "Categories",
      links: [
        { title: "Bedding", url: "/shop/bedding" },
        { title: "Décor & Accessories", url: "/shop/decor" },
        { title: "Towels", url: "/shop/towels" },
        { title: "Dresses", url: "/shop/dresses" },
        { title: "Household", url: "/shop/household" },
      ],
    },
  ];

  const CONTACT = {
    phone: "(+2) 01004733588",
    phoneHref: "tel:+201004733588",
    email: "info@percaal.com",
  };

  /* The signed-in customer the account screens are drawn around. One
     object so the rail, the overview cards and the profile page can
     never disagree about the same person. Figures match the design. */
  const ACCOUNT = {
    name: "Sarah Dawood",
    first: "Sarah",
    last: "Dawood",
    tier: "GOLD",
    phone: "+2 01148822922",
    email: "sarah.dawood@gmail.com",
    wallet: 2000,
    points: 8320,
    address: {
      label: "Home",
      line: "32B Kattamya Heights 1, New Cairo, Cario, Egypt",
      floor: "3",
      apartment: "302",
    },
  };

  /* Announcement bar copy, and the currency / language pills. */
  const ANNOUNCEMENT = "Free shipping for orders above 5,000 EGP";
  /* Currencies are shown by ISO code alone. A symbol prefix misled for
     EGP (£ is the pound sterling), so no currency carries one. */
  const CURRENCIES = [
    { code: "EGP", flag: "images/flag-eg.webp", label: "Egypt" },
    { code: "USD", flag: "images/flag-us.webp", label: "United States" },
    { code: "AED", flag: "images/flag-ae.webp", label: "UAE" },
    { code: "EUR", flag: "images/flag-de.webp", label: "Germany" },
  ];

  /* Footer socials. `ico` names a file in icons/, inlined via window.icon()
     so the glyph inherits the footer's white. */
  const SOCIALS = [
    { title: "Facebook", href: "#", ico: "facebook-01" },
    { title: "Instagram", href: "#", ico: "instagram" },
    { title: "TikTok", href: "#", ico: "tiktok" },
    { title: "YouTube", href: "#", ico: "youtube" },
  ];

  /* Inline an icon from icons.js. Falls back to an empty string (and a
     console warning from window.icon) if the sheet has not loaded, so a
     missing icon never takes a whole template down. */
  function ico(name, size, cls) {
    return typeof window.iconEl === "function"
      ? window.iconEl(name, size || "ico-20", cls)
      : "";
  }

  /* ---------------------------------------------------------------
     THE CATALOGUE

     One source of truth for every product surface on the site: the
     homepage shelves, the shop grid, a category page, the PDP and the
     related rail all read from here, so they can never disagree about a
     price, a colourway or a size.

     Structure follows the supplier sheet exactly — Category →
     Sub-Category → Title/Size, with Fabric and Colour as the two
     variation axes — because that is how the stock is actually
     organised, and any storefront model that fights the stock model
     ends up lying about availability.

     Prices are representative placeholders in EGP. They are NOT from
     the sheet, whose price column is a stub; swap them at integration.
     --------------------------------------------------------------- */

  /* Colourways. These are the dots on a product card, and they are drawn
     from the secondary palette rather than invented — the design's cards
     show a blue / pastel / white triplet. */
  const COLOURWAYS = {
    white: { name: "White", hex: "#FFFFFF", img: "product-08-sheet-set-white-styled" },
    ivory: { name: "Ivory", hex: "#F0EEEA", img: "product-01-sheet-set-ivory" },
    "light-blue": { name: "Light Blue", hex: "#C4E0E7", img: "product-04-duvet-set-blue" },
    pastel: { name: "Pastel", hex: "#E9DED6", img: "product-07-sheet-kit-packaging" },
    sage: { name: "Sage", hex: "#C9CFC4", img: "product-03-sheet-set-sage" },
    taupe: { name: "Taupe", hex: "#D9D9D9", img: "product-06-pillow-taupe" },
    burgundy: { name: "Burgundy", hex: "#7B2233", img: "product-05-pillowcase-pair-burgundy" },
    mocha: { name: "Mocha", hex: "#B78C6F", img: "product-10-fabric-detail-hand" },
  };

  const COTTON_7 = ["white", "ivory", "light-blue", "pastel", "sage", "taupe", "burgundy"];

  const FABRICS = {
    "tc-400": { name: "400 Thread Count", short: "400 TC · 100% Egyptian cotton", long: "Ultra-premium 400 thread count Egyptian cotton — denser, smoother, and the one to buy if you want the bed to feel like a very good hotel." },
    "tc-200": { name: "200 Thread Count", short: "200 TC · 100% Egyptian cotton", long: "Classic 200 thread count Egyptian cotton. Crisp, cool and hard-wearing — the everyday weave." },
    blend: { name: "Easy-Care Blend", short: "65% polyester · 35% cotton", long: "Wrinkle-resistant, quick-drying and happy to skip the iron, with enough cotton in it to still feel like bedding." },
    cotton: { name: "Pure Cotton", short: "100% cotton", long: "100% pure cotton — naturally breathable and soft." },
    microfiber: { name: "Microfiber", short: "Luxury microfiber", long: "Soft, lightweight and extremely durable." },
    "memory-foam": { name: "Memory Foam", short: "Premium memory foam", long: "Contours to your body for support through the night." },
  };

  const SIZES = {
    sheet: ["120×200 (Single)", "160×200 (Queen)", "180×200 (King)", "200×200 (Super King)"],
    duvet: ["140×240 (Single)", "220×240 (Queen/King)"],
    standard: ["Standard"],
    towel: ["50×90", "70×140", "90×160"],
    free: ["One size"],
  };

  /* The catalogue. `img` names a file in images/ without its extension;
     `colours` drives both the dots on the card and the gallery on the PDP. */
  const PRODUCTS = [
    { slug: "cotton-bed-sheet", name: "100% Cotton Bed Sheet", cat: "bedding", sub: "bed-sheets",
      img: "product-08-sheet-set-white-styled", fabrics: ["blend", "tc-200", "tc-400"],
      colours: ["white", "ivory", "light-blue"], sizes: SIZES.sheet,
      from: 4200, price: { blend: 2800, "tc-200": 3400, "tc-400": 4200 }, tags: ["best", "new"] },

    { slug: "sheet-set-ivory", name: "Cotton Sheet Set", cat: "bedding", sub: "bed-sheets",
      img: "product-01-sheet-set-ivory", fabrics: ["tc-200", "tc-400"],
      colours: ["ivory", "white", "pastel"], sizes: SIZES.sheet,
      from: 4200, price: { "tc-200": 3600, "tc-400": 4200 }, tags: ["best", "staff"] },

    { slug: "pillowcase-pair", name: "Pillowcase Pair", cat: "bedding", sub: "pillowcases",
      img: "product-05-pillowcase-pair-burgundy", fabrics: ["tc-200", "tc-400"],
      colours: ["burgundy", "white", "ivory"], sizes: SIZES.standard,
      from: 4200, price: { "tc-200": 900, "tc-400": 1200 }, tags: ["best", "new"] },

    { slug: "towel-set", name: "Cotton Towel Set", cat: "towels", sub: "towels",
      img: "product-02-towel-set-white", fabrics: ["cotton"],
      colours: ["white", "taupe", "sage"], sizes: SIZES.towel,
      from: 4200, price: { cotton: 1800 }, tags: ["best", "staff"] },

    { slug: "duvet-set-blue", name: "Cotton Duvet Set", cat: "bedding", sub: "duvet-covers",
      img: "product-04-duvet-set-blue", fabrics: ["tc-200", "tc-400"],
      colours: ["light-blue", "white", "sage"], sizes: SIZES.duvet,
      from: 4200, price: { "tc-200": 4200, "tc-400": 5400 }, tags: ["new", "staff"] },

    { slug: "cotton-pillow", name: "Cotton Pillow", cat: "bedding", sub: "pillows",
      img: "product-06-pillow-taupe", fabrics: ["memory-foam", "microfiber"],
      colours: ["taupe", "white"], sizes: SIZES.standard,
      from: 4200, price: { "memory-foam": 1400, microfiber: 950 }, tags: ["new"] },

    { slug: "sheet-kit", name: "Sheet Kit", cat: "bedding", sub: "bed-sheets",
      img: "product-07-sheet-kit-packaging", fabrics: ["tc-200"],
      colours: ["pastel", "ivory"], sizes: SIZES.sheet,
      from: 4200, price: { "tc-200": 3900 }, tags: ["staff", "best"] },

    { slug: "sheet-set-sage", name: "Cotton Sheet Set", cat: "bedding", sub: "bed-sheets",
      img: "product-03-sheet-set-sage", fabrics: ["tc-200", "tc-400"],
      colours: ["sage", "white", "taupe"], sizes: SIZES.sheet,
      from: 4200, price: { "tc-200": 3600, "tc-400": 4200 }, tags: ["new", "best"] },

    { slug: "table-linen", name: "Linen Tablecloth", cat: "household", sub: "table-linen",
      img: "category-05-table-linen", fabrics: ["cotton"],
      colours: ["ivory", "pastel"], sizes: SIZES.free, freeSize: true,
      from: 4200, price: { cotton: 2400 }, tags: ["staff"] },

    { slug: "wooden-tray", name: "Wooden Serving Tray", cat: "decor", sub: "decor",
      img: "product-12-wooden-tray", fabrics: ["cotton"],
      colours: ["mocha"], sizes: SIZES.free, freeSize: true,
      from: 4200, price: { cotton: 1650 }, tags: ["staff", "new"] },

    { slug: "bed-frame", name: "Oak Bed Frame", cat: "household", sub: "furniture",
      img: "product-11-bed-frame", fabrics: ["cotton"],
      colours: ["mocha"], sizes: SIZES.free, freeSize: true,
      from: 4200, price: { cotton: 24000 }, tags: ["staff"] },

    { slug: "fabric-swatch", name: "Fabric Swatch Set", cat: "bedding", sub: "bed-sheets",
      img: "product-09-fabric-detail-folded", fabrics: ["cotton"],
      colours: ["ivory", "white", "sage"], sizes: SIZES.free, freeSize: true,
      from: 4200, price: { cotton: 250 }, tags: ["new"] },
  ];

  const productBySlug = (slug) => PRODUCTS.find((p) => p.slug === slug) || PRODUCTS[0];


  /* Product art. A colourway that has its own photograph uses it; the rest
     fall back to the product's own shot, so a swatch click never lands on a
     404 just because that colour was not photographed separately. */
  function productArt(p, colourKey) {
    const c = COLOURWAYS[colourKey];
    const file = (c && c.img) || p.img;
    return "images/" + file + ".webp";
  }

  /* "4,200.00 EGP" — the design puts the unit AFTER the number and always
     shows two decimals, which is the Egyptian retail convention. */
  const money = (n) =>
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " EGP";

  /* ---------------------------------------------------------------
     PRODUCT CARD — the one card used on every shelf and grid.

     Large picture, small quiet caption: that ratio IS the design, so
     the card owns no font sizes of its own beyond the .tile classes.
     The swatch row doubles as the image switcher — hovering a swatch
     swaps the art, which is the cheapest way to answer "what does it
     look like in greige?" without a page load.
     --------------------------------------------------------------- */
  function productCardHTML(p, opts) {
    opts = opts || {};
    const lead = p.colours[0];
    const dots = p.colours
      .slice(0, 3)
      .map(
        (k, i) =>
          `<button type="button" class="pdot${i === 0 ? " is-active" : ""}" style="--sw:${COLOURWAYS[k].hex}"
             data-swatch="${k}" aria-label="${esc(COLOURWAYS[k].name)}" title="${esc(COLOURWAYS[k].name)}"></button>`,
      )
      .join("");

    /* `free size` in Figma is the variant with no colour dots — the body is
       just name and price. Anything with one colourway is effectively that. */
    const showDots = !p.freeSize && p.colours.length > 1;

    /* Variant3 / Variant4 lay a pair of arrows over the picture so you can
       step the gallery without leaving the grid. The gallery here IS the
       colourway set — every colour has its own photograph — so the arrows
       and the dots drive the same index and stay in sync.

       Only shown when there is more than one shot to step through; a single
       image with arrows over it is a control that does nothing. */
    const ic = typeof window.icon === "function" ? window.icon : () => "";
    const showNav = p.colours.length > 1;
    const nav = showNav
      ? `<div class="pwidget__nav">
           <button type="button" data-gal="-1" aria-label="Previous image">${ic("arrow-left-01-sharp")}</button>
           <button type="button" data-gal="1" aria-label="Next image">${ic("arrow-right-01-sharp")}</button>
         </div>`
      : "";

    return `<article class="pwidget" data-product="${p.slug}" data-gal-index="0">
      <div class="pwidget__stage">
        <a class="pwidget__media" href="product.html?p=${p.slug}" aria-label="${esc(p.name)}">
          <img src="${productArt(p, lead)}" alt="${esc(p.name)}" loading="lazy" data-pcard-img />
        </a>
        ${nav}
      </div>
      <div class="pwidget__body">
        <div class="pwidget__text">
          <a class="pwidget__name" href="product.html?p=${p.slug}">${esc(p.name)}</a>
          <p class="pwidget__price">${money(p.from)}</p>
        </div>
        ${showDots ? `<div class="pwidget__dots">${dots}</div>` : ""}
      </div>
    </article>`;
  }

  window.percaalColourways = { map: COLOURWAYS, order: COTTON_7 };
  window.percaalProducts = PRODUCTS;
  window.percaalFabrics = FABRICS;
  window.percaalMoney = money;
  window.percaalArt = productArt;
  window.percaalCard = productCardHTML;

  /* Any element with [data-shelf] gets filled with cards. The value is
     "all", a tag ("new" | "best" | "staff" | "recent"), a category, a
     sub-category, a fabric key, or a comma-separated list of slugs.
     [data-limit] caps the count. */
  function shelfList(q, limit) {
    let list;
    if (q === "all" || q === "recent") list = PRODUCTS.slice();
    else if (q.indexOf(",") > -1) list = q.split(",").map((x) => productBySlug(x.trim()));
    else {
      list = PRODUCTS.filter(
        (p) =>
          (p.tags && p.tags.indexOf(q) > -1) ||
          p.cat === q ||
          p.sub === q ||
          p.fabrics.indexOf(q) > -1 ||
          p.slug === q,
      );
    }
    if (!list.length) list = PRODUCTS.slice();
    return limit > 0 ? list.slice(0, limit) : list;
  }

  function initShelves(scope) {
    (scope || document).querySelectorAll("[data-shelf]").forEach((el) => {
      if (el.dataset.shelfDone) return;
      el.dataset.shelfDone = "1";
      const limit = parseInt(el.getAttribute("data-limit") || "0", 10);
      el.innerHTML = shelfList(el.getAttribute("data-shelf") || "all", limit)
        .map((p) => productCardHTML(p))
        .join("");
    });
  }

  /* The Discover More tab strip swaps the rail's contents in place. */
  function initShelfTabs(scope) {
    (scope || document).querySelectorAll("[data-shelf-tabs]").forEach((tabs) => {
      if (tabs.dataset.tabsDone) return;
      tabs.dataset.tabsDone = "1";
      const band = tabs.closest("section") || document;
      const track = band.querySelector("[data-shelf]");
      if (!track) return;
      tabs.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-shelf-tab]");
        if (!btn) return;
        tabs.querySelectorAll("[data-shelf-tab]").forEach((b) => b.classList.toggle("is-active", b === btn));
        const limit = parseInt(track.getAttribute("data-limit") || "0", 10);
        track.innerHTML = shelfList(btn.getAttribute("data-shelf-tab"), limit)
          .map((p) => productCardHTML(p))
          .join("");
        track.scrollLeft = 0;
        const rail = track.closest("[data-rail]");
        if (rail && rail._railSync) rail._railSync();
      });
    });
  }

  /* --------------------------------------------------------------
     FAQ ACCORDION

     One row open at a time: opening a question closes whichever was
     open, so the list never outgrows the screen and there is only ever
     one place for the eye to be.

     Clicking the open row still closes it, leaving the list fully
     collapsed. A "one must always stay open" rule reads as tidier but
     traps you on a question you have finished reading.

     Lives here rather than in the page so the FAQ page inherits the same
     behaviour from the same markup.
     -------------------------------------------------------------- */
  function initFaq(scope) {
    (scope || document).querySelectorAll("[data-faq]").forEach((list) => {
      if (list.dataset.faqReady) return;
      list.dataset.faqReady = "1";

      list.addEventListener("click", (e) => {
        const btn = e.target.closest(".faq__q");
        if (!btn || !list.contains(btn)) return;
        const item = btn.closest(".faq__item");
        const opening = !item.classList.contains("is-open");
        list.querySelectorAll(".faq__item").forEach((row) => {
          const on = row === item && opening;
          row.classList.toggle("is-open", on);
          const q = row.querySelector(".faq__q");
          if (q) q.setAttribute("aria-expanded", on ? "true" : "false");
        });
      });
    });
  }

  /* --------------------------------------------------------------
     PARALLAX

     Scroll-linked vertical drift. Each [data-parallax-item] declares a
     resting offset and an amplitude; the pair on the Our Story block use
     opposite amplitudes so they cross over — the upper plate settles down
     while the lower one rises.

     Driven by scroll POSITION, not by a triggered animation: progress is
     recomputed from the container's centre against the viewport's centre
     every frame, so scrolling back up replays it in reverse with no extra
     code and no state to get stuck.

     Two things keep it cheap: an IntersectionObserver so nothing is
     computed while the section is off screen, and a rAF latch so a burst
     of scroll events collapses into one write per frame. It sets a custom
     property rather than `transform` directly, leaving the actual
     transform in the stylesheet where the resting layout is defined.
     -------------------------------------------------------------- */
  function initParallax(scope) {
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    (scope || document).querySelectorAll("[data-parallax]").forEach((root) => {
      if (root.dataset.parallaxReady) return;
      root.dataset.parallaxReady = "1";

      const items = [...root.querySelectorAll("[data-parallax-item]")].map((el) => ({
        el,
        base: parseFloat(el.getAttribute("data-parallax-base") || "0"),
        amp: parseFloat(el.getAttribute("data-parallax-amp") || "0"),
      }));
      if (!items.length || reduce) return; /* CSS already holds the resting stagger */

      let visible = false;
      let queued = false;

      const paint = () => {
        queued = false;
        const r = root.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        /* -1 when the block is entering from below, 0 centred, +1 leaving
           at the top. Clamped so the drift stops at the extremes instead
           of running away on a long page. */
        const centre = r.top + r.height / 2;
        const raw = (vh / 2 - centre) / (vh / 2 + r.height / 2);
        const p = Math.max(-1, Math.min(1, raw));
        items.forEach((it) => {
          it.el.style.setProperty("--py", (it.base + p * it.amp).toFixed(1) + "px");
        });
      };

      const onScroll = () => {
        if (!visible || queued) return;
        queued = true;
        requestAnimationFrame(paint);
      };

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          (entries) => {
            visible = entries[0].isIntersecting;
            if (visible) onScroll();
          },
          { rootMargin: "10% 0px" },
        ).observe(root);
      } else {
        visible = true;
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      paint();
    });
  }

  /* --------------------------------------------------------------
     FEATURED PRODUCT HOTSPOT — Figma "Featured" 60:3863 / 60:3809

     A glass tile over a hero that opens to reveal the other products in
     the shot. It is a library component in Figma (opened/closed × web/
     mobile), so it is initialised generically rather than being wired
     into the homepage — any page that drops in [data-featured] gets it.

     Closing on outside click and on Escape, because it sits over a hero
     image: once it is open it covers a chunk of the picture, and the
     only affordance to close it is a 14px minus.
     -------------------------------------------------------------- */
  function initFeatured(scope) {
    (scope || document).querySelectorAll("[data-featured]").forEach((el) => {
      if (el.dataset.featuredReady) return;
      el.dataset.featuredReady = "1";

      const toggle = el.querySelector("[data-featured-toggle]");
      if (!toggle) return;

      const setOpen = (open) => {
        el.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute(
          "aria-label",
          open ? "Hide the products in this film" : "Show the products in this film",
        );
      };

      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        setOpen(!el.classList.contains("is-open"));
      });

      document.addEventListener("click", (e) => {
        if (!el.classList.contains("is-open")) return;
        if (!e.target.closest("[data-featured]")) setOpen(false);
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && el.classList.contains("is-open")) {
          setOpen(false);
          toggle.focus();
        }
      });
    });
  }

  /* --------------------------------------------------------------
     RAIL — the horizontal carousel used by every "…and more" row.
     Scrolls by one card plus the 2px gutter, and disables its arrows
     at each end rather than looping, which is what the design shows.
     -------------------------------------------------------------- */
  function initRails(scope) {
    (scope || document).querySelectorAll("[data-rail]").forEach((rail) => {
      if (rail.dataset.railDone) return;
      rail.dataset.railDone = "1";
      const track = rail.querySelector("[data-rail-track]");
      const prev = rail.querySelector("[data-rail-prev]");
      const next = rail.querySelector("[data-rail-next]");
      if (!track) return;

      const step = () => {
        const first = track.firstElementChild;
        return first ? first.getBoundingClientRect().width + 2 : 320;
      };

      /* [data-rail-loop] makes the rail endless. A copy of the cards sits
         on each side of the real set; whenever the scroll comes to rest
         inside a copy, the track jumps one set width to the identical
         real card, so it never runs out in either direction. The copies
         are hidden from assistive tech and the tab order — the real set
         is what gets announced. */
      const loop = rail.hasAttribute("data-rail-loop");
      let looping = false;
      const dir = () => (getComputedStyle(track).direction === "rtl" ? -1 : 1);
      const setWidth = () => {
        if (!looping) return 0;
        const n = track.querySelectorAll(":scope > :not([data-rail-clone])").length;
        const kids = track.children;
        return Math.abs(kids[2 * n].offsetLeft - kids[n].offsetLeft);
      };
      const jump = (x) => {
        track.style.scrollBehavior = "auto";
        track.scrollLeft = x * dir();
        track.style.scrollBehavior = "";
      };
      const recentre = () => {
        const w = setWidth();
        if (!w) return;
        const x = track.scrollLeft * dir();
        if (x < w * 0.5) jump(x + w);
        else if (x >= w * 1.5) jump(x - w);
      };
      const build = () => {
        track.querySelectorAll(":scope > [data-rail-clone]").forEach((c) => c.remove());
        looping = false;
        const items = Array.from(track.children);
        if (!loop || items.length < 2 || track.scrollWidth <= track.clientWidth + 1) return;
        const copy = (el) => {
          const c = el.cloneNode(true);
          c.setAttribute("data-rail-clone", "");
          c.setAttribute("aria-hidden", "true");
          c.classList.remove("rv-child");
          c.querySelectorAll("a, button").forEach((f) => f.setAttribute("tabindex", "-1"));
          return c;
        };
        track.prepend(...items.map(copy));
        track.append(...items.map(copy));
        looping = true;
        jump(setWidth());
      };

      const sync = () => {
        const max = track.scrollWidth - track.clientWidth - 1;
        if (prev) prev.disabled = !looping && track.scrollLeft <= 0;
        if (next) next.disabled = !looping && track.scrollLeft >= max;
        const noScroll = track.scrollWidth <= track.clientWidth + 1;
        if (prev) prev.hidden = noScroll;
        if (next) next.hidden = noScroll;
      };
      /* Called after a shelf tab swaps the cards, so a looping rail
         re-copies the new set. */
      rail._railSync = () => {
        build();
        sync();
      };

      let settle;
      if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
      if (next) next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
      track.addEventListener(
        "scroll",
        () => {
          sync();
          if (!looping) return;
          clearTimeout(settle);
          settle = setTimeout(recentre, 120);
        },
        { passive: true }
      );
      window.addEventListener("resize", () => {
        sync();
        recentre();
      });
      build();
      /* Cards are lazily filled by initShelves, so measure after layout. */
      requestAnimationFrame(sync);
      window.addEventListener("load", sync, { once: true });
    });
  }

  /* Hovering / clicking a swatch on a card swaps that card's picture. */
  /* --------------------------------------------------------------
     CARD GALLERY

     A product card's gallery is its colourway set — each colour has its
     own photograph. Two controls drive it and they must never disagree,
     so both go through showShot(): the dots (hover or click) jump to a
     colour, the arrows step by one and wrap.

     The index lives on the card as data-gal-index rather than in a
     closure, because cards are re-rendered wholesale when a shelf tab
     switches; keeping state in the DOM means the new markup starts clean
     instead of inheriting a stale pointer.
     -------------------------------------------------------------- */
  function initCardSwatches(scope) {
    const root = scope || document;
    if (root === document && document.body.dataset.swatchDelegated) return;
    if (root === document) document.body.dataset.swatchDelegated = "1";

    const showShot = (card, index) => {
      const p = productBySlug(card.getAttribute("data-product"));
      const img = card.querySelector("[data-pcard-img]");
      if (!p || !img) return;
      const n = p.colours.length;
      const i = ((index % n) + n) % n; /* wrap both ways */
      card.setAttribute("data-gal-index", String(i));
      img.src = productArt(p, p.colours[i]);
      img.alt = p.name + " in " + (COLOURWAYS[p.colours[i]] || {}).name;
      card.querySelectorAll(".pdot").forEach((d) =>
        d.classList.toggle("is-active", d.getAttribute("data-swatch") === p.colours[i]),
      );
    };

    const fromDot = (e) => {
      const sw = e.target.closest(".pwidget .pdot");
      if (!sw) return;
      const card = sw.closest(".pwidget");
      const p = card && productBySlug(card.getAttribute("data-product"));
      if (!p) return;
      showShot(card, p.colours.indexOf(sw.getAttribute("data-swatch")));
    };

    document.addEventListener("mouseover", fromDot);
    document.addEventListener("click", (e) => {
      /* Arrows sit over the media link, so their click must not navigate. */
      const arrow = e.target.closest(".pwidget [data-gal]");
      if (arrow) {
        e.preventDefault();
        e.stopPropagation();
        const card = arrow.closest(".pwidget");
        const at = parseInt(card.getAttribute("data-gal-index") || "0", 10);
        showShot(card, at + parseInt(arrow.getAttribute("data-gal"), 10));
        return;
      }
      if (e.target.closest(".pwidget .pdot")) {
        e.preventDefault();
        fromDot(e);
      }
    });
  }


  /* ---------------------------------------------------------------
     Route → static-file mapping
     --------------------------------------------------------------- */
  function pageHref(url) {
    if (!url) return "#";
    if (/^https?:\/\//.test(url) || url.startsWith("#") || url.endsWith(".html"))
      return url;
    const clean = "/" + url.replace(/^\/+/, "").replace(/\/+$/, "");
    const map = {
      "/": "index.html",
      "/about": "about.html",
      "/branches": "branches.html",
      "/faqs": "faqs.html",
      "/contact-us": "contact-us.html",
      "/privacy-policy": "privacy-policy.html",
      "/terms-conditions": "terms-conditions.html",
      "/return-policy": "return-policy.html",
      "/blogs": "blogs.html",
      "/shop": "shop.html",
      "/cart": "cart.html",
      "/checkout": "checkout.html",
      "/thank-you": "thank-you.html",
      "/login": "login.html",
      "/register": "register.html",
      "/forget-password": "forget-password.html",
      "/reset-password": "reset-password.html",
      "/store-closed": "store-closed.html",
      "/my-account": "my-account.html",
    };
    if (map[clean]) return map[clean];
    if (clean.startsWith("/shop/")) return "shop-category.html";
    if (clean.startsWith("/products/")) return "product.html";
    if (clean.startsWith("/blogs/")) return "blog.html";
    if (clean.startsWith("/my-account/"))
      return "my-account-" + clean.split("/")[2] + ".html";
    return "index.html";
  }

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  /* ---------------------------------------------------------------
     SVG icons (ported from the React icon components)
     --------------------------------------------------------------- */
  const ICON = {
    account:
      '<svg viewBox="0 0 29 29" fill="none" class="w-6 h-6"><path d="M4.47 22.96C7.43 21.29 10.85 20.33 14.5 20.33s7.07.96 10.03 2.63M18.88 11.58a4.38 4.38 0 1 1-8.75 0 4.38 4.38 0 0 1 8.75 0ZM27.63 14.5A13.13 13.13 0 1 1 1.38 14.5a13.13 13.13 0 0 1 26.25 0Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search:
      '<svg viewBox="0 0 29 29" fill="none" class="w-6 h-6"><path d="M27.63 27.63 18.88 18.88M21.79 11.58a10.21 10.21 0 1 1-20.42 0 10.21 10.21 0 0 1 20.42 0Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    location:
      '<svg viewBox="0 0 22 20" fill="none" class="w-[22px] h-5"><path d="M16.75 11.75c-3 0-4 2-4 2h-3l-.14-.22c-.86-1.35-1.29-2.03-1.87-2.52-.51-.43-1.11-.76-1.75-.96-.72-.23-1.53-.23-3.13-.23H.75M16.75 11.75c3 0 4 2 4 2M16.75 11.75 15.23 3.38c-.17-.94-.26-1.4-.5-1.75a2 2 0 0 0-.84-.71c-.39-.17-.86-.17-1.81-.17h-.33M3.75 6.75h2M.75 3.75h4M15.75 5.75h1.42a1.5 1.5 0 0 0 .58-2.9c-.2-.09-.42-.1-.58-.1H15.25M6.75 15.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM18.75 16.75a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    menu: '<svg width="31" height="30" viewBox="0 0 31 30" fill="none"><path d="M21 6 9 6M21 12 3 12M15 18H3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bars: '<svg viewBox="0 0 24 24" fill="none" class="w-6 h-6"><path d="M20 7H8M20 12H4M20 17H10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" class="w-6 h-6"><path d="M6.5 8h11l-.7 10.4a1.6 1.6 0 0 1-1.6 1.5H8.8a1.6 1.6 0 0 1-1.6-1.5L6.5 8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    /* Empty-cart glyph for the count badge. Sized in % (not a fixed px
       class) so the one markup fits every badge it's dropped into —
       22px desktop/floating and 16px mobile — and inherits the badge's
       white via currentColor. Heavier stroke than ICON.bag: at ~13px the
       1.6 weight of the full-size icon renders too faint to read. */
    bagBadge:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="w-3/5 h-3/5"><path d="M6.5 8h11l-.7 10.4a1.6 1.6 0 0 1-1.6 1.5H8.8a1.6 1.6 0 0 1-1.6-1.5L6.5 8Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    close2: '<svg viewBox="0 0 24 24" fill="none" class="w-6 h-6"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" class="w-4 h-4"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevronDown:
      '<svg viewBox="0 0 24 24" fill="none" class="w-4 h-4"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" class="w-6 h-6"><path d="M2.5 3h1.6c.5 0 .93.35 1.03.84l.34 1.66m0 0 1.4 6.86c.16.8.87 1.37 1.68 1.37h7.9c.79 0 1.48-.54 1.66-1.31l1.3-5.4a.85.85 0 0 0-.83-1.05H5.47M9 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowRight:
      '<svg viewBox="0 0 24 24" fill="none" class="w-5 h-5"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowLeft:
      '<svg viewBox="0 0 24 24" fill="none" class="w-5 h-5"><path d="m15 6-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    phone:
      '<svg viewBox="0 0 24 24" fill="none" class="w-4 h-4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  const isCheckout = () => document.body.getAttribute("data-page") === "checkout";
  const currentPath = () => document.body.getAttribute("data-path") || "/";

  /* ---------------------------------------------------------------
     Brand logo.

     Two lockups, both supplied as artwork in images/:
       landscape  250 × 57  — the masthead
       portrait   171 × 125 — the footer, and the minimal footer at 118 × 86

     The files are ink-coloured, so the footer (Warm Brown ground) inverts
     them with a CSS filter rather than shipping a second pair of files —
     the mark is a flat single-colour drawing, so inversion is lossless.
     --------------------------------------------------------------- */
  function logoMark(dark, size) {
    const h = size || 57;
    const w = Math.round((250 / 57) * h);
    return `<span class="brand-logo" style="--logo-h:${h}px"><img src="images/percaal-landscape-logo.svg" width="${w}" height="${h}" alt="Percaal — Egyptian Cotton" /></span>`;
  }

  /* Portrait lockup. `light` renders it for a dark ground. */
  function logoStack(light, h) {
    const height = h || 125;
    const w = Math.round((171 / 125) * height);
    return `<span class="brand-logo${light ? " brand-logo--light" : ""}" style="--logo-h:${height}px"><img src="images/percaal-portrait-logo.svg" width="${w}" height="${height}" alt="Percaal — Egyptian Cotton" /></span>`;
  }

  /* ---------------------------------------------------------------
     Header
     --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
     HEADER — Figma "Header" 92:2386

     Three stacked strips, all on offwhite #F0EEEA:

       1. announcement   Warm Brown #686156, 24px tall, 12px/+1px white
                         centred, with a dismiss × at each end (the left one
                         is invisible in the design and exists only so the
                         label stays optically centred — reproduced here as
                         a spacer rather than a second button, so screen
                         readers are not told about a control that isn't one)
       2. utility row    secondary nav left (DM Sans Light 14 / +1px /
                         #595B61, 24px gaps, 60px gutter) · 250×57 logo
                         centred · currency + language + 4 icons right in a
                         412px block
       3. category rail  DM Sans Regular 16 / +1px / uppercase / #2C2929,
                         60px gaps, 20px vertical padding

     The whole header is 191px tall at 1512px wide, which is what the Home
     frame reserves for it.
     --------------------------------------------------------------- */
  function headerHTML() {
    const checkout = isCheckout();

    /* --- 1. announcement ------------------------------------------- */
    const announce = `
      <div class="hdr-announce">
        <span class="hdr-announce__spacer" aria-hidden="true"></span>
        <p class="hdr-announce__text">${esc(ANNOUNCEMENT)}</p>
        <button type="button" class="hdr-announce__close" data-dismiss-announce aria-label="Dismiss">
          ${ico("cancel-01", "ico-12")}
        </button>
      </div>`;

    /* --- 2. utility row -------------------------------------------- */
    const secondary = SUPPORT_MENU.map(
      (i) => `<a href="${pageHref(i.url)}" class="hdr-sublink">${esc(i.title)}</a>`,
    ).join("");

    const currency = `
      <div class="hdr-currency" data-currency>
        <button type="button" class="hdr-currency__btn" data-currency-toggle aria-haspopup="listbox" aria-expanded="false">
          <img src="images/flag-eg.webp" alt="" width="17" height="13" class="hdr-currency__flag" />
          <span data-currency-code>EGP</span>
        </button>
        <span class="hdr-currency__rule" aria-hidden="true"></span>
        <button type="button" class="hdr-currency__btn" data-currency-toggle data-lang-label>EN</button>

        <!-- Regional settings. One panel for both choices: a searchable
             country list on top (picking one sets its currency) and the
             language as two tabs underneath, which apply on click rather
             than needing a confirm. -->
        <div class="regpop" data-currency-menu>
          <p class="regpop__label" id="regpop-country">Country</p>

          <!-- A closed field showing the country in use; opening it
               reveals the search and the full list. Built as a combobox
               rather than a bare list so the panel stays short however
               many destinations are added. -->
          <div class="cselect" data-cselect>
            <button type="button" class="cselect__field" data-cselect-toggle
                    aria-haspopup="listbox" aria-expanded="false" aria-labelledby="regpop-country">
              <img class="cselect__flag" src="images/flag-eg.webp" alt="" width="17" height="13" />
              <span class="cselect__value" data-cselect-value>Egypt</span>
              <span class="ico ico-16 cselect__chev" data-ico="arrow-down-01-sharp" aria-hidden="true"></span>
            </button>

            <div class="cselect__panel">
              <label class="regpop__search">
                <span class="ico ico-16" data-ico="search" aria-hidden="true"></span>
                <input type="search" data-country-search placeholder="Search countries" autocomplete="off" aria-label="Search countries" />
              </label>
              <ul class="regpop__list" data-country-list role="listbox" aria-labelledby="regpop-country">
                ${CURRENCIES.map(
                  (c) =>
                    `<li role="option" tabindex="0" data-currency-pick="${c.code}" data-country-name="${c.label}">
                       <img src="${c.flag}" alt="" width="17" height="13" />
                       <span class="regpop__country">${c.label}</span>
                       <span class="regpop__code">${c.code}</span>
                     </li>`,
                ).join("")}
              </ul>
              <p class="regpop__empty" data-country-empty hidden>No country matches that.</p>
            </div>
          </div>

          <span class="regpop__rule" aria-hidden="true"></span>

          <p class="regpop__label">Language</p>
          <div class="regpop__tabs" role="tablist" aria-label="Language">
            <button type="button" class="regpop__tab" data-lang-tab="en" role="tab">English</button>
            <button type="button" class="regpop__tab" data-lang-tab="ar" role="tab" lang="ar">العربية</button>
          </div>
        </div>
      </div>`;

    const utilities = `
      <div class="hdr-tools">
        ${currency}
        <button type="button" data-open="search" class="hdr-icon" aria-label="Search">${ico("search", "ico-20")}</button>
        <a href="login.html" class="hdr-icon" aria-label="Account">${ico("user", "ico-20")}</a>
        <a href="my-account-favorites.html" class="hdr-icon" aria-label="Favourites">${ico("favourite", "ico-20")}</a>
        <button type="button" data-open="cart" class="hdr-icon hdr-bag" aria-label="Cart">
          ${ico("shopping-bag-03", "ico-24")}
          <span class="hdr-bag__count" data-cart-count>1</span>
        </button>
      </div>`;

    const desktop = `
      <div class="hdr-desktop">
        ${
          checkout
            ? `<div class="hdr-main hdr-main--checkout">
                 <div class="hdr-row hdr-row--checkout">
                   <a href="index.html" aria-label="Percaal home">${logoMark(true, 46)}</a>
                   <a href="cart.html" class="link-more">Back to bag ${ico("arrow-right-02-round", "ico-20", "link-more__icon")}</a>
                 </div>
               </div>`
            : `<div class="hdr-main">
                 <div class="hdr-row">
                   <nav class="hdr-sub" aria-label="Secondary">${secondary}</nav>
                   <a href="index.html" class="hdr-logo" aria-label="Percaal home">${logoMark(true, 57)}</a>
                   ${utilities}
                 </div>
               </div>
               <nav class="hdr-rail" aria-label="Categories">
                 ${MAIN_MENU.map(
                   (m) =>
                     `<a href="${pageHref(m.url)}" class="hdr-raillink${currentPath().startsWith(m.url) ? " is-current" : ""}">${esc(m.name)}</a>`,
                 ).join("")}
                 <span class="hdr-rail__cart">
                   <button type="button" data-open="cart" class="hdr-icon hdr-bag" aria-label="Cart">
                     ${ico("shopping-bag-03", "ico-24")}
                     <span class="hdr-bag__count" data-cart-count>1</span>
                   </button>
                 </span>
               </nav>`
        }
      </div>`;

    /* --- mobile ------------------------------------------------------
       The mobile frames keep the announcement bar and collapse the rest
       into burger · logo · search + bag. */
    const mobile = `
      <div class="hdr-mobile">
        <div class="hdr-mobile__row">
          ${checkout ? "" : `<button type="button" data-open="menu" class="hdr-icon" aria-label="Menu">${ico("menu-02", "ico-24")}</button>`}
          <a href="index.html" class="hdr-mobile__logo" aria-label="Percaal home">${logoMark(true, 36)}</a>
          ${
            checkout
              ? ""
              : `<div class="hdr-mobile__tools">
                   <button type="button" data-open="search" class="hdr-icon" aria-label="Search">${ico("search", "ico-20")}</button>
                   <button type="button" data-open="cart" class="hdr-icon hdr-bag" aria-label="Cart">
                     ${ico("shopping-bag-03", "ico-24")}
                     <span class="hdr-bag__count" data-cart-count>1</span>
                   </button>
                 </div>`
          }
        </div>
      </div>`;

    return `<header class="site-header">${checkout ? "" : announce}${desktop}${mobile}</header>`;
  }

  /* ---------------------------------------------------------------
     FOOTER — Figma "Footer" 117:5843

     Warm Brown #686156 body (100px top / 60px bottom padding) over a
     #625B4F credits bar 36px tall. Four columns: portrait logo, two link
     lists, and the newsletter + socials + contact stack.

     `minimal` (used on checkout) is the same credits bar under a centred
     118×86 logo, with the columns dropped.
     --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
     ACCOUNT MENU — Figma 159:8116.

     The 384px rail every my-account page carries down its left side.
     A page mounts it with <div id="account-menu" data-active="orders">
     and the key it passes is what gets the filled tab, so the active
     state lives in one place instead of being hand-edited per page.
     --------------------------------------------------------------- */
  const ACCOUNT_TABS = [
    ["overview", "OVERVIEW", "dashboard-square-03", "my-account.html"],
    ["orders", "MY ORDERS", "shopping-bag-03", "my-account-orders.html"],
    ["favorites", "MY FAVORITES", "favourite", "my-account-favorites.html"],
    ["addresses", "MY ADDRESSES", "location-10", "my-account-addresses.html"],
    ["points", "MY POINTS", "coins-01", "my-account-point.html"],
    ["wallet", "MY WALLET", "wallet-02", "my-account-wallet.html"],
    ["profile", "MY PROFILE", "user", "my-account-profile.html"],
  ];

  function accountMenuHTML(active) {
    const tabs = ACCOUNT_TABS.map(([key, label, glyph, href]) => {
      const on = key === active;
      /* My Points spotlights this tab after a redeem, and finds it by
         this attribute — keep it even though the rail has no badge. */
      const hook = key === "wallet" ? " data-wallet-tab" : "";
      return `<a href="${href}" class="acct-tab${on ? " is-active" : ""}"${
        on ? ' aria-current="page"' : ""
      }${hook}>${ico(glyph, "ico-20")}<span>${label}</span></a>`;
    }).join("");

    return `
      <nav class="acct-menu" aria-label="Account">
        <div class="acct-menu__user">
          <span class="acct-tier"><span class="acct-tier__dot" aria-hidden="true"></span>GOLD</span>
          <p class="acct-menu__name">${esc(ACCOUNT.name)}</p>
          <!-- Phones only: the help block (and its Logout) is hidden there,
               so Logout rides on the name row instead. -->
          <a href="index.html" class="acct-menu__out">Logout</a>
        </div>
        <span class="acct-menu__rule" aria-hidden="true"></span>
        <div class="acct-menu__tabs">${tabs}</div>
        <span class="acct-menu__rule" aria-hidden="true"></span>
        <div class="acct-menu__help">
          <p class="acct-menu__help-title">Need Help?</p>
          <div class="acct-menu__help-links">
            <a href="faqs.html">FAQs</a>
            <a href="contact-us.html">Contact Us</a>
            <a href="index.html" class="acct-menu__logout">Logout</a>
          </div>
        </div>
      </nav>`;
  }

  function footerHTML() {
    const credits = `
      <div class="ftr-credits">
        <p class="ftr-credits__copy">© ${YEAR} Brandroom-Egypt . All rights reserved.</p>
        <div class="ftr-pay">
          <span><img src="images/payment-method-mastercard.webp" alt="Mastercard" /></span>
          <span><img src="images/payment-method-visa.webp" alt="Visa" /></span>
          <span><img src="images/payment-method-cash-on-delivery.webp" alt="Cash on delivery" /></span>
        </div>
        <p class="ftr-credits__by">Website Design &amp; Development by Mitchdesigns</p>
      </div>`;

    if (isCheckout()) {
      return `<footer class="site-footer site-footer--minimal">
        <div class="ftr-minimal">
          <a href="index.html" aria-label="Percaal home">${logoStack(true, 86)}</a>
        </div>
        ${credits}
      </footer>`;
    }

    const column = (c) => `
      <div class="ftr-col">
        <p class="ftr-col__title">${esc(c.name)}</p>
        <nav class="ftr-col__links">
          ${c.links.map((l) => `<a href="${pageHref(l.url)}">${esc(l.title)}</a>`).join("")}
        </nav>
      </div>`;

    return `<footer class="site-footer">
      <div class="ftr-main">
        <a href="index.html" class="ftr-logo" aria-label="Percaal home">${logoStack(true, 125)}</a>

        ${FOOTER_COLUMNS.map(column).join("")}

        <div class="ftr-side">
          <div class="ftr-news">
            <p class="ftr-col__title">Subscribe to Our Newsletter</p>
            <form class="ftr-news__form" data-newsletter>
              <input type="email" required placeholder="Enter Email Address" aria-label="Email address" class="ftr-news__input" />
              <button type="submit" class="cta cta--black">Subscribe</button>
            </form>
          </div>

          <div class="ftr-contact">
            <ul class="ftr-social">
              ${SOCIALS.map(
                (x) =>
                  `<li><a href="${x.href}" aria-label="Percaal on ${x.title}">${ico(x.ico, "ico-24")}</a></li>`,
              ).join("")}
            </ul>
            <a href="${CONTACT.phoneHref}" class="ftr-contact__row">${ico("call-ringing-02", "ico-24")}<span dir="ltr">${esc(CONTACT.phone)}</span></a>
            <a href="mailto:${CONTACT.email}" class="ftr-contact__row">${ico("mail-open", "ico-24")}<span>${esc(CONTACT.email)}</span></a>
          </div>

          <div class="ftr-legal">
            <a href="privacy-policy.html">Privacy policy</a>
            <a href="terms-conditions.html">Terms of service</a>
          </div>
        </div>
      </div>
      ${credits}
    </footer>`;
  }

  const YEAR = 2026; // static build stamp (Date.now avoided for determinism)

  /* Single source of truth for the demo cart's starting contents — read by
     overlaysHTML() to render the drawer AND by cartCount's initial value
     below, so the header badge always starts equal to the actual number
     of units in the drawer (and so reaches exactly 0 when it's emptied,
     instead of stopping at a leftover offset from an unrelated seed). */
  const DEMO_CART_ITEMS = [
    {
      name: "Percale 400 Fitted Sheet",
      price: 2450,
      qty: 1,
      img: "images/product-01-sheet-set-ivory.webp",
      variants: [["Size", "180×200 (King)"], ["Colour", "Off-white"]],
    },
    {
      name: "Percale 200 Pillow Case",
      price: 540,
      qty: 2,
      img: "images/product-04-duvet-set-blue.webp",
      variants: [["Size", "Standard"], ["Colour", "Light Blue"]],
    },
  ];

  /* One line item in the cart drawer — Figma 74:2002 right column. Thumb +
     name + attribute list + price on the left; a boxed [-] N [+] stepper on
     the right. Shared by the seeded rows and by quick-add, so a row added
     from "You May Also Like" is indistinguishable from one there on load.
     `key` names the product plus its chosen options, so adding the same
     thing again raises the quantity instead of adding a second row. */
  function cartRowHTML(it) {
    const attrs =
      it.variants && it.variants.length
        ? `<p class="cart-row__attrs">${it.variants
            .map(([, v]) => esc(v))
            .join(' <span aria-hidden="true">·</span> ')}</p>`
        : "";
    return `
      <div class="cart-row" data-cart-row data-unit-price="${it.price}"${it.key ? ` data-line-key="${esc(it.key)}"` : ""}>
        <img src="${it.img}" alt="${esc(it.name)}" class="cart-row__thumb" />
        <div class="cart-row__body">
          <p class="cart-row__name">${esc(it.name)}</p>
          ${attrs}
          <p class="cart-row__price">${egp(it.price)}</p>
        </div>
        <div class="cart-row__stepper" data-stepper data-removable>
          <button type="button" data-step="-1" class="cart-row__btn" aria-label="Decrease quantity"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
          <span data-qty class="cart-row__qty">${it.qty}</span>
          <button type="button" data-step="1" class="cart-row__btn" aria-label="Increase quantity"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
        </div>
      </div>`;
  }

  /* ---------------------------------------------------------------
     YOU MAY ALSO LIKE — quick add from the cart drawer

     Each card carries a + on its photo so a shopper can add without
     leaving the bag. A simple product (one colour, size and fabric) goes
     straight in. A variable one opens a small frosted menu over the photo,
     one choice per step and only for the axes that actually vary: colour,
     then size, then fabric. Choosing (or hovering) a colour switches the
     card's photo to it, so the picture always shows what will be added.
     Picking the last step adds it. Wired in initQuickAdd().
     --------------------------------------------------------------- */
  const UPSELL_SLUGS = ["pillowcase-pair", "wooden-tray", "sheet-set-sage", "towel-set", "fabric-swatch", "cotton-pillow"];

  /* Short fabric names: the menu is 134px wide and shares each row with
     a price. */
  const FABRIC_SHORT = {
    "tc-400": "400 TC", "tc-200": "200 TC", blend: "Easy-Care",
    cotton: "Cotton", microfiber: "Microfiber", "memory-foam": "Memory Foam",
  };

  /* The choices a product needs, in the order they are asked. */
  function quickAddSteps(p) {
    const steps = [];
    if (p.colours.length > 1) {
      steps.push({
        axis: "colour",
        title: "Colour",
        options: p.colours.map((c) => ({ value: c, label: COLOURWAYS[c].name, swatch: COLOURWAYS[c].hex })),
      });
    }
    if (p.sizes.length > 1) {
      steps.push({
        axis: "size",
        title: "Size",
        // "180×200 (King)" reads as "King" with the dimensions beside it.
        options: p.sizes.map((v) => {
          const m = /^(.*?)\s*\((.+)\)$/.exec(v);
          return { value: v, label: m ? m[2] : v, note: m ? m[1] : "" };
        }),
      });
    }
    if (p.fabrics.length > 1) {
      steps.push({
        axis: "fabric",
        title: "Fabric",
        options: p.fabrics.map((f) => ({
          value: f,
          label: FABRIC_SHORT[f] || FABRICS[f].name,
          note: Number(p.price[f]).toLocaleString("en-US"),
        })),
      });
    }
    return steps;
  }

  function upsellCardHTML(p) {
    const colour = p.colours[0];
    const prices = p.fabrics.map((f) => p.price[f]);
    const low = Math.min(...prices);
    const priceLabel = (prices.some((v) => v !== low) ? "From " : "") + egp(low);
    const variable = quickAddSteps(p).length > 0;
    const href = "product.html?p=" + encodeURIComponent(p.slug);
    return `
      <div class="upsell-card" data-quick-add data-slug="${esc(p.slug)}" data-colour="${esc(colour)}">
        <div class="upsell-card__stage">
          <a class="upsell-card__media" href="${href}" tabindex="-1" aria-hidden="true">
            <img src="${productArt(p, colour)}" alt="" loading="lazy" />
          </a>
          <button type="button" class="upsell-card__add" data-qa-toggle
                  aria-label="${variable ? "Choose options for " : "Add to bag: "}${esc(p.name)}"
                  ${variable ? `aria-expanded="false" aria-controls="qa-${esc(p.slug)}"` : ""}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
          ${variable ? `<div class="qa-panel" id="qa-${esc(p.slug)}" data-qa-panel></div>` : ""}
        </div>
        <a class="upsell-card__name" href="${href}">${esc(p.name)}</a>
        <span class="upsell-card__price">${priceLabel}</span>
      </div>`;
  }

  /* ---------------------------------------------------------------
     Overlays: backdrop, cart drawer, mobile menu, search, location
     --------------------------------------------------------------- */
  function overlaysHTML() {
    /* Menu drawer, top section: the shop categories — what people actually
       came to browse — each with its own icon, at the drawer's headline size. */
    /* Drawer categories come straight from MAIN_MENU, so the phone menu
       and the desktop nav can never list different things. Sub-categories
       ride along underneath at body size — on a phone there is no hover,
       so a mega-menu equivalent has to be a plain nested list. */
    /* Menu — Figma 246:17978. Collections in uppercase ink, then the
       secondary pages smaller and lighter under a divider. --i staggers
       each row's fade-in as the sheet opens. */
    const menuCategoryLinks = MAIN_MENU.map(
      (c, i) => `<li style="--i:${i}"><a href="${pageHref(c.url)}">${esc(c.name)}</a></li>`,
    ).join("");
    const menuSecondaryLinks = SUPPORT_MENU.map(
      (p, i) => `<li style="--i:${i + MAIN_MENU.length}"><a href="${pageHref(p.url)}">${esc(p.title)}</a></li>`,
    ).join("");

    const demoCartItems = DEMO_CART_ITEMS;
    const cartRows = demoCartItems.map(cartRowHTML).join("");

    /* Upsell widget — Figma 74:1983 "You May Also Like" left column. A
       vertical stack of 134-wide widgets: photo plate with a quick-add +,
       name on two lines, price. See "YOU MAY ALSO LIKE" above. */
    const upsellCards = UPSELL_SLUGS.map((slug) => upsellCardHTML(productBySlug(slug))).join("");
    const cartUpsell = `
      <p class="cart-drawer__aside-title">You May Also Like</p>
      <div class="cart-drawer__aside-list">${upsellCards}</div>`;

    const initialSubtotal = demoCartItems.reduce((sum, it) => sum + it.price * it.qty, 0);

    return `
    <div data-backdrop class="overlay-backdrop"></div>

    <!-- Cart drawer: header and footer (summary + CTA) are shrink-0 siblings
         of the flex-1 overflow-y-auto scroll region, so only the middle
         (line items + cross-sell grid) scrolls when the cart is full —
         header and footer stay pinned. The free-shipping strip is ALSO
         shrink-0, sitting directly above the footer (not below the header)
         so it stays in view next to the CTA rather than scrolling away
         with the line items it's reporting on. -->
    <!-- Summary Cart drawer — Figma 74:2002. Two columns on the same
         panel: the "You May Also Like" upsell rail on the left (198px)
         and the shopping bag summary on the right (500px). Close ×
         floats outside the panel's left edge. -->
    <aside data-drawer="cart" class="side-drawer side-drawer--right cart-drawer" aria-label="Shopping cart">
      <aside class="cart-drawer__aside" aria-label="You may also like">
        ${cartUpsell}
      </aside>

      <div class="cart-drawer__main">
        <div class="cart-drawer__head">
          <h2 class="cart-drawer__title">
            My Shopping Bag
            <span class="cart-drawer__count" data-cart-count>${demoCartItems.length}</span>
          </h2>
          <a href="cart.html" class="cart-drawer__viewbag">View Cart</a>
          <!-- Absolutely placed against the drawer on desktop (just outside
               its edge); in the phone bottom sheet it sits in this row. -->
          <button type="button" data-close class="side-drawer__close cart-drawer__close" aria-label="Close cart">${ICON.close}</button>
        </div>

        <div class="cart-drawer__list" data-cart-rows>${cartRows}</div>

        <div class="cart-drawer__foot">
          <div class="cart-drawer__promo" data-promo></div>
          <div class="cart-drawer__totals-hidden" hidden>
            <span class="font-medium text-sm" data-cart-discount-row hidden><span data-cart-discount></span></span>
            <span data-cart-total-row hidden><span data-cart-subtotal>${egp(initialSubtotal)}</span><span data-cart-total></span></span>
          </div>
          <a href="checkout.html" class="cart-drawer__checkout">
            <span>CHECKOUT</span>
            <span data-cart-grand>${egp(initialSubtotal)}</span>
          </a>
          <a href="shop.html" class="cart-drawer__continue">CONTINUE SHOPPING</a>
        </div>
      </div>
    </aside>

    <!-- Menu — Figma 246:17978. A full-screen sheet that drops from the
         top: a bar (× · logo), a row of shortcut icons, the collections,
         then the secondary pages. Shortcuts that open another panel close
         the menu first (see the [data-open] handler). -->
    <aside data-drawer="menu" class="side-drawer menu-sheet" aria-label="Menu">
      <!-- The bar is laid exactly over the header row it opens from (the
           positions are measured on open), so the logo stays put and the
           menu icon's three lines turn into the × in place. -->
      <div class="menu-sheet__bar">
        <button type="button" data-close class="menu-sheet__toggle" aria-label="Close menu">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path class="menu-sheet__line menu-sheet__line--1" d="M2 12H22" />
            <path class="menu-sheet__line menu-sheet__line--2" d="M2 12H22" />
            <path class="menu-sheet__line menu-sheet__line--3" d="M2 12H22" />
          </svg>
        </button>
        <a href="index.html" class="menu-sheet__logo" aria-label="Percaal home">${logoMark(true, 26)}</a>
      </div>

      <div class="menu-sheet__shortcuts">
        <button type="button" data-open="lang" class="menu-sheet__currency" aria-label="Country and language">
          <span data-menu-currency>EGP</span>${ico("arrow-right-01-sharp", "ico-16")}
        </button>
        <span class="menu-sheet__rule" aria-hidden="true"></span>
        <button type="button" data-open="search" class="menu-sheet__icon" aria-label="Search">${ico("search", "ico-24")}</button>
        <span class="menu-sheet__rule" aria-hidden="true"></span>
        <a href="login.html" class="menu-sheet__icon" aria-label="Account">${ico("user", "ico-24")}</a>
        <span class="menu-sheet__rule" aria-hidden="true"></span>
        <a href="my-account-favorites.html" class="menu-sheet__icon" aria-label="Wishlist">${ico("favourite", "ico-24")}</a>
        <span class="menu-sheet__rule" aria-hidden="true"></span>
        <button type="button" data-open="cart" class="menu-sheet__icon hdr-bag" aria-label="Cart">
          ${ico("shopping-bag-03", "ico-24")}
          <span class="hdr-bag__count" data-cart-count>1</span>
        </button>
      </div>

      <nav class="menu-sheet__nav" aria-label="Shop">
        <ul class="menu-sheet__cats">${menuCategoryLinks}</ul>
        <ul class="menu-sheet__pages">${menuSecondaryLinks}</ul>
      </nav>
    </aside>

    <!-- Search — Figma 193:11401. A 592px drawer off the right edge on
         the offwhite paper: title, one field, then a three-up grid of
         results that scrolls on its own. Uses the same overlay
         plumbing as every other panel (data-open="search"). -->
    <div data-modal="search" class="side-drawer side-drawer--right search-drawer" role="dialog" aria-label="Search">
      <div class="search-drawer__head">
        <h2 class="search-drawer__title">Search</h2>
        <button type="button" class="search-drawer__close" data-close aria-label="Close search">
          ${ico("cancel-01", "ico-22")}
        </button>
      </div>
      <div class="search-drawer__body">
        <div class="search-drawer__field">
          <input type="search" data-search-input placeholder="Search sheets, duvet covers, towels…"
                 class="search-drawer__input" autocomplete="off" />
        </div>
        <div class="search-drawer__results" data-search-results></div>
      </div>
    </div>

    <!-- Store picker (checkout → "Pickup from store"). City → Area → the
         branches assigned to that area. Body is rendered by
         initCheckoutOptions(); this is just the shell. -->
    <div data-modal="storepicker" class="modal-shell">
      <div class="flex w-full max-w-[520px] max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-custom3" data-modal-box>
        <div class="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 class="font-semibold text-textSecondary text-lg">Choose a store</h2>
          <button type="button" data-close class="grid place-items-center w-8 h-8 rounded-full hover:bg-neutral-100 text-textSecondary">${ICON.close}</button>
        </div>
        <div class="flex shrink-0 flex-col gap-3 px-5 py-4 sm:flex-row">
          <label class="block flex-1">
            <span class="label">City</span>
            <select data-store-city class="placeholder-select mt-1 h-12 w-full rounded-lg border border-neutral-200 px-3 text-textSecondary"></select>
          </label>
          <label class="block flex-1">
            <span class="label">Area</span>
            <select data-store-area class="placeholder-select mt-1 h-12 w-full rounded-lg border border-neutral-200 px-3 text-textSecondary"></select>
          </label>
        </div>
        <div class="min-h-[120px] flex-1 overflow-y-auto px-5" data-store-list></div>
        <div class="shrink-0 border-t border-neutral-100 px-5 py-4">
          <button type="button" data-store-confirm class="btn btn--primary btn--md w-full justify-center">Choose Store</button>
        </div>
      </div>
    </div>

    <!-- Schedule picker (checkout → "Schedule for later"). Day chips across
         the top, that day's slots below, confirmed with a Schedule CTA. -->
    <div data-modal="schedule" class="modal-shell">
      <div class="flex w-full max-w-[560px] max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-custom3" data-modal-box>
        <div class="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 class="font-semibold text-textSecondary text-lg">Schedule a time</h2>
          <button type="button" data-close class="grid place-items-center w-8 h-8 rounded-full hover:bg-neutral-100 text-textSecondary">${ICON.close}</button>
        </div>
        <div class="shrink-0 border-b border-neutral-100 px-5 py-4">
          <div class="flex items-center gap-2">
            <button type="button" data-sched-prev class="sched-nav" aria-label="Earlier days">
              <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4"><path d="m15 6-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="no-scrollbar flex flex-1 gap-2 overflow-x-auto scroll-smooth" data-sched-days></div>
            <button type="button" data-sched-next class="sched-nav" aria-label="Later days">
              <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
        <div class="min-h-[140px] flex-1 overflow-y-auto px-5" data-sched-slots></div>
        <div class="shrink-0 border-t border-neutral-100 px-5 py-4">
          <button type="button" data-sched-confirm class="btn btn--primary btn--md w-full justify-center">Schedule</button>
        </div>
      </div>
    </div>

    <!-- Regional settings — the phone version of the header's regional
         panel (.regpop), built from the same pieces so the two match: a
         country field and the English / العربية tabs. Tapping the country
         slides the sheet over to a searchable country list; picking one
         slides back. Wired in initRegSheet(). -->
    <div data-modal="lang" class="bottom-sheet regsheet" role="dialog" aria-label="Regional settings">
      <div class="regsheet__track" data-regsheet-track>
        <section class="regsheet__view is-active" data-regsheet-view="main">
          <div class="regsheet__head">
            <h2 class="regsheet__title">Regional Settings</h2>
            <button type="button" data-close class="regsheet__icon" aria-label="Close">${ico("cancel-01", "ico-16")}</button>
          </div>
          <p class="regpop__label">Country</p>
          <button type="button" class="cselect__field regsheet__field" data-regsheet-go="countries" aria-label="Choose country">
            <img class="cselect__flag" data-regsheet-flag src="images/flag-eg.webp" alt="" width="17" height="13" />
            <span class="cselect__value" data-regsheet-country>Egypt</span>
            <span class="regsheet__code" data-regsheet-code>EGP</span>
            <span class="ico ico-16 regsheet__chev" aria-hidden="true">${ico("arrow-right-01-sharp", "ico-16")}</span>
          </button>
          <span class="regpop__rule" aria-hidden="true"></span>
          <p class="regpop__label">Language</p>
          <div class="regpop__tabs" role="tablist" aria-label="Language">
            <button type="button" class="regpop__tab" data-lang-tab="en" role="tab">English</button>
            <button type="button" class="regpop__tab" data-lang-tab="ar" role="tab" lang="ar">العربية</button>
          </div>
        </section>

        <section class="regsheet__view" data-regsheet-view="countries" aria-label="Choose country">
          <div class="regsheet__head">
            <button type="button" class="regsheet__icon" data-regsheet-go="main" aria-label="Back">${ico("arrow-left-01-sharp", "ico-16")}</button>
            <h2 class="regsheet__title">Choose Country</h2>
            <button type="button" data-close class="regsheet__icon" aria-label="Close">${ico("cancel-01", "ico-16")}</button>
          </div>
          <label class="regpop__search">
            ${ico("search", "ico-16")}
            <input type="search" data-regsheet-search placeholder="Search countries" autocomplete="off" aria-label="Search countries" />
          </label>
          <ul class="regpop__list regsheet__list" role="listbox" aria-label="Countries">
            ${CURRENCIES.map(
              (c) =>
                `<li role="option" tabindex="0" data-regsheet-pick="${c.code}" data-country-name="${c.label}" data-flag="${c.flag}">
                   <img src="${c.flag}" alt="" width="17" height="13" />
                   <span class="regpop__country">${c.label}</span>
                   <span class="regpop__code">${c.code}</span>
                 </li>`,
            ).join("")}
          </ul>
          <p class="regpop__empty" data-regsheet-empty hidden>No country matches that.</p>
        </section>
      </div>
    </div>

    <!-- Location bottom sheet -->
    <div data-sheet="location" class="bottom-sheet">
      <div class="mx-auto w-10 h-1 rounded-full bg-neutral-200 mb-4 md:hidden"></div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-textSecondary text-lg">Choose Your Location</h2>
        <button type="button" data-close class="grid place-items-center w-8 h-8 rounded-full hover:bg-neutral-100 text-textSecondary">${ICON.close}</button>
      </div>
      <p class="loc-gate-only text-xs text-textSecondary leading-[150%] -mt-2 mb-4">Stock differs by branch — pick your area and we'll only show what we can actually deliver to you.</p>
      <form data-location-form class="flex flex-col gap-3">
        <label class="block">
          <span class="label">City</span>
          <select class="placeholder-select w-full border border-neutral-200 rounded-lg px-3 h-12 mt-1 text-textSecondary">
            <option>Cairo</option><option>Giza</option><option>Alexandria</option>
          </select>
        </label>
        <label class="block">
          <span class="label">Area</span>
          <select class="placeholder-select w-full border border-neutral-200 rounded-lg px-3 h-12 mt-1 text-textSecondary">
            <option>New Cairo</option><option>Nasr City</option><option>Maadi</option><option>Zamalek</option>
          </select>
        </label>
        <label class="block">
          <span class="label">District</span>
          <select class="placeholder-select w-full border border-neutral-200 rounded-lg px-3 h-12 mt-1 text-textSecondary">
            <option>First District</option><option>Second District</option><option>Third District</option><option>Fourth District</option>
          </select>
        </label>
        <button type="submit" class="btn btn--primary btn--md mt-2 w-full justify-center">Confirm Location</button>
      </form>
    </div>

    <!-- Review bottom sheet — opened only by the gated "Leave a review" button on product pages -->
    <div data-sheet="review" class="bottom-sheet">
      <div class="mx-auto w-10 h-1 rounded-full bg-neutral-200 mb-4 md:hidden"></div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-textSecondary text-lg">Write a Review</h2>
        <button type="button" data-close class="grid place-items-center w-8 h-8 rounded-full hover:bg-neutral-100 text-textSecondary">${ICON.close}</button>
      </div>
      <form data-review-form class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <span class="label">Your rating</span>
          <div class="flex items-center gap-1" data-review-stars>
            ${[1, 2, 3, 4, 5]
              .map(
                (n) =>
                  `<button type="button" data-review-star="${n}" aria-label="${n} star${n > 1 ? "s" : ""}" class="review-star text-gray-300 hover:text-cta transition-colors"><svg viewBox="0 0 24 24" class="w-7 h-7 fill-current"><path d="M12 2l2.9 6.26L21.6 9.27l-4.8 4.68 1.13 6.6L12 17.77l-5.93 3.12 1.13-6.6-4.8-4.68 6.7-1.01L12 2z"/></svg></button>`,
              )
              .join("")}
          </div>
        </div>
        <label class="flex flex-col gap-1.5">
          <span class="label">Your review</span>
          <textarea rows="4" required placeholder="Tell others what you loved about it…" class="w-full text-sm text-textSecondary outline-none bg-white border border-neutral-200 rounded-lg p-3 resize-none placeholder:text-customGrayMedium"></textarea>
        </label>
        <button type="submit" class="btn btn--primary btn--md w-full justify-center">Submit Review</button>
      </form>
    </div>

    <!-- No floating cart.
         The base template pinned a cart button under the category rail so it
         followed you down a long menu. Percaal's header is sticky and already
         carries the bag, so a second one is a duplicate control that also
         happens to be the only floating object on an otherwise flat page.
         visibleCart() falls back to whichever [data-open="cart"] is on
         screen, so the add-to-bag animation still has a target. -->`;
  }

  /* ---------------------------------------------------------------
     Overlay open/close plumbing
     --------------------------------------------------------------- */
  const openMap = {
    cart: '[data-drawer="cart"]',
    menu: '[data-drawer="menu"]',
    search: '[data-modal="search"]',
    location: '[data-sheet="location"]',
    review: '[data-sheet="review"]',
    lang: '[data-modal="lang"]',
    storepicker: '[data-modal="storepicker"]',
    schedule: '[data-modal="schedule"]',
    voucher: '[data-modal="voucher"]',
    redeem: '[data-modal="redeem"]',
    "voucher-add": '[data-modal="voucher-add"]',
    "voucher-apply": '[data-modal="voucher-apply"]',
    address: '[data-modal="address"]',
  };
  let openEl = null;

  /* The menu sheet opens from the header row: its top edge sits on that
     row's top edge, and its toggle and logo take the exact positions of
     the header's menu icon and logo. Measured on each open, so it holds
     with or without the announcement bar, at any width, and when the
     page has been scrolled a little. */
  function placeMenuSheet(burger) {
    const sheet = document.querySelector('[data-drawer="menu"]');
    const row = burger && burger.closest(".hdr-mobile__row");
    if (!sheet || !row) return;
    const r = row.getBoundingClientRect();
    const top = Math.max(0, r.top);
    const b = burger.getBoundingClientRect();
    const logo = row.querySelector(".hdr-mobile__logo");
    const l = logo ? logo.getBoundingClientRect() : null;
    const set = (k, v) => sheet.style.setProperty(k, Math.round(v) + "px");
    set("--sheet-top", top);
    set("--bar-h", r.bottom - top);
    set("--tog-x", b.left);
    set("--tog-y", b.top - top);
    set("--tog-s", b.width);
    if (l) {
      set("--logo-x", l.left);
      set("--logo-y", l.top - top);
    }
  }

  function openOverlay(key) {
    const sel = openMap[key];
    if (!sel) return;
    const el = document.querySelector(sel);
    const backdrop = document.querySelector("[data-backdrop]");
    if (!el) return;
    openEl = el;
    el.classList.add("is-open");
    if (backdrop) backdrop.classList.add("is-open");
    document.body.classList.add("no-scroll");
    const input = el.querySelector("[data-search-input]");
    if (input) setTimeout(() => input.focus(), 80);
  }

  function closeOverlay() {
    document
      .querySelectorAll(".side-drawer.is-open, .modal-shell.is-open, .bottom-sheet.is-open")
      .forEach((el) => el.classList.remove("is-open"));
    const backdrop = document.querySelector("[data-backdrop]");
    if (backdrop) backdrop.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    openEl = null;
    /* Any close path out of the first-visit gate (backdrop, Esc, X, "not
       now") counts as "didn't choose" → fall back to the default area. A
       confirmed pick calls commitLocation() first, which clears the gate
       flag, so this can't overwrite a real choice. */
    dismissLocationGate();
  }

  /* ---------------------------------------------------------------
     Delivery location — the catalogue is inventory-scoped per area, so
     the first visit must resolve to *some* area before browsing. The
     picker opens over a dimmed page; dismissing it silently accepts
     DEFAULT_LOCATION. The pick is remembered so the gate is one-time.
     --------------------------------------------------------------- */
  const LOCATION_KEY = "percaal-location";
  const DEFAULT_LOCATION = "Maadi, Cairo";

  function storedLocation() {
    try {
      return localStorage.getItem(LOCATION_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function paintLocation(place) {
    document
      .querySelectorAll("[data-loc-place]")
      .forEach((el) => (el.textContent = place));
  }

  /* Persist + reflect a resolved area, and drop the gate. */
  function commitLocation(place) {
    document.body.classList.remove("loc-gate");
    try {
      localStorage.setItem(LOCATION_KEY, place);
    } catch (e) {
      /* private mode — the pick just won't survive a reload */
    }
    paintLocation(place);
  }

  /* Close the gate without a choice → default area. No-op otherwise. */
  function dismissLocationGate() {
    if (!document.body.classList.contains("loc-gate")) return;
    document
      .querySelectorAll("[data-locmenu].is-open")
      .forEach((w) => w.classList.remove("is-open"));
    const backdrop = document.querySelector("[data-backdrop]");
    if (backdrop) backdrop.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    commitLocation(DEFAULT_LOCATION);
  }

  function initLocationGate() {
    /* Review affordance: ?loc=1 replays the first-visit gate on a browser
       that has already answered it. Without this, re-checking the flow
       means hand-clearing localStorage every time. */
    const force = /[?&]loc=1\b/.test(window.location.search);
    if (force) {
      try {
        localStorage.removeItem(LOCATION_KEY);
      } catch (e) {}
    }
    const saved = force ? "" : storedLocation();
    if (saved) {
      paintLocation(saved);
      return;
    }
    paintLocation(DEFAULT_LOCATION);
    // Checkout runs the minimal header — no location control to anchor to.
    if (document.body.dataset.page === "checkout") return;

    /* Let the page paint first: the gate reads as a deliberate prompt
       rather than a flash of chrome during load. */
    setTimeout(() => {
      document.body.classList.add("loc-gate");
      const wrap = document.querySelector("[data-locmenu]");
      if (wrap && window.matchMedia("(min-width: 768px)").matches) {
        wrap.classList.add("is-open");
        const backdrop = document.querySelector("[data-backdrop]");
        if (backdrop) backdrop.classList.add("is-open");
        document.body.classList.add("no-scroll");
      } else {
        openOverlay("location"); // mobile: the bottom sheet, already above the backdrop
      }
    }, 400);
  }

  /* ---------------------------------------------------------------
     Fly-to-cart — a liquid pink dot arcs from the add button into the
     visible cart button, then the cart badge bumps. Replaces the toast.
     --------------------------------------------------------------- */
  function visibleCart() {
    const fc = document.querySelector("[data-floating-cart]");
    if (fc && fc.classList.contains("is-visible")) return fc;
    const carts = [...document.querySelectorAll('[data-open="cart"]')];
    const onScreen = carts.find((c) => {
      const r = c.getBoundingClientRect();
      return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
    });
    return onScreen || fc || carts[0] || null;
  }

  /* Cart feedback — no more flying dot. On any add we just bounce the
     visible cart icon and (optionally) open the summary drawer, which
     gives an unambiguous "this landed in the cart" signal without the
     animated projectile. `srcRect` is kept in the signature so existing
     call sites still work. */
  function flyToCart(_srcRect, onArrive) {
    const cart = visibleCart();
    if (cart) {
      cart.classList.remove("cart-bump");
      void cart.offsetWidth; // restart animation
      cart.classList.add("cart-bump");
    }
    if (onArrive) onArrive();
  }

  /* ---------------------------------------------------------------
     Carousel (Swiper replacement)
     --------------------------------------------------------------- */
  function initCarousel(root) {
    const track = root.querySelector(".carousel-track");
    if (!track) return;
    const prev = root.querySelector(".carousel-prev");
    const next = root.querySelector(".carousel-next");
    const dotsWrap = root.querySelector(".carousel-dots");
    const loop = root.hasAttribute("data-loop");
    const maxScroll = () => track.scrollWidth - track.clientWidth - 1;

    function slideStep() {
      const first = track.querySelector(".carousel-slide");
      if (!first) return track.clientWidth;
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || "16") || 16;
      return first.getBoundingClientRect().width + gap;
    }

    const fadeStart = root.querySelector('[data-fade="start"]');
    const fadeEnd = root.querySelector('[data-fade="end"]');
    const alignArrows = root.hasAttribute("data-align-arrows");

    // Center the prev/next arrows on the product IMAGE (top square), not the
    // full card height which also includes price + title below the image.
    function positionArrows() {
      if (!alignArrows || (!prev && !next)) return;
      const slide = track.querySelector(".carousel-slide");
      const imgBox = slide && (slide.querySelector(".aspect-square") || slide.querySelector("img"));
      if (!imgBox) return;
      const rr = root.getBoundingClientRect();
      const ir = imgBox.getBoundingClientRect();
      const top = Math.round(ir.top - rr.top + ir.height / 2) + "px";
      if (prev) prev.style.top = top;
      if (next) next.style.top = top;
    }

    function update() {
      const max = maxScroll();
      // A looping carousel never disables its arrows.
      if (prev) prev.classList.toggle("is-disabled", !loop && track.scrollLeft <= 1);
      if (next) next.classList.toggle("is-disabled", !loop && track.scrollLeft >= max);
      // Edge fades hint at more products: show on a side only when it overflows.
      const pos = Math.abs(track.scrollLeft);
      if (fadeStart) fadeStart.style.opacity = pos > 2 ? "1" : "0";
      if (fadeEnd) fadeEnd.style.opacity = max > 0 && pos < max - 2 ? "1" : "0";
      if (dotsWrap) {
        const dots = dotsWrap.querySelectorAll(".carousel-dot");
        const idx = Math.round(track.scrollLeft / slideStep());
        dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
      }
    }

    if (prev)
      prev.addEventListener("click", () => {
        if (loop && track.scrollLeft <= 1) track.scrollLeft = maxScroll() + 2;
        else track.scrollLeft -= slideStep();
      });
    if (next)
      next.addEventListener("click", () => {
        if (loop && track.scrollLeft >= maxScroll()) track.scrollLeft = 0;
        else track.scrollLeft += slideStep();
      });

    if (dotsWrap) {
      const slides = track.querySelectorAll(".carousel-slide");
      const perView = Math.max(1, Math.round(track.clientWidth / slideStep()));
      const pages = Math.max(1, slides.length - perView + 1);
      dotsWrap.innerHTML = "";
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
        dot.addEventListener("click", () => (track.scrollLeft = i * slideStep()));
        dotsWrap.appendChild(dot);
      }
    }

    track.addEventListener("scroll", () => window.requestAnimationFrame(update));
    window.addEventListener("resize", () => {
      update();
      positionArrows();
    });
    update();
    positionArrows();
    // Re-align once product images settle, in case layout shifts on load.
    window.addEventListener("load", positionArrows);

    if (root.hasAttribute("data-autoplay")) {
      setInterval(() => {
        const max = track.scrollWidth - track.clientWidth - 1;
        if (track.scrollLeft >= max) track.scrollLeft = 0;
        else track.scrollLeft += slideStep();
      }, 4500);
    }
  }

  /* ---------------------------------------------------------------
     Accordion / tabs / steppers / forms
     --------------------------------------------------------------- */
  function initAccordions(scope) {
    scope.querySelectorAll("[data-accordion]").forEach((acc) => {
      acc.querySelectorAll(".accordion-item").forEach((item) => {
        const btn = item.querySelector(".accordion-trigger");
        if (!btn) return;
        btn.addEventListener("click", () => {
          const isOpen = item.classList.contains("is-open");
          if (!acc.hasAttribute("data-accordion-multi")) {
            acc
              .querySelectorAll(".accordion-item.is-open")
              .forEach((o) => o.classList.remove("is-open"));
          }
          item.classList.toggle("is-open", !isOpen);
        });
      });
    });
  }

  function initTabs(scope) {
    scope.querySelectorAll("[data-tabs]").forEach((tabs) => {
      const btns = tabs.querySelectorAll(".tab-btn");
      const panels = tabs.querySelectorAll(".tab-panel");
      btns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const target = btn.getAttribute("data-tab");
          btns.forEach((b) =>
            b.classList.toggle("is-active", b === btn),
          );
          panels.forEach((p) =>
            p.toggleAttribute("hidden", p.getAttribute("data-panel") !== target),
          );
        });
      });
    });
  }

  function initSegmented(scope) {
    scope.querySelectorAll("[data-segmented]").forEach((seg) => {
      const thumb = seg.querySelector(".segmented__thumb");
      if (!thumb || seg.dataset.segReady) return;
      seg.dataset.segReady = "1";
      /* Direct-child buttons, not .tab-btn — the FAQ tabs and the media-center
         filters use their own class names but are the same control. */
      const btns = seg.querySelectorAll(":scope > button");
      const activeBtn = () => seg.querySelector(":scope > button.is-active") || btns[0];
      const place = (btn, animate) => {
        if (!btn) return;
        if (!animate) seg.classList.add("is-init");
        thumb.style.width = btn.offsetWidth + "px";
        thumb.style.transform = "translateX(" + btn.offsetLeft + "px)";
        seg.classList.add("is-ready");
        if (!animate) {
          void thumb.offsetWidth; /* reflow so the next click animates */
          seg.classList.remove("is-init");
        }
      };
      btns.forEach((b) => b.addEventListener("click", () => place(b, true)));
      place(activeBtn(), false);
      let raf;
      window.addEventListener("resize", () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => place(activeBtn(), false));
      });
    });
  }

  /* Gooey product tabs — slides the grey-05 "thumb" to the active tab
     (it liquid-merges into the panel via #goo-tabs) and swaps the crisp
     content panel with a blur/slide-in. Vanilla port of the shadcn goo
     tabs; markup = [data-goo-tabs] > [data-goo-thumb] + [data-goo-tab] +
     [data-goo-content]. */
  function initGooTabs(scope) {
    scope.querySelectorAll("[data-goo-tabs]").forEach((root) => {
      if (root.dataset.gooReady) return;
      root.dataset.gooReady = "1";
      const thumb = root.querySelector("[data-goo-thumb]");
      const tabs = [...root.querySelectorAll("[data-goo-tab]")];
      const panels = [...root.querySelectorAll("[data-goo-content]")];
      if (!thumb || !tabs.length) return;
      const place = (btn, animate) => {
        if (!btn) return;
        if (!animate) thumb.style.transition = "none";
        thumb.style.width = btn.offsetWidth + "px";
        thumb.style.transform = "translateX(" + btn.offsetLeft + "px)";
        if (!animate) {
          void thumb.offsetWidth; /* reflow so the next slide animates */
          thumb.style.transition = "";
        }
      };
      const activate = (key, animate) => {
        const btn =
          tabs.find((t) => t.getAttribute("data-goo-tab") === key) || tabs[0];
        tabs.forEach((t) => t.classList.toggle("is-active", t === btn));
        place(btn, animate);
        panels.forEach((p) => {
          const on = p.getAttribute("data-goo-content") === key;
          p.toggleAttribute("hidden", !on);
          if (on && animate) {
            p.style.animation = "none";
            void p.offsetWidth; /* replay the blur/slide-in */
            p.style.animation = "";
          }
        });
      };
      tabs.forEach((t) =>
        t.addEventListener("click", () =>
          activate(t.getAttribute("data-goo-tab"), true),
        ),
      );
      const initKey = (
        root.querySelector("[data-goo-tab].is-active") || tabs[0]
      ).getAttribute("data-goo-tab");
      activate(initKey, false);
      const reposition = () =>
        place(root.querySelector("[data-goo-tab].is-active") || tabs[0], false);
      let raf;
      window.addEventListener("resize", () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(reposition);
      });
      // Re-measure once the web font has loaded (tab widths shift otherwise).
      window.addEventListener("load", reposition);
      setTimeout(reposition, 300);
      if (document.fonts && document.fonts.ready)
        document.fonts.ready.then(reposition);
    });
  }

  /* Decrement-button glyphs for removable counters (cart / cart summary):
     qty 1 shows a trash (remove) icon, qty ≥ 2 shows a minus. */
  const STEP_ICON_MINUS =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const STEP_ICON_TRASH =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------------------------------------------------------------
     Delivery note — THE single delivery/ETA bar for the whole site.
     Rendered from here so editing this one function (or .delivery-note
     in styles.css) updates every page at once. Never hand-write the
     markup again; drop a placeholder instead:

       <div data-delivery-note></div>
       <div data-delivery-note data-lead="Delivery within 1 hour"
            data-place="New Cairo, 5th Settlement" data-edit="false"></div>

     data-lead  → lead text        (default "Order now")
     data-place → location         (default DELIVERY_PLACE)
     data-edit  → "false" hides the Edit button (default: shown)
     Classes on the placeholder are KEPT, so pages can still pass layout
     utilities (mt-4, etc.); .delivery-note is added to it.
     --------------------------------------------------------------- */
  const DELIVERY_PLACE = "Maadi, Cairo";
  function deliveryNoteHTML(o) {
    o = o || {};
    const lead = o.lead || "Order now";
    const place = o.place || DELIVERY_PLACE;
    const edit = o.edit !== false;
    return `
      <span class="delivery-note__main">
        <span class="delivery-note__icon"><img src="icons/scooter-02.svg" alt="" /></span>
        <span class="delivery-note__text">${esc(lead)} | <span class="delivery-note__place">${esc(place)}</span></span>
      </span>
      ${edit ? `<button type="button" data-open="location" class="btn btn--secondary btn--sm shrink-0">Edit</button>` : ""}`;
  }
  function initDeliveryNote(scope) {
    scope.querySelectorAll("[data-delivery-note]").forEach((el) => {
      if (el.dataset.dnReady) return;
      el.dataset.dnReady = "1";
      el.classList.add("delivery-note");
      el.innerHTML = deliveryNoteHTML({
        lead: el.dataset.lead,
        place: el.dataset.place,
        edit: el.dataset.edit !== "false",
      });
    });
  }

  /* ---------------------------------------------------------------
     Product callouts — the trust badges under the PDP price
     (Delivery / Egyptian cotton / Woven in Egypt). This is
     the PDP's replacement for the single .delivery-note bar; cart
     and checkout still use .delivery-note. Drop a placeholder:

       <div data-pdp-callouts></div>
       <div data-pdp-callouts data-place="New Cairo" data-eta="90 mins"></div>

     data-place → delivery location (default DELIVERY_PLACE)
     data-eta   → delivery window   (default DELIVERY_ETA)
     Classes on the placeholder are KEPT; .pdp-callouts is added.
     --------------------------------------------------------------- */
  const DELIVERY_ETA = "2–4 working days"; // linens ship, they do not arrive hot
  /* action → optional trailing control (e.g. the Edit button), rendered as
     its own flex child so CSS can pin it to the end of the box instead of
     running it inline after the subtitle text. */
  /* `icon` is a full path (not a bare name) so callers can mix the line
     icon set with anything else without this helper having to know where
     each family of icons lives. */
  function calloutHTML(variant, icon, title, sub, action) {
    return `
      <div class="callout callout--${variant}">
        <span class="callout__icon"><img src="${icon}" alt="" /></span>
        <span class="callout__body">
          <span class="callout__title">${title}</span>
          <span class="callout__sub">${sub}</span>
        </span>
        ${action ? `<span class="callout__action">${action}</span>` : ""}
      </div>`;
  }
  /* The shipping callout on its own — shared by the PDP's three-badge set
     and by any page that wants just this one (cart summary uses it in
     place of the older .delivery-note bar). Defined once so the copy,
     icon and Edit affordance can't drift between the two. */
  function deliveryCalloutHTML(o) {
    o = o || {};
    const place = o.place || DELIVERY_PLACE;
    const eta = o.eta || DELIVERY_ETA;
    // edit:false drops the trailing Edit control (cart page — the location
    // is edited at checkout, so an Edit here led nowhere useful).
    const edit = o.edit !== false;
    return calloutHTML(
      "delivery",
      "icons/scooter-02.svg",
      "Delivery",
      `${esc(eta)} to ${esc(place)} · free over EGP 2,500`,
      edit ? `<button type="button" data-open="location" class="callout__edit">Edit</button>` : ""
    );
  }
  function pdpCalloutsHTML(o) {
    /* Delivery first: it carries the longest copy (location + Edit) and takes
       the full-width top row, with the other two splitting the row below. */
    return [
      deliveryCalloutHTML(o),
      calloutHTML("baked", "icons/invoice-01.svg", "Egyptian Cotton", "Long-staple, grown and spun in Egypt"),
      calloutHTML("natural", "icons/location-10.svg", "Woven in Egypt", "Made and finished in our own mill"),
    ].join("");
  }
  function initPdpCallouts(scope) {
    scope.querySelectorAll("[data-pdp-callouts]").forEach((el) => {
      if (el.dataset.pcReady) return;
      el.dataset.pcReady = "1";
      el.classList.add("pdp-callouts");
      el.innerHTML = pdpCalloutsHTML({ place: el.dataset.place, eta: el.dataset.eta });
    });
  }
  /* Standalone shipping callout: <div data-shipping-callout></div>
     Reuses the .pdp-callouts wrapper so it inherits the same spacing, and
     .callout--delivery spans the full width when it's the only child. */
  function initShippingCallout(scope) {
    scope.querySelectorAll("[data-shipping-callout]").forEach((el) => {
      if (el.dataset.scReady) return;
      el.dataset.scReady = "1";
      el.classList.add("pdp-callouts");
      el.innerHTML = deliveryCalloutHTML({
        place: el.dataset.place,
        eta: el.dataset.eta,
        edit: el.dataset.edit !== "false",
      });
    });
  }

  /* ---------------------------------------------------------------
     Promo code — one field, "Apply" as an inline link, and a confetti
     celebration on success (modelled on the reference clip). Demo-only
     codes; a real build would validate server-side.
     --------------------------------------------------------------- */
  /* Keep PERCAAL10 in step with the header announcement bar — the bar
     advertises it, so an invalid-code error naming a DIFFERENT code is the
     fastest way to lose a customer's trust at checkout. */
  const PROMO_CODES = {
    PERCAAL10: { type: "percent", value: 10 },
    LINEN250: { type: "amount", value: 250 },
    FIRSTNIGHT: { type: "percent", value: 15 },
  };
  /* Confetti colours — Percaal analogues of the reference clip's three
     saturated hues (green / coral / periwinkle). Kept saturated on purpose:
     the pale end of the brand palette (#9FDBD9, #EDE7DE, #47B5B2) all but
     disappears against the white cart/checkout page. */
  const FX_COLORS = ["#1E7F4F", "#2F918E", "#47B5B2"];
  const PROMO_ICON_CHECK =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const PROMO_ICON_X =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  const egp = (n) => "EGP " + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const parseEGP = (s) => Number(String(s).replace(/[^\d.]/g, "")) || 0;

  /* PROMO PAPER CELEBRATION — matched to the reference clip Mark supplied
     (~/Downloads/original-…mp4, frames studied at 3.5–5.2s). The reference is
     deliberately SPARSE and calm: only a handful of pieces on screen at once,
     mostly thick wavy S-ribbons with round caps, plus the odd tumbling square
     and hollow ring, drifting slowly out and down from the field. No trails —
     the pieces are clean-edged. Keep it restrained: a dense spray of little
     rectangles is NOT what the reference does.
     Plain canvas 2D; self-removes. */
  const PAPER_COUNT = 13;
  // Ribbon-heavy mix, matching the reference's shape ratio.
  const PAPER_SHAPES = ["ribbon", "ribbon", "ribbon", "square", "ribbon", "ring"];
  /* opts lets a caller retune the burst for a different context WITHOUT
     touching the promo defaults above (those are matched to Mark's
     reference clip and should stay put):
       count / spread / speed / speedVar / scale / decay — burst shape
       className — extra class, e.g. to lift the canvas above an overlay */
  /* Exposed so pages can fire the brand confetti themselves (thank-you
     celebration). Same helper the promo-code success uses, so every
     celebratory moment on the site shares one look. */
  function promoPaperBurst(x, y, opts) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    opts = opts || {};
    const count = opts.count || PAPER_COUNT;
    const spread = opts.spread != null ? opts.spread : 190;
    const speedMin = opts.speed != null ? opts.speed : 2.3;
    const speedVar = opts.speedVar != null ? opts.speedVar : 2.5;
    const scale = opts.scale || 1;
    const canvas = document.createElement("canvas");
    canvas.className = "promo-fx" + (opts.className ? " " + opts.className : "");
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    const papers = Array.from({ length: count }, (_, i) => {
      // Start across the actual field, then drift up and out in a slow arc.
      const launchX = x + (Math.random() - 0.5) * spread;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      const speed = speedMin + Math.random() * speedVar; // slow — the reference floats
      return {
        x: launchX,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.7,
        shape: PAPER_SHAPES[i % PAPER_SHAPES.length],
        // Sized off the reference: a ribbon reads ~15% of the field's width
        // there. At 32–58px they came out about half that and looked timid.
        len: (44 + Math.random() * 30) * scale,
        amp: (9 + Math.random() * 7) * scale, // ribbon wave depth
        s: (7 + Math.random() * 3) * scale, // square / ring size
        lw: (5 + Math.random() * 1.8) * scale, // ribbon stroke weight
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.05, // slow tumble, not a flutter
        color: FX_COLORS[i % FX_COLORS.length],
        life: 1,
        decay: opts.decay || 0.0045 + Math.random() * 0.003, // ~2.5–3.7s on screen
      };
    });

    let raf;
    let frame = 0;
    const destroy = () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
      window.removeEventListener("resize", size);
      canvas.remove();
    };
    // rAF stalls while the tab is hidden, which would strand the canvas
    // over the page until the user returns. Hard-stop regardless.
    const safety = setTimeout(destroy, 9000);

    const tick = () => {
      frame++;
      // Clear outright — the reference's pieces are clean-edged, no trails.
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      let alive = 0;
      papers.forEach((paper) => {
        if (paper.life <= 0) return;
        alive++;
        paper.vy += 0.045; // light gravity — the pieces hang, then settle
        paper.vx *= 0.99;
        paper.vy *= 0.99;
        paper.x += paper.vx;
        paper.y += paper.vy;
        paper.rotation += paper.spin;
        paper.life -= paper.decay;

        ctx.save();
        ctx.translate(paper.x, paper.y);
        ctx.rotate(paper.rotation);
        ctx.globalAlpha = Math.max(0, Math.min(1, paper.life));
        ctx.fillStyle = paper.color;
        ctx.strokeStyle = paper.color;
        ctx.lineCap = "round";

        if (paper.shape === "ribbon") {
          // Thick wavy S — the reference's signature piece.
          ctx.lineWidth = paper.lw;
          ctx.beginPath();
          ctx.moveTo(0, -paper.len / 2);
          ctx.bezierCurveTo(paper.amp, -paper.len / 6, -paper.amp, paper.len / 6, 0, paper.len / 2);
          ctx.stroke();
        } else if (paper.shape === "ring") {
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(0, 0, paper.s / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillRect(-paper.s / 2, -paper.s / 2, paper.s, paper.s);
        }
        ctx.restore();
      });

      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(tick);
      else destroy();
    };
    window.addEventListener("resize", size);
    raf = requestAnimationFrame(tick);
  }

  /* The discount currently applied, remembered so the cart DRAWER can
     re-apply it whenever its subtotal is recomputed (quantity change,
     row removal) rather than losing it. */
  let promoDiscount = 0;

  /* Drawer totals. Discount + Total stay hidden until a code is applied,
     so the drawer is just "Subtotal" in the normal case. */
  /* A code applied in the cart drawer keeps its RULE, not a fixed amount,
     so a percentage stays right when quantities change afterwards. */
  let drawerPromoRule = null;
  function drawerSubtotal() {
    const drawer = document.querySelector('[data-drawer="cart"]');
    let sum = 0;
    if (drawer)
      drawer.querySelectorAll("[data-cart-row]").forEach((row) => {
        const qtyEl = row.querySelector("[data-qty]");
        sum += (parseFloat(row.dataset.unitPrice) || 0) * (qtyEl ? parseInt(qtyEl.textContent, 10) || 0 : 0);
      });
    return sum;
  }
  const promoAmount = (rule, base) =>
    rule.type === "percent" ? Math.round(base * rule.value) / 100 : Math.min(rule.value, base);
  const promoDesc = (rule, amount) =>
    rule.type === "percent" ? rule.value + "% discount (−" + egp(amount) + ")" : egp(amount) + " off your order";

  function syncCartDrawerTotals() {
    const drawer = document.querySelector('[data-drawer="cart"]');
    if (!drawer) return;
    /* The drawer's own promo: recompute the saving from today's subtotal,
       refresh its line, and show the discounted total on CHECKOUT. */
    const sub = drawerSubtotal();
    const saving = drawerPromoRule ? promoAmount(drawerPromoRule, sub) : 0;
    if (drawerPromoRule) {
      promoDiscount = saving;
      const desc = drawer.querySelector("[data-promo] [data-promo-desc]");
      if (desc) desc.textContent = promoDesc(drawerPromoRule, saving);
    }
    drawer.querySelectorAll("[data-cart-grand]").forEach((el) => {
      el.textContent = egp(Math.max(0, sub - saving));
    });
    const subEl = drawer.querySelector("[data-cart-subtotal]");
    const dRow = drawer.querySelector("[data-cart-discount-row]");
    const dEl = drawer.querySelector("[data-cart-discount]");
    const tRow = drawer.querySelector("[data-cart-total-row]");
    const tEl = drawer.querySelector("[data-cart-total]");
    if (!subEl || !dRow || !tRow) return;
    const show = promoDiscount > 0;
    dRow.hidden = !show;
    tRow.hidden = !show;
    if (show) {
      const sub = parseEGP(subEl.textContent);
      if (dEl) dEl.textContent = "− " + egp(promoDiscount);
      if (tEl) tEl.textContent = egp(Math.max(0, sub - promoDiscount));
    }
  }

  /* THE one source of truth for the page order summary. Promo code and
     wallet balance are two deductions against the SAME total, so neither
     may own a private copy of the arithmetic — each sets its own module
     state and then calls this to recompute every row. No-ops on any page
     without a summary. */
  let walletApplied = 0;
  function syncSummary() {
    const totalEl = document.querySelector("[data-summary-total]");
    const subtotalEl = document.querySelector("[data-summary-subtotal]");
    if (!totalEl || !subtotalEl) return null;
    const deliveryEl = document.querySelector("[data-summary-delivery]");
    const subtotal = parseEGP(subtotalEl.textContent);
    const delivery = deliveryEl ? parseEGP(deliveryEl.textContent) : 0;
    // Write the inputs back in the same format as the total they sum to,
    // so the block never mixes "12,000 EGP" with "EGP 12,100.00".
    subtotalEl.textContent = egp(subtotal);
    if (deliveryEl) deliveryEl.textContent = delivery ? egp(delivery) : "Free";

    const discountRow = document.querySelector("[data-summary-discount-row]");
    const discountEl = document.querySelector("[data-summary-discount]");
    if (discountRow) discountRow.hidden = promoDiscount <= 0;
    if (discountEl) discountEl.textContent = "− " + egp(promoDiscount);

    /* The wallet spends against what is still owed AFTER the promo, and
       is capped at the bill — so a balance larger than the order can
       never drive the total negative or "refund" the difference. */
    const afterPromo = Math.max(0, subtotal + delivery - promoDiscount);
    const walletUsed = Math.min(walletApplied, afterPromo);
    const walletRow = document.querySelector("[data-summary-wallet-row]");
    const walletEl = document.querySelector("[data-summary-wallet]");
    if (walletRow) walletRow.hidden = walletUsed <= 0;
    if (walletEl) walletEl.textContent = "− " + egp(walletUsed);

    const total = egp(Math.max(0, afterPromo - walletUsed));
    totalEl.textContent = total;
    // The cart page repeats the total on its CHECKOUT button.
    document.querySelectorAll("[data-summary-total-cta]").forEach((el) => { el.textContent = total; });
    return { afterPromo, walletUsed };
  }

  /* Reflect the applied/removed discount in the page's order summary. */
  function promoSyncSummary(discount) {
    promoDiscount = discount || 0;
    syncCartDrawerTotals(); // drawer exists on every page; page summary may not
    syncSummary();
  }

  /* ---------------------------------------------------------------
     Free-shipping banner — cart drawer only. Sits as its own shrink-0
     strip directly ABOVE the footer (not below the header), so it stays
     next to the checkout CTA it's motivating rather than scrolling away
     with the line items.

     Matched to the Figma pair (Frame 2147227129 / 2147227130): BOTH
     states share the same pink card and only the copy changes —
     "Add {n} EGP and get [FREE DELIVERY]" while short, "[WOW] You
     Unlocked FREE DELIVERY" once reached. The progress bar is not a
     separate widget: it IS the bottom divider between the pink card and
     the white footer below, so the fill doubles as the seam. Turquoise =
     covered, light pink (cta-light) = still to go, so the empty space
     stays inside the pink family instead of reading as a dark rule; at
     100% the seam reads as one solid turquoise rule. Keeping the pink
     card square-cornered lets it sit flush against the footer, and the
     strip is kept short (py-1.5) so it nudges without shouting over the
     checkout CTA below it. Keeping the pink constant means the footer never
     jumps or colour-flashes when the threshold flips — only the bar and
     the words change. Reuses promoPaperBurst() for the celebration so
     cart and promo-code success feel like the same brand moment. */
  const FREE_SHIP_THRESHOLD = 5000; // must match the header announcement bar ("above 5,000 EGP")
  const SHIPPING_FEE = 100; // below the threshold
  function freeShippingHTML(subtotal) {
    const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
    const pct = Math.min(100, Math.round((subtotal / FREE_SHIP_THRESHOLD) * 100));
    const unlocked = remaining <= 0;
    const chip = (text) =>
      `<span class="inline-flex shrink-0 items-center rounded bg-primary-100 px-1.5 py-[3px]"><span class="text-[10px] font-bold text-primaryDark leading-none tracking-[0.2px]">${text}</span></span>`;
    const label = unlocked
      ? `${chip("WOW")}<span class="text-[11px] font-medium text-white leading-none">You Unlocked <span class="font-bold">FREE DELIVERY</span></span>`
      : `<span class="text-[11px] font-medium text-white leading-none">Add <span data-fs-remaining>${Math.ceil(remaining)} EGP</span> and get</span>${chip("FREE DELIVERY")}`;
    return `
      <div class="bg-cta" data-fs-state="${unlocked ? "unlocked" : "progress"}">
        <div class="flex items-center gap-1.5 px-4 py-1.5">${label}</div>
        <div class="h-[5px] w-full bg-cta-light"><div class="h-full bg-primary-200 transition-[width] duration-500 ease-out" style="width:${unlocked ? 100 : pct}%"></div></div>
      </div>`;
  }
  /* Recomputed from the actual cart-row prices/quantities (not the
     cross-sell grid — nothing on this site persists a real "add to
     cart", including the grid's own quick-add, so counting it would
     move the bar without a line item ever appearing above it). Hidden
     entirely once the cart is empty — there's nothing to show progress
     toward. */
  function updateFreeShipping() {
    const drawer = document.querySelector('[data-drawer="cart"]');
    if (!drawer) return;
    const rows = drawer.querySelectorAll("[data-cart-row]");
    let subtotal = 0;
    rows.forEach((row) => {
      const price = parseFloat(row.dataset.unitPrice) || 0;
      const qtyEl = row.querySelector("[data-qty]");
      const qty = qtyEl ? parseInt(qtyEl.textContent, 10) || 0 : 0;
      subtotal += price * qty;
    });
    // Update every subtotal (the CHECKOUT button carries one too) BEFORE
    // any early return, or the totals go stale: an emptied cart keeps its
    // last figure, and a drawer without a free-shipping strip never updated
    // at all.
    drawer.querySelectorAll("[data-cart-subtotal]").forEach((el) => {
      el.textContent = egp(subtotal);
    });
    // Re-apply any active promo against the new subtotal.
    syncCartDrawerTotals();

    const mount = drawer.querySelector("[data-free-shipping]");
    if (!mount) return;

    if (!rows.length) {
      mount.classList.add("hidden");
      mount.innerHTML = "";
      delete mount.dataset.fsUnlocked;
      return;
    }

    mount.classList.remove("hidden");
    const wasUnlocked = mount.dataset.fsUnlocked === "1";
    const isUnlocked = subtotal >= FREE_SHIP_THRESHOLD;
    mount.innerHTML = freeShippingHTML(subtotal);
    mount.dataset.fsUnlocked = isUnlocked ? "1" : "0";
    if (isUnlocked && !wasUnlocked) {
      const r = mount.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      /* Launch from the banner's TOP edge, not its centre: the strip sits
         low in the drawer, so pieces spawned at the middle immediately
         fall off-screen. From the top edge they arc up over the cart. */
      const cy = r.top;
      /* Retuned vs the promo default for this context: the drawer is only
         ~420px wide (vs a full-page field), so a 13-piece burst at that
         spread reads as a few stray specks. More pieces, tighter spread,
         and a harder launch make it POP; slightly smaller shapes keep it
         from swamping a narrow panel. Lifted above the drawer's z-100. */
      const burst = (delay, opts) =>
        setTimeout(() => promoPaperBurst(cx, cy, Object.assign({ className: "promo-fx--over-overlay" }, opts)), delay);
      burst(0, { count: 26, spread: 150, speed: 4.2, speedVar: 3.4, scale: 0.78 });
      // Second, softer wave a beat later so the effect blooms rather than
      // firing once and instantly thinning out.
      burst(160, { count: 14, spread: 230, speed: 3.2, speedVar: 3, scale: 0.62 });
    }
  }

  /* Empty-cart state — swapped into [data-cart-rows] once the last line
     item is removed via the stepper (see initSteppers). The bag icon
     reuses shopping-bag-icon.svg (a white-stroke outline) on a dark
     circle backdrop, matching the floating cart button's own empty state
     so the two read as the same "empty" motif. */
  function cartEmptyStateHTML() {
    return `
      <div class="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <p class="font-medium text-textSecondary">Your bag is empty</p>
        <a href="shop.html" class="text-cta font-medium text-sm hover:underline">Continue shopping →</a>
      </div>`;
  }
  function checkCartEmpty() {
    const drawer = document.querySelector('[data-drawer="cart"]');
    const rowsWrap = drawer && drawer.querySelector("[data-cart-rows]");
    if (!rowsWrap) return;
    if (!rowsWrap.querySelector("[data-cart-row]")) rowsWrap.innerHTML = cartEmptyStateHTML();
  }

  /* Cart PAGE (cart.html) summary — the drawer has its own updater above;
     this keeps the full-page version honest when a line item's quantity
     changes or the row is removed via the counter. Removing the row but
     leaving a stale "EGP 1,830.00" subtotal would be worse than not
     supporting removal at all, so this runs on every stepper change.
     No-ops on pages without per-row price data (e.g. checkout.html, whose
     summary is a static order review with no counters), so the static
     demo figures there are left alone. */
  function syncCartPageSummary() {
    const subtotalEl = document.querySelector("[data-summary-subtotal]");
    // Scoped to [data-cart-list]: the cart DRAWER is injected into every
    // page and its line items also carry [data-cart-row], so an unscoped
    // query double-counts the drawer's contents into the page subtotal.
    const list = document.querySelector("[data-cart-list]");
    // Bail on pages with no cart list at all (checkout.html) — but NOT on a
    // list that has emptied out, which must still fall through and zero the
    // figures rather than leave the last stale subtotal on screen.
    if (!subtotalEl || !list) return;
    const rows = list.querySelectorAll("[data-cart-row][data-unit-price]");
    let subtotal = 0;
    rows.forEach((row) => {
      const price = parseFloat(row.dataset.unitPrice) || 0;
      const qtyEl = row.querySelector("[data-qty]");
      const qty = qtyEl ? parseInt(qtyEl.textContent, 10) || 0 : 0;
      const line = price * qty;
      subtotal += line;
      /* The prominent pink figure is the LINE TOTAL (unit x qty); the small
         grey line under it carries the unit x quantity breakdown. Rebuilt
         from the same three-span structure the static markup uses so the
         EGP / integer / decimal type sizes survive the update. */
      const lineEl = row.querySelector("[data-line-total]");
      if (lineEl) {
        const intp = Math.floor(line);
        const dec = (line - intp).toFixed(2).substring(1);
        lineEl.innerHTML =
          '<span class="md:text-lg font-medium">EGP</span>' +
          '<span class="md:text-2xl font-semibold">' + intp.toLocaleString("en-US") + "</span>" +
          '<span class="md:text-lg font-medium">' + dec + "</span>";
      }
      const breakdownEl = row.querySelector("[data-line-breakdown]");
      if (breakdownEl) breakdownEl.innerHTML = egp(price) + " &times; " + qty;
      /* Compare-at ("was") price scales with quantity too — otherwise a
         qty-2 row would show a doubled total struck through against a
         single-unit original. */
      const compareEl = row.querySelector("[data-line-compare]");
      if (compareEl) {
        const unitWas = parseFloat(compareEl.dataset.compareUnit) || 0;
        if (unitWas) compareEl.textContent = egp(unitWas * qty);
      }
    });
    subtotalEl.textContent = egp(subtotal);
    /* Nothing in the cart means nothing to deliver — leaving the 40 EGP
       fee standing would show a non-zero Total on an empty cart. Stashed
       on first zero-out so it can be restored if items come back. */
    const deliveryEl = document.querySelector("[data-summary-delivery]");
    if (deliveryEl) {
      if (!deliveryEl.dataset.baseFee) deliveryEl.dataset.baseFee = String(parseEGP(deliveryEl.textContent));
      deliveryEl.textContent = egp(subtotal > 0 ? parseFloat(deliveryEl.dataset.baseFee) || 0 : 0);
    }
    // Re-apply whatever discount is currently showing so Total stays right.
    const dRow = document.querySelector("[data-summary-discount-row]");
    const dEl = document.querySelector("[data-summary-discount]");
    const discount = dRow && !dRow.hidden && dEl ? parseEGP(dEl.textContent) : 0;
    promoSyncSummary(discount);
  }

  /* Empty state for the cart PAGE list (distinct from the drawer's).
     Targets [data-cart-list] rather than deriving the <ul> from a row —
     by the time this runs the last row is already gone, so there'd be
     nothing left to walk up from. */
  function checkCartPageEmpty() {
    const list = document.querySelector("[data-cart-list]");
    if (!list || list.querySelector("[data-cart-row]")) return;
    list.outerHTML = `
      <div class="flex flex-col justify-center items-center gap-5 py-16 text-center">
        <div class="font-medium text-blackText text-2xl">Your bag is empty</div>
        <a href="shop.html" class="text-cta font-medium hover:underline">Continue shopping →</a>
      </div>`;
  }

  /* ---------------------------------------------------------------
     POST CARD — the ONE editorial card for the whole site (Mark:
     "this is our posts global component, use it also in the media
     center for all posts pages").

     Vertical card: badge + date → 1:1 image → title → turquoise
     "Read more →". Drop a placeholder and it fills itself:

       <div data-posts></div>                  all posts
       <div data-posts data-posts-limit="4"></div>   latest N

     POSTS below is the single source for both the homepage strip and
     the media-center grid, so a post added once shows up in both. The
     media center previously used a completely different horizontal
     192px-thumbnail card; that markup is gone.
     --------------------------------------------------------------- */
  /* The journal's category marker. Tinted pills were the base template's
     idea; here it is plain tracked uppercase, so an article's label sits in
     the same voice as every other micro-label on the site. The colour class
     is retained per category only so a future editor can reintroduce a
     distinction without touching the markup. */
  const POST_BADGE = {
    event: "text-neutral-secondary",
    recipe: "text-neutral-secondary",
    blog: "text-neutral-secondary",
    guide: "text-neutral-secondary",
    care: "text-neutral-secondary",
    news: "text-cta",
  };
  const POSTS = [
    { cat: "guide", label: "Guide", date: "12 Jun 2025", title: "Thread count, honestly: what 200 and 400 actually mean", img: "images/blog-post-03-cotton-field.webp", url: "blog.html" },
    { cat: "blog", label: "Journal", date: "3 Jun 2025", title: "Why long-staple Egyptian cotton sleeps cooler", img: "images/about-06-team-cotton.webp", url: "blog.html" },
    { cat: "guide", label: "Care", date: "21 May 2025", title: "How to wash percale so it softens instead of wearing out", img: "images/product-08-sheet-set-white-styled.webp", url: "blog.html" },
    { cat: "news", label: "News", date: "8 May 2025", title: "Percaal opens at Cairo Festival City", img: "images/about-08-store-associate.webp", url: "blog.html" },
    { cat: "blog", label: "Journal", date: "27 Apr 2025", title: "The hands behind our Upper Egypt spread sheets", img: "images/about-11-folding-linens.webp", url: "blog.html" },
    { cat: "guide", label: "Guide", date: "15 Apr 2025", title: "Bed sizes in Egypt: a plain guide to getting the fit right", img: "images/about-02-bedroom.webp", url: "blog.html" },
  ];
  /* A journal card is a .tile with a date line above the picture: the same
     large-image / small-text ratio as a product card, so an editorial row
     and a product row sit together on the homepage without one shouting. */
  function postCardHTML(p, i) {
    const badge = POST_BADGE[p.cat] || POST_BADGE.blog;
    return `
      <a href="${p.url}" class="tile group" data-category="${p.cat}" data-reveal style="--reveal-delay:${(i % 4) * 0.08}s">
        <span class="mb-3 flex items-center gap-3">
          <span class="micro ${badge}">${esc(p.label)}</span>
          <span class="micro text-neutral-outline">${esc(p.date)}</span>
        </span>
        <span class="tile__media">
          <img src="${p.img}" alt="${esc(p.title)}" loading="lazy" />
        </span>
        <span class="tile__body">
          <span class="display-sm block">${esc(p.title)}</span>
          <span class="tile__meta mt-2 inline-block border-b border-current pb-0.5 text-[11px] uppercase tracking-brand text-primaryDark">Read</span>
        </span>
      </a>`;
  }

  function initPosts(scope) {
    scope.querySelectorAll("[data-posts]").forEach((el) => {
      if (el.dataset.postsReady) return;
      el.dataset.postsReady = "1";
      const limit = parseInt(el.dataset.postsLimit, 10);
      const list = limit > 0 ? POSTS.slice(0, limit) : POSTS;
      el.innerHTML = list.map(postCardHTML).join("");
    });
  }

  /* ---------------------------------------------------------------
     Vouchers (my-account-vouchers.html). A voucher is a one-time code
     worth a fixed EGP amount; activating it moves it to "Used" and adds
     its value to the wallet balance (see walletBalance above).

     Two entry points, matching the design: activate an existing voucher
     from the list, or add one by code. Both land in the same
     [data-modal="voucher"] shell — one modal with two bodies — so there
     is a single close/backdrop path rather than two competing overlays.
     --------------------------------------------------------------- */
  const VOUCHER_CODES = { EX150: 150, SWEET100: 100, GIFT250: 250 };
  /* A voucher is "old" once it is either spent or past its date. Which of
     the two is carried ONLY by the meta line (Used … / Expired …) — Mark:
     the two states share a row style and are told apart by the label. */
  function voucherState(v) {
    if (v.used) return "used";
    return new Date(v.expires) < startOfToday() ? "expired" : "available";
  }
  function voucherMeta(v) {
    const st = voucherState(v);
    if (st === "used") return "Used " + fmtDate(new Date(v.usedOn));
    if (st === "expired") return "Expired " + fmtDate(new Date(v.expires));
    return "Valid till " + fmtDate(new Date(v.expires));
  }
  function voucherRowHTML(v) {
    const st = voucherState(v);
    const old = st !== "available";
    return `
      <li class="voucher${old ? " voucher--old" : ""}" data-voucher-id="${v.id}" data-voucher-value="${v.value}" data-voucher-state="${st}">
        <span class="voucher__ico"><span class="ico ico-line" data-ico="gift-card" aria-hidden="true">${window.icon ? window.icon("gift-card") : ""}</span></span>
        <span class="voucher__body">
          <span class="voucher__title">${v.value} EGP Discount</span>
          <span class="voucher__meta">${voucherMeta(v)}</span>
        </span>
        ${
          old
            ? ""
            : `<button type="button" class="voucher__action" data-voucher-activate aria-label="Activate ${v.value} EGP voucher">
                 <span class="ico ico-line" data-ico="plus-sign" aria-hidden="true">${window.icon ? window.icon("plus-sign") : ""}</span>
               </button>`
        }
      </li>`;
  }
  function initVouchers(scope) {
    const root = scope.querySelector("[data-vouchers]");
    if (!root || root.dataset.vouchersReady) return;
    root.dataset.vouchersReady = "1";

    const availList = root.querySelector("[data-voucher-list='available']");
    const oldList = root.querySelector("[data-voucher-list='old']");
    const modal = document.querySelector('[data-modal="voucher"]');
    const paneAdd = modal.querySelector("[data-voucher-pane='add']");
    const paneActivate = modal.querySelector("[data-voucher-pane='activate']");
    const codeInput = modal.querySelector("[data-voucher-code]");
    const codeError = modal.querySelector("[data-voucher-error]");
    const activateCopy = modal.querySelector("[data-voucher-activate-copy]");
    let pending = null; // the <li> awaiting confirmation

    const render = () => {
      availList.innerHTML = VOUCHERS.filter((v) => voucherState(v) === "available").map(voucherRowHTML).join("");
      oldList.innerHTML = VOUCHERS.filter((v) => voucherState(v) !== "available").map(voucherRowHTML).join("");
      // Empty states — an empty <ul> with a heading above reads as broken.
      root.querySelectorAll("[data-voucher-empty]").forEach((el) => {
        const which = el.dataset.voucherEmpty;
        const n = VOUCHERS.filter((v) =>
          which === "old" ? voucherState(v) !== "available" : voucherState(v) === "available"
        ).length;
        el.hidden = n > 0;
      });
    };
    const showPane = (which) => {
      paneAdd.hidden = which !== "add";
      paneActivate.hidden = which !== "activate";
    };
    const open = (which) => {
      showPane(which);
      if (codeError) codeError.hidden = true;
      openOverlay("voucher");
    };

    root.addEventListener("click", (e) => {
      const act = e.target.closest("[data-voucher-activate]");
      if (act) {
        pending = act.closest("[data-voucher-id]");
        activateCopy.textContent = `${pending.dataset.voucherValue} EGP will be added to your wallet balance`;
        open("activate");
        return;
      }
      if (e.target.closest("[data-voucher-add]")) {
        if (codeInput) codeInput.value = "";
        open("add");
      }
    });

    // Confirm activation → credit the wallet, move the row to Used.
    modal.querySelector("[data-voucher-confirm]").addEventListener("click", () => {
      if (!pending) return;
      const v = VOUCHERS.find((x) => String(x.id) === pending.dataset.voucherId);
      let before = null;
      if (v && !v.used) {
        before = walletBalance();
        v.used = true;
        v.usedOn = isoToday();
        addVoucherRedeemed(v.value);
      }
      pending = null;
      render();
      closeOverlay();
      celebrateVoucher();
      /* after the modal is out of the way, so the balance is on screen */
      if (before !== null) setTimeout(() => animateWalletCredit(before, walletBalance()), 260);
    });

    // Add by code → validates against the demo code table.
    modal.querySelector("[data-voucher-submit]").addEventListener("click", () => {
      const code = (codeInput.value || "").trim().toUpperCase();
      const value = VOUCHER_CODES[code];
      if (!value) {
        codeError.textContent = code ? "That code isn't valid or has already been used." : "Enter a voucher code.";
        codeError.hidden = false;
        return;
      }
      if (VOUCHERS.some((v) => v.code === code)) {
        codeError.textContent = "That voucher is already in your list.";
        codeError.hidden = false;
        return;
      }
      VOUCHERS.push({ id: "v" + (VOUCHERS.length + 1), code, value, used: false, expires: isoInMonths(3) });
      render();
      closeOverlay();
      celebrateVoucher();
    });

    // Enter submits the code without submitting any surrounding form.
    if (codeInput) {
      codeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          modal.querySelector("[data-voucher-submit]").click();
        }
      });
      codeInput.addEventListener("input", () => {
        if (codeError) codeError.hidden = true;
      });
    }

    render();
    syncWalletBalance(document);
  }
  /* Reuses the promo-code confetti so redeeming feels like the same
     brand moment as applying a discount. */
  function celebrateVoucher() {
    if (typeof promoPaperBurst !== "function") return;
    const r = { left: innerWidth / 2 - 40, top: innerHeight / 2, width: 80, height: 10 };
    try {
      promoPaperBurst(r.left + r.width / 2, r.top);
    } catch (e) {}
  }
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(d) {
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  /* Midnight today — comparing against `new Date()` would call a voucher
     expiring today "expired" from one second past midnight. */
  function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const iso = (d) => d.toISOString().slice(0, 10);
  function isoToday() {
    return iso(new Date());
  }
  function isoInMonths(n) {
    const d = new Date();
    d.setMonth(d.getMonth() + n);
    return iso(d);
  }
  /* `expires` drives available-vs-expired, so the demo ages on its own
     rather than needing dates edited by hand. v7 is deliberately an
     expired-but-never-used voucher — the case the old model couldn't show. */
  const VOUCHERS = [
    { id: "v1", code: "EX100A", value: 100, used: false, expires: "2026-10-20" },
    { id: "v2", code: "EX100B", value: 100, used: false, expires: "2026-10-20" },
    { id: "v3", code: "EX150A", value: 150, used: false, expires: "2026-11-05" },
    { id: "v4", code: "EX250A", value: 250, used: false, expires: "2026-12-18" },
    { id: "v5", code: "EX100C", value: 100, used: true, usedOn: "2025-10-20", expires: "2025-12-01" },
    { id: "v6", code: "EX100D", value: 100, used: true, usedOn: "2025-10-20", expires: "2025-12-01" },
    { id: "v7", code: "EX050A", value: 50, used: false, expires: "2025-09-03" },
  ];

  /* ---------------------------------------------------------------
     Membership tier badge — Golden / Silver / Platinum
     (Figma 6233-56907). Gradient pill + circular avatar + uppercase
     label. Drop a placeholder anywhere: <span data-tier-badge></span>,
     or force one with <span data-tier-badge="platinum"></span>.

     ONE constant drives every instance. The badge appears 14 times
     across the 8 account pages (most render the profile block twice —
     mobile pills + desktop sidebar) and was previously hard-coded to
     "Gold" in all 14, in three different markup variants. Change
     USER_TIER and the whole demo follows.

     The avatar reuses the account-icon person illustration, per the
     images-only-from-dummy-images-or-icons rule — there is no
     dedicated tier artwork in either allowed folder.
     --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
     Wallet balance — vouchers are the ONLY way to add balance (there is
     no card/Fawry top-up). Base balance + whatever vouchers have been
     activated this session.

     Redeemed total is persisted in localStorage so the balance survives
     the hop from the vouchers page to the wallet page and the checkout
     wallet toggle — without it, "activating" a voucher would claim to
     top up a balance that never changed. This is the only persisted
     state on the site; clear `ex_voucher_redeemed` to reset the demo.
     --------------------------------------------------------------- */
  const WALLET_BASE = 2000; // the balance the Figma wallet shows
  const VOUCHER_STORE = "ex_voucher_redeemed";
  function voucherRedeemed() {
    try {
      return parseFloat(localStorage.getItem(VOUCHER_STORE)) || 0;
    } catch (e) {
      return 0; // private mode / storage disabled — degrade to base balance
    }
  }
  function addVoucherRedeemed(amount) {
    try {
      localStorage.setItem(VOUCHER_STORE, String(voucherRedeemed() + amount));
    } catch (e) {}
  }
  function walletBalance() {
    return WALLET_BASE + voucherRedeemed();
  }
  /* Paints every wallet-balance readout on the page. */
  function syncWalletBalance(scope) {
    (scope || document).querySelectorAll("[data-wallet-balance]").forEach((el) => {
      el.textContent = egp(walletBalance());
    });
  }

  /* Counts every wallet figure from one balance to the next instead of
     swapping the number, and floats the credited amount out of it — the
     point of activating a voucher is watching the value land. */
  function animateWalletCredit(from, to) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = [...document.querySelectorAll("[data-wallet-balance]")];
    if (!targets.length || to === from) return syncWalletBalance(document);
    if (reduced) return syncWalletBalance(document);

    const DUR = 1100;
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    targets.forEach((el) => {
      /* the +N pill floats out of the figure; needs a positioned anchor */
      const host = el.offsetParent ? el : null;
      if (host) {
        const rect = el.getBoundingClientRect();
        const pill = document.createElement("span");
        pill.className = "wallet-credit__delta";
        pill.textContent = "+" + egp(to - from);
        pill.style.left = rect.left + rect.width / 2 + "px";
        pill.style.top = rect.top - 6 + "px";
        pill.style.position = "fixed";
        pill.style.transform = "translateX(-50%)";
        document.body.appendChild(pill);
        setTimeout(() => pill.remove(), 1600);
      }

      el.classList.remove("wallet-credit");
      void el.offsetWidth; /* restart the highlight if it's still running */
      el.classList.add("wallet-credit");

      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / DUR);
        el.textContent = egp(from + (to - from) * ease(k));
        if (k < 1) requestAnimationFrame(step);
        else el.textContent = egp(to);
      };
      requestAnimationFrame(step);
    });
  }

  const USER_TIER = "golden"; // golden | silver | platinum
  const TIERS = { golden: "Golden", silver: "Silver", platinum: "Platinum" };
  function tierBadgeHTML(tier) {
    const key = TIERS[tier] ? tier : "golden";
    return `<span class="tier-badge tier-badge--${key}">
        <span class="tier-badge__label">${TIERS[key]}</span>
      </span>`;
  }
  function initTierBadge(scope) {
    scope.querySelectorAll("[data-tier-badge]").forEach((el) => {
      if (el.dataset.tierReady) return;
      el.dataset.tierReady = "1";
      el.innerHTML = tierBadgeHTML(el.dataset.tierBadge || USER_TIER);
    });
  }

  /* ---------------------------------------------------------------
     Wallet balance toggle — "Use My Wallet Balance" (Figma 6231-56797).
     Mint card, brand wallet illustration, the balance as a turquoise
     badge, switch on the end. Drop a placeholder anywhere in an order
     summary: <div data-wallet-toggle></div>

     Switching it on applies the WHOLE balance and leaves any remainder
     payable on the selected method (capped at the bill — see
     syncSummary). The balance mirrors my-account-wallet.html.

     The control is a real <input type="checkbox"> so it is keyboard- and
     screen-reader-operable for free, wrapped in a <label> so the entire
     card is a hit target. It is deliberately NOT a <button>: this card
     sits inside checkout's one giant place-order <form>, where a
     default-type button submits and places the order (the same trap
     already hit by the promo Apply button and the delivery-note Edit
     button).
     --------------------------------------------------------------- */
  function walletCardHTML(balance) {
    return `
      <label class="wallet-toggle">
        <img src="icons/wallet-02.svg" alt="" class="wallet-toggle__icon" />
        <span class="wallet-toggle__label">Use My Wallet Balance</span>
        <span class="wallet-toggle__amount">${Math.round(balance).toLocaleString("en-US")} EGP</span>
        <input type="checkbox" class="wallet-toggle__input" data-wallet-input aria-label="Use my wallet balance" />
        <span class="wallet-toggle__switch" aria-hidden="true"></span>
      </label>`;
  }
  function initWalletToggle(scope) {
    scope.querySelectorAll("[data-wallet-toggle]").forEach((root) => {
      if (root.dataset.walletReady) return;
      root.dataset.walletReady = "1";
      root.innerHTML = walletCardHTML(walletBalance());
      const input = root.querySelector("[data-wallet-input]");
      input.addEventListener("change", () => {
        walletApplied = input.checked ? walletBalance() : 0;
        syncSummary();
      });
    });
  }

  /* ---------------------------------------------------------------
     Send as a gift (checkout) — toggling on reveals the recipient
     fields and rules out the options gifts can't use: "Pickup from
     store" (meta swaps to an unavailable notice) and "Cash on
     delivery" (auto-moves the selection to card). Toggling off
     restores both, including whatever the pickup meta said before.
     --------------------------------------------------------------- */
  function initGiftToggle(scope) {
    scope.querySelectorAll("[data-gift]").forEach((root) => {
      if (root.dataset.giftReady) return;
      root.dataset.giftReady = "1";
      const input = root.querySelector("[data-gift-input]");
      const fields = root.querySelector("[data-gift-fields]");
      if (!input) return;
      let prevPickupMeta = "";
      input.addEventListener("change", () => {
        const on = input.checked;
        if (fields) {
          fields.hidden = !on;
          if (on) {
            fields.classList.remove("sc-tile");
            void fields.offsetWidth;
            fields.classList.add("sc-tile");
          }
        }
        /* Pickup from store — not available for gift orders */
        const pickup = document.querySelector('[data-optgroup="shiptype"] [data-opt="pickup"]');
        const pickupMeta = pickup && pickup.querySelector("[data-opt-meta]");
        if (pickup) {
          if (on) {
            if (pickup.classList.contains("is-selected")) {
              const deliver = document.querySelector('[data-optgroup="shiptype"] [data-opt="deliver"]');
              if (deliver) deliver.click();
            }
            if (pickupMeta) {
              prevPickupMeta = pickupMeta.textContent;
              pickupMeta.textContent = "Not available for gift orders";
            }
          } else if (pickupMeta) {
            pickupMeta.textContent = prevPickupMeta || "Choose Store";
          }
          pickup.classList.toggle("is-disabled", on);
          pickup.disabled = on;
        }
        /* Cash on delivery — not available for gift orders */
        const cod = document.querySelector('input[name="payment"][value="cod"]');
        const codRow = cod && cod.closest(".optrow");
        if (codRow) {
          codRow.classList.toggle("is-disabled", on);
          cod.disabled = on;
          if (on && cod.checked) {
            const cc = document.querySelector('input[name="payment"][value="cc"]');
            if (cc) {
              cc.checked = true;
              cc.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        }
      });
    });
  }

  /* ---------------------------------------------------------------
     Order note — a pink link that expands into a compose form, then
     collapses into a saved white card with a remove control.
     Drop a placeholder anywhere: <div data-order-note></div>
     --------------------------------------------------------------- */
  function orderNoteHTML() {
    return `
      <button type="button" class="ordernote__toggle" data-note-toggle aria-expanded="false">
        <span class="ordernote__toggleMain">
          <svg class="ordernote__noteIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span data-note-toggle-label>Add Order Note</span>
        </span>
        <svg class="ordernote__plus" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
      <div class="ordernote__panel" data-note-panel>
        <div class="ordernote__panelInner">
          <textarea rows="3" class="ordernote__field" data-note-field placeholder="Write a note for your order (e.g. happy birthday message)…"></textarea>
          <div class="ordernote__actions">
            <button type="button" class="btn btn--primary btn--sm" data-note-save>Add Note</button>
          </div>
        </div>
      </div>
      <div data-note-saved hidden></div>`;
  }
  function initOrderNote(scope) {
    scope.querySelectorAll("[data-order-note]").forEach((root) => {
      if (root.dataset.noteReady) return;
      root.dataset.noteReady = "1";
      root.classList.add("ordernote");
      root.innerHTML = orderNoteHTML();

      const toggle = root.querySelector("[data-note-toggle]");
      const label = root.querySelector("[data-note-toggle-label]");
      const field = root.querySelector("[data-note-field]");
      const savedWrap = root.querySelector("[data-note-saved]");

      const open = (on) => {
        root.classList.toggle("is-open", on);
        toggle.setAttribute("aria-expanded", String(on));
        if (on) setTimeout(() => field.focus(), 180);
      };

      function showSaved(text) {
        savedWrap.hidden = false;
        savedWrap.innerHTML = `
          <div class="ordernote__saved">
            <span class="ordernote__savedIcon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            <span class="ordernote__savedText">${esc(text)}</span>
            <button type="button" class="ordernote__remove" data-note-remove aria-label="Remove note"><svg viewBox="0 0 24 24" fill="none" class="w-4 h-4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
          </div>`;
        // With a note saved, the link becomes the way back in to edit it.
        toggle.hidden = true;
      }

      /* The +/× in the toggle is the only open AND close control — a separate
         "Close" button in the actions row would duplicate what the × does. */
      toggle.addEventListener("click", () => open(!root.classList.contains("is-open")));
      root.querySelector("[data-note-save]").addEventListener("click", () => {
        const text = field.value.trim();
        if (!text) {
          field.focus();
          return;
        }
        open(false);
        showSaved(text);
      });
      savedWrap.addEventListener("click", (e) => {
        if (!e.target.closest("[data-note-remove]")) return;
        savedWrap.hidden = true;
        savedWrap.innerHTML = "";
        field.value = "";
        toggle.hidden = false;
        label.textContent = "Add order note";
      });
    });
  }

  /* Promo markup, so a bare <div data-promo></div> is enough to place the
     field. Pages that still ship the full markup inline keep working —
     this only fills in an empty container. */
  function promoFieldHTML() {
    return `
      <div class="promo__form" data-promo-form>
        <span class="promo__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-2a2.5 2.5 0 0 0 0-5v-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m9.5 14.5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9.75" cy="9.75" r="0.9" fill="currentColor"/><circle cx="14.25" cy="14.25" r="0.9" fill="currentColor"/></svg></span>
        <input type="text" class="promo__input" placeholder="Promo code" aria-label="Promo code" data-promo-input />
        <button type="button" class="promo__apply" data-promo-apply>Apply</button>
      </div>
      <div class="promo__success" data-promo-success hidden>
        <span class="promo__check"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span class="promo__meta">
          <span class="promo__code" data-promo-code></span>
          <span class="promo__desc" data-promo-desc></span>
        </span>
        <button type="button" class="promo__remove" data-promo-remove aria-label="Remove promo code"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      </div>
      <p class="promo__error" data-promo-error role="alert" hidden></p>`;
  }

  /* ORDER NOTE — one field for the bag summaries (cart, checkout, card
     page) and the place-holder <div data-nteinp></div> is all a page needs.
     Three states: a quiet "+ Add Order Notes" link; the open field with an
     ADD link (Enter works too); and the saved note, marked "Note added"
     with a tick, the note itself (tap it to edit) and a delete icon. The
     note is kept for the session, so one written in the bag is still there
     at checkout. */
  const NOTE_KEY = "percaal-order-note";
  const noteStore = {
    get() { try { return sessionStorage.getItem(NOTE_KEY) || ""; } catch (e) { return ""; } },
    set(v) { try { v ? sessionStorage.setItem(NOTE_KEY, v) : sessionStorage.removeItem(NOTE_KEY); } catch (e) { /* session-only */ } },
  };
  function noteFieldHTML() {
    return `
      <button type="button" class="nteinp__ghost" data-nteinp-open>
        <span class="bagsum__ghost-icon" aria-hidden="true"></span>
        <span>Add Order Notes</span>
      </button>
      <div class="nteinp__open" data-nteinp-input>
        <div class="nteinp__open-head">
          <span>Add Order Notes</span>
          <button type="button" class="nteinp__close" data-nteinp-close aria-label="Cancel note">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="nteinp__input">
          <input type="text" data-nteinp-value placeholder="Type an order note…" maxlength="200" aria-label="Order note" />
          <button type="button" class="nteinp__add" data-nteinp-add disabled>Add</button>
        </div>
      </div>
      <div class="nteinp__saved" data-nteinp-saved>
        <span class="promo__check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <button type="button" class="nteinp__saved-meta" data-nteinp-edit aria-label="Edit order note">
          <span class="nteinp__saved-label">Note added</span>
          <span class="nteinp__saved-text" data-nteinp-text></span>
        </button>
        <button type="button" class="nteinp__delete" data-nteinp-delete aria-label="Delete order note">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19.5 5.5 18.88 15.6c-.16 2.58-.24 3.87-.88 4.8a4 4 0 0 1-1.2 1.13c-.97.57-2.26.57-4.85.57-2.6 0-3.89 0-4.86-.57A4 4 0 0 1 5.9 20.4c-.65-.93-.72-2.22-.88-4.81L4.5 5.5M3 5.5h18M16.06 5.5l-.68-1.4c-.45-.94-.68-1.4-1.07-1.7a2 2 0 0 0-.27-.17C13.6 2 13.08 2 12.04 2c-1.07 0-1.6 0-2.04.24a2 2 0 0 0-.28.18c-.4.3-.62.79-1.06 1.76L8.05 5.5M9.5 16.5v-6M14.5 16.5v-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>`;
  }
  function initNoteInput(scope) {
    scope.querySelectorAll("[data-nteinp]").forEach((wrap) => {
      if (wrap.dataset.noteReady) return;
      wrap.dataset.noteReady = "1";
      wrap.classList.add("nteinp");
      wrap.innerHTML = noteFieldHTML();
      const input = wrap.querySelector("[data-nteinp-value]");
      const addBtn = wrap.querySelector("[data-nteinp-add]");
      const text = wrap.querySelector("[data-nteinp-text]");

      const syncAdd = () => { addBtn.disabled = !input.value.trim(); };
      const show = (state) => {
        wrap.classList.toggle("is-open", state === "open");
        wrap.classList.toggle("is-saved", state === "saved");
      };
      const open = () => {
        show("open");
        syncAdd();
        setTimeout(() => input.focus(), 60);
      };
      const save = () => {
        const v = input.value.trim();
        if (!v) return;
        text.textContent = v;
        noteStore.set(v);
        show("saved");
      };

      const kept = noteStore.get();
      if (kept) {
        input.value = kept;
        text.textContent = kept;
        show("saved");
      }

      input.addEventListener("input", syncAdd);
      input.addEventListener("keydown", (e) => {
        // Never let Enter submit a surrounding checkout form.
        if (e.key === "Enter") { e.preventDefault(); save(); }
        if (e.key === "Escape") { e.preventDefault(); input.value = noteStore.get(); show(noteStore.get() ? "saved" : ""); }
      });
      wrap.querySelector("[data-nteinp-open]").addEventListener("click", open);
      wrap.querySelector("[data-nteinp-edit]").addEventListener("click", open);
      addBtn.addEventListener("click", save);
      // Cancel goes back to whatever was saved before (or to nothing).
      wrap.querySelector("[data-nteinp-close]").addEventListener("click", () => {
        input.value = noteStore.get();
        show(noteStore.get() ? "saved" : "");
      });
      wrap.querySelector("[data-nteinp-delete]").addEventListener("click", () => {
        noteStore.set("");
        input.value = "";
        text.textContent = "";
        show("");
      });
    });
  }

  function initPromo(scope) {
    scope.querySelectorAll("[data-promo]").forEach((promo) => {
      if (promo.dataset.promoReady) return;
      promo.dataset.promoReady = "1";
      promo.classList.add("promo");
      if (!promo.querySelector("[data-promo-form]")) promo.innerHTML = promoFieldHTML();
      const form = promo.querySelector("[data-promo-form]");
      const input = promo.querySelector("[data-promo-input]");
      const applyBtn = promo.querySelector("[data-promo-apply]");
      const success = promo.querySelector("[data-promo-success]");
      const errorEl = promo.querySelector("[data-promo-error]");
      if (!form || !input || !success) return;

      // In the drawer the base is the drawer's own subtotal; elsewhere the
      // page summary's. Read at apply time, not once at load.
      const inDrawer = !!promo.closest('[data-drawer="cart"]');
      const baseSubtotal = () => {
        if (inDrawer) return drawerSubtotal();
        const el = document.querySelector("[data-summary-subtotal]");
        return el ? parseEGP(el.textContent) : 0;
      };

      // The link is inert until there's something to apply.
      const syncApply = () => {
        if (applyBtn) applyBtn.disabled = !input.value.trim();
      };
      syncApply();
      input.addEventListener("input", () => {
        syncApply();
        promo.classList.remove("is-invalid");
        if (errorEl) errorEl.hidden = true;
      });

      const fail = (msg) => {
        promo.classList.remove("is-invalid");
        void promo.offsetWidth; // restart the shake
        promo.classList.add("is-invalid");
        if (errorEl) {
          errorEl.textContent = msg;
          errorEl.hidden = false;
        }
      };

      const submit = () => {
        const code = input.value.trim().toUpperCase();
        if (!code) return;
        const rule = PROMO_CODES[code];
        // PERCAAL10 is the code the header announcement bar advertises,
        // so that's the one to point people at.
        if (!rule) return fail("That code isn't valid. Try PERCAAL10.");

        const discount = promoAmount(rule, baseSubtotal());
        const desc = promoDesc(rule, discount);

        promo.classList.remove("is-invalid");
        if (errorEl) errorEl.hidden = true;

        /* Activation, one box throughout: the field's contents fade up and
           out while the box itself eases to the success tint, then the
           success row fades in on the same tint and its tick pops. The
           confetti fires as the row arrives. See "PROMO CODE" in
           styles.css for the timings. */
        promo.classList.add("is-applying");
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setTimeout(
          () => {
            promo.querySelector("[data-promo-code]").textContent = code;
            promo.querySelector("[data-promo-desc]").textContent = desc;
            form.hidden = true;
            success.hidden = false;
            promo.classList.remove("is-applying");
            promo.classList.add("is-applied");
            if (inDrawer) drawerPromoRule = rule;
            promoSyncSummary(discount);
            const r = promo.getBoundingClientRect();
            promoPaperBurst(r.left + r.width / 2, r.top + r.height / 2);
          },
          reduce ? 0 : 260,
        );
      };

      // NOT a <form> submit: on checkout the promo sits INSIDE the page's
      // one big place-order <form>, and a nested <form> is dropped by the
      // parser — a submit button there would place the order. So: an
      // explicit click, plus Enter with preventDefault so the keyboard
      // path can't submit the outer form either.
      if (applyBtn) applyBtn.addEventListener("click", submit);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });

      const removeBtn = promo.querySelector("[data-promo-remove]");
      if (removeBtn)
        removeBtn.addEventListener("click", () => {
          // The reverse: the success row fades out, the empty field fades in.
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          promo.classList.add("is-removing");
          setTimeout(
            () => {
              success.hidden = true;
              form.hidden = false;
              promo.classList.remove("is-applied", "is-removing");
              promo.classList.add("is-returning");
              setTimeout(() => promo.classList.remove("is-returning"), 320);
              input.value = "";
              syncApply();
              if (inDrawer) drawerPromoRule = null;
              promoSyncSummary(0);
            },
            reduce ? 0 : 180,
          );
        });

      // Start from a clean slate so the demo total is always consistent.
      promoSyncSummary(0);
    });
  }

  /* ---------------------------------------------------------------
     Select → styled dropdown. Vanilla equivalent of the shadcn/Radix
     "same width as trigger" menu: the popup is absolutely positioned
     with inset-inline:0 inside a wrapper that matches the trigger, so
     it always spans exactly the trigger's width.

     Progressive enhancement — the original <select> is left in place and
     still owns the value, so anything already listening for `change`
     (branch filters, the store picker's city→area cascade, …) keeps
     working untouched. If a select's <option>s are rebuilt at runtime,
     call el._uiSelectRefresh() to re-sync the menu.
     --------------------------------------------------------------- */
  const UI_SELECT_CHEVRON =
    '<svg class="ui-select__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const UI_SELECT_CHECK =
    '<svg class="ui-select__check" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let uiSelectOpen = null;
  function uiSelectCloseAll() {
    if (!uiSelectOpen) return;
    uiSelectOpen.root.classList.remove("is-open");
    uiSelectOpen.menu.hidden = true;
    uiSelectOpen.trigger.setAttribute("aria-expanded", "false");
    uiSelectOpen = null;
  }

  function initSelects(scope) {
    scope.querySelectorAll("select").forEach((sel) => {
      if (sel.dataset.uiSelectReady) return;
      sel.dataset.uiSelectReady = "1";

      const root = document.createElement("div");
      root.className = "ui-select";
      sel.parentNode.insertBefore(root, sel);
      root.appendChild(sel);
      sel.classList.add("ui-select__native");
      sel.setAttribute("aria-hidden", "true");
      sel.setAttribute("tabindex", "-1");

      const trigger = document.createElement("button");
      trigger.type = "button";
      /* Inherit the select's own utility classes so each context keeps its
         shape (pill on shop filters, rounded-md on checkout, etc.) — only
         the chevron/padding behaviour is unified. */
      trigger.className = (sel.dataset.uiSelectClass || sel.className)
        .replace(/\bui-select__native\b/, "")
        .trim();
      trigger.classList.add("ui-select__trigger");
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      trigger.innerHTML = '<span class="ui-select__value"></span>' + UI_SELECT_CHEVRON;
      root.appendChild(trigger);

      const menu = document.createElement("div");
      menu.className = "ui-select__menu";
      menu.setAttribute("role", "listbox");
      menu.hidden = true;
      root.appendChild(menu);

      const valueEl = trigger.querySelector(".ui-select__value");

      function render() {
        const opts = [...sel.options];
        valueEl.textContent = sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].textContent : "";
        menu.innerHTML = opts
          .map(
            (o, i) =>
              `<button type="button" role="option" class="ui-select__item${i === sel.selectedIndex ? " is-selected" : ""}" aria-selected="${i === sel.selectedIndex}" data-i="${i}">${UI_SELECT_CHECK}<span>${esc(o.textContent)}</span></button>`,
          )
          .join("");
      }
      render();
      // Lets callers that repopulate <option>s re-sync the custom menu.
      sel._uiSelectRefresh = render;

      function open() {
        uiSelectCloseAll();
        render();
        menu.hidden = false;
        root.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        uiSelectOpen = { root, menu, trigger };
        const cur = menu.querySelector(".is-selected");
        if (cur) cur.classList.add("is-active");
      }

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        if (root.classList.contains("is-open")) uiSelectCloseAll();
        else open();
      });

      menu.addEventListener("click", (e) => {
        const item = e.target.closest(".ui-select__item");
        if (!item) return;
        e.stopPropagation();
        sel.selectedIndex = parseInt(item.dataset.i, 10);
        // Native event so existing change listeners fire exactly as before.
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        render();
        uiSelectCloseAll();
      });

      trigger.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!root.classList.contains("is-open")) open();
        } else if (e.key === "Escape") {
          uiSelectCloseAll();
        }
      });
      menu.addEventListener("keydown", (e) => {
        const items = [...menu.querySelectorAll(".ui-select__item")];
        const cur = items.findIndex((i) => i.classList.contains("is-active"));
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const next = e.key === "ArrowDown" ? Math.min(items.length - 1, cur + 1) : Math.max(0, cur - 1);
          items.forEach((i, n) => i.classList.toggle("is-active", n === next));
          items[next].scrollIntoView({ block: "nearest" });
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (items[cur]) items[cur].click();
        } else if (e.key === "Escape") {
          uiSelectCloseAll();
          trigger.focus();
        }
      });
    });
  }
  document.addEventListener("click", uiSelectCloseAll);

  /* Add a product to the bag drawer — the one path every "add" takes
     (the drawer's quick-add and the product page's ADD TO BAG / BUY NOW).
     `opts` picks the variant: colour, size, fabric (each defaulting to the
     product's first) and qty (default 1). The same product + options
     raises the quantity of its existing row instead of adding a second
     one. Updates the badge and the drawer totals; returns the row. */
  function addLineToBag(slug, opts) {
    const drawer = document.querySelector('[data-drawer="cart"]');
    const list = drawer && drawer.querySelector("[data-cart-rows]");
    if (!list) return null;
    const o = opts || {};
    const p = productBySlug(slug);
    const colour = o.colour || p.colours[0];
    const size = o.size || p.sizes[0];
    const fabric = o.fabric || p.fabrics[0];
    const qty = Math.max(1, parseInt(o.qty, 10) || 1);
    const variants = [];
    if (p.sizes.length > 1) variants.push(["Size", size]);
    if (p.fabrics.length > 1) variants.push(["Fabric", FABRICS[fabric].name]);
    if (p.colours.length > 1) variants.push(["Colour", COLOURWAYS[colour].name]);
    const key = [p.slug, colour, size, fabric].join("|");

    let row = [...list.querySelectorAll("[data-line-key]")].find((r) => r.dataset.lineKey === key);
    if (row) {
      const qtyEl = row.querySelector("[data-qty]");
      const q = (parseInt(qtyEl.textContent, 10) || 0) + qty;
      qtyEl.textContent = q;
      const dec = row.querySelector('[data-step="-1"]');
      if (dec && q > 1) {
        dec.innerHTML = STEP_ICON_MINUS;
        dec.setAttribute("aria-label", "Decrease quantity");
      }
    } else {
      if (!list.querySelector("[data-cart-row]")) list.innerHTML = ""; // clear the empty state
      list.insertAdjacentHTML(
        "afterbegin",
        cartRowHTML({ name: p.name, price: p.price[fabric], qty, img: productArt(p, colour), variants, key }),
      );
      row = list.firstElementChild;
      initSteppers(row);
    }
    // A soft flash on the row that changed, scrolled into view.
    row.classList.remove("is-added");
    void row.offsetWidth;
    row.classList.add("is-added");
    row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    bumpCart(qty);
    updateFreeShipping();
    return row;
  }
  window.kAddLine = addLineToBag;
  window.kOpenCart = () => {
    const btn = document.querySelector('[data-open="cart"]');
    if (btn) btn.click();
  };

  /* BUY NOW — express checkout for a single item. The product page sends
     ?buy=<slug>&colour=&size=&fabric=&qty= to checkout.html (and the
     checkout carries it on to the card page), so the Bag Summary there
     shows just that item instead of the bag. Unknown options fall back to
     the product's first, so a hand-edited URL can't show an impossible
     variant. No-op without ?buy or without a summary on the page. */
  function initBuyNowSummary() {
    const q = new URLSearchParams(location.search);
    const slug = q.get("buy");
    const sum = document.querySelector("[data-order-summary]");
    const p = slug && PRODUCTS.find((x) => x.slug === slug);
    if (!sum || !p) return;
    const pick = (v, list) => (list.includes(v) ? v : list[0]);
    const colour = pick(q.get("colour"), p.colours);
    const size = pick(q.get("size"), p.sizes);
    const fabric = pick(q.get("fabric"), p.fabrics);
    const qty = Math.min(99, Math.max(1, parseInt(q.get("qty"), 10) || 1));
    const subtotal = p.price[fabric] * qty;
    const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE;

    const attrs = [];
    if (p.sizes.length > 1) attrs.push(size);
    if (p.colours.length > 1) attrs.push(COLOURWAYS[colour].name);
    if (p.fabrics.length > 1) attrs.push(FABRICS[fabric].name);
    if (qty > 1) attrs.push("Qty " + qty);
    const items = sum.querySelector(".bagsum__items");
    if (items) {
      items.innerHTML = `
        <li class="bagsum__item">
          <img src="${productArt(p, colour)}" alt="" class="bagsum__item-thumb" />
          <div class="bagsum__item-body">
            <p class="bagsum__item-name">${esc(p.name)}</p>
            <p class="bagsum__item-attrs">${attrs
              .map((a) => `<span>${esc(a)}</span>`)
              .join('<span class="cartpg__attr-dot" aria-hidden="true"></span>')}</p>
          </div>
          <p class="bagsum__item-price">${money(subtotal)}</p>
        </li>`;
    }
    // The bag isn't involved, so "Edit" goes back to the product.
    const edit = sum.querySelector(".bagsum__editbag");
    if (edit) {
      edit.textContent = "Edit";
      edit.href = "product.html?p=" + encodeURIComponent(p.slug);
    }
    const set = (sel, txt) => sum.querySelectorAll(sel).forEach((el) => { el.textContent = txt; });
    set("[data-summary-subtotal]", egp(subtotal));
    set("[data-summary-delivery]", shipping ? egp(shipping) : "Free");
    syncSummary(); // total, with any promo / wallet, from the one owner
  }

  /* Phone bottom sheet: drag the cart down by its header to close it.
     Follows the finger, and closes past 90px (or a quick flick); anything
     less springs back. Desktop never sees it (the media query below is
     the same breakpoint the sheet styles use). */
  function initCartSheetDrag() {
    const drawer = document.querySelector('[data-drawer="cart"]');
    const head = drawer && drawer.querySelector(".cart-drawer__head");
    if (!head) return;
    const phone = window.matchMedia("(max-width: 768px)");
    let startY = 0, dy = 0, t0 = 0, dragging = false;
    head.addEventListener("touchstart", (e) => {
      if (!phone.matches || drawer.scrollTop > 0 || e.target.closest("a, button")) return;
      dragging = true;
      startY = e.touches[0].clientY;
      dy = 0;
      t0 = Date.now();
      drawer.style.transition = "none";
    }, { passive: true });
    head.addEventListener("touchmove", (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      drawer.style.transform = "translateY(" + dy + "px)";
    }, { passive: true });
    head.addEventListener("touchend", () => {
      if (!dragging) return;
      dragging = false;
      drawer.style.transition = "";
      drawer.style.transform = "";
      const flick = dy > 40 && dy / Math.max(1, Date.now() - t0) > 0.6;
      if (dy > 90 || flick) closeOverlay();
    });
  }

  /* Quick add in the cart drawer's "You May Also Like" column — see
     "YOU MAY ALSO LIKE" near the catalogue for the markup. One menu is open
     at a time; Escape or a click elsewhere closes it and returns focus to
     its +. */
  function initQuickAdd() {
    const drawer = document.querySelector('[data-drawer="cart"]');
    if (!drawer) return;
    const PLUS = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    const CHECK = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const BACK = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 6 9 12l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const CLOSE = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

    const panelOf = (card) => card.querySelector("[data-qa-panel]");
    // Swap the card photo to a colourway (used for picks and hover previews).
    const showColour = (card, colour) => {
      const img = card.querySelector(".upsell-card__media img");
      const src = productArt(productBySlug(card.dataset.slug), colour);
      if (img && !img.src.endsWith(src)) img.src = src;
    };
    const toggleOf = (card) => card.querySelector("[data-qa-toggle]");

    const render = (card) => {
      const p = productBySlug(card.dataset.slug);
      const steps = quickAddSteps(p);
      const st = card._qa;
      const step = steps[st.step];
      const prev = steps[st.step - 1];
      panelOf(card).innerHTML = `
        <div class="qa-panel__head">
          ${prev ? `<button type="button" class="qa-panel__icon" data-qa-back aria-label="Back to ${prev.title.toLowerCase()}">${BACK}</button>` : ""}
          <span class="qa-panel__title">${step.title}</span>
          <button type="button" class="qa-panel__icon" data-qa-close aria-label="Close">${CLOSE}</button>
        </div>
        <ul class="qa-panel__list" aria-label="${step.title}">
          ${step.options
            .map(
              (o) => `<li><button type="button" class="qa-opt${o.value === st.picks[step.axis] ? " is-picked" : ""}" data-qa-pick="${esc(o.value)}">
                <span class="qa-opt__label">${o.swatch ? `<span class="qa-opt__swatch" style="--sw:${o.swatch}" aria-hidden="true"></span>` : ""}${esc(o.label)}</span>${o.note ? `<span class="qa-opt__note">${esc(o.note)}</span>` : ""}
              </button></li>`,
            )
            .join("")}
        </ul>`;
      const first = panelOf(card).querySelector(".qa-opt");
      if (first) first.focus({ preventScroll: true });
    };

    const close = (card, returnFocus) => {
      const panel = panelOf(card);
      if (!panel || !panel.classList.contains("is-open")) return;
      panel.classList.remove("is-open");
      toggleOf(card).setAttribute("aria-expanded", "false");
      if (returnFocus) toggleOf(card).focus({ preventScroll: true });
    };
    const closeAll = (except) =>
      drawer.querySelectorAll("[data-quick-add]").forEach((c) => c !== except && close(c, false));

    const open = (card) => {
      closeAll(card);
      card._qa = { step: 0, picks: {} };
      // Open before rendering: render() focuses the first option, and a
      // still-hidden panel can't take focus.
      panelOf(card).classList.add("is-open");
      toggleOf(card).setAttribute("aria-expanded", "true");
      render(card);
    };

    const addToBag = (card, picks) => {
      addLineToBag(card.dataset.slug, {
        colour: picks.colour || card.dataset.colour,
        size: picks.size,
        fabric: picks.fabric,
      });

      // The + confirms with a tick for a moment, then resets.
      const btn = toggleOf(card);
      btn.classList.add("is-done");
      btn.innerHTML = CHECK;
      clearTimeout(btn._qaTimer);
      btn._qaTimer = setTimeout(() => {
        btn.classList.remove("is-done");
        btn.innerHTML = PLUS;
      }, 1400);
    };

    drawer.addEventListener("click", (e) => {
      const card = e.target.closest("[data-quick-add]");
      if (!card) return;
      if (e.target.closest("[data-qa-toggle]")) {
        if (!panelOf(card)) return addToBag(card, {});
        return panelOf(card).classList.contains("is-open") ? close(card, true) : open(card);
      }
      if (e.target.closest("[data-qa-close]")) return close(card, true);
      if (e.target.closest("[data-qa-back]")) {
        card._qa.step -= 1;
        return render(card);
      }
      const pick = e.target.closest("[data-qa-pick]");
      if (pick) {
        const steps = quickAddSteps(productBySlug(card.dataset.slug));
        const axis = steps[card._qa.step].axis;
        card._qa.picks[axis] = pick.dataset.qaPick;
        if (axis === "colour") {
          card.dataset.colour = pick.dataset.qaPick; // the card now pictures this colour
          showColour(card, pick.dataset.qaPick);
        }
        if (card._qa.step < steps.length - 1) {
          card._qa.step += 1;
          return render(card);
        }
        close(card, true);
        addToBag(card, card._qa.picks);
      }
    });
    // Hovering or focusing a colour previews it on the photo; leaving the
    // list goes back to the card's current colour.
    const preview = (e) => {
      const opt = e.target.closest && e.target.closest("[data-qa-pick]");
      const card = opt && opt.closest("[data-quick-add]");
      if (!card || !card._qa) return;
      const steps = quickAddSteps(productBySlug(card.dataset.slug));
      if (steps[card._qa.step].axis === "colour") showColour(card, opt.dataset.qaPick);
    };
    const unpreview = (e) => {
      const list = e.target.closest && e.target.closest(".qa-panel__list");
      if (!list || list.contains(e.relatedTarget)) return;
      const card = list.closest("[data-quick-add]");
      showColour(card, card.dataset.colour);
    };
    drawer.addEventListener("mouseover", preview);
    drawer.addEventListener("focusin", preview);
    drawer.addEventListener("mouseout", unpreview);
    drawer.addEventListener("focusout", unpreview);

    drawer.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const card = e.target.closest("[data-quick-add]");
      if (card && panelOf(card) && panelOf(card).classList.contains("is-open")) {
        e.stopPropagation(); // close the menu, not the whole drawer
        close(card, true);
      }
    });
    // Close on a click outside any card. Read the path the event was
    // dispatched along, not e.target.closest(): picking an option re-renders
    // the menu, so by now the clicked button is detached from the card.
    document.addEventListener("click", (e) => {
      const inCard = e.composedPath().some((n) => n.matches && n.matches("[data-quick-add]"));
      if (!inCard) closeAll(null);
    });
  }

  /* Regional settings sheet (phones) — see its markup in overlaysHTML.
     Two views in one sheet: the summary (country field + language tabs)
     and the country list. Switching slides between them while the sheet's
     height eases to the new view's. The language tabs are the shared
     [data-lang-tab] buttons, so they apply exactly as on desktop. */
  function setRegion(code) {
    const c = CURRENCIES.find((x) => x.code === code);
    if (!c) return;
    // The header pill (desktop) and its panel's field and list…
    document.querySelectorAll("[data-currency-code]").forEach((el) => { el.textContent = c.code; });
    document.querySelectorAll(".hdr-currency__flag, .cselect__flag").forEach((el) => { el.src = c.flag; });
    document.querySelectorAll("[data-cselect-value]").forEach((el) => { el.textContent = c.label; });
    document.querySelectorAll("[data-currency-pick]").forEach((li) =>
      li.classList.toggle("is-selected", li.dataset.currencyPick === c.code),
    );
    // …the phone menu's shortcut and this sheet.
    document.querySelectorAll("[data-menu-currency], [data-regsheet-code]").forEach((el) => { el.textContent = c.code; });
    document.querySelectorAll("[data-regsheet-country]").forEach((el) => { el.textContent = c.label; });
    document.querySelectorAll("[data-regsheet-pick]").forEach((li) => {
      const on = li.dataset.regsheetPick === c.code;
      li.classList.toggle("is-selected", on);
      li.setAttribute("aria-selected", on ? "true" : "false");
    });
  }
  function initRegSheet() {
    const sheet = document.querySelector('[data-modal="lang"].regsheet');
    if (!sheet) return;
    const track = sheet.querySelector("[data-regsheet-track]");
    const search = sheet.querySelector("[data-regsheet-search]");
    const empty = sheet.querySelector("[data-regsheet-empty]");
    const view = (name) => sheet.querySelector('[data-regsheet-view="' + name + '"]');

    const go = (name, focus) => {
      const next = view(name);
      if (!next || next.classList.contains("is-active")) return;
      const from = track.offsetHeight;
      sheet.querySelectorAll("[data-regsheet-view]").forEach((v) => v.classList.toggle("is-active", v === next));
      // Ease the sheet from the old view's height to the new one's.
      track.style.height = from + "px";
      void track.offsetHeight;
      track.style.height = next.offsetHeight + "px";
      setTimeout(() => { track.style.height = ""; }, 320);
      if (name === "countries" && focus) setTimeout(() => search.focus({ preventScroll: true }), 260);
    };
    sheet.regsheetReset = () => {
      sheet.querySelectorAll("[data-regsheet-view]").forEach((v) =>
        v.classList.toggle("is-active", v.dataset.regsheetView === "main"),
      );
      track.style.height = "";
      if (search) { search.value = ""; search.dispatchEvent(new Event("input")); }
      const code = (document.querySelector("[data-currency-code]") || {}).textContent;
      setRegion((code || "EGP").trim());
      syncLangTabs();
    };

    sheet.addEventListener("click", (e) => {
      const to = e.target.closest("[data-regsheet-go]");
      if (to) return go(to.dataset.regsheetGo, true);
      const pick = e.target.closest("[data-regsheet-pick]");
      if (pick) {
        setRegion(pick.dataset.regsheetPick);
        setTimeout(() => go("main"), 120); // let the tick register first
      }
    });
    sheet.addEventListener("keydown", (e) => {
      const pick = e.target.closest("[data-regsheet-pick]");
      if (pick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        pick.click();
      }
    });
    if (search) {
      search.addEventListener("input", () => {
        const q = search.value.trim().toLowerCase();
        let shown = 0;
        sheet.querySelectorAll("[data-regsheet-pick]").forEach((li) => {
          const hit = !q || (li.dataset.countryName + " " + li.dataset.regsheetPick).toLowerCase().includes(q);
          li.hidden = !hit;
          if (hit) shown++;
        });
        if (empty) empty.hidden = shown > 0;
      });
    }
  }

  function initSteppers(scope) {
    scope.querySelectorAll("[data-stepper]").forEach((st) => {
      /* Once per stepper. kInit runs on boot and again from page scripts
         (the product page calls it after rendering), and a second pass
         bound a second set of listeners, so every +/− moved by 2. */
      if (st.dataset.stepperReady) return;
      st.dataset.stepperReady = "1";
      const qtyEl = st.querySelector("[data-qty]");
      // Only [data-removable] counters (cart line items + cart summary) swap
      // the minus for a trash icon at qty 1; the product-page picker keeps minus.
      const removable = st.hasAttribute("data-removable");
      const decBtn = st.querySelector('[data-step="-1"]');
      const syncDec = () => {
        if (!removable || !decBtn) return;
        const one = (parseInt(qtyEl.textContent, 10) || 1) <= 1;
        decBtn.innerHTML = one ? STEP_ICON_TRASH : STEP_ICON_MINUS;
        decBtn.setAttribute("aria-label", one ? "Remove item" : "Decrease quantity");
      };
      syncDec();
      // Cart-row steppers feed the free-shipping banner, the footer
      // subtotal, and the header cart badge; harmless no-op for every
      // other stepper (PDP qty picker, etc.) since updateFreeShipping()
      // bails out when it finds no cart drawer content, and the removal
      // branch below only fires when a [data-cart-row] ancestor exists.
      const inCartDrawer = !!st.closest('[data-drawer="cart"]');
      st.querySelectorAll("[data-step]").forEach((b) => {
        b.addEventListener("click", () => {
          const delta = parseInt(b.getAttribute("data-step"), 10);
          const cur = parseInt(qtyEl.textContent, 10) || 1;
          // The trash icon at qty 1 is a promise, not just a floor: a
          // removable stepper decrementing past 1 removes the whole row
          // instead of clamping at 1 forever (which is what silently
          // broke "remove item" before this fix).
          if (delta < 0 && cur <= 1 && removable) {
            const row = st.closest("[data-cart-row]");
            if (row) {
              row.remove();
              if (inCartDrawer) {
                bumpCart(delta);
                checkCartEmpty();
                updateFreeShipping();
              } else {
                // Cart page: no badge to bump, but the summary and the
                // empty state both have to keep up with the removal.
                syncCartPageSummary();
                checkCartPageEmpty();
              }
              return;
            }
          }
          qtyEl.textContent = Math.max(1, cur + delta);
          syncDec();
          if (removable && inCartDrawer) bumpCart(delta);
          if (inCartDrawer) updateFreeShipping();
          else syncCartPageSummary();
        });
      });
    });
  }

  /* Flash-sale countdown — ticks Days / Hrs / Min toward a deadline that
     is (days,hrs,min) from first load, so the demo always counts down. */
  function initCountdown(scope) {
    scope.querySelectorAll("[data-countdown]").forEach((el) => {
      if (el.dataset.cdInit) return;
      el.dataset.cdInit = "1";
      const d = parseInt(el.dataset.days || "1", 10);
      const h = parseInt(el.dataset.hrs || "9", 10);
      const m = parseInt(el.dataset.min || "46", 10);
      const deadline =
        new Date().getTime() + (d * 86400 + h * 3600 + m * 60) * 1000;
      const dEl = el.querySelector("[data-cd-days]");
      const hEl = el.querySelector("[data-cd-hrs]");
      const mEl = el.querySelector("[data-cd-min]");
      const sEl = el.querySelector("[data-cd-sec]");
      const pad = (n) => String(n).padStart(2, "0");
      function tick() {
        let diff = Math.max(0, deadline - new Date().getTime());
        const days = Math.floor(diff / 86400000);
        diff -= days * 86400000;
        const hrs = Math.floor(diff / 3600000);
        diff -= hrs * 3600000;
        const mins = Math.floor(diff / 60000);
        diff -= mins * 60000;
        const secs = Math.floor(diff / 1000);
        if (dEl) dEl.textContent = pad(days);
        if (hEl) hEl.textContent = pad(hrs);
        if (mEl) mEl.textContent = pad(mins);
        if (sEl) sEl.textContent = pad(secs);
      }
      tick();
      setInterval(tick, 1000);
    });
  }

  /* ---------------------------------------------------------------
     Checkout steps — the page ships a two-tab stepper (Shipping →
     Payment) but everything used to render at once. Sections carry
     [data-checkout-step="1"|"2"]; step 1 collects shipping + personal
     details and ends in "Continue to payment", step 2 reveals the
     payment methods and the real "Place order" submit.

     Both steps live inside ONE <form>, so step 1's CTA must be
     type="button" — a submit there would fire the form's demo handler
     and skip straight to thank-you.html without ever showing payment.
     --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
     Card details form (checkout) — revealed only while the "Credit /
     debit card" method is selected, so the step stays short for the
     methods that need no input. Also formats the three fields as the
     user types (groups of 4 / MM/YY / digits only) and keeps them out
     of validation while hidden, since hidden required fields block
     submit with no visible field to fix.
     --------------------------------------------------------------- */
  function initCardForm(scope) {
    const form = scope.querySelector("[data-card-form]");
    if (!form || form.dataset.cardReady) return;
    form.dataset.cardReady = "1";
    const radios = document.querySelectorAll('input[name="payment"]');
    if (!radios.length) return;

    const sync = () => {
      const cc = document.querySelector('input[name="payment"][value="cc"]');
      const on = !!cc && cc.checked && !cc.disabled;
      form.hidden = !on;
      if (on) {
        form.classList.remove("is-in");
        void form.offsetWidth; /* restart the reveal */
        form.classList.add("is-in");
      }
    };
    radios.forEach((r) => r.addEventListener("change", sync));
    sync();

    const digits = (v) => v.replace(/\D/g, "");
    const num = form.querySelector("[data-card-number]");
    if (num)
      num.addEventListener("input", () => {
        num.value = digits(num.value).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
      });
    const exp = form.querySelector("[data-card-exp]");
    if (exp)
      exp.addEventListener("input", () => {
        const d = digits(exp.value).slice(0, 4);
        exp.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
      });
    const cvv = form.querySelector("[data-card-cvv]");
    if (cvv) cvv.addEventListener("input", () => (cvv.value = digits(cvv.value).slice(0, 4)));
  }

  function initCheckoutSteps(scope) {
    const form = scope.querySelector("[data-checkout-next]") && document.querySelector("form");
    if (!form || form.dataset.stepsReady) return;
    const nextBtn = document.querySelector("[data-checkout-next]");
    const backBtn = document.querySelector("[data-checkout-back]");
    const submitBtn = document.querySelector("[data-checkout-submit]");
    if (!nextBtn || !submitBtn) return;
    form.dataset.stepsReady = "1";

    function show(step) {
      document.querySelectorAll("[data-checkout-step]").forEach((el) => {
        el.hidden = el.getAttribute("data-checkout-step") !== String(step);
      });
      nextBtn.hidden = step !== 1;
      submitBtn.hidden = step !== 2;
      if (backBtn) backBtn.hidden = step !== 2;
      /* Stepper: steps before the current one are .is-done (tick + filled
         connector), the current one is .is-current, the rest stay plain. */
      document.querySelectorAll("[data-step-tab]").forEach((tab) => {
        const n = parseInt(tab.getAttribute("data-step-tab"), 10);
        tab.classList.toggle("is-current", n === step);
        tab.classList.toggle("is-done", n < step);
      });
      document.querySelectorAll("[data-step-line]").forEach((line) => {
        line.classList.toggle("is-done", step > 1);
      });
      /* The page heading follows the step. Leaving "Shipping Information"
         above a card-number field is the kind of small wrongness that makes
         a checkout feel unfinished — and on a payment screen, unfinished
         reads as untrustworthy. */
      document.querySelectorAll("[data-step-title]").forEach((el) => {
        el.textContent = step === 2 ? "Payment Information" : "Shipping Information";
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    nextBtn.addEventListener("click", () => {
      /* Honour the browser's own required-field validation for step 1
         before advancing — otherwise a user could skip past empty
         address fields and only get stopped at the very end. */
      const stepOne = [...document.querySelectorAll('[data-checkout-step="1"]')];
      for (const section of stepOne) {
        for (const field of section.querySelectorAll("input, select, textarea")) {
          if (!field.checkValidity()) {
            field.reportValidity();
            return;
          }
        }
      }
      show(2);
    });
    if (backBtn) backBtn.addEventListener("click", () => show(1));
    document.querySelectorAll("[data-step-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        // Only allow jumping BACK to step 1 via the tabs; advancing must
        // go through the CTA so validation still runs.
        if (tab.getAttribute("data-step-tab") === "1") show(1);
      });
    });

    show(1);
  }

  /* ---------------------------------------------------------------
     Checkout option rows (.optrow) + their pickers.

     Two groups, both [data-optgroup]: shipping TYPE (deliver / pickup)
     and shipping DATE (asap / schedule). Selecting a row that carries
     [data-opens] also opens its picker, and whatever the picker returns
     is written back into that row's [data-opt-meta] on the right.
     --------------------------------------------------------------- */
  /* Branch tree — city → area → the branches assigned to that area.
     Mirrors the BRANCHES list on branches.html, with a couple of extra
     stores per area so the picker has something to actually filter. */
  const STORE_TREE = {
    Cairo: {
      "New Cairo": ["Percaal Cairo Festival City — Level 1", "Percaal Point 90 — 90th St"],
      Maadi: ["Percaal Maadi — Road 9"],
      Zamalek: ["Percaal Zamalek — 16 Brazil St"],
      Heliopolis: ["Percaal Korba — Baghdad St"],
    },
    Giza: {
      "Sheikh Zayed": ["Percaal Arkan — Arkan Plaza", "Percaal Americana Plaza"],
      Mohandessin: ["Percaal Mohandessin — Gameat El Dowal St"],
    },
    Alexandria: {
      Smouha: ["Percaal Smouha — Green Plaza"],
      "San Stefano": ["Percaal San Stefano — Level 2"],
    },
    "North Coast": {
      "Sidi Abdel Rahman": ["Percaal Marassi — Marina Walk"],
    },
  };
  const SCHED_SLOTS = [
    "11:00 AM – 1:00 PM",
    "12:00 PM – 2:00 PM",
    "1:00 PM – 3:00 PM",
    "3:00 PM – 5:00 PM",
    "5:00 PM – 7:00 PM",
    "7:00 PM – 9:00 PM",
  ];

  /* ---------------------------------------------------------------
     Checkout mobile bar — on phones the order summary is a long card the
     shopper has to scroll past to reach the CTA. Dock it to a fixed bar
     at the bottom instead: collapsed it shows just the total and a +,
     tapping expands the full summary, and the step CTA rides along.

     The summary and the CTAs are MOVED, not duplicated — syncSummary()
     resolves [data-summary-*] with querySelector, so a second copy would
     silently stop updating. At lg they move back to the sticky sidebar.
     --------------------------------------------------------------- */
  function initCheckoutMobileBar(scope) {
    const summary = scope.querySelector("[data-order-summary]");
    const actions = scope.querySelector("[data-checkout-actions]");
    /* The summary lives in its own column beside the form, not inside
       it, so closest() finds nothing — fall back to the form the page
       marks explicitly. The bar has to end up INSIDE that form or the
       relocated submit button stops submitting it. */
    const form =
      (summary && summary.closest("form")) ||
      scope.querySelector("[data-checkout-form], [data-payment-form]");
    if (!summary || !actions || !form || form.dataset.barReady) return;
    form.dataset.barReady = "1";

    // Remember exactly where each block came from so lg puts it back.
    const home = (el) => ({ parent: el.parentNode, next: el.nextSibling });
    const summaryHome = home(summary);
    const actionsHome = home(actions);

    const bar = document.createElement("div");
    bar.className = "checkout-bar";
    bar.innerHTML = `
      <div class="checkout-bar__panel" data-bar-panel></div>
      <button type="button" class="checkout-bar__head" data-bar-toggle aria-expanded="false">
        <span class="checkout-bar__label">Order Summary</span>
        <span class="checkout-bar__total" data-bar-total></span>
        <span class="checkout-bar__plus" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" class="w-4 h-4"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
        </span>
      </button>
      <div class="checkout-bar__actions" data-bar-actions></div>`;
    form.appendChild(bar); // inside the form, so the submit button still submits

    const panel = bar.querySelector("[data-bar-panel]");
    const actionSlot = bar.querySelector("[data-bar-actions]");
    const toggle = bar.querySelector("[data-bar-toggle]");
    const totalOut = bar.querySelector("[data-bar-total]");
    const totalSrc = scope.querySelector("[data-summary-total]");

    /* Mirror the real total rather than adding a second [data-summary-total]:
       an observer catches every write (promo, wallet, step change) without
       syncSummary needing to know this bar exists. */
    if (totalSrc) {
      const mirror = () => (totalOut.textContent = totalSrc.textContent);
      mirror();
      new MutationObserver(mirror).observe(totalSrc, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }

    const mq = window.matchMedia("(max-width: 1023px)");
    let docked = false;
    let collapsedH = 0;

    /* Pad the form by the COLLAPSED height only — measuring while the panel
       is open would leave a viewport-sized gap under the page. */
    function setPad() {
      if (!mq.matches) {
        form.style.paddingBottom = "";
        return;
      }
      if (!bar.classList.contains("is-open")) collapsedH = bar.offsetHeight;
      form.style.paddingBottom = collapsedH + 16 + "px";
    }

    function apply() {
      if (mq.matches && !docked) {
        panel.appendChild(summary);
        actionSlot.appendChild(actions);
        summary.classList.add("checkout-bar__summary");
        docked = true;
      } else if (!mq.matches && docked) {
        summaryHome.parent.insertBefore(summary, summaryHome.next);
        actionsHome.parent.insertBefore(actions, actionsHome.next);
        summary.classList.remove("checkout-bar__summary");
        bar.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        docked = false;
      }
      setPad();
    }

    toggle.addEventListener("click", () => {
      const open = bar.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      setPad();
    });
    mq.addEventListener("change", apply);
    window.addEventListener("resize", setPad, { passive: true });
    apply();
  }

  function initCheckoutOptions(scope) {
    const groups = scope.querySelectorAll("[data-optgroup]");
    if (!groups.length) return;

    /* ---- row selection ---- */
    groups.forEach((group) => {
      if (group.dataset.optReady) return;
      group.dataset.optReady = "1";
      const rows = [...group.querySelectorAll(".optrow")];
      rows.forEach((row) => {
        row.addEventListener("click", () => {
          rows.forEach((r) => r.classList.toggle("is-selected", r === row));
          const opens = row.getAttribute("data-opens");
          if (opens) openOverlay(opens);
        });
      });
    });

    const meta = (key) => document.querySelector('[data-opt-meta="' + key + '"]');
    function setMeta(key, text) {
      const el = meta(key);
      if (!el) return;
      el.textContent = text;
      el.classList.remove("optrow__meta--prompt"); // resolved — no longer a prompt
    }

    /* ---- "Deliver to my address" mirrors the address selects below ---- */
    const addressSection = document.querySelector('[data-checkout-step="1"] .grid.grid-cols-1');
    if (addressSection && !addressSection.dataset.mirrorReady) {
      addressSection.dataset.mirrorReady = "1";
      const selects = [...addressSection.querySelectorAll("select")];
      const syncAddress = () => {
        const [, area, district] = selects.map((s) => s.options[s.selectedIndex].textContent.trim());
        const el = meta("deliver");
        if (el) el.textContent = [area, district].filter(Boolean).join(", ");
      };
      selects.forEach((s) => s.addEventListener("change", syncAddress));
      syncAddress();
    }

    /* ---- store picker ---- */
    const citySel = document.querySelector("[data-store-city]");
    const areaSel = document.querySelector("[data-store-area]");
    const storeList = document.querySelector("[data-store-list]");
    const storeConfirm = document.querySelector("[data-store-confirm]");
    if (citySel && areaSel && storeList && storeConfirm && !citySel.dataset.storeReady) {
      citySel.dataset.storeReady = "1";
      let pickedStore = null;

      // These rebuild <option>s at runtime, so the enhanced menu built by
      // initSelects() has to be told to re-read them.
      const resync = (el) => el._uiSelectRefresh && el._uiSelectRefresh();
      const fillCities = () => {
        citySel.innerHTML = Object.keys(STORE_TREE)
          .map((c) => `<option>${esc(c)}</option>`)
          .join("");
        resync(citySel);
      };
      const fillAreas = () => {
        const areas = Object.keys(STORE_TREE[citySel.value] || {});
        areaSel.innerHTML = areas.map((a) => `<option>${esc(a)}</option>`).join("");
        resync(areaSel);
      };
      const fillStores = () => {
        const list = (STORE_TREE[citySel.value] || {})[areaSel.value] || [];
        pickedStore = null;
        storeConfirm.disabled = true;
        storeList.innerHTML = list.length
          ? list
              .map(
                (s) => `
          <button type="button" class="pickrow" data-store="${esc(s)}">
            <span class="pickrow__radio"></span>
            <span class="text-sm text-primaryDark">${esc(s)}</span>
          </button>`,
              )
              .join("")
          : '<p class="py-6 text-center text-sm text-gray-500">No stores in this area yet.</p>';
      };

      fillCities();
      fillAreas();
      fillStores();
      citySel.addEventListener("change", () => {
        fillAreas();
        fillStores();
      });
      areaSel.addEventListener("change", fillStores);

      storeList.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-store]");
        if (!btn) return;
        pickedStore = btn.getAttribute("data-store");
        storeList.querySelectorAll(".pickrow").forEach((r) => r.classList.toggle("is-selected", r === btn));
        storeConfirm.disabled = false;
      });
      storeConfirm.addEventListener("click", () => {
        if (!pickedStore) return;
        setMeta("pickup", pickedStore);
        closeOverlay();
      });
    }

    /* ---- schedule picker ---- */
    const daysWrap = document.querySelector("[data-sched-days]");
    const slotsWrap = document.querySelector("[data-sched-slots]");
    const schedConfirm = document.querySelector("[data-sched-confirm]");
    if (daysWrap && slotsWrap && schedConfirm && !daysWrap.dataset.schedReady) {
      daysWrap.dataset.schedReady = "1";
      let pickedDay = null;
      let pickedSlot = null;

      // Next 7 days starting today.
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
          key: String(i),
          label: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          long: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        };
      });

      const renderSlots = () => {
        pickedSlot = null;
        schedConfirm.disabled = true;
        slotsWrap.innerHTML = SCHED_SLOTS.map(
          (s) => `
          <button type="button" class="pickrow" data-slot="${esc(s)}">
            <span class="pickrow__radio"></span>
            <span class="text-sm text-primaryDark">${esc(s)}</span>
          </button>`,
        ).join("");
      };

      daysWrap.innerHTML = days
        .map(
          (d, i) => `
        <button type="button" class="pickchip${i === 0 ? " is-selected" : ""}" data-day="${d.key}" data-day-label="${esc(d.long)}">
          <span class="block text-sm font-semibold text-primaryDark">${esc(d.label)}</span>
        </button>`,
        )
        .join("");
      pickedDay = days[0];
      renderSlots();

      /* Day-strip arrows. Scrolls by ~2 chips a press and greys out at each
         end so the control reflects whether there's anything left to reach. */
      const prevBtn = document.querySelector("[data-sched-prev]");
      const nextBtn = document.querySelector("[data-sched-next]");
      if (prevBtn && nextBtn) {
        const step = () => {
          const chip = daysWrap.querySelector(".pickchip");
          return chip ? (chip.getBoundingClientRect().width + 8) * 2 : 200;
        };
        const syncNav = () => {
          const max = daysWrap.scrollWidth - daysWrap.clientWidth - 1;
          prevBtn.disabled = daysWrap.scrollLeft <= 0;
          nextBtn.disabled = max <= 0 || daysWrap.scrollLeft >= max;
        };
        prevBtn.addEventListener("click", () => daysWrap.scrollBy({ left: -step(), behavior: "smooth" }));
        nextBtn.addEventListener("click", () => daysWrap.scrollBy({ left: step(), behavior: "smooth" }));
        daysWrap.addEventListener("scroll", () => window.requestAnimationFrame(syncNav), { passive: true });
        window.addEventListener("resize", syncNav);
        syncNav();
        // Widths are 0 while the modal is still hidden, so re-check on open.
        document.querySelectorAll('[data-opt="later"]').forEach((r) => r.addEventListener("click", () => setTimeout(syncNav, 60)));
      }

      daysWrap.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-day]");
        if (!btn) return;
        daysWrap.querySelectorAll(".pickchip").forEach((c) => c.classList.toggle("is-selected", c === btn));
        pickedDay = { long: btn.getAttribute("data-day-label") };
        renderSlots();
      });
      slotsWrap.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-slot]");
        if (!btn) return;
        pickedSlot = btn.getAttribute("data-slot");
        slotsWrap.querySelectorAll(".pickrow").forEach((r) => r.classList.toggle("is-selected", r === btn));
        schedConfirm.disabled = false;
      });
      schedConfirm.addEventListener("click", () => {
        if (!pickedDay || !pickedSlot) return;
        setMeta("later", pickedDay.long + " | " + pickedSlot);
        closeOverlay();
      });
    }
  }

  function initDemoForms(scope) {
    scope.querySelectorAll("[data-newsletter]").forEach((f) =>
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        f.reset();
      }),
    );
    scope.querySelectorAll("[data-location-form]").forEach((f) =>
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        // Selects are ordered City, Area, District; the pill shows "Area, City".
        const [city, area] = [...f.querySelectorAll("select")].map((s) => s.value);
        commitLocation(area && city ? area + ", " + city : DEFAULT_LOCATION);
        closeOverlay();
        document
          .querySelectorAll("[data-locmenu].is-open")
          .forEach((w) => w.classList.remove("is-open"));
      }),
    );
    scope.querySelectorAll("[data-demo-form]").forEach((f) =>
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        if (f.getAttribute("data-reset") !== "false") f.reset();
        // Mock success flow: navigate to the next page if requested.
        const redirect = f.getAttribute("data-redirect");
        if (redirect) setTimeout(() => (window.location.href = redirect), 250);
      }),
    );

    // Reviews "Show more / less": reveal/hide [data-review-extra] cards.
    scope.querySelectorAll("[data-reviews-toggle]").forEach((btn) => {
      const section = btn.closest("section");
      const extras = section ? [...section.querySelectorAll("[data-review-extra]")] : [];
      const label = btn.querySelector("[data-reviews-toggle-label]");
      if (!extras.length) {
        btn.hidden = true; // nothing to reveal
        return;
      }
      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        extras.forEach((e) => (e.hidden = expanded));
        btn.setAttribute("aria-expanded", String(!expanded));
        btn.classList.toggle("is-expanded", !expanded);
        if (label) label.textContent = expanded ? "Show more reviews" : "Show less";
      });
    });

    // Review sheet: star picker (click star N → fill 1..N) + submit closes the sheet.
    scope.querySelectorAll("[data-review-stars]").forEach((group) => {
      const stars = [...group.querySelectorAll("[data-review-star]")];
      const paint = (n) =>
        stars.forEach((s, i) => {
          s.classList.toggle("text-cta", i < n);
          s.classList.toggle("text-gray-300", i >= n);
        });
      stars.forEach((s) =>
        s.addEventListener("click", () => {
          group.dataset.rating = s.getAttribute("data-review-star");
          paint(Number(group.dataset.rating));
        }),
      );
    });
    scope.querySelectorAll("[data-review-form]").forEach((f) =>
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        closeOverlay();
        f.reset();
        const group = f.querySelector("[data-review-stars]");
        if (group) {
          group.dataset.rating = "";
          group.querySelectorAll("[data-review-star]").forEach((s) => {
            s.classList.remove("text-cta");
            s.classList.add("text-gray-300");
          });
        }
      }),
    );
  }

  /* ---------------------------------------------------------------
     STICKY HEADER

     On desktop the category rail stays pinned on every page: the header
     is sticky with a negative top equal to the rail's distance from the
     header's top (--rail-top), so the announcement and logo row scroll off
     and the rail stops at the viewport edge. Once it is pinned the header
     gets .is-stuck, which reveals the rail's own cart.

     Also published: --header-h (the full header) and --sticky-top (the
     pinned rail's height, 0 where nothing pins), so other sticky columns
     can sit below the rail instead of under it.
     --------------------------------------------------------------- */
  function initStickyNav() {
    const bar = document.querySelector(".site-header");
    if (!bar) return;

    const rail = bar.querySelector(".hdr-rail");
    const root = document.documentElement.style;
    // offsetParent is null while the rail is hidden (below 1024px); the
    // mobile row pins there instead.
    const railShown = () => !!(rail && rail.offsetParent);
    const row = bar.querySelector(".hdr-mobile");
    const rowShown = () => !!(row && row.offsetParent);
    // The rail's distance from the header's top. Summed up the offset chain
    // rather than read off getBoundingClientRect, which the arrival
    // animation's transform would skew.
    const railTop = () => {
      let y = 0;
      for (let el = rail; el && el !== bar; el = el.offsetParent) y += el.offsetTop;
      return y;
    };

    const publish = () => {
      root.setProperty("--header-h", Math.round(bar.getBoundingClientRect().height) + "px");
      root.setProperty("--rail-top", (railShown() ? railTop() : 0) + "px");
      // How far down the header the mobile row starts: the announcement
      // bar above it, which scrolls away while the row stays pinned.
      root.setProperty("--mobile-top", (rowShown() ? row.offsetTop : 0) + "px");
      root.setProperty(
        "--sticky-top",
        (railShown() ? rail.offsetHeight : rowShown() ? row.offsetHeight : 0) + "px"
      );
      onScroll();
    };

    const onScroll = () => {
      const pinned = railShown()
        ? rail.getBoundingClientRect().top <= 0.5
        : rowShown()
          ? row.getBoundingClientRect().top <= 0.5
          : window.scrollY > 4;
      bar.classList.toggle("is-stuck", pinned);
    };

    /* Re-measure whenever the header changes size: a dismissed
       announcement, webfonts landing, or crossing the mobile breakpoint. */
    new ResizeObserver(publish).observe(bar);
    publish();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------------
     Language / direction (EN ⇄ AR) — flips the document to RTL and
     persists the choice. Copy stays English in this static build, but
     the layout genuinely mirrors so RTL support is demonstrable.
     --------------------------------------------------------------- */
  function initialLang() {
    try {
      return localStorage.getItem("percaal-lang") === "ar" ? "ar" : "en";
    } catch (e) {
      return "en";
    }
  }

  /* Mark the active language tab in the header's regional panel. */
  function syncLangTabs() {
    const lang = currentLang();
    document.querySelectorAll("[data-lang-tab]").forEach((t) => {
      const on = t.getAttribute("data-lang-tab") === lang;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  /* Filter the country list as you type. Matches the country name and
     its currency code, so "egy" and "egp" both find Egypt. */
  function initCountrySearch(scope) {
    scope.querySelectorAll("[data-country-search]").forEach((input) => {
      if (input.dataset.searchReady) return;
      input.dataset.searchReady = "1";
      const panel = input.closest("[data-currency-menu]");
      const list = panel.querySelector("[data-country-list]");
      const empty = panel.querySelector("[data-country-empty]");

      input.addEventListener("input", () => {
        const q = input.value.trim().toLowerCase();
        let shown = 0;
        list.querySelectorAll("li").forEach((li) => {
          const hay = (
            li.getAttribute("data-country-name") +
            " " +
            li.getAttribute("data-currency-pick")
          ).toLowerCase();
          const hit = !q || hay.indexOf(q) > -1;
          li.hidden = !hit;
          if (hit) shown++;
        });
        if (empty) empty.hidden = shown > 0;
      });

      /* Typing is the point of the field, so clicking it must not fall
         through to the handler that closes the panel. */
      input.addEventListener("click", (e) => e.stopPropagation());
    });
  }

  function applyLang(lang) {
    lang = lang === "ar" ? "ar" : "en";
    const html = document.documentElement;
    /* Flip direction with transitions off. Otherwise everything positioned
       with a logical side animates across the page, most visibly the closed
       drawers, which sit just off one edge and would sweep over to the
       other. The class covers the style recalc that the reflow forces, and
       comes off two frames later, once the new layout has painted. */
    html.classList.add("is-switching-lang");
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    void html.offsetWidth;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => html.classList.remove("is-switching-lang")),
    );
    try {
      localStorage.setItem("percaal-lang", lang);
    } catch (e) {
      /* storage unavailable — session-only toggle */
    }
    document.querySelectorAll("[data-lang]").forEach((b) => {
      const active = b.getAttribute("data-lang") === lang;
      b.classList.toggle("bg-cta", active);
      b.classList.toggle("text-white", active);
      b.classList.toggle("shadow-[0px_1px_2px_rgba(0,0,0,0.05)]", active);
      b.classList.toggle("bg-transparent", !active);
      b.classList.toggle("text-white/80", !active);
    });
    /* Logo swap for a language-specific lockup. Percaal's guideline supplies
       only the Latin wordmark, so nothing currently carries data-logo-ar and
       this loop is inert — it stays so that dropping an Arabic lockup into
       logoMark() is the only change needed to light it up. */
    document.querySelectorAll("[data-logo-en]").forEach((img) => {
      const src = img.getAttribute(lang === "ar" ? "data-logo-ar" : "data-logo-en");
      if (src && img.getAttribute("src") !== src) img.setAttribute("src", src);
    });
    updateLangLabel();
    syncLangTabs();
  }
  window.kSetLang = applyLang;

  function currentLang() {
    return document.documentElement.getAttribute("dir") === "rtl" ? "ar" : "en";
  }

  /* Country/language selector state — the header label reads "EN | Egy". */
  const COUNTRY = {
    egy: { short: "Egy", flag: "🇪🇬" },
    ksa: { short: "Ksa", flag: "🇸🇦" },
  };
  function currentCountry() {
    try {
      return localStorage.getItem("percaal-country") === "ksa" ? "ksa" : "egy";
    } catch (e) {
      return "egy";
    }
  }
  function applyCountry(country) {
    country = country === "ksa" ? "ksa" : "egy";
    try {
      localStorage.setItem("percaal-country", country);
    } catch (e) {
      /* storage unavailable */
    }
    updateLangLabel();
  }
  function updateLangLabel() {
    const c = COUNTRY[currentCountry()] || COUNTRY.egy;
    const langShort = currentLang() === "ar" ? "ع" : "EN";
    /* The redesign's header shows the language on its own — the country
       already reads off the flag beside the currency, so appending it here
       produced "EN | Egy" where the design says just "EN". */
    document.querySelectorAll("[data-lang-label]").forEach((el) => {
      el.textContent = langShort;
    });
    document.querySelectorAll("[data-lang-flag]").forEach((el) => {
      el.textContent = c.flag;
    });
  }
  /* Preselect the current country + language when the modal opens. */
  function syncLangModal() {
    const lang = currentLang();
    const country = currentCountry();
    document.querySelectorAll("[data-country]").forEach((b) => {
      b.classList.toggle("is-active", b.getAttribute("data-country") === country);
    });
    document.querySelectorAll("[data-lang-pick]").forEach((b) => {
      b.classList.toggle("is-active", b.getAttribute("data-lang-pick") === lang);
    });
  }

  /* ---------------------------------------------------------------
     Product card — add-to-cart counter (Simple products)
     --------------------------------------------------------------- */
  // Starts equal to the actual unit count in DEMO_CART_ITEMS (1+1=2), not
  // an arbitrary seed — so it reaches exactly 0 when the drawer empties.
  let cartCount = DEMO_CART_ITEMS.reduce((n, it) => n + it.qty, 0);
  /* The brand mark always stays — on the header bag buttons
     AND the sticky/floating one. Only the dark count badge changes: it
     shows the number while there are items, and a small white bag glyph
     once the cart is empty (rather than a bare "0", which reads as a
     count rather than a state). One code path covers every badge on the
     page because they all carry [data-cart-count]. */
  function setCartCount(n) {
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      if (n > 0) {
        el.textContent = n;
        el.removeAttribute("aria-label");
      } else {
        el.innerHTML = ICON.bagBadge;
        el.setAttribute("aria-label", "Cart is empty");
      }
    });
  }
  function bumpCart(delta) {
    cartCount = Math.max(0, cartCount + delta);
    setCartCount(cartCount);
  }
  function pwQty(w) {
    const q = w.querySelector("[data-qty]");
    return q ? parseInt(q.textContent, 10) || 0 : 0;
  }
  function pwSetQty(w, q) {
    const qtyEl = w.querySelector("[data-qty]");
    if (qtyEl) qtyEl.textContent = q;
    // qty 1 → trash icon; qty ≥ 2 → minus icon
    const icon = w.querySelector("[data-dec-icon]");
    if (icon)
      icon.setAttribute(
        "src",
        q <= 1 ? "icons/cancel-01.svg" : "images/icons/minus-sign.svg",
      );
  }
  function pwShowCounter(w, show) {
    const add = w.querySelector("[data-add-btn]");
    const counter = w.querySelector("[data-counter]");
    if (add) add.classList.toggle("hidden", show);
    if (counter) {
      counter.classList.toggle("hidden", !show);
      counter.classList.toggle("flex", show);
      if (show) {
        counter.classList.remove("is-pop");
        void counter.offsetWidth; // reflow so the elastic pop replays
        counter.classList.add("is-pop");
      } else {
        counter.classList.remove("is-pop");
      }
    }
  }

  /* ---------------------------------------------------------------
     Global click / key delegation
     --------------------------------------------------------------- */
  function initDelegation() {
    /* Dedicated menu-close listener: closes the location + pages dropdowns
       on ANY click outside them. Kept separate from the big delegation
       below because handlers there `return` early (e.g. add-to-cart),
       which used to bypass the close and leave the cities dropdown open. */
    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-locmenu]")) {
        document
          .querySelectorAll("[data-locmenu].is-open")
          .forEach((w) => w.classList.remove("is-open"));
      }
      if (!e.target.closest("[data-pagesmenu]")) {
        document
          .querySelectorAll("[data-pagesmenu].is-open")
          .forEach((w) => w.classList.remove("is-open"));
      }
    });
    document.addEventListener("click", (e) => {
      /* --- Product page wishlist heart. Saving fills it, bounces it and
         throws a ring of short lines out from it; un-saving just returns
         it to the outline. The lines are built on first use. --- */
      const wish = e.target.closest(".pdp__fav");
      if (wish) {
        const on = wish.getAttribute("aria-pressed") !== "true";
        wish.setAttribute("aria-pressed", String(on));
        wish.setAttribute("aria-label", on ? "Remove from wishlist" : "Save to wishlist");
        if (on) {
          if (!wish.querySelector(".pdp__fav-burst")) {
            wish.insertAdjacentHTML(
              "beforeend",
              `<span class="pdp__fav-burst" aria-hidden="true">${Array.from({ length: 8 }, (_, i) => `<i style="--a:${i * 45}deg"></i>`).join("")}</span>`,
            );
          }
          wish.classList.remove("is-saved-anim");
          void wish.offsetWidth; // restart the animation on a quick re-save
          wish.classList.add("is-saved-anim");
          clearTimeout(wish._favTimer);
          wish._favTimer = setTimeout(() => wish.classList.remove("is-saved-anim"), 700);
        } else {
          wish.classList.remove("is-saved-anim");
        }
        return;
      }

      /* --- Product card add-to-cart (preventDefault stops the card link) --- */
      const favBtn = e.target.closest("[data-fav]");
      if (favBtn) {
        e.preventDefault();
        favBtn.classList.toggle("is-fav");
        return;
      }
      const addBtn = e.target.closest("[data-add-btn]");
      if (addBtn) {
        e.preventDefault();
        const w = addBtn.closest("[data-add-widget]");
        const srcRect = addBtn.getBoundingClientRect(); // capture before hiding
        pwShowCounter(w, true);
        pwSetQty(w, 1);
        flyToCart(srcRect, () => bumpCart(1)); // badge bumps when the dot lands
        return;
      }
      const incBtn = e.target.closest("[data-inc]");
      if (incBtn) {
        e.preventDefault();
        const w = incBtn.closest("[data-add-widget]");
        pwSetQty(w, pwQty(w) + 1);
        bumpCart(1);
        return;
      }
      const decBtn = e.target.closest("[data-dec]");
      if (decBtn) {
        e.preventDefault();
        const w = decBtn.closest("[data-add-widget]");
        const q = pwQty(w);
        if (q <= 1) {
          pwShowCounter(w, false);
          pwSetQty(w, 0);
        } else {
          pwSetQty(w, q - 1);
        }
        bumpCart(-1);
        return;
      }

      const langBtn = e.target.closest("[data-lang]");
      if (langBtn) {
        e.preventDefault();
        applyLang(langBtn.getAttribute("data-lang"));
        return;
      }
      const langCycle = e.target.closest("[data-lang-cycle]");
      if (langCycle) {
        e.preventDefault();
        applyLang(currentLang() === "ar" ? "en" : "ar");
        return;
      }
      // Country/Language modal: single-select within each group, then Choose applies
      const countryOpt = e.target.closest("[data-country]");
      if (countryOpt) {
        e.preventDefault();
        document
          .querySelectorAll("[data-country]")
          .forEach((b) => b.classList.toggle("is-active", b === countryOpt));
        return;
      }
      const langPick = e.target.closest("[data-lang-pick]");
      if (langPick) {
        e.preventDefault();
        document
          .querySelectorAll("[data-lang-pick]")
          .forEach((b) => b.classList.toggle("is-active", b === langPick));
        return;
      }
      const langConfirm = e.target.closest("[data-lang-confirm]");
      if (langConfirm) {
        e.preventDefault();
        const c = document.querySelector("[data-country].is-active");
        const l = document.querySelector("[data-lang-pick].is-active");
        applyCountry(c ? c.getAttribute("data-country") : currentCountry());
        applyLang(l ? l.getAttribute("data-lang-pick") : currentLang());
        closeOverlay();
        return;
      }
      // Pages dropdown: toggle on the button, close when clicking elsewhere
      const pagesToggle = e.target.closest("[data-pages-toggle]");
      if (pagesToggle) {
        e.preventDefault();
        const wrap = pagesToggle.closest("[data-pagesmenu]");
        const wasOpen = wrap.classList.contains("is-open");
        document
          .querySelectorAll("[data-pagesmenu].is-open")
          .forEach((w) => w.classList.remove("is-open"));
        if (!wasOpen) wrap.classList.add("is-open");
        return;
      }
      if (!e.target.closest("[data-pagesmenu]")) {
        document
          .querySelectorAll("[data-pagesmenu].is-open")
          .forEach((w) => w.classList.remove("is-open"));
      }
      // Location dropdown (desktop): toggle on the pill, close when clicking outside
      /* Announcement bar dismiss. Remembered for the session only — the
         offer is still true on the next visit, so persisting it forever
         would hide a live promotion. */
      const annClose = e.target.closest("[data-dismiss-announce]");
      if (annClose) {
        e.preventDefault();
        const hdr = annClose.closest(".site-header");
        if (hdr) hdr.classList.add("is-announce-dismissed");
        try {
          sessionStorage.setItem("percaal-announce", "off");
        } catch (err) {
          /* private mode — it just reappears on the next page */
        }
        return;
      }

      /* Currency menu. */
      const curToggle = e.target.closest("[data-currency-toggle]");
      if (curToggle) {
        e.preventDefault();
        const wrap = curToggle.closest("[data-currency]");
        const open = wrap.classList.toggle("is-open");
        curToggle.setAttribute("aria-expanded", open ? "true" : "false");
        return;
      }
      /* Language tabs in the regional panel apply straight away — there
         is no confirm button here, unlike the mobile sheet. */
      const langTab = e.target.closest("[data-lang-tab]");
      if (langTab) {
        e.preventDefault();
        applyLang(langTab.getAttribute("data-lang-tab"));
        syncLangTabs();
        const wrap = langTab.closest("[data-currency]");
        if (wrap) wrap.classList.remove("is-open");
        return;
      }

      /* The country combobox inside the regional panel. */
      const cselToggle = e.target.closest("[data-cselect-toggle]");
      if (cselToggle) {
        e.preventDefault();
        const sel = cselToggle.closest("[data-cselect]");
        const open = sel.classList.toggle("is-open");
        cselToggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
          const q = sel.querySelector("[data-country-search]");
          if (q) setTimeout(() => q.focus(), 60);
        }
        return;
      }

      const curPick = e.target.closest("[data-currency-pick]");
      if (curPick) {
        e.preventDefault();
        const wrap = curPick.closest("[data-currency]");
        const code = curPick.getAttribute("data-currency-pick");
        const name = curPick.getAttribute("data-country-name") || "";
        const src = curPick.querySelector("img");

        /* The header pill shows the currency; the field inside the panel
           shows the country it came from. */
        const label = wrap && wrap.querySelector("[data-currency-code]");
        const flag = wrap && wrap.querySelector(".hdr-currency__flag");
        if (label) label.textContent = code;
        if (flag && src) flag.src = src.getAttribute("src");
        setRegion(code); // and everywhere else that shows it

        const sel = curPick.closest("[data-cselect]");
        if (sel) {
          const value = sel.querySelector("[data-cselect-value]");
          const fieldFlag = sel.querySelector(".cselect__flag");
          if (value) value.textContent = name;
          if (fieldFlag && src) fieldFlag.src = src.getAttribute("src");
          sel.querySelectorAll("[data-currency-pick]").forEach((li) =>
            li.classList.toggle("is-selected", li === curPick),
          );
          /* Only the list closes — the language tabs below stay put so
             both settings can be changed in one visit. */
          sel.classList.remove("is-open");
          const t = sel.querySelector("[data-cselect-toggle]");
          if (t) t.setAttribute("aria-expanded", "false");
          return;
        }

        wrap.classList.remove("is-open");
        return;
      }

      /* Clicking outside the combobox closes just the combobox. */
      if (!e.target.closest("[data-cselect]")) {
        document
          .querySelectorAll("[data-cselect].is-open")
          .forEach((s) => {
            s.classList.remove("is-open");
            const t = s.querySelector("[data-cselect-toggle]");
            if (t) t.setAttribute("aria-expanded", "false");
          });
      }
      if (!e.target.closest("[data-currency]")) {
        document
          .querySelectorAll("[data-currency].is-open")
          .forEach((w) => w.classList.remove("is-open"));
      }

      const locToggle = e.target.closest("[data-loc-toggle]");
      if (locToggle) {
        e.preventDefault();
        const wrap = locToggle.closest("[data-locmenu]");
        const wasOpen = wrap.classList.contains("is-open");
        document
          .querySelectorAll("[data-locmenu].is-open")
          .forEach((w) => w.classList.remove("is-open"));
        if (!wasOpen) wrap.classList.add("is-open");
        return;
      }
      if (!e.target.closest("[data-locmenu]")) {
        document
          .querySelectorAll("[data-locmenu].is-open")
          .forEach((w) => w.classList.remove("is-open"));
      }
      const opener = e.target.closest("[data-open]");
      if (opener) {
        e.preventDefault();
        const key = opener.getAttribute("data-open");
        // A shortcut inside the full-screen menu swaps panels, never stacks.
        if (opener.closest('[data-drawer="menu"]')) closeOverlay();
        if (key === "menu") {
          const code = document.querySelector("[data-currency-code]");
          const out = document.querySelector("[data-menu-currency]");
          if (code && out) out.textContent = code.textContent.trim();
          placeMenuSheet(opener);
        }
        if (key === "lang") {
          const rs = document.querySelector('[data-modal="lang"].regsheet');
          if (rs && rs.regsheetReset) rs.regsheetReset();
        }
        openOverlay(key);
        if (key === "lang") syncLangModal();
        return;
      }
      if (e.target.closest("[data-close]")) {
        closeOverlay();
        return;
      }
      if (e.target.classList.contains("overlay-backdrop")) {
        closeOverlay();
      }
    });
    document.addEventListener("keydown", (e) => {
      // The desktop gate is a dropdown, not an overlay, so openEl is null —
      // check the gate flag too or Esc would be dead while it's up.
      if (e.key === "Escape" && (openEl || document.body.classList.contains("loc-gate"))) {
        closeOverlay();
      }
    });
  }

  /* ---------------------------------------------------------------
     Public re-init hook for dynamically added markup
     --------------------------------------------------------------- */
  /* Scroll reveal: add .reveal-in to [data-reveal] elements as they enter. */
  /* Children that arrive in sequence inside a revealed section. Order in
     this list does not matter; DOM order sets the stagger. The rail track
     is included so a shelf's cards cascade, the band head so a title lands
     a beat before its content. */
  const REVEAL_CHILDREN =
    ".band__head, .rail__track > *, .egrid > *, .benefits > *, .faq__item, " +
    ".story > *, .subbanners > *, .section__head, .tile, .pwidget, .ccard, .bcard";

  function stageChildren(section) {
    if (section.dataset.staged) return;
    section.dataset.staged = "1";
    let i = 0;
    section.querySelectorAll(REVEAL_CHILDREN).forEach((el) => {
      /* A child inside another staged child (a card in a rail inside a band)
         gets its own index from the innermost match only, so nothing is
         delayed twice. */
      if (el.closest(".rv-child") && el.closest(".rv-child") !== el) return;
      /* A looping rail's copies arrive with their section, unstaged, so
         they don't spend the stagger before the real cards get a turn. */
      if (el.closest("[data-rail-clone]")) return;
      /* Cap the ramp: past ~10 items the delay stops growing, otherwise the
         tail of a long grid arrives seconds after the head. */
      el.style.setProperty("--i", String(Math.min(i, 10)));
      el.classList.add("rv-child");
      i += 1;
    });
  }

  function initReveal(scope) {
    const els = (scope || document).querySelectorAll("[data-reveal]:not(.reveal-in)");
    if (!els.length) return;
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("reveal-in"));
      return;
    }
    /* Stage the children BEFORE the section can reveal, so their resting
       state is painted first and the stagger has something to animate
       from. Staging in the intersection callback would snap them in. */
    els.forEach(stageChildren);
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------
     Auto section reveal — give EVERY top-level <section> a smooth
     ease-in entrance site-wide, without hand-annotating every page.
     Sections that already choreograph their own reveals (their own
     [data-reveal] or any [data-reveal] descendant) are left alone so
     we never double-animate. Sticky descendants break inside a
     transformed ancestor, so those sections are skipped. Runs before
     initReveal so the added attributes get observed. Reduced-motion:
     no-op (content stays visible).
     --------------------------------------------------------------- */
  function initAutoReveal(scope) {
    const root = scope || document;
    const main = root.querySelector("main");
    if (!main) return;
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    main
      .querySelectorAll(
        ":scope > section, :scope > div > section, :scope > div > div > section"
      )
      .forEach((sec) => {
        if (sec.hasAttribute("data-reveal") || sec.querySelector("[data-reveal]")) return;
        if (sec.querySelector('[class*="sticky"]')) return;
        /* The hero arrives with the loader (see initLoader), not on scroll. */
        if (sec.classList.contains("hero")) return;
        sec.setAttribute("data-reveal", "");
      });
  }

  /* ---------------------------------------------------------------
     Tilt cards — vanilla port of React Bits <TiltedCard/> (no React/
     motion dependency). [data-tilt] elements tilt toward the cursor
     with a spring-like rAF lerp, plus a slight scale on hover.
     Optional data-tilt-amp / data-tilt-scale overrides. Pointer-fine
     devices only; reduced-motion leaves the cards static.
     --------------------------------------------------------------- */
  function initTiltCards(scope) {
    const cards = (scope || document).querySelectorAll("[data-tilt]:not([data-tilt-ready])");
    if (!cards.length) return;
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    cards.forEach((card) => {
      card.setAttribute("data-tilt-ready", "1");
      if (reduce || !fine) return;
      const AMP = parseFloat(card.getAttribute("data-tilt-amp")) || 8;
      const SCALE = parseFloat(card.getAttribute("data-tilt-scale")) || 1.03;
      let tx = 0,
        ty = 0,
        ts = 1; // target rotateX / rotateY / scale
      let cx = 0,
        cy = 0,
        cs = 1; // current values, eased toward the targets
      let raf = 0;
      const step = () => {
        cx += (tx - cx) * 0.12;
        cy += (ty - cy) * 0.12;
        cs += (ts - cs) * 0.12;
        card.style.transform =
          "perspective(800px) rotateX(" +
          cx.toFixed(2) +
          "deg) rotateY(" +
          cy.toFixed(2) +
          "deg) scale(" +
          cs.toFixed(3) +
          ")";
        if (Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(ts - cs) * 10 > 0.02) {
          raf = requestAnimationFrame(step);
        } else {
          raf = 0;
          if (ts === 1) {
            // settled back to rest — hand the transform back to CSS
            card.style.transform = "";
            card.classList.remove("is-tilting");
            cx = cy = 0;
            cs = 1;
          }
        }
      };
      const kick = () => {
        if (!raf) raf = requestAnimationFrame(step);
      };
      card.addEventListener("mouseenter", () => {
        card.classList.add("is-tilting");
        ts = SCALE;
        kick();
      });
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const ox = e.clientX - r.left - r.width / 2;
        const oy = e.clientY - r.top - r.height / 2;
        tx = (oy / (r.height / 2)) * -AMP;
        ty = (ox / (r.width / 2)) * AMP;
        kick();
      });
      card.addEventListener("mouseleave", () => {
        tx = 0;
        ty = 0;
        ts = 1;
        kick();
      });
    });
  }

  /* ---------------------------------------------------------------
     Scroll-reveal text — a statement fills word-by-word from light grey
     to near-black as the block scrolls up through the viewport. Each
     word interpolates its own colour from its vertical position, so the
     fill flows top-to-bottom and both ways (re-greys on scroll up).

     Drop-in: <p data-reveal-text class="reveal-text">…</p>. The text is
     split into `.rt-word` spans once; words keep trailing spaces so the
     line breaks are unchanged. Guarded for reduced-motion / no-JS: the
     words just render solid dark.
     --------------------------------------------------------------- */
  const RT_GREY = [211, 215, 219]; // #E3E6E5 — un-read
  const RT_DARK = [24, 35, 37]; // #111A19 — read (primaryDark)
  function initScrollRevealText(scope) {
    const blocks = (scope || document).querySelectorAll("[data-reveal-text]");
    if (!blocks.length) return;
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    blocks.forEach((el) => {
      if (el.dataset.rtReady) return;
      el.dataset.rtReady = "1";
      // Split into word spans, preserving the spaces so wrapping is identical.
      const words = el.textContent.split(/(\s+)/);
      el.textContent = "";
      const spans = [];
      words.forEach((chunk) => {
        if (/^\s+$/.test(chunk)) {
          el.appendChild(document.createTextNode(chunk));
        } else if (chunk) {
          const span = document.createElement("span");
          span.className = "rt-word";
          span.textContent = chunk;
          el.appendChild(span);
          spans.push(span);
        }
      });
      if (reduce) {
        spans.forEach((s) => (s.style.color = `rgb(${RT_DARK.join(",")})`));
        return;
      }
      el._rtSpans = spans;
    });

    const lerp = (a, b, t) => Math.round(a + (b - a) * t);
    const paint = () => {
      const vh = window.innerHeight;
      // Words above this line read as "read" (dark); the zone below it is the
      // soft transition band, so a few words fade at once rather than snapping.
      const readLine = vh * 0.62;
      const zone = vh * 0.18;
      blocks.forEach((el) => {
        const spans = el._rtSpans;
        if (!spans) return;
        spans.forEach((s) => {
          const r = s.getBoundingClientRect();
          const mid = r.top + r.height / 2;
          let t = (readLine + zone - mid) / (zone * 2);
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          s.style.color = `rgb(${lerp(RT_GREY[0], RT_DARK[0], t)},${lerp(
            RT_GREY[1],
            RT_DARK[1],
            t
          )},${lerp(RT_GREY[2], RT_DARK[2], t)})`;
        });
      });
    };
    if (reduce) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        paint();
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", paint);
    paint();
  }

  /* ---------------------------------------------------------------
     Refer a friend — copies the referral link to the clipboard and
     briefly flips the button to "Copied". Falls back to select+execCommand
     where the async clipboard API is unavailable (file://, older browsers).
     --------------------------------------------------------------- */
  function initReferralCopy(scope) {
    (scope || document).querySelectorAll("[data-referral]").forEach((root) => {
      if (root.dataset.referralReady) return;
      root.dataset.referralReady = "1";
      const input = root.querySelector("[data-referral-link]");
      const btn = root.querySelector("[data-referral-copy]");
      const label = root.querySelector("[data-referral-label]");
      if (!input || !btn || !label) return;
      let resetTimer;
      const flip = (text) => {
        label.textContent = text;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => (label.textContent = "Copy"), 1800);
      };
      btn.addEventListener("click", async () => {
        const value = input.value;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(value);
          } else {
            input.removeAttribute("readonly");
            input.select();
            document.execCommand("copy");
            input.setAttribute("readonly", "");
          }
          flip("Copied!");
        } catch (e) {
          // Last resort: select the text so the user can copy manually.
          input.select();
          flip("Press Ctrl+C");
        }
      });
    });
  }

  /* ---------------------------------------------------------------
     Vision — the pinned word "Vision" scales up and blurs away as the
     tall .vision-zone scrolls past, while the statement fades in behind
     it. Progress = how far the zone has scrolled through its own height.
     --------------------------------------------------------------- */
  function initVision(scope) {
    const zones = (scope || document).querySelectorAll("[data-vision]");
    if (!zones.length) return;
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // CSS shows the static end state
    const clamp = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
    const smooth = (a, b, t) => {
      const x = clamp((t - a) / (b - a));
      return x * x * (3 - 2 * x);
    };
    const lerpC = (a, b, t) => Math.round(a + (b - a) * t);
    const RT_GREY = [211, 215, 219]; // #E3E6E5
    const RT_DARK = [24, 35, 37]; // #111A19
    zones.forEach((zone) => {
      const word = zone.querySelector("[data-vision-word]");
      const stmt = zone.querySelector("[data-vision-statement]");
      if (!word || zone.dataset.visionReady) return;
      zone.dataset.visionReady = "1";

      // Split the statement into word spans so it can fill grey→black as the
      // section scrolls (same look as the Mission block, but driven by the
      // pin's scroll progress rather than each word's vertical position —
      // the words don't move here, they're pinned).
      let spans = [];
      if (stmt) {
        const parts = stmt.textContent.split(/(\s+)/);
        stmt.textContent = "";
        parts.forEach((chunk) => {
          if (/^\s+$/.test(chunk)) stmt.appendChild(document.createTextNode(chunk));
          else if (chunk) {
            const sp = document.createElement("span");
            sp.className = "rt-word";
            sp.textContent = chunk;
            sp.style.color = `rgb(${RT_GREY.join(",")})`;
            stmt.appendChild(sp);
            spans.push(sp);
          }
        });
      }

      let ticking = false;
      const paint = () => {
        const rect = zone.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        const p = clamp(-rect.top / (travel || 1));
        // Word: sharp until ~26%, then scales up + blurs. It does NOT vanish —
        // it settles to a faint blurred backdrop (opacity 0.12) so the
        // statement reads over it.
        const out = smooth(0.26, 0.66, p);
        word.style.transform = `scale(${1 + out * 1.9})`;
        word.style.filter = `blur(${out * 20}px)`;
        word.style.opacity = String(1 - out * 0.88);
        // Statement container fades in as the word starts blurring…
        if (stmt) stmt.style.opacity = String(smooth(0.24, 0.4, p));
        // …then its words fill grey→black left-to-right across the scroll.
        const N = spans.length || 1;
        const revealStart = 0.36;
        const revealEnd = 0.94;
        spans.forEach((sp, i) => {
          const wordStart = revealStart + ((revealEnd - revealStart) * i) / N;
          const t = clamp((p - wordStart) / 0.05);
          sp.style.color = `rgb(${lerpC(RT_GREY[0], RT_DARK[0], t)},${lerpC(
            RT_GREY[1],
            RT_DARK[1],
            t
          )},${lerpC(RT_GREY[2], RT_DARK[2], t)})`;
        });
      };
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          paint();
          ticking = false;
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      paint();
    });
  }

  /* Pinned horizontal scroll: cards translate X as the page scrolls
     vertically. JS-driven pin (fixed positioning) so it works even under
     the `overflow-x-hidden` main, where CSS position:sticky would fail. */
  function initHScroll(scope) {
    (scope || document).querySelectorAll("[data-hscroll]").forEach((section) => {
      if (section._hscroll) return;
      section._hscroll = true;
      const outer = section.querySelector(".hscroll-outer");
      const pin = section.querySelector(".hscroll-pin");
      const track = section.querySelector(".hscroll-track");
      if (!outer || !pin || !track) return;
      const reduce =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let amount = 0;
      let on = false;

      function layout() {
        amount = Math.max(0, track.scrollWidth - track.clientWidth);
        on = window.innerWidth >= 768 && !reduce && amount > 4;
        section.classList.toggle("hscroll-on", on);
        if (on) {
          outer.style.height = window.innerHeight + amount + "px";
        } else {
          outer.style.height = "";
          pin.style.position = "";
          pin.style.top = "";
          pin.style.left = "";
          pin.style.width = "";
          track.style.transform = "";
        }
        render();
      }

      function render() {
        if (!on) return;
        const rect = outer.getBoundingClientRect();
        const total = amount; // vertical scroll distance == horizontal overflow
        let p;
        if (rect.top >= 0) {
          pin.style.position = "absolute";
          pin.style.top = "0";
          p = 0;
        } else if (-rect.top >= total) {
          pin.style.position = "absolute";
          pin.style.top = total + "px";
          p = 1;
        } else {
          pin.style.position = "fixed";
          pin.style.top = "0";
          p = -rect.top / total;
        }
        pin.style.left = "0";
        pin.style.width = "100%";
        track.style.transform = "translate3d(" + (-(p * amount)).toFixed(1) + "px,0,0)";
      }

      let ticking = false;
      function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          render();
          ticking = false;
        });
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", layout);
      window.addEventListener("load", layout);
      setTimeout(layout, 250);
      layout();
    });
  }

  window.kBurst = promoPaperBurst;

  /* Add-to-bag for pages that build their own CTA (the product page) rather
     than using the card's quick-add widget. Takes the button so the flying
     dot starts from the right place, and opens the drawer afterwards — on a
     considered purchase people want to see what they just did. */
  window.kAddToCart = function (qty, sourceEl) {
    const n = Math.max(1, parseInt(qty, 10) || 1);
    bumpCart(n);
    flyToCart(null, null); // trigger the icon bounce
    /* Open the summary cart so the user sees what they just added. */
    const cartBtn = document.querySelector('[data-open="cart"]');
    if (cartBtn) cartBtn.click();
  };

  /* ---------------------------------------------------------------
     ORDER STATUS WIDGET (Figma 6182-34439) — one component for the
     dashboard's live order and the top of a single order page.

     Everything hangs off data-order-status on [data-order-status-widget];
     a real build just sets that attribute (and the data-* overrides for
     time/points). Statuses: preparing · on-the-way · ready-to-pick ·
     delivered · scheduled.
     --------------------------------------------------------------- */
  const ORD_STATUS = {
    preparing: {
      label: "Preparing",
      pill: "#2f918e",
      accent: "#2f918e",
      ico: "icons/invoice-01.svg",
      when: "Estimated Arrived At",
      /* fraction of the ring the loader draws */
      arc: 0.3,
    },
    "on-the-way": {
      label: "On It's Way",
      pill: "#111A19",
      accent: "#47b5b2",
      ico: "icons/scooter-02.svg",
      when: "Estimated Arrived At",
      arc: 0.72,
    },
    "ready-to-pick": {
      label: "Ready to Pick",
      pill: "#111A19",
      accent: "#47b5b2",
      ico: "icons/location-10.svg",
      when: "Estimated Pickup At",
      arc: 0.92,
    },
    delivered: {
      label: "Delivered",
      pill: "#1e7f4f",
      accent: "#1e7f4f",
      ico: "icons/scooter-02.svg",
      when: "Arrived At",
      arc: 1,
      earned: true,
    },
    scheduled: {
      label: "Scheduled",
      pill: "#2f918e",
      accent: "#2f918e",
      ico: "icons/invoice-01.svg",
      when: "Scheduled For",
      arc: 0.18,
    },
  };
  const ORD_R = 34; /* ring radius inside the 72px badge */

  function paintOrderStatus(el) {
    const key = el.getAttribute("data-order-status");
    const cfg = ORD_STATUS[key];
    if (!cfg) return;
    el.style.setProperty("--ord-accent", cfg.pill);

    const set = (sel, fn) => {
      const n = el.querySelector(sel);
      if (n) fn(n);
    };
    set("[data-ord-pill]", (n) => (n.textContent = cfg.label));
    set("[data-ord-when]", (n) => (n.textContent = el.getAttribute("data-when-label") || cfg.when));
    set("[data-ord-ico]", (n) => (n.src = cfg.ico));
    set("[data-ord-points-note]", (n) => {
      n.textContent = cfg.earned ? "Points Earned" : "Points on their way to you";
    });
    /* the loader arc: stroke the fraction this status is through */
    const circumference = 2 * Math.PI * ORD_R;
    set("[data-ord-arc]", (n) => {
      n.setAttribute("stroke", cfg.accent);
      n.setAttribute("stroke-dasharray", circumference.toFixed(1));
      n.setAttribute("stroke-dashoffset", (circumference * (1 - cfg.arc)).toFixed(1));
    });
  }
  function initOrderStatus(scope) {
    scope.querySelectorAll("[data-order-status-widget]").forEach((el) => {
      if (el.dataset.ordReady) return;
      el.dataset.ordReady = "1";
      paintOrderStatus(el);
      /* demo only: walk preparing -> on the way so both can be seen */
      if (el.hasAttribute("data-ord-demo") && el.getAttribute("data-order-status") === "preparing") {
        setTimeout(() => {
          el.setAttribute("data-order-status", "on-the-way");
          paintOrderStatus(el);
        }, 9000);
      }
    });
  }
  window.kOrderStatus = paintOrderStatus;

  /* ---------------------------------------------------------------
     SCROLL SCRUB — drives a 0 → 1 progress into --t.

     Where initParallax nudges things past each other, this drives a
     whole state change: the About collage uses it to go from the
     design's overlapped/tilted variant to its side-by-side one
     (Figma 179:6936). Progress is read from scroll POSITION, never
     from a triggered animation, so scrolling back up unwinds it with
     no state to get stuck and no replay logic.

     data-scrub-start is the scrollY where t = 0 (default 0, i.e. the
     top of the page) and data-scrub-distance how far the page must
     travel to reach t = 1.
     --------------------------------------------------------------- */
  function initScrollScrub(scope) {
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    scope.querySelectorAll("[data-scrub]").forEach((el) => {
      if (el.dataset.scrubReady) return;
      el.dataset.scrubReady = "1";

      /* Reduced motion gets the settled state outright — the expanded
         variant is the readable one, and nothing animates into it. */
      if (reduce) {
        el.style.setProperty("--t", "1");
        return;
      }

      const start = parseFloat(el.getAttribute("data-scrub-start") || "0");
      const dist = parseFloat(el.getAttribute("data-scrub-distance") || "520") || 1;
      let queued = false;

      const paint = () => {
        queued = false;
        const y = window.scrollY || window.pageYOffset || 0;
        const t = Math.max(0, Math.min(1, (y - start) / dist));
        el.style.setProperty("--t", t.toFixed(4));
      };

      const onScroll = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(paint);
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      paint();
    });
  }

  /* ---------------------------------------------------------------
     SEARCH DRAWER — Figma 193:11401.

     Matches on name, category and fabric so "bed", "towel" and "400"
     all find something. An empty field shows the whole catalogue,
     which is what the design draws — the drawer is a browse surface as
     much as a search one.
     --------------------------------------------------------------- */
  function searchResults(q) {
    const term = q.trim().toLowerCase();
    if (!term) return PRODUCTS.slice();
    return PRODUCTS.filter((p) =>
      [p.name, p.cat, p.sub, ...(p.fabrics || []), ...(p.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }

  function initSearchDrawer(scope) {
    const input = scope.querySelector("[data-search-input]");
    const out = scope.querySelector("[data-search-results]");
    if (!input || !out) return;

    const paint = () => {
      const list = searchResults(input.value);
      if (!list.length) {
        out.innerHTML = `<p class="search-drawer__empty">Nothing matches “${esc(
          input.value.trim()
        )}”.</p>`;
        return;
      }
      out.innerHTML = list
        .map(
          (p) => `
        <a class="sresult" href="product.html?p=${p.slug}">
          <span class="sresult__media">
            <img src="${productArt(p, p.colours[0])}" alt="${esc(p.name)}" loading="lazy" />
          </span>
          <span class="sresult__name">${esc(p.name)}</span>
          <span class="sresult__price">${money(p.from)}</span>
        </a>`
        )
        .join("");
    };

    input.addEventListener("input", paint);
    paint();
  }

  /* ---------------------------------------------------------------
     ORDER TABLES — Figma 159:7053 (Overview) and 159:7607 (My Orders).

     Both screens draw the same row, so the row lives here and the page
     only supplies the data: put the orders on the mount as JSON in
     data-orders and this fills it in. Statuses are keys, not labels,
     so the wording is defined in one place.
     --------------------------------------------------------------- */
  const ORDER_STATUS = {
    preparing: "Preparing",
    way: "On It’s Way",
    delivered: "Delivered",
  };

  function initOrderTables(scope) {
    scope.querySelectorAll("[data-orders]").forEach((mount) => {
      let rows;
      try {
        rows = JSON.parse(mount.getAttribute("data-orders"));
      } catch (e) {
        return; /* malformed data — leave the table empty rather than half-drawn */
      }
      mount.innerHTML = rows
        .map(
          (o) => `
        <a href="my-account-order.html?status=${o.status}&id=${encodeURIComponent(o.id)}" class="otable__row">
          <span class="otable__id">${esc(o.id)}</span>
          <span class="otable__date">${esc(o.date)}</span>
          <span><span class="ostatus ostatus--${o.status}">${esc(
            ORDER_STATUS[o.status] || o.status
          )}</span></span>
          <span class="otable__total">${esc(o.total)}</span>
          <span class="otable__go">${ico("arrow-right-02-sharp", "ico-20")}</span>
        </a>`
        )
        .join("");
    });
  }

  /* ---------------------------------------------------------------
     PASSWORD FIELDS — reveal toggle + the live rule checklist.

     Both are shared by login, register and reset-password, which is
     why they live here rather than in each page's inline script.

     A [data-pw-rules] block names the field it watches with
     data-pw-for, and each [data-pw-rule] carries the rule to test:
     "special", "uppercase", or "match" (which needs data-pw-confirm).
     Rules are advisory here — this is a static storefront with no auth
     backend, so nothing blocks submission on them.
     --------------------------------------------------------------- */
  function initPasswordFields(scope) {
    scope.querySelectorAll("[data-pw-toggle]").forEach((btn) => {
      const input = btn.parentElement.querySelector("input");
      if (!input) return;
      btn.addEventListener("click", () => {
        const shown = input.type === "text";
        input.type = shown ? "password" : "text";
        btn.setAttribute("aria-pressed", String(!shown));
        btn.setAttribute("aria-label", shown ? "Show password" : "Hide password");
      });
    });

    const TESTS = {
      special: (v) => /[^A-Za-z0-9]/.test(v),
      uppercase: (v) => /[A-Z]/.test(v),
    };

    scope.querySelectorAll("[data-pw-rules]").forEach((list) => {
      const pw = scope.querySelector(list.getAttribute("data-pw-for"));
      if (!pw) return;
      const confirmSel = list.getAttribute("data-pw-confirm");
      const confirm = confirmSel ? scope.querySelector(confirmSel) : null;
      const rules = [...list.querySelectorAll("[data-pw-rule]")];

      const check = () => {
        const v = pw.value;
        rules.forEach((li) => {
          const kind = li.getAttribute("data-pw-rule");
          const met =
            kind === "match"
              ? !!confirm && v.length > 0 && v === confirm.value
              : !!TESTS[kind] && TESTS[kind](v);
          li.classList.toggle("is-met", met);
        });
      };

      pw.addEventListener("input", check);
      if (confirm) confirm.addEventListener("input", check);
      check();
    });
  }

  /* ---------------------------------------------------------------
     PASSWORDLESS AUTH — mobile number + one-time code.

     Drives any [data-otp-flow]: step 1 collects the number, step 2
     the six-digit code. Shared by login and register so both behave
     identically. Demo only — no code is really sent, and any six
     digits verify; data-otp-redirect says where to land.
     --------------------------------------------------------------- */
  function initOtpAuth(scope) {
    scope.querySelectorAll("[data-otp-flow]").forEach((flow) => {
      if (flow.dataset.otpReady) return;
      flow.dataset.otpReady = "1";

      const stepPhone = flow.querySelector('[data-otp-step="phone"]');
      const stepCode = flow.querySelector('[data-otp-step="code"]');
      const phone = flow.querySelector("[data-otp-phone]");
      const boxes = [...flow.querySelectorAll("[data-otp-box]")];
      const wrap = flow.querySelector(".otp-boxes");
      const target = flow.querySelector("[data-otp-target]");
      const verifyBtn = flow.querySelector("[data-otp-verify]");
      const resendBtn = flow.querySelector("[data-otp-resend]");
      const errEl = flow.querySelector("[data-otp-error]");
      let ticker = null;

      const code = () => boxes.map((b) => b.value).join("");
      const digits = (v) => String(v || "").replace(/[^\d]/g, "");

      function show(step) {
        stepPhone.hidden = step !== "phone";
        stepCode.hidden = step !== "code";
      }
      function syncVerify() {
        const ready = code().length === boxes.length;
        verifyBtn.disabled = !ready;
        verifyBtn.classList.toggle("opacity-40", !ready);
        verifyBtn.classList.toggle("pointer-events-none", !ready);
      }
      function countdown() {
        let left = 30;
        clearInterval(ticker);
        const tick = () => {
          if (left > 0) {
            resendBtn.disabled = true;
            resendBtn.textContent = "Resend code in 0:" + String(left).padStart(2, "0");
          } else {
            resendBtn.disabled = false;
            resendBtn.textContent = "Resend code";
            clearInterval(ticker);
          }
          left--;
        };
        tick();
        ticker = setInterval(tick, 1000);
      }

      /* ---- step 1 → send ---- */
      flow.querySelector("[data-otp-send]").addEventListener("click", () => {
        const n = digits(phone.value);
        if (n.length < 8) {
          phone.focus();
          if (errEl) { errEl.textContent = "Enter your mobile number."; errEl.hidden = false; }
          return;
        }
        if (errEl) errEl.hidden = true;
        if (target) target.textContent = "+20 " + phone.value.trim();
        show("code");
        countdown();
        boxes.forEach((b) => { b.value = ""; b.classList.remove("is-filled"); });
        syncVerify();
        setTimeout(() => boxes[0] && boxes[0].focus(), 60);
      });

      /* ---- step 2 → the six boxes ---- */
      boxes.forEach((box, i) => {
        box.addEventListener("input", () => {
          box.value = digits(box.value).slice(-1);
          box.classList.toggle("is-filled", !!box.value);
          if (wrap) wrap.classList.remove("is-error");
          if (box.value && boxes[i + 1]) boxes[i + 1].focus();
          syncVerify();
        });
        box.addEventListener("keydown", (e) => {
          if (e.key === "Backspace" && !box.value && boxes[i - 1]) {
            boxes[i - 1].focus();
            boxes[i - 1].value = "";
            boxes[i - 1].classList.remove("is-filled");
            syncVerify();
            e.preventDefault();
          }
          if (e.key === "ArrowLeft" && boxes[i - 1]) boxes[i - 1].focus();
          if (e.key === "ArrowRight" && boxes[i + 1]) boxes[i + 1].focus();
        });
        /* paste the whole code into any box */
        box.addEventListener("paste", (e) => {
          const text = digits((e.clipboardData || window.clipboardData).getData("text")).slice(0, boxes.length);
          if (!text) return;
          e.preventDefault();
          boxes.forEach((b, j) => {
            b.value = text[j] || "";
            b.classList.toggle("is-filled", !!b.value);
          });
          (boxes[Math.min(text.length, boxes.length - 1)] || box).focus();
          syncVerify();
        });
      });

      resendBtn.addEventListener("click", () => {
        if (resendBtn.disabled) return;
        countdown();
      });
      const back = flow.querySelector("[data-otp-back]");
      if (back)
        back.addEventListener("click", () => {
          clearInterval(ticker);
          show("phone");
          phone.focus();
        });

      verifyBtn.addEventListener("click", () => {
        if (code().length !== boxes.length) return;
        clearInterval(ticker);
        verifyBtn.textContent = "Verified ✓";
        verifyBtn.classList.add("pointer-events-none", "opacity-70");
        const to = flow.getAttribute("data-otp-redirect") || "my-account.html";
        setTimeout(() => (window.location.href = to), 700);
      });

      show("phone");
      syncVerify();
    });
  }

  /* Fill any [data-ico] placeholder that is still empty with its icon from
     icons.js. Most pages do this in their own script; this catches the
     rest, and content swapped in by initAccountNav. */
  function initIcons(scope) {
    if (!window.icon) return;
    scope.querySelectorAll("[data-ico]").forEach((el) => {
      if (!el.querySelector("svg")) el.innerHTML = window.icon(el.getAttribute("data-ico"));
    });
  }

  window.kInit = function (scope) {
    scope = scope || document;
    initIcons(scope);
    initShelves(scope);
    initShelfTabs(scope);
    initFeatured(scope);
    initParallax(scope);
    initFaq(scope);
    initRails(scope);
    initCardSwatches(scope);
    scope.querySelectorAll(".carousel").forEach(initCarousel);
    initAccordions(scope);
    initTabs(scope);
    initSegmented(scope);
    initGooTabs(scope);
    initSteppers(scope);
    initSelects(scope);
    initDeliveryNote(scope);
    initPdpCallouts(scope);
    initShippingCallout(scope);
    initPromo(scope);
    initNoteInput(scope);
    initOrderNote(scope);
    initWalletToggle(scope);
    initGiftToggle(scope);
    initTierBadge(scope);
    initVouchers(scope);
    syncWalletBalance(scope);
    initDemoForms(scope);
    initCheckoutSteps(scope);
    initCheckoutMobileBar(scope);
    initCheckoutOptions(scope);
    initCardForm(scope);
    initCountdown(scope);
    initPosts(scope);
    initAutoReveal(scope);
    initReveal(scope);
    initTiltCards(scope);
    initScrollRevealText(scope);
    initVision(scope);
    initReferralCopy(scope);
    initHScroll(scope);
    initCountrySearch(scope);
    initScrollScrub(scope);
    initSearchDrawer(scope);
    initOrderTables(scope);
    initPasswordFields(scope);
    initOtpAuth(scope);
    initOrderStatus(scope);
    initWallet(scope);
  };

  /* ---------------------------------------------------------------
     Boot
     --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
     LOADER — see the LOADER + ARRIVAL block in styles.css.

     Holds the curtain until fonts and the hero poster are in (so the
     header does not reflow after it appears), for at least MIN_HOLD so
     the logo sequence is never cut off, and never past MAX_HOLD so a slow
     font CDN cannot gate the page. Repeat visits in the same session use
     the quick cross-fade instead of the full hold.
     --------------------------------------------------------------- */
  function initLoader() {
    const loader = document.querySelector("[data-loader]");
    const body = document.body;
    if (!loader) {
      body.classList.remove("is-loading");
      body.classList.add("is-ready");
      return;
    }

    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem("percaal-loaded") === "1";
      sessionStorage.setItem("percaal-loaded", "1");
    } catch (e) {
      /* storage unavailable — treat every load as the first */
    }
    const quick = seen || reduce;
    if (quick) loader.classList.add("loader--quick");

    const MIN_HOLD = quick ? 0 : 1100;
    const MAX_HOLD = 2600;
    const started = performance.now();

    const ready = Promise.race([
      Promise.all([
        document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
        new Promise((res) => {
          if (document.readyState === "complete") res();
          else window.addEventListener("load", res, { once: true });
        }),
        /* The hero poster / first image, so the fold does not pop in after
           the curtain has gone. Resolves immediately when there is none. */
        new Promise((res) => {
          const hero = document.querySelector(".hero__media video, .hero__media img, main img");
          if (!hero) return res();
          if (hero.tagName === "VIDEO") {
            const poster = hero.getAttribute("poster");
            if (!poster) return res();
            const im = new Image();
            im.onload = im.onerror = res;
            im.src = poster;
          } else if (hero.complete) res();
          else hero.addEventListener("load", res, { once: true }), hero.addEventListener("error", res, { once: true });
        }),
      ]),
      new Promise((res) => setTimeout(res, MAX_HOLD)),
    ]);

    ready.then(() => {
      const wait = Math.max(0, MIN_HOLD - (performance.now() - started));
      setTimeout(() => {
        loader.classList.add("is-done");
        /* Start the arrival a beat into the lift, so the header is already
           settling as the curtain clears it. */
        setTimeout(() => {
          body.classList.remove("is-loading");
          body.classList.add("is-ready");
          const tile = document.querySelector(".featured");
          if (tile) setTimeout(() => tile.classList.add("is-arrived"), 1000);
        }, quick ? 0 : 150);
        const gone = () => loader.remove();
        loader.addEventListener("transitionend", gone, { once: true });
        setTimeout(gone, 1200); /* belt and braces if transitionend never fires */
      }, wait);
    });
  }

  /* Soft exit on internal navigation, so a click reads as the page
     handing over rather than blinking out. Skips new-tab / modifier
     clicks, hash links, downloads and anything that is not a same-site
     page, so it can never swallow a click it should not. */
  function initPageExit() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url;
      try { url = new URL(href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      const reduce =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
      e.preventDefault();
      document.body.classList.add("is-leaving");
      setTimeout(() => { location.href = url.href; }, 280);
    });
  }

  /* ---------------------------------------------------------------
     MY WALLET — Figma 163:6451 / 261:11353, popups 177:5794 / 177:5820.
     The wallet is credited by vouchers only. A voucher sits in "Available
     Vouchers" until applied; Apply confirms in a popup, then the value
     lands on the balance (the same balance the checkout wallet toggle
     reads: walletBalance()), the voucher leaves the list and a line is
     added to the history. Add Voucher takes a code and puts a new voucher
     in the list. The list and history persist in localStorage so the demo
     holds across pages; clear `percaal-wallet` (and
     `ex_voucher_redeemed`) to reset it.
     --------------------------------------------------------------- */
  const WALLET_STORE = "percaal-wallet";
  const WALLET_SEED = {
    vouchers: [
      { id: "w1", code: "TFH100A", value: 100, expires: "2027-04-23" },
      { id: "w2", code: "TFH100B", value: 100, expires: "2027-04-23" },
    ],
    history: [
      { sign: "-", amount: 150, date: "2025-03-28", reason: "Order #453545243", total: 1200 },
      { sign: "+", amount: 1000, date: "2025-03-28", reason: "Voucher #8469353", total: 1350 },
      { sign: "-", amount: 150, date: "2023-03-28", reason: "Order #453545243", total: 1200 },
    ],
  };
  const walletState = {
    read() {
      try {
        const v = JSON.parse(localStorage.getItem(WALLET_STORE));
        if (v && Array.isArray(v.vouchers) && Array.isArray(v.history)) return v;
      } catch (e) { /* fall through to the seed */ }
      return JSON.parse(JSON.stringify(WALLET_SEED));
    },
    write(v) {
      try { localStorage.setItem(WALLET_STORE, JSON.stringify(v)); } catch (e) { /* session only */ }
    },
  };
  const walletEGP = (n) => "EGP " + Math.round(n).toLocaleString("en-US");
  const walletDate = (iso) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const walletValid = (iso) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  function renderWallet(root) {
    const st = walletState.read();
    const amount = root.querySelector("[data-wallet-amount]");
    if (amount) amount.textContent = walletEGP(walletBalance());
    const list = root.querySelector("[data-wallet-vouchers]");
    if (list) {
      list.innerHTML = st.vouchers
        .map(
          (v) => `
        <li class="wvoucher" data-voucher-id="${esc(v.id)}">
          <span class="wvoucher__icon"><span class="ico ico-line" aria-hidden="true">${window.icon ? window.icon("invoice-01") : ""}</span></span>
          <span class="wvoucher__body">
            <span class="wvoucher__title">${v.value} EGP Discount</span>
            <span class="wvoucher__meta">Valid till ${walletValid(v.expires)}</span>
          </span>
          <button type="button" class="wvoucher__apply" data-voucher-apply aria-label="Apply ${v.value} EGP voucher">Apply</button>
        </li>`,
        )
        .join("");
      const empty = root.querySelector("[data-wallet-empty]");
      if (empty) empty.hidden = st.vouchers.length > 0;
    }
    const hist = root.querySelector("[data-wallet-history]");
    if (hist) {
      const icon = (n) => (window.icon ? window.icon(n) : "");
      hist.innerHTML =
        `<li class="pts-row pts-row--head" aria-hidden="true"><span>Value</span><span>Date</span><span>Reason</span><span>Total</span></li>` +
        st.history
          .map(
            (h) => `
          <li class="pts-row pts-row--${h.sign === "+" ? "in" : "out"}">
            <span class="pts-row__amount"><span class="ico ico-line" aria-hidden="true">${icon(h.sign === "+" ? "plus-sign" : "minus-sign")}</span>${h.amount.toLocaleString("en-US")} EGP</span>
            <span class="pts-row__date">${walletDate(h.date)}</span>
            <span class="pts-row__reason">${esc(h.reason)}</span>
            <span class="pts-row__total"><span class="pts-row__total-label">Total</span>${Math.round(h.total).toLocaleString("en-US")} EGP</span>
          </li>`,
          )
          .join("");
    }
  }

  function initWallet(scope) {
    const sc = scope || document;
    const root = sc.matches && sc.matches("[data-wallet]") ? sc : sc.querySelector("[data-wallet]");
    if (root) renderWallet(root);
    if (document.body.dataset.walletBound) return; // popups are wired once
    document.body.dataset.walletBound = "1";
    let pending = null;

    document.addEventListener("click", (e) => {
      // Apply on a voucher: confirm first.
      const apply = e.target.closest("[data-voucher-apply]");
      if (apply) {
        const li = apply.closest("[data-voucher-id]");
        const v = walletState.read().vouchers.find((x) => x.id === li.dataset.voucherId);
        if (!v) return;
        pending = v.id;
        const text = document.querySelector("[data-voucher-apply-text]");
        if (text) text.textContent = v.value + " EGP will be added to your wallet balance";
        openOverlay("voucher-apply");
        return;
      }
      // Confirmed: credit the balance, retire the voucher, log it.
      if (e.target.closest("[data-voucher-apply-confirm]")) {
        const st = walletState.read();
        const v = st.vouchers.find((x) => x.id === pending);
        pending = null;
        if (!v) return closeOverlay();
        addVoucherRedeemed(v.value);
        st.vouchers = st.vouchers.filter((x) => x.id !== v.id);
        st.history.unshift({
          sign: "+",
          amount: v.value,
          date: new Date().toISOString().slice(0, 10),
          reason: "Voucher #" + v.code,
          total: walletBalance(),
        });
        walletState.write(st);
        closeOverlay();
        const r = document.querySelector("[data-wallet]");
        if (r) {
          renderWallet(r);
          const amt = r.querySelector("[data-wallet-amount]");
          const box = amt && amt.getBoundingClientRect();
          if (box && window.kBurst) setTimeout(() => window.kBurst(box.left + box.width / 2, box.top + box.height / 2, { count: 60, spread: 200 }), 200);
          r.querySelector(".wal-balance")?.classList.add("is-credited");
          setTimeout(() => r.querySelector(".wal-balance")?.classList.remove("is-credited"), 1200);
          r.querySelector("[data-wallet-history] .pts-row:not(.pts-row--head)")?.classList.add("is-added");
        }
      }
    });

    // Add Voucher: a code in, a new voucher in the list.
    document.addEventListener("submit", (e) => {
      const form = e.target.closest("[data-voucher-add-form]");
      if (!form) return;
      e.preventDefault();
      const input = form.querySelector("[data-voucher-code]");
      const err = form.querySelector("[data-voucher-error]");
      const code = input.value.trim().toUpperCase();
      if (!code) {
        if (err) err.hidden = false;
        input.focus();
        return;
      }
      if (err) err.hidden = true;
      const st = walletState.read();
      const exp = new Date();
      exp.setMonth(exp.getMonth() + 6);
      const v = { id: "u" + Date.now(), code, value: 100, expires: exp.toISOString().slice(0, 10) };
      st.vouchers.unshift(v);
      walletState.write(st);
      input.value = "";
      closeOverlay();
      const r = document.querySelector("[data-wallet]");
      if (r) {
        renderWallet(r);
        r.querySelector('[data-voucher-id="' + v.id + '"]')?.classList.add("is-added");
      }
    });
    document.addEventListener("input", (e) => {
      if (e.target.matches("[data-voucher-code]")) {
        const err = e.target.closest("form")?.querySelector("[data-voucher-error]");
        if (err) err.hidden = true;
      }
    });
  }

  /* ---------------------------------------------------------------
     ACCOUNT TABS WITHOUT A RELOAD
     The account pages are separate files, but moving between them from
     the account menu shouldn't feel like leaving: no loader, no flash,
     the header and the tab strip stay exactly where they are. A tab click
     fetches the page, swaps in its content beside the live menu, slides
     the new panel in from the side of the tab that was chosen, and
     re-runs the page's set-up (kInit plus its own inline script). The URL
     and title update, and Back / Forward swap the same way. If anything
     fails, it falls back to an ordinary page load.
     --------------------------------------------------------------- */
  function initAccountNav() {
    const menuHost = document.getElementById("account-menu");
    if (!menuHost || !window.fetch || !window.DOMParser || !history.pushState) return;
    let busy = false;

    const tabIndex = (href) =>
      ACCOUNT_TABS.findIndex((t) => href && new URL(t[3], location.href).pathname === new URL(href, location.href).pathname);

    const swap = async (href, push) => {
      if (busy) return;
      busy = true;
      const from = tabIndex(location.href);
      const to = tabIndex(href);
      try {
        const res = await fetch(href, { credentials: "same-origin" });
        if (!res.ok) throw new Error(res.status);
        const doc = new DOMParser().parseFromString(await res.text(), "text/html");
        const newMain = doc.querySelector("main");
        const slot = newMain && newMain.querySelector("#account-menu");
        const main = document.querySelector("main");
        const menu = document.getElementById("account-menu");
        if (!newMain || !slot || !main || !menu) throw new Error("shape");

        // The live menu takes the incoming page's slot (its layout classes
        // and active tab), so it never re-renders or jumps.
        menu.className = slot.className;
        const active = slot.getAttribute("data-active");
        menu.setAttribute("data-active", active);
        menu.querySelectorAll(".acct-tab").forEach((a) => {
          const on = a.getAttribute("href") === ACCOUNT_TABS.find((t) => t[0] === active)?.[3];
          a.classList.toggle("is-active", on);
          if (on) a.setAttribute("aria-current", "page");
          else a.removeAttribute("aria-current");
        });
        slot.replaceWith(menu);
        main.className = newMain.className;
        main.replaceChildren(...newMain.childNodes);

        document.title = doc.title;
        ["data-page", "data-path"].forEach((k) => {
          const v = doc.body.getAttribute(k);
          if (v) document.body.setAttribute(k, v);
        });
        if (push) history.pushState({ acct: true }, "", href);

        // Page-level popups (a [data-modal] that is a direct child of <body>,
        // like Points' Redeem or Wallet's Add / Apply) belong to the page:
        // drop the old page's, bring the new page's.
        document.querySelectorAll("body > [data-modal]").forEach((m) => m.remove());
        doc.querySelectorAll("body > [data-modal]").forEach((m) => document.body.appendChild(document.importNode(m, true)));

        // Re-run the page's set-up on the new content, then its own script.
        const panels = [...menu.parentElement.children].filter((el) => el !== menu);
        panels.forEach((p) => window.kInit(p));
        document.querySelectorAll("body > [data-modal]").forEach((m) => initIcons(m));
        doc.body.querySelectorAll("script:not([src])").forEach((old) => {
          const js = document.createElement("script");
          js.textContent = old.textContent;
          document.body.appendChild(js);
          js.remove();
        });

        // Slide the panel in from the side of the chosen tab.
        const dir = to >= 0 && from >= 0 && to < from ? -1 : 1;
        panels.forEach((p) => {
          p.style.setProperty("--swap-dir", dir);
          p.classList.remove("acct-swap-in");
          void p.offsetWidth;
          p.classList.add("acct-swap-in");
        });

        // Keep the chosen tab in view, and the page where the menu is.
        const strip = menu.querySelector(".acct-menu__tabs");
        const on = strip && strip.querySelector(".acct-tab.is-active");
        if (on && strip.scrollWidth > strip.clientWidth) {
          const sr = strip.getBoundingClientRect();
          const r = on.getBoundingClientRect();
          strip.scrollBy({ left: r.left + r.width / 2 - (sr.left + sr.width / 2), behavior: "smooth" });
        }
        const menuTop = menu.getBoundingClientRect().top + window.scrollY;
        if (window.scrollY > menuTop) window.scrollTo({ top: Math.max(0, menuTop - 80), behavior: "smooth" });
      } catch (err) {
        location.href = href; // ordinary navigation as the fallback
      } finally {
        busy = false;
      }
    };

    document.addEventListener("click", (e) => {
      const a = e.target.closest("#account-menu .acct-tab");
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault(); // also stops initPageExit's fade-out
      if (a.classList.contains("is-active")) return;
      swap(a.getAttribute("href"), true);
    });
    history.replaceState({ acct: true }, "", location.href);
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.acct && document.getElementById("account-menu")) swap(location.href, false);
    });
  }

  function boot() {
    initLoader();
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");
    const acct = document.getElementById("account-menu");
    if (header) header.innerHTML = headerHTML();
    if (footer) footer.innerHTML = footerHTML();
    if (acct) {
      acct.innerHTML = accountMenuHTML(acct.getAttribute("data-active"));
      /* On phones the tabs are a sliding strip: bring the current page's
         tab to the middle so it's in view on arrival. */
      const strip = acct.querySelector(".acct-menu__tabs");
      const on = strip && strip.querySelector(".acct-tab.is-active");
      if (on) {
        // Measured against the strip itself, once layout (and fonts) settle.
        const centre = () => {
          if (strip.scrollWidth <= strip.clientWidth) return;
          const s = strip.getBoundingClientRect();
          const r = on.getBoundingClientRect();
          strip.scrollLeft += r.left + r.width / 2 - (s.left + s.width / 2);
        };
        requestAnimationFrame(centre);
        window.addEventListener("load", centre, { once: true });
      }
    }

    const overlays = document.createElement("div");
    overlays.id = "site-overlays";
    overlays.innerHTML = overlaysHTML();
    document.body.appendChild(overlays);

    /* Re-apply a session-dismissed announcement bar before first paint of
       the header so it never flashes in and back out. */
    try {
      if (sessionStorage.getItem("percaal-announce") === "off") {
        const h = document.querySelector(".site-header");
        if (h) h.classList.add("is-announce-dismissed");
      }
    } catch (e) {
      /* storage unavailable — the bar simply stays visible */
    }

    initDelegation();
    initQuickAdd();
    initCartSheetDrag();
    initRegSheet();
    initAccountNav();
    initBuyNowSummary();
    initPageExit();
    initStickyNav();
    applyLang(initialLang());
    window.kInit(document);
    // The badge markup carries a hardcoded placeholder; sync every badge
    // (and the floating cart's empty/full icon) to the real seeded count.
    setCartCount(cartCount);
    initFooterReveal();
    /* No location gate. The previous build opened a "choose your delivery
       area" modal on first visit; the redesigned header has no location
       control at all, so the gate would be asking for something the design
       never surfaces again. Delivery area is collected at checkout. */

    /* Bugger feedback widget (Mitchdesigns) — the review tool, not a site
       feature. Carried over from the Exception build and DISABLED here,
       because the ingest key still belonged to that project: the worker
       answered every request with 403 and the widget retried, burying the
       real console output under ~50 errors per page load.

       To turn it back on, put a Percaal ingest key in BUGGER_KEY. A
       non-empty string is the only change needed. */
    const BUGGER_KEY = ""; // <- Percaal ingest key goes here
    if (BUGGER_KEY && !document.getElementById("bugger-widget")) {
      const mountBugger = () => {
        if (document.getElementById("bugger-widget")) return;
        const s = document.createElement("script");
        s.id = "bugger-widget";
        s.src = "https://feedback-widget.mitchdesigns.workers.dev/widget.js";
        s.async = true;
        s.setAttribute("data-ingest-key", BUGGER_KEY);
        s.setAttribute("data-endpoint", "https://bugger-worker.mitchdesigns.workers.dev/functions/v1/ingest-feedback");
        s.setAttribute("data-position", "bottom-right");
        s.setAttribute("data-button-text", "Feedback");
        s.setAttribute("data-accent", "#47B5B2");
        document.body.appendChild(s);
      };
      if (document.readyState === "complete") mountBugger();
      else window.addEventListener("load", mountBugger);
    }
  }

  /* Footer entrance: play forward when the footer enters the viewport,
     reverse when it leaves — repeats every time (does NOT unobserve). */
  function initFooterReveal() {
    const footer = document.querySelector("#site-footer footer");
    if (!footer) return;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      footer.classList.add("footer-in");
      return;
    }
    new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => footer.classList.toggle("footer-in", e.isIntersecting));
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    ).observe(footer);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
