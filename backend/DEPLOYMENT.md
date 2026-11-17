# Deploy the audited Pinnawala Gems backend

Deploy the current Git source after explicit approval using [the production release checklist](../RELEASE_CHECKLIST.md). ZIP files from the earlier handoff are historical snapshots and are not required. The source includes security, data-validation, catalogue-pagination, media-upload and API-cache fixes, along with appointments, notes and planner APIs. Updating the frontend alone cannot add these backend routes.

This handoff is prepared for manual deployment. It has not been pushed or deployed automatically. Deploy the matching updated frontend too, so its bounded requests, catalogue pagination and image-loading fixes use the same API revision.

## Source and local validation

The Render service must use the `backend` root of the approved Git commit. Preserve existing environment secrets and any durable upload storage. Do not upload or replace `.env`, `node_modules` or production data from this checkout.

Use **Node.js 24.x**. From the repository root:

```sh
cd backend
npm ci
npm test
npm start
```

On Windows PowerShell, use `npm.cmd` if the PowerShell script alias is blocked. `npm ci` installs the supplied lockfile; it does not regenerate the dependency versions. The test suite uses synthetic secrets, in-memory model operations and stub Cloudinary uploads. It does not read `.env`, connect to MongoDB or create production records. `npm start` is the actual service and requires the environment values below.

No database migration is required. Existing gemstones, media URLs and reference IDs remain readable. New writes add normalized numeric carats; catalogue queries also handle older weight strings. Newly created gemstone references derive from their unique ObjectIds, and existing references are preserved. Public home/contact reads no longer create records. A later authorised settings save converges on a canonical singleton while retaining legacy content.

## Render configuration

Keep the existing Render web service connected to the repository and branch receiving this source update.

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| `NODE_VERSION` | `24` |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | The actual deployed frontend origin; see below |
| `TRUST_PROXY_HOPS` | `1` for the standard verified Render proxy topology; see below |

The package declares `engines.node: 24.x`. Render supplies `PORT`; the service reads it automatically.

### Frontend origin is required

The owner confirmed the Vercel frontend URL. Set `ALLOWED_ORIGINS=https://pinnawala-gems.vercel.app` before production startup. Additional domains must be explicitly confirmed; do not allow wildcard preview domains.

Use comma-separated full origins for genuinely supported domains, for example a primary domain and its `www` domain. Origins contain the scheme and host, with an optional port, and **no path, query or fragment**. The production server refuses startup when the origin list is empty. Browser requests from other origins receive 403. Localhost is automatically accepted only outside production. Command-line requests without an Origin header, including Render health checks, can still reach the API; administrative routes continue to require an administrator token.

Set the frontend's `VITE_API_URL` to this same API service origin, for example `https://pinnawalagems.onrender.com`. The updated frontend normalizes an optional trailing `/api`, but using the API origin consistently keeps configuration clear. Rebuild the frontend after changing its Vite environment values.

### Proxy configuration and rate limiting

`TRUST_PROXY_HOPS` accepts an integer from 0 to 3. The source defaults to one hop when Render sets `RENDER=true`; it defaults to zero for direct/local hosting. Set the value explicitly to `1` for the standard Render deployment after confirming that topology. If an additional CDN, proxy or gateway is placed in front of Render, verify the actual trusted-hop count and forwarded client-IP handling before changing the setting. Do not assume that every custom proxy arrangement has one hop.

Correct proxy configuration matters because login, feedback, upload and general API limits use the client IP. A rate-limited request returns 429 and a retry indication. The supplied limiter stores are in process memory; deployments with multiple service instances should use a shared limiter store or an equivalent coordinated gateway policy before relying on one global abuse limit across all instances.

## Preserve existing secrets

Retain the current Render values; `.env.example` is a blank reference and must not replace real configuration.

- Startup requires `MONGO_URI` and `JWT_SECRET`.
- Password login uses `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- Media uploads use `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`.
- Google administrator login, when enabled, uses `GOOGLE_CLIENT_ID` plus `ADMIN_GOOGLE_EMAILS` or `ADMIN_EMAIL`. Keep the frontend's Google client ID aligned with that configuration.

Existing JWT sessions use an eight-hour expiry. Preserve `JWT_SECRET` during this routine deployment to retain compatible sessions. The backend now checks HS256 and the session-age limit explicitly.

## Commit and deploy manually

Only after deployment authorization and the checklist's environment/rollback review, use an account with write access to the GitHub repository connected to Render. A Git push can trigger auto-deployment. From the repository root:

```sh
git branch --show-current
git add -- backend/server.js backend/package.json backend/package-lock.json backend/.gitignore backend/.env.example backend/DEPLOYMENT.md backend/routes backend/models backend/middleware backend/utils backend/test
git diff --cached --name-only
git commit -m "Fix audited backend security and data handling"
git push origin HEAD
```

Verify that the branch receiving the push is the branch configured in the Render service. The staged list should include the source, new utilities, tests and lockfile. If GitHub returns 403, the signed-in account does not have permission to push that repository; use an authorised account to complete the manual push.

In Render, choose **Manual Deploy → Deploy latest commit**. Wait for the build and health check to succeed, and confirm the displayed commit is the intended source revision.

## Read-only deployment verification

Use the actual API service origin. The following URLs use the existing default Render service. On Windows, run `curl.exe` instead of a PowerShell `curl` alias.

```sh
curl -i https://pinnawalagems.onrender.com/api/health
curl -i https://pinnawalagems.onrender.com/api/appointments
curl -i https://pinnawalagems.onrender.com/api/admin-notes
curl -i https://pinnawalagems.onrender.com/api/planner/notifications
curl -i https://pinnawalagems.onrender.com/api/stock/stones
```

Expected results without an Authorization header:

- **Health:** HTTP 200, `status: "ok"`, `database: "connected"`. The feature list contains `appointments`, `admin-notes`, `planner-notifications`, `gem-media`, `catalog-pagination` and `security-hardening`. When Render supplies `RENDER_GIT_COMMIT`, `revision` matches the deployed commit.
- **Appointments, admin notes, planner notifications and stock:** HTTP 401 with `Admin authentication required`. Stock reads are now private too. A 401 demonstrates that each route is mounted and protected without reading administrator records.
- **404:** the source revision, Render root directory, branch or requested API origin still differs from this package.
- **Health 503:** database readiness has not been reached or the connection was lost. Check the deployment's database connection and environment configuration.
- **Browser 403 with otherwise healthy curl responses:** verify that `ALLOWED_ORIGINS` includes the exact deployed frontend origin. This is distinct from a missing API route.

To inspect browser-origin handling without a mutation, make a health GET with `Origin` set to the real frontend origin and confirm the matching `Access-Control-Allow-Origin` response. An unlisted origin should receive 403. No production password guessing or test inventory creation is required to verify deployment.

## Media, API and cache behavior

The administrator can select several files; the frontend uploads them sequentially. Both the newer media endpoint and the legacy image endpoint now enforce bounded, authenticated upload handling.

| Media | Maximum per gemstone | Maximum per file | Formats |
| --- | --- | --- | --- |
| Photos, including the cover | 10 | 8 MiB (`8 × 1024 × 1024` bytes) | JPEG, PNG, WebP |
| Optional videos | 2 | 50 MiB (`50 × 1024 × 1024` bytes) | MP4, WebM |

`POST /api/media/upload` accepts one multipart `file` per request and returns HTTP 201 with the media URL and resource type. Legacy `POST /api/upload` accepts one `image`, remains image-only and preserves its existing image-URL response contract. File signatures and limits are checked before Cloudinary upload; temporary files are cleaned up. An oversized file returns a JSON 413 error.

Catalogue listing uses positive page numbers and a maximum page size of 200. The updated frontend follows server pagination, so records beyond the old 500/1,000 client caps remain reachable. Titles, quantities, prices, references, media and CMS fields are validated before writes. Public review submission remains moderated and is now rate-limited with stronger server validation.

Successful anonymous public data GETs have a short cache policy: `public, max-age=30, stale-while-revalidate=60`. Authenticated, private and error API responses remain `no-store`, and responses vary by Authorization and browser Origin as appropriate. Avoid adding a blanket CDN cache rule that overrides these distinctions. Optional legacy `/uploads` files use one-day caching with ETags; Cloudinary assets continue to use Cloudinary delivery. Frontend versioned-asset caching is configured separately in the matching frontend hosting files and must be applied by that host.

## Final browser check

Use the existing administrator account and normal intended business operations. Confirm that the frontend uses the same API origin verified above, login reaches the workspace, inventory and pagination load, appointments/notes connect, and public pages render the expected data. Confirm an existing gemstone's photographs and optional video are visible without refreshing the browser. The delivered local tests cover create/edit/delete, media boundaries and recovery using synthetic data; real uploads, Google provider behavior and production CDN caching must be confirmed on the deployed service when those features are used.
