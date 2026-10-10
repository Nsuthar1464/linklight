# Activate shared checks

The downloaded extension and website contain no provider key. The API key is read only by the server route from the runtime secret VT_API_KEY. It is never returned by an endpoint. Do not put it into source files, browser storage, build variables prefixed NEXT_PUBLIC/VITE, the ZIP, or chat.

1. Confirm that your provider plan permits this service. VirusTotal public API is limited to noncommercial/academic use and 4/min, 500/day. Commercial use needs an appropriate agreement. This server defaults to a conservative shared 3/min and 450/day budget.
2. Configure hosted values using the connected Sites runtime environment tool. Add `VT_API_KEY` with `is_secret: true`. Keep `SCANNING_ENABLED=false` until the key is stored. Runtime values do not belong in `.openai/hosting.json`. If you want assistance transferring your key, enter it locally in the ignored `.dev.vars` file using a text editor, then ask to configure the hosted secret from that file. Do not paste the key into chat. The assistant must transfer the value without printing it in tool output or command arguments.
3. Set `SCANNING_ENABLED=true` and redeploy the saved Site version to apply the environment revision. Check `/api/status`, then test `example.com` through the website. A `ready: true` status confirms configuration, not that the provider key is valid; an actual check must also succeed. Space checks at least 20 seconds apart. A missing report legitimately returns Unknown. If checks fail, set `SCANNING_ENABLED=false` and redeploy before sharing.
4. The extension currently installs manually from the ZIP. If you later publish it through your Chrome Web Store developer account, replace the download link with the verified listing after approval.

## Local key entry

Create `.dev.vars` in the project root only if you are ready to configure the key. It is ignored by Git and must remain outside published source and archives. Enter these names in your editor, replacing the placeholder locally:

```dotenv
VT_API_KEY=YOUR_KEY_HERE
SCANNING_ENABLED=false
```

Do not commit the file, attach it to chat, or place it in the extension. Visitors never need their own key. A local `.dev.vars` file does not configure the hosted Site by itself.

Provider documentation: [public API terms and quotas](https://docs.virustotal.com/reference/public-vs-premium-api), [finding your key](https://docs.virustotal.com/reference/getting-started). Current public limits are 4 requests/minute and 500/day; Linklight reserves at most 3/minute and 450/day across all visitors.

## Abuse and privacy boundary

The API is public and anonymous; CORS is not authentication. No shared client secret is used because it would be extractable. A single atomic D1 quota row protects the provider key budget across Worker instances. All upstream requests, including failures, reserve quota. Upstream requests go only to the hard-coded VirusTotal API; user destinations are never fetched. Payloads are capped at 10 KB, requests time out, upstream errors are sanitized, and reports are restricted to counts/timestamps. No user-submitted URL or client IP is stored by this application. Infrastructure may retain request metadata.

An attacker can exhaust the public quota and deny service; key secrecy alone cannot prevent this. Before a broad launch or a larger paid plan, add user/device authentication and bot protection plus per-user quotas. Do not raise the shared budget without considering this. No claims of live detection or camera hardware validation were made during development: no owner key or physical laptop camera was supplied.
