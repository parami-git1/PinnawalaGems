# Deploy the Pinnawala Gems backend

This backend includes the protected appointments, admin notes and planner notification APIs. The running service must deploy this backend revision to resolve missing-route responses. Updating the frontend alone cannot add backend endpoints.

The latest `pinnawala-gem-media-backend.zip` also includes multiple-photo and optional-video support for inventory gems. Deploy this latest package to enable `POST /api/media/upload`; the earlier appointments-only ZIP does not contain that route. The admin supports 10 photos (8 MB each) and 2 optional videos (50 MB each). Deploy the matching frontend as well. Existing Cloudinary environment values are reused; no database migration is needed. The health response includes `gem-media` after the new revision is deployed.

The supplied `pinnawala-backend-fix.zip` contains a `backend/` folder with the server, all routes/models/middleware, tests, dependency manifests and this guide. It excludes `.env`, `node_modules`, uploads and Git metadata. Extract it into the repository root so that `backend/server.js` is in the existing backend directory. Preserve local files outside the package and the existing Render environment values.

## 1. Check the source locally

Use Node.js 24.x. From the repository root:

```sh
cd backend
npm ci
npm test
cd ..
```

The integration tests exercise the actual registered Express app, authentication, schemas, planner controllers and bounded media uploads with synthetic Cloudinary and in-memory model operations. They do not read `.env`, connect to MongoDB or create production records.

## 2. Commit the backend source

Use a GitHub account with write access to the repository connected to the Render service. Check that the current branch is the branch configured for this service; the working branch for this handoff is `main`.

Run these commands from the repository root:

```sh
git branch --show-current
git add -- backend/server.js backend/package.json backend/package-lock.json backend/.gitignore backend/.env.example backend/DEPLOYMENT.md backend/routes backend/models backend/middleware backend/utils backend/test
git diff --cached --name-only
git commit -m "Deploy appointments and admin notes API"
git push origin HEAD
```

Review the staged filenames before committing. The source paths above include the new routes and models without adding `backend/uploads`, `.env` or `node_modules`. If GitHub returns 403, sign in with an account that can push to the connected repository, then repeat the push. This package has not been pushed or deployed automatically.

## 3. Set the existing Render web service

Keep the service connected to the repository and branch receiving the commit above. In its settings use:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Environment variable | `NODE_VERSION=24` |

The package also declares `engines.node` as `24.x`. Render runs build/start commands relative to the configured root directory. See Render's [Node version guidance](https://render.com/docs/node-version), [web service configuration](https://render.com/docs/web-services) and [monorepo root directory guidance](https://render.com/docs/monorepo-support).

Retain the existing secret values in Render. Do not replace them with the blank `.env.example` entries. The server needs `MONGO_URI` and `JWT_SECRET` before it starts; password login uses `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Keep the existing Cloudinary variables for uploads and any configured Google login variables. Render supplies `PORT`; no custom port is required. Do not rotate `JWT_SECRET` merely to deploy these routes, because doing so invalidates current sessions.

After the GitHub push succeeds, choose **Manual Deploy → Deploy latest commit** in this Render service. Wait for the deployment and health check to succeed. Verify that the displayed commit is the one containing the new backend source.

## 4. Verify the deployed routes without signing in

Run these public, read-only checks without an Authorization header:

```sh
curl -i https://pinnawalagems.onrender.com/api/health
curl -i https://pinnawalagems.onrender.com/api/appointments
curl -i https://pinnawalagems.onrender.com/api/admin-notes
curl -i https://pinnawalagems.onrender.com/api/planner/notifications
```

On Windows PowerShell use `curl.exe` if `curl` is an alias for another command.

Expected results:

- `/api/health` returns **200**, `status: "ok"`, `database: "connected"`, and features containing `appointments`, `admin-notes` and `planner-notifications`. Its public `revision` should match the deployed commit when Render provides `RENDER_GIT_COMMIT`.
- Each of the three planner endpoints returns **401** with `Admin authentication required`. This proves the routes are mounted and protected without exposing records.
- **404** on a planner endpoint means the deployed revision, root directory or service URL still differs from this package. A **503** health response means database readiness has not been reached. Check the service settings and deployment logs.

## 5. Check the admin screen

Sign in through the website using the existing administrator account, open **Appointments & notes**, and refresh the page. The schedule, notes and notifications should load. Appointment/reminder times use Sri Lanka time (UTC+05:30), independently of the server's timezone.

Read existing authorised records to confirm the connection. Only create, update, pin, archive or delete a record when it is an intended business action; no production test records are needed for this handoff. The local integration tests already cover those CRUD flows. Keep the frontend API URL pointed at the same Render service that passed the public checks above.
