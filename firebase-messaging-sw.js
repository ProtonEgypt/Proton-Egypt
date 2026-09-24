importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:"AIzaSyAxc-i2-VmE14fhFCdf-vGi2GaRzg1VqoQ",
  authDomain:"proton-egypt-official.firebaseapp.com",
  projectId:"proton-egypt-official",
  storageBucket:"proton-egypt-official.firebasestorage.app",
  messagingSenderId:"1067061157926",
  appId:"1:1067061157926:web:e2e913b738c717ab6686e7"
});

const messaging = firebase.messaging();
const CACHE_NAME = 'proton-egypt-shell-v1';

messaging.onBackgroundMessage(function(payload){
  const title = (payload.notification && payload.notification.title) || 'Proton Egypt';
  const body  = (payload.notification && payload.notification.body)  || '';
  const scope = self.registration.scope;
  const icon  = (payload.notification && payload.notification.icon) || new URL('icon-192x192.png', scope).href;
  const link  = (payload.data && payload.data.url) || scope;
  return self.registration.showNotification(title, {
    body, icon,
    badge: new URL('icon-72x72.png', scope).href,
    tag: 'proton-notif',
    data: { url: link },
    vibrate: [200,100,200],
    requireInteraction: false
  });
});

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([new URL('./', self.registration.scope).href]);
    }).catch(function() {})
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(key) {
        return key !== CACHE_NAME;
      }).map(function(key) {
        return caches.delete(key);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response && response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, copy);
        }).catch(function() {});
      }
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || 'https://protonegypt.github.io/Proton-Egypt/';
  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
      for(var c of list){ if(c.url === url && 'focus' in c) return c.focus(); }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
