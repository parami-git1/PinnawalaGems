# Admin login — email/password සහ Google

Updated: **25 November 2026 · Asia/Colombo**

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

**Live status:** Configuration/deployment මේ session එකෙන් වෙනස් කරලා නැහැ. Read-only live checks තුනම 15-second timeout එකට ළඟා වූ නිසා live backend version/configuration verify කළ නොහැකි වුණා. Local account verification සහ automated tests production login proof එකක් නොවේ.
