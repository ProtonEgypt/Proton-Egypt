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

messaging.onBackgroundMessage(function(payload){
  const title = (payload.notification && payload.notification.title) || 'Proton Egypt';
  const body  = (payload.notification && payload.notification.body)  || '';
  const icon  = (payload.notification && payload.notification.icon)  || '/icon-192x192.png';
  const link  = (payload.data && payload.data.url) || 'https://protonegypt.github.io/Proton-Egypt/';
  return self.registration.showNotification(title, {
    body, icon,
    badge: 'https://protonegypt.github.io/Proton-Egypt/icon-72x72.png',
    tag: 'proton-notif',
    data: { url: link },
    vibrate: [200,100,200],
    requireInteraction: false
  });
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || 'https://proton-eg.netlify.app/';
  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
      for(var c of list){ if(c.url === url && 'focus' in c) return c.focus(); }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
