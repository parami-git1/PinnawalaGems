# Pinnawala Gems — Production Readiness Report

> **Latest login update — 25 November 2026:** The owner now requests both email/password and Google sign-in. Current setup is `ADMIN_AUTH_MODE=mixed`; see [ADMIN_LOGIN_SETUP.md](ADMIN_LOGIN_SETUP.md). Requested credentials were explicitly configured only in ignored local `backend/.env` and successfully checked through local authentication/session routes. Backend 72/72 tests, frontend 19/19 production-build checks, lint and build PASS. A real Google Web client ID and live environment/deployment verification remain PENDING. Previous Google-only instructions below are optional historical setup, not the current requested mode.

> **Latest finalization — 24 November 2026:** The screenshot's unfinished hero is corrected by waiting for real Home data and critical photographs; the former 3.5-second forced reveal is removed. Single-owner Gmail access is implemented and tested, with operator setup in [ADMIN_GOOGLE_SETUP.md](ADMIN_GOOGLE_SETUP.md). See the finalization addendum at the end. Deployment, the owner's actual Gmail/Google Console setup and live release verification remain **PENDING**. Earlier loading-policy descriptions and performance measurements below are historical, not certification of this updated candidate.

> **24 November 2026 follow-up:** Home loading, category banner reveal, mobile navigation and gallery discovery were verified on the local production build. See the dated addendum below. Local checks PASS; the repeated cold-mobile 2.5-second LCP target remains FAIL, and deployment/live verification remain PENDING. Earlier measurements and PDFs are historical evidence.

> Latest LCP review (17 November 2026): see LCP_OPTIMIZATION_REPORT.md and FINAL_GIT_RELEASE.md. Current matched traced cold-mobile median is 2.664s (2.620–2.740s), improved from 3.116s but still FAIL against 2.5s. Production remains PENDING. Timing sections below are the earlier readiness baseline, not the latest measurements.

17 November 2026 · Asia/Colombo

**Overall: PENDING. Local release candidate prepared; production deployment and sign-off are not complete.** No deployment was authorized/performed, no Git push was made, no production credentials were read/changed and no production data/Cloudinary assets were modified. No new live-site HTTP tests were run before the owner's deployment authorization/completion gate.

Owner-confirmed frontend: **https://pinnawala-gems.vercel.app** on Vercel. Backend target in source: **https://pinnawalagems.onrender.com** on Render. Reviewed Git base: **6d0f2a9919012fe6d5d214264bfa5ef3dade2bd7**, local branch **main**. This review adds working-tree changes; the final release commit SHA must be recorded after committing. Actual dashboard branches, live deployment revisions and environment values remain unverified.

## PASS / FAIL / PENDING

| Gate | Status | Evidence / remaining work |
| --- | --- | --- |
| 23 original source findings | PASS | All located in current source and mapped below; missing detail certification fixed during this review. |
| Backend tests | PASS | 48/48 real local registered-route/schema/security/media tests; synthetic models/cloud operations, no real DB. |
| Full lint / production build | PASS | Both rerun after application changes. GemScene lazy chunk size warning remains. |
| Current dependency advisories | PASS | Fresh complete npm audits: backend 0, frontend 0 known vulnerabilities; no dependency changes this review. |
| Local API/CORS/cache contracts | PASS | Actual production origin and upload preflight tested locally; public/private caching already covered by security tests. |
| DPR hero delivery / original preservation | PASS | DPR1 33,320 B transfer vs original 123,322 B; one request per density. DPR2 retains original. All manifest source hashes match. |
| Admin chunk improvement | PASS | 508.56 KB raw → 116,419 B raw. Chart code 392,382 B is loaded only on Overview. No claim of a cold Overview speedup. |
| Repeated local cold-mobile LCP ≤2.5 s | FAIL | Final normal-motion median 2.848 s (2.748–2.912); reduced-motion median 3.304 s (3.036–3.464). Do not reuse earlier best-case result as sign-off. |
| Repeated local CLS ≤0.1 | PASS | Maximum observed CLS 0.000674 normal motion; 0 reduced motion. Lab only. |
| GemScene size / weak-device runtime | PENDING | 1,063,205 B raw, about 290.7 KB gzip; intentionally remains deferred. No initial GLB requests in timing runs. Real low-end GPU/mobile verification pending. |
| Exact production platform settings | PENDING | Vercel URL is owner-confirmed; dashboard Git branch/root/runtime/env/proxy/storage values and current deployment IDs are not accessible/verified. |
| Cloudinary production policy and MongoDB execution | PENDING | No credential/policy changes or real uploads. Real transformations, quota, legacy paths, DB version/load and Atlas behavior await operator/live verification. |
| Deployment authorization and completion | PENDING | Not authorized or performed. No Git commit/push, remote configuration change or deployment call. |
| Real production API/routes/headers/images | PENDING | No new live-site network requests in this review. Historical missing-route probe is not a current deployment result. |
| Real production LCP/CLS/INP and device checks | PENDING | No production Lighthouse/field metrics. No claim of resolved live behavior. |
| Rollback availability / operator acceptance | PENDING | Instructions prepared; actual successful deployment IDs/artifact retention/secret-store snapshot and acceptance of performance risk remain operator gates. |

## Review of the earlier report

The earlier claim that all 23 source fixes were complete was slightly overstated: detail certification still used `hasCertificate || certificateDetails`, so legacy text could label an explicitly uncertified gem as certified. This review reproduced the source omission, changed it to explicit `hasCertificate === true` and passed both false/true detail regression cases while retaining legacy fields. The current candidate now contains all 23 mapped fixes. Deployment finding DEP-01 remains PENDING, not PASS.

Other important release gaps found and corrected: optimized Cloudinary requests did not fall back to the original remote URL; Home's separate helper could pre-transform custom hero URLs and defeat that fallback or alter custom pipelines. The original URL is now retained and retried once on optimization failure, `srcSet` is removed for fallback display, custom/signed pipelines stay intact, and Home uses the shared delivery policy. Synthetic transformed 403/404, unavailable-original and custom-hero cases pass. This does not prove that all real Cloudinary originals exist or that its production policy permits every transformation.

## Safe performance changes and measured limits

- AdminInventory imports the chart/Overview component lazily. Its raw chunk decreased from **508.56 KB to 116.42 KB** (about **77%**); chart code is a separate **392.38 KB** chunk. Browser network evidence confirms inventory does not fetch it, Overview fetches it once, and navigation back remains usable. Inventory gzip is about 31.3 KB versus the earlier 142.7 KB. The default Overview still needs the charts, so this is not a claimed Overview speedup.
- A proportional **480×640 WebP** of the same mobile hero is **33,020 B**, versus **123,022 B** for the original 900×1200 artwork (**73.2% fewer image bytes**). DPR1 gets one 33,320 B request including measured overhead; DPR2 gets the original 123,322 B request. Responsive preload candidates match the image. A new `critical-assets-v2.js` filename avoids changing an immutable v1 script. Original images remain intact; screenshot inspection retains composition, content, colors and layout.
- **No reliable LCP speedup is claimed from the new variant.** The normal-motion median changed only 2.872→2.848 s; reduced-motion samples became slower. Byte savings are proven; scheduling/CPU variation remains. The original report's single 1.73 s sample is not a production acceptance result.
- GemScene remains **1,063.21 KB raw / about 290.7 KB gzip**. It is already imported near its section, does not load the GLB in initial viewport timing runs, and pauses its frame loop when inactive. Further renderer/material/shader/model changes would risk the established appearance without demonstrated first-viewport benefit, so none were made. Its live mobile GPU/runtime cost remains PENDING.

### Repeated local measurements

| Motion / cache | Before variant median LCP | Final median LCP | Final min–max | Max CLS |
| --- | --- | --- | --- | --- |
| no-preference / cold | 2.872 s | 2.848 s | 2.748 s–2.912 s | 0.000673 |
| no-preference / warm | 1.336 s | 1.352 s | 1.344 s–1.364 s | 0.000673 |
| reduce / cold | 2.696 s | 3.304 s | 3.036 s–3.464 s | 0.000000 |
| reduce / warm | 1.328 s | 1.276 s | 1.252 s–1.316 s | 0.000000 |

Each row has **3 samples**: three fresh Chromium contexts for each motion preference, cold then warm in each. Production Vite preview, 390×844 DPR1, 150ms latency, 200,000 B/s down, 100,000 B/s up, CPU4x. No Playwright routing in timing contexts; API fetches are synthetic, external Google fonts/maps/identity are blocked, and real local assets are used. The final LCP in these runs was an IMG. Observations wait 2s after readiness and are comparative lab samples, not a full live-site trace. Real production checks must wait longer and include actual fonts/APIs/CDN. All 12 final observations had a decoded hero, no native broken image and no initial GLB request. Final local cold LCP misses 2.5 s, so it is explicitly **FAIL**; real production performance is **PENDING**. Field INP was not measured.

## Original finding-to-source ledger

All PASS entries refer to local source and local tests only. References include current line numbers; they may shift after later edits.

| ID | Status | Current source evidence | Review result |
| --- | --- | --- | --- |
| DEP-01 | PENDING | backend/server.js:39 | Current backend is packaged with health, appointments, notes and planner APIs. Manual deployment is still required; local source cannot change the old Render deployment. |
| SDEP-01 | PASS | backend/package.json:22; backend/routes/mediaRoutes.js:48 | Updated compatible locked dependencies, migrated to Cloudinary v2 without the deprecated storage adapter, and removed nodemon. Both complete npm audits report zero known vulnerabilities. |
| BSEC-01 | PASS | backend/routes/adminAuthRoutes.js:24; backend/middleware/security.js:40 | IP and account/IP failed-login limits, input validation, constant-time password comparison and explicit HS256 session verification. |
| BSEC-02 | PASS | backend/routes/stockRoutes.js:10 | All stock category and stone reads now require administrator authentication. |
| BSEC-03 | PASS | backend/server.js:23; backend/routes/mediaRoutes.js:18 | Legacy uploads now share bounded signature/type validation, 8 MiB photo limit, temporary-file cleanup and throttling. |
| BSEC-04 | PASS | backend/routes/feedbackRoutes.js:6; backend/models/Feedback.js:4 | Reviews are trimmed, length/type/integer-rating validated, throttled, moderated and reject the bot field. Client drafts survive a 429. |
| BSEC-05 | PASS | backend/utils/catalogData.js:71; backend/utils/catalogData.js:69 | Positive bounded pagination, literal escaped search, bounded query lengths, numeric filters and database query deadlines. |
| BFUN-01 | PASS | backend/routes/inventoryRoutes.js:28 | Zero quantity remains zero on create/edit; negative/fractional quantities are rejected. |
| BFUN-02 | PASS | backend/utils/catalogData.js:94 | Normalized numeric carat weights and aggregation conversion for legacy display strings make range filters numeric. |
| BFUN-03 | PASS | backend/routes/inventoryRoutes.js:39; backend/routes/stockRoutes.js:35 | Editable-field allowlists, validators and consistent 400 responses cover inventory/category/stock writes. |
| BFUN-04 | PASS | backend/utils/catalogData.js:38 | New reference IDs derive from unique ObjectIds; existing reference IDs are immutable and retained. |
| PUB-01 | PASS | frontend/src/App.jsx:66; frontend/src/NotFound.jsx:5 | A branded 404 provides working recovery links. |
| PUB-02 | PASS | frontend/src/CategoryView.jsx:9; frontend/src/CategoryView.jsx:98 | The public collection requests 30 records per page with server totals, filter options and category counts; no 500-record ceiling. |
| PUB-03 | PASS | frontend/src/Workshop.jsx:54 | A bounded native Workshop dialog has a visible close control, scrolling, Escape, focus restoration and background scroll containment. |
| PUB-04 | PASS | frontend/src/CategoryView.jsx:13; frontend/src/GemDetails.jsx:130 | FAIL at start of this review: legacy certificate text still asserted certification. Corrected to explicit true, now PASS with positive/negative detail tests. |
| PUB-05 | PASS | frontend/src/api.js:3; frontend/src/Contact.jsx:45; frontend/src/Workshop.jsx:2 | A shared normalized API base supports optional /api suffixes; public/admin requests use bounded helpers. |
| A-F01 | PASS | frontend/src/admin/WebsiteSettings.jsx:5; frontend/src/admin/settingsPolicy.js:7; frontend/src/ContactMedia.jsx:22 | Verified owner-supplied contact values are visibly read-only in settings and excluded from writes. Optional saved Contact photos/film now render in a collapsed disclosure; existing page layout is retained. |
| A-F02 | PASS | frontend/src/AdminInventory.jsx:197; frontend/src/api.js:23 | Independent resources settle separately; each request has a deadline, recoverable errors and explicit retry. Dirty form state is preserved. |
| QA-01 | PASS | frontend/package.json:9 | Full frontend ESLint passes after the effect/dead-code and component fixes. |
| BFUN-05 | PASS | backend/routes/inventoryRoutes.js:33; backend/utils/catalogData.js:27 | Malformed IDs return 400; missing edit/delete/feature/review records return 404 with JSON errors. |
| BFUN-06 | PASS | backend/utils/assetCleanup.js:3 | Cloudinary cleanup preserves dotted IDs, checks the configured cloud/folder and uses the correct image/video resource type. |
| BFUN-07 | PASS | backend/utils/singletonContent.js:4; backend/utils/singletonContent.js:40 | Public content GETs return defaults without writes; authorized saves converge on a canonical singleton. |
| PUB-06 | PASS | frontend/src/Contact.jsx:262; frontend/src/Feedback.jsx:178; frontend/src/GemDetails.jsx:46 | Public pages provide a real main-content target for the keyboard skip link. |
| A-F03 | PASS | frontend/src/api.js:68; frontend/src/AdminOperations.jsx:157 | Admin inventory and stock fetch every bounded server page and reject partial/mismatched snapshots. Tested with 1,205 inventory and 405 stock records. |

## Verification executed in this review

Backend `npm test`: **48/48 PASS** using actual local routes/schemas/middleware with synthetic model/cloud operations. Full frontend ESLint and Vite production build: **PASS** after code changes. The GemScene warning remains visible rather than being silenced. Fresh full npm registry audits of both unchanged lockfiles returned **0 known vulnerabilities**; this is not a guarantee of application/infrastructure security.

| Suite | Result | Evidence |
| --- | --- | --- |
| Public/mobile/keyboard | 20/20 PASS | production-readiness-evidence/suite-1.json |
| Admin/pagination/mobile | 13/13 PASS | production-readiness-evidence/suite-2.json |
| Images/decode/cache/source changes | 17/17 PASS | production-readiness-evidence/suite-3.json |
| Gallery/video/responsive | 43/43 PASS | production-readiness-evidence/suite-4.json |
| Certificate/CDN/chart split | 6/6 PASS | production-readiness-evidence/suite-5.json |
| Custom hero CDN fallback | 1/1 PASS | production-readiness-evidence/suite-6.json |
| Production-mode CORS/API/SPA source rules | 5/5 PASS | production-readiness-evidence/suite-7.json |
| Responsive hero DPR1/DPR2 transfer | 2/2 PASS | production-readiness-evidence/suite-8.json |
| Final hero source race with new candidate | 1/1 PASS | production-readiness-evidence/suite-9.json |

Public/admin responsive verification covers 320/390/768/1440px, independent API timeouts/recovery, complete pagination, Workshop dialog/keyboard behavior, media and read-only contacts. Existing multi-upload limits (10 photos, 8 MiB each; 2 optional videos, 50 MiB each) and stored media URLs are unchanged. Browser tests mock every API or wrap fetch with synthetic responses; no real auth/upload/mutation occurs. New configuration tests run the actual middleware in production mode with the exact Vercel origin, confirm allowed/denied origins, preflight, private no-store and protected 401 routes. The test health status is deliberately 503 because it never connects to MongoDB; this is not a live health failure.

## API, configuration, hosting and data compatibility

- **PASS locally:** normalized `VITE_API_URL`, catalog paging/filter metadata, all-page admin fetching, media response contracts, authenticated stock/planner routes and public/private cache separation. Real MongoDB execution/performance remains PENDING: local tests do not exercise an Atlas server.
- **PASS source configuration:** Vercel SPA rewrites and no-cache document rules cover Home, catalog, details, category and admin routes while excluding file paths. Versioned assets have intended immutable headers. **PENDING deployed behavior:** actual Vercel root, production branch, environment scopes, MIME types, 404/deep-link behavior and response headers must be checked after release.
- **Required Render values:** `NODE_ENV=production`, `ALLOWED_ORIGINS=https://pinnawala-gems.vercel.app`, Node 24; verify actual proxy topology before setting `TRUST_PROXY_HOPS=1`. Existing Mongo/JWT/admin/Cloudinary/Google credentials must be preserved. Production secrets were not inspected, printed or changed.
- **Required Vercel values:** root `frontend`, Vite, Node 24, install `npm ci`, build `npm run build`, output `dist`, public `VITE_API_URL=https://pinnawalagems.onrender.com`; preserve optional public Google client ID. These intended settings do not establish the values currently in either dashboard.
- No architecture, schema migration, storage account, Cloudinary original, reference ID, font, CSS design or 3D rendering change was made. A local hash check confirms all original assets recorded in the asset manifest still match. Real production asset availability, backup/storage durability and credentials are PENDING operator checks. Existing local `.env` files are not tracked in Git; their contents were not read.
- Cross-version cutover needs coordination: the old backend may lack required APIs/metadata; an older frontend can request more than the new 200-record cap. Verify backend first, then promote its matching frontend promptly. Keep admin edits paused during verification. Older CMS singleton readers can select legacy content after newer canonical saves; the rollback checklist addresses this without modifying data.

## Exact release/rollback handoff

Use the repository's **RELEASE_CHECKLIST.md**, also copied beside this report. It supplies the exact Render/Vercel settings, environment matrix, deployment sequence, health/CORS/401/SPA/cache commands, rollback instructions and operator sign-off gates. **No ZIP upload is needed.** Older ZIPs and the earlier performance report are historical snapshots; they do not include these readiness changes.

Order: approval and final SHA/rollback record → Render configuration and approved deployment → verified health/features/revision/contracts → matching Vercel deployment → real production network/image/navigation/performance tests → operator acceptance. Do not push a production-connected branch until its auto-deploy consequences are approved. No deployment, platform setting, branch, credential or production record was changed by this review.

Real cold/warm/mobile-network, catalog images, route transitions, API failures, actual headers and production LCP/CLS/INP are **PENDING** until deployment is explicitly authorized and complete. The checklist defines at least three cold/warm samples, real fonts/CDN/APIs with no mocks, cache-safe observation, physical-device limitations and read-only admin checks. There is no claim that the live problems are resolved.

## Artifacts and remaining decisions

- Final release SHA and actual dashboard deployment IDs: **PENDING**.
- Operator verification of roots/branches/env/proxy/storage/Cloudinary policy/DB version and backup: **PENDING**.
- Cold-mobile LCP ≤2.5 s in repeated local tests: **FAIL**; needs further measured work or explicit operator risk acceptance before performance sign-off.
- Authorization, Render/Vercel deployment and live verification: **PENDING**. Preparation is complete; production readiness is not certified.

Evidence directory: `production-readiness-evidence/`, including exact test results, original/variant image manifest, repeated timing runs and a source SHA-256 fingerprint. The fingerprint records this working tree; it does not substitute for the eventual Git commit or deployed revision.

Platform reference details and supported rollback behavior are linked in RELEASE_CHECKLIST.md. Earlier audit/performance PDFs remain historical evidence, not current release acceptance.

## Home loading and mobile refinement — 24 November 2026

Reviewed starting commit: `ea883e1`. These are additional working-tree changes; no staging, commit, push, deployment, secret change or production write was performed in this follow-up.

| Gate | Status | Evidence |
| --- | --- | --- |
| Correct initial welcome and early featured images | PASS | 41/41 local production-build Home checks. Settings and featured requests begin 1–2 ms apart; the first three primary photos load before scrolling, while later images remain lazy. Delayed custom heroes use readiness for their own source. |
| Bounded initial loading and real recovery | PASS | Initial loader exits as soon as settings/current hero/visible selection are ready, capped at 3.5 seconds plus the existing short fade. Slow settings retain a neutral title skeleton instead of showing an incorrect temporary heading. API 503 and actual image-request failures recover without refresh. |
| Collection banner and category requests | PASS | 21/21 checks: full native load/decode before image reveal, readable navy/copy while pending, custom-image fallback, terminal-error retry, rapid navigation, cache, filters and unknown categories. Unresolved category slugs make no unfiltered inventory request. |
| Mobile navigation and media discovery | PASS | 58/58 navbar/gallery checks plus 5/5 category-label widths. Compact phone typography, 44 px controls, direct Collection navigation and thumbnail boxes above the main image. 320–1280 px layouts covered, including landscape. |
| Magnifier and media functionality | PASS | 21/21 checks, including actual rendered pixels, portrait/landscape pointer mapping, watermark, expanded photos, swipe and video behavior. |
| Backend regression / frontend lint and build | PASS | 56/56 backend tests; full frontend lint and production build successful. Existing deferred Three.js size warning remains. |
| Cold-mobile LCP at or below 2.5 seconds | FAIL | Latest narrow scheduling experiment: median 2.752 s, range 2.728–2.880 s. This is a local lab result, not live production performance. |
| Production deployment and real-network verification | PENDING | No production requests or writes in this follow-up. Render/Vercel revisions, real API/CDN/fonts, physical phones, cold/warm loading and live cache/routing still require the authorized deployment and checks below. |

All 146 browser assertions use synthetic read-only APIs; photo requests and the final WebGL first-frame check use real local assets. The isolated Home UI cases hold 3D responses to test readiness races deterministically; a separate native-scene case verifies GLB/HDR requests start after the loader closes, before any scrolling, and the actual scene renders. No image files, model geometry/materials, business records, Cloudinary assets or credentials changed.

### Measured 3D preparation scheduling experiment

Both versions already include the welcome/featured/banner/mobile fixes. The only experimental change is preparing the offscreen 3D scene immediately after the initial loading overlay closes instead of preparing it while critical welcome content is pending. It still starts before scrolling; geometry, quality, animations and interactions are unchanged. This can delay 3D readiness by approximately one second in the constrained lab case, while reducing contention during the welcome reveal.

Three cold Chrome traces per version: actual Vite production builds, 390×844, DPR 1, CPU 4× slowdown, 150 ms latency, 200,000 B/s download, fresh browser cache, reduced motion, blocked external fonts, synthetic settings delayed 1,200 ms and featured API delayed 800 ms. Real local image/model/HDR bytes were used. These conditions differ from the historical report and do not measure Render or Vercel.

| Measurement | Prepare during welcome | Prepare after reveal |
| --- | ---: | ---: |
| Median LCP | 2.932 s | 2.752 s |
| Minimum–maximum LCP | 2.784–3.120 s | 2.728–2.880 s |
| Maximum CLS | 0 | 0 |
| Median TTFB | 0.013 s | 0.013 s |
| Median resource load delay | 0.273 s | 0.257 s |
| Median resource load duration | 0.569 s | 0.573 s |
| Median element render delay | 2.065 s | 1.913 s |
| Median loading overlay removal | 4.250 s | 4.020 s |
| Comparable page-image transfer, excluding the unchanged 3D texture | 134,084 B | 134,084 B |
| Completed image transfer at the 8-second observation limit | 256,283 B | 134,084 B |

Subpart medians are computed independently. The lower completed-image total is **not a compression saving**: the same 122,199 B 3D logo texture now completes after the observation window. Image asset bytes and quality are unchanged. The first three featured images are intentionally eager at low priority; this can request an additional offscreen primary image on narrow phones, while the remaining images remain lazy.

Three samples per version, collected in successive groups, are insufficient to establish that this scheduling change caused the small LCP difference. In all six traces, 3D requests start after LCP, so 3D is not the cause of the measured initial LCP. The remaining dominant subpart is element render delay; no unverified attribution to a particular animation or font is made. The retained improvement is the verified separation of welcome rendering and 3D preparation. No further quality reduction, animation removal or speculative architecture change was introduced.

Workspace evidence: `.tmp/home-loading-final/production-qa-results.json`, `cold-mobile-before-results.json`, `cold-mobile-after-results.json` and six corresponding Chrome trace JSONs; `.tmp/category-banner-ui/complete-reveal-results.json`; `.tmp/mobile-gallery-refinement/results.json` and `category-labels-results.json`; `.tmp/gem-magnifier-admin-security/magnifier-results.json`. The `.tmp` directory is outside the Git repository and is not a release dependency.

## Finalization: complete Home reveal, phone UX and sole Google owner — 24 November 2026

This section supersedes the earlier bounded-3.5-second Home reveal policy. That policy could show the hero with its title still pending, exactly as the owner's later screenshot demonstrated. The updated candidate keeps a branded loading surface until Home settings, category data, featured data and announcement data have resolved, the current hero has decoded, and the four displayed category photographs plus first three featured photographs have loaded. There is no minimum loading delay and no timer that exposes an unfinished heading. Secondary gallery photos, video bodies and the below-fold 3D scene are not used to hold the entire page unnecessarily.

Slow service after six seconds offers navigation to the collection or contact page. Terminal API/image errors and malformed response data show recovery on the loading screen; Retry makes actual requests, and successful recovery reveals the completed page without a browser refresh. Invalid/default placeholder text is never exposed during initial data loading. Valid previously cached data can still be used if background refresh fails.

This changes presentation/readiness, not the speed of a remote API: a cold or unavailable server can still delay complete content. Two successful, unauthenticated read-only production diagnostics returned Home headers in approximately **609 ms** and featured headers in **998 ms**; both HTTP 200, with no `Cache-Control` header observed. These two warm-path checks do not establish cold-start behavior or certify the deployed release. They reinforce that the matching backend's caching/security configuration must actually be deployed. No production records or media were written.

| Current check | Status | Evidence / limit |
| --- | --- | --- |
| Home complete-reveal and failure recovery | PASS | 15/15 production-build browser checks: slow data beyond the previous cutoff, desktop/phone, all four category images, actual image 404 recovery, transient API 503, terminal/malformed data retry, usable slow-service exit and real WebGL first frame before scrolling. |
| Phone interaction and retained gallery/magnifier | PASS | 106/106 production-build checks: 27 phone-flow/menu/filter checks, 58 navbar/gallery checks and 21 actual-pixel magnifier checks. Desktop layout retained; no production writes. |
| Phone footer remains readable | PASS | 20/20 additional production-build checks. A single intersection observer hides the closed/unfocused portrait at the phone footer and restores it above; open chat, focus, reduced motion, desktop and the footer WhatsApp link remain usable. |
| Collection banner and category filters | PASS | 21/21 production-build checks rerun against the final loading/mobile candidate. |
| Google sign-in frontend | PASS | 27/27 production-build checks using mocked GSI/API: server-authoritative method/client ID, wrong-account denial, no token storage before session verification, policy/SDK retry and mobile sizing. Public routes make zero administrator Google SDK requests. |
| Backend security and business regression | PASS | 65/65 real local route/schema tests, including 9 new sole-owner policy checks. Model/cloud operations are synthetic. |
| Full frontend lint and build | PASS | Successful. Deferred Three.js engine chunk still exceeds the build warning threshold; no image-quality or 3D-material reduction introduced. |
| Actual owner Gmail and OAuth client configured | PENDING | The owner has not supplied an account/client ID. No contact email was guessed as an administrator. The separate guide identifies the required manual values and setup steps. |
| Live Gmail-only access / deployment / physical-device performance | PENDING | Actual secrets and platform environments remain unchanged. Operator must activate the strict server policy and deploy matching Render then Vercel code. Real sign-in, hosted headers and post-deployment cold/warm/mobile checks remain required. |

The source supports strict `ADMIN_AUTH_MODE=google` with exactly one `ADMIN_GOOGLE_EMAIL`. Other verified Google accounts are rejected. Password login and existing password JWT access are denied in this mode. Both scoped and compatible legacy sessions recheck the current identity policy on every private API request. Removing/changing the owner denies subsequent private requests even if a signed token has not expired. Invalid strict configuration disables sign-in while public pages remain available. The backward-compatible unset mode remains `mixed`; Gmail-only production access is **not activated** merely by committing these files.

The frontend obtains only public sign-in capabilities/client ID from `/api/admin/auth-options`; the owner's email and secrets are not disclosed there. Google SDK code is loaded only for permitted administrator login. Authentication still uses existing bearer storage and an eight-hour session limit; Google account sign-out alone does not revoke the website JWT. Previously rendered data can remain until session revalidation or sign-out, although unauthorized new API reads/writes are denied immediately. No claim of HttpOnly-cookie, MFA enforcement, device binding or complete OWASP compliance is made.

Manual handoff: [ADMIN_GOOGLE_SETUP.md](ADMIN_GOOGLE_SETUP.md), [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md), [FINAL_GIT_RELEASE.md](FINAL_GIT_RELEASE.md). The current candidate has not been deployed by the assistant. The earlier 2.752-second lab median predates this complete-reveal policy and must not be presented as a fresh measurement of it; production performance acceptance remains pending.

Current workspace evidence: `.tmp/home-complete-reveal/results.json` and loading/ready screenshots, `.tmp/mobile-native-polish/results.json` and `footer-widget-results.json`, `.tmp/mobile-gallery-refinement/results.json`, `.tmp/gem-magnifier-admin-security/magnifier-results.json`, `.tmp/category-banner-ui/complete-reveal-results.json`, `.tmp/google-owner-frontend/results.json`, and the backend test output. The current groups total 189 browser assertions and 65 backend tests. None is a runtime dependency or a ZIP release package.

## Dual-method administrator login — 25 November 2026

The login entry form no longer disappears when sign-in capability discovery is unavailable. Email/username and password fields stay available during discovery failures; a successful server policy that disables password access is still respected. Actual login and `/api/admin/session` verification remain mandatory before storing a token or loading private screens. Missing backend routes now explain the required backend update instead of leaving only an unhelpful retry control.

`POST /api/admin/login` supports the existing `username` field and an `email` alias. Email identifiers match case-insensitively, ordinary legacy usernames and passwords remain case sensitive, conflicting aliases/types are rejected, and both aliases share the same bounded guess limiter. Invalid Google client configuration disables only Google in mixed mode and cannot hide or disable a properly configured password method. Google allowlist checks and optional strict Google-only policy remain enforced by the backend.

| Gate | Status | Evidence |
| --- | --- | --- |
| Requested local credentials | PASS | Explicit owner request applied only to Git-ignored `backend/.env`; actual local auth router accepted the requested account and verified its session. Wrong-password and anonymous-session checks rejected access. Disposable test signing key; no database/cloud or production login requests. |
| Backend tests | PASS | 72/72, including 7 additional dual-login validation, identity, limiter and Google configuration regressions. |
| Frontend login checks | PASS | 19/19 on the local production build: both entry methods, discovery failure recovery, server-policy denial, no token/private screen before session verification, incorrect credentials and mobile layouts. |
| Frontend lint / production build | PASS | Full checks passed. Existing deferred Three.js size warning unchanged. |
| Actual Google sign-in activation | PENDING | No valid Google Web client ID configured locally or supplied by the owner. The Google option explicitly indicates setup is required; no provider is faked. |
| Live administrator access | PENDING | Three unauthenticated read-only GET probes to auth-options, session and health all reached the 15-second timeout. This does not establish the deployed backend version or a specific hosting fault. No live credential login, environment write, push or deployment was performed. |

The password is absent from tracked source, tests and operator documentation. Existing database, JWT and Cloudinary settings were preserved. An ignored local environment file does not reach Render through Git; the operator must configure the corresponding Render values and deploy the matching backend before the frontend. Follow [ADMIN_LOGIN_SETUP.md](ADMIN_LOGIN_SETUP.md). Workspace evidence: `.tmp/admin-dual-login/local-config-smoke-results.json`, `.tmp/admin-dual-login/live-readonly-status.json` and `.tmp/dual-login-frontend/results.json`.
