
const DB_NAME = 'helix-ofsc-mobility';
const DB_VERSION = 1; // Use a long long for this value (don't use a float)

const DB_ACTIVITY_STORE_NAME = 'activities';
const DB_RESOURCE_STORE_NAME = 'resources';

const OFSC_API_KEY = 'UWJzZ1AyelNmelhuQkhaY1V6YXlMci9rMUM5SW1kaDNSWDJIV2RmQ3FKUmpYSHMwV3dyWXZUQlQ5OE0zUmJZSg==';
var db;


function openDb() {
    return new Promise(function(resolve, reject) {
        console.log("openDb ...");
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = function (evt) {
            
            db = this.result;
            resolve(db);
        };
        req.onerror = function (evt) {
            console.error("openDb:", evt.target.errorCode);
            reject(evt);
        };

        req.onupgradeneeded = function (evt) {
            console.log("openDb.onupgradeneeded");
            var store = evt.currentTarget.result.createObjectStore(DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            resolve(this.result);


        };
    });
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
    return new Promise(function(resolve, reject) {
        
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
    return new Promise(function(resolve, reject) {
        
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
function addResourceToIndexedDB(resource){
    
    var store = getObjectStore(DB_RESOURCE_STORE_NAME, 'readwrite');
    var req, obj;

    obj = {
        external_id: resource.external_id,
        name: resource.name,
    };
    
    req = store.add(obj);
    
    req.onsuccess = function (evt) {
        console.log("Resource insertion in DB successful");
    };
    req.onerror = function() {
        console.error("add error", this.error);
    };
    }
    
}
var open_db = openDb();

open_db.then(function(evt){
    
    console.log(evt);
    return getResource();
    
}).then(function(resource) {
    
    console.log(resource);
    addResourceToIndexedDB(resource);
    
    return getActivities();
    
}).then(function(activities) {
    
    console.log(activities);
    return true;
    
}).catch(function(err) {
    
    console.log('error in initialization');
    return false;
    
});

















