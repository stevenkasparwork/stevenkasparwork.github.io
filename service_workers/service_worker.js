
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
    }; 
    request.onupgradeneeded = function(event) {
        console.log('upgrade needed');
      db = event.target.result;

      // Create an objectStore to hold information about our customers. We're
      // going to use "ssn" as our key path because it's guaranteed to be
      // unique - or at least that's what I was told during the kickoff meeting.
      objectStore = db.createObjectStore("resources", { keyPath: "external_id" });

      // Create an index to search resources by name. We may have duplicates
      // so we can't use a unique index.
      objectStore.createIndex("name", "name", { unique: false });

      // Create an index to search customers by email. We want to ensure that
      // no two customers have the same email, so use a unique index.
      objectStore.createIndex("email", "email", { unique: true });

      // Use transaction oncomplete to make sure the objectStore creation is 
      // finished before adding data into it.
      objectStore.transaction.oncomplete = function(event) {
        // Store values in the newly created objectStore.
        var resourcesObjectStore = db.transaction("resources", "readwrite").objectStore("resources");
        for (var i in resourcesData) {
          resourcesObjectStore.add(resourcesData[i]);
        }
      };
        
        
        transaction = db.transaction(["customers"], "readwrite");
        // Do something when all the data is added to the database.
        transaction.oncomplete = function(event) {
            console.log(event);
          alert("All done!");
        };

        transaction.onerror = function(event) {
          // Don't forget to handle errors!
            console.log(event);
        };
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

