
const CACHE_VERSION = 'tft-pilots-calendar-v2';
const CACHE_FILES = [
	'/-/webix/webix.min.js',
	'/-/webix/webix.min.css',
	'/-/webix/scheduler.js',
	'/-/webix/scheduler.css',
	'/-/webix/kanri/app.mobile.js',
	'/-/webix/kanri/auth.js'
	'icon-192.png',
	'index.html',
	'app.css',
	'app.js',
];

self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(CACHE_VERSION)
			.then(function (cache) { return cache.addAll(CACHE_FILES); })
	);
});
self.addEventListener('fetch', function (event) {});
self.addEventListener('activate', function (event) {
	event.waitUntil(
		caches.keys().then(function(keys){
			return Promise.all(keys.map(function(key, i){
				if(key !== CACHE_VERSION) return caches.delete(keys[i]);
			}))
		})
	)
});
