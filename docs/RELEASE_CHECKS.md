# Linklight release checks

## Current integration checks

42 automated tests pass. They cover URL normalization, risk logic, camera lifecycle with mock streams, actual QR image decoding, provider-key headers, sanitized output, mixed provider failures, Google threat overrides, cache expiry and expired assessments. TypeScript checks and production builds also pass. These tests do not validate owner credentials or physical camera hardware.

Google Safe Browsing and VirusTotal are connected in server code. Live checks require both runtime secrets and SCANNING_ENABLED=true. No live provider result has been verified until the owner saves keys and activation is completed. Use OWNER_SETUP.md.

## Chrome Web Store transition

Public ZIP distribution is retired. `/api/download` returns 410 and the old static ZIP is removed. Get extension is disabled until the owner supplies the published listing URL. `node scripts/package-extension.mjs` creates the private owner upload package `outputs/Linklight-chrome-store.zip`, with manifest.json at the ZIP root and no website/backend source or credentials. This package has not been uploaded, reviewed or approved by Google.

After publication, verify the exact Store listing, Add to Chrome installation on Mac/Windows, and the website's Get extension link. Store distribution simplifies installation but installed extension code remains inspectable.

## Actual-device checks still needed

1. On iPhone Safari and Android Chrome, start scanning, allow permission, and confirm a moving preview inside the page. Scan a QR and confirm its destination is shown for review without opening it or starting a check.
2. Test denied permission, Stop camera, leaving the page, switching apps, and repeat scans. Confirm the camera indicator turns off whenever scanning ends.
3. Upload a QR photo and screenshot. Test blank/invalid QR images and oversized files. A failed upload must not leave a previous URL ready to check.
4. In the installed extension, confirm everyday scanning stays inside the toolbar popup after first permission setup. Closing the popup must stop the camera.

## Live API checks after secret setup

Verify a benign check and provider availability, a controlled Google test threat through the backend (without opening its destination), and Unknown for missing/stale clean data. Space checks at least 20 seconds apart. Verify failure and quota feedback. A ready status only confirms configuration, not valid keys.

Linklight retrieves existing VirusTotal reports, does not submit fresh scans, and does not independently inspect redirect destinations. No result guarantees safety.
