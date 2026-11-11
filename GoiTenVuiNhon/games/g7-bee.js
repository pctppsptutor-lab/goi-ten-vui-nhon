// Game 07 — Achoo, Bee!
// Ten gardeners stand by their own flowers; the bee checks the flowers one by one and lands on the chosen one.
// Twist: the first flower sneezes pollen, blowing the bee across the garden straight onto the real winning flower.
(() => {
  const SPOTS = [[424, 354], [624, 354], [824, 354], [1024, 354], [1224, 354], [290, 736], [530, 736], [770, 736], [1010, 736], [1250, 736]];
  const FLOWERS = ['p9', 'p10', 'p11', 'p14', 'p15', 'p16', 'p17', 'p18', 'p19', 'p20'];
  const STAGE = [1440, 470], HIVE = [1460, 150];
  const kidH = y => y < 500 ? 120 : 150;
  const flowerAt = p => [p.sx + 30, p.sy - 8];           // the flower stands right of its gardener
  const top = p => { const [x, y] = flowerAt(p); return [x, y - (p.sy < 500 ? 70 : 85)]; };

  // where the bee is at time t
  function bee(r, t) {
    const te = t - r.TW;
    if (te < 0) {
      // visit each fake in turn; between visits it drifts in loops
      const f = activeFake(r, t);
      if (f) { const [x, y] = top(f.p), k = clamp((t - f.at) / .35); return lerpP(r.lastBee || HIVE, [x, y - 20 + Math.sin(t * 9) * 6], ease(k)); }
      return [800 + Math.sin(t * .9) * 520, 230 + Math.sin(t * 1.7) * 110];
    }
    const D = r.decoy, Wn = r.winner;
    if (r.plain) {
      if (te < 1.2) return lerpP(r.atTW, [top(D || Wn)[0], top(D || Wn)[1] - 20 + Math.sin(t * 9) * 6], ease(clamp(te / .5)));
      return arcP([top(D || Wn)[0], top(D || Wn)[1] - 20], top(Wn), ease(clamp((te - 1.2) / 1.2)), 120);
    }
    if (te < .9) return lerpP(r.atTW, [top(D)[0], top(D)[1] - 14 + Math.sin(t * 9) * 4], ease(clamp(te / .5)));
    if (te < 2.4) { const k = clamp((te - .9) / 1.5); return arcP(top(D), top(Wn), 1 - Math.pow(1 - k, 2.2), 260); }
    return top(Wn);
  }
  const lerpP = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const arcP = (a, b, k, lift) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * lift];

  GAME_IMPL.g7 = {
    id: 'g7', title: 'Achoo, Bee!', base: 'assets/g7/', titleY: 560,
    assets: gAssets(['idle', 'ready', 'almost', 'fake', 'twist', 'win'], [...FLOWERS, 'p0', 'p2', 'p3', 'p5', 'p6', 'p24', 'p25', 'p26', 'p37']),
    startBanner: '🐝 The bee buzzes out of the hive!', mote: '#fff6c8', rayColor: '#fff2a8',

    setup(r) {
      const slots = spread(r.players.length);
      r.players.forEach((p, i) => { [p.sx, p.sy] = SPOTS[slots[i]]; p.flower = FLOWERS[slots[i]]; p.x = p.sx; p.y = p.sy - 40; });
      r.fakes = makeFakes(r, 1.2);
      r.atTW = bee(r, 0);
      // the sneeze always throws the bee to the other side of the garden
      if (!r.plain && r.decoy) {
        const far = r.players.filter(p => p !== r.winner && Math.abs(p.sx - r.winner.sx) > 300);
        if (Math.abs(r.decoy.sx - r.winner.sx) < 300 && far.length) r.decoy = far[randInt(far.length)];
      }
    },

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner;
      if (te < 0) { r.lastBee = bee(r, t); r.atTW = r.lastBee; }
      if (f && te < 0) cue('fk' + f.at, () => { r.banner = '🐝 The bee checks ' + f.p.name + "'s flower…"; SFX.leader(); FX.glitter(...top(f.p), 5); });

      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '🐝 The bee lands on ' + D.name + "'s flower!"; });
        if (te > .7) cue('b', () => { outcome('wrong_turn', D); CAM.shake(r, 12);
          FX.glitter(...top(D), 30, ['#ffe066', '#fff3a0']); r.banner = '🤧 Ah-CHOO! The flower sneezes pollen!'; });
        if (te > 1) cue('c', () => { SFX.wheee(); SFX.swoosh(); r.banner = '💨 The bee is blown across the garden…'; });
        if (te > 2.3) cue('d', () => { outcome('selected', Wn); SFX.pop(); r.banner = '🌼 …and lands on ' + Wn.name + "'s flower!"; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🐝 Is it ' + (D || Wn).name + "'s flower?"; });
        if (D && te > 1.2) cue('b', () => { SFX.boing(); r.banner = '🙅 Not quite — off it buzzes again…'; });
        if (te > 2.3) cue('d', () => { outcome('selected', Wn); SFX.pop(); r.banner = '🌼 The bee chooses ' + Wn.name + '!'; });
      }
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner;
      drawImg('p37', STAGE[0], STAGE[1] - 70, 110, { alpha: .9 + .1 * Math.sin(rt * 3) });
      const order = [...r.players].sort((a, b) => a.sy - b.sy);
      for (const p of order) {
        if (done && p === Wn) continue;
        const [fx, fy] = flowerAt(p), h = kidH(p.sy);
        const teased = (f && f.p === p && te < 0) || (te > 0 && p === (r.plain ? D || Wn : D) && te < (r.plain ? 1.2 : .7));
        let pose = rt < 1 ? 'ready' : 'idle';
        if (teased) pose = 'almost';
        if (p === D && !r.plain && te > .7) pose = 'twist';
        if (p === Wn && te > 2.3) pose = 'fake';
        const sneeze = p === D && !r.plain && te > .6 && te < 1.1 ? 1 + Math.sin((te - .6) * 30) * .12 : 1;
        drawImg(p.flower, fx, fy, (h * .55) * sneeze, { anchor: 'bottom', rot: Math.sin(rt * 2 + p.seed * 9) * .05 });
        charImg(p.av, pose, p.sx - 28, p.sy, h);
        tagC(p.name, p.sx, p.sy + 22, teased);
      }
      // pollen cloud and wind gust during the sneeze
      if (!r.plain && D && te > .6 && te < 2 && !done) {
        const [x, y] = top(D), k = clamp((te - .6) / 1.2), dir = Math.sign(Wn.sx - D.sx) || 1;
        drawImg(k < .4 ? 'p24' : 'p25', x + dir * 40 * k, y - 10, 150 + k * 120, { alpha: 1 - k });
        drawImg('p26', x + dir * (80 + k * 260), y - 40, 220, { alpha: Math.sin(k * Math.PI) * .9, flip: dir < 0 });
        FX.every(r, 'petal', .06, () => FX.glitter(x + dir * k * 300, y, 2, ['#ffe066', '#fff3a0']));
      }
      // the bee
      if (!done) {
        const [bx, by] = bee(r, rt);
        let pose = 'p2';
        if (te > 0 && te < .7) pose = 'p0';
        if (!r.plain && te > .7 && te < 2.3) pose = 'p3';
        if (te > 2.3 || (r.plain && te > 2.2)) pose = 'p5';
        const spin = !r.plain && te > .9 && te < 2.3 ? (te - .9) * 9 : 0;
        drawImg(pose, bx, by + Math.sin(rt * 14) * 3, 92, { rot: spin, flip: Math.cos(rt * .9) < 0 && te < 0 });
        Wn.x = bx; Wn.y = by;
      }
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', STAGE[0], STAGE[1] + 16, 220 * (.6 + .4 * ease(k)));
        drawImg('p5', STAGE[0] + Math.cos(rt * 3) * 110, STAGE[1] - 150 + Math.sin(rt * 6) * 18, 86, { flip: Math.sin(rt * 3) > 0 });
        tagC(Wn.name, STAGE[0], STAGE[1] + 48, true);
      }
    },

    idle(t) {
      drawImg('p37', STAGE[0], STAGE[1] - 70, 110);
      SPOTS.forEach(([x, y], i) => { const h = kidH(y); drawImg(FLOWERS[i], x + 30, y - 8, h * .55, { anchor: 'bottom', rot: Math.sin(t * 2 + i) * .05 }); charImg(i, 'idle', x - 28, y, h); });
      drawImg('p2', 800 + Math.sin(t * .9) * 520, 230 + Math.sin(t * 1.7) * 110 + Math.sin(t * 14) * 3, 92, { flip: Math.cos(t * .9) < 0 });
    },
    onFinish() { FX.glitter(STAGE[0], STAGE[1] - 60, 30, ['#ffd84a', '#ff9fc4', '#ffffff']); },
    winBanner: r => '🌻 ' + r.winner.name + ' has the honey flower!',
    winPos: () => ({ x: STAGE[0], y: STAGE[1] - 80 })
  };
})();
