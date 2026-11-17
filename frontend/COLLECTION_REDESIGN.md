# Compact collection layout

Updated the existing React collection routes at `/catalog`, `/collection`, `/collections/:categorySlug`, and `/category/:categoryId`.

- Gem categories are in a compact, sticky left sidebar on desktop. Below 1024px, a separate category button expands the category list.
- Search, count, sorting and filter controls sit above products. Filters open across the top of the catalog; small mobile screens start with filters collapsed to keep products visible.
- Exactly five product cards per row from 1024px upward, three from 600–1023px, and two on smaller mobile screens.
- Smaller banner, narrower page gutters, compact cards and reduced section gaps. Introductory editorial copy, extra collection headings, consultation section and closing slogans were removed.
- Preserved search, shape/cut/origin/colour/certificate/carat filters, removable refinements, sorting, 30-item pagination, detail links and category routes.
- Retained loading, empty, unknown-category, request retry and missing-image states.

## Assets

The hero uses `public/images/collection-sapphire-editorial-v1.webp`, generated with the built-in image tool. Prompts and provenance are in `public/images/collection-assets.md`. The previously generated atelier image remains available in the project but is no longer displayed on this page.

Local Cormorant Garamond headings are paired with the existing Inter body font. Font files and SIL Open Font License are in `public/fonts/`.

## Validation

- `npm.cmd run build` passes; Vite retains the existing large application/3D chunk warning.
- Browser fixture QA: 21/21 checks passed, zero JavaScript errors. Includes five-column geometry at 1024/1280/1440/1920px, sidebar/filter positions, removal of unwanted content, 2/3/5 responsive columns, controls, routing, filters, pagination, keyboard use and recovery states.
- Public inventory loaded successfully with 38 records. Live layout has no horizontal overflow from 320–1440px. First cards start approximately 508px from the top at 1440px desktop.
- Fresh mobile load and expand/collapse of top filters also verified separately.

QA artifacts: workspace `.tmp/collection-compact/`; scripts: `.tmp/collection-compact-qa.cjs` and `.tmp/collection-compact-visual.cjs`.

The existing 500-record inventory request limit and inventory image URLs are preserved. Failed product images receive an unavailable-image state.
