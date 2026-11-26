# Final Git release plan — Pinnawala Gems

## Current release candidate — 26 November 2026

Reviewed checkout HEAD: `82465bdb4e3ff2c62983a14c6bb2ce39c7937492`, branch `main`, with the pending source changes below. This is a reviewed base, **not** an approved release SHA. No staging, commit, push, deployment, secrets change or production write was performed. The older staging lists and performance measurements later in this file describe historical work and must not substitute for reviewing the complete current tree.

The current candidate adds Overview category charts/ID management, final phone/gallery interactions, contextual WhatsApp enquiry drafts and the completed admin audit fixes. It retains existing business details, authentication, original images, Cloudinary assets and 3D design. **This candidate includes backend changes:** planner validation/search/date boundaries, sanitized errors and media retention during permanent deletion. Deploy the matching Render backend before Vercel after authorization. No migration, new dependency, environment variable or secret change is required. See `frontend/ADMIN_UI_REFINEMENT.md` for the function-by-function audit.

Include all these pending application/test files in the authorized source review, along with this document and `RELEASE_CHECKLIST.md`:

```text
backend/DEPLOYMENT.md
backend/routes/adminNoteRoutes.js
backend/routes/appointmentRoutes.js
backend/routes/eventAdRoutes.js
backend/routes/feedbackRoutes.js
backend/routes/inventoryRoutes.js
backend/routes/plannerRoutes.js
backend/routes/stockRoutes.js
backend/utils/assetCleanup.js
backend/utils/plannerFields.js
backend/test/catalog-data.test.js
backend/test/feedback-errors.test.js
backend/test/gem-media.test.js
backend/test/media-retention.test.js
backend/test/planner-api.test.js
frontend/ADMIN_UI_REFINEMENT.md
frontend/GEM_MEDIA.md
frontend/src/AdminInventory.jsx
frontend/src/AdminOperations.css
frontend/src/AdminOperations.jsx
frontend/src/AdminPlanner.jsx
frontend/src/admin/Admin.css
frontend/src/admin/AdminContent.css
frontend/src/admin/AdminContent.jsx
frontend/src/admin/AdminDashboard.jsx
frontend/src/admin/GemMediaEditor.css
frontend/src/admin/GemMediaEditor.jsx
frontend/src/admin/WebsiteSettings.jsx
frontend/src/admin/InventoryCharts.css
frontend/src/admin/InventoryCharts.jsx
frontend/src/admin/QuickGemLookup.css
frontend/src/admin/QuickGemLookup.jsx
frontend/src/admin/gemLookup.js
frontend/src/admin/inventoryChartData.js
frontend/src/Contact.jsx
frontend/src/ContactPhone.css
frontend/src/CustomerGallery.css
frontend/src/CustomerGallery.jsx
frontend/src/Feedback.mobile.css
frontend/src/FeedbackGallery.jsx
frontend/src/Footer.jsx
frontend/src/GemDetailsPhone.css
frontend/src/GemMediaGallery.css
frontend/src/GemMediaGallery.jsx
frontend/src/Home.jsx
frontend/src/PublicPhoneNavigation.css
frontend/src/WhatsAppWidget.jsx
frontend/src/Workshop.jsx
frontend/src/gemInquiry.js
frontend/src/workshopContent.js
frontend/src/whatsappLinks.js
frontend/test/gemLookup.test.js
frontend/test/inventoryChartData.test.js
frontend/test/whatsappLinks.test.js
frontend/test/workshopContent.test.js
```

Verify this list against actual `git status --short`, the complete diff and the final approved commit tree; concurrent owner changes can extend the release. Keep real `.env`, uploads, `.tmp` evidence, credentials, dependencies and `dist` out of source staging. New imported modules must be included. No ZIP is needed.

Latest local verification: frontend helpers **53/53**, backend **125/125**, full frontend lint/build and **173/173 admin browser scenarios** passed. The preceding public/mobile/message/recovery task separately passed 52 checks; those are historical evidence, not fresh live measurements. Browser APIs/data were synthetic, all external requests intercepted, and only synthetic test records mutated. Real deployed API/CDN behavior, physical phone/WhatsApp operation and production performance are **PENDING**. Historical LCP results are not acceptance measurements for the current candidate; do not claim the live 2.5-second target is met.

Before any production-connected Git action, obtain explicit authorization, confirm actual platform branches/root directories, preserve current successful deployment IDs and secrets, and record the exact approved SHA. A push may auto-deploy. Follow `RELEASE_CHECKLIST.md` for backend-first order, real read-only checks and archive-aware rollback. The latest admin audit supersedes earlier frontend-only deployment notes. Retain the new backend media-preservation behavior when choosing rollback artifacts; older deletion routes could purge shared media. Do not roll back to a backend that ignores archived sold gems. No approval or deployment is implied by this prepared plan.

## Historical performance release — 17 November 2026

17 November 2026. **Prepared only: no staging, commit, push, deployment, secrets change or production write has been executed.**

Reviewed base: `e3409366e52cd9b6323b1880522cedd9a5c81978`. Local branch: `main`. Final release SHA: **PENDING** until an explicitly authorized commit. Files below include the earlier uncommitted readiness fixes and the final LCP/retry changes.

Local cold-mobile LCP remains above 2.5s (normal-motion median 2.664s), so production sign-off remains PENDING. The operator must explicitly accept this documented limitation or request further measured work before authorizing release. Build/test success alone is insufficient.

## Review before any production-connected Git action

1. Review `LCP_OPTIMIZATION_REPORT.md`, `PRODUCTION_READINESS_REPORT.md`, `RELEASE_CHECKLIST.md`, the exact diff and the source fingerprint in the workspace deliverables.
2. Confirm both actual platform projects, production branch, current successful deployment IDs, backup/storage, environment values and rollback availability. Preserve every existing credential.
3. A push to the connected branch may deploy both services. Before pushing, obtain explicit authorization and have the operator hold automatic production deployments/promotions on both Render and Vercel so backend-first order is enforceable. This session has not changed either dashboard.
4. Run checks from the current checkout: backend `npm ci` / `npm test`; frontend `npm ci` / `npm run lint` / `npm run build`. Keep the supplied lockfiles. Do not use force-upgrade, force-push, a database migration or an asset cleanup.

## Exact proposed staging list

These are instructions for an authorized operator, not actions already taken. From the repository root in PowerShell:

```powershell
git branch --show-current
git status --short
git diff --check
git diff --stat
$releaseFiles = @(
    'FINAL_GIT_RELEASE.md',
    'LCP_OPTIMIZATION_REPORT.md',
    'frontend/artwork/workshop-banner-v3.md',
    'frontend/public/_headers',
    'frontend/public/images/workshop-atelier-editorial-v3-1000.webp',
    'frontend/public/images/workshop-atelier-editorial-v3-1536.webp',
    'frontend/public/images/workshop-atelier-editorial-v3-640.webp',
    'frontend/src/Workshop.jsx',
    'frontend/src/WorkshopHero.css',
    'frontend/src/imageDelivery.js',
    'frontend/vercel.json'
)
git add -- $releaseFiles
git diff --cached --name-only
git diff --cached --stat
```

Stop if the actual diff includes unexpected edits or differs from the reviewed source. The stage list intentionally names files; it does not use `git add .` or include real `.env`, `dist`, uploads, dependency directories or historical ZIPs.

## Only after explicit authorization

```powershell
git commit -m "Improve critical hero scheduling and image retry recovery"
git rev-parse HEAD
# Record that exact SHA as the approved release; verify the production branch.
# Execute only after both platform deployment controls and the cutover are approved.
git push origin main
```

Do not execute these commands merely because this document exists. If either production project uses a different branch, update the approved plan first; do not assume the local `main` proves dashboard settings. No PR merge or branch commit has been performed.

## Coordinated deployment and rollback

Follow `RELEASE_CHECKLIST.md` for the complete environment matrix, read-only commands, post-deployment tests and rollback. Exact targets:

| Target | Required configuration |
| --- | --- |
| Render API | Existing `pinnawalagems.onrender.com` service; root `backend`; Node 24; `npm ci`; `npm start`; health `/api/health` |
| Render browser policy | `NODE_ENV=production`; `ALLOWED_ORIGINS=https://pinnawala-gems.vercel.app`; verify proxy topology before `TRUST_PROXY_HOPS=1` |
| Vercel frontend | Existing `pinnawala-gems.vercel.app`; root `frontend`; Vite; Node 24; `npm ci`; `npm run build`; output `dist` |
| Vercel public environment | `VITE_API_URL=https://pinnawalagems.onrender.com`; preserve the current optional public Google client ID |

Preserve MongoDB/JWT/admin/Cloudinary/Google secrets. Deploy the exact approved SHA to Render, verify 200 healthy database/features/revision and protected JSON 401/CORS/cache contracts, then deploy/promote its matching Vercel build. Verify both deployment SHAs and actual HTML/JS/image headers, deep links and the new inline Home-only warmup. Do not promote the new frontend against the old API.

Run real cold/warm/mobile navigation and image tests only after the authorized deployment is complete, with actual APIs/fonts/CDN and no fixtures. Keep administrator edits paused during cutover; do not create test records or uploads. Verify original Cloudinary/local asset access and the unchanged 3D appearance. Production LCP/CLS/INP remain PENDING until measured honestly.

If critical contracts fail, stop promotion, keep auto-deploys paused and restore recorded compatible deployment artifacts through Render/Vercel rollback controls. Do not roll back MongoDB, delete fields/CMS documents or remove Cloudinary originals. Review older singleton-reader behavior if CMS saves occurred. Reenable deployments only after explicit operator acceptance. No ZIP upload is needed.

## Current Home/mobile follow-up — 24 November 2026

The older whitelist above describes the historical performance change. This follow-up was reviewed against `ea883e1` and changes these application files:

```text
frontend/src/App.jsx
frontend/src/CategoryView.jsx
frontend/src/CollectionBanner.jsx
frontend/src/CollectionBanner.css   (new; include in the eventual release)
frontend/src/GemMediaGallery.jsx
frontend/src/GemMediaGallery.css
frontend/src/Home.jsx
frontend/src/HomeFinal.css
frontend/src/Navbar.css
```

The accompanying documentation changes are `PRODUCTION_READINESS_REPORT.md`, `FINAL_GIT_RELEASE.md` and `RELEASE_CHECKLIST.md`. Inspect the actual `git status --short`, `git diff --check` and complete diff before any authorized staging/commit; concurrent changes need their own review. No files were staged or committed here. Preserve real `.env` files, credentials, production data, images/model assets, lockfiles and current design. No new dependency, environment variable, upload or database migration is required by this follow-up.

Use the dated readiness addendum for the latest 146 browser assertions, 56 backend tests and repeated lab measurements. The 2.5-second cold-mobile target remains unmet. Follow the existing backend-first rollout if the matching admin session endpoint has not yet been deployed; the frontend must not be promoted against an older incompatible API. Record the exact approved Git SHA and both deployment IDs; this document does not authorize a commit, push or deployment.

## Additional finalization files — complete reveal and sole Gmail owner

The owner has made concurrent commits, most recently observed `cbb9ce0`; inspect both committed changes and the working tree. No assistant commit, staging, push or deployment was performed. The earlier file lists are historical and do not cover this entire update.

Include the new runtime module **`backend/utils/adminAuthPolicy.js`** and the separate operator guide **`ADMIN_GOOGLE_SETUP.md`**. Review current changes to backend admin auth routes/session verification/health, reference environment and test fixtures; frontend login/auth-options/main entry, Home/App/loading components, phone styles/navigation, `WhatsAppWidget.jsx/css`, reference environment and hosting headers; and release/readiness documentation. Some frontend login files may already be in the owner's current commit, so `git diff` alone does not establish the complete release content.

Before any authorized release, run `git status --short`, `git diff --check`, full backend `npm test`, frontend `npm run lint` and `npm run build`. Inspect the exact approved commit's file tree and keep real environment files, uploads, dependencies and build output out of source staging. Ensure the new policy module and all new styles referenced by imports exist in the final commit.

The matching backend must expose both `/api/admin/auth-options` and `/api/admin/session`. Operator configuration and real Google Console setup are required for single-owner access; see `ADMIN_GOOGLE_SETUP.md`. Deploy Render first, verify capabilities/health/401, then promote matching Vercel. Preserve credentials/data/assets. The new complete-reveal policy supersedes the previous 3.5-second forced reveal; prior LCP figures are not new measurements of this candidate. No ZIP is needed.
