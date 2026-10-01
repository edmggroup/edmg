# Research Group Management System

A shared, live progress-tracking system for a research group — built for two roles, **Supervisor** and **Student** — covering weekly progress, characterization sample tracking (including battery-specific techniques), and the paper pipeline from planning through publication.

Everything is designed around one principle: **nothing is official until the supervisor approves it.**

---

## Features

- **Weekly progress logs** — students submit work done / plan for next week / blockers. Supervisor approves or requests changes with a note.
- **Characterization tracking** — log samples submitted for analysis (CV, GCD, EIS, Cycling Test, Battery Testing, XRD, SEM, and more), expected/received dates, and a data file link once results are in. Supervisor approves each entry.
- **Paper pipeline** — track manuscripts from Planning through Published, with a manuscript/draft link and a running list of reference links for reading and citations. Stage changes proposed by a student require supervisor approval before they take effect.
- **Email notifications** — students and the supervisor are emailed automatically whenever something needs the other person's attention: new submissions go to the supervisor, approvals/decisions go back to the student.
- **PIN-protected accounts** — each student and the supervisor set their own PIN; students only ever see their own records, the supervisor sees everyone's.
- **Live shared data** — every member reads and writes to the same backend, so the whole group sees updates in real time.
- **Backup & restore** — export the group's data (or, for students, just their own) as a portable JSON file at any time.

---

## Architecture

This is a **static web app with a Google Sheets backend** — no server to maintain, no hosting costs.

```
Browser (index.html)  <-->  Google Apps Script Web App  <-->  Google Sheet (in your Drive)
        |
        └── hosted for free on GitHub Pages (or any static host)
```

- `index.html` — the entire application (UI + logic). Opens in any browser, including on phones.
- `backend/Code.gs` — a Google Apps Script that turns a Google Sheet into a simple key–value database, reachable over HTTPS.
- The Sheet lives in your Drive. It is the single source of truth. Nothing is stored inside GitHub or the HTML file itself.

---

## Setup

Full step-by-step instructions, including troubleshooting, are in **[SETUP.md](./SETUP.md)**. In short:

1. Deploy `backend/Code.gs` as a Google Apps Script Web App, bound to a Google Sheet in your Drive.
2. Paste the resulting Web App URL into the `DATA_API_URL` constant near the top of `index.html`.
3. Publish `index.html` (e.g. via GitHub Pages) and share the link with your group.

---

## Usage notes

- The **supervisor** logs in once and sets a group passcode on first use.
- **Students** register their own name and PIN the first time they open the link.
- Anyone who forgets their PIN can have it reset by the supervisor from the **Overview → Access & privacy** panel.
- Data privacy between students is enforced by the app's UI and PIN gate, not by a server-side permission system — see the **Security model** note below before storing anything highly sensitive.

---

## Security model — please read

This is a lightweight internal tool, not a compliance-grade system. Be aware of the following before relying on it for sensitive data:

- The Apps Script Web App, once deployed with "Anyone" access, will respond to anyone who has the URL *and* the shared `APP_KEY`. Keep the deployed `index.html` link and the key itself out of fully public places if you want to limit exposure — access control (who can log in as whom) is still enforced by the app's PIN system, not by Google account permissions.
- There is no server-side authorization layer distinguishing "student" from "supervisor" API calls beyond the shared key — the roles are enforced by the app's interface, not the backend. A technically determined user with the API URL and key could bypass this by calling the backend directly, including triggering emails.
- The first person to claim the Supervisor role sets the passcode that protects it from then on — to stop the wrong person doing this before the real supervisor gets there, claiming the role for the first time also requires a separate `SUPERVISOR_SETUP_KEY`, given privately to the intended supervisor only. Once the passcode is set, this key is no longer used.
- This is appropriate for normal day-to-day lab use among a trusted group. It is **not** appropriate for storing information with legal, disciplinary, or highly confidential sensitivity (e.g. formal performance reviews, unpublished IP tied to funding). For that, use a properly access-controlled institutional system.

---

## License / usage

This tool was built for internal use by a specific research group. No open-source license is applied — treat it as an internal utility, not a public package. Feel free to adapt it for your own group.
