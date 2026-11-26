# Deploy the audited Pinnawala Gems backend

> **26 November 2026 admin audit:** deploy the latest approved backend before its matching frontend. Planner requests now use literal search, validated dates/times, editable-field whitelists and Sri Lanka date-filter boundaries. Operational failures are redacted. Permanent gem/category/ad record deletion retains Cloudinary media to protect reused URLs and retained records on database failure; bulk sold archive/Undo remains unchanged. No environment change, dependency or database migration is required by this delta. Complete backend tests passed **125/125** with synthetic models/uploads. Production provider/storage/data verification remains PENDING; follow [the latest release checklist](../RELEASE_CHECKLIST.md).

> **Startup/deploy failure — 25 November 2026:** If Render reports `Backend startup failed` or no open port, use [RENDER_STARTUP_FIX.md](RENDER_STARTUP_FIX.md). A successful build is not proof that the API started. `dotenv` reporting zero injected values does not establish that Render environment variables are missing. Check the specific startup diagnostic before changing credentials or database settings.

The supplied Environment screenshot does not list `ALLOWED_ORIGINS`; verify/add `https://pinnawala-gems.vercel.app` on the correct service. Render's Node runtime defaults to production, so this startup requirement applies even without a manually listed `NODE_ENV`. Masked database/JWT values cannot establish that those settings are correct. The startup guide maps each new safe diagnostic code to its operator action.

> **25 November 2026 — current login choice:** the owner now requests both email/password and Google login. Use `ADMIN_AUTH_MODE=mixed` with the existing `ADMIN_USERNAME`/`ADMIN_PASSWORD` settings and an allowed Google email/client ID. The prior Google-only instructions remain an optional stricter mode, not the current requested configuration. Never commit actual passwords or replace unrelated environment secrets.

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
- Password login uses `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the compatibility `mixed` mode; `ADMIN_AUTH_MODE=google` disables that method and its existing sessions without deleting these stored values.
- Media uploads use `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`.
- Gmail-only administrator login uses `ADMIN_AUTH_MODE=google`, one `ADMIN_GOOGLE_EMAIL`, and the public Google Web OAuth `GOOGLE_CLIENT_ID`. Legacy `ADMIN_GOOGLE_EMAILS` / `ADMIN_EMAIL` lists apply only to compatible mixed-mode configuration and cannot broaden the strict single-owner policy. The current frontend reads the authoritative public client ID from `/api/admin/auth-options`; it no longer requires a matching `VITE_GOOGLE_CLIENT_ID`.

Existing JWT sessions use an eight-hour expiry. Preserve `JWT_SECRET` during this routine deployment to retain compatible sessions. The backend now checks HS256 and the session-age limit explicitly.

## Verified administrator access: deploy backend first

The matching frontend verifies `GET /api/admin/session` before rendering protected screens. Deploy this backend revision on Render **before** deploying that frontend on Vercel. A missing endpoint must remain a deployment error; the frontend must not fall back to trusting the presence of a browser token. Session verification itself needs no database migration, administrator password changes or Cloudinary changes. Enabling single-owner Gmail access additionally requires the explicit configuration below.

The session endpoint is read-only. A valid administrator bearer token receives `{ "admin": { "role": "admin", "subject": "..." }, "expiresAt": 1234567890000 }`, with optional existing `username`, `email` and `name` identity fields. `expiresAt` is an absolute Unix timestamp in **milliseconds**. The response never includes the bearer token, password or unrelated JWT fields. Authentication and private responses use `Cache-Control: no-store`.

New password/Google login tokens retain the eight-hour lifetime and existing `{ token, admin }` response contract. They add the administrator role, issuer `pinnawala-gems-admin`, and audience `pinnawala-gems-api`. Protected routes validate signature, HS256, explicit expiry, issue time, maximum age, subject and administrator scope on every request. Verified non-administrator or wrong-purpose tokens receive 403; missing, forged or expired credentials receive 401. The optional administrator view of feedback uses that same verification, so non-administrators cannot retrieve pending reviews.

Existing roleless sessions remain compatible only when their signed identity matches a token issued by the existing password login (`password-admin:<configured username>` plus matching username) or an allowlisted Google administrator email. These sessions still expire at their existing deadline, within eight hours. Preserve the configured credentials and JWT signing secret when deploying this compatibility update. Logout clears the client session; this remains a stateless bearer-token service, so an already-stolen token is not individually revoked before expiry. Changing the portal URL does not replace authorization or prevent discovery from a public frontend bundle.

After the Render deployment, make a read-only request without credentials:

```sh
curl -i https://pinnawalagems.onrender.com/api/admin/session
```

Expect **401**, JSON `Admin authentication required`, and `Cache-Control: no-store`. A 404 means the required backend revision is not deployed. Check that `/api/health` includes `admin-session-verification`, then deploy the matching frontend. Verify normal administrator login/session expiry in the browser with the existing administrator account; do not perform production password-guessing or data-mutation tests.

If rollback is needed, restore the previous frontend first, then the previous backend revision. Keep the same production data, uploaded assets and environment secrets throughout. The previous frontend can use the existing bearer endpoints while this backend is active; the new frontend requires the session-verification endpoint.

The authorization approach follows the [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) and [REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html). This source change and local test suite do not certify the deployment, credentials, proxy configuration or external identity provider.

## Single Gmail owner mode

Follow [ADMIN_GOOGLE_SETUP.md](../ADMIN_GOOGLE_SETUP.md) for the complete manual Google Console, Render and Vercel setup. The owner email has not been supplied or guessed in source. Replace the placeholders with the sole intended Gmail address and Google Web OAuth client ID in the existing Render service:

```dotenv
ADMIN_AUTH_MODE=google
ADMIN_GOOGLE_EMAIL=REPLACE_WITH_YOUR_GMAIL
GOOGLE_CLIENT_ID=REPLACE_WITH_YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

Do not copy these placeholders into the running configuration. Preserve the current database, signing secret, administrator credentials and Cloudinary settings. No Gmail password, Google client secret, Gmail API or mailbox scopes are required. Without the explicit `google` mode, the default `mixed` mode preserves previously configured login methods; source preparation alone does not activate Gmail-only access.

After the authorized backend deployment, `/api/health` must include both `admin-session-verification` and `google-owner-policy`. Read-only `GET /api/admin/auth-options` must return `Cache-Control: no-store` and the following public capabilities, with the real public client ID:

```json
{
  "passwordEnabled": false,
  "googleEnabled": true,
  "googleClientId": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com"
}
```

The endpoint never discloses the owner's email or server secrets. Missing, multiple or invalid owner configuration and an unknown authentication mode fail closed; the public website continues working. A missing endpoint is an incompatible deployment, not permission to enable a frontend password fallback.

The backend verifies Google's signed token and intended client, then requires a verified email matching the exact configured owner. Every private API request rechecks the current owner policy for scoped and compatible legacy JWTs. Google-only mode rejects previous password sessions; changing/removing the owner rejects that account's subsequent private requests. Previously rendered client data can remain visible until the next session revalidation or sign-out; the frontend's 60-second verification cache is not an automatic remote-logout timer. This does not authorize another server read or write.

Application sessions remain stateless bearer tokens with an eight-hour expiry. Signing out of Google alone does not revoke an already issued application token. The website's Sign out clears its local session; individual stolen-token revocation, HttpOnly cookies, device binding and app-enforced MFA are not introduced here. Enable Google's two-step verification for the owner account. Rollback must retain a policy-aware compatible backend: an older backend can ignore `ADMIN_AUTH_MODE` and reinstate older login methods. Production Gmail-only access remains pending until the documented operator setup, matching deployments and live checks are complete.

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

- **Health:** HTTP 200, `status: "ok"`, `database: "connected"`. The feature list contains `appointments`, `admin-notes`, `planner-notifications`, `gem-media`, `catalog-pagination`, `security-hardening`, `admin-session-verification` and `google-owner-policy`. When Render supplies `RENDER_GIT_COMMIT`, `revision` matches the deployed commit.
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

## Email/password plus Google login — 25 November 2026

Configure both methods on the existing Render service without changing MongoDB, Cloudinary or JWT secrets:

```dotenv
ADMIN_AUTH_MODE=mixed
ADMIN_USERNAME=YOUR_ADMIN_EMAIL
ADMIN_PASSWORD=YOUR_PRIVATE_PASSWORD
ADMIN_GOOGLE_EMAIL=YOUR_ALLOWED_GOOGLE_EMAIL
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

`ADMIN_USERNAME` can hold the administrator's email address. `POST /api/admin/login` accepts either `{ "email": "…", "password": "…" }` or the existing `{ "username": "…", "password": "…" }` contract. Email identifiers are trimmed and compared without case; existing non-email usernames and all passwords remain case sensitive. Supplying conflicting email/username aliases or malformed input is rejected. Both aliases share the same password-guess rate limit, and successful login keeps the configured canonical identity in its signed session.

A missing or malformed Google client ID disables Google login only in `mixed` mode; a correctly configured password method remains available. A public Web client ID must end in `.apps.googleusercontent.com`; a placeholder is not a working Google configuration. The Google account still needs to match the server allowlist after Google verifies its token. `ADMIN_AUTH_MODE=google` continues to disable password login and is not the setting for enabling both methods.

After the approved backend deployment, `/api/admin/auth-options` should report `passwordEnabled:true` and `googleEnabled:true` when both are fully configured. The frontend still must verify `/api/admin/session` before opening protected screens. Showing a sign-in form when capability discovery is unavailable never replaces backend authentication or permits trusting an unverified token. Deploy matching backend code before the frontend; no database seed or administrator record creation is required.
