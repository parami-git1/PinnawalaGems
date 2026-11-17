# Final Git release plan — Pinnawala Gems

17 November 2026. **Prepared only: no staging, commit, push, deployment, secrets change or production write has been executed.**

Reviewed base: `6d0f2a9919012fe6d5d214264bfa5ef3dade2bd7`. Local branch: `main`. Final release SHA: **PENDING** until an explicitly authorized commit. Files below include the earlier uncommitted readiness fixes and the final LCP/retry changes.

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
    'PRODUCTION_READINESS_REPORT.md',
    'RELEASE_CHECKLIST.md',
    'backend/DEPLOYMENT.md',
    'frontend/.env.example',
    'frontend/DEPLOYMENT.md',
    'frontend/index.html',
    'frontend/public/_headers',
    'frontend/public/critical-assets-v2.js',
    'frontend/public/images/perf-home-ceylon-ivory-hero-mobile-480-v1.webp',
    'frontend/public/images/performance-assets-v1.json',
    'frontend/src/AdminInventory.jsx',
    'frontend/src/GemDetails.jsx',
    'frontend/src/GemScene.jsx',
    'frontend/src/Home.jsx',
    'frontend/src/ResponsiveImage.jsx',
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
