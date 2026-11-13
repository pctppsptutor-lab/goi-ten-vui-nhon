const CACHE_NAME = 'name-picker-vol1-shell-0d44f168a3c2c0a99149';
const ASSET_CACHE_NAME = 'name-picker-vol1-assets-dd98920307056074a759';
const GAME_CACHES = {"g1":"name-picker-vol1-g1-683b0742eb3161fe9e47","g2":"name-picker-vol1-g2-540c80355ea7daa7916c","g3":"name-picker-vol1-g3-bd9803851226e88a3229","g4":"name-picker-vol1-g4-5ef3306b93e26acd9140","g5":"name-picker-vol1-g5-22ed0fb513ba276a0400","g6":"name-picker-vol1-g6-7cc63709bf5034757a68","g7":"name-picker-vol1-g7-60e32ae87cd061baa6a5","g8":"name-picker-vol1-g8-081d0dc73e4a949122e2","g9":"name-picker-vol1-g9-40bfe270b8d1df911b1f","g10":"name-picker-vol1-g10-bd247c5c986c27b8fcf4","g11":"name-picker-vol1-g11-e62de3d5f3baf3f943c2","g12":"name-picker-vol1-g12-e07db54d1f14d61977d3","g13":"name-picker-vol1-g13-616f7984f750cd99c86b","g14":"name-picker-vol1-g14-bc1e810951e27e010fe4","g15":"name-picker-vol1-g15-d43c366c9b5d82c00aa9","g16":"name-picker-vol1-g16-1a21497f2c64e509bd0b","g17":"name-picker-vol1-g17-5cef7343fc851ab9dbad","g18":"name-picker-vol1-g18-5ef2a2efc9476043cf45","g19":"name-picker-vol1-g19-b466aaf632b0e15a6d18","g20":"name-picker-vol1-g20-4eab17c919dbf119a204","g21":"name-picker-vol1-g21-62a0764b0029d1c83732","g22":"name-picker-vol1-g22-45a2d25811fc618208ad","g23":"name-picker-vol1-g23-cd97c88037fb8ca127af","g24":"name-picker-vol1-g24-9ca36f8cf412fbb97349","g25":"name-picker-vol1-g25-9c562c63e7ed799cc22c","g26":"name-picker-vol1-g26-15b065880a5983a87d7e","g27":"name-picker-vol1-g27-8467c341d684119f0bfc","g28":"name-picker-vol1-g28-0f0018e2ecaa883ca4ff","g29":"name-picker-vol1-g29-15dd011e92d4f426d04f","g30":"name-picker-vol1-g30-c6ca1e422e65494f1841"};
function assetCacheName(url) {
  const id = /\/assets\/(g\d+|duck-race)\//.exec(url.pathname)?.[1]?.replace('duck-race', 'g1') || /\/assets\/bgm\/(g\d+)\.mp3$/.exec(url.pathname)?.[1];
  return GAME_CACHES[id] || ASSET_CACHE_NAME;
}
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./assets/bgm/credits.html",
  "./assets/sfx/credits.html",
  "./games/dist/runtime.js",
];

self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)),
      caches.open(ASSET_CACHE_NAME).then(c => Promise.all([
        './assets/brand/edupia-tutor.webp',
        './assets/fonts/wXKrE3kTposypRyd51jcAA.woff2',
        './assets/fonts/wXKrE3kTposypRyd51fcANwr.woff2',
        './assets/fonts/wXKrE3kTposypRyd51bcANwr.woff2',
        './assets/fonts/X7n64b87HvSqjb_WIi2yDCRwoQ_k7367_DWu89U.woff2',
        './assets/fonts/X7n64b87HvSqjb_WIi2yDCRwoQ_k7367_DWg89XyHw.woff2'
      ].map(url => c.match(url).then(hit => hit || c.add(url).catch(() => {})))))
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('name-picker-vol1-') && k !== CACHE_NAME && k !== ASSET_CACHE_NAME && !Object.values(GAME_CACHES).includes(k)).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Cache the complete small BGM once, then satisfy native media range requests offline.
async function bgmResponse(request) {
  const cache = await caches.open(assetCacheName(new URL(request.url))).catch(() => null);
  let full = await cache?.match(request.url).catch(() => undefined);
  if (!full) {
    const headers = new Headers(request.headers); headers.delete('range');
    full = await fetch(new Request(request, { headers }));
    if (full.status === 200 && cache) await cache.put(request.url, full.clone()).catch(() => {});
  }
  const range = request.headers.get('range');
  if (!range || full.status !== 200) return full;
  const bytes = await full.arrayBuffer(), size = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  const invalid = () => new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  if (!match || (!match[1] && !match[2])) return invalid();
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) return invalid();
  const headers = new Headers(full.headers); headers.delete('content-encoding');
  headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + size);
  headers.set('Content-Length', String(end - start + 1)); headers.set('Accept-Ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === self.location.origin && /\/assets\/bgm\/g\d+\.mp3$/i.test(url.pathname)) {
    e.respondWith(bgmResponse(e.request).catch(() => Response.error())); return;
  }
  const asset = /\.(webp|png|wav|mp3|svg|woff2?)$/i.test(url.pathname) || url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com');
  const cache = caches.open(asset ? assetCacheName(url) : CACHE_NAME).catch(() => null);
  const cached = cache.then(c => c?.match(e.request)).catch(() => undefined);
  let write;
  const network = cached.then(hit => {
    if (asset && hit) return hit;
    return fetch(e.request).then(res => {
      if (res.status === 200) {
        const copy = res.clone();
        write = cache.then(c => c?.put(e.request, copy)).catch(() => {});
      }
      return res;
    }).catch(() => undefined);
  });
  e.waitUntil(network.then(() => write));
  const response = asset ? network : cached.then(hit => hit || network);
  e.respondWith(response.then(res => res || Response.error()));
});
