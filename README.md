# Flippin Deals – standalone fork (Vercel)

This branch is a fork of the `main` build for static hosting such as Vercel. It is the same
touchscreen memory-tile game, with one difference: there is no server, so the admin panel
lives inside the game page.

- **Settings button** (sliders icon, top right of the start screen and of the game header):
  press and hold for 1 second to open the admin panel. A short tap only shows a hint.
- **Done** closes the panel. Tapping the game title hides or shows the header buttons.
- Everything is stored in the browser of the device it runs on: settings, high scores and
  the event log (last 300 events). Use Export / Import settings to copy a setup to another device.
- There is no remote control and no `/admin` address. For one admin page driving several
  screens, use the `main` branch with `server.js` and Docker.

## Deploy

`index.html` is the whole app: no build step, no dependencies, no environment variables.
On Vercel use the "Other" framework preset with no build command and the repository root
as the output directory, and point the project at this `vercel` branch.

## Keeping the fork up to date

The fork is generated from the `main` source by applying a fixed set of changes (settings
buttons, Done button, single-device wording, no server connection). After `main` changes,
regenerate this branch's `index.html` the same way rather than editing it by hand.

## Status

All offers are placeholders ("XX% OFF"), and product names, icons and surprise mechanics are
examples to be replaced with the real content.
