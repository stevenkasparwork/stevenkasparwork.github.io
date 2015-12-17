
const DB_NAME = 'helix-ofsc-mobility';
const DB_VERSION = 3; // Use a long long for this value (don't use a float)

const DB_ACTIVITY_STORE_NAME = 'activities';
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
            resolve(db);
        };
        req.onerror = function (evt) {
            console.error("openDb:", evt.target.errorCode);
            reject(evt);
        };

        req.onupgradeneeded = function (evt) {
            alert("openDb.onupgradeneeded");
            //var store = evt.currentTarget.result.createObjectStore(DB_RESOURCE_STORE_NAME, { keyPath: 'id', autoIncrement: false });
            evt.currentTarget.result.deleteObjectStore(DB_ACTIVITY_STORE_NAME);
            var store = evt.currentTarget.result.createObjectStore(DB_ACTIVITY_STORE_NAME, { keyPath: 'id', autoIncrement: false });
            
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
        status: 'completed'
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
            name: 'Kevin Sherwood',
            external_id: 'KEVINSHERWOOD'
        };
        localStorage.setItem('resource_id', resource.external_id );
        resolve(resource);
    });
}
/**
* gets activity info from helixsxd.com using the local storage resource_id
*/
function getActivities(){
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
            resolve(response.data.activities);
        }).error(function(error){
            //console.log(error);
            console.warn('need to get activities straight from indexedDB');
            
            var p = getActivitiesFromIndexedDb();
            p.then(function(response){
                updateHelixTable('activities');
            });
        });
    });
}



/**
* @param {string} resource
* Puts a single resource object to the db.DB_RESOURCE_STORE_NAME
* NOT USING ANYMORE BECAUSE WE ARE GOING TO USE LOCAL STORAGE
*/
function addResourceToIndexedDB(resource){
    console.log('...add resource to local db...');
    
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
    console.log('...add activities to local db...');
    
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
    console.log('...add objects to local db...');
    var promise_array = [];
    return new Promise(function(resolve, reject){
        promise_array = obj_array.map(function(obj){
            
            // create an array of promises. Each item to insert gets its own promise.
            // the array of promises will be evaluated as a group below in Promise.all()
             return new Promise(function(resolve, reject){

                // first we need to check if the object in the local db is dirty and out of sync
                var dirty_check_promise = checkIfObjectIsDirty(store_name, obj.id); 
                
                dirty_check_promise.then(function(id){

                    if(id){
                        console.warn('object is dirty');
                        var local_activity = {}, tmp_activity = {};
                        
                        // get the local dirty copy and copy it over so we can send it to ofsc
                        var get_local_dirty_activity = getIndexedDBActivityByID( id );
                        get_local_dirty_activity.then(function(activity){
                            local_activity = activity;
                            
                            // put in properties object 
                            tmp_activity.properties = local_activity;
                            // set the activity_id so that the api knows which activity to update
                            tmp_activity.activity_id = local_activity.id;

                            console.log(tmp_activity);

                            return updateActivityInOFSC(tmp_activity);
                            
                        }).then(function(response){ 
                            
                            console.log(response);
                            return getIndexedDBActivityByID( response.data.activity_id );
                            
                        }).catch(function(response){ 
                            
                            console.warn(response);
                            reject('failed to update activity in ofsc');
                            
                        }).then(function(activity){
                            
                            return removeDirtyBitFromLocalDBObject(store_name, activity.id);
                            
                        }).then(function(response){
                            console.log('dirty object has been update in ofsc and local db dirty bit removed');
                            resolve();
                        });
                        
                        
                    }
                    else {
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
                        
                    }
                    
                });

            });
        })
        return Promise.all(promise_array).then(function(value){
            //console.log(value);
            console.log(promise_array);
            resolve('finished adding to local db');
        },
                                              function(err){
            console.warn(err);
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
    }).catch(function(response){
        
        console.warn(response);
        
    }).then(function(response){
        console.log(response);
        // set dirty bit to 0 since we just updated ofsc
        Helix.activity_details['dirty'] = 0;
        
        return updateActivityInLocalDB(Helix.activity_details);
        
    }).catch(function(response){
        
        console.warn(response);
        
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
            console.warn(err);
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

function statusActivity(status){
    console.log('...status activity: '+status+'...');
    console.log( Helix.activity_details );
    
    var d = new Date();
    
    var year = d.getFullYear();
    var month = d.getMonth() + 1;
    month = (month.length < 2) ? '0'+month.toString() : month;
    var date = (d.getDate().length < 2) ? '0'+d.getDate().toString() : d.getDate();
    
    var hours = (d.getHours().length < 2) ? '0'+d.getHours().toString() : d.getHours();
    var minutes = (d.getMinutes().length < 2) ? '0'+d.getMinutes().toString() : d.getMinutes();
    var seconds = (d.getSeconds().length < 2) ? '0'+d.getSeconds().toString() : d.getSeconds();
    
    
    var date_string = year + "-" + month + "-" + date;
    var time_string = hours + ":" + minutes + ":" + seconds;
    var date_time_string = date_string + " " + time_string;
    
    
    Helix.activity_details.status = status;
    Helix.activity_details.start_time = date_time_string;
    // add a dirty bit so we know it is not in sync
    Helix.activity_details['dirty'] = 1;
    
    var update_local_db = updateActivityInLocalDB(Helix.activity_details);
    update_local_db.then(function(activity){
        
        var status_object = {
            status: status,
            activity_id: activity.id,
            date: date_string,
            time: date_time_string
        }
        
        return updateStatusInOFSC(status_object);
        
    }).catch(function(response){
        
        console.warn(response);
        
    }).then(function(response){
        console.log(response);
        // set dirty bit to 0 since we just updated ofsc
        Helix.activity_details['dirty'] = 0;
        
        return updateActivityInLocalDB(Helix.activity_details);
        
    }).catch(function(response){
        
        console.warn(response);
        
    }).then(function(response){
        
        console.log('activity has been updated locally and in ofsc');
        
    }).catch(function(response){
        
        console.warn(response);
        
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
            resolve(response);
        }).error(function(error){
            //console.log(error);
            console.warn('activity did not update need to queue status update in localStorage');
            reject(error);
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

/**
* Since we are loading all javascript files FOR NOW, we need to differentiate 
* by getting what page we are on
*/
function initializePage(){
    
    var path = window.location.pathname;
    var page = path.split("/").pop();
    
    switch(page){
        case 'index.html':
            console.log('..on index page..');
            /* 
            openDB() 
            -> getResource() 
            -> addResourceToIndexedDb() 
            -> getActivities() 
            -> addObjectsToIndexedDB() 
            -> getActivitiesFromIndexedDb() 
            -> updateHelixTable('activities')
            */
            openDb().then(function(evt){ // get resource from ofsc

                //console.log(evt);
                return getResource();

            }).then(function(resource) { // get the activities using the resource from local storage

                //console.log(resource);
                return getActivities();

            }).then(function(activities) { // add the activities to the local db

                //console.log(activities);
                return addObjectsToIndexedDB(DB_ACTIVITY_STORE_NAME, activities);

            }).then(function(msg) { // get the activities from the local db

                console.log(msg);
                return getActivitiesFromIndexedDb();

            }).then(function(activities) { // update the view
                updateHelixTable('activities');
                return true;

            }).catch(function(err) {

                console.log('error in initialization');
                console.log(err);
                return false;

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
                    updateHelixList('activity_details', 'status,address,name');
                });
            }
            else {
                console.warn('No id in local storage');
            }
            
            break;

            
    }
}

initializePage();





















