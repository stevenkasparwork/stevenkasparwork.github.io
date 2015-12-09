
        // register service worker

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service_workers/service_worker.js', { scope: '/service_workers/'}).then(function(reg) {

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
        caches.open('v2').then(function(cache) {
          return cache.addAll([
              'index.html',
              'page2.html',
              'indexed_db.js'
          ]);
        })
      );
    });



