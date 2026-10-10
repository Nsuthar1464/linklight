# Linklight: start here

## Continuation on October 9, 2026 (Chicago)

Use `/Users/nishant.mac/linklight/hosted` for continued work. It was opened from the existing hosted source at the version 5 commit; the exported project is preserved separately.

The download button now uses an explicit `download` anchor without a new tab. Its fallback uses `/Linklight.zip` independently of `/api/download`. Both downloaded valid ZIPs through the Codex in-app browser; the main ZIP exactly matches the packaged extension. Native Chrome was blocked by missing Computer Use permission, so Chrome on Mac/Windows remains unverified.

A real QR PNG on live version 5 filled example.com for review without opening it. The revised local upload rejected executable QR content and cleared the prior URL. New uploads clear the previous URL so failed images cannot leave an old destination ready to check. Six real decoder tests bring the passing total to 34. TypeScript and production builds also passed. Physical phone cameras and actual provider results remain unverified.

Sites runtime settings were empty. Activation still requires the owner's key. `.dev.vars` is now ignored; use it only for local secret entry, then configure a hosted secret with native Sites tools and `is_secret: true`, without printing the value. Never request a key pasted in chat. See updated `docs/OWNER_SETUP.md` and `docs/RELEASE_CHECKS.md` for setup and outstanding device checks.

The original version 5 handoff below is historical context. Consult the latest saved Site version for publication state.

This is the current complete source snapshot, exported October 10, 2026 UTC (October 9 in Chicago).
Source commit: 5f61a5889a51b4a491955c2e31a2940978b25435
Published Site version: 5
Live website: https://linklight-check.alivecod8.chatgpt.site

## What Nishant wants

Linklight lets nontechnical users paste a URL or scan/upload a QR code before opening its destination. The website is the main experience. A Chrome extension is optional for desktop Chrome on Mac and Windows. Website camera scanning is offered on mobile/touch devices; image upload works on desktop too.

Keep the current dark Apple-inspired design, motion, and linked-shape logo. The user approved the visual style. Use simple, natural copy without em dashes, unnecessary slogans, beta labels, or selectable sample risk demonstrations. Installation should have three steps: Install, Allow, Pin & check. Do not make visitors obtain their own API keys. Provider branding was removed from public copy, but disclosure that URLs go to an external security service remains.

## Important current limitation

LIVE SECURITY CHECKS ARE NOT ACTIVATED. The deployed server has no VT_API_KEY and no enabled SCANNING_ENABLED flag. The message "Security checks are not activated yet" is expected until the owner configures these. Do not report a link as safe when the service is unavailable. The user has not supplied an API key.

Store VT_API_KEY only as a server runtime secret. Set SCANNING_ENABLED=true once configured and tested, then redeploy. Do not put keys in code, browser storage, the extension, NEXT_PUBLIC variables, VITE variables, or Git. See docs/OWNER_SETUP.md for provider terms, quotas and limitations. Users should never be prompted for their own keys.

## Current structure

- app/page.tsx and app/globals.css: landing page, three-step installation, desktop Chrome download visibility.
- components/website-check.tsx: real form, progress/errors/results, mobile camera preview, image upload.
- lib/web-scanner.mjs: camera lifecycle, separate frame/deadline timers, cancellation and late permission handling.
- lib/web-check.mjs: normalized input, API request, error handling, shared assessment.
- extension/core.mjs: normalization, risk assessment and extension API client. Website reuses normalization and assessment.
- app/api/check/route.ts and lib/security.ts: server-only security provider call and quota reservation.
- app/api/status/route.ts: readiness indicator.
- app/api/download/route.ts: serves ZIP with Content-Disposition attachment.
- components/extension-download.tsx: native new-tab download link and visible download feedback.
- extension/: installable Chrome Manifest V3 source, camera permission welcome page, toolbar scanner.
- public/Linklight.zip: ready-to-install extension ZIP with linklight/ folder inside.
- public/jsQR.js and extension/vendor/: bundled QR decoder and license.
- scripts/package-extension.mjs: rebuilds extension ZIP and server download payload.
- lib/extension-download-data.ts: generated base64 of the extension ZIP, used only on the server. This is not a credential.
- db/ and drizzle/: Cloudflare D1 quota schema and migration.

## Latest issues and fixes

1. The website previously requested a camera stream before the video element existed. The preview now stays mounted, is shown while starting, and receives the stream before playback. It stops on capture, manual stop, timeout, pagehide, or hidden document. No audio is requested. Late streams after cancellation are released.
2. Image upload previously was a placeholder. It now draws an image to canvas and decodes locally.
3. The link form accepts bare domains such as youtube.com, shows progress/errors, and times out after 20 seconds. It uses the same assessment rules as the extension. Old/missing clean reports are Unknown.
4. The user reported clicking Download for Chrome did nothing. The public ZIP was fetched successfully and its archive integrity checked. The exact browser cause was not reproduced. A dedicated /api/download endpoint now returns ZIP bytes with attachment headers. The button uses a normal target=_blank anchor and displays download feedback plus a direct fallback link. This change was deployed in version 5 but the user has not confirmed it yet.

## Validation performed and still needed

Passed: TypeScript check and production build; 28 automated URL/camera tests; download-route response headers and exact ZIP bytes; live public ZIP download and archive integrity.
Commands: node --test lib/web-flows.test.mjs extension/tests.mjs extension/camera-tests.mjs

NOT verified: real phone camera UI after the latest fixes; real Safari/Chrome browser clicks after the latest download change; actual provider results with an owner key. Browser automation was unavailable in the previous environment. Automated camera tests mock media objects and do not replace real device tests. A separate optional real-QR fixture test could not run because the QR-generation dependency was unavailable.

Suggested next work: run on a real desktop Chrome and iPhone Safari/Chrome; verify download, visible camera preview, deny/allow, stop, backgrounding, successful QR reading, invalid QR content, image upload, network errors, and URL checks once the owner secret is configured. Do not claim these have already passed.

## Development and portability

Stack: React 19, TypeScript, Vinext/Vite, Cloudflare Workers, D1, Drizzle, Tailwind, lucide-react. This is NOT a plain static site or a ready-to-deploy standard Vercel Next.js app. It contains Sites platform integration in build/sites-vite-plugin.ts and vite.config.ts.

Use Node >=22.13 and the pnpm version pinned in package.json (11.25.0). In a normal local clone without .sites-runtime, scripts default to the portable profile. A starting workflow is:

    pnpm install --frozen-lockfile
    pnpm dev
    pnpm exec tsc --noEmit
    node --test lib/web-flows.test.mjs extension/tests.mjs extension/camera-tests.mjs
    pnpm build

These clean-machine commands have not been tested on Nishant's laptop. The retained README.md is framework starter documentation, not an accurate product-status report. Some managed install scripts need Linux tools; use the portable workflow on Mac/Windows. Do not blindly run install:ci on a laptop. Dependencies and caches are deliberately excluded and must be installed.

To update extension files, run node scripts/package-extension.mjs before the website build. It needs Python 3. Both the public ZIP and generated server payload must be regenerated together.

The hosted runtime requires D1 binding DB and the migration in drizzle/. Local secrets belong in an ignored Wrangler .dev.vars file; add it to .gitignore before using it. Never commit actual values. The export includes no secrets.

If moving hosting away from Sites, adapt the Worker deployment and D1 setup. Preserve the public API contract. Update the service URL in extension/core.mjs and host_permissions/connect-src in extension/manifest.json; also update the absolute download fallback in components/extension-download.tsx. Do not assume the hosting.json project ID alone grants deployment access.

## Security behavior

Backend reads existing VirusTotal reports, not new URL submissions. It does not fetch the destination or independently resolve redirect chains. It sends only sanitized counts and report timestamps to clients. URLs are validated and requests bounded and timed out. The database stores shared quota counters, not URL history. Global limits are one request per 20 seconds and 450/day. Anonymous users share these limits. A public endpoint can still be exhausted by an attacker; secret storage alone does not prevent abuse. Review authentication/bot protection before a larger release.

## What is in this export

Tracked website source, extension source, public assets, dependency lockfile, build scripts, database migrations, documentation, and this handoff note. .openai/hosting.json retains the existing Site identifier but contains no credentials. Git history, node_modules, caches, local runtime state, build output, temporary files, and tsconfig.tsbuildinfo are excluded. This is a source handoff, not a preinstalled runtime.
