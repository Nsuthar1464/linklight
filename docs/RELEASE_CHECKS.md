# Linklight checks before sharing

## Verified in this session

- 34 automated tests pass, including actual normal/inverted QR decoding with both shipped decoders and rejection of executable QR destinations. Camera lifecycle tests use mock streams.
- TypeScript and the production Worker build pass.
- The version 5 live download endpoint returns an attachment ZIP with valid archive contents.
- The revised direct download button and separate static ZIP fallback both downloaded files through the Codex in-app browser. The main downloaded ZIP exactly matches `public/Linklight.zip`. This is not native Chrome validation.
- A real PNG QR upload on version 5 filled `https://example.com/` for review and left the destination closed.
- The revised local upload flow rejected `javascript:alert(1)` and cleared the previous URL. It does not leave an old destination ready to check after a new image fails.
- A live bare-domain check displayed the inactive-service message without a risk rating.

## Still needed on actual devices

Use the published Linklight URL. These checks require the owner's browser and phone; they are not covered by mock tests or resizing a desktop browser.

1. In desktop Google Chrome on Mac and Windows, click Download for Chrome. Confirm `Linklight.zip` appears in Downloads, unzip it, and follow Install, Allow, and Pin & check. If the primary download fails, try the direct ZIP fallback and note which worked.
2. On iPhone Safari and Android Chrome, tap Scan QR code. Allow camera access and confirm that a moving preview appears inside the page.
3. Scan an example.com QR. Confirm the camera turns off, the URL appears for review, and no destination opens or security check starts automatically.
4. Start again and tap Stop camera. Repeat while switching apps or leaving the page. Confirm the camera indicator turns off. Deny permission and confirm clear recovery instructions.
5. Upload a clear QR photo and a screenshot. Try an image without a code, an invalid destination, and a file larger than 10 MB. Confirm an explanation appears and an old URL is not left ready to check.
6. In the extension, confirm everyday camera scanning remains inside the toolbar popup after initial permission setup. Closing the popup must stop the camera.

## Blocked until the owner configures the API

Follow OWNER_SETUP.md. Confirm an actual benign provider check, not just `/api/status`. Review missing/stale clean reports as Unknown, unavailable-provider feedback, and the shared allowance message. Automated result tests cover Low/Medium/High/Unknown logic, but no live provider result has been verified with an owner key.

The URL check uses existing reports. It does not submit a new scan or inspect redirect destinations. Low Risk is not a safety guarantee.
