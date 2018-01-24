var CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
	'./',
	'./index.html?utm_source=homescreen',
	'./js/color-thief.js',
	'./js/vue.min.js',
  	'./js/app.js',
	'./app.css',
  	'./manifest.json'
];

self.addEventListener('install', function(event) {
	// Perform install steps
	event.waitUntil(
		caches.open(CACHE_NAME)
		.then(function(cache) {
			console.log('Opened cache');
			return cache.addAll(urlsToCache);
		})
		.catch(function(e) {
			console.log('Error from caches open', e);
		})
	)
});

self.addEventListener('fetch', function(event) {
	event.respondWith(
	  caches.match(event.request)
		.then(function(response) {
		  // Cache hit - return response
		  if (response) {
				console.log('got it from cache', event.request);
				return response;
		  }
		  return fetch(event.request);
		}
	  )
	);
  });
  
self.addEventListener('activated', function(event) {
	console.log('activated');
});