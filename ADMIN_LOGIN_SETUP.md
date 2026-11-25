# Admin login — email/password සහ Google

Updated: **25 November 2026 · Asia/Colombo**

## Latest live verification — deployment running; credentials rejected

Checked the actual Vercel sign-in page and Render API in a fresh Chrome browser on **25 November 2026**. This supersedes the older missing-route/deployment findings below for the currently running service.

| Check | Result |
| --- | --- |
| Render health | **PASS** — HTTP 200; revision `de794a343eb0`; session verification and owner-policy features present |
| Sign-in page and frontend API address | **PASS** — live form uses `https://pinnawalagems.onrender.com/api/admin/login` |
| Password capability discovery | **PASS** — HTTP 200; `passwordEnabled: true` |
| Browser networking / CORS | **PASS** — no failed requests; exact Vercel origin allowed |
| One authorized email/password sign-in | **FAIL** — HTTP 401, `Invalid email, username or password` |
| Authenticated session / workspace access | **PENDING** — credentials were rejected before a token was issued |
| Google sign-in | **PENDING** — server reports `googleEnabled: false`; a real Google Web client ID is still required |

The login attempt used the credentials configured in the ignored local `backend/.env`, without saving passwords, tokens or business data in the evidence. There were no production record writes or deployment changes. No second credential attempt was made.

**Required operator correction:** edit the Environment of the Render service serving `pinnawalagems.onrender.com`. Set `ADMIN_AUTH_MODE` to `mixed`, `ADMIN_USERNAME` to the requested administrator email, and `ADMIN_PASSWORD` to the exact app password configured locally. Render dashboard value fields must contain the value only, without `.env` syntax, surrounding quote characters or accidental spaces. `ADMIN_GOOGLE_EMAIL` is a separate Google account allowlist and does **not** replace `ADMIN_USERNAME`. Save and deploy the environment changes before retrying the current sign-in link. Existing database, JWT and Cloudinary secrets should stay as configured.

The exact mismatching Render value cannot be identified from a generic 401 or masked screenshot. This result does not establish a frontend bug or a working production login. Browser cache clearing, changing the frontend design, and bypassing session verification do not repair a server-side credential mismatch.

Current requested mode එක **`mixed`**: normal administrator email/password form එකත් Google sign-in option එකත් දෙකම තියෙනවා. `google` mode එක password login අක්‍රිය කරන නිසා මේ setup එකට එය දාන්න එපා.

## දැන් සකස් කරලා තියෙන දේ

- ඔයා දුන්න administrator identifier/password local `backend/.env` එකේ configure කරලා තියෙනවා. ඒ file එක Git එකෙන් ignore වෙනවා; password එක source code, tests හෝ මේ document එකේ දාලා නැහැ.
- Configured account එකෙන් actual local authentication routes භාවිතා කර login/session verification test කළා. මේ test එක MongoDB, Cloudinary, Google හෝ production service එකට connect වුණේ නැහැ.
- Settings request එක fail වුණත් email/password inputs පේනවා. Login response එකෙන් පසුවත් backend session verification සාර්ථක වීම අනිවාර්යයි.
- Google client ID එකක් නැත්නම් Google option එක setup අවශ්‍ය බව පෙන්වනවා. Fake Google login එකක් හෝ ඕනෑම email එකකට registration/access ලබාදෙන්නේ නැහැ.

## 1. Live Render service එකේ settings දාන්න

Local `.env` file එක Git push එකකින් Render වෙත යන්නේ නැහැ. Existing backend service එකේ **Environment** tab එකට ගිහින් මේ fields set කරන්න:

| Key | Value |
| --- | --- |
| `ADMIN_AUTH_MODE` | `mixed` |
| `ADMIN_USERNAME` | මේ setup එකට ඔයා දුන්න administrator email එක |
| `ADMIN_PASSWORD` | ඔයා දුන්න app password එක; password එක public source එකට දාන්න එපා |
| `ADMIN_GOOGLE_EMAIL` | Google account picker එකේ පෙනෙන allowed owner Gmail එක |
| `GOOGLE_CLIENT_ID` | Google Console එකෙන් ලබාගත් සැබෑ Web client ID එක (`…apps.googleusercontent.com`) |

මුල් fields තුන password login සඳහා ප්‍රමාණවත්. Google client ID එකක් තවම නැත්නම් එය invent කරන්න එපා; password login ක්‍රියාත්මක විය හැකි අතර Google option එක setup required ලෙස පෙනෙයි. Local configuration එකේ දැනට valid Google client ID එකක් නැහැ.

`JWT_SECRET`, `MONGO_URI`, Cloudinary values සහ අනෙක් existing secrets වෙනස් කරන්න එපා. Production `ALLOWED_ORIGINS` එකේ `https://pinnawala-gems.vercel.app` තිබිය යුතුයි. Existing Google/admin environment lists වලට unrelated accounts එකතු කරන්න එපා.

මේක website එකේ administrator password එකයි. **Google account password එක වෙනස් කරන්නේ නැහැ**; Google sign-in එකේ Googleගේම account verification භාවිතා වෙනවා. දුන්න temporary app password එක භාවිතා කළ හැකියි; production සඳහා තමන්ටම වෙනස් strong password එකක් තෝරාගන්න.

## 2. Backend මුලින්, frontend පසුව deploy කරන්න

1. Approved source revision එකේ backend එක deploy කරන්න: root `backend`, Node 24, build `npm ci`, start `npm start`. Render Environment changes එම deploy එකට apply විය යුතුයි.
2. Read-only check කරන්න:

   ```text
   https://pinnawalagems.onrender.com/api/health
   https://pinnawalagems.onrender.com/api/admin/auth-options
   ```

3. Password configured නම් options response එකේ `passwordEnabled:true` තිබිය යුතුයි. Google ද configure කළා නම් `googleEnabled:true` සහ නිවැරදි public client ID එක තිබිය යුතුයි. Google තවම configure කරලා නැත්නම් `googleEnabled:false` / empty client ID එක නිවැරදියි; ඒක password login block නොකළ යුතුයි.
4. Token නැතුව `/api/admin/session` check කළොත් **401** ලැබීම නිවැරදියි. **404** ලැබුණොත් backend එකට අලුත් authentication routes deploy වෙලා නැහැ. Frontend check එක bypass කරන්න එපා.
5. Matching frontend එක Vercel වෙත deploy කරන්න: root `frontend`, build `npm run build`, output `dist`. `VITE_API_URL=https://pinnawalagems.onrender.com` තබන්න.

Admin page එක:

```text
https://pinnawala-gems.vercel.app/workspace/pg-0d221cf9d8b8c1683d22fdea/sign-in
```

Custom `VITE_ADMIN_PORTAL_PATH` එකක් තිබුණොත් ඒ path එකට `/sign-in` එකතු කරන්න.

## 3. Google option එක activate කිරීම

[ADMIN_GOOGLE_SETUP.md](ADMIN_GOOGLE_SETUP.md) හි **Google Console setup** කොටසෙන් Web client එකක් ලබාගන්න. Authorized JavaScript origin එක `https://pinnawala-gems.vercel.app` ලෙස set කරන්න. Gmail API, inbox access, client secret හෝ Gmail app password එකක් අවශ්‍ය නැහැ.

Render හි `GOOGLE_CLIENT_ID` සහ එකම allowed `ADMIN_GOOGLE_EMAIL` සකස් කරන්න; **`ADMIN_AUTH_MODE=mixed` තබන්න**. Current frontend එක server එකෙන් Google client ID එක ගන්නවා. Legacy `VITE_GOOGLE_CLIENT_ID` fallback එක discovery service එක unavailable වුණොත් භාවිතා කළ හැකි නමුත් backend එකේ සැබෑ client ID/allowed account configuration එක අනිවාර්යයි.

## 4. Check කරන්න

- Email/password inputs පේනවාද, provided app credentials accept වෙනවාද බලන්න.
- Wrong password එකක් ප්‍රතික්ෂේප වෙනවාද සහ Sign out වැඩ කරනවාද බලන්න.
- Google configure කරලා නම් allowed account එකෙන් sign in වෙන්න; වෙනත් Google account එකක් deny විය යුතුයි.
- Existing inventory/appointments read-only බලන්න. Verification සඳහා production test records හෝ uploads create/delete කරන්න එපා.
- API එක timeout වෙනවා නම් frontend form එක පෙන්වීමෙන් service එක repair වෙන්නේ නැහැ. Render service/logs, latest deploy, environment values සහ network availability බලන්න. Repeated password guesses වෙනුවට service status එක පරීක්ෂා කරන්න.

## 5. Live deployment පරීක්ෂාවේ හමු වූ නිශ්චිත issue එක — 25 November 2026

Owner live deploy කළ බව දැනුම් දුන්නාට පසු unauthenticated read-only checks නැවත කළා:

| Check | සැබෑ live result |
| --- | --- |
| `/api/health` | HTTP 200; backend healthy, deployed revision `b08840aef383` |
| `/api/admin/auth-options` | HTTP 404 |
| `/api/admin/session` | HTTP 404; current backend එකේ token නැතුව expected result එක 401 විය යුතුයි |
| Required auth features | `admin-session-verification` සහ `google-owner-policy` දෙකම live health list එකේ නැහැ |
| Current local/upstream branch | `main`; observed current source commit `de794a3` |

ඒ නිසා correct password එකක් තිබුණත් අලුත් frontend එකට live administrator session එක verify කරන්න බැහැ. Backend session check එක ඉවත් කිරීම මේකට විසඳුමක් නොවේ.

**Render backend update කරන්න:**

1. Render Dashboard එකේ `pinnawalagems.onrender.com` ලබාදෙන service එක open කරන්න. Settings වල connected repository එකේ නව code තියෙනවාද, branch `main` ද, Root Directory `backend` ද බලන්න. Build `npm ci`, Start `npm start`.
2. Environment එකේ `ADMIN_AUTH_MODE=mixed`, requested administrator email සහ exact app password set කරන්න. Local `.env` එකේ කලින් configure කළ password එකට `123` suffix එක තියෙනවා; එය suffix එක නැති password එකකට වෙනස්. `.env` Git එකෙන් deploy නොවෙන නිසා Render values වෙනම confirm කරන්න.
3. **Manual Deploy → Deploy latest commit** තෝරන්න. Deploy එක successful වුණාම actual running revision එක `de794a3` හෝ පසුව ආ compatible revision එකක් විය යුතුයි. Restart කිරීමෙන් existing commit එකම නැවත run වෙන නිසා මේ update එකට latest-commit deployment අවශ්‍යයි. [Render deploy instructions](https://render.com/docs/deploys)
4. ඉහළ checks නැවත කරන්න: auth-options 200/password enabled, anonymous session 401, health එකේ required auth features තිබිය යුතුයි. එවිට actual email/password login පරීක්ෂා කරන්න.

Read-only probes අතර administrator password හෝ bearer token යැව්වේ නැහැ. Production environment/data වෙනස් කළේ නැහැ; deployment එකක් trigger කළේත් නැහැ. Live password value තවම verify කරලා නැහැ. Earlier timeout-only diagnosis මේ confirmed old-backend result එකෙන් supersede වෙනවා.

## 6. Failed Render startup / Environment screenshot

25 November 2026 දී ලැබුණු Environment screenshot එකේ `MONGO_URI`, `JWT_SECRET`, admin සහ Cloudinary keys තිබුණත් **`ALLOWED_ORIGINS` පෙන්වා නැහැ**. Render Node runtime එක default production mode එකේ start වෙන නිසා අලුත් backend එකට මේ key එකත් අවශ්‍යයි:

```dotenv
ALLOWED_ORIGINS=https://pinnawala-gems.vercel.app
ADMIN_AUTH_MODE=mixed
```

Existing secret values preserve කරන්න. Masked screenshots වලින් ඒ values නිවැරදිද කියලා verify කළ නොහැකියි. `PORT` එක Render දෙන numeric value එක ලෙස භාවිතා කරන්න; manual override එකක් අවශ්‍ය නැත්නම් default `10000` භාවිතා කළ හැකියි. `injected env (0)` line එකෙන් පමණක් settings නැති බව කියවෙන්නේ නැහැ.

Source එකේ startup diagnostics දැන් missing key names / safe database or port error codes පෙන්වනවා. Express 5 bind error එකක් success ලෙස log කිරීමත් නිවැරදි කරලා, actual port එකට `0.0.0.0` හරහා bind කර තිබීමෙන් පසුව පමණක් success log වෙනවා. Database readiness check එක එලෙසම තියෙනවා. **Backend tests 86/86 PASS**; production deploy/verification pending.

මේ changes commit කරන විට අලුත් `backend/utils/startup.js` file එකත් include කරන්න. Exact Render steps සහ diagnostic-code meanings: [backend/RENDER_STARTUP_FIX.md](backend/RENDER_STARTUP_FIX.md).
