# Setup Guide

Estimated time: 10–15 minutes. No coding experience required.

There are three parts:
1. Create the Drive backend (Google Sheet + Apps Script)
2. Connect the app to that backend
3. Publish the app so your group can reach it

Complete each part **in order**, and verify the checkpoint at the end of each step before moving on — this avoids the most common source of confusion, which is debugging two problems at once.

---

## Part 1 — Create the Drive backend

### 1.1 Create the Sheet

1. Go to [sheets.new](https://sheets.new) — this creates a new Google Sheet in your Drive.
2. Rename it to something identifiable, e.g. **"Research Group Logbook — Data"**.

### 1.2 Add the Apps Script

1. In the Sheet, go to **Extensions → Apps Script**. This opens the script editor in a new tab, already linked to this specific Sheet.
2. Delete any placeholder code in the editor (e.g. `function myFunction() {}`).
3. Open `backend/Code.gs` from this package, copy its entire contents, and paste it into the editor.
4. Save (`Ctrl+S` / `Cmd+S`, or the disk icon).

> **Important:** the script must be created via *Extensions → Apps Script* from inside the Sheet, not from script.google.com directly — otherwise it won't be bound to a Sheet and `SpreadsheetApp.getActiveSpreadsheet()` will fail.

### 1.3 Deploy it as a Web App

1. Click **Deploy** (top right) → **New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Set:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**.
5. The first time you deploy, Google will ask you to authorize the script. Click through the prompts. You will likely see an "unverified app" warning — this is expected, since it's your own script and hasn't been submitted for Google's public-app review. Click **Advanced → Go to [project name] (unsafe) → Allow**.
6. Copy the **Web app URL** shown after deployment. It must end in `/exec` (not `/dev`).

### 1.4 Set your shared key (recommended)

Near the top of `Code.gs` there's a line:
```js
const APP_KEY = 'change-this-to-your-own-random-string-2026';
```
Change this to your own random string (anything works — a long random phrase is fine). This is a simple shared secret that keeps random visitors who stumble on your Web App URL from reading your data or triggering emails through it. You'll paste the **same** value into `index.html` in Part 2.

If you change it after already deploying, you must create a new deployment version for the change to take effect: **Deploy → Manage deployments → edit (pencil) → Deploy**.

### ✅ Checkpoint 1

Paste the `/exec` URL directly into a new browser tab. You should see plain JSON text, e.g.:

```json
{"error":"Unauthorized"}
```

(This is expected and correct — you're not passing the key in a plain browser visit. It confirms the script is live and responding.) If you instead see a Google sign-in page or "You need permission" — go back to **Deploy → Manage deployments → edit (pencil icon)**, confirm "Who has access" is `Anyone`, and re-deploy.

**Do not continue to Part 2 until this checkpoint passes.**

---

## Part 2 — Connect the app to the backend

1. Open `index.html` in a text editor (or GitHub's web editor, if you've already uploaded it).
2. Find this line near the top of the `<script>` section:
   ```js
   const DATA_API_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
3. Replace the placeholder text **inside the quotes** with your `/exec` URL from Part 1, keeping the quotes and semicolon:
   ```js
   const DATA_API_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
4. Just below it, find:
   ```js
   const APP_KEY = 'change-this-to-your-own-random-string-2026';
   ```
   Make sure this **exactly matches** the `APP_KEY` value you set in `Code.gs` in step 1.4.
5. Just below that, find:
   ```js
   const SUPERVISOR_SETUP_KEY = 'change-this-setup-key-too';
   ```
   Change this to your own value too. This is a **separate** secret from `APP_KEY` — it's only needed once, to claim the Supervisor role for the first time. Give this value directly (in person, or via a private message) to whoever should become the supervisor, and don't publish it anywhere alongside the app link. Without it, nobody else can set themselves up as supervisor even if they open the link first.
6. Save the file (and commit the change, if editing on GitHub).

### ✅ Checkpoint 2

If you're editing locally, open `index.html` directly in your browser (double-click it). You should see the login screen (Supervisor / Student choice) — not the "Setup needed" message. If you're editing on GitHub, view the **Raw** version of the file and confirm your real URL and matching key appear, not the placeholders, before moving to Part 3.

---

## Part 2.5 — Email notifications

The app emails people automatically at each approval point:
- A student submits a weekly report, sample, or proposes a paper stage change → the **supervisor** gets an email.
- The supervisor approves or requests changes → the **student** gets an email.
- A new student signs up → the **supervisor** gets an email.

For this to work, both the supervisor and each student need to enter their email once — the app asks for it automatically the first time they log in (or the next time they log in, if their account already existed before this feature was added).

**Two optional settings in `Code.gs`, near the top:**
- `APP_NAME` — an optional short prefix added to every email's subject line (e.g. set it to `'EDMG'` to get subjects like "EDMG: New weekly report awaiting approval"). Leave it as `''` for no prefix.
- `SUPERVISOR_EMAIL_OVERRIDE` — if you want supervisor-directed notifications to always go to one fixed address (regardless of what's entered in the app), set it here. Leave it as `''` to use the email the supervisor enters in the app instead.

**Email format:** every email follows the same shape — a greeting ("Dear Scholar," or "Dear Sir/Madam," depending on the recipient), one continuous message (dates are written out in full, e.g. "3 August 2026" rather than the raw stored format), and a closing "Regards, Research Group Management System, Energy Devices and Materials Group" — every email is signed this way, including approval decisions, so all outgoing mail carries one consistent identity.

**Email sending limits:** these emails send from *your* Google account (whoever deployed the Apps Script), using Google's `MailApp` service. A standard Gmail account can send roughly 100 emails/day this way; Google Workspace accounts get a higher limit. This is normally far more than a research group needs in a day. If the limit is ever hit, notifications silently pause until the next day — the app itself keeps working and no data is lost, only the email goes missing.

If you'd rather notifications come from a specific lab email address rather than your personal Google account, deploy the Apps Script from that account's Google Sheet instead of your own.


## Part 2.6 — Daily automatic backup (optional, recommended)

The backend can automatically save a full snapshot of every collection to a single file in your Drive once a day, overwriting the same file each time rather than piling up a new one daily.

**One-time setup (~30 seconds):**
1. Open the Apps Script editor for your Sheet (same place you pasted `Code.gs`).
2. At the top of the editor, use the function dropdown to select **setUpDailyBackupTrigger**.
3. Click **Run**. The first time, you'll be asked to authorize Drive access — click through the prompts the same way you did for the Web App deployment.
4. That's it — a trigger is now installed that runs `dailyBackup_` once a day. You can see or adjust the exact time under the clock icon (**Triggers**) in the left sidebar.

The backup file is named `logbook-daily-backup.json` and appears in the root of the Drive account that ran the setup step. Re-running `setUpDailyBackupTrigger` is safe — it removes any previous daily-backup trigger first, so it never ends up running twice a day.

This is separate from, and in addition to, the in-app "Download backup" button available to the supervisor in Account — that one is a manual, on-demand download; this one runs automatically in the background without anyone needing to remember to do it.


## Part 2.7 — Daily deadline reminders (optional, recommended)

The backend can also email a heads-up once a day covering anything due in the next 3 days — lab work, results analysis, papers, thesis chapters, meetings, and conferences. Each scholar gets their own list; the supervisor gets one consolidated summary of everything due across the whole group. If nothing's due for someone, they simply don't get an email that day.

**One-time setup (~30 seconds), same idea as the backup trigger above:**
1. Open the Apps Script editor for your Sheet.
2. Use the function dropdown to select **setUpDailyReminderTrigger**.
3. Click **Run**, approving authorization if asked.
4. Done — check **Triggers** (clock icon, left sidebar) to confirm it's there or adjust the time it sends.

Re-running `setUpDailyReminderTrigger` is safe — it clears any previous reminder trigger first.


## Part 2.8 — Daily activity log export (optional, recommended)

The backend can also write a full, always-current activity log to a single CSV file in your Drive once a day — every review decision, staff edit, and deletion, across every section, overwriting the same file each time rather than piling up a new one daily. This is the automatic counterpart to the in-app Activity Log page, which only shows the most recent 150 entries.

**One-time setup (~30 seconds), same idea as the other triggers above:**
1. Open the Apps Script editor for your Sheet.
2. Use the function dropdown to select **setUpActivityLogTrigger**.
3. Click **Run**, approving authorization if asked.
4. Done — the file `logbook-activity-log.csv` will appear in the root of the Drive account that ran the setup step, refreshed daily.

Re-running `setUpActivityLogTrigger` is safe — it clears any previous trigger first.



## Part 3 — Publish it for your group

### Option A — GitHub Pages (recommended: one shareable link, easy to update later)

1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Click **+ → New repository**. Name it, leave it **Public**, click **Create repository**.
3. Click **Add file → Upload files**, and upload:
   - `index.html`
   - The whole `backend/` folder is *not* needed here — it only needs to exist inside the Apps Script editor, not on GitHub. You can upload it too for record-keeping if you like.
4. Commit the upload.
5. Go to **Settings → Pages**. Under "Build and deployment": Source = `Deploy from a branch`, Branch = `main`, folder = `/ (root)`. Click **Save**.
6. Wait about a minute, then refresh — your live link will appear, e.g.:
   ```
   https://yourusername.github.io/repo-name/
   ```

### Option B — No account needed (quick, private link)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag `index.html` onto the page.
3. You'll get an instant live link to share — no account, no setup.

### ✅ Checkpoint 3 (final)

Open your published link, do a hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`) to bypass any cache, and confirm the login screen loads. Create a test student account, then check your Google Sheet — a new tab named **"data"** should appear with rows being written to it. That confirms the full chain — browser → Apps Script → Sheet — is working end to end.

---

## Part 4 — Installing it on a phone or tablet (optional)

The package includes `manifest.json`, `sw.js` and an `icons/` folder, which together make the published link installable as an app. Upload all of them alongside `index.html`, in the same folder, when you publish. On Android, open the link in Chrome and choose **Install app** / **Add to Home Screen**; on iPhone or iPad, open it in Safari and choose **Share → Add to Home Screen**. It then opens without browser chrome, under the group's icon.

The installed app **rotates with the device** — portrait or landscape, on phones and tablets alike — subject to the device's own rotation lock. If you'd rather pin it to one orientation, change `"orientation"` in `manifest.json` from `"any"` to `"portrait-primary"` (or `"landscape-primary"`).

> **If you edit `index.html` or `manifest.json` after people have already installed it:** also bump `CACHE_NAME` in `sw.js` (e.g. `'rgms-shell-v2'` → `'rgms-shell-v3'`). The service worker caches those two files, so installed copies keep serving the old cached version until the cache name changes. Android also re-reads the manifest on its own schedule, so a change to `orientation` in particular may not show up until someone reinstalls the app — new installs pick it up immediately.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Slow to load on open | The app batches all its startup data into a single request, and the backend now caches reads for ~25 seconds so back-to-back loads skip the spreadsheet entirely (as of this version). If it's still slow, the most likely cause is Apps Script "cold start" after a period of inactivity, or a large amount of data in the Sheet — both are normal for this architecture. |
| "Setup needed" screen never goes away | `DATA_API_URL` still has placeholder text, or the edit wasn't saved/committed |
| 404 on your GitHub Pages link | `index.html` isn't at the repo's top level, wrong branch/folder selected in Settings → Pages, or wrong capitalization |
| "Couldn't reach the Drive backend" after login screen loads | Apps Script deployment access isn't set to `Anyone`, `APP_KEY` doesn't match between `Code.gs` and `index.html`, or the deployment was edited without creating a new version |
| "Incorrect setup key" when trying to become supervisor | `SUPERVISOR_SETUP_KEY` in `index.html` doesn't match what you were told — check with whoever deployed the app for the exact value |
| Data doesn't appear in the Sheet | Check the Apps Script's **Executions** log (left sidebar in the script editor) for errors |
| Changes to `Code.gs` don't take effect | Editing the script alone doesn't update the live URL — go to **Deploy → Manage deployments → edit → Deploy** again to publish a new version |
| Installed app won't rotate | The device's own rotation lock is on; or an older copy was installed before `manifest.json` was updated — uninstall and reinstall it from the browser |
| An edit to `index.html` doesn't show up in the installed app | `CACHE_NAME` in `sw.js` wasn't bumped, so the service worker is still serving the cached shell |
| Emails aren't arriving | Confirm the recipient has an email saved (Overview → Access & privacy for the supervisor, or Overview → Account for a student); check the Apps Script **Executions** log for a `MailApp` quota error; confirm you're not over ~100 emails/day on a personal Gmail account |

## Updating the app later

- **Frontend changes** (`index.html`): edit and re-commit on GitHub (or re-upload to Netlify) — takes effect within a minute.
- **Backend changes** (`Code.gs`): edit in the Apps Script editor, then **Deploy → Manage deployments → edit (pencil) → Deploy** to push a new version. The Web App URL itself does not change.
