// TF Tournaments service worker: faster starts by caching the app shell and Firebase libraries.
const V="tf-v3";
const SHELL=["./","index.html","firebase-config.js","manifest.json","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const put=(req,res)=>{if(res&&(res.ok||res.type==="opaque"))caches.open(V).then(c=>c.put(req,res.clone())).catch(()=>{});return res};
self.addEventListener("fetch",e=>{
 const r=e.request;if(r.method!=="GET")return;
 const u=new URL(r.url);
 // Firebase libraries and font files never change for a given URL: cache first.
 if((u.hostname==="www.gstatic.com"&&u.pathname.startsWith("/firebasejs/"))||u.hostname==="fonts.gstatic.com"){
  e.respondWith(caches.match(r).then(h=>h||fetch(r).then(x=>put(r,x))));return;
 }
 // Font stylesheet: show cached, refresh in the background.
 if(u.hostname==="fonts.googleapis.com"){
  e.respondWith(caches.match(r).then(h=>{const n=fetch(r).then(x=>put(r,x)).catch(()=>h);return h||n}));return;
 }
 // Our own pages and files: try the network briefly so updates show up, else use the saved copy.
 if(u.origin===location.origin){
  e.respondWith(new Promise(res=>{
   let done=false;const t=setTimeout(()=>{caches.match(r).then(h=>{if(h&&!done){done=true;res(h)}})},2500);
   fetch(r).then(x=>{clearTimeout(t);put(r,x);if(!done){done=true;res(x)}}).catch(()=>caches.match(r).then(h=>{clearTimeout(t);if(!done){done=true;res(h||Response.error())}}));
  }));
 }
});
