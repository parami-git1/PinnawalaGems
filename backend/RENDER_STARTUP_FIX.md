# Render backend startup fix

Updated: **25 November 2026 · Asia/Colombo**

The reported deploy builds successfully, then exits while starting `node server.js`. The generic `Backend startup failed: Error` line alone does **not** identify which setting failed. A missing `MONGO_URI`, missing `JWT_SECRET`, or empty production `ALLOWED_ORIGINS` can produce that same old message. Database connection and port errors need separate diagnosis.

The later Environment screenshot lists administrator, Cloudinary, JWT, MongoDB and port keys, but **does not show `ALLOWED_ORIGINS`**. Check/add this key on the correct service, preserving any other explicitly supported origins:

```dotenv
ALLOWED_ORIGINS=https://pinnawala-gems.vercel.app
```

Render's native Node runtime supplies `NODE_ENV=production` by default. That makes the application's nonempty-origin startup requirement apply even when `NODE_ENV` is not listed as a manually added key. The masked screenshot does not verify whether database/signing values are correct. [Render runtime defaults](https://render.com/docs/environment-variables)

## Check the existing service

Select the Render service that serves **`https://pinnawalagems.onrender.com`**. Keep its production data, existing database connection, JWT signing secret, Cloudinary credentials and persistent storage intact.

| Setting | Expected value |
| --- | --- |
| Service type | Web Service |
| Repository / branch | The repository containing the reviewed source, branch `main` |
| Root Directory | `backend` |
| Build Command | `npm ci` |
| Start Command | `npm start` (`node server.js` is also the package's start command) |
| Health Check Path | `/api/health` |
| Node | `24` |

## Render Environment values

Open **Environment** on that service. Local ignored `.env` files do not arrive through Git, so confirm the running service's environment separately.

Confirm these non-secret runtime settings; some may be supplied automatically by Render:

```dotenv
NODE_ENV=production
ALLOWED_ORIGINS=https://pinnawala-gems.vercel.app
ADMIN_AUTH_MODE=mixed
TRUST_PROXY_HOPS=1
NODE_VERSION=24
```

`ALLOWED_ORIGINS` must contain the exact frontend origin. Do not include `/catalog`, `/sign-in`, a query string, an `Origin:` prefix, or a wildcard. Multiple genuinely supported origins can be comma separated.

Also confirm these existing private settings are populated:

| Key | Check |
| --- | --- |
| `MONGO_URI` | Existing correct MongoDB/Atlas connection string; preserve database and credentials |
| `JWT_SECRET` | Existing signing secret; preserve its exact value |
| `ADMIN_USERNAME` | Configured administrator email/username |
| `ADMIN_PASSWORD` | Exact configured app password; case sensitive |
| Cloudinary keys | Preserve the current three values and existing cloud |

Google's Web client ID and allowed Google email enable Google login, but they do not replace `MONGO_URI`, `JWT_SECRET` or the production origin setting. Password login remains separately configurable in `mixed` mode.

Use Render's save/deploy controls to apply changes to the reviewed revision. **Save only** does not change the running process until a later deploy. Do not paste secret values into public logs, screenshots or repository files. [Render environment instructions](https://render.com/docs/configure-environment-variables)

## Port binding

The server must listen on **`0.0.0.0`** and use the numeric **`PORT` provided by Render**. Render's default is `10000`; an application should read the supplied value rather than hardcode `5000` or a loopback host. Do not change database/security settings merely to make a port appear open. The API should become healthy only with a usable database connection. [Render port binding](https://render.com/docs/web-services#port-binding)

The updated source honors a valid supplied `PORT`, uses `10000` as its Render fallback, and keeps `5000` as the local fallback. It awaits the database before opening the listener and logs successful binding only after the listener actually starts.

An earlier `listening on port 5000` line and a later startup failure can belong to different deploy instances. Read the logs for the specific failed deployment/instance together. A no-port message after an early configuration crash can be a consequence of the process exiting before it ever listens.

`injected env (0) from .env` is informational: the runtime can already receive all configuration from Render's environment. That count alone is not an error and is not evidence that the database password is incorrect.

## Follow the actual failure category

| Startup code | Operator action |
| --- | --- |
| `MISSING_ENV` | Populate only the named `MONGO_URI` and/or `JWT_SECRET` keys on the correct service; preserve existing correct values |
| `MISSING_ALLOWED_ORIGINS` | Add the approved frontend origin shown above |
| `INVALID_ALLOWED_ORIGINS` | Correct the origin format; no credentials, route path, query, fragment or wildcard |
| `INVALID_TRUST_PROXY` | Use an integer from 0 to 3; the standard Render proxy setup uses `1` |
| `INVALID_PORT` | Use the Render-supplied numeric TCP port, from 1 to 65535 |
| `DATABASE_URI_INVALID` | Check the existing MongoDB URI format and encoding of database credentials privately |
| `DATABASE_AUTH_FAILED` | Check the Atlas database user/password and authentication database; changing `JWT_SECRET` does not fix database authentication |
| `DATABASE_DNS_FAILED` | Check the existing cluster hostname, DNS and network availability |
| `DATABASE_TLS_FAILED` | Check runtime certificates and database TLS settings; keep certificate verification enabled |
| `DATABASE_CONNECT_FAILED` | Check cluster availability and permitted network access; this category alone does not prove an incorrect password |
| `PORT_IN_USE` | Check the port and whether a second backend process is already listening |
| `PORT_ACCESS_DENIED` | Use the permitted Render-assigned port and verify service settings |
| `LISTENER_FAILED` | Verify that this is the correct Web Service and inspect its listener/port configuration |
| `UNEXPECTED_STARTUP_FAILURE` | Confirm the reviewed source revision, Node runtime and service settings; retain the safe diagnostic for investigation |

Atlas accepts database users rather than a Google/Atlas website-login password, and network access rules must allow the connecting host. Follow the precise database diagnostic; do not reset the database or broadly open its network access as a speculative fix. [MongoDB connection troubleshooting](https://www.mongodb.com/docs/atlas/troubleshoot-connection/)

The updated startup diagnostics intentionally show setting names and safe failure categories, without printing connection strings, passwords or token values. If a new deploy still fails, retain that diagnostic code/message and the deploy revision; secret values are not needed to interpret it.

## Verify after an authorized successful deploy

1. `/api/health` must return HTTP **200**, `status: "ok"`, `database: "connected"`, and the intended deployed revision.
2. Its feature list must include `admin-session-verification` and `google-owner-policy`.
3. `/api/admin/auth-options` must return HTTP **200** with `passwordEnabled:true` when the password method is configured in `mixed` mode.
4. `/api/admin/session` without a token must return JSON **401**, not 404. A missing route indicates the wrong/older backend artifact.
5. Only then test the normal administrator sign-in. Use existing records for read-only verification; do not create production test content or uploads.

Source/logging improvements and local tests cannot fill unknown Render environment values or certify a production deployment. No production configuration, data or credentials were changed automatically by this guide.
