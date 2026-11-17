# Deploy the optimized frontend

The confirmed production frontend is `https://pinnawala-gems.vercel.app` on Vercel. Follow [the production release checklist](../RELEASE_CHECKLIST.md); deployment requires explicit authorization. The current source preserves branding and normal page layouts and includes the audit fixes, responsive images, independent API loading, collection pagination and deferred 3D/chart loading. Deploy and verify the matching backend before frontend promotion.

## Build from the repository

Use Node.js 24.x, set the existing public build variables in your frontend hosting service, and run:

```sh
cd frontend
npm ci
npm run lint
npm run build
```

Publish `frontend/dist`. Preserve the existing `VITE_API_URL` and any public Google client ID configuration. `VITE_API_URL` accepts the backend origin with or without a final `/api`; it is compiled into the bundle. Changing it requires rebuilding. Never put private MongoDB, JWT, administrator or Cloudinary API secrets in frontend variables.

Deploy from the approved Git commit with Vercel root `frontend`, install command `npm ci`, build command `npm run build`, output `dist` and Node 24.x. Use `VITE_API_URL=https://pinnawalagems.onrender.com`. Earlier ZIPs are historical snapshots and do not include subsequent readiness changes; no ZIP upload is needed.

## Hosting and caching

- Vercel source deployments: select `frontend` as the project root, use the existing build script and `dist` output, and retain `frontend/vercel.json`.
- Netlify / Cloudflare Pages static deployments: publish `dist`; its `_headers` and `_redirects` provide compatible security/cache rules and SPA fallback. Do not upload these as an Express backend.
- Other static hosts: translate the supplied rules into that host's configuration. Vite preview does not apply `_headers`; local preview measurements confirm conditional ETag caching, not activation of production immutable caching.

Serve HTTPS. Keep HTML revalidated, permit direct SPA routes to resolve to `index.html`, and cache hashed `/assets/*` and versioned `/images/perf-*` for one year with `immutable`. Home-only early download/decode now runs directly in HTML using the same mobile responsive candidates. Preserve v1/v2 preload scripts for older cached pages. If a versioned asset changes, change its filename and references. Retain original image URLs for existing records and format/CDN fallbacks. A future strict script CSP must account for the inline warmup with a nonce/hash.

Deploy the complete output atomically where the host supports it. Keep older hashed assets available through any overlapping release/cache window so visitors with an older open page can still load its lazy chunks. The application has no service worker; no service-worker cache reset is required.

On the backend, set `NODE_ENV=production` and `ALLOWED_ORIGINS=https://pinnawala-gems.vercel.app`. A missing allowlist prevents production backend startup; an unlisted browser origin receives 403. Verify actual dashboard configuration; source defaults do not prove deployed environment values.

## Verify the deployed result

1. Check the backend health/features and protected 401 responses using the backend deployment guide.
2. Open Home and `/collection` directly with an empty browser cache, then revisit with a warm cache and navigate between them. The first Home loader should settle after the critical hero or its failure ceiling; it must not repeat on SPA return.
3. Inspect response headers for HTML, one hashed JavaScript file and a versioned WebP. Confirm the expected cache rules, HTTPS and security headers on the actual host. A successful local build alone does not verify those headers.
4. Test a normal gem gallery and its optional video, public feedback validation, keyboard navigation, Workshop dialog and the administrator inventory on phone and desktop. Do not create production test records unless that is an intended business action.
5. Collect real production DevTools/Lighthouse and field Core Web Vitals with actual fonts, APIs, CDN and devices. The readiness report supersedes earlier single-sample timing claims with repeated lab measurements; neither establishes production LCP/INP certification.

For several backend replicas, replace the per-process rate-limit stores with a shared store before treating limits as global. Verify the proxy hop configuration and actual production CORS behavior as part of backend deployment.
