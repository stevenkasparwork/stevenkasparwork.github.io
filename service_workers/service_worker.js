
        // register service worker

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service_workers/service_worker.js').then(function(reg) {

    if(reg.installing) {
      console.log('Service worker installing');
    } else if(reg.waiting) {
      console.log('Service worker installed');
    } else if(reg.active) {
      console.log('Service worker active');
    }

  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
};


this.addEventListener('install', function(event) {
    console.log('install event');
    event.waitUntil(
        caches.open('v1').then(function(cache) {
            console.log(cache);
            return cache.addAll([
                '/service_workers/',
                '/service_workers/index.html',
                '/service_workers/detail.html',
                '/service_workers/indexed_db.js',
                '/service_workers/jquery.js'
            ]);
        })
    );
});

this.addEventListener('fetch', function(event) {
    console.log('fetch (service_worker)');
   
    event.respondWith(caches.match(event.request).catch(function(e) {
        //console.log(e);
        return fetch(event.request);
    }).then(function(response) {
        //console.log(response);
        if(response){
            caches.open('v1').then(function(cache) {
                cache.put(event.request, response);
            });
            return response.clone();
        }
    }).catch(function(e) {
        //console.log(e);
        return caches.match('/service_workers/index.html');
    }));
});




