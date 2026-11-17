# Homepage redesign

The homepage keeps the existing minimal collection, craft, community and visit
sequence, with closer section spacing, stronger typography and a larger navbar
logo. White, soft ivory and navy surfaces give the page a clear rhythm. The
default hero retains its ivory Ceylon gemstone scene with Sigiriya and a stupa.
Backend content supplies the heading, inventory, categories, events, photos and
advertisements. Owner-confirmed business details in `src/businessDetails.js`
override older API contact values across Home, Contact, Footer and enquiry links.

The final spacing and type refinements are scoped in `src/HomeFinal.css`.
Sections use 52px desktop, 44px tablet and 36px mobile padding. The workshop
comparison sits beside its introduction on larger screens. Horizontal event ads
use a 16:10 frame; vertical posters retain 3:4 without cropping their images.
Warm ivory (`#f7f5f0`), navy (`#14243a`), bronze and muted blue-gray provide a
shared palette. Primary/secondary buttons use 7px corners; image/card frames use
10px corners with the same warm border. The hero's extra capsule frame is removed.

## Motion and loading

- A single IntersectionObserver reveals each element once using opacity and
  transform. Asynchronous cards join the same observer without resetting the page.
- The original `/gem.glb` sapphire and `/logo.png` emblem are restored in a
  centered interactive showcase. Home starts the model, logo and HDR loads on
  entry and warms the actual GPU scene before revealing the page. After warmup it
  stops rendering offscreen or in hidden tabs. Dragging, arrow-key rotation
  and automatic rotation are supported without a play/pause control. Reduced motion
  uses manual rotation. The raised camera shows the top emblem, while flat facets
  and photographic HDR studio reflections define the cut. The sapphire uses
  physical transmission, a rendered backside and blue volume absorption, with
  balanced front/side/back lighting to keep rotated faces visible. The signature gold ring
  is retained around the table-face emblem, fitted inside the actual facet edge.
  The emblem and ring are masked from offscreen transmission buffers, so they
  appear once on the surface without reflected duplicate logos inside the stone.
  Spin uses elapsed time at 0.15 radians/second (about 42 seconds per turn),
  rather than a frame-count-dependent camera rotation. A fine-pointer
  gold cursor identifies the drag interaction. Vertical mobile swipes scroll the
  page; horizontal gestures rotate the stone.
  Secondary routes still load on demand, including admin charts and workshop.
- Content requests settle separately, cancel on unmount and time out after 15
  seconds. A one-minute cache retains previous data across navigation/background
  refreshes; transient public GET failures retry once after 400ms. Featured
  inventory uses the existing `/api/inventory/top-gems` endpoint.
- A branded native-dialog loading screen waits for initial data, critical images
  and three real scene frames, then fades out. It has a 12-second global ceiling;
  unsupported/failed graphics and an 11-second model deadline release to a static
  sapphire fallback rather than leaving the user stuck. A later successful model
  load can still recover. Canvas's HTML fallback remains passive, since its React
  children mount even when WebGL is supported.
- The enlarged Ayubowan assistant appears only on Home. Other routes unmount its
  dialog and trigger. The navbar shows only the centered logo and Pinnawala Gems
  name, with the previous subtitle removed.
- Lazy images no longer pulse forever. Cloudinary images request automatic
  format/quality and bounded dimensions; the hero uses a mobile-specific asset.
- Native scrolling, reduced motion, keyboard navigation, touch swiping, and the
  keyboard/touch comparison slider are supported. The chat panel stays inside
  the viewport. A background film, when configured, loads only when requested.
- Community photos automatically advance with a seamless short wrap. Previous/
  next, keyboard and touch controls allow manual browsing. There are no playback
  buttons. Autoplay resumes after interaction and sleeps offscreen/in hidden tabs.
- Announcement cards respect horizontal and vertical layout types and open a
  full poster dialog without cropping. Escape restores focus and body scrolling.
- The island section now uses a distinct landscape panel instead of a faded
  background. Craft uses framed comparison and lapidary imagery. The compact
  footer links only to real Home, Collection, Workshop, Feedback and Contact
  routes, plus provided valid contact destinations.

## Image provenance

The current default hero uses `public/images/home-ceylon-ivory-hero-v1.webp`
and its mobile variant. Their generation record is in
`public/images/home-ceylon-ivory-assets.md`. These are editorial illustrations
rather than photographs of inventory or a literal view from the business.

The 3D gemstone uses the locally served photographic studio environment
`public/images/gem-studio-lighting.hdr`. Source, author, CC0 licence and verified
checksums are recorded in `public/images/gem-studio-lighting-provenance.md`.

Earlier retained hero assets: `public/images/home-gem-trio.webp` (1672 x 941, 73,152
bytes) and `public/images/home-gem-trio-mobile.webp` (768 x 1024, 54,542 bytes).
It was edited using the built-in Imagegen tool from the original sapphire image.
Edit prompt: Preserve the dark navy scene and original blue sapphire; add a
smaller realistic ruby at front-left and green sapphire at rear-right with
matching lighting and reflections; keep the left side clear for text; no text
or logos. The mobile version retains all three stones. These are editorial
illustrations rather than photographs of specific inventory stones.

The hero eyebrow now uses "Pinnawala Gems & Lapidary". The provided sapphire
specialist, licence and worldwide shipping text appears in the hero and footer.
Both hero links use the shared rectangular button treatment. The contact details are:

- No.348, Main Street, Eheliyagoda, Eheliyagoda, Sri Lanka
- Pinnawalagemsandlapidary@gmail.com
- 0769254499 (`tel:+94769254499`)
- +94778307334 (`https://wa.me/94778307334`)

Local browser verification uses fully mocked APIs, including deliberately stale
contact data. The latest changes pass 39 checks: 7 loading/readiness scenarios,
16 assistant/navbar checks, 3 public-resource retry/cache checks and 13 model/
interaction checks. Reports are in workspace `.tmp/home-loading-qa/`,
`.tmp/home-assistant-navbar-qa/`, `.tmp/home-public-cache-qa/` and
`.tmp/gem-realistic-review/`. Earlier homepage consistency checks remain in
`.tmp/home-final-qa/`.
Eight sampled views after the transmission-mask change show one surface emblem
and visible sapphire colour throughout automatic rotation. The latest contact
sheet and brightness diagnostics are in `.tmp/gem-rotation-lighting/`; these
diagnostics support visual review rather than a claim of photorealism.
The final capture loads the lazy images and actual 3D model. Visit-section text
contrast is at least 8.60:1 at desktop and mobile widths. The production build
and targeted JSX lint pass.

The original image generation record follows; its assets remain preserved.

The new hero was created using the built-in Imagegen tool. It is an editorial
illustration of a sapphire, not a photograph of a particular inventory stone.

Final prompt: “Photorealistic loose oval royal-blue Ceylon sapphire on midnight
navy stone/satin, sapphire on the right, clean dark left half for typography,
restrained gold rim light, realistic facets, no text, logos, rings or props.”

Final assets, relative to this frontend directory:

| File | Dimensions | Bytes |
| --- | --- | --- |
| `public/images/home-sapphire-editorial.webp` | 1672 × 941 | 63,322 |
| `public/images/home-sapphire-editorial-mobile.webp` | 768 × 1024 | 46,390 |
| `public/images/rough-stone.webp` | 800 × 534 | 19,298 |
| `public/images/cut-stone.webp` | 800 × 534 | 17,712 |
| `public/images/atelier-detail.webp` | 1000 × 500 | 26,210 |
| `public/images/ceylon-landscape.webp` | 1440 × 614 | 128,890 |
| `public/images/lapidary-craft.webp` | 1000 × 500 | 45,244 |

The last five files are optimized copies of existing project imagery. Browser
canvas was used only for format conversion, resizing and the mobile crop.
Original images were preserved.

## Verification

- Latest hero checks passed at 1440, 1280, 768, 390 and 320 pixel widths:
  one-line introduction, oval touch targets, correct images, no overflow/errors.
- Latest motion checks used explicit local image fixtures because live community
  data was unavailable: automatic slide advance and resumption after manual
  navigation passed. No playback buttons remain. Desktop/mobile WebGL previews
  and computed white section backgrounds passed without JavaScript errors.
- Production build passed after the latest changes. Earlier checks below describe
  the previous revision; its Pause/Play controls have since been removed.

- Production build: `npm.cmd run build` on Windows, or `npm run build` elsewhere.
- Live API browser checks at 1440 × 1000, 390 × 844 and 320 × 740: no JavaScript
  errors, failed requests, missing images or document overflow. All 10 gallery
  images were verified by scrolling the gallery.
- Tablet and compact desktop checks at 768 × 1024, 1024 × 768 and 1280 × 720:
  headings fit, navigation does not overlap, scroll reveals remain readable,
  and there is no document overflow or JavaScript error.
- Mobile navigation, keyboard focus restoration, Escape, scroll lock, comparison
  keyboard input, chat panel placement, and reduced motion were verified.
- Ten additional checks with explicitly mocked API responses passed, covering
  independently delayed requests, 10-stone carousel boundaries, malformed data,
  image failure, film focus restoration, vertical touch scrolling over the
  comparison control, reduced motion, and unavailable APIs.
- No production records were changed by browser verification.
- Updated section checks at 1440, 768, 390 and 320 pixel widths found no document
  overflow or JavaScript errors. Poster portrait proportions, dialog Escape/focus
  restoration and real footer routes were verified.
- The updated gallery passed 17 browser checks with real photos across desktop
  and 390 pixel touch layouts, including automatic movement, manual browsing,
  Pause/Play, seam wrapping, touch swiping and offscreen pause.
- Restored 3D checks confirmed that the original model and logo load near the
  showcase, controls work on desktop/mobile, and no WebGL draws occur offscreen.
  Final desktop/mobile previews also verified the footer back-to-top control.

Start local development with `npm.cmd run dev` on Windows. The implementation
uses the existing dependencies and does not require a new environment variable.
