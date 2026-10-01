/*
 * tw-config.js — Tailwind Play CDN configuration (PERCAAL).
 *
 * Source of truth: "Percaal-style-guide.pdf" (Design System, September 2026)
 * and the Figma library at 66m0cvm8EcKSNrBcRuk2ud. Every value below is taken
 * from one of those two — nothing here is invented.
 *
 * ---------------------------------------------------------------------------
 * TYPE
 *   Headings  Adamina Regular          58 / 48 / 42 / 36 / 32 / 24  (desktop)
 *                                      42 / 32 / 24 / 20 / 16 / 14  (mobile)
 *   Body      DM Sans 300–800          32 / 20 / 16 / 14 / 12 / 10
 *   Nav tabs  DM Sans Regular 16 / 130% / +1px tracking
 *
 *   Desktop body line-height is 130% throughout; mobile body is 150% below
 *   20px. Almost every label in the design carries +1px letter-spacing, so
 *   that is the `brand` tracking token.
 *
 * COLOUR
 *   Primary    White #FFFFFF · Black #2C2929 · Warm Brown #686156
 *   Secondary  light blue #C4E0E7 · offwhite #F0EEEA · Beige #D9D9D9
 *              Pastel #E9DED6 · mocha #B78C6F · light brown #AD8E73
 *   Semantic   Success #31A36A · Error #D20E11
 *   Gray       Dark 9 → gray .5, ten steps
 *
 * GEOMETRY
 *   Nothing in this design system is rounded. CTAs, cards, inputs and images
 *   are all square; the only radii are the cart badge and the carousel dots,
 *   which are true circles. `rounded` therefore resolves to 0 and you have to
 *   ask for `rounded-full` explicitly — the opposite of the previous build.
 *
 * LEGACY NAMES
 *   The token names from the previous build (primaryDark, cta, textSecondary,
 *   neutral-*, border-light …) are kept at the bottom, remapped onto the new
 *   palette. They exist so pages that have not yet been rebuilt against the
 *   Figma screens still render in the new colours instead of falling back to
 *   Tailwind defaults. New markup should use the real names above.
 * ---------------------------------------------------------------------------
 */
tailwind.config = {
  theme: {
    screens: {
      xs: "414px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    /* Same rules as .container-design in styles.css: full width, padded by
       the site gutter, which is what steps 16 → 20 → 60 → 100 → 120px. */
    container: {
      center: true,
      padding: "var(--gutter)",
      screens: { sm: "100%", md: "100%", lg: "100%", xl: "100%", "2xl": "100%" },
    },
    extend: {
      fontFamily: {
        /* Adamina is the heading face; DM Sans carries everything else. */
        heading: ["var(--font-heading)", "Georgia", "serif"],
        Adamina: ["var(--font-heading)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        DM_Sans: ["var(--font-body)", "system-ui", "sans-serif"],
        /* Legacy aliases from the previous build. */
        Display: ["var(--font-heading)", "serif"],
        Caveat: ["var(--font-heading)", "serif"],
      },

      colors: {
        /* ---- Primary ---- */
        white: "#FFFFFF",
        black: "#2C2929",
        warmBrown: "#686156",

        /* ---- Secondary ---- */
        lightBlue: "#C4E0E7",
        offwhite: "#F0EEEA",
        beige: "#D9D9D9",
        pastel: "#E9DED6",
        mocha: "#B78C6F",
        lightBrown: "#AD8E73",

        /* ---- Semantic ---- */
        success: "#31A36A",
        error: "#D20E11",

        /* ---- Gray ramp, named exactly as the style guide names it ---- */
        gray: {
          DEFAULT: "#9B9C9F",
          "05": "#F6F5F3",
          1: "#EEEDEB",
          2: "#D8D9DA",
          3: "#C4C5C7",
          4: "#B0B1B3",
          5: "#9B9C9F",
          6: "#85878B",
          7: "#707176",
          8: "#595B61",
          9: "#3E3F42",
          /* numeric aliases so `text-gray-500` style utilities still resolve */
          50: "#F6F5F3",
          100: "#EEEDEB",
          200: "#D8D9DA",
          300: "#C4C5C7",
          400: "#B0B1B3",
          500: "#9B9C9F",
          600: "#85878B",
          700: "#707176",
          800: "#595B61",
          900: "#3E3F42",
        },

        /* ------------------------------------------------------------------
           LEGACY ALIASES — previous build's names, remapped. Keeps pages that
           have not been rebuilt yet coherent rather than broken.
           ------------------------------------------------------------------ */
        primaryDark: "#2C2929",
        primaryExtraDark: "#2C2929",
        primaryColor: "#2C2929",
        blackText: "#2C2929",
        textSecondary: "#2C2929",
        secondaryText: "#595B61",
        primaryText: "#707176",
        cardbadgecolor: "#B78C6F",
        bordercolor: "#707176",
        black900: "#2C292990",
        cta: { DEFAULT: "#686156", hover: "#2C2929", light: "#F0EEEA" },
        primary: {
          DEFAULT: "#686156",
          light: "#F0EEEA",
          hover: "#2C2929",
          50: "#F6F5F3",
          100: "#F0EEEA",
          200: "#E9DED6",
          300: "#D9D9D9",
          400: "#AD8E73",
          500: "#B78C6F",
          600: "#686156",
          700: "#595B61",
          800: "#3E3F42",
          900: "#2C2929",
        },
        accent: {
          error: "#D20E11",
          green: "#31A36A",
          yellow: "#B78C6F",
          50: "#F6F5F3",
          100: "#F0EEEA",
          200: "#E9DED6",
          300: "#D9D9D9",
          400: "#AD8E73",
          500: "#B78C6F",
          600: "#686156",
          700: "#595B61",
          800: "#3E3F42",
          900: "#2C2929",
        },
        green: {
          100: "#E4F4EC",
          200: "#C2E7D3",
          300: "#93D5B2",
          400: "#63C291",
          500: "#31A36A",
          600: "#31A36A",
          700: "#268253",
          800: "#1C6140",
          900: "#12402B",
        },
        neutral: {
          black: "#2C2929",
          white: "#FFFFFF",
          beige: "#E9DED6",
          cream: "#F6F5F3",
          divider: "#D8D9DA",
          outline: "#B0B1B3",
          disabled: "#C4C5C7",
          secondary: "#707176",
          "support-bg": "#2C2929",
          50: "#F6F5F3",
          100: "#EEEDEB",
          200: "#D8D9DA",
          300: "#C4C5C7",
          400: "#B0B1B3",
          500: "#9B9C9F",
          600: "#85878B",
          700: "#707176",
          800: "#595B61",
          900: "#3E3F42",
        },
        border: { light: "#D8D9DA" },
        interaction: {
          primary: "#686156",
          tertiary: "#F0EEEA",
          "tertiary-hover": "#E9DED6",
          base: "#F0EEEA",
          divider: "#D8D9DA",
          outline: "#B0B1B3",
          disabled: "#C4C5C7",
          "secondary-text": "#707176",
        },
        customGray: "#EEEDEB",
        customGrayMedium: "#B0B1B3",
        ctaBackground: "#F0EEEA",
        dividerText: "#D8D9DA",
        backgroundLocationBar: "#F6F5F3",
        primaryLight: "#F0EEEA",
        offWhite: "#F0EEEA",
        parchment: "#E9DED6",
        arcticWolf: "#F0EEEA",
        macaroon: "#AD8E73",
        praline: "#686156",
        frostedMint: "#C4E0E7",
      },

      /* Square by default — see GEOMETRY above. */
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        custom: "0px",
        full: "9999px",
      },

      /* The design system's own steps, so `text-h1` … `text-body-xs` read the
         same in markup as they do in Figma. Line-heights are the style
         guide's percentages resolved against each size. */
      fontSize: {
        h1: ["58px", "106%"],
        h2: ["48px", "120%"],
        h3: ["42px", "130%"],
        h4: ["36px", "130%"],
        h5: ["32px", "130%"],
        h6: ["24px", "130%"],
        "h1-m": ["42px", "120%"],
        "h2-m": ["32px", "120%"],
        "h3-m": ["24px", "120%"],
        "h4-m": ["20px", "130%"],
        "h5-m": ["16px", "140%"],
        "h6-m": ["14px", "140%"],
        nav: ["16px", "130%"],
        "body-2xl": ["32px", "130%"],
        "body-xl": ["20px", "130%"],
        "body-lg": ["16px", "130%"],
        "body-md": ["14px", "130%"],
        "body-sm": ["12px", "130%"],
        "body-xs": ["10px", "130%"],
        /* Plain scale, kept so utility classes in un-rebuilt pages still work. */
        "2xs": ["10px", "130%"],
        xs: ["12px", "130%"],
        sm: ["14px", "130%"],
        base: ["16px", "130%"],
        lg: ["20px", "130%"],
        xl: ["24px", "130%"],
        "2xl": ["32px", "130%"],
        "3xl": ["36px", "130%"],
        "4xl": ["42px", "130%"],
        "5xl": ["48px", "120%"],
        "6xl": ["58px", "106%"],
        "7xl": ["72px", "106%"],
      },

      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.02em",
        tight: "-0.01em",
        normal: "0",
        /* +1px is the design system's default label tracking. It is absolute
           rather than em-based in Figma, so it is expressed in px here too. */
        brand: "1px",
        wide: "1px",
        wider: "1.5px",
        widest: "2px",
      },

      maxWidth: { design: "1512px" },
      spacing: { gutter: "60px" },

      boxShadow: {
        /* The design uses flat surfaces and hairlines. The only real shadows
           are on floating overlays. */
        none: "none",
        overlay: "0px 4px 24px rgba(44, 41, 41, 0.12)",
        dropdown: "0px 8px 24px rgba(44, 41, 41, 0.10)",
        custom2: "none",
        custom3: "0px 8px 24px rgba(44, 41, 41, 0.10)",
        custom4: "0px 4px 24px rgba(44, 41, 41, 0.12)",
        "custom-5": "none",
        "cart-utility-box": "none",
        "cart-overview": "0px -2px 16px rgba(44, 41, 41, 0.06)",
        "cart-btn": "none",
        header: "none",
        defaultSwitcher: "0px 1px 3px rgba(44, 41, 41, 0.10)",
        "location-btn": "none",
        "search-btn": "none",
      },

      animation: {
        customBounce: "customBounce 3s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        slideDown: "slideDown 0.35s ease-out forwards",
      },
      keyframes: {
        slideDown: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        customBounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10%)" },
        },
      },
      scale: { flip: "-1" },
    },
  },
};
