# Linklight 2.0 beta

No personal API key required. Security checks use the Linklight service.

## Install
1. Unzip and keep the linklight folder on your computer.
2. Open chrome://extensions in desktop Chrome and enable Developer mode.
3. Load unpacked → select linklight.
4. The welcome page opens. Choose Enable camera → Allow, or skip camera setup.
5. Pin Linklight from Chrome’s Extensions menu.

Paste a link and choose Check destination. For QR codes, choose QR code and hold your phone to the laptop camera, or upload an image. Scanning stays inside the popup. Camera setup may need a separate small window once because Chrome cannot always prompt inside the toolbar popup.

## Update
Replace the contents of your ORIGINAL installed folder and click Reload in chrome://extensions. Your old personal API key is removed during the version upgrade. No key needs to be entered again.

## Service availability
If the shared service has not been activated, checks return an explicit unavailable message. QR decoding still works. Do not treat unavailable or Unknown as safe. Shared usage limits apply.

## Privacy
Camera frames stay on your device and are not recorded. A URL you choose to check goes to Linklight’s server and VirusTotal. Do not submit private or token-bearing links. The application stores only global quota counters, not URLs or camera images. Hosting providers may keep standard request metadata.

Automated checks can make mistakes. Low Risk is not a guarantee. Scores are rule-based indicators, not probabilities. Existing reports only; redirects are not independently checked.

Normal consumer installation requires a future Chrome Web Store release. This ZIP is a manual-install beta.
