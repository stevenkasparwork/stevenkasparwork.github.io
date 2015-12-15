
const DB_NAME = 'helix-ofsc-mobility';
const DB_VERSION = 1; // Use a long long for this value (don't use a float)
const DB_STORE_NAME = 'activities';
const OFSC_API_KEY = 'UWJzZ1AyelNmelhuQkhaY1V6YXlMci9rMUM5SW1kaDNSWDJIV2RmQ3FKUmpYSHMwV3dyWXZUQlQ5OE0zUmJZSg==';
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

        //store.createIndex('id', 'id', { unique: true });
        //store.createIndex('address', 'address', { unique: false });
        //store.createIndex('phone', 'address', { unique: false });
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


    var obj = { external_id: external_id, name: name };
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
function getResource(){
    return return new Promise(function(resolve, reject) {
        
        /*$.ajax({
            url: "//li617-242.members.linode.com/cgi-bin/controllers/getResources.php",
            data: {
                api_key: OFSC_API_KEY
            },
            type: 'POST'
        }).success(function(data) {
            console.log(data);
        }).error(function(error){
            console.log(error);
        });*/
        resolve({
            name: 'Steven Kaspar',
            external_id: 'STEVENKASPAR'
        });
    });
}
function getActivities(){
    return return new Promise(function(resolve, reject) {
        
        /*$.ajax({
            url: "//li617-242.members.linode.com/cgi-bin/controllers/getResources.php",
            data: {
                api_key: OFSC_API_KEY
            },
            type: 'POST'
        }).success(function(data) {
            console.log(data);
        }).error(function(error){
            console.log(error);
        });*/
        resolve({
            id: '333333',
            address: '374 N Highland St',
            zip: '38122',
            state: 'Tennessee',
            time_from: '08:00:00',
            time_to: '11:00:00'
        });
    });
}


getResource().then(function(resource) {
    console.log(resource);
    return getActivities();
}).then(function(activites) {
    console.log(activites);
    console.log('open db');
    return openDb();
}).catch(function(err) {
    console.log('error in db');
    return false;
});

















