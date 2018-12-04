const version = "1.0.6";

const cacheId = "FINANCE-" + version;
const files = [
    'css/fonts/open-sans-regular-a.woff2',
    'css/fonts/open-sans-regular-b.woff2',
    'css/fonts/open-sans-regular-c.woff2',
    'css/fonts/open-sans-regular-d.woff2',
    'css/fonts/open-sans-regular-e.woff2',
    'css/fonts/open-sans-regular-f.woff2',
    'css/fonts/open-sans-regular-g.woff2',
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
    '/',
    '/index.html'
];

self.addEventListener('install', e => e.waitUntil(caches.open(cacheId).then(cache => cache.addAll(files))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(name => name !== cacheId).map(name => caches.delete(name))))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(response => response ? response : fetch(e.request))));