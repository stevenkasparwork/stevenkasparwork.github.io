
        // register service worker

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service_workers/service_worker.js').then(function(reg) {

    if(reg.installing) {
        console.log('...Service worker installing');
        window.location.reload();
    } else if(reg.waiting) {
        console.log('...Service worker installed');
    } else if(reg.active) {
        console.log('...Service worker active');
        openDb().then(function(){ initializeView('home'); });
    }

  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
};


this.addEventListener('install', function(event) {
    console.log('...install event');
    event.waitUntil(
        caches.open('v3').then(function(cache) {
            //console.log(cache);
            return cache.addAll([
                '/service_workers/',
                '/service_workers/index.html',
                '/service_workers/indexed_db.js',
                '/service_workers/jquery.js'
            ]);
        })
    );
});

this.addEventListener('fetch', function(event) {
    //console.log('Handling fetch event for', event.request.url);

    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                //console.log('Found response in cache:', response);
                return response;
                
            }
            
            //console.log('No response found in cache. About to fetch from network...');

            return fetch(event.request).then(function(response) {
                
                console.log('Response from network is:', response);
                return response;
                
            }).catch(function(error) {
                // not in cache and we do not have connection
                console.warn('Fetching failed:', error);
                
            });
        })
    );
});




