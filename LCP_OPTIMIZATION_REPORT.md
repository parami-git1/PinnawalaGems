# Pinnawala Gems — LCP optimization and final release candidate

17 November 2026 · Asia/Colombo

**Overall: PENDING.** The candidate is measurably faster, but repeated cold-mobile LCP still misses 2.5 seconds. No production-connected commit, staging, push, deployment, secret change or production write was performed. The live website was not tested as a newly deployed release. This report supplements the historical production-readiness and performance reports.

## Status

| Gate | Status | Result |
| --- | --- | --- |
| Critical-path improvement | PASS | Normal cold median LCP 3.116→2.664s (14.5%); final confirmation range 2.620–2.740s. |
| Cold-mobile LCP ≤2.5s | FAIL | All final normal-motion samples still exceed 2.5s. Reduced-motion median 2.688s. |
| CLS and image transfer | PASS | Normal CLS max 0.000674 unchanged; reduced 0. No image-byte reduction or quality change in this optimization. |
| Original-fallback retry defect | PASS | Reproduced stale rejected fallback promise; manual retry now refetches a recovered original in about 0.1s without refresh. |
| Current automated verification | PASS | Backend 48/48; frontend full lint/build; all regression suites listed below pass. |
| Appearance/business/3D preservation | PASS | No CSS, animation duration, material, geometry, font or image encoding changes retained this review. Original/variant hashes match. |
| Production settings/deployment/live metrics | PENDING | No commit/push/deploy/secrets change/production write. Real Render/Vercel revisions, headers, fonts/CDN and live CWV remain unverified. |

## Before / after under the same profile

| Profile / cache | Samples | Median LCP | Min–max LCP | Max CLS | Image transfer median |
| --- | --- | --- | --- | --- | --- |
| Baseline, normal cold | 3 | 3.116s | 3.004s–3.344s | 0.000673 | 103,434 B |
| Final, normal cold | 3 | 2.664s | 2.620s–2.740s | 0.000673 | 103,434 B |
| Baseline, normal warm | 3 | 1.408s | 1.388s–1.600s | 0.000673 | 1,500 B |
| Final, normal warm | 3 | 1.188s | 1.180s–1.212s | 0.000673 | 1,500 B |
| Final, reduced cold | 3 | 2.688s | 2.616s–2.704s | 0.000000 | 103,434 B |
| Final, reduced warm | 3 | 1.208s | 1.188s–1.280s | 0.000000 | 1,500 B |

Normal cold LCP improved **14.5%**, with no image-quality sacrifice. The hero body remains **33,020 B** at DPR1, measured as **33,320 B** including local request overhead. Higher-density mobile keeps the original 900px candidate. Total completed image transfer at the fixed observation point remains **103,434 B cold / 1,500 B warm**; the warm amount is conditional-request overhead, not redownloaded bodies. No image files were recompressed or replaced in this review.

Practical initial-loader removal improved from median **3.485s to 3.030s**. This is reported separately because an image can become an LCP candidate before the overlay has finished fading. The loader's existing 180ms transition, reduced-motion behavior, timeout and readiness checks remain unchanged; LCP was not improved by merely removing the overlay or hiding content.

## Trace method and actual bottleneck

Real Vite production builds executed in Chromium at 390×844, DPR1, normal motion, 150ms configured network latency, 200,000 B/s down, 100,000 B/s up, CPU4x. Every experiment has three new contexts, each cold (explicit browser-cache clear) then warm. Chrome Performance traces cover navigation until five seconds after critical readiness, with no input or scrolling during LCP observation. No Playwright request routing is used in timing contexts. API fetch fixtures preserve cache behavior; Google fonts/maps/identity are blocked consistently with the earlier controlled profile. Raw navigation/resource timings, LCP candidates, decode timestamps, readiness marks and long tasks were retained. Failed tests and rejected experiments were not relabeled as wins.

The new traced baseline is **3.116s**, rather than the prior report's 2.848s median. The protocols differ: tracing/instrumentation overhead, explicit cache clearing and a longer final observation window. Only the matched baseline/final traces support the improvement claimed here. These are local lab results, not field Core Web Vitals or a production Lighthouse score.

### LCP subparts

| Subpart | Baseline median-LCP run | Final median-LCP run |
| --- | --- | --- |
| TTFB | 6.0ms | 5.4ms |
| Resource load delay | 567.7ms | 235.6ms |
| Resource load duration | 500.8ms | 560.6ms |
| Element render delay | 2041.5ms | 1862.4ms |

These are the actual runs whose LCP equals each group median, so each column sums to that run's LCP (3,116ms / 2,664ms). The local HTML TTFB is the observed responseStart, not an invented 150ms: CDP's configured network profile does not make loopback headers equivalent to a real Vercel request. Resource delay uses image requestStart minus document responseStart; duration ends at the image responseEnd; render delay is responseEnd to the final image LCP. The LCP element is the real hero IMG.

Confirmed findings:

- **Scheduling:** the deferred external hero helper introduced another fetch/execution step. Baseline median hero request delay was about 583ms. Starting the same responsive image directly during HTML parsing lowers the corresponding median to about 240ms. The browser still fetches exactly one selected hero candidate.
- **Decode timing:** previously the component first asked to decode the already-downloaded hero near the end of React startup; a representative call took about 113ms under CPU4x. Early warmup finishes that decode before the app needs it; the later cached decode is about 13ms in the diagnostic run. The component retains its own success/error state and decoded DOM handoff.
- **Render work remains dominant:** the representative final run still has about **1,862ms** between image download completion and image LCP. React route startup, stylesheet readiness, full-document layout, the native loading dialog commit and the image handoff are on this path. Baseline pre-LCP Layout totals were about 797–956ms; final totals about 658–682ms. These are trace observations, not proof that all of render delay is pure JavaScript or that one layout call explains all variation. Trace task categories overlap and must not be added together.
- **CSS/React waterfall:** initial Home JS/CSS used to be discovered around 1.48s in the first trace. Moving their discovery to about 0.26s did not improve cold LCP because execution/layout and resource contention remained. Eager-importing Home also gave too little cold benefit for its extra bytes on other direct routes. These experiments were removed.
- **Fonts:** the page's external Google Fonts stylesheet is render-blocking; font-display swap governs font painting, not stylesheet fetching. Because the controlled profile deliberately blocks those requests, there is no evidence here that real production font delivery is fast or harmless. The font family, weights, sources and loading policy were preserved; real font timing remains PENDING.
- **Animation/3D:** no animation was removed, shortened or disabled to hit a metric. The initial hero LCP does not request gem.glb; the unchanged 3D renderer remains deferred and its 13 functional checks pass. Its 1.063MB raw chunk is not the cause of this first-viewport download delay. Real low-end GPU performance remains unverified.

## Experiments tested individually

| Experiment | Cold median | Cold min–max | Warm median | Decision |
| --- | --- | --- | --- | --- |
| baseline | 3.116s | 3.004s–3.344s | 1.408s | Reference candidate |
| early-home | 3.140s | 2.992s–3.628s | 1.420s | Rejected: no cold benefit |
| early-style | 3.160s | 3.124s–3.404s | 1.328s | Rejected: cold regression |
| eager-home | 3.072s | 2.944s–3.120s | 1.276s | Rejected: small cold benefit, larger entry on every route |
| early-decode | 2.660s | 2.648s–2.732s | 1.316s | Retained; then independently confirmed |
| commit-decode | 2.804s | 2.716s–2.816s | 1.192s | Rejected: worse cold LCP than early-decode |
| final | 2.664s | 2.620s–2.740s | 1.188s | Final confirmation of retained change |

All entries use the same three cold/warm-pair protocol. The final confirmation repeats the retained early-decode candidate independently. The separate layout-effect experiment started eligible image work before paint but worsened cold LCP relative to early-decode, so it was reverted. The small build-time Home-hint plugin and eager Home import were also removed; Vite configuration and lazy route boundaries are preserved. No paid service, dependency, blanket preload, artificial delay, lower-quality image or redesign was introduced.

## Genuine image retry defect corrected

When an optimized CDN URL failed, its original URL could fail transiently too. The rejected fallback promise was cached for 30 seconds. The detail Retry button changed the primary request key, but the fallback ignored that retry key and kept reusing its old failure, even after the original became available.

The bug was reproduced against the old production build with transformed403 → original503 → Retry. The original was not requested again. The fix forwards the manual retry key to the original fallback job. Final regression proves transformed403 → original503 → Retry → original200 and decoded display in about **0.1s**, without a browser refresh, with srcSet cleared for the fallback. Permanent failures still show a real unavailable state without an automatic retry loop. These are synthetic responses demonstrating a real state-management defect; they are not claims of those status codes on the production CDN.

The new HTML warmup is best effort; actual visible-image failures remain handled and diagnosed by ResponsiveImage. It also works when HTMLImageElement.decode is unavailable. The old decode-gate test assumed the first decode occurred after React mounted; it was corrected to delay the component's decode specifically. It still asserts the loader remains until that decode succeeds. The final full image suite passes 17/17.

## Verification on the retained candidate

Backend registered-route/schema/security/media tests **48/48 PASS**. Frontend full lint and production build **PASS**. The existing deferred GemScene size warning remains visible.

| Regression suite | Result | Evidence |
| --- | --- | --- |
| Public/mobile/keyboard | 20/20 PASS | lcp-evidence/test-1.json |
| Admin/pagination/mobile | 13/13 PASS | lcp-evidence/test-2.json |
| Admin multi-photo/video editor | 9/9 PASS | lcp-evidence/test-3.json |
| Images/decode/cache/route transitions | 17/17 PASS | lcp-evidence/test-4.json |
| Gallery/video/responsive | 43/43 PASS | lcp-evidence/test-5.json |
| 3D appearance/rotation/keyboard/mobile | 13/13 PASS | lcp-evidence/test-6.json |
| Public cache/stale refresh/retry | 3/3 PASS | lcp-evidence/test-7.json |
| Mutation-driven cache invalidation | 6/6 PASS | lcp-evidence/test-8.json |
| Certificate/CDN/chart split | 6/6 PASS | lcp-evidence/test-9.json |
| Custom Home CDN fallback | 1/1 PASS | lcp-evidence/test-10.json |
| Responsive hero DPR1/DPR2 | 2/2 PASS | lcp-evidence/test-11.json |
| Production-mode local CORS/API/SPA rules | 5/5 PASS | lcp-evidence/test-12.json |
| Original-fallback manual retry recovery | 1/1 PASS | lcp-evidence/test-13.json |
| Inline bootstrap/no-decode/direct-catalog | 2/2 PASS | lcp-evidence/test-14.json |

All API mutations, authentication and upload traffic in those tests are synthetic. No production records, Cloudinary assets, credentials, schema/indexes, storage account or business content were changed. Existing original/optimized asset hashes match the manifest. No font, CSS, hero composition, animation or 3D material/geometry change was retained. The extra HTML helper adds about **0.27KB gzip** to the document and starts decode earlier; its trade-off is small earlier CPU work, with one hero request on Home and none on direct catalog.

## Remaining limitation and release decision

**The 2.5s cold-mobile target was not reached safely.** Final normal range is 2.620–2.740s; reduced-motion cold range is 2.616–2.704s. Further image compression would sacrifice quality while leaving the dominant render work. More hints/eager imports and a layout-effect change did not justify their costs. More aggressive changes to initial rendering, page containment or pre-rendering would need their own architecture/layout/scroll/animation validation; they were not introduced speculatively here.

The retained change is a measured improvement with the existing appearance and features. It is not a declaration that the site's performance is good on every device or that deployment is safe without the remaining checks. Real Render latency/cold starts, Vercel headers/TTFB, Google fonts, Cloudinary policies, real APIs, physical phones, Safari and field INP/CrUX remain **PENDING**. No new live website/API/CDN requests were made to certify the release.

## Exact final Git and deployment handoff

Use **FINAL_GIT_RELEASE.md** for the exact proposed file whitelist, reviewed base, Git review/staging/commit/push commands and explicit authorization gates. Final commit SHA remains PENDING; nothing was staged, committed or pushed. Earlier readiness edits remain part of this working-tree candidate and must be reviewed together.

Use **RELEASE_CHECKLIST.md** for the coordinated Render → health/features/revision/CORS/protected401 checks → matching Vercel deployment → real-network tests, with required environment values and rollback. The frontend is https://pinnawala-gems.vercel.app; the backend target is https://pinnawalagems.onrender.com. Preserve existing secrets; Render production ALLOWED_ORIGINS must include the exact frontend origin. Both platform branches/roots/runtime/env/proxy/storage and previous successful deployment IDs still require operator confirmation. Hold automatic production promotions before an authorized push so deployment order can be enforced.

Post-deployment testing must use actual fonts/APIs/CDN with no fixtures: repeated cold/warm mobile and desktop visits, navigation, images at DPR1/DPR2, cache headers, deep-link reloads, genuine API errors and LCP/CLS. Do not create production test records/uploads. Roll back compatible application artifacts when necessary; never delete/restore production data or Cloudinary originals as an automatic rollback step. No ZIP upload is needed.

## Evidence

The lcp-evidence directory includes all experiment summaries, per-run resource timings, decode/readiness records, final regression results and representative median-LCP Chrome trace JSONs. Open baseline-median-cold.trace.json and final-median-cold.trace.json in Chrome's Performance panel. All 48 raw experiment trace files remain in the workspace .tmp/lcp-investigation directory (seven normal-motion experiment groups plus reduced-motion confirmation). The retained image-retry reproduction and the measurement/analysis scripts are also included. Script paths in copied harnesses are local-environment references; run the original workspace harnesses for reproduction.

Method references: Google's LCP subpart guidance at https://web.dev/articles/optimize-lcp and Vite's HTML hook documentation at https://vite.dev/guide/api-plugin. The latter was used only for the rejected hints experiment; no custom build plugin remains.
