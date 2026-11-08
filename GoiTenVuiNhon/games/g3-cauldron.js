// Game 03 — Nồi phép thuật nổi loạn
// Students become magic orbs circling the cauldron; one orb is blasted up onto the announcement podium.
// Twist: the first (golden) orb turns into soap bubbles; the frog assistant grabs the wand and points at the real winner.
(() => {
  const ORBS = ['orb_red', 'orb_orange', 'orb_yellow', 'orb_green', 'orb_cyan', 'orb_blue', 'orb_purple', 'orb_magenta', 'orb_pink', 'orb_moon'];
  const C = { x: 800, y: 470 }, RX = 450, RY = 160, ORB = 104;
  const POD = { x: 800, y: 868 }, TOP = 690;          // podium base / where the winner stands
  const FROG = { x: 210, y: 790 };

  // orb with the student's face inside
  function orb(p, x, y, size, golden, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha;
    drawImg(golden ? 'golden_sphere' : ORBS[p.i % 10], x, y, size);
    const im = IMG['c' + p.av + '_idle'];
    if (im) {
      const h = size * 1.65, w = im.width * h / im.height;
      ctx.beginPath(); ctx.arc(x, y + 2, size * .36, 0, 7); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fill();          // glassy window so the face reads clearly
      ctx.globalAlpha = alpha; ctx.drawImage(im, x - w / 2, y - size * .30, w, h);
    }
    ctx.restore();
  }
  const orbitPos = (r, p, t) => {
    const a = p.a0 + r.spin(t);
    return [C.x + Math.cos(a) * RX, C.y + Math.sin(a) * RY, Math.sin(a)];
  };
  const arc = (a, b, k, lift) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * lift];

  GAME_IMPL.g3 = {
    id: 'g3', title: 'Rebellious Cauldron', base: 'assets/g3/', titleY: 400,
    assets: gAssets(['idle', 'twist', 'win'], [...ORBS, 'golden_sphere', 'golden_orb_to_bubbles', 'bubble_cluster', 'cauldron', 'stone_pedestal', 'smoke_green', 'smoke_purple', 'smoke_pink',
        'frog_ready', 'frog_jump', 'frog_point_true', 'frog_shocked', 'frog_bow', 'vfx_burst_orb', 'vfx_burst_flower', 'vfx_gold_trail', 'star_cluster']),
    startBanner: '🔮 The magic orbs start circling the cauldron!', mote: '#d6b8ff', rayColor: '#e6ccff',

    setup(r) {
      r.players.forEach((p, i) => { p.i = i; p.a0 = i / r.players.length * Math.PI * 2; });
      r.fakes = makeFakes(r, 1.2);
      // orbit speed eases out and freezes once the frog points
      const stopAt = r.TW + (r.plain ? 1 : 1.7);
      r.spin = t => { const tt = Math.min(t, stopAt); return tt * 1.1 - Math.max(0, tt - r.TW) * .6; };
      r.stopAt = stopAt;
    },

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner;
      if (f && te < 0) cue('fk' + f.at, () => { r.banner = '🔮 ' + f.p.name + "'s orb shoots up!"; SFX.leader(); });
      if (te < 0 && Math.random() < .02) SFX.tone(300 + Math.random() * 300, .12, { vol: .05, to: 700 });   // bubbling
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); SFX.swoosh(); r.banner = '✨ A golden orb blasts onto the podium!'; });
        if (te > .9) cue('b', () => { outcome('wrong_turn', D); FX.bubbles(POD.x, TOP - 60, 26, '#d8f7ff'); SFX.bubbles(); SFX.sadTrombone(); r.banner = '🫧 Oh! The golden orb turns into soap bubbles!'; });
        if (te > 1.3) cue('c', () => { CAM.shake(r, 5); SFX.boing(); r.banner = '🐸 The frog grabs the magic wand…'; });
        if (te > 1.7) cue('d', () => { FX.line(520, FROG.y - 150, Wn.x, Wn.y - 40, 22); outcome('selected', Wn); SFX.sparkle(); r.banner = '🪄 …and points at the real orb!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🔮 ' + (D || Wn).name + "'s orb rises…"; });
        if (te > .9) cue('b', () => { SFX.boing(); r.banner = '😮 …and drops back down!'; });
        if (te > 1) cue('c', () => { FX.line(FROG.x + 60, FROG.y - 150, Wn.x, Wn.y - 40, 22); outcome('selected', Wn); SFX.sparkle(); r.banner = '🐸 The frog points the wand at this orb!'; });
      }
      const fly = r.plain ? 1.3 : 1.9, pop = r.plain ? 2.6 : 2.8;
      if (te > fly) cue('fly', () => { SFX.wheee(); });
      if (te > pop) cue('pop', () => { SFX.pop(); SFX.sparkle(); addFx('vfx_burst_flower', POD.x, TOP - 40, 260, .6); FX.sparkle(POD.x, TOP - 60, 36, ['#ffd84a', '#e0b3ff', '#7cf7ff']); });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner;
      const fly = r.plain ? 1.3 : 1.9, pop = r.plain ? 2.6 : 2.8, frozen = te > (r.plain ? 1 : 1.7);
      drawImg('stone_pedestal', POD.x, POD.y, 220, { anchor: 'bottom' });
      // positions for this frame
      const pos = new Map();
      for (const p of r.players) {
        let [x, y, depth] = orbitPos(r, p, rt), size = ORB, golden = false, alpha = 1, hide = false;
        if (f && f.p === p && te < 0) { const k = Math.sin(clamp((rt - f.at) / f.dur) * Math.PI); y -= k * 130; size *= 1 + k * .25; }
        if (p === (D || Wn) && te > 0 && te < .9 && r.plain) { const k = Math.sin(te / .9 * Math.PI); y -= k * 160; }
        if (p === D && !r.plain && te > 0) {
          golden = true;
          if (te < .8) [x, y] = arc([x, y], [POD.x, TOP - 60], ease(te / .8), 160); else { x = POD.x; y = TOP - 60; }
          if (te > .9) hide = true;
        }
        if (p === Wn && te > fly) { const k = ease(clamp((te - fly) / (pop - fly))); [x, y] = arc(orbitPos(r, p, r.stopAt), [POD.x, TOP - 60], k, 200); if (k > 0 && k < 1) FX.every(r, 'orbtrail', .04, () => FX.glitter(x, y, 2, ['#ffd84a', '#ffffff']));
        if (k > 0 && k < 1 && rt - (r.lastTrail || 0) > .07 && (r.lastTrail = rt)) r.fx.push({ img: 'vfx_gold_trail', x, y: y + 30, w: 120, t0: rt, dur: .35 }); depth = 2; }
        if (p === Wn && (te > pop || done)) hide = true;
        pos.set(p, { x, y, depth, size, golden, alpha, hide });
        p.x = x; p.y = y + 40;
      }
      const drawOrb = p => {
        const o = pos.get(p); if (o.hide) return;
        const glow = (f && f.p === p && te < 0) || (frozen && p === Wn && !done);
        if (glow) drawImg('vfx_burst_orb', o.x, o.y, o.size * 1.8, { alpha: .6 + .3 * Math.sin(rt * 10) });
        orb(p, o.x, o.y, o.size, o.golden, done ? .35 : 1);
        if (!done) tagC(p.name, o.x, o.y + o.size * .62, glow);
      };
      const behind = r.players.filter(p => pos.get(p).depth < 0).sort((a, b) => pos.get(a).y - pos.get(b).y);
      const front = r.players.filter(p => pos.get(p).depth >= 0).sort((a, b) => pos.get(a).y - pos.get(b).y);
      behind.forEach(drawOrb);
      // cauldron with smoke
      ['smoke_green', 'smoke_purple', 'smoke_pink'].forEach((s, i) => { const k = (rt * .5 + i / 3) % 1; drawImg(s, C.x - 40 + i * 40, C.y - 30 - k * 160, 110 + k * 60, { alpha: (1 - k) * .8, anchor: 'bottom' }); });
      drawImg('cauldron', C.x, C.y + 110, 300, { anchor: 'bottom' });
      if (!done) FX.every(r, 'brew', .12, () => FX.bubbles(C.x + (Math.random() - .5) * 140, C.y - 20, 1, Math.random() < .5 ? '#b6ff9e' : '#e0b3ff'));
      front.forEach(drawOrb);
      // golden orb bursting into bubbles
      if (!r.plain && D && te > .9 && !done) {
        const k = clamp((te - .9) / 1.2);
        drawImg(te < 1.4 ? 'golden_orb_to_bubbles' : 'bubble_cluster', POD.x, TOP - 60 - k * 140, 160 + k * 60, { alpha: 1 - clamp((te - 1.8) / .6) });
        charImg(D.av, 'twist', POD.x - 200, POD.y - 20, 190, { alpha: clamp((te - 1) / .3) });
        tagC(D.name, POD.x - 200, POD.y + 4, false);
      }
      // frog assistant actively hops around the cauldron chasing orbs
      const hopPhase = Math.sin(rt * 6.5), inAir = Math.abs(hopPhase) > .45;
      let fx = 340 + Math.sin(rt * 1.45) * 190, fy = FROG.y + Math.cos(rt * 1.45) * 28 - Math.abs(hopPhase) * 38;
      let fp = inAir ? 'frog_jump' : (f ? 'frog_point_true' : 'frog_ready'), fFlip = Math.cos(rt * 1.45) < 0;
      const jump = r.plain ? null : [1.3, 1.7];
      if (jump && te > jump[0]) { const k = ease(clamp((te - jump[0]) / (jump[1] - jump[0]))); fx = lerp(FROG.x, 520, k); fy = FROG.y - 40 * k - Math.sin(k * Math.PI) * 120; fp = k < 1 ? 'frog_jump' : 'frog_point_true'; fFlip = Wn.x < fx; }
      if (r.plain && te > 1) { fp = 'frog_point_true'; fFlip = Wn.x < fx; }
      if (!r.plain && te > .9 && te < 1.3) { fp = 'frog_shocked'; fy = FROG.y - Math.abs(Math.sin(rt * 12)) * 20; }
      if (done) { fp = 'frog_bow'; fx = 520; fy = FROG.y - Math.abs(Math.sin(rt * 5)) * 10; fFlip = false; }
      drawImg(fp, fx, fy, 190, { anchor: 'bottom', flip: fFlip });
      if (done || te > pop) {
        const k = clamp((rt - r.TW - pop) / .4);
        drawImg('star_cluster', POD.x, TOP - 160, 260, { alpha: .8 });
        charImg(Wn.av, 'win', POD.x, TOP + 30, 250 * (.6 + .4 * ease(k)));
        tagC(Wn.name, POD.x, TOP + 60, true);
      }
    },

    idle(t) {
      drawImg('stone_pedestal', POD.x, POD.y, 220, { anchor: 'bottom' });
      const fake = { av: 0 };
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 + t * .5;
        fake.i = i; fake.av = i;
        if (Math.sin(a) < 0) orb(fake, C.x + Math.cos(a) * RX, C.y + Math.sin(a) * RY, ORB, false);
      }
      drawImg('cauldron', C.x, C.y + 110, 300, { anchor: 'bottom' });
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 + t * .5;
        fake.i = i; fake.av = i;
        if (Math.sin(a) >= 0) orb(fake, C.x + Math.cos(a) * RX, C.y + Math.sin(a) * RY, ORB, false);
      }
      const hop = Math.abs(Math.sin(t * 5.5)) * 34, fx = 340 + Math.sin(t * 1.3) * 180;
      drawImg(hop > 16 ? 'frog_jump' : 'frog_ready', fx, FROG.y - hop, 190, { anchor: 'bottom', flip: Math.cos(t * 1.3) < 0 });
    },
    winBanner: r => '🏆 ' + r.winner.name + ' takes the podium!',
    winPos: () => ({ x: POD.x, y: TOP - 120 })
  };
})();
