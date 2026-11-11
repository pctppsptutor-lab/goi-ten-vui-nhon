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

About one round in four has no twist: the winner is revealed after a near-miss. The winner is always chosen the moment you press Pick.

Class lists stay in the browser; use **Export backup** on the class page to keep a copy.

## Folders

- `GoiTenVuiNhon/` – the game: `index.html` (shell and game 01), `games/` (games 02–06, effects, scenes), `assets/` (sprites, bursts, sounds).
- `vIOTJ/` – original sprite sheets.


## Sound effects

Game-specific MP3 effects load only for the selected game and use the existing Sound toggle and SFX volume. Credits and edit details are in `assets/sfx/credits.html` and `assets/sfx/sources.json`.

Run the dependency-free audio lifecycle checks with `node GoiTenVuiNhon/tests/sfx.test.cjs`.
