# Flippin Deals

Touchscreen memory-tile game for the Black Friday live commerce activation
("Concept 3 – Black Friday Flippin Deals").

Players flip two tiles; a matching pair of products unlocks that product's Black Friday
offer. Single "surprise" tiles trigger a challenge, giveaway or reward.

## Run

There are two ways to run it.

**With the control server (remote admin).** Every screen that opens the page shares one set
of settings, and the admin panel on any device controls all of them live.

```
docker compose up -d --build
```

or, without Docker (Node 18 or newer, no dependencies to install):

```
node server.js
```

- Game: `http://<host>:8080/` (no options on this page)
- Admin page: `http://<host>:8080/admin` (all options, with a preview board)
- Settings are stored in `/data/config.json` (a Docker volume), so they survive restarts.
- `PORT` and `DATA_DIR` environment variables change the port and the storage folder.

The server has **no login**: anyone who can reach the address can open the admin panel and
change the game. Keep it on a private network, or put it behind something that restricts access.

**As a single file.** Open `index.html` directly in a browser to play. With no server, the
options are at `index.html#admin` and stay on that one device.

## Remote control

When served by `server.js`:

- Any settings change made in any admin panel is saved on the server and pushed to every
  open screen as it is made, including while typing or dragging a slider.
- Styling, colours, tile symbols, logos, product names, offers, images and surprise text are
  applied in place: the round in progress is not disturbed and open tiles stay open.
- Only changing the grid (tiles across, tiles down, surprise count) or adding / deleting a
  product or surprise deals a new board on every screen.
- Every screen deals the same board: the tile layout comes from a seed stored with the
  settings, so the admin preview always matches the game screens. A reshuffle (from the admin
  page, a screen's reset menu, or "Play again") gives every screen the same new layout.
  Which tiles are open is not shared; each screen tracks its own play.
- The admin page's round buttons act on every screen: flip all tiles back, reshuffle a new
  round, peek on all screens, back to start screen, start the game.
- "Show answers here only" turns the admin preview face-up as a host cheat sheet. Game
  screens are not affected.
- "Flip all tiles back" and "Back to start screen" in a screen's own reset menu only affect
  that screen.
- Audio: sound effects on/off and volume are shared settings. Each screen plays through its
  own speakers after its first touch; the admin page stays silent apart from its test button.
- The admin header shows how many devices are connected. Screens reconnect on their own and
  pick up the current settings if the server restarts.

Endpoints: `GET /api/state`, `PUT /api/config`, `POST /api/command`, `GET /api/events`
(server-sent events), `GET /healthz`.

## Controls

- **Reset** (circular arrow): flip all tiles back, reshuffle a new round, or return to the start screen.
- **Fullscreen** (corner brackets).
- **Hide the top buttons**: tap the game title (or the small heading above it) to hide or show
  the three buttons. The state is remembered on that device.

The game page has no settings button. All options are on the admin page.

## Admin panel

- Layout: tiles across/down, surprise count, frame colour. The grid is always exactly as set;
  the app has no rotation setting and relies on the screen's own rotation.
- Screen & scaling: board size and vertical position, text size on tiles, and interface /
  admin panel scale (automatic by default, sized for screens up to vertical 4K, 2160 × 3840).
- Tiles: tile width, gap, corner rounding.
- Tile backs: symbol, alternate label and its frequency, three tile colours, logo upload.
- Behaviour: flip speed, mismatch time, "already opened" tile colour, auto-close pop-ups,
  sound, confetti, counters, kiosk lock (press-and-hold for the reset button).
- Content: products (name, offer, detail line, icon or image), surprise cards, titles.
- Export / import settings as JSON to move a configuration between devices.

Settings are stored in the browser's `localStorage` on the device where they are made.

## Status

All offers are placeholders ("XX% OFF"), and product names, icons and surprise
mechanics are examples to be replaced with the real content.
