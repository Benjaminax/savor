# Savor

A framework-free, static mobile-first prototype for discovering and reserving discounted surplus food from local shops.

## Run locally

Open `index.html` in a modern browser. No install, build command, server, or dependencies are required. All demo interactions run client-side; user data and sample reservation state are kept in the browser's local storage.

Use `?demo=1` to reveal the optional screen/state jump bar. Use `?error=1` to simulate a network failure on the first Home load; Retry removes the simulation flag and reloads the local listings. The Profile screen also has a persistent offline simulation toggle.

## Deploy to Vercel

1. Import this repository into Vercel, or run `vercel` from the repository root.
2. Select **Other** as the framework preset (no framework).
3. Leave the build command empty.
4. Set the output directory to `.` (the repository root).
5. Deploy. Vercel serves `index.html` and its adjacent `styles.css` and `app.js` as a static site.

The Android wrapper uses its own static files in `app/src/main/assets/`; those assets mirror the root web files.

## Scope

This is a front-end UX demonstration, not a production account, inventory, reservation, payment, or notification service. See [CASE_STUDY.md](./CASE_STUDY.md) for the user journey, navigation, state coverage and implementation boundaries.
