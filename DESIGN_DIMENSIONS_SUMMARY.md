# Design dimensions & typography summary

This file collects places in the project where sizes, spacing, and typography were declared (margins, paddings, gaps, widths, heights, font-size, font-family, line-height, letter-spacing, font-weight, border-radius, etc.). The goal is to consolidate these into a single variables file later (for example `_sass/_variables.scss`).

Notes:

- Search targeted files: `*.scss`, `*.css`, `*.liquid`, `*.html`, `*.md`, `*.js`, `*.svg`.
- Units found include: px, rem, em, vw, vh, % and unitless numbers.

---

## High-priority SCSS files

\_sass/\_skills.scss

- margin-bottom: 3rem;
- font-size: 1.75rem;
- margin-bottom: 1.5rem;
- margin-top: 4rem;
- gap: 1.5rem;
- padding: 0;
- margin: 0.5rem 0 0 0;
- margin-bottom: 1em;
- font-weight: 500;
- margin-bottom: 0.2em;
- padding-right: 6px;
- line-height: 20px;
- font-size: 0.8em;
- margin-top: 1rem;
- font-weight: 600;
- border-radius: 4px;
- height: 20px;

\_sass/\_typograms.scss

- width: 6px;
- height: 6px;
- font-size: 3em;

\_sass/\_themes.scss

- padding-left: 10px;
- padding-top: 12px;
  (repeated in a few places)

\_sass/\_layout.scss

- padding-bottom: 70px;
- scroll-margin-top: 66px;
- padding-top: 56px;

Font/icon SCSS (font-awesome and tabler-icons)

- multiple font-family declarations (e.g. 'Font Awesome 6 Free', tabler icon families)
- font-weight numeric values (400, 900)
- font-size derived via mixins and em units (e.g. `font-size: $i * 1em;`)
- line-height set to 1 or 2em in places

## CSS and vendor files (assets)

assets/css/bootstrap.min.css

- Many font-size declarations for headings and utilities (e.g. h1 = 2.5rem, .h1 = 2.5rem, display-1 = 6rem, etc.). This is a large vendor file — don't modify directly; override in your variables or custom SCSS.

assets/css/jupyter-\*.css

- font: ... 14px / 15px etc. Many hard-coded px sizes.

assets/js/pdfjs/web/viewer.css

- font sizes used (10px, calc(9px \* var(--total-scale-factor)), etc.) — vendor file.

## Inline styles and Liquid templates (HTML-like files)

Many `.liquid`, `.md` and HTML fragments contain inline `style="..."` attributes with sizing. These are important to capture because they won't inherit SCSS variables until converted.

Examples (file : snippets):

\_includes/intro.liquid

- font-size: 1.5rem;
- span style="font-size: 1rem;"
- sizes and responsive `sizes` attributes using vw and px (e.g. 30vw, 95vw)

\_includes/carousel.liquid and \_includes/card.liquid

- image `sizes` attributes: `(min-width: 992px) 31vw, (min-width: 768px) 45vw, 92vw`

\_includes/card_landscape.liquid

- style="min-height: 140px;"

\_includes/latest_posts.liquid and \_includes/news.liquid

- style="max-height: 60vw"
- svg width/height: e.g. width="2rem"

\_includes/resume/\*.liquid

- many `style="min-width: 75px"` and `font-size: 0.95rem` declarations for badges and headings

\_includes/cv/time_table.liquid

- style="width: 75px"

Pages and drafts (examples)

- \_draft/research_interests.md: font-size: 1.5rem; margin-left: 1.2em
- \_draft/type.html and test pages: many examples — font-size (2rem, 0.8rem), padding, margin, height: 100vh, min-height: 70vh, border-radius: 999px
- \_draft/book-review.liquid: multiple margin/padding values (0px, 20px, 40px), width:250px, width:300px

MD and post content

- Several posts include inline styles like margin-bottom: 12px; font-size: 16px; border and box-shadow declarations.

Project markdown files

- Many use inline style attributes with gap:6px, sizes, heights (e.g., height="400px"), max-width in vw or px.

## JavaScript / SVG

\_scripts/search.liquid.js

- inline SVG attributes use rem for widths/heights: width="1.2rem" height="1.2rem"

\_draft/\_layouts/skills.liquid

- some SVG text font-size attributes set via `setAttribute("font-size", "12")` (numeric, likely px)

## Vendor code to leave as-is (but note for overrides)

- Bootstrap (assets/css/bootstrap.min.css) — contains typography scale and spacing; treat as upstream.
- Font Awesome and Tabler icons SCSS — these expose variables already; reuse where possible.
- PDF.js and Jupyter CSS — vendor files with many px font sizes.

## Suggested next steps

1. Create a variable file: `_sass/_variables.scss` (or similar) to hold SASS variables for:
   - base spacing scale (e.g., $space-xxs, $space-xs, $space-sm, $space-md, $space-lg, $space-xl)
   - font sizes scale (e.g., $fs-xxs, $fs-xs, $fs-sm, $fs-base, $fs-lg, $fs-xl)
   - radii ($radius-sm, $radius-md, $radius-lg)
   - container widths and breakpoints used in `sizes` attributes
   - line-heights and font-weights

2. Replace high-priority SCSS declarations (like `_sass/_skills.scss`, `_sass/_layout.scss`, `_sass/_themes.scss`) to use variables.

3. Audit Liquid templates and markdown for inline `style` attributes and replace with utility classes or variables where appropriate. Start with repeating patterns: `font-size: 1.5rem`, `min-width: 75px`, `padding: 0px 0px 0px 20px`, `gap:6px`.

4. Keep vendor files unchanged. Instead add overrides in your custom SCSS that load after vendor files.

## Appendix: Quick index of files with explicit values (non-exhaustive)

- src/\_sass/\_skills.scss
- src/\_sass/\_typograms.scss
- src/\_sass/\_themes.scss
- src/\_sass/\_layout.scss
- src/\_includes/intro.liquid
- src/\_includes/carousel.liquid
- src/\_includes/card.liquid
- src/\_includes/card_landscape.liquid
- src/\_includes/latest_posts.liquid
- src/\_includes/news.liquid
- src/\_includes/resume/\*.liquid
- src/\_includes/cv/time_table.liquid
- src/\_layouts/home.liquid
- src/\_draft/\* (various)
- src/\_pages/\* (various)
- src/\_projects/\* (various)
- src/assets/css/bootstrap.min.css (vendor)
- src/assets/css/jupyter-\*.css (vendor)
- src/assets/js/pdfjs/web/viewer.css (vendor)
- src/assets/css/jupyter-\*.css

---

If you want, I can now:

- generate a starter `_sass/_variables.scss` with suggested variables and map the most-used values from this summary to variables (high-value replacements first), or
- produce a prioritized patch that replaces occurrences in a small set of files (e.g., `_skills.scss`, `_layout.scss`, `_themes.scss`) to reference the new variables.

Mark which option you prefer and I will proceed.
