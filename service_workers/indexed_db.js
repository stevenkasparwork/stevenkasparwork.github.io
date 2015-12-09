
const DB_NAME = 'helix-ofsc-mobility';
const DB_VERSION = 1; // Use a long long for this value (don't use a float)
const DB_STORE_NAME = 'resources';
const OFSC_API_KEY = 'bWV3dWRVcnVEZmpXb3E0Y0ZFUUZtSUgzWk5NM0pVUEdIY3VUaVdiRmE3aFdxRkM4N24va3BBeWJFeGRCcjZ0Zg==';
var db;


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
            var store = evt.currentTarget.result.createObjectStore(DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });

            store.createIndex('external_id', 'external_id', { unique: true });
            store.createIndex('name', 'name', { unique: false });
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
        
        
        var obj = { external_id: external_id, name: name, email: email, phone_number: phone_number };
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
    $.ajax({
        url: "//li617-242.members.linode.com/cgi-bin/controllers/getResources.php",
        data: {
            api_key: OFSC_API_KEY
        },
        type: 'POST'
    }).success(function(data) {
        console.log(data);
    }).error(function(error){
        console.log(error);
    });

  openDb();