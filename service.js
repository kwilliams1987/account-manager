const version = "1.11.0";

const cacheId = "FINANCE-" + version;
const files = [
    'apps/android-chrome-192x192.png',
    'apps/android-chrome-512x512.png',
    'apps/apple-touch-icon.png',
    'apps/browserconfig.xml',
    'apps/favicon-16x16.png',
    'apps/favicon-32x32.png',
    'apps/favicon-194x194.png',
    'apps/favicon.ico',
    'apps/icon.svg',
    'apps/manifest.json',
    'apps/mstile-70x70.png',
    'apps/mstile-144x144.png',
    'apps/mstile-150x150.png',
    'apps/mstile-310x150.png',
    'apps/mstile-310x310.png',
    'apps/safari-pinned-tab.svg',
    'css/fonts/open-sans-regular-a.woff2',
    'css/fonts/open-sans-regular-b.woff2',
    'css/fonts/open-sans-regular-c.woff2',
    'css/fonts/open-sans-regular-d.woff2',
    'css/fonts/open-sans-regular-e.woff2',
    'css/fonts/open-sans-regular-f.woff2',
    'css/fonts/open-sans-regular-g.woff2',
    'css/images/github.svg',
    'css/images/paypal.svg',
    'css/fonts.css',
    'css/layout.css',
    'js/model/payment.js',
    'js/model/recurrence.js',
    'js/model/template.js',
    'js/utils/encryption.js',
    'js/utils/guid.js',
    'js/dialogs.js',
    'js/engine.js',
    'js/storage.js',
    'js/strings.js',
    'js/ui.js',
    'favicon.ico',
    './',
    'index.html'
];

self.addEventListener('install', e => e.waitUntil(caches.open(cacheId).then(cache => cache.addAll(files))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(name => name !== cacheId).map(name => caches.delete(name))))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(response => response ? response : fetch(e.request))));