# Pinnawala Gems — එකම Gmail account එකට admin access

> **25 November 2026 — current request:** Email/password සහ Google දෙකම භාවිතා කිරීමට [ADMIN_LOGIN_SETUP.md](ADMIN_LOGIN_SETUP.md) අනුගමනය කරන්න. Current mode එක **`ADMIN_AUTH_MODE=mixed`**. පහළ Google-only mode එක optional විකල්පයක් පමණයි; එය password login අක්‍රිය කරනවා. Google Console setup කොටස දෙකටම භාවිතා කළ හැකියි. Requested account details local ignored `.env` එකේ configure කරලා තියෙනවා; Google Web client ID එක තවම අවශ්‍යයි.

Updated: **24 November 2026 · Asia/Colombo**

මේ document එකේ steps ඔයා manually කරන්න ඕන. මේ session එකෙන් Google Console, Render හෝ Vercel settings වෙනස් කරලා නැහැ; deploy කරලා නැහැ. **ඔයාගේ admin Gmail address එක තවම ලබාදී නැති නිසා පහළ `REPLACE_WITH_YOUR_GMAIL` තැනට ඒ එකම account එක දාන්න.** Website එකේ contact email එක admin account එක කියලා අපි assume කරලා නැහැ.

## 1. මුලින් ලියාගන්න values තුන

| Value | දාන්න ඕන දේ |
| --- | --- |
| Admin Gmail | Google account picker එකේ පෙනෙන exact `…@gmail.com` address එක; එකක් පමණයි |
| Google Web client ID | Google Console එකෙන් ලැබෙන `…apps.googleusercontent.com` අගයෙන් ඉවර වෙන ID එක |
| Website origin | `https://pinnawala-gems.vercel.app` |

Admin sign-in URL:

```text
https://pinnawala-gems.vercel.app/workspace/pg-0d221cf9d8b8c1683d22fdea/sign-in
```

`VITE_ADMIN_PORTAL_PATH` වෙනස් කරලා තියෙනවා නම් ඒ path එකට `/sign-in` එකතු කරන්න. Path එක hide කරන එක access control එක නෙවෙයි; account verification එක backend එකෙන් කරනවා.

## 2. Google Console setup

1. Admin වෙන්න ඕන Google account එකෙන් [Google Cloud Console](https://console.cloud.google.com/) වෙත sign in වෙන්න. Existing Sign in with Google project එකක් තියෙනවා නම් ඒක භාවිතා කරන්න; නැත්නම් Pinnawala Gems සඳහා project එකක් සාදන්න.
2. **Google Auth Platform** වෙත යන්න. First-time setup form එකක් තිබුණොත් app name ලෙස `Pinnawala Gems Administration` සහ ownerගේ support/contact email දාන්න. Existing project එකක **Branding** details නිවැරදිව තබන්න.
3. Personal Gmail එකක් සඳහා existing project එකේ **External** audience භාවිතා කළ හැකියි. **Internal** කියන්නේ Google Workspace organization accounts සඳහා. Console එක test user ඉල්ලනවා නම් owner Gmail එක පමණක් එතැනට දාන්න. මේ setting එකට පමණක් admin security එක භාරදෙන්න එපා; backend එකේ single-owner check එකත් අනිවාර්යයි. [Google audience guidance](https://support.google.com/cloud/answer/15549945)
4. අලුත් project එකක් owner account එකෙන්ම හදනවා නම් Google දෙන **Personal** audience option එකද භාවිතා කළ හැකියි. එය creator account එකට සීමා වෙන අතර existing External project එක Personal වෙත convert කළ නොහැකියි; මේ සඳහා existing project එක මාරු කිරීම අවශ්‍ය නැහැ. [Personal mode setup](https://support.google.com/cloud/answer/15544987)
5. **Clients → Create client** වෙත ගොස් application type ලෙස **Web application** තෝරන්න. Client name එක `Pinnawala Gems Admin Web` වගේ පැහැදිලි නමක් දාන්න.
6. **Authorized JavaScript origins** යටතේ පහත origin එක add කරන්න. Path එකක් හෝ wildcard එකක් දාන්න එපා:

   ```text
   https://pinnawala-gems.vercel.app
   ```

   Local Google login test කරන්න අවශ්‍ය නම් පමණක් මේවාත් add කරන්න:

   ```text
   http://localhost
   http://localhost:5173
   ```

7. මේ application එක Google JavaScript callback එකෙන් credential එක අරගෙන backend එකට JSON යවනවා. **Authorized redirect URIs සඳහා `/api/admin/google-login` හෝ admin page URL එක add කිරීම අවශ්‍ය නැහැ.** මේ implementation එකට redirect callback route එකක් නැහැ.
8. Client එක create කරලා **Client ID** එක copy කරන්න. Google client secret, Gmail password හෝ Gmail app password එක website එකට දාන්න එපා. Gmail inbox/Drive access scopes ඉල්ලන්නත් එපා; identity sign-in පමණයි අවශ්‍ය. [Google Web Sign-In setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)

Console එක domain ownership හෝ brand verification ඉල්ලුවොත් Google දක්වන requirements complete කරන්න. `vercel.app` domain එක ඔයාගේ කියලා claim කරන්න එපා; verification සඳහා තමන් පාලනය කරන custom domain එකක් අවශ්‍ය විය හැකියි. Existing production URL එක OAuth JavaScript origin එක ලෙසම තබන්න.

## 3. Render backend environment

Existing `pinnawalagems.onrender.com` backend service එකේ **Environment** tab එකට යන්න. පහත තුන set කරන්න:

```dotenv
ADMIN_AUTH_MODE=google
ADMIN_GOOGLE_EMAIL=REPLACE_WITH_YOUR_GMAIL
GOOGLE_CLIENT_ID=REPLACE_WITH_YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

Placeholders දෙක actual values වලින් replace කරන්න. `ADMIN_GOOGLE_EMAIL` එකට Gmail එකක් පමණක් දාන්න; commas, display name, `mailto:`, password හෝ alternate aliases දාන්න එපා. Google account picker එකේ පෙනෙන address එකම භාවිතා කරන්න.

මෙම production configuration එකත් නිවැරදිද බලන්න:

```dotenv
NODE_ENV=production
ALLOWED_ORIGINS=https://pinnawala-gems.vercel.app
```

**දැනට තියෙන `MONGO_URI`, `JWT_SECRET`, Cloudinary credentials, Google client settings සහ වෙනත් server secrets replace/delete කරන්න එපා.** Existing `ADMIN_USERNAME` / `ADMIN_PASSWORD` values තබාගත හැකියි: `ADMIN_AUTH_MODE=google` යටතේ password endpoint එකත් ඒ login එකෙන් නිකුත් කළ පැරණි tokensත් backend එක ප්‍රතික්ෂේප කරනවා. `ADMIN_GOOGLE_EMAILS` / `ADMIN_EMAIL` යන පැරණි lists වලින් strict Google-only mode එකට තවත් accounts එකතු වෙන්නේ නැහැ.

Render එකේ **Save only** තෝරා values save කරලා, deployment steps පහළින් අනුගමනය කරන්න. Save කළ values running service එකට යන්නේ ඊළඟ deploy එකෙන් පසුවයි. **Save and deploy** / **Save, rebuild, and deploy** තෝරනවා නම් ඒ action එක deployment එකක් බව මතක තබාගන්න. [Render environment instructions](https://render.com/docs/configure-environment-variables)

Code එකේ compatibility default එක `mixed`: operator `ADMIN_AUTH_MODE=google` set කරනකම් existing password method ස්වයංක්‍රීයව අක්‍රිය කරන්නේ නැහැ. **Gmail-only access සඳහා ඉහත mode එක deploy කරලා තිබීම අනිවාර්යයි.** Unknown mode එකක්, හිස් owner එකක් හෝ accounts කිහිපයක් strict mode එකට දැම්මොත් sign-in fail closed වෙනවා.

## 4. Vercel frontend environment

Existing Pinnawala Gems project එකේ **Settings → Environment Variables → Production** බලන්න:

```dotenv
VITE_API_URL=https://pinnawalagems.onrender.com
```

`VITE_ADMIN_PORTAL_PATH` දැනට set කරලා නම් ඒක වෙනස් කරන්න එපා. නැත්නම් source එකේ default path එක භාවිතා වෙනවා.

Current frontend එක backend `/api/admin/auth-options` response එකෙන් public Google client ID සහ permitted login methods ලබාගන්නවා. **මේ version එකට `VITE_GOOGLE_CLIENT_ID` අලුතින් set කිරීම අවශ්‍ය නැහැ.** Existing value එකක් තියෙනවා නම් එය delete කිරීමත් අවශ්‍ය නැහැ; පැරණි frontend rollback එකකට එය අවශ්‍ය විය හැකියි. Current frontend එක මේ variable එකෙන් server policy override කරන්නේ නැහැ.

`ADMIN_GOOGLE_EMAIL`, `JWT_SECRET`, MongoDB/Cloudinary secrets හෝ Google client secret කිසිවක් `VITE_…` variable එකකට දාන්න එපා. ඒ prefix එකේ values browser bundle එකේ public වෙනවා. [Vite environment behavior](https://vite.dev/guide/env-and-mode.html)

Vercel environment value එකක් වෙනස් කළොත් අලුත් deployment එකකට ඒක apply කරන්න ඕන; existing deployment එක වෙනස් වෙන්නේ නැහැ. [Vercel environment instructions](https://vercel.com/docs/environment-variables/managing-environment-variables)

## 5. Deploy කරන්න ඕන පිළිවෙළ

මේ document එක deployment authorization එකක් නෙවෙයි. Existing auto-deploy settings සහ release branch බලලා, අනුමත code revision එකට පමණක් මේ steps කරන්න.

1. Google Console setup complete කරන්න. Ownerගේ Google account එකට passkey හෝ two-step verification සහ recovery options සූදානම් කරගන්න.
2. Existing Render/Vercel successful deployment IDs සහ existing environment configuration තමන්ගේ private operator record එකේ තබාගන්න. Tokens/passwords public screenshots, repository හෝ chat එකට paste කරන්න එපා.
3. **Render backend එක මුලින් deploy කරන්න.** Root `backend`; Node 24; build `npm ci`; start `npm start`. Saved Google-only environment එක එම deployment එකට apply කරන්න. Admin sign-in cutover එක අතරතුර brief interruption එකක් තිබිය හැකියි; inventory editing ඒ අතර නවත්වන්න.
4. Browser එකෙන් පහත read-only URLs verify කරන්න:

   ```text
   https://pinnawalagems.onrender.com/api/health
   https://pinnawalagems.onrender.com/api/admin/auth-options
   ```

   Health response එක healthy විය යුතුයි; feature list එකේ `admin-session-verification` සහ `google-owner-policy` තිබිය යුතුයි. Authentication options මෙයට සමාන විය යුතුයි:

   ```json
   {
     "passwordEnabled": false,
     "googleEnabled": true,
     "googleClientId": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com"
   }
   ```

   Owner email හෝ secret values මේ response එකේ පෙන්වන්නේ නැහැ. `/api/admin/session` වෙත token නැතුව ගියොත් JSON **401** ලැබීම නිවැරදියි.
5. **ඊළඟට matching Vercel frontend එක deploy කරන්න.** Root `frontend`; Vite; build `npm run build`; output `dist`. New frontend එක old backend එකක් සමඟ pair කරන්න එපා: `/api/admin/auth-options` සහ `/api/admin/session` දෙකම අවශ්‍යයි.
6. ඉහළ admin sign-in URL එක open කරලා **Continue with Google** තෝරන්න. Owner Gmail එකෙන් sign in වෙන්න. Password form එක Google-only configuration එකේ නොපෙනිය යුතුයි.
7. වෙනත් Google account එකක් තෝරලා access ප්‍රතික්ෂේප වෙන බව බලන්න. එයින් admin screen එකක් විවෘත විය නොහැකියි. පසුව correct owner account එකෙන් නැවත sign in වෙන්න.
8. Existing inventory/appointments/notes read-only බලන්න. මේ verification එකට test items, uploads, notes හෝ feedback create/delete කරන්න එපා. Sign out පරීක්ෂා කරන්න; token නැතුව admin route එක open කළොත් නැවත sign-in screen එකට යා යුතුයි.

## 6. Backend එකේ protection එක ක්‍රියාකරන හැටි

Google ID token එකේ signature, intended client, issuer සහ expiry Google authentication library එකෙන් verify කරනවා. ඉන්පසු verified email එක sole configured Gmail එකට match විය යුතුයි; session identity එක Google `sub` identifier එකෙන් තබාගන්නවා. Browser එකෙන් email string එකක් යැවීමෙන් admin වෙන්න බැහැ. [Google token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)

හැම private API request එකකදීම current owner policy නැවත check කරනවා. Owner Gmail එක ඉවත් කළොත් ඒ account එකේ පැරණි session JWT එකත් server එක ප්‍රතික්ෂේප කරනවා. Google-only mode එකේ password login සහ password sessions දෙකම disabled. Login screen එකේ button hide කිරීම පමණක් කරන protection එකක් නෙවෙයි.

Website session එකට උපරිම පැය 8ක expiry එකක් තියෙනවා. **Google account එකෙන් sign out වීම පමණක් දැනට නිකුත් කළ website JWT එක revoke කරන්නේ නැහැ**; website එකේ Sign out action එක භාවිතා කරන්න. Owner policy වෙනස් කළ විට අලුත් private API requests වහාම deny කරන නමුත් දැනට browser එකේ render වෙලා තියෙන data ඊළඟ session revalidation හෝ sign-out එක වෙනකම් පෙනෙන්න පුළුවන්. Frontend verification cache එකේ තත්පර 60ක TTL එක automatic remote-logout timer එකක් නෙවෙයි.

මේ release එක existing bearer-token storage එක භාවිතා කරන නිසා එය HttpOnly-cookie, device-bound හෝ single-device session architecture එකක් කියලා සලකන්න එපා. Ownerගේ Google account/device එක compromise වුණොත් ඒක වෙනම security incident එකක්. Google MFA මේ app එකෙන් force කරන්නේ නැහැ; owner account settings වල configure කරන්න.

## 7. Sign-in වැඩ නොකළොත්

| පෙනෙන issue එක | කරන්න ඕන දේ |
| --- | --- |
| `auth-options` 404 / secure sign-in unavailable | New backend code deploy වෙලාද, `VITE_API_URL` correct Render origin එකද බලන්න. Old API එකකට UI password fallback එකක් දාන්න එපා. |
| `googleEnabled:false` | Render values තුන, exact single Gmail, `JWT_SECRET` availability සහ latest deployment එක බලන්න. Environment changes save කරලා පමණක් තියෙන්න පුළුවන්. |
| Google origin/client error | Web OAuth client ID එකද, authorized origin එක exact frontend origin එකද බලන්න. Admin path එක origin field එකට දාන්න එපා. |
| Google popup එක load නොවීම | Popup blocker/extension/network සහ Google script loading බලන්න. Page එකේ Retry Google sign-in භාවිතා කරන්න. `/workspace/*` සඳහා source එකේ popup-compatible COOP header එක දාලා තියෙනවා; actual Vercel response එකත් verify කරන්න. [Google popup guidance](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) |
| Account unauthorized / 403 | Google account picker එකේ address එක සහ `ADMIN_GOOGLE_EMAIL` match ද බලන්න. තවත් accounts list එකකට add කරලා bypass කරන්න එපා. |
| Login success වුණත් workspace verify වෙන්නේ නැති වීම | Backend `/api/admin/session`, policy/expiry සහ matching code revisions check කරන්න. Session check එක bypass කරන්න එපා. |
| Old password session එක sign out වීම | Google-only mode activate කළ විට expected. Owner Gmail එකෙන් sign in වෙන්න. |

Rollback අවශ්‍ය නම් policy-aware compatible frontend/backend revisions යුගලයක් පමණක් භාවිතා කරන්න. පැරණි backend එකක් `ADMIN_AUTH_MODE=google` නොසලකා password/පැරණි allowlist නැවත enable කළ හැකියි; ඒ නිසා backend code rollback එක owner-only access guarantee එකක් නොවේ. Configuration fix/forward fix එකට operator review දෙන්න. **MongoDB reset, Cloudinary cleanup, Gmail password sharing හෝ `JWT_SECRET` rotation මේ setup එකට අවශ්‍ය නැහැ.**

## Completion record

- [ ] Sole owner Gmail සහ Google Web client ID නිවැරදිව තෝරාගෙන ඇත.
- [ ] Render `ADMIN_AUTH_MODE=google` configuration එක matching backend එකට deploy කර ඇත.
- [ ] `auth-options` Google enabled / password disabled බව පෙන්වයි.
- [ ] Matching Vercel frontend deploy කර ඇත.
- [ ] Owner sign-in works; another account is rejected; sign-out/session guards work.
- [ ] Existing production data/media වෙනස් නොකර read-only checks complete කර ඇත.

**Until these operator steps are completed: live Gmail-only admin access remains PENDING.**
