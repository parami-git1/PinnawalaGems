# Pinnawala Gems production release checklist

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

## Verified admin portal and photograph magnifier release — 20 November 2026

Deploy the backend first. The new frontend intentionally refuses to mount administrator screens until `GET /api/admin/session` verifies the bearer token and returns an administrator identity plus a future `expiresAt` timestamp in milliseconds. An older backend without this endpoint cannot safely support the new frontend; a network error or 404 must never bypass verification.

1. Deploy the matching Render backend without changing existing credentials, `JWT_SECRET`, MongoDB data or Cloudinary configuration. Confirm `/api/health` advertises `admin-session-verification`, and an anonymous `/api/admin/session` returns JSON 401 with `Cache-Control: no-store`. Use the owner's normal sign-in for the authorized read-only check; do not paste or log its bearer token.
2. Build and deploy the matching Vercel frontend. Keep the existing `VITE_API_URL` and Google client ID. The optional `VITE_ADMIN_PORTAL_PATH` is a **public build-time route identifier**, not a password or secret. Its default is `/workspace/pg-0d221cf9d8b8c1683d22fdea`; overrides must stay beneath `/workspace/` so the non-indexing and no-store hosting headers apply. Rebuild after changing it.
3. Bookmark `/workspace/pg-0d221cf9d8b8c1683d22fdea/sign-in` (substitute the configured path when overridden). `/admin` and `/admin-login` deliberately return the ordinary not-found page and do not reveal the replacement through a redirect. Existing administrator username/password and approved Google accounts are unchanged.
4. Confirm the actual hosted portal response includes `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` and `Cache-Control: no-store`. Confirm unauthorized, forged, expired and non-admin sessions cannot load the workspace. Verify valid sign-in restores the intended internal admin view, logout clears the visible workspace across tabs, and an expired older request cannot clear a newly signed-in session. Transient verification failure must show a locked retry state.
5. Open an existing catalog item. Check the magnifier at the center and corners of portrait and landscape photographs, the enlarged photo dialog, watermark position, mobile swipe, optional video controls, and error/retry behavior. Hovering must reuse the displayed photo and cause no gallery layout jump. Do not modify inventory or upload assets for this verification.
6. If rollback is required, restore the previous frontend **before** removing the new backend session endpoint. A previous frontend can use the updated backend's compatible bearer-token login; the new frontend must not be left paired with a backend that cannot verify sessions. Preserve all existing production records and media.

A long route reduces casual guessing; a public JavaScript bundle can still disclose its path. The API remains the authorization boundary. This release preserves the current stateless bearer-token storage/transport to avoid breaking the cross-origin Render/Vercel deployment. It does not add HttpOnly cookies, a BFF, MFA, individual token revocation, or a hosting access gateway; it must not be described as complete OWASP compliance. Those require a separately coordinated authentication/deployment change. See [OWASP authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) and [session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
