
const DB_NAME = 'helix-ofsc-mobility';
const DB_VERSION = 6; // Use a long long for this value (don't use a float)

const DB_ACTIVITY_STORE_NAME = 'activities';
const DB_STATUS_QUEUE_STORE_NAME = 'status_queue';
const DB_RESOURCE_STORE_NAME = 'resources';

const OFSC_API_KEY = 'UWJzZ1AyelNmelhuQkhaY1V6YXlMci9rMUM5SW1kaDNSWDJIV2RmQ3FKUmpYSHMwV3dyWXZUQlQ5OE0zUmJZSg==';
var db;

var Helix = {
    activities: [],
    resource: {},
    activity_details: {},
    options: {
        status: [
            {
                label: 'pending',
                value: 'pending'
            },
            {
                label: 'started',
                value: 'started'
            }, 
            {
                label: 'cancelled',
                value: 'cancelled'
            }, 
            {
                label: 'completed',
                value: 'completed'
            }
        ]
    }
}

/*
    opens up our IndexedDB and sets a global variable db
    so that we can access the Database later and make changes as necessary
    This also will check to see if we are needing to upgradethe db
*/
function openDb() {
    console.log("...open local db...");
    return new Promise(function(resolve, reject) {
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = function (evt) {
            //console.log(evt);
            db = this.result;
            console.log(db);
            resolve(db);
        };
        req.onerror = function (evt) {
            console.error("openDb:", evt.target.errorCode);
            reject(evt);
        };

        req.onupgradeneeded = function (evt) {
            //alert("openDb.onupgradeneeded");
            
            db = evt.target.result;
            
            if(db.objectStoreNames.contains(DB_RESOURCE_STORE_NAME)){
                db.deleteObjectStore(DB_RESOURCE_STORE_NAME);
            } 
            var store = db.createObjectStore(DB_RESOURCE_STORE_NAME, { keyPath: 'id', autoIncrement: false });
            
            if(db.objectStoreNames.contains(DB_ACTIVITY_STORE_NAME)){
                db.deleteObjectStore(DB_ACTIVITY_STORE_NAME);
            } 
            var store = db.createObjectStore(DB_ACTIVITY_STORE_NAME, { keyPath: 'id', autoIncrement: false });
            
            if(db.objectStoreNames.contains(DB_STATUS_QUEUE_STORE_NAME)){
                db.deleteObjectStore(DB_STATUS_QUEUE_STORE_NAME);
            } 
            var store = db.createObjectStore(DB_STATUS_QUEUE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            
            //store.createIndex('id', 'id', { unique: true });
            //store.createIndex('address', 'address', { unique: false });
            
            db.onversionchange = function(event) {
                alert('Your app has been updated please refresh the page');
                resolve(this.result);
            };
            db.onsuccess = function(e){
                console.log(e);
                
            }
            
            
            


        };
    });
}

/**
* @param {string} store_name
* @param {string} mode either "readonly" or "readwrite"
*/
function getObjectStore(store_name, mode) {
    console.log("...get store object: "+store_name+"...");
    var tx = db.transaction(store_name, mode);
    return tx.objectStore(store_name);
}

/**
* @param {string} store_name
* will empty the contents of the indexedDb.DB_NAME.store_name
* be carefull with this
*/
function clearObjectStore(store_name) {
    console.log("...clear object store: "+store_name+"...");
    return new Promise(function(resolve, reject){
        
        var store = getObjectStore(store_name, 'readwrite');
        var req = store.clear();
        req.onsuccess = function(evt) {
            resolve(evt);
        };
        req.onerror = function (err) {
            reject(err);
        };
        
    });
}


/**
* @param {obj} evt
*/
function addActivity(evt) {
    console.log("...add activity...");

    var store = getObjectStore(DB_ACTIVITY_STORE_NAME, 'readwrite');
    
    var d = new Date();
    var date_string = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();

    var obj = {
        id: '0',
        date: date_string,
        appt_number: '333',
        address: '374 N Highland St',
        zip: '38122',
        state: 'Tennessee',
        time_from: '08:00:00',
        time_to: '11:00:00',
        status: 'complete'
    };

    addObjectsToIndexedDB(DB_ACTIVITY_STORE_NAME, [obj]);

};

/**
* Placeholder for the API call that will get resource information from an external system
*/
function getResource(){
    console.log('...get resource from ofsc (dummy)...');
    return new Promise(function(resolve, reject) {
        
        /*$.ajax({
            url: "//li617-242.members.linode.com/cgi-bin/controllers/getResources.php",
            data: {
                api_key: OFSC_API_KEY
            },
            type: 'POST'
        }).success(function(data) {
        
            localStorage.setItem('resource_id', data.resource.external_id );
            console.log(data);
        }).error(function(error){
            console.log(error);
        });*/
        var resource = {
            name: 'Steven Kaspar',
            external_id: 'skaspar'
        };
        localStorage.setItem('resource_id', resource.external_id );
        resolve(resource);
    });
}
/**
* gets activity info from helixsxd.com using the local storage resource_id
*/
function getActivitiesFromOFSC(){
    console.log('...get activities from ofsc...');
    return new Promise(function(resolve, reject) {
        
        $.ajax({
            url: "//helixsxd.com/service_workers/controllers/getActivities.php",
            data: {
                api_key: OFSC_API_KEY,
                resource_id: localStorage.getItem('resource_id')
            },
            type: 'POST'
        }).success(function(response) {
            response = JSON.parse(response);
            //console.log(response.data.activities);
            resolve(response.data.activities);
        }).error(function(error){
            //console.warn('need to get activities straight from indexedDB');
            reject('no internet connection');
            
        });
    });
}


/**
* @param {array} activites
* Builds out an array of activities to be added to the store
* This isn't really necessary now but could be in the future
*/
function addActivitiesToIndexedDB(activities){
    console.log('...add activities to local db...');
    
    var activity_array = [];

    for(var i in activities){
        //console.log(activities[i]);
        
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

function syncLocalActivitiesWithOFSC(){
    return new Promise(function(resolve, reject){
        
        var get_activities = getActivitiesFromIndexedDb();
        get_activities.then(function(activities){
            var promise_array = [];
            promise_array = activities.map(function(obj){
                return new Promise(function(resolve_2, reject_2){
                    // create an array of promises. Each item to insert gets its own promise.
                    // the array of promises will be evaluated as a group below in Promise.all()
                    console.log(obj);
                    if(obj.dirty){
                        console.warn('object is dirty');
                        var tmp_activity = {}; 
                        tmp_activity.properties = obj.map(function(o){ return o; });
                        tmp_activity.activity_id = obj.id;
                        console.log(tmp_activity);
                        
                        updateActivityInOFSC(tmp_activity).then(function(response){ 

                            return getIndexedDBActivityByID( response.data.activity_id );
                            
                        }).catch(function(response){ 

                            console.warn(response);
                            reject_2('failed to update activity in ofsc');
                            
                        }).then(function(activity){

                            return removeDirtyBitFromLocalDBObject(store_name, activity.id);

                        }).then(function(response){
                            
                            resolve_2('dirty object has been updated in ofsc and local db dirty bit removed');
                            
                        }).catch(function(msg){ 

                            console.warn(msg);
                            
                            reject_2('failed to update activity in ofsc');
                            
                        });
                        
                        
                    }
                    else {
                        resolve_2('clean object');
                    }
                });
            });
            return Promise.all(promise_array).then(function(value){
                //console.log(value);
                //console.log(promise_array);
                resolve('local db is in sync with ofsc');
            }).catch(function(err){
                reject(err);
            });
        });
        
    });
    
}
                             


/**
* @param {string} store_name
* @param {array} obj_array
* adds all objects in the obj_array to the db.store_name
*/
function addObjectsToIndexedDB(store_name, obj_array){
    console.log('...add objects to local db...');
    var promise_array = [];
    return new Promise(function(resolve, reject){
        promise_array = obj_array.map(function(obj){
            
            // create an array of promises. Each item to insert gets its own promise.
            // the array of promises will be evaluated as a group below in Promise.all()
             return new Promise(function(resolve, reject){
                    
                 // need to get the transaction and store for adding to the local db
                var store = getObjectStore(store_name, 'readwrite'), req;

                // using put instead of add because put will update if the key index exists
                req = store.put(obj);

                req.onsuccess = function (evt) {
                    localStorage.setItem('local_indexeddb_last_update', new Date().getTime() );
                    resolve(evt);
                };
                req.onerror = function(evt) {
                    console.warn(evt);
                    reject('could not add to local db');
                };

            });
        });
        return Promise.all(promise_array).then(function(value){
            //console.log(value);
            //console.log(promise_array);
            resolve('finished adding to local db');
        }).catch(function(err){
            reject(err);
        });
    });
}

/**
* @param {string} store_name
* @param {string} key
* set the local object's dirty bit to 0
*/
function removeDirtyBitFromLocalDBObject(store_name, key){
    console.log('...remoce diry bit from local db object: '+key+'...');
    
    return new Promise(function(resolve, reject){
        // need to get the transaction and store for adding to the local db
        var store = getObjectStore(store_name, 'readwrite');
        var get_object_from_store = store.get(key);
        
        get_object_from_store.onerror = function(err) {
            // Handle errors!
            console.warn(err);
            reject(err);
        };
        get_object_from_store.onsuccess = function(event) {
            // Do something with the request.result!
            get_object_from_store.result.dirty = 0;
            
            // necessary because the way onsuccess works
            var store_1 = getObjectStore(store_name, 'readwrite');
            var put_object_in_store_1 = store_1.put(get_object_from_store.result);
            
            put_object_in_store_1.onerror = function(err) {
                // Handle errors!
                console.warn(err);
                reject(err);
            };
            put_object_in_store_1.onsuccess = function(event) {
                localStorage.setItem('local_indexeddb_last_update', new Date().getTime() );
                resolve(event);
            };
            
        };
        
    })
    
}


/**
* @param {string} store_name
* @param {string} key
* check to see if object is dirty
*/
function checkIfObjectIsDirty(store_name, key){
    console.log('...check if object is dirty...');
    return new Promise(function(resolve, reject){

        var store = getObjectStore(store_name, 'readwrite');
        
        var req = store.get(key);
        
        req.onerror = function(err) {
            // Handle errors!
            console.warn(err);
            reject(err);
        };
        req.onsuccess = function(event) {
            // Do something with the request.result!
            if(req.result){
                if(req.result.dirty === 1){
                    resolve(req.result.id);
                }
                else {
                    resolve(false);
                }
            }
            else {
                resolve(false);
            }
        };
    });
    
}

/**
* gets all activities from the local IndexedDB
*/
function getActivitiesFromIndexedDb(){
    console.log('...get activities from indexed db...');
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
                Helix.activities = activities;
                resolve(activities);
            }
        };
    });
    
}

/**
* @param {string} model_name
* Placeholder function for updating the view.
* Helix[model_name] must be an array
*/
function updateHelixTable(model_name){
    console.log('...update helix table...');
    var header_cells = '';
    
    var items_string = Helix[model_name].map(function(item, index){
        var item_string = '';
        
        for(var i in item){
            if(index === 0){
                header_cells += '<th>'+i+'</th>';
            }
            item_string += '<td>'+item[i]+'</td>';
        }
        
        
        return '<tr style="cursor: pointer;" onclick="navigateWithParameters({\'id\':'+item.id+'},\'detail.html\');">'+item_string+'</tr>';
    }).join("");
    
    $('[helix-model="'+model_name+'"]').html('<tr>'+header_cells+'</tr>'+items_string); 
    
}

/**
* @param {obj} param_obj
* @param {string} page
* Sets localStorage(param_obj.key, param_obj.value), then
* navigates to page
*/
function navigateWithParameters(param_obj, page){
    for(var i in param_obj){
        localStorage.setItem(i, param_obj[i]);
    }
    window.location.href = page;
}


/**
* @param {string} model_name
* Placeholder function for updating the view.
* Helix[model_name] must be an object
*/
function updateHelixList(model_name, editable){
    console.log('...update helix list...');
    if(!editable){editable = '';}
    console.log(editable);
    
    var item_string = '';
    
    for(var i in Helix[model_name]){
        var li_content = '';
        if(editable.indexOf(i) > -1 ){
            if(Helix.options[i]){
                li_content += '<select onchange="updateActivity(event);" id="'+i+'">'+Helix.options[i].map(function(option){
                    if(option.value === Helix[model_name][i]){
                        return '<option value="'+option.value+'" selected> '+option.label+'</option>';
                    }
                    else {
                        return '<option value="'+option.value+'" > '+option.label+'</option>';
                    }
                    
                    
                }).join('')+'</select>';
            }
            else {
                li_content += '<input value="'+Helix[model_name][i]+'" onblur="updateActivity(event);" id="'+i+'">';
            }
        }
        else {
            li_content = Helix[model_name][i];
        }
        
        
        item_string += '<li>'+i+': '+li_content+'</li>';
    }
        
    
    $('[helix-model="'+model_name+'"]').html(item_string); 
    
}

function updateActivity(event) {
    console.log('...update activity...');
    
    
    // changed the updated field
    Helix.activity_details[event.target.id] = event.target.value;
    // add a dirty bit so we know it is not in sync
    Helix.activity_details['dirty'] = 1;
    console.log(Helix.activity_details);
    var update_local_db = updateActivityInLocalDB(Helix.activity_details);
    update_local_db.then(function(activity){
        
        var tmp_activity = {};
        // put in properties object 
        tmp_activity.properties = activity;
        // set the activity_id so that the api knows which activity to update
        tmp_activity.activity_id = activity.id;
        
        return updateActivityInOFSC(tmp_activity);
    }).then(function(response){
        console.log(response);
        // set dirty bit to 0 since we just updated ofsc
        Helix.activity_details['dirty'] = 0;
        
        return updateActivityInLocalDB(Helix.activity_details);
        
    }).then(function(response){
        
        console.log('activity has been updated locally and in ofsc');
        
    }).catch(function(response){
        
        console.warn(response);
        
    });
}

function updateActivityInLocalDB(activity){
    console.log('...update activity in local db...');
    console.log(activity);
    return new Promise(function(resolve, reject){
        
        var add_to_local_db = addObjectsToIndexedDB(DB_ACTIVITY_STORE_NAME, [activity]);
        add_to_local_db.then(function(response){
            console.log(response);
            resolve(activity);
            
        }).catch(function(err){
            //console.warn(err);
            reject(err);
        });
        
    })
    
}

/**
* update OFSC with activity fields that have been changed
*/
function updateActivityInOFSC(activity){
    console.log('...update activity in ofsc...');
    return new Promise(function(resolve, reject) {
        
        $.ajax({
            url: "//helixsxd.com/service_workers/controllers/updateActivity.php",
            data: {
                api_key: OFSC_API_KEY,
                activity: activity
            },
            type: 'POST'
        }).success(function(response) {
            response = JSON.parse(response);
            resolve(response);
        }).error(function(error){
            console.warn(error);
            reject('call to update activity was unsuccesfull');
        });
    });
}


function formatTime(n){
    return n > 9 ? "" + n: "0" + n;
}

function getDateTimeString(){
    var d = new Date();
    
    var year = d.getFullYear();
    var month = formatTime( d.getMonth() + 1 );
    var date = formatTime(d.getDate());
    
    var hours = formatTime(d.getHours());
    var minutes = formatTime(d.getMinutes());
    var seconds = formatTime(d.getSeconds());
    
    return {
        time: hours + ":" + minutes + ":" + seconds,
        date: year + "-" + month + "-" + date,
        date_time: date_string + " " + time_string
    };
}

function statusActivity(status){
    console.log('...status activity: '+status+'...');
    console.log( Helix.activity_details );
    
    var time_strings = getDateTimeString();
    
    Helix.activity_details.status = status;
    Helix.activity_details.start_time = time_strings.date_time;
    // add a dirty bit so we know it is not in sync
    Helix.activity_details['dirty'] = 1;
    var status_object = {};
    
    var update_local_db = updateActivityInLocalDB(Helix.activity_details);
    update_local_db.then(function(activity){
        
        status_object = {
            status: status,
            activity_id: activity.id,
            date: time_strings.date,
            time: time_strings.date_time
        };
        
        return updateStatusInOFSC(status_object);
        
    }).then(function(response){
        console.log(response);
        // set dirty bit to 0 since we just updated ofsc
        Helix.activity_details['dirty'] = 0;
        
        return updateActivityInLocalDB(Helix.activity_details);
        
    }).catch(function(status_object){
        
        console.warn(status_object);
        // need to queue the status_object for when we get connection back
        return addStatusObjectToQueue(status_object);
        
    }).then(function(response){
        
        console.log('activity has been updated locally and in ofsc');
        
    }).catch(function(msg){
        
        console.warn(msg);
        
    });
}

function addStatusObjectToQueue(status_object) {
    console.log('...add status to local db queue...');
    return new Promise(function(resolve, reject){
        var store = getObjectStore(DB_STATUS_QUEUE_STORE_NAME, 'readwrite');

        var req = store.put(status_object);

        req.onsuccess = function (evt) {
            console.log(status_object);
            resolve('...status_object has been added to status queue...');
        };
        req.onerror = function(err) {
            reject(err);
        };
    });
}



function updateStatusInOFSC(status_object){
    console.log('...update status in ofsc...');
    return new Promise(function(resolve, reject) {
        
        $.ajax({
            url: "//helixsxd.com/service_workers/controllers/statusActivity.php",
            data: {
                api_key: OFSC_API_KEY,
                status_object: status_object
            },
            type: 'POST'
        }).success(function(response) {
            response = JSON.parse(response);
            console.log(response);
            resolve(response);
        }).error(function(error){
            //console.log(error);
            console.warn(error);
            // rejecting with status_object so that we can add it to the queue cleaner
            reject(status_object);
        });
    });
}


function getIndexedDBActivityByID(id){
    console.log('...get activity from local db...');
    return new Promise(function(resolve, reject){
        
        var store = getObjectStore(DB_ACTIVITY_STORE_NAME, 'readwrite');

        var req = store.get(id);

        req.onsuccess = function(event) {
            console.log(event);

            console.log(req.result);
            
            resolve(req.result);
        };
        req.onerror = function(err) {
            reject(err);
        }; 
    });
}

function getUrlParam(param) {
    console.log('...get url param: '+param+'...');
    var urlParamString = location.search.split(param + "=");
    if (urlParamString.length <= 1) return false;
    else {
        var tmp = urlParamString[1].split("&");
        return tmp[0];
    }
}

function isStatusQueue(){
    console.log('...check status queue...');
    return new Promise(function(resolve, reject){

        var store = getObjectStore(DB_STATUS_QUEUE_STORE_NAME, 'readwrite');
        var statuses = [];

        store.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                statuses.push(cursor.value);
                cursor.continue();
            }
            else {
                resolve(statuses);
            }
        };
    });
}

function sendStatusQueue(){
    return new Promise(function(resolve, reject){
        
        var check_status_queue = isStatusQueue();
        
        check_status_queue.then(function(statuses){
            if(statuses.length){
                promise_array = statuses.map(function(obj){

                    // create an array of promises. Each item to insert gets its own promise.
                    // the array of promises will be evaluated as a group below in Promise.all()
                    return new Promise(function(resolve, reject) {

                        $.ajax({
                            url: "//helixsxd.com/service_workers/controllers/statusActivity.php",
                            data: {
                                api_key: OFSC_API_KEY,
                                status_object: obj
                            },
                            type: 'POST'
                        }).success(function(response) {
                            response = JSON.parse(response);
                            console.log(response);
                            resolve(response);
                        }).error(function(error){
                            //console.log(error);
                            console.warn('activity did not update need to queue status update in localStorage');
                            reject(error);
                        });
                    });

                });

                return Promise.all(promise_array).then(function(value){
                    
                    var clear_status_queue = clearObjectStore(DB_STATUS_QUEUE_STORE_NAME);
                    
                    clear_status_queue.then(function(response){
                        resolve('...updated all statuses to ofsc and cleared local queue...');
                    });
                    
                }).catch(function(err){
                    
                    console.warn(err);
                    reject(err);
                    
                });
            }
            else {
                resolve('...no statuses in queue...');
            }
        });
    });
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
            console.log('------ begin initialization -----');
            openDb().then(function(evt){ // send statuses
                
                console.log();
                return sendStatusQueue();

            }).then(function(response) { // get resource from ofsc
                
                console.log(response);
                return getResource();

            }).then(function(resource) { // sync activities

                //console.log(resource);
                return syncLocalActivitiesWithOFSC();

            }).then(function() { // get the activities using the resource from local storage

                //console.log(resource);
                return getActivitiesFromOFSC();

            }).then(function(activities) { // add the activities to the local db

                //console.log(activities);
                return addObjectsToIndexedDB(DB_ACTIVITY_STORE_NAME, activities);
                
            }).catch(function(err) {
                
                console.warn(err);
                
            }).then(function() { 

                return getActivitiesFromIndexedDb();

            }).then(function(activities) { // update the view
                updateHelixTable('activities');
                console.log('------ end of initialization -----');
                return true;

            });
            
            break;
        case 'detail.html':
            console.log('..on detail page..');
            var id = localStorage.getItem('id');
            console.log(id);
            if(id) {
                openDb().then(function(evt){
                    return getIndexedDBActivityByID( id );
                }).then(function(activity){
                    Helix.activity_details = activity;
                    updateHelixList('activity_details', 'address,name');
                });
            }
            else {
                console.warn('No id in local storage');
            }
            
            break;

            
    }
}




//initializePage();





















