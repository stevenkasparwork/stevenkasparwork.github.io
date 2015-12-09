
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
// This is what our customer data looks like.
const resourcesData = [
  { external_id: "444-44-4444", name: "Bill", age: 35, email: "bill@company.com" },
  { external_id: "555-55-5555", name: "Donna", age: 32, email: "donna@home.org" }
];

var transaction, db, objectStore, request, indexedDB;

if(typeof window !== 'undefined'){
    console.log(window);
    // In the following line, you should include the prefixes of implementations you want to test.
    indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
    }
    
    request = indexedDB.open("HelixOFSCMobilityDB", 2);
    request.onerror = function(event) {
      alert("Why didn't you allow my web app to use IndexedDB?!");
    };
    request.onsuccess = function(event) {
        console.log(event);
      db = event.target.result;
        console.log(db);
        objectStore = db.transaction(["resources"], "readwrite").objectStore("customers");
        // Do something when all the data is added to the database.
        objectStore.oncomplete = function(event) {
            console.log(event);
          alert("All done!");
        };

        objectStore.onerror = function(event) {
          // Don't forget to handle errors!
            console.log(event);
        };
    }; 
    request.onupgradeneeded = function(event) {
        console.log('upgrade needed');
    };
}
function addResource(){
    var external_id = document.getElementById('external_id').value;
    var name = document.getElementById('name').value;
    var age = document.getElementById('age').value;
    var email = document.getElementById('email').value;
    
    
    var request = objectStore.add({ external_id: external_id, name: name, age: age, email: email});
    request.onerror = function(event) {
    // event.target.result == customerData[i].ssn;
        console.log(event);
    }
    request.onsuccess = function(event) {
    // event.target.result == customerData[i].ssn;
        console.log(event);
    }
};

