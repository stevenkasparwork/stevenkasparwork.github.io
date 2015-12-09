
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
        caches.open('v1').then(function(cache) {
          return cache.addAll([
              'index.html',
              'page2.html',
              'service_worker.js'
          ]);
        })
      );
    });
if(typeof window !== 'undefined'){
    console.log(window);
    // In the following line, you should include the prefixes of implementations you want to test.
    indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
    }
    var db;
    var request = indexedDB.open("MyTestDatabase");
    request.onerror = function(event) {
      alert("Why didn't you allow my web app to use IndexedDB?!");
    };
    request.onsuccess = function(event) {
        console.log(event);
      db = event.target.result;
        console.log(db);
    };
}
