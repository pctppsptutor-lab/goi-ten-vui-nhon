# Name Picker Party — 30 games

Public URL (unchanged): https://pctppsptutor-lab.github.io/goi-ten-vui-nhon/GoiTenVuiNhon/

All 30 games run in one app. Vol 1–5 are groups of six games. Switching groups, the catalog and random selection stay in the same document. Direct links use `?game=g7`; `cls` and hashes are preserved. Back/Forward restores the selected game.

## Development

Run `npm ci`, `npm run build`, `npm run check:build` and `npm test` from this repository root. Commit generated `GoiTenVuiNhon/games/dist/` files and `sw.js` with source changes. Serve the repository over HTTP for browser testing.

The shared runtime contains localization, audio profiles and canvas effects. Game modules and scene packs load on demand. The duck game initially needs only its decoration pack. Three recent games retain decoded sprites; other games reload from disk/network cache when revisited.

Each game has an independent media cache version. Fonts, logo and shared SFX use a shared cache; shell/scripts have a separate version. Text line endings are normalized for matching Windows/Linux builds.

Unvisited games require an online first load. Offline play requires the chosen game's resources to have been cached by the service worker. Let installation and resource loading finish before going offline.

## Compatibility

Class lists, history and settings retain the `goiTenVuiNhon.v1` localStorage key and existing shape. Settings `game`, `game2` through `game5` remain; `currentGame` remembers the last selection. Tabs keep independent games while classes/history synchronize.

The four legacy Vol repositories redirect here, preserving game, class and hash parameters. Their workers leave open editors and rounds intact until the next navigation. Previous source/assets remain during transition for rollback.

Keep the root redirect and `GoiTenVuiNhon/` name unchanged. The original PWA start URL and identity remain `GoiTenVuiNhon/index.html`.

## Attribution

Original sprite bytes/dimensions are preserved; shared paths were checked for identical content. The logo is lossless WebP. Fonts retain OFL licenses in `assets/fonts/`.

Each game retains its Kevin MacLeod BGM (CC BY 4.0), jingles and SFX. Combined credits are in `GoiTenVuiNhon/assets/bgm/credits.html` and `GoiTenVuiNhon/assets/sfx/credits.html`. Original pages remain as `credits-vol1.html` through `credits-vol5.html`; `sources.json` retains all source-record sets.

## Release order

Publish and verify the main app before publishing legacy redirects. Check fresh/returning visitors, saved classes/history, direct links and offline cached games. Prior commits provide rollback versions. LocalStorage is preserved.
