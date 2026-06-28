// FILE: precci/frontend/public/sw.js
// PRECCI Service Worker — PWA offline capability and caching.
// SECURITY: Never caches authenticated data, voice sessions,
// camera frames, booking data, or any personal information.

const CACHE_NAME = 'precci-v1';
const OFFLINE_URL = '/offline';

// Static assets safe to cache — no personal data
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Routes that must NEVER be cached
const NEVER_CACHE_PATTERNS = [
  /\/api\//,
  /\/voice\//,
  /\/camera\//,
  /\/bookings\//,
  /\/payments\//,
  /supabase/,
  /vapi/,
  /elevenlabs/,
  /anthropic/,
];

// ─────────────────────────────────────────────
// INSTALL — cache static assets
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// ─────────────────────────────────────────────
// ACTIVATE — clean old caches
// ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ─────────────────────────────────────────────
// FETCH — routing strategy
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Never cache these patterns — always go to network
  const shouldNeverCache = NEVER_CACHE_PATTERNS.some(pattern =>
    pattern.test(url.pathname) || pattern.test(url.href)
  );

  if (shouldNeverCache) {
    event.respondWith(fetch(request));
    return;
  }

  // For API routes — network only, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // For static assets — cache first, then network
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // For navigation requests — network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Default — network first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// ─────────────────────────────────────────────
// PUSH NOTIFICATIONS — PRECCI booking alerts
// ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'PRECCI', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'PRECCI',
      options
    )
  );
});

// ─────────────────────────────────────────────
// NOTIFICATION CLICK — navigate to URL
// ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});