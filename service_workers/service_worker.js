
        // register service worker

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service_workers/service_worker.js', '/service_workers/').then(function(reg) {

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
          return cache.addAll([
            'index.html',
              'service_worker.js'
          ]);
        })
      );
    });

    this.addEventListener('fetch', function(event) {
      var response;
      event.respondWith(caches.match(event.request).catch(function() {
        return fetch(event.request);
      }).then(function(r) {
        response = r;
        caches.open('v1').then(function(cache) {
          cache.put(event.request, response);
        });
        return response.clone();
      }).catch(function() {
        return caches.match('/sw-test/gallery/myLittleVader.jpg');
      }));
    });
    