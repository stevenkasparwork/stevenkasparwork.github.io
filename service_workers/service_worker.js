
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


  const DB_NAME = 'helix-ofsc-mobility';
  const DB_VERSION = 1; // Use a long long for this value (don't use a float)
  const DB_STORE_NAME = 'resources';

  var db;

  // Used to keep track of which view is displayed to avoid uselessly reloading it
  var current_view_pub_key;

  function openDb() {
    console.log("openDb ...");
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function (evt) {
      // Better use "this" than "req" to get the result to avoid problems with
      // garbage collection.
      // db = req.result;
      db = this.result;
      console.log("openDb DONE");
    };
    req.onerror = function (evt) {
      console.error("openDb:", evt.target.errorCode);
    };

    req.onupgradeneeded = function (evt) {
      console.log("openDb.onupgradeneeded");
      var store = evt.currentTarget.result.createObjectStore(
        DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });

      store.createIndex('external_id', 'external_id', { unique: true });
      store.createIndex('name', 'name', { unique: false });
      store.createIndex('email', 'email', { unique: false });
    };
  }

  /**
   * @param {string} store_name
   * @param {string} mode either "readonly" or "readwrite"
   */
  function getObjectStore(store_name, mode) {
    var tx = db.transaction(store_name, mode);
    return tx.objectStore(store_name);
  }

  function clearObjectStore(store_name) {
    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req = store.clear();
    req.onsuccess = function(evt) {
        console.log(evt);
    };
    req.onerror = function (evt) {
        console.log(evt);
    };
  }


    function addResource(evt) {
      console.log("add ...");
      var external_id = document.getElementById('external_id').value;
      var name = document.getElementById('name').value;
      var email = document.getElementById('email').value;
      //addPublication(biblioid, title, year, selected_file);
        var obj = { external_id: external_id, name: name, email: email };
        var store = getObjectStore(DB_STORE_NAME, 'readwrite');
        var req;
        
        req = store.add(obj);
        req.onsuccess = function (evt) {
          console.log("Insertion in DB successful");
        };
        req.onerror = function() {
          console.error("addPublication error", this.error);
        };

    };


  openDb();

