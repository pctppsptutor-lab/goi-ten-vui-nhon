// Game 04 — Rồng giữ kho báu
// Ten treasure chests stand for ten students; they hop and swap places, the dragon sniffs around and opens one.
// Twist: the first chest only holds a rubber duck; the dragon sneezes and the real winning chest slides out of the gold.
(() => {
  const SLABS = [[537, 486], [720, 486], [907, 486], [1084, 486], [337, 532], [1256, 532], [427, 610], [671, 610], [929, 610], [1171, 610]];
  const STAGE = [800, 790], CHEST_W = 128, SWAP = .55;

  // replay swaps up to time t: returns {x, y, lift} for each player
  function layout(r, t) {
    const slot = r.players.map(p => p.slot0), out = new Map();
    let moving = null;
    for (const s of r.swaps) {
      if (t >= s.at + SWAP) { const a = slot[s.a]; slot[s.a] = slot[s.b]; slot[s.b] = a; }
      else if (t >= s.at) moving = s;
    }
    r.players.forEach((p, i) => {
      let [x, y] = SLABS[slot[i]], lift = 0;
      if (moving && (i === moving.a || i === moving.b)) {
        const other = i === moving.a ? moving.b : moving.a, k = ease((t - moving.at) / SWAP);
        const [x2, y2] = SLABS[slot[other]];
        x = lerp(x, x2, k); y = lerp(y, y2, k); lift = Math.sin(k * Math.PI) * (i === moving.a ? 90 : 40);
      }
      out.set(p, { x, y, lift });
    });
    return out;
  }

  GAME_IMPL.g4 = {
    id: 'g4', title: 'Dragon Treasure Guard', base: 'assets/g4/', titleY: 330,
    assets: gAssets(['twist', 'win'], ['dragon_01', 'dragon_02', 'dragon_03', 'dragon_04', 'dragon_05', 'dragon_06', 'dragon_07',
      'chest_01', 'chest_02', 'chest_03', 'chest_04', 'chest_05', 'chest_06', 'chest_07', 'chest_08', 'chest_09', 'chest_10',
      'rubber_duck', 'gold_coins', 'sneeze_smoke', 'winner_spotlight']),
    startBanner: '💰 The treasure chests hop and swap places!', mote: '#ffe08a', rayColor: '#ffe08a',

    setup(r) {
      const slots = spread(r.players.length);
      r.players.forEach((p, i) => { p.i = i; p.slot0 = slots[i]; p.chest = 'chest_' + String(i % 10 + 1).padStart(2, '0'); });
      r.swaps = [];
      const n = r.players.length;
      if (n > 1) for (let at = .8; at < r.TW - .9; at += .75) {
        const a = randInt(n); let b = randInt(n - 1); if (b >= a) b++;
        r.swaps.push({ at, a, b });
      }
      r.fakes = makeFakes(r, 1.4);
      r.final = layout(r, r.TW);
    },

    // where the dragon stands, and in which pose
    dragon(r, rt, te, f) {
      const done = r.phase === 'done', hop = Math.abs(Math.sin(rt * 6.5)) * 28;
      if (done) return { x: STAGE[0] + 250, y: STAGE[1] + 10 - Math.abs(Math.sin(rt * 5)) * 14, pose: 'dragon_07' };
      const at = p => { const o = r.final.get(p); return { x: o.x + 120, y: o.y + 70 }; };
      if (te >= 0) {
        const D = r.decoy, Wn = r.winner;
        if (r.plain) {
          if (te < 1) return { ...at(D || Wn), pose: te < .8 ? 'dragon_02' : 'dragon_01' };
          const o = at(Wn); return { ...o, pose: te < 1.3 ? 'dragon_04' : 'dragon_01' };
        }
        if (te < 1.1) return { ...at(D), pose: te < .6 ? 'dragon_03' : 'dragon_01' };
        if (te < 1.6) return { ...at(D), pose: 'dragon_05' };
        return { ...at(D), pose: 'dragon_06' };
      }
      if (f) { const o = layout(r, rt).get(f.p); return { x: o.x + 115, y: o.y + 65 - hop * .6, pose: Math.floor(rt * 6) % 2 ? 'dragon_02' : 'dragon_03', flip: o.x > 800 }; }
      const px = 800 + Math.sin(rt * 1.35) * 540, py = 745 + Math.cos(rt * 2.1) * 55 - hop;
      const poses = ['dragon_01', 'dragon_02', 'dragon_04', 'dragon_02'];
      return { x: px, y: py, pose: poses[Math.floor(rt * 3.8) % 4], flip: Math.cos(rt * 1.35) < 0 };
    },

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner;
      if (f && te < 0) cue('fk' + f.at, () => { r.banner = '🐉 The dragon sniffs ' + f.p.name + "'s chest…"; SFX.leader(); const o = layout(r, t).get(f.p); FX.smoke(o.x + 70, o.y - 60, 4, '#f2e8d8'); });
      for (const s of r.swaps) if (t > s.at && te < 0) cue('sw' + s.at, () => SFX.tone(500, .12, { type: 'triangle', vol: .08, to: 900 }));
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '🐉 The dragon opens ' + D.name + "'s chest!"; });
        if (te > .6) cue('b', () => { const o = r.final.get(D); FX.glitter(o.x, o.y - 60, 10, ['#fff3a0']); outcome('wrong_turn', D); SFX.quack(0, 2.2); SFX.quack(.2, 2.5); SFX.sadTrombone(); r.banner = '🦆 Huh! Only a rubber duck inside!'; });
        if (te > 1.1) cue('c', () => { SFX.noise(.25, { vol: .2, f: 400, to: 1800, q: 1 }); SFX.noise(.5, { vol: .35, f: 2500, to: 500, q: .7, delay: .3 }); r.banner = '🤧 Ah… ah… CHOO!'; CAM.shake(r, 18); const o = r.final.get(D); FX.smoke(o.x - 20, o.y - 90, 16, '#f6f0e6'); FX.coins(1440, 440, 22, 640); FX.coins(180, 430, 22, 640); FX.coins(o.x, o.y - 40, 14, o.y + 20); });
        if (te > 1.5) cue('d', () => { outcome('selected', Wn); SFX.wheee(); r.banner = '✨ A chest slides out of the gold pile!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🐉 The dragon sniffs ' + (D || Wn).name + "'s chest…"; });
        if (te > .8) cue('b', () => { SFX.boing(); r.banner = '🙅 …not this one!'; });
        if (te > 1.1) cue('c', () => { outcome('selected', Wn); SFX.sparkle(); r.banner = '🐉 The dragon has chosen a chest!'; });
      }
      if (te > 2.7) cue('open', () => { SFX.sparkle(); SFX.pop(); FX.coins(STAGE[0], STAGE[1] - 60, 16, STAGE[1] + 10); FX.sparkle(STAGE[0], STAGE[1] - 70, 30); });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner;
      const lay = te < 0 ? layout(r, rt) : r.final, slide = r.plain ? 1.3 : 1.5;
      if (!r.plain && te > 1.1 && !done) {    // coins scattered by the sneeze
        const k = clamp((te - 1.1) / 1.2);
        drawImg('gold_coins', 1440, 470 - k * 40, 200, { alpha: 1 - k * .6 });
        drawImg('gold_coins', 180, 460 - k * 50, 180, { alpha: 1 - k * .6 });
      }
      if (te > slide || done) drawImg('winner_spotlight', STAGE[0], STAGE[1] + 10, 260, { anchor: 'bottom', alpha: .8 });
      // dragon goes behind the chests so name tags stay readable
      const dg = this.dragon(r, rt, te, f);
      drawImg(dg.pose, dg.x, dg.y - 40, 210, { anchor: 'bottom', flip: dg.flip });
      if (!r.plain && te > 1.1 && te < 2.2) drawImg('sneeze_smoke', dg.x - 150, dg.y - 160, 220 * clamp((te - 1.1) / .3), { alpha: 1 - clamp((te - 1.7) / .5) });
      const order = [...r.players].sort((a, b) => lay.get(a).y - lay.get(b).y);
      for (const p of order) {
        let { x, y, lift } = lay.get(p), wiggle = 0, chest = true;
        if (p === Wn && (te > slide || done)) continue;
        if (f && f.p === p && te < 0) wiggle = Math.sin(rt * 30) * .1;
        if (te > 0 && te < (r.plain ? .8 : .6) && p === (D || Wn)) wiggle = Math.sin(rt * 34) * .12;
        if (p === D && !r.plain && te > .6) {          // opened: rubber duck
          const k = clamp((te - .6) / .3);
          charImg(p.av, 'twist', x, y + 14, 150);
          drawImg('rubber_duck', x + 40, y - 120 - k * 30 - Math.abs(Math.sin(rt * 6)) * 10, 70, { anchor: 'bottom' });
          chest = false;
        }
        if (chest) drawImg(p.chest, x, y + 14 - lift, CHEST_W, { anchor: 'bottom', rot: wiggle });
        p.x = x; p.y = y - 30;
        tagC(p.name, x, y + 34 - lift, (f && f.p === p && te < 0));
      }
      // winning chest sliding out to the front
      if (!done && te > slide) {
        const o = r.final.get(Wn), k = ease(clamp((te - slide) / 1)), x = lerp(o.x, STAGE[0], k), y = lerp(o.y, STAGE[1], k);
        Wn.x = x; Wn.y = y - 40;
        FX.every(r, 'slide', .08, () => FX.glitter(x + (Math.random() - .5) * 120, y - 60, 1));
        if (te < 2.7) drawImg(Wn.chest, x, y, CHEST_W * (1 + k * .4), { anchor: 'bottom', rot: Math.sin(rt * 20) * .04 * (1 - k) });
        else charImg(Wn.av, 'win', x, y + 10, 220);
        tagC(Wn.name, x, y + 30, true);
      }
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', STAGE[0], STAGE[1] + 10, 260 * (.6 + .4 * ease(k)));
        tagC(Wn.name, STAGE[0], STAGE[1] + 34, true);
      }
    },

    idle(t) {
      SLABS.forEach(([x, y], i) => drawImg('chest_' + String(i + 1).padStart(2, '0'), x, y + 14 - Math.abs(Math.sin(t * 2 + i)) * 6, CHEST_W, { anchor: 'bottom' }));
      const hop = Math.abs(Math.sin(t * 6)) * 24, poses = ['dragon_01', 'dragon_02', 'dragon_04', 'dragon_02'];
      drawImg(poses[Math.floor(t * 3.5) % 4], 800 + Math.sin(t * 1.25) * 520, 755 + Math.cos(t * 1.9) * 45 - hop, 230, { anchor: 'bottom', flip: Math.cos(t * 1.25) < 0 });
    },
    onFinish() { FX.coins(STAGE[0], STAGE[1] - 120, 36, STAGE[1] + 20); },
    winBanner: r => '💎 The treasure belongs to ' + r.winner.name + '!',
    winPos: () => ({ x: STAGE[0], y: STAGE[1] - 130 })
  };
})();
