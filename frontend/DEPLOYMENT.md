# Deploy the optimized frontend

The current source preserves the existing Pinnawala Gems branding and page layouts. It includes the audit fixes, responsive images, decoding/error states, independent API loading, server-backed collection pagination and deferred 3D loading. Deploy the matching backend described in `../backend/DEPLOYMENT.md` before switching the frontend to it.

## Build from the repository

Use Node.js 24.x, set the existing public build variables in your frontend hosting service, and run:

```sh
cd frontend
npm ci
npm run lint
npm run build
```

Publish `frontend/dist`. Preserve the existing `VITE_API_URL` and any public Google client ID configuration. `VITE_API_URL` accepts the backend origin with or without a final `/api`; it is compiled into the bundle. Changing it requires rebuilding. Never put private MongoDB, JWT, administrator or Cloudinary API secrets in frontend variables.

The supplied `pinnawala-optimized-frontend-dist.zip` contains the already-built contents of `dist` at the archive root, plus `vercel.json` for that hosting option. Extract it into an empty deployment directory. It contains no `.env`, source checkout, database content or `node_modules`. Use a source build instead if your production API origin differs from the existing build configuration.

## Hosting and caching

- Vercel source deployments: select `frontend` as the project root, use the existing build script and `dist` output, and retain `frontend/vercel.json`.
- Netlify / Cloudflare Pages static deployments: publish `dist`; its `_headers` and `_redirects` provide compatible security/cache rules and SPA fallback. Do not upload these as an Express backend.
- Other static hosts: translate the supplied rules into that host's configuration. Vite preview does not apply `_headers`; local preview measurements confirm conditional ETag caching, not activation of production immutable caching.

Serve HTTPS. Keep HTML revalidated, permit direct SPA routes to resolve to `index.html`, and cache hashed `/assets/*`, versioned `/images/perf-*` and `/critical-assets-v1.js` for one year with `immutable`. If a versioned asset changes, change its versioned filename and all references. Do not overwrite it under the same long-lived URL. Retain the original image URLs: existing records can still refer to them and the image component uses them as format fallbacks.

Deploy the complete output atomically where the host supports it. Keep older hashed assets available through any overlapping release/cache window so visitors with an older open page can still load its lazy chunks. The application has no service worker; no service-worker cache reset is required.

On the backend, set `NODE_ENV=production` and `ALLOWED_ORIGINS` to the real frontend origin(s), including `www` or preview origins only when intended. This real domain was not supplied during local verification. A missing allowlist prevents production backend startup; an unlisted browser origin receives 403.

## Verify the deployed result

1. Check the backend health/features and protected 401 responses using the backend deployment guide.
2. Open Home and `/collection` directly with an empty browser cache, then revisit with a warm cache and navigate between them. The first Home loader should settle after the critical hero or its failure ceiling; it must not repeat on SPA return.
3. Inspect response headers for HTML, one hashed JavaScript file and a versioned WebP. Confirm the expected cache rules, HTTPS and security headers on the actual host. A successful local build alone does not verify those headers.
4. Test a normal gem gallery and its optional video, public feedback validation, keyboard navigation, Workshop dialog and the administrator inventory on phone and desktop. Do not create production test records unless that is an intended business action.
5. Collect real production Lighthouse/DevTools and field Core Web Vitals with actual fonts, APIs, CDN and devices. The supplied local single-sample measurements are comparative lab evidence, not field LCP/INP certification. The slow-mobile Home LCP varied from 1.73 to 2.59 seconds across measured optimized runs.

For several backend replicas, replace the per-process rate-limit stores with a shared store before treating limits as global. Verify the proxy hop configuration and actual production CORS behavior as part of backend deployment.
