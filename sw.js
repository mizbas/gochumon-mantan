// ご注文は満タンで オフライン用
// ゲームを更新するときは VERSION だけ書き換える。
// ブラウザはこの小さなファイル（約1KB）だけを確かめ、変わっていたときだけ新しい版をダウンロードする。
const VERSION = "2026-10-27f";
const APP = "tokutoku-app-" + VERSION;        // ゲーム本体（版ごと）
const STATIC = "tokutoku-static-v2";           // アイコンとフォント（版をまたいで使い回す）
const APP_FILES = ["./", "index.html", "manifest.json"];
const STATIC_FILES = ["icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const app = await caches.open(APP);
    await app.addAll(APP_FILES.map(u => new Request(u, {cache: "reload"})));
    const st = await caches.open(STATIC);
    for (const u of STATIC_FILES){ if (!(await st.match(u))) { try { await st.add(u); } catch(e){} } }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== APP && k !== STATIC) await caches.delete(k);
    await self.clients.claim();
  })());
});

// 保存してあるものを使う。ないものだけ通信して保存する（毎回の確かめ直しはしない）
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, {ignoreSearch: true});
    if (hit) return hit;
    try {
      const r = await fetch(e.request);
      if (r && (r.ok || r.type === "opaque")){
        const url = new URL(e.request.url);
        const keep = url.origin !== location.origin ? STATIC : (/\.(png|woff2?)$/.test(url.pathname) ? STATIC : APP);
        (await caches.open(keep)).put(e.request, r.clone());
      }
      return r;
    } catch(err){
      return (await caches.match("index.html")) || Response.error();
    }
  })());
});
