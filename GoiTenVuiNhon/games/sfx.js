// Short library effects, fetched only for the selected game.
const GAME_SOUNDS = {
  "g1": {
    "textures": [
      [
        "paddle",
        0.8,
        1.25,
        0.22
      ]
    ],
    "events": {},
    "water": true
  },
  "g2": {
    "textures": [
      [
        "knock1 knock2",
        1,
        1.3,
        0.23
      ]
    ],
    "events": {
      "d1": "spring",
      "d2": "roar",
      "crk": "knock2"
    }
  },
  "g3": {
    "textures": [
      [
        "bubble1 bubble2",
        0.7,
        1.5,
        0.28
      ]
    ],
    "events": {
      "c": "frog1",
      "pop": "pop1"
    },
    "water": true
  },
  "g4": {
    "textures": [
      [
        "breath",
        1,
        2.8,
        0.2
      ]
    ],
    "events": {
      "c": "sneeze",
      "open": "box"
    }
  },
  "g5": {
    "textures": [
      [
        "motor1 motor3",
        0.7,
        1.3,
        0.22
      ]
    ],
    "events": {
      "b": "clank1",
      "d": "motor2",
      "e": "clank2"
    }
  },
  "g6": {
    "textures": [],
    "events": {
      "open": "door",
      "close": "creak",
      "b": "breath",
      "door": "door"
    }
  }
};
const GameSound = {
  files: new Map(), buffers: new Map(), loading: new Map(), playing: new Set(), last: new Map(), takes: new Map(),
  names(id) {
    const p = GAME_SOUNDS[id];
    return p ? [...new Set([...p.textures.map(x => x[0]), ...Object.values(p.events), ...(p.water ? ['splash1 splash2 paddle bubble1 bubble2'] : [])].join(' ').split(' ').filter(Boolean))] : [];
  },
  fetch(name) {
    if (!this.files.has(name)) {
      const task = fetch('assets/sfx/' + name + '.mp3', { priority: 'low' })
        .then(r => { if (!r.ok) throw Error(r.status); return r.arrayBuffer(); })
        .catch(() => { this.files.delete(name); return null; });
      this.files.set(name, task);
    }
    return this.files.get(name);
  },
  prepare(id, decode = false) {
    if (!store.settings.sound) return Promise.resolve();
    const c = decode ? AUD.get() : AUD.ctx;
    return Promise.all(this.names(id).map(name => {
      const bytes = this.fetch(name);
      if (!c || this.buffers.has(name)) return bytes;
      if (!this.loading.has(name)) {
        const task = bytes.then(b => b && c.decodeAudioData(b.slice(0)))
          .then(b => { if (b) this.buffers.set(name, b); })
          .catch(() => { this.files.delete(name); })
          .finally(() => this.loading.delete(name));
        this.loading.set(name, task);
      }
      return this.loading.get(name);
    }));
  },
  play(choices, { gain = .35, gap = .3, delay = 0 } = {}) {
    if (!store.settings.sound || document.hidden) return false;
    const c = AUD.get(); if (!c) return false;
    const names = choices.split(' '), take = this.takes.get(choices) || 0;
    const buffer = this.buffers.get(names[take % names.length]);
    if (!buffer) { this.prepare(curGame(), true); return false; }
    const at = c.currentTime + delay;
    if (at - (this.last.get(choices) ?? -Infinity) < gap || this.playing.size >= 4) return true;
    this.last.set(choices, at); this.takes.set(choices, take + 1);
    const node = c.createBufferSource(), level = c.createGain();
    node.buffer = buffer; level.gain.value = gain;
    node.connect(level).connect(AUD.sfx); this.playing.add(node);
    node.onended = () => { this.playing.delete(node); node.disconnect(); level.disconnect(); };
    node.start(at); return true;
  },
  cue(key) {
    const events = GAME_SOUNDS[curGame()]?.events; if (!events) return;
    const sound = events[key] || Object.entries(events).find(([k]) => k.endsWith('*') && key.startsWith(k.slice(0, -1)))?.[1];
    if (sound) this.play(sound);
  },
  tick(r, dt) {
    r.soundTime = (r.soundTime || 0) + dt;
    if (r.now >= r.TW) return;
    const textures = GAME_SOUNDS[r.game?.id || 'g1']?.textures || [];
    r.soundNext ||= [];
    textures.forEach(([sound, first, interval, gain], i) => {
      if (r.soundTime < (r.soundNext[i] ?? first)) return;
      r.soundNext[i] = r.soundTime + interval;
      this.play(sound, { gain, gap: interval * .8 });
    });
  },
  stop() {
    for (const node of this.playing) { try { node.stop(); } catch (_) {} }
    this.playing.clear(); this.last.clear(); this.takes.clear();
  }
};
document.addEventListener('visibilitychange', () => { if (document.hidden) GameSound.stop(); });
