# Name Picker Party

A random student picker for the classroom, made to be shown on a projector. Six mini-games, each with its own reveal and twist.

## How to play

Open `GoiTenVuiNhon/index.html` in Chrome or Edge, or use the GitHub Pages link. Add your class with the yellow class button, pick a game at the top, then press **▶ Pick a name!** or Space.

| Game | How it works | Twist |
|---|---|---|
| 01 Duck Slide Race | Ten ducks slide down a chute and race to the golden buoy. | Shiny button and whirlpool, a big wave, a waterspout, or the red buoy mix-up. |
| 02 Mischievous Dino Eggs | Eggs wobble, hop and crack; the last to hatch is picked. | The first egg holds a rubber chicken; mama dino rolls the real egg into the winning nest. |
| 03 Rebellious Cauldron | Magic orbs with students' faces circle the cauldron. | The golden orb turns into soap bubbles; the frog grabs the wand and points at the real winner. |
| 04 Dragon Treasure Guard | Treasure chests hop and swap places; the dragon sniffs and opens one. | The first chest has a rubber duck; the dragon sneezes and the real chest slides out. |
| 05 Faulty Robot Factory | Robots ride a conveyor under a scanner. | The stamp hits the wrong robot; the belt reverses and carries the last robot to the charger. |
| 06 Haunted Hotel Lift | Lift doors flash room symbols, then ghostly footprints lead the way. | A ghost holds a fake symbol; the skeleton janitor spins the signpost. |

Rounds last 7 or 10 seconds. Plot Twist is off by default; when enabled, the twist takes 35% of the round. The winner is always chosen the moment you press Pick.

Class lists stay in the browser; use **Export backup** on the class page to keep a copy.

## Folders

- `GoiTenVuiNhon/` – the game: `index.html` (shell and game 01), `games/` (games 02–06, effects, scenes), `assets/` (sprites, bursts, sounds).
- `vIOTJ/` – original sprite sheets.


## Sound effects

Game-specific MP3 effects load only for the selected game and use the existing Sound toggle and SFX volume. Credits and edit details are in `assets/sfx/credits.html` and `assets/sfx/sources.json`.

Run the dependency-free audio lifecycle checks with `node GoiTenVuiNhon/tests/sfx.test.cjs`.

Each game streams its own Kevin MacLeod BGM from `assets/bgm/` after a user gesture. Music credits and CC BY 4.0 sources are in `assets/bgm/credits.html`. Short action/result jingles retain VCSL samples; foreground effects briefly lower the music.

Regression checks: `node GoiTenVuiNhon/tests/core.test.cjs` and `node GoiTenVuiNhon/tests/sw.test.cjs`. A BGM becomes available offline after that game’s track has loaded once.

## Build and loading

Run `npm ci` then `npm run build` after editing HTML, game source, the service worker or assets. Commit the generated `games/dist/` files and `sw.js` together. `npm run check:build` checks that generated files and cache hashes match the source.

The page loads one minified shared runtime; each game module loads when selected and can retry after a network error. Visited games remain available offline after their resources have been cached. A game not visited online yet needs a connection for its first load.

Media cache versions depend on asset contents, so code-only updates retain images, music and fonts. An asset change creates a fresh media cache. The supplied logo uses lossless WebP; fonts are the same Google Fonts files hosted locally, with their OFL licenses in `assets/fonts/`.
