# Flippin Deals

Touchscreen memory-tile game mockup for the Black Friday live commerce activation
("Concept 3 – Black Friday Flippin Deals").

Players flip two tiles; a matching pair of products unlocks that product's Black Friday
offer. Single "surprise" tiles trigger a challenge, giveaway or reward.

## Run

Open `index.html` in a browser. It is a single self-contained file: no build step,
no server and no external assets.

## Controls

- **Settings** (sliders button, top right): opens the admin panel. On the start screen it needs a
  1-second press-and-hold; in the game it is a single tap.
- **Reset** (circular arrow): flip all tiles back, reshuffle a new round, or return to the start screen.
- **Fullscreen** (corner brackets).

Add `#admin` to the URL to open straight into the admin panel.

## Admin panel

- Layout: tiles across/down, surprise count, board size, tile width, gap, corner rounding, frame colour.
- Tile backs: symbol, alternate label and its frequency, three tile colours, logo upload.
- Behaviour: flip speed, mismatch time, "already opened" tile colour, auto-close pop-ups,
  sound, confetti, counters, kiosk lock (press-and-hold for reset and settings).
- Content: products (name, offer, detail line, icon or image), surprise cards, titles.
- Export / import settings as JSON to move a configuration between devices.

Settings are stored in the browser's `localStorage` on the device where they are made.

## Status

Mockup. All offers are placeholders ("XX% OFF"), and product names, icons and surprise
mechanics are examples to be replaced with the real content.
