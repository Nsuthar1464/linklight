# Activate shared security checks

Linklight now uses Google Safe Browsing and VirusTotal together. Bitly is not connected. Visitors do not need accounts or keys.

## Enter your keys privately

The assistant opened `.dev.vars` in the Codex editor. This local file has owner-only permissions and is excluded from Git. Paste each key after its equals sign, then save:

```dotenv
GOOGLE_SAFE_BROWSING_API_KEY=
VT_API_KEY=
SCANNING_ENABLED=false
```

Do not paste keys into chat or attach the file. Do not put keys into website code, the extension, public assets, browser storage, `.openai/hosting.json`, or variables beginning with VITE/NEXT_PUBLIC.

Tell the assistant when you have saved the file. It can read only these values into session memory, without displaying them, and configure the existing Site with the native Sites runtime environment tool. Both keys must use `is_secret: true`. Key values must never appear in shell arguments, tool output, logs or tracked files. The local file alone does not configure the hosted Site.

After transfer, confirm only the key names and their secret flags. Enable `SCANNING_ENABLED=true` and redeploy the saved version to apply the environment revision. Verify a benign real check. `/api/status` indicates configuration readiness, not provider authentication. If a key fails, disable checks and redeploy while fixing it. Remove local key values after verified hosted setup if local development does not need them.

## Restrict the Google key

Use a dedicated standard API key for Linklight and enable Safe Browsing API in that Google Cloud project. In APIs & Services > Credentials, edit the key and restrict its API access to Safe Browsing API only. Do not reuse a broad key that also permits unrelated Google APIs.

These are server requests. A website/referrer restriction is not the correct restriction for this backend. IP restrictions require a verified stable outbound server IP; do not enter the site's domain or your laptop's IP. Review the project's Safe Browsing quota and usage alerts.

Official guidance: [API key restrictions](https://docs.cloud.google.com/docs/authentication/api-keys), [key security](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices).

## Provider rules and limits

[Google Safe Browsing](https://developers.google.com/safe-browsing/reference/Appropriate.Usage) is for noncommercial use. For a service that generates revenue, use Google Web Risk instead. Warnings based on Google data require a Google advisory link and qualified language. The interface includes both, and explains that harmless links may be flagged while real threats may be missed.

[VirusTotal public API](https://docs.virustotal.com/reference/public-vs-premium-api) permits noncommercial use and is limited to 4 requests/minute and 500/day. Linklight retains a conservative shared allowance of one request every 20 seconds and 450/day across all visitors. A check can query both services in parallel; Google results are cached for the exact lifetime supplied by Google, including no-match results.

## How results work

- A current Google threat match produces a High Risk warning even if VirusTotal has no report or a clean report.
- VirusTotal detections remain visible if Google is unavailable.
- A Google no-match response alone does not create a Low Risk result. A usable recent VirusTotal report is also needed.
- Missing/stale clean reports and incomplete clean checks remain Unknown.
- Google-backed results expire and must be checked again. Scores summarize warning signs; they are not probabilities.
- Neither service result guarantees safety. Linklight does not fetch the submitted destination, resolve redirects independently or submit fresh VirusTotal scans.

## Privacy and abuse boundary

Requests go only to fixed Google and VirusTotal endpoints. Keys travel in server-to-server headers, not URL query parameters. Provider errors are sanitized. Clients receive only counts, threat categories, timestamps and availability states, never keys or raw reports. Google's full-URL lookup sends the submitted URL to Google; VirusTotal receives its URL identifier.

D1 stores the shared quota counters. Google's temporary response cache stores a SHA-256 digest of the URL plus sanitized threat data and expiry, not the raw URL or keys. This cache is not a browsing-history feature. Infrastructure and providers may retain their own request metadata.

The endpoint remains public and anonymous. Key secrecy does not stop someone from exhausting the shared quota. Add bot protection and stronger abuse controls before a large public launch. Keep the allowance conservative.
