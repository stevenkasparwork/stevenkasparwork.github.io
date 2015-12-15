
const DB_NAME = 'helix-ofsc-mobility';
const DB_VERSION = 2; // Use a long long for this value (don't use a float)

const DB_ACTIVITY_STORE_NAME = 'activities';
const DB_RESOURCE_STORE_NAME = 'resources';

const OFSC_API_KEY = 'UWJzZ1AyelNmelhuQkhaY1V6YXlMci9rMUM5SW1kaDNSWDJIV2RmQ3FKUmpYSHMwV3dyWXZUQlQ5OE0zUmJZSg==';
var db;

var Helix = {
    activities: [],
    resource: {}
}

/*
    opens up our IndexedDB and sets a global variable db
    so that we can access the Database later and make changes as necessary
    This also will check to see if we are needing to upgradethe db
*/
function openDb() {
    return new Promise(function(resolve, reject) {
        console.log("openDb ...");
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = function (evt) {
            console.log(evt);
            db = this.result;
            resolve(db);
        };
        req.onerror = function (evt) {
            console.error("openDb:", evt.target.errorCode);
            reject(evt);
        };

        req.onupgradeneeded = function (evt) {
            alert("openDb.onupgradeneeded");
            //var store = evt.currentTarget.result.createObjectStore(DB_RESOURCE_STORE_NAME, { keyPath: 'id', autoIncrement: false });
            var store = evt.currentTarget.result.createObjectStore(DB_ACTIVITY_STORE_NAME, { keyPath: 'appt_number', autoIncrement: false });
            
            //store.createIndex('id', 'id', { unique: true });
            //store.createIndex('address', 'address', { unique: false });
            
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

/**
* @param {string} store_name
* will empty the contents of the indexedDb.DB_NAME.store_name
* be carefull with this
*/
function clearObjectStore(store_name) {
    var store = getObjectStore(store_name, 'readwrite');
    var req = store.clear();
    req.onsuccess = function(evt) {
        console.log(evt);
    };
    req.onerror = function (evt) {
        console.log(evt);
    };
}


/**
* @param {obj} evt
* NOT IN USE
*/
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

/**
* Placeholder for the API call that will get resource information from an external system
*/
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
/**
* Placeholder for the API call that will get activity information from an external system
*/
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
        var d = new Date();
        var date_string = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
        resolve([{
            id: '0',
            date: date_string,
            appt_number: '333',
            address: '374 N Highland St',
            zip: '38122',
            state: 'Tennessee',
            time_from: '08:00:00',
            time_to: '11:00:00'
        },{
            id: '1',
            date: date_string,
            appt_number: '444',
            address: '374 N Highland St',
            zip: '38122',
            state: 'Tennessee',
            time_from: '11:30:00',
            time_to: '12:45:00'
        },{
            id: '2',
            date: date_string,
            appt_number: '555',
            address: '374 N Highland St',
            zip: '38122',
            state: 'Tennessee',
            time_from: '14:00:00',
            time_to: '16:00:00'
        },{
            id: '3',
            date: date_string,
            appt_number: '667',
            address: '333 N Highland St',
            zip: '38122',
            state: 'Tennessee',
            time_from: '14:00:00',
            time_to: '16:00:00'
        },{
            id: '4',
            date: date_string,
            appt_number: '777',
            address: '333 N Highland St',
            zip: '38122',
            state: 'Tennessee',
            time_from: '14:00:00',
            time_to: '16:00:00'
        },{
            id: '5',
            date: date_string,
            appt_number: '888',
            address: '321 N Highland St',
            zip: '38122',
            state: 'Tennessee',
            time_from: '14:00:00',
            time_to: '16:00:00'
        }]);
    });
}


/**
* @param {string} resource
* Puts a single resource object to the db.DB_RESOURCE_STORE_NAME
*/
function addResourceToIndexedDB(resource){
    
    var store = getObjectStore(DB_RESOURCE_STORE_NAME, 'readwrite');
    var req, obj;

    obj = {
        external_id: resource.external_id,
        name: resource.name,
    };
    
    req = store.put(obj);
    
    req.onsuccess = function (evt) {
        console.log("Resource insertion in DB successful");
    };
    req.onerror = function() {
        // a constraint error can be thrown when duplicating an insert, so for now we will ignore it
        if(this.error.name !== "ConstraintError"){
            console.error("add error", this.error);
        }
    };
    
}

/**
* @param {array} activites
* Builds out an array of activities to be added to the store
* This isn't really necessary now but could be in the future
*/
function addActivitiesToIndexedDB(activities){
    
    var activity_array = [];

    for(var i in activities){
        console.log(activities[i]);
        
        activity_array.push({
            id: activities[i].id,
            date: activities[i].date,
            appt_number: activities[i].appt_number,
            address: activities[i].address,
            zip: activities[i].zip,
            state: activities[i].state,
            time_from: activities[i].time_from,
            time_to: activities[i].time_to,
        });
        
    } 
    addObjectsToIndexedDB(DB_ACTIVITY_STORE_NAME, activity_array);
}

/**
* @param {string} store_name
* @param {array} obj_array
* recursively adds all objects in the obj_array to the db.store_name
*/
function addObjectsToIndexedDB(store_name, obj_array){
    return new Promise(function(resolve, reject){

        // need to get the transaction and store for adding to the db
        var store = getObjectStore(store_name, 'readwrite'), req;

        if(obj_array.length > 0){

            // using put instead of add because put will update if the key index exists
            req = store.put(obj_array[0]);

            req.onsuccess = function (evt) {
                resolve(evt);
                addObjectsToIndexedDB(store_name, obj_array.splice(1));
            };
            req.onerror = function(evt) {
                console.log(evt);
                console.log(this);

                addObjectsToIndexedDB(store_name, obj_array.splice(1))
            };
        }
        else {
            resolve('obj_array empty');
        }
        
    });
    
}

/**
* gets all activities from the local IndexedDB
*/
function getActivitiesFromIndexedDb(){
    return new Promise(function(resolve, reject){

        var store = getObjectStore(DB_ACTIVITY_STORE_NAME, 'readwrite');
        var activities = [];

        store.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                activities.push(cursor.value);
                cursor.continue();
            }
            else {
                console.log(activities);
                Helix.activities = activities;
                resolve(activities);
            }
        };
    });
    
}

/**
* Placeholder function for updating the view.
*/
function updateHelixModel(model_name){
    console.log(Helix[model_name]);
    var header_cells = '';
    
    var items_string = Helix[model_name].map(function(item, index){
        var item_string = '';
        
        for(var i in item){
            if(index === 0){
                header_cells += '<th>'+i+'</th>';
            }
            item_string += '<td>'+item[i]+'</td>';
        }
        
        
        return '<tr style="cursor: pointer;" onclick=" localStorage.setItem(\'appt_number\', '+item.appt_number+'); window.location.href = \'detail.html\'">'+item_string+'</tr>';
    }).join("");
    
    $('[helix-model="'+model_name+'"]').html('<tr>'+header_cells+'</tr>'+items_string); 
    
}

function getIndexedDBActivityByApptNumber(appt_number){
    
    var store = getObjectStore(DB_ACTIVITY_STORE_NAME, 'readwrite');
    
    var req = store.get(appt_number);

    req.onsuccess = function(event) {
        console.log(event);
        
        console.log(req.result);
    };
}

function getUrlParam(param) {
    var urlParamString = location.search.split(param + "=");
    if (urlParamString.length <= 1) return false;
    else {
        var tmp = urlParamString[1].split("&");
        return tmp[0];
    }
}

/**
* Since we are loading all javascript files FOR NOW, we need to differentiate 
* by getting what page we are on
*/
function initializePage(){
    
    var path = window.location.pathname;
    var page = path.split("/").pop();
    
    switch(page){
        case 'index.html':
            console.log('on index page');
            /* 
            openDB() 
            -> getResource() 
            -> addResourceToIndexedDb() 
            -> getActivities() 
            -> addObjectsToIndexedDB() 
            -> getActivitiesFromIndexedDb() 
            -> updateHelixModel('activities')
            */
            openDb().then(function(evt){

                console.log(evt);
                return getResource();

            }).then(function(resource) {

                console.log(resource);
                addResourceToIndexedDB(resource);

                return getActivities();

            }).then(function(activities) {

                console.log(activities);
                return addObjectsToIndexedDB(DB_ACTIVITY_STORE_NAME, activities);

            }).then(function(msg) {

                console.log(msg);
                return getActivitiesFromIndexedDb();

            }).then(function(activities) {
                updateHelixModel('activities');
                return true;

            }).catch(function(err) {

                console.log('error in initialization');
                console.log(err);
                return false;

            });
            break;
        case 'detail.html':
            console.log('on detail page');
            var appt_number = localStorage.getItem('appt_number');
            console.log(appt_number);
            if(appt_number) {
                openDb().then(function(evt){
                    getIndexedDBActivityByApptNumber( appt_number );
                });
            }
            else {
                console.warn('No appt_number in url');
            }
            
            break;

            
    }
}

initializePage();





















