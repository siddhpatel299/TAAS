# TAAS LinkedIn Job Saver (Chrome Extension)

This extension adds an `Add to Job Tracker` button on LinkedIn job pages and saves the current job into the TAAS Job Application Tracker.

## What it does

- Runs on LinkedIn Jobs pages
- Adds a floating `Add to Job Tracker` button
- Uses your existing TAAS backend APIs:
  - `POST /auth/email-login`
  - `POST /job-tracker/scrape`
  - `POST /job-tracker/applications`
- Auto-enables the `job-tracker` plugin if disabled
- If scraper fails, it still saves using visible LinkedIn page fields (title/company/location/url)

## Load extension in Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this folder:
   - `/Users/siddh/Masters/TAAS/apps/linkedin-job-tracker-extension`

## Configure and use

1. Open extension popup
2. Set:
   - `API URL` (deployed example: `https://taas-col4.onrender.com/api`, local example: `http://localhost:3001/api`)
   - `App URL` (e.g. `http://localhost:5173` or your deployed frontend)
3. Log in with TAAS email/password
4. Open LinkedIn job page and click `Add to Job Tracker`

### If email login fails

1. Open `https://taas-ten.vercel.app` in another tab and sign in there
2. In extension popup, click `Use Current TAAS Session`
3. Retry `Add to Job Tracker` on LinkedIn

## Notes

- MVP login supports email/password auth endpoint.
- If TAAS API is on a different origin, backend CORS must allow extension requests.
- For deployed frontend (`https://taas-ten.vercel.app`), `localhost` API will fail unless you run backend locally on the same machine.
