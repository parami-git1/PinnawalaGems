# Pinnawala Gems production release checklist

## 26 November 2026: complete admin functionality audit

**Local gates PASS; production release/verification PENDING.** This latest section supersedes earlier frontend-only rollout notes. Both backend and frontend source changed. No staging, commit, push, deployment, secret change, real login, upload or production record/asset write was performed.

The function-by-function report is [frontend/ADMIN_UI_REFINEMENT.md](frontend/ADMIN_UI_REFINEMENT.md). Complete backend tests **125/125**, frontend helper tests **53/53**, full lint/build and **173/173 local Chrome admin scenarios** passed. Browser/API/Google/upload data was synthetic and intercepted. The existing large Three.js build warning remains; no fresh production performance claim follows from these admin checks.

This audit fixes stale deleted-record editors, cancellable gallery uploads/retry, pending planner draft replacement, visible/focused validation errors, phone inventory cards/expandable filters, recorded zero display, honest stored legacy settings, literal planner search/date validation/Sri Lanka boundaries and redacted errors. Permanent inventory/stock/category/ad deletion now retains uploaded assets, preventing pre-database media deletion from breaking shared/retained records. Existing business details, credentials, public design, original assets, generated IDs and sold archive/Undo remain.

### Exact coordinated operator checklist

1. **Before any production-connected Git action:** obtain explicit authorization; review the complete working tree and current whitelist in `FINAL_GIT_RELEASE.md`; run `git diff --check`, backend `npm test`, frontend `node --test test/*.test.js`, `npm run lint` and `npm run build`. Record the approved SHA (currently PENDING), actual production branches and current successful Render/Vercel deployment IDs. A push can auto-deploy: hold automatic promotions/deploys if needed to enforce backend-first order. Do not stage real `.env`, `.tmp`, uploads, dependencies or `dist`.
2. **Preserve configuration:** keep the existing MongoDB, JWT, admin password/Google allowlist and Cloudinary secrets. This delta adds no environment variable. Verify Render production `ALLOWED_ORIGINS` includes exactly the confirmed frontend origin `https://pinnawala-gems.vercel.app`, the existing proxy setting matches actual topology, and Render supplies a valid numeric `PORT`. Preserve the owner's existing authentication mode and configured Google client. Vercel must keep `VITE_API_URL=https://pinnawalagems.onrender.com` and any existing public Google/portal settings. Do not copy a local `.env` into either service.
3. **Render first:** deploy the approved SHA to the existing API service, root `backend`, Node 24, build `npm ci`, start `npm start`, health path `/api/health`. Confirm successful public IPv4 binding and ready database health. After deployment is explicitly authorized/completed, verify with real read-only requests: health 200 with the expected revision; public auth-options JSON; anonymous session/stock/workshop-admin requests return JSON 401; permitted-origin CORS/preflight and `Cache-Control: no-store` on private responses. Inspect diagnostics without exposing secrets. Stop frontend promotion if these contracts fail.
4. **Vercel second:** build/promote the same approved SHA, root `frontend`, Node 24/Vite, install `npm ci`, build `npm run build`, output `dist`. Confirm actual deployed revisions and SPA refresh/deep-link handling for public routes, individual gems and the configured administrator portal. Do not change domains, image assets or Cloudinary delivery settings as part of this release.
5. **Post-deployment checks:** verify both real login methods permitted by the current policy; expired/anonymous access; owner read-only stock/chart totals and exact IDs; real category banners/media; settings, review, workshop and planner data; phone cards/filters/sidebar/dialogs. Use physical phones and real cold/warm networks for images and Web Vitals. CRUD, test review submissions, uploads/deletes and messages require separately authorized test data/actions; do not mutate customer records for smoke testing. Real Google-provider and Cloudinary behavior, message delivery, LCP/CLS/INP and production availability remain PENDING until measured.
6. **Rollback:** stop promotion on critical failure, retain logs and return Vercel to the recorded compatible artifact. Keep the matching current backend when compatible. If a backend rollback is required, use an explicitly reviewed artifact that understands archived sold gems and retains shared uploaded media, or forward-fix the regression; older source can republish archived records or purge reused files on Delete. Do not restore/alter MongoDB data, remove fields, rotate secrets or delete Cloudinary originals during rollback. Re-test health, API/auth contracts and real route/media reads before operator acceptance.

Reminders remain in-app (approximately 30 seconds while visible, plus focus/visibility refresh), not email/SMS/push. Scheduled workshop visibility is evaluated on server reads. Uploaded assets are intentionally retained after record deletion; storage reclamation is outside this release. Existing category deletion cascades still use multiple database writes; actual MongoDB cross-document atomicity is not certified. See the admin report for limits and evidence paths.

## 26 November 2026: final mobile galleries and meaningful WhatsApp enquiries

**Local release candidate verified; production sign-off remains PENDING.** No commit, push, deployment, real WhatsApp message, secret change, production record change or asset upload/deletion was performed. The current working-tree changes are frontend/documentation only; preserve the compatible existing backend described below.

- Every public WhatsApp entry now prepares a relevant message and a full public link: gemstone details and its exact item URL; collection guidance; workshop title and any actual event date/time/location; visit/opening-hours enquiries; Contact, Feedback and Home assistance. Workshop-specific recipients remain as configured. Local Sri Lankan/international phone formatting is normalized; invalid international prefixes and injected recipients are rejected. Messages are drafts for the visitor to review and send in WhatsApp. Form names, email addresses, reviews, private URLs and query strings are not automatically copied into a general chat.
- Mobile image browsing supports intentional horizontal swipes while retaining vertical scroll and pinch zoom. A swipe's synthetic click cannot accidentally open the gem viewer; a deliberate tap or enlarge button still opens it. The enlarged photo viewer also supports swipes. Feedback swipes apply to photos, not caption/buttons, and a missing photo list safely uses the existing branded starter. Home community photographs are fully visible on phones; desktop cropping remains unchanged. Community autoplay pauses while hovered/focused. No image quality, original assets, 3D materials, branding or desktop composition was replaced.
- Phone-only details include readable long descriptions, 44px review-error Retry, contact focus/tap feedback and safe-area spacing. Existing compact page layouts and Home-only assistant behavior are retained.

| Final local gate | Status |
| --- | --- |
| Frontend helper tests, including contextual messages, safe links, recipients and workshop metadata | **PASS — 53/53** |
| Complete backend test suite | **PASS — 113/113** |
| Complete frontend lint and production build | **PASS**; existing large Three.js chunk warning remains |
| Six public routes at 320/360/390/430/767/1440px, WhatsApp href contents and gallery/assistant interactions | **PASS — 44/44** |
| Swipe/tap distinction, enlarged/photo-area swipes, image/API HTTP503 retry without reload, retained draft, full photos and long text | **PASS — 8/8** |
| Admin chart/lookup/CRUD/upload-lock regressions against the current production build | **PASS — 23/23** |
| Actual deployed Render/Vercel revision, Cloudinary policy/network, cold/warm mobile performance and physical WhatsApp opening/delivery | **PENDING** |

Browser records, APIs and authentication were synthetic and all external traffic was intercepted. The HTTP503 checks deliberately failed actual image/API requests, observed visible error/retry behavior, then recovered the real local images/data without page reload. The gem-image test covers cache-busting retry URLs as well as the original image URL. Normal page checks had no failed local assets, failed displayed images, horizontal overflow, clipped headings or JavaScript errors. Evidence: workspace `.tmp/final-project-qa/{results,extra-results}.json` and `.tmp/admin-overview-charts-qa/{results,extra-results}.json`, plus screenshots. These checks do not certify live CDN availability, account reachability, message delivery or production Web Vitals.

Include the new **`frontend/src/whatsappLinks.js`** and **`frontend/test/whatsappLinks.test.js`** and the pending Overview modules when preparing the authorized Git release. See the latest section of `FINAL_GIT_RELEASE.md`; the older lists in that document are historical. This final frontend update needs no new environment variable, dependency, backend migration or Cloudinary changes. After an authorized deployment, use actual customer assets and the owner's existing session for read-only smoke checks, then test physical phone navigation/WhatsApp drafts and cold/warm network behavior. Do not send messages, create feedback, change stock or upload assets merely as a live smoke test without separate authorization.

## 26 November 2026: Overview charts and direct gemstone management

**PASS locally; deployment and verification with the actual owner's data remain PENDING.** This frontend update adds no backend endpoint, credential, dependency, migration or production write. Existing admin authentication and protected inventory/stock APIs remain required.

Include `frontend/src/admin/InventoryCharts.jsx`, `InventoryCharts.css`, `inventoryChartData.js`, `QuickGemLookup.jsx`, `QuickGemLookup.css`, `gemLookup.js` and their helper tests, plus the updated Dashboard/Inventory/Operations integration. No Render change is required by this UI diff; preserve the backend compatibility requirements for earlier functional releases below. After explicit deployment authorization, release the matching Vercel frontend using the existing settings.

- **Gems by category:** native SVG donut and coloured comparison bars, separate Private stock/Website showcase views, Records/Pieces/Recorded carats/Recorded value metrics, and a complete category ledger. Blue sapphires, ruby, pink/yellow/green categories use matching gemstone hues; generic categories use their dominant recorded colour or a safe neutral fallback. Selecting a category opens the corresponding filtered finder.
- Private charts default to included, available, positive-quantity stock. **All included** also shows reserved, sold and zero-quantity records. Website charts include every active listing, including stock-excluded/zero-quantity entries. These independent lists are never combined into a physical-stock grand total. Carats/value use quantity × recorded per-piece weight/price; missing measurements are disclosed, with dashes when no usable measurement exists. A failed stock load is not presented as zero inventory.
- **Quick Gem ID lookup:** search both active lists independently of finder filters; exact unique IDs open on Enter, duplicate references require explicit source selection, and incomplete stock loads prevent an unsafe automatic choice. The inspector shows current details/media/certification and a public item link only for website records. Create and edit forms remain inside Overview; private editing reuses the existing stock form and generated IDs stay unchanged. Successful changes refresh counts/charts/search results. Failed saves retain their draft.
- Delete is confirmed and permanent through the existing source-specific API. Cancellation and failed requests keep the inspector open; repeated submissions are blocked while a request is pending. **Remove sold gems** remains the separate reversible archive/Undo action. Opening/searching/chart filtering never modifies records.

Verification: frontend helper tests **46/46**, full lint and production build **PASS**. Final local Chrome scenarios **23/23 PASS** cover chart totals/colours/metrics/drill-down, ambiguous/missing/excluded/sold/zero IDs, both sources' create/edit/delete, failed-save retry, confirmation/duplicate-submit guards, unavailable stock/retry, the regular Operations form/list and 320/390/768/1440px layouts. Extra checks confirm search-icon separation, embedded upload Save/Close locks and cancellation preserving the draft, and unknown weight/price totals and legend entries showing dashes rather than false zeroes. All browser APIs, authentication and writes were synthetic; no production records or Cloudinary assets were changed. Evidence is in workspace `.tmp/admin-overview-charts-qa/results.json`, `extra-results.json` and screenshots. The charts use no Recharts import; the lazy administrator Dashboard chunk is approximately 48.57 kB raw / 13.37 kB gzip in this build. This is a bundle measurement, not a live speed claim.

After an authorized release, verify the real authenticated category totals against the existing active inventory, all four measures, ID lookup and source-specific forms without saving/deleting production records unless separately authorized. Public website appearance, image assets and business settings are unchanged by this admin update.

## 26 November 2026: page-specific phone layouts

**PASS locally; live deployment and physical-device checks remain PENDING.** This is a frontend presentation update. It does not change API contracts, authentication, environment variables, production data or image assets. No commit, push or deployment was performed.

The new layouts apply only at viewport widths **767px and below**. Home, Collection, Feedback, Contact, Workshop and gem details each have their own phone stylesheet. Navbar/footer phone rules are shared. Include `Home.mobile.css`, `Catalog.mobile.css`, `Feedback.mobile.css`, `ContactPhone.css`, `WorkshopPhone.css`, `GemDetailsPhone.css` and `PublicPhoneNavigation.css` plus their component imports/hooks when preparing the approved Git release. This UI change itself requires no Render update; retain the matching backend required by the earlier functional releases below.

- Feedback now uses a short photo journal and a separate light review card. Repeated marketing introductions and duplicate review navigation dots are hidden only on phones. Full photos, photo controls, all three required fields, rating controls, validation, privacy text, error recovery, submission and approved-review navigation remain available.
- Home has shorter headers, practical category links, horizontal featured summaries, the existing 3D viewer and shorter supporting sections. The shortened hero image is explicitly bounded so it cannot cover the next section heading. Full gem specifications remain in the detail page.
- Collection has a shorter banner, two-row browsing toolbar and compact cards; search, category selection, sorting, filters, filter clearing, pagination and item links are retained.
- Contact prioritizes phone/WhatsApp, address and email before the enquiry form. All five fields, opening hours, map and direct contact links remain. Workshop uses one active phone card, image-side controls and a scrollable detail dialog; complete story/contact/location details remain in that dialog. Gem details retain the gallery, certificate and inquiry actions with smaller spacing and 48px actions.
- The phone menu/footer remove repeated decoration and marketing while retaining navigation, licence and business contacts. Tablet/desktop rules remain untouched.

Verification used the local production build with all APIs/external requests intercepted. Six routes at **320/360/390/430/767px** passed layout checks (30 combinations); comparisons at **768/900/1440px** passed all 18 checks for unchanged rendered desktop/tablet layout. Seventeen matched computed styles and geometry; the 1440px Workshop comparison had identical geometry and byte-identical full-page PNGs, with only computed physical auto-margin serialization differing. Fifteen mobile interaction checks cover photos, rating/required-field validation, failed review submission and successful retry with the retained draft, direct Collection navigation, filters and item/WhatsApp links. Eight further checks cover Workshop long-content sizing, next-card navigation, details/contact/map links and Contact field/native validation at 320/390/767px and 667×375 landscape. Frontend helper tests **31/31**, complete lint and production build passed. Existing large Three.js chunk warning is unchanged.

With the same synthetic content at 390×1000px, Feedback document height fell from **2785px to 1718px**, Home from **6082px to 3877px**, and Contact from **3566px to 2295px**. Feedback's actual form begins around **385px instead of 904px**. These are layout measurements, not loading-speed or live performance claims. Production content and fonts can change exact heights. Evidence: workspace `.tmp/mobile-page-redesign-qa/{baseline,final}/measurements.json`, `comparisons.json`, `interactions.json`, `page-actions.json` and screenshots.

After an authorized Vercel release, check real customer photos, long category/story names, phone keyboard/menu behavior, all contact actions and the review form on an actual phone. Verify desktop appearance before sign-off. No production review, enquiry, WhatsApp message, upload or stock action is needed without separate authorization.

## 25 November 2026: gemstone inquiries, sold batches and mobile feedback

**Local PASS; deployment and real production checks PENDING.** This change does not authorize a commit, push, deployment, production write or credential change.

### What changed and how to use it

- Each gemstone's **Inquire via WhatsApp** link prepares the name, permanent Gem ID, weight, colour, shape, cut, origin, certificate availability and a full `/gem/<record-id>` URL. The recipient can open that URL directly or refresh it. The message is prepared in WhatsApp; it is not sent automatically. Existing business contact settings remain authoritative.
- In **Gem inventory**, choose **Remove sold gems**. In **Operations → Stock inventory**, the same action starts with Private stock selected. Paste up to 100 exact Gem IDs or database record IDs, separated by newlines, spaces, commas or semicolons. Preview, check the matching records/photos/quantities, tick the confirmation and remove. Unknown or ambiguous IDs block removal; duplicate IDs count once. Website collection and private stock are independent lists: choose the intended list explicitly.
- Removal archives each entire selected gem record. It removes the record from the public collection, detail lookup, homepage selection, active admin lists and active totals, while retaining its original quantity, IDs, media, certificates and placement flags. It does not subtract individual pieces or permanently delete photographs. Existing one-record Delete actions retain their previous behavior.
- The result reports removed, already removed, changed and failed records separately. **Review remaining IDs** retries unresolved records. **Undo last removal** uses a 24-hour guarded token. After a lost response or closed window, preview the original IDs again and confirm **Restore removed gems**. A fresh preview is required after token expiry or a later edit. Changed records are left unchanged until reviewed again. Operations are atomic per record; a batch is not a database-wide transaction and may partially complete during a service failure. Never assume a timeout means nothing changed.
- On screens below 900px, Feedback photographs have their own area above the journal caption. Full photos remain visible, navigation sits beside the photo, controls have 44px targets, and the form/reviews follow without overlap. Desktop composition and existing image assets are preserved. Home, Collection, Workshop, Contact and navigation were also checked at phone/tablet widths.

### Coordinated release

1. Include the new backend `routes/bulkGemRoutes.js`, `utils/bulkGems.js`, `test/bulk-gems.test.js`, the Stone/StockStone archive fields, archive-aware catalog/stock/analytics queries, version increments on ordinary edits and server route mount. Include frontend `admin/BulkSoldGems.jsx`, `BulkSoldGems.css`, `bulkGemIds.js`, `gemInquiry.js`, their tests, parent admin integrations, `api.js`, `GemDetails.jsx` and `Feedback.css`. Preserve the other pending workshop/planner/media changes in this release.
2. After explicit authorization, deploy **Render first** with the existing database, Cloudinary account, JWT secret, administrator policy and allowed origin. No new environment variables, dependencies, migration, seed or asset uploads are required. Confirm health/revision and JSON 401 without authorization for `/api/admin/bulk-gems/preview`, `/remove`, `/restore`, and `/api/inventory/admin/stones` (POST for the three actions, GET for the listing). A request must not touch records before authentication succeeds.
3. Verify the owner's authenticated, read-only active listing `/api/inventory/admin/stones?page=1&limit=1` is paginated and `no-store`; `includeArchived=true` is supported only on protected listings. Public `includeArchived` parameters must never expose removed records. The new admin frontend requires this protected listing and cannot be released against an older backend lacking it.
4. Deploy the matching Vercel build with the existing API origin. Check direct item URL/refresh, decoded WhatsApp text/recipient, mobile Feedback photos and navigation using real APIs and assets. Do not send a message or remove/restore live gems as a deployment test without separate owner authorization. Functional production batch testing remains PENDING until an authorized genuine operation or approved test fixture is available.
5. Public lists retain their existing short HTTP cache lifetime, so other visitors may briefly see a previously cached listing after removal. Successful catalog batches clear this browser's public resource cache; detail requests bypass browser HTTP cache. Confirm real CDN/API behavior before declaring immediate global visibility.

**Rollback requirement:** once archives have been used, an older backend without archive filtering can republish sold records. Preserve the archive-aware backend during a frontend rollback, or prepare a reviewed compatible forward fix. Do not roll back to code that ignores `archivedAt`, clear archive fields en masse, restore the database, delete assets or rotate credentials to undo this release. A targeted restore must use the reviewed ID flow with owner authorization.

### Verification at handoff

| Gate | Status |
| --- | --- |
| Backend tests, including exact IDs, authorization, archive visibility, stock isolation, stale/concurrent edits, partial retries, token scope/purpose/expiry, legacy rows and Undo recovery | **PASS — 113/113** |
| Frontend helper tests, including inquiry URLs/messages and bulk parsing/retry selection | **PASS — 31/31** |
| Complete frontend lint and production build | **PASS**; existing large Three.js chunk warning remains |
| WhatsApp item navigation and fresh-page/refresh at 390px and 1440px | **PASS — 6/6** local Chrome checks |
| Five public routes at 320/390/768px, three mobile Collection navigation flows and desktop Feedback preservation | **PASS**; no observed overflow, clipped headings, failed images, JavaScript errors or unexpected writes with synthetic fixtures |
| Batch admin browser flow: exact preview, confirmation, blockers/duplicates, remove/Undo, partial retries, interrupted-response recovery, stock isolation and 320/390/768px dialog layout | **PASS — 8/8** local Chrome scenarios |
| Render/Vercel deployment, real Cloudinary/database behavior and production performance | **PENDING** |

Browser evidence is in workspace `.tmp/gem-inquiry-qa-results.json`, `.tmp/bulk-sold-qa/report.json` and `.tmp/mobile-public-refinement/results.json`. These runs execute the local production build with synthetic APIs and external requests intercepted. They do not establish real-network image speed, live authentication or production readiness. No production records, Cloudinary assets or credentials were changed.

> **25 November 2026 workshop scheduling:** Deploy the updated Render backend before the Vercel frontend. Include `backend/utils/workshopContent.js`, the updated WorkshopStep model, workshop routes and cache policy, plus `frontend/src/workshopContent.js` and their new tests. The admin now reads protected `/api/workshop/admin`; public `/api/workshop` returns legacy/published posts and scheduled posts whose `publishAt` is at or before server time. Drafts and future schedules never enter the public response. Workshop responses use `no-store`. Publication is evaluated when the server reads posts, so there is no cron service, environment variable, migration or background status-update job to configure. Existing posts remain published by default.

In Workshop posts, choose **Publish now**, **Schedule publication**, or **Save as draft**. Scheduled publication date/time uses Sri Lanka (UTC+05:30); event date/time is separate and optional. Venue, address, map URL, call number and WhatsApp number are optional independent fields. Call buttons use `tel:` to open the phone app; WhatsApp buttons use `wa.me` and do not send a message automatically. Upload/drag-and-drop and image URL entry are both supported. Published cards and details retain the existing workshop visual style; hardcoded archive dates no longer overwrite real post metadata. An already open, visible workshop page rechecks the public list every 30 seconds, subject to network response time; hidden/offline tabs do not poll.

After deployment, confirm authorized admin listing, saving/editing a scheduled post, future/draft exclusion from the anonymous API, visibility at the scheduled server instant, persistence after reload, event metadata and mobile map/call/WhatsApp links. Production writes and live deployment were not performed during this local implementation.

Workshop verification: **PASS** — complete backend suite 101/101, frontend helper tests 23/23, workshop Chrome checks 21/21, frontend lint and production build. Browser checks cover publication/event timezone separation, future/draft visibility, unchanged due schedules, failed-save draft preservation, image upload locks, public auto-refresh, independent phone/map actions, optional address-only records, legacy posts and 320/390/768/1440px layouts. Backend tests use real registered routes and Mongoose validators with isolated synthetic stores; browser external requests are intercepted. **PENDING** — coordinated operator deployment and real production verification. No production data, assets or secrets were changed.

> **25 November 2026 stock overview and image forms:** Deploy the backend model/payload changes before the matching frontend. Both gemstone models now accept optional `includedInStock` (legacy/default `true`); private stock additionally supports availability, treatment, cut, origin and certificate details. No migration, seeding, dependency or environment-variable change is required. This flag changes stock accounting only, never public visibility; private stock and website showcase remain independent record lists. Available quantities exclude reserved, sold and excluded private stock. Recorded carats/value use quantity × per-piece recorded weight/price; missing quantities/weights/prices are disclosed. The same physical gem entered in both lists is not deduplicated.

Include the new `frontend/src/admin/AdminImageField.jsx`, `AdminImageField.css`, `AdminDashboard.css`, `inventoryInsights.js` and `frontend/test/inventoryInsights.test.js` in the approved Git release. Certificate, category/banner, private stock, advertisement, legacy variation, workshop and website photo forms now offer device upload/drag-and-drop alongside existing URL input. They reuse the authenticated image upload endpoint and existing Cloudinary account (JPEG/PNG/WebP, 8 MB maximum). Upload completion changes the form draft; saving the form applies it. Removing a form image does not itself delete a Cloudinary asset. Generated Gem IDs are display-only and omitted from editable payloads.

After operator deployment, verify authorized stock reads, one explicitly approved test save/upload if permitted, an existing generated ID staying unchanged, persistence after reload, private/showcase counts, included/excluded and reserved/sold filters, and valid/failed/cancelled image upload flows. No production records or assets were changed during local verification.

Current local verification: **PASS** — backend 92/92 tests; frontend helpers 16/16; frontend lint and production build; 57/57 Chrome checks against the final local production build (11 overview/certificate/stock-edit, 4 additional image positions/failure states, 13 upload flows, 6 record/photo/variation session-isolation, and 23 planner regressions). Mobile coverage includes 320/390/768/1440px. All browser APIs, records and authentication were synthetic and external requests intercepted. The dashboard JavaScript chunk is 21.50 kB raw versus the earlier chart-based 392.41 kB; this is a build-size comparison, not a live timing claim. The existing Three.js chunk warning remains. Production persistence, real Cloudinary uploads and deployment verification remain **PENDING**.

> **25 November 2026 planner update:** Appointments & notes now includes a month calendar alongside the existing lists, category/default and custom colours, and an optional note calendar date. Deploy the updated Render backend **before** the Vercel frontend. Include the new `backend/utils/plannerFields.js`, `frontend/src/PlannerCalendar.jsx`, `frontend/src/PlannerCalendar.css`, and `frontend/src/plannerCalendarUtils.js` in the approved release; tests are in `backend/test/planner-api.test.js` and `frontend/test/plannerCalendar.test.js`. No dependency, environment-variable or database migration is required for this planner change. Existing links, records and legacy note colours are preserved. Reminders are in-app: due at their scheduled instant, refreshed every 30 seconds while the planner is visible and on tab return; archiving or clearing/rescheduling removes a due reminder. Email/SMS/background push are not enabled. Local verification does not certify production; live planner persistence and reminder checks remain pending operator deployment.

Planner verification: **PASS** — backend 89/89 tests; calendar helper 7/7 tests (`node --test test/plannerCalendar.test.js` from `frontend`); 23/23 Chrome checks against the local production build; frontend lint and production build. Browser checks cover 320/390/768/1440px layouts, category/custom colours, date selection and year boundaries, create/edit payloads, existing note links, list filters, partial API errors, 30-second reminder polling, hidden-tab pause and draft preservation. Browser records/authentication were synthetic and every external request was intercepted. The existing Three.js bundle-size warning remains. **PENDING** — deploy backend then frontend and verify the real planner with the owner's authorized session; no live writes or deployment were performed for this change.

> **25 November 2026 login preference:** Both methods are requested. Use [ADMIN_LOGIN_SETUP.md](ADMIN_LOGIN_SETUP.md) and `ADMIN_AUTH_MODE=mixed`; earlier Google-only settings below are optional. Local requested credentials have been configured and checked, but ignored `.env` does not deploy through Git. Actual Google client setup, Render environment changes and live access remain operator steps.

Prepared 17 November 2026. **No deployment is authorized by this document.** Source changes must be committed and the exact release SHA approved before anyone triggers production deployment. No ZIP files are needed; deploy from this Git repository.

Latest performance evidence: `LCP_OPTIMIZATION_REPORT.md`. Repeated traced normal-motion cold-mobile LCP improved from median 3.116s to 2.664s, still above 2.5s. Production performance and release sign-off remain PENDING. `FINAL_GIT_RELEASE.md` records the review/staging procedure; no commit or push has been performed.

## Known deployment targets

| Item | Value / verification required |
| --- | --- |
| Frontend | `https://pinnawala-gems.vercel.app` — Vercel, URL supplied by owner |
| Backend | `https://pinnawalagems.onrender.com` — existing Render API origin in source; confirm its dashboard service before release |
| Repository | `parami-git1/PinnawalaGems` — confirm both dashboard projects use this repository |
| Local branch | `main`; production branch in each dashboard still needs confirmation |
| Reviewed base | `6d0f2a9919012fe6d5d214264bfa5ef3dade2bd7`; release includes additional uncommitted readiness fixes. Record the final commit after committing them. |
| Current production revisions | PENDING — record actual successful Render deployment ID/SHA and Vercel deployment ID/SHA before changing anything |

The previous report's “23 fixes” was not a complete certification: review found certificate text could still mark an explicitly uncertified detail page as certified. That omission is corrected in the release candidate and covered by new positive/negative browser checks.

## 1. Before an approved release

- [ ] Review the current Production Readiness Report and exact Git diff. Resolve or explicitly accept the documented slow-mobile LCP target miss; do not treat prior single-run results as production certification.
- [ ] Record the final release commit SHA, both current live deployment IDs, their commits, runtime settings, health-check settings and environment key names in a private operator record. Preserve secret values within the existing secret store; do not paste them into issues/reports.
- [ ] Confirm the actual Render service and Vercel project repository, production branch, root directories and auto-deploy settings. If pushing would trigger production, hold the push until deployment is explicitly authorized, or have the operator pause production auto-deploys before pushing. This work has not changed those settings.
- [ ] Confirm the existing MongoDB backup/restore point is available. Do not restore, migrate, seed, reindex, drop collections, delete uploads or clean Cloudinary assets for this release. Verify MongoDB supports the existing catalog aggregation operators (`$set`, `$facet`, `$regexFind`, `$convert`, `$unset`; MongoDB 4.2+ syntax). Real database execution/load remains unverified locally.
- [ ] Confirm whether any records use backend-local `/uploads` URLs. Render's ephemeral filesystem is not durable across deploys; preserve an existing persistent disk if one is already attached. If local-only production assets lack durable storage, stop and plan their preservation before deployment. Do not silently relocate or delete them.
- [ ] Preserve the current MongoDB, JWT, administrator, Google and Cloudinary credentials. Check the Cloudinary cloud name is the existing account. Do not change transformation security or switch storage accounts.
- [ ] Pause discretionary administrator edits during the brief backend/frontend cutover and smoke checks. Keep existing data and public website content intact.
- [ ] Run the release checks from a trusted checkout using the supplied lockfiles:

```powershell
# Run from the repository root. npm.cmd is for Windows PowerShell.
git status --short
git diff --check
Push-Location backend
npm.cmd ci
npm.cmd test
Pop-Location
Push-Location frontend
npm.cmd ci
node --test test/*.test.js
npm.cmd run lint
npm.cmd run build
Pop-Location
```

`npm ci` only installs local dependencies. Do not run `npm audit fix --force`, package upgrades or database commands during the release. The local tests use synthetic records and never connect to production.

## 2. Required environment and platform configuration

### Render: existing Node web service

| Setting | Required value / action |
| --- | --- |
| Repository / branch | Confirm connected repository above and approved production branch; do not assume local `main` proves the remote setting |
| Root directory | `backend` |
| Runtime / Node | Node, `NODE_VERSION=24` (backend declares `24.x`) |
| Build / start | `npm ci` / `npm start` |
| Health check | `/api/health` |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://pinnawala-gems.vercel.app` — no trailing path or `/api`; add only explicitly supported exact origins, comma-separated |
| `TRUST_PROXY_HOPS` | `1` for the standard one-proxy Render topology, after operator confirmation; do not use this blindly behind an additional proxy/CDN |
| `MONGO_URI`, `JWT_SECRET` | Preserve current values; required before startup |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Preserve existing password-login values |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Preserve all three existing values for uploads and existing account ownership |
| `GOOGLE_CLIENT_ID` | Preserve if Google login is enabled; must match the frontend public client ID |
| `ADMIN_GOOGLE_EMAILS` or `ADMIN_EMAIL` | Preserve the current Google administrator allowlist when using Google login |
| `PORT`, `RENDER`, `RENDER_GIT_COMMIT` | Platform supplied; do not invent values or change the platform port |

Production startup deliberately fails with an empty/invalid origin allowlist. CORS is an additional browser policy; administrator authentication remains mandatory. Wildcard Vercel preview origins and localhost are not permitted in production. Temporarily allow only a specific approved preview origin if necessary for a staged browser test; remove it afterward. Check actual proxy handling in Render before relying on per-IP rate limits. The current rate-limit stores are per process; several API replicas need a coordinated store/policy.

### Vercel: existing frontend project

| Setting | Required value / action |
| --- | --- |
| Production domain | `pinnawala-gems.vercel.app` |
| Root directory / framework | `frontend` / Vite |
| Node version | `24.x` |
| Install / build / output | `npm ci` / `npm run build` / `dist` |
| `VITE_API_URL` | `https://pinnawalagems.onrender.com` in Production; optional final `/api` is normalized, but use the origin consistently |
| `VITE_GOOGLE_CLIENT_ID` | Preserve the current public Google client ID if enabled; align with backend `GOOGLE_CLIENT_ID` |
| Production branch / Git connection | Confirm in Vercel; currently unverified |
| Routing / headers | Use tracked `frontend/vercel.json` with `frontend` as the project root |

Vite values are compiled at build time: changing them requires a rebuild/redeployment. Do not expose MongoDB/JWT/admin passwords/Cloudinary API secrets as `VITE_*` variables. If Google login is used, verify the existing Google OAuth application's authorized JavaScript origins include the exact production frontend origin; do not alter credentials during release.

### Image delivery and caching

- Default hero art, model, texture and original image URLs are retained. The existing 480px mobile variant is selected at DPR1; the original 900px candidate remains for higher density. Home-only download/decode warmup now starts directly in HTML, with the same responsive candidates, before the app bundle. Other routes do not warm the Home hero. Keep v1/v2 preload scripts for older cached pages; never replace immutable assets under the same URL. The inline script is compatible with the current CSP; any future strict script policy needs its matching nonce/hash.
- Cloudinary uses unsigned standard image URLs with `f_auto,q_auto,c_limit,w_*`; signed/custom transformation paths remain unchanged. Failed optimized requests fall back once to the original URL. Check existing account delivery policy, approved transformations and quota; do not disable strict transformations just to pass a test.
- Inspect actual Vercel responses after release: SPA HTML (`/`, `/catalog`, `/gem/...`, `/index.html`) must revalidate; hashed `/assets/*`, `/images/perf-*`, `/critical-assets-v2.js` should be immutable for a year. The source rules are locally checked, but Vercel execution remains PENDING.
- Public successful API GETs: `public, max-age=30, stale-while-revalidate=60`. Authenticated, protected, error and health responses: `no-store`. Responses vary by Authorization and browser Origin as appropriate. Do not add blanket CDN caching of `/api/*`.
- In-memory public data caches are short-lived and invalidated on successful relevant administrator writes; other visitors can still see the normal public HTTP-cache delay. There is no service worker. Preserve original assets and older hashed chunks through the release/rollback overlap.

## 3. Deployment order — only after explicit authorization

1. Record approval, approved SHA and rollback IDs. Ensure production auto-deploy behavior will not promote the frontend before the backend is ready. Source commit/push is an operator action after approval when it can trigger deployment.
2. Configure the existing Render service using the settings above, preserving all current secrets, account identity and storage. Deploy the approved commit to that service. Do not create a replacement database/service or run a migration.
3. Wait for Render's health check and deployment to succeed. Verify health JSON, exact commit revision, all six advertised features, allowed-origin reflection and protected 401 routes using the read-only checks below. A 404, missing feature, unexpected CORS rejection, unhealthy database or wrong revision stops the frontend promotion.
4. Build the matching Vercel revision with the Production environment. If using a nonproduction Vercel preview first, use only its explicitly approved exact CORS origin. Promote/deploy the approved frontend after backend verification. Confirm domain routing and Vercel deployment SHA match the operator record.
5. Execute the post-deployment checks below with real APIs/CDN/fonts and no mocks. Keep administrator edits paused until functional checks settle. No production test records or test uploads are required. Resume normal work after the operator signs off.

The pair needs a coordinated cutover: the old live backend may lack paging metadata, protected stock reads, media/planner routes and current filters. The new frontend must not be promoted against that backend. Conversely, an older frontend may request more than the new 200-record maximum and temporarily show a truncated list while the backend/frontend revisions differ. Minimize the interval and keep both prior deployment artifacts available.

## 4. Read-only health, compatibility and routing checks

These are prepared commands, **not proof of execution**. Run only after the authorized deployment has completed. They do not log in or modify records:

```powershell
curl.exe -i https://pinnawalagems.onrender.com/api/health
curl.exe -i -H "Origin: https://pinnawala-gems.vercel.app" https://pinnawalagems.onrender.com/api/health
curl.exe -i -X OPTIONS -H "Origin: https://pinnawala-gems.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: authorization,content-type" https://pinnawalagems.onrender.com/api/media/upload
curl.exe -i https://pinnawalagems.onrender.com/api/appointments
curl.exe -i https://pinnawalagems.onrender.com/api/admin-notes
curl.exe -i https://pinnawalagems.onrender.com/api/planner/notifications
curl.exe -i https://pinnawalagems.onrender.com/api/stock/stones
curl.exe -i "https://pinnawalagems.onrender.com/api/inventory/stones?page=1&limit=1"
curl.exe -I https://pinnawala-gems.vercel.app/
curl.exe -I https://pinnawala-gems.vercel.app/catalog
curl.exe -I https://pinnawala-gems.vercel.app/critical-assets-v2.js
curl.exe -I https://pinnawala-gems.vercel.app/images/perf-home-ceylon-ivory-hero-mobile-480-v1.webp
```

Expected health: 200 JSON, `status=ok`, `database=connected`, `revision` equal to the approved Render commit and features `appointments`, `admin-notes`, `planner-notifications`, `gem-media`, `catalog-pagination`, `security-hardening`. The four protected checks must be JSON 401 without a token. Preflight must be 204 with the exact allowed origin/method/headers. Public inventory must be 200 with `stones`, numeric `total/totalPages/currentPage/limit`, `categoryCounts` and `filterOptions`; do not paste actual customer/admin record bodies into a public report. Verify paging/filtering using only GETs. An invalid weight/limit should be a JSON 400, not HTML 500.

Use an existing public gem ID from the GET result to open `/gem/<id>` and any existing category path directly. Refresh and navigate between Home, collection, details, Workshop, feedback and Contact. Confirm the new HTML includes Home-only early image/decode setup; v2 remains available only for compatibility. Inspect one real hashed JS file from the returned HTML: JavaScript content type, expected headers and no rewrite to HTML. A missing `.js` file must not masquerade as a 200 SPA document. Unknown app routes may return the SPA document and show the branded 404. Test the actual Vercel rules rather than assuming Vite preview proves them.

## 5. Post-deployment browser/performance acceptance

Record date, browser/device, network/CPU profile, deployment IDs, revision, sample count and results. **PENDING until actually run against the deployed URLs.** Do not intercept or replace real API, image or font requests.

| Check | Procedure / acceptance |
| --- | --- |
| Cold / warm | Three new contexts at 390×844 DPR1 and 1440×1000; cold first load then warm reload within each. Do not install Playwright routing in cache-measurement contexts; it disables HTTP cache. |
| Mobile networks | Run both unthrottled and 150ms latency, 200,000 B/s download, 100,000 B/s upload, CPU4x. Add a physical mobile-network run if available; identify emulation separately. |
| LCP / CLS | Use PerformanceObserver/DevTools, wait until critical readiness and at least 5s after reveal before interaction; record final LCP element and all layout shifts, not only an early snapshot. Report median and range. Targets: LCP ≤2.5s and CLS ≤0.1; disclose misses. |
| INP | Record representative navigation/filter interactions and Event Timing diagnostics; field INP needs field data. Never label a few lab clicks as verified field INP ≤200ms. |
| Images | Scroll every Home/collection section; inspect visible image natural dimensions, `data-image-state`, selected responsive URL, HTTP status and decode completion. Unavailable originals may show an explicit fallback, but record the unavailable asset as a defect. No empty/broken tiles or refresh workaround. |
| CDN | Test existing catalog images and custom hero if configured, DPR1/DPR2, original and transformed URLs, 200/304/cache indicators and `x-cld-error` on failures. Keep originals intact. |
| Routes | Direct deep links, reload, Home → collection → details → Back → Home; cached SPA return must not repeat the initial global loader or erase cards. Test category/search/page navigation. |
| APIs | Confirm actual JSON, CORS and public/private cache separation. Record 4xx/5xx/timeouts and retry behavior; never brute-force login or manufacture production failures. |
| Admin | Owner signs in normally; read existing overview/inventory/stock/appointments/notes/reviews/settings. Verify chart loads on Overview and media galleries display. Do not save/delete/upload records just for this test. |
| Design / mobile | Compare current brand/layout screenshots at 320/390/768/1440px, keyboard skip/dialog/Escape behavior and the unchanged 3D appearance. Record Safari/physical-device checks separately if available. |
| Persistence | Revisit in a separate fresh browser context; confirm content appears without manually refreshing to repair rendering. Check server logs for unexpected errors. |

Stop promotion/sign-off on wrong revision, failed health/CORS, API shape mismatch, broken primary images, missing assets, inaccessible navigation or unexpected private cacheability. A performance miss remains FAIL/PENDING as applicable; do not turn it into PASS because the build succeeds. Record evidence privately, without bearer tokens, cookies, passwords, private record bodies or signed query parameters.

## 6. Rollback

1. Stop further promotions and pause auto-deploys so a push cannot immediately reintroduce a bad revision. Keep normal administrator writes paused while assessing the issue.
2. If only the frontend failed and the backend passes all contracts, Vercel: open the prior known-good successful deployment and use the project's rollback/promotion control to restore the production domain. Verify the prior frontend works with the current backend; do not assume it supports all new paging/filter contracts.
3. If API health/contract/data behavior failed, Render: Deploys → the recorded previous successful deployment → Rollback. Confirm artifact availability first. Dashboard rollback disables Render auto-deploys; verify the actual setting. Restore the matched frontend as needed. Render rollback reuses service-specific settings from the selected deploy; environment groups and persistent disks have different retention semantics—compare the private operator snapshot.
4. Recheck prior health path/revision, production origin, JSON routes, image access, CORS and real browsing. An old backend may have no `/api/health`; use its recorded prior health configuration rather than declaring rollback failed solely on that new path. Old security findings can return with the old code; restrict administrative activity and arrange a forward fix promptly.
5. Do not roll back MongoDB or delete new fields, canonical CMS documents, originals or Cloudinary assets. Code rollback does not undo data writes. If anyone saved CMS content after deployment, older singleton readers may select the legacy document instead of the new canonical record; review that content read-only before restoring an older backend. Do not copy/delete production documents automatically.
6. Retain all release artifacts, original URLs and prior hashed chunks. Reenable auto-deploys only after the operator approves the corrected revision and verifies platform settings. Record the incident and final live revisions.

## Operator sign-off record

| Gate | Status at handoff |
| --- | --- |
| Local source/tests and current lockfiles | See current Production Readiness Report |
| Exact release commit recorded | PENDING |
| Actual dashboard branch/root/env/proxy/storage verified | PENDING |
| Explicit deployment authorization | PENDING |
| Render release healthy and revision verified | PENDING |
| Vercel release promoted and revision verified | PENDING |
| Real production network, cache, images, routes and performance | PENDING |
| Rollback IDs/configuration captured | PENDING |

Platform references: [Render deployment/auto-deploy controls](https://render.com/docs/deploys), [Render health checks](https://render.com/docs/health-checks), [Render rollback semantics](https://render.com/docs/rollbacks), [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json), [Vercel rollback](https://vercel.com/docs/instant-rollback), [Cloudinary access controls](https://cloudinary.com/documentation/control_access_to_media). Source configuration and local tests establish intended behavior; the dashboard and live checks establish deployed behavior.

## Verified admin portal and photograph magnifier release — 24 November 2026

Deploy the backend first. The new frontend intentionally refuses to mount administrator screens until `GET /api/admin/session` verifies the bearer token and returns an administrator identity plus a future `expiresAt` timestamp in milliseconds. An older backend without this endpoint cannot safely support the new frontend; a network error or 404 must never bypass verification.

1. Deploy the matching Render backend without changing existing credentials, `JWT_SECRET`, MongoDB data or Cloudinary configuration. Confirm `/api/health` advertises `admin-session-verification`, and an anonymous `/api/admin/session` returns JSON 401 with `Cache-Control: no-store`. Use the owner's normal sign-in for the authorized read-only check; do not paste or log its bearer token.
2. Build and deploy the matching Vercel frontend. Keep the existing `VITE_API_URL` and Google client ID. The optional `VITE_ADMIN_PORTAL_PATH` is a **public build-time route identifier**, not a password or secret. Its default is `/workspace/pg-0d221cf9d8b8c1683d22fdea`; overrides must stay beneath `/workspace/` so the non-indexing and no-store hosting headers apply. Rebuild after changing it.
3. Bookmark `/workspace/pg-0d221cf9d8b8c1683d22fdea/sign-in` (substitute the configured path when overridden). `/admin` and `/admin-login` deliberately return the ordinary not-found page and do not reveal the replacement through a redirect. Existing administrator username/password and approved Google accounts are unchanged.
4. Confirm the actual hosted portal response includes `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` and `Cache-Control: no-store`. Confirm unauthorized, forged, expired and non-admin sessions cannot load the workspace. Verify valid sign-in restores the intended internal admin view, logout clears the visible workspace across tabs, and an expired older request cannot clear a newly signed-in session. Transient verification failure must show a locked retry state.
5. Open an existing catalog item. Check the magnifier at the center and corners of portrait and landscape photographs, the enlarged photo dialog, watermark position, mobile swipe, optional video controls, and error/retry behavior. Hovering must reuse the displayed photo and cause no gallery layout jump. Do not modify inventory or upload assets for this verification.
6. If rollback is required, restore the previous frontend **before** removing the new backend session endpoint. A previous frontend can use the updated backend's compatible bearer-token login; the new frontend must not be left paired with a backend that cannot verify sessions. Preserve all existing production records and media.

A long route reduces casual guessing; a public JavaScript bundle can still disclose its path. The API remains the authorization boundary. This release preserves the current stateless bearer-token storage/transport to avoid breaking the cross-origin Render/Vercel deployment. It does not add HttpOnly cookies, a BFF, MFA, individual token revocation, or a hosting access gateway; it must not be described as complete OWASP compliance. Those require a separately coordinated authentication/deployment change. See [OWASP authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) and [session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

## Home loading and mobile release checks — 24 November 2026

No additional environment variables, image uploads or data migrations are required. Keep `VITE_API_URL`, the existing optional Google client ID, portal path, Render origins and all server secrets unchanged. Include the new `frontend/src/CollectionBanner.css` in the authorized Git release. Use the existing Render-first compatibility checks above, followed by the matching Vercel build; frontend root/build/output remain `frontend` / `npm run build` / `dist`.

After an explicitly authorized, completed deployment, use the real website without fixtures and without production writes:

- [ ] On a cold Home visit, verify the configured welcome never flashes a different fallback title. Under a slow API, the loading overlay must release after its bounded wait and keep a neutral heading skeleton until real settings arrive; it must not require refresh.
- [ ] Verify the first three featured primary photos request before scrolling, later images remain lazy, and transient failures recover. Check both cold and warm cache on a mobile network. Confirm the current 3D scene starts preparing after the welcome reveal and before scrolling, with unchanged gold logo, facets, animation and cursor.
- [ ] At 320, 360, 390, 430 and tablet widths, check compact navbar text, 44 px targets, direct Collection navigation, category labels, menu focus/close behavior and absence of horizontal page overflow.
- [ ] Open category deep links and move rapidly between categories. Text/navy background should remain readable; each complete banner photograph fades in together. Check custom artwork, image-error retry, correct inventory/category filtering and browser Back/refresh.
- [ ] Open an existing item with multiple photos/videos. Thumbnail boxes and counts must appear above the main image immediately. Check selection, horizontal thumbnail scrolling, touch swipe, video playback, magnifier and enlarged in-page viewer; do not create or edit records.
- [ ] Measure repeated real-network LCP/CLS and actual user-visible loading, recording cache/network/CPU conditions and image/API errors. The latest local median 2.752 s is not a production acceptance result. Keep production sign-off PENDING until real verification passes or the owner explicitly accepts documented limits.

If these frontend checks fail, restore the recorded compatible previous Vercel deployment. If the coordinated backend also requires rollback, restore a compatible frontend before removing `/api/admin/session`. Preserve all MongoDB data, Cloudinary assets and credentials.

## Final complete-reveal and Gmail-owner release — 24 November 2026

This update supersedes the earlier checklist instruction to reveal a title skeleton after a bounded initial wait. Home now reveals only after real required data, its hero, four displayed category photographs and the first three featured photographs are ready. A slow service stays on the branded loader with exit links; failures offer actual retry. Validate both successful loading and recovery without exposing the screenshot's unfinished hero.

For the requested sole Gmail administrator, follow [ADMIN_GOOGLE_SETUP.md](ADMIN_GOOGLE_SETUP.md). New backend settings are `ADMIN_AUTH_MODE=google`, one exact `ADMIN_GOOGLE_EMAIL`, and the public Google Web `GOOGLE_CLIENT_ID`. Preserve all actual existing secrets and records. The frontend reads policy/client ID from the backend; current code does not require `VITE_GOOGLE_CLIENT_ID`. Do not mistake the default compatibility mode for enabled Gmail-only production access.

- [ ] Complete the Google Console origin/client setup and record the sole owner Gmail privately.
- [ ] Deploy the approved matching Render backend first. Health must advertise `google-owner-policy`; `/api/admin/auth-options` must return `passwordEnabled:false`, `googleEnabled:true` and the correct public client ID. Anonymous `/api/admin/session` must return JSON 401.
- [ ] Deploy/promote the matching Vercel build. Verify `/workspace/*` hosted no-store/noindex and popup-compatible `Cross-Origin-Opener-Policy: same-origin-allow-popups`. An old API missing auth-options must not be bypassed by frontend fallback login.
- [ ] Verify actual owner Google login, rejection of a different account, password-method denial, session verification and website sign-out. Use existing records for read-only checks; do not create production test content/uploads.
- [ ] Test the full Home loader on cold/warm mobile connections and slow/failed requests, the decoded category banner reveal, smooth phone navigation and category filters. Confirm public pages do not load the administrator Google SDK.
- [ ] Measure fresh LCP/CLS and the actual time the loading overlay disappears. Old lab medians are historical after this loading-policy change. Record real request errors and physical-device behavior before sign-off.

Google sign-out alone does not revoke an app JWT. Current owner policy blocks every new unauthorized private API request; already delivered browser data can remain until revalidation/sign-out. A rollback to old backend code can re-enable password/old allowlist behavior, so use a reviewed policy-aware rollback pair or a forward fix. Never reset MongoDB or delete Cloudinary assets for an authentication rollout.
