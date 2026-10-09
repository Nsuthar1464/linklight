# Activate shared checks

The downloaded extension and website contain no provider key. The API key is read only by the server route from the runtime secret VT_API_KEY. It is never returned by an endpoint. Do not put it into source files, browser storage, build variables prefixed NEXT_PUBLIC/VITE, the ZIP, or chat.

1. Confirm that your provider plan permits this service. VirusTotal public API is limited to noncommercial/academic use and 4/min, 500/day. Commercial use needs an appropriate agreement. This server defaults to a conservative shared 3/min and 450/day budget.
2. In the Site runtime environment settings, add VT_API_KEY as a secret, using your own key. Set SCANNING_ENABLED to true only when ready to activate. Redeploy the saved Site version to apply the values.
3. Run a benign URL test and confirm provider responses before inviting users. Disable SCANNING_ENABLED to pause the service.
4. Publish the extension through your Chrome Web Store developer account for ordinary one-click installation. Replace the website beta download CTA with the verified listing URL after approval. The site currently gives truthful manual ZIP installation instructions.

## Abuse and privacy boundary

The API is public and anonymous; CORS is not authentication. No shared client secret is used because it would be extractable. A single atomic D1 quota row protects the provider key budget across Worker instances. All upstream requests, including failures, reserve quota. Upstream requests go only to the hard-coded VirusTotal API; user destinations are never fetched. Payloads are capped at 10 KB, requests time out, upstream errors are sanitized, and reports are restricted to counts/timestamps. No user-submitted URL or client IP is stored by this application. Infrastructure may retain request metadata.

An attacker can exhaust the public quota and deny service; key secrecy alone cannot prevent this. Before a broad launch or a larger paid plan, add user/device authentication and bot protection plus per-user quotas. Do not raise the shared budget without considering this. No claims of live detection or camera hardware validation were made during development: no owner key or physical laptop camera was supplied.
