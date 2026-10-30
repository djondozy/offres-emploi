// Djob : la liste reste consultable hors connexion avec la dernière version reçue.
const CACHE = "djob-v9";
const CORE = ["./", "./index.html", "./data.json", "./sorties.json", "./config.json", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); const key = (url.pathname.endsWith(".json") ? "./"+url.pathname.split("/").pop() : e.request);
    caches.open(CACHE).then(c => c.put(key, copy)); return r;
  }).catch(() => caches.match((url.pathname.endsWith(".json") ? "./"+url.pathname.split("/").pop() : e.request)).then(r => r || caches.match("./index.html"))));
});
