const version = "1.0.2";

const cacheId = "FINANCE-" + version;
const files = [
    '/',
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
    'js/ui.js'
];

self.addEventListener('install', e => e.waitUntil(cache.addAll(caches.open(cacheId).then(cache => cache.addAll(files)))));
self.addEventListener('activate', e => e.waitUntil(Promise.all(caches.keys().then(keys => keys.filter(name => name !== cacheId).map(name => caches.delete(name))))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(response => response ? response : fetch(e.request))));