
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

// In the following line, you should include the prefixes of implementations you want to test.
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// DON'T use "var indexedDB = ..." if you're not in a function.
// Moreover, you may need references to some window.IDB* objects:
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
// (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)

if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
}
// Let us open our database
var request = window.indexedDB.open("MyTestDatabase", 1);


    if(counter){
        counter++;
    }
    else {
        var counter = 0;
    }
    console.log(counter);