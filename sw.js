const staticCacheName = 'site-static-v8';
const dynamicCacheName = 'site-dynamic-v8';

const assets = [
  '/index.php',
  '/offline.php',
  '/js/app.js',
  '/js/cookies.js',
  '/js/nav.js',
  '/css/style.css',
  '/css/nav.css',
  '/img/icons/icon-256x256.png',
  'https://fonts.gstatic.com/s/exo2/v9/7cH1v4okm5zmbvwkAx_sfcEuiD8j4PKsPdC_nps.woff2',
  'https://fonts.gstatic.com/s/exo2/v9/7cH1v4okm5zmbvwkAx_sfcEuiD8j4PKsOdC_.woff2',
  'https://fonts.googleapis.com/css2?family=Exo+2:wght@300&display=swap'
];

// cache size limit function
const limitCacheSize = (name, size) => {
  caches.open(name).then(cache => {
    cache.keys().then(keys => {
      if(keys.length > size){
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    });
  });
};

// install event
self.addEventListener('install', evt => {
  //console.log('service worker installed');
  evt.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      console.log('caching shell assets');
      cache.addAll(assets);
    })
  );
});

// activate event
self.addEventListener('activate', evt => {
  //console.log('service worker activated');
  evt.waitUntil(
    caches.keys().then(keys => {
      //console.log(keys);
      return Promise.all(keys
        .filter(key => key !== staticCacheName && key !== dynamicCacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});

// fetch events
self.addEventListener('fetch', evt => {
  if(evt.request.url.indexOf('firestore.googleapis.com') === -1){
    evt.respondWith(
      caches.match(evt.request).then(cacheRes => {
        return cacheRes || fetch(evt.request).then(fetchRes => {
          return caches.open(dynamicCacheName).then(cache => {
            cache.put(evt.request.url, fetchRes.clone());
            // check cached items size
            limitCacheSize(dynamicCacheName, 15);
            return fetchRes;
          })
        });
      }).catch(() => {
        if(evt.request.url.indexOf('.html'||'.php') > -1){
          return caches.match('/offline.php');
        } 
      })
    );
  }
});