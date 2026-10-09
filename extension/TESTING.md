# Validation

- 11 Node core tests passed (`node --test tests.mjs`).
- QR decoder correctly read a generated PNG containing `https://example.com`.
- DOM workflow tests passed with mocked Chrome storage and API responses: missing-key setup, save/remove key, low-risk rendering, clearing outdated results, rate-limit errors, disabled-state recovery and tab switching.
- JavaScript syntax validation passed.
- No live API request was made: no personal key was supplied.
- Full Chrome loading and visual screenshot verification remain untested in this environment because browser installation failed. Perform the install steps in README.md and confirm the popup, QR upload and a real API check on your computer.

## Version 1.1.0 — live camera

Four camera controller tests passed: successful decoding and automatic track cleanup; denied permission; cancellation while permission is pending; duplicate-start prevention and manual stop. All 11 existing core tests still pass. Camera tests use simulated media objects; a physical laptop camera and Chrome’s extension permission prompt still need testing on the user’s computer.

Version 1.2.0: all 15 core/camera tests pass. Static checks confirm the QR flow contains no tab-opening call. Camera preview is now inside the toolbar popup, with compact layout and collapsible upload fallback. Actual Chrome popup permission behavior and physical-camera scanning require laptop verification.

1.2.1: Added explicit camera-permission setup window and blocked-permission recovery instructions. Syntax and existing 15 tests pass. Real Chrome permission UI and physical camera remain unverified here.
