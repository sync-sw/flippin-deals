# Flippin Deals

Touchscreen memory-tile game for the Black Friday live commerce activation
("Concept 3 – Black Friday Flippin Deals").

Players flip two tiles; a matching pair of products unlocks that product's Black Friday
offer. Single "surprise" tiles trigger a challenge, giveaway or reward.

## Two games

"Tap to play" on the start screen leads to a choice of game. The start screen is always a
portrait 9:16 artboard, fitted whole to the screen.

- **Matching Game #1**: flip two tiles to find pairs; a pair unlocks that product's offer.
  Layout, tiles, products, surprises, scores and names all apply to this game.
- **Matching Game #2**: the same matching rules on the supplied artwork, 20 lettered tiles
  (A–T, five rows) hiding 10 designs, two of each.
  - Flip two letters. A matching pair stays open with a green tick; a wrong pair flips back.
  - The two "Better luck next time" tiles are never a pair: each one shows its pop-up the
    moment it is flipped and stays open. Picked second, it ends the turn and the first
    tile flips back.
  - Admin options: pop-up on a match (on/off), pop-up on a "Better luck" tile (on/off),
    shuffle the designs (off = the artwork's order), and "tiles must be matched in pairs"
    (off = every tile simply reveals when tapped, the earlier Reveal game).
  - A finished tile can be tapped again to bring its pop-up back, if that pop-up is on.
  - There is no end dialog and no score: when every pair is found the board stays as it
    is until the round is restarted by hand (reset menu or admin panel).

Extra rows for game #2: the admin panel can add up to four rows below the artwork's own
tiles. The outside of each extra tile is the next letter (U, V, W, X, then Y…), typeset to
match. The inside is an uploaded picture (a square PNG works best), with a name and a type
(prize, giveaway, challenge or better luck). Two extra tiles with the same picture form a
pair; an extra tile with no partner acts at once, like a "Better luck" tile. Extra rows
shrink every tile so the board still fits. Pictures are stored with the settings.

The chosen game is a shared setting: with the control server, every screen and the admin
preview switch together, and the admin page can switch games too. Internally game #2 is
still called `reveal` in the settings and the log.

The artwork is embedded in `index.html` and comes from the designer's Illustrator file
(`cards_1.ai`, the 26 Nov version): vector tiles with live text, a transparent logo and the
gradient background. All game text and the tile lettering use the supplied Samsung SS Head
Bold font, also embedded; the admin panel uses the system font. Neither source file is
stored in this repository. The tile count, the order of the designs and their positions are
read from the Illustrator file when the page is built.

The admin panel lists only the settings of the selected game; switching game in the panel
switches the list.

Tapping the top-left corner of the home screen, the game picker or game #2 hides or shows
the top buttons; in game #1 the same is done by tapping the title.

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

**Standalone (static hosting such as Vercel, or the file opened directly).** There is no
server, so the options panel is inside the game page: press and hold the settings button
(sliders icon, top right of the game header) for 1 second. The button appears once a game
has been chosen; the start screen and the game picker only have the full-screen button. "Done"
closes it. Settings, high scores and the event log stay in that device's browser, and there
is no remote control. Deploying is just serving `index.html`; `server.js` is not used.

The page decides which way to run by itself: `server.js` marks the pages it serves, and a
page without that mark runs standalone.

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
  round, "Peek: all screens", back to start screen, start the game.
- "Peek: admin only" flips the admin preview face-up for three seconds; game screens are not
  affected. "Peek: all screens" does the same on every screen.
- "Flip all tiles back" and "Back to start screen" in a screen's own reset menu only affect
  that screen.
- Audio: sound effects on/off and volume are shared settings. Each screen plays through its
  own speakers after its first touch; the admin page stays silent apart from its test button.
- The admin header shows how many devices are connected. Screens reconnect on their own and
  pick up the current settings if the server restarts.

- A surprise tile picked as the second tile of a turn ends that turn: the first tile flips back.

## High scores and event log

Both are on the admin page and are stored on the server (`scores.json`, `log.json` in the data
folder), so they survive restarts.

- **High scores**: a score is recorded each time a game screen clears the board (turns, time,
  layout, screen). The best for a layout is the fewest turns, then the fastest time. Rounds
  played on the admin preview are not scored.
- **Player names**: after clearing the board the player can enter a name on an on-screen
  keyboard, or skip. Skipping, starting a new round, a reset or leaving the page saves the
  score without a name. The prompt can be switched off on the admin page.
- **Event log**: every screen reports taps, ignored taps and the reason, matches, mismatches,
  surprises, pop-ups, reshuffles, settings updates, connections and script errors. The server
  keeps the last 2,000 events. The log can be filtered, downloaded as text, or cleared.

Endpoints: `GET /api/state`, `PUT /api/config`, `POST /api/command`, `GET /api/events`
(server-sent events), `GET|POST|DELETE /api/log`, `GET|DELETE /api/scores`, `POST /api/score`,
`GET /healthz`.

## Controls

- **Reset** (circular arrow): flip all tiles back, reshuffle a new round, or return to the start screen.
- **Fullscreen** (corner brackets).
- **Hide the top buttons**: tap the game title (or the small heading above it) to hide or show
  the three buttons. The state is remembered on that device.

With the control server, the game page has no settings button and all options are on the
admin page. Standalone, the settings button (1-second hold) opens them in the game page.

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
