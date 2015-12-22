
const DB_NAME = 'helix-ofsc-mobility';
const DB_VERSION = 7; // Use a long long for this value (don't use a float)

const DB_ACTIVITY_STORE_NAME = 'activities';
const DB_STATUS_QUEUE_STORE_NAME = 'status_queue';
const DB_RESOURCE_STORE_NAME = 'resources';
const PAGE_SET = ['home', 'activity_detail']
const VISIBLE_ACTIVITY_FIELDS = ['id','date','status','name','address','zip','state','start_time','end_time','worktype'];
const OFSC_API_KEY = 'UWJzZ1AyelNmelhuQkhaY1V6YXlMci9rMUM5SW1kaDNSWDJIV2RmQ3FKUmpYSHMwV3dyWXZUQlQ5OE0zUmJZSg==';
var db;

/* this is not used for anything but can be used for storing options if */
/* agents are allowed to change other fields that need select lists */
var Helix = {
    options: []
}



window.onload = function(){
    console.log('------ window loaded -----');
    
    /* initially hide all of the views */
    /* the home will be shown when the service worker is ready */
    for(var i in PAGE_SET){
        $('#'+PAGE_SET[i]).hide();
    }
    
    /* set date selector to the last showing date stored in localStorage or to today */
    if( localStorage.getItem('showing_date') ){
        $('#date_selector').val( localStorage.getItem('showing_date') );
    }
    else {
        var showing_date = getDateTimeObject().date;
        
        localStorage.setItem('showing_date', showing_date);
        $('#date_selector').val( showing_date );
    }
    
    document.getElementById('date_selector').onchange = function(event){
        console.log('date changed');
        changeShowingDate( document.getElementById('date_selector').value );
    };
};

function changeShowingDate(date){
    var new_date = getDateTimeObject( date ).date;
        
    localStorage.setItem('showing_date', new_date);

    return getActivitiesFromIndexedDb().then(function(activities) { // update the view
        updateActivityTable('activities', activities, {date: new_date});
    });
}
function stepShowingDate(step){
    var new_date = new Date( localStorage.getItem('showing_date') );
    new_date.setDate(new_date.getDate()+step); 
    
    new_date = getDateTimeObject(new_date).date;
    
    $('#date_selector').val( new_date );
    
    return changeShowingDate( new_date );
}

function showToday(){

    var today = getDateTimeObject().date;
    
    $('#date_selector').val( today );
    
    return changeShowingDate( today );
}



/**
* opens up our IndexedDB and sets a global variable db
* so that we can access the Database later and make changes as necessary
* This also will check to see if we are needing to upgrade the db
* @returns {Promise} resolves to the indexedDB, rejects with an event
*/
function openDb() {  
    console.log("...open local db...");
    return new Promise(function(resolve, reject) {
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = function (evt) {
            //console.log(evt);
            db = this.result;
            //console.log(db);
            resolve(db);
        };
        req.onerror = function (evt) {
            console.error("openDb:", evt.target.errorCode);
            reject(evt);
        };

        req.onupgradeneeded = function (evt) {
            //alert("openDb.onupgradeneeded");
            
            db = evt.target.result;
            
            // go throught the object stores 
            // if it exists, delete it.
            // then create a new one
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
* gets an object store so that we can do something with the indexedDB
* @param {string} store_name
* @param {string} mode either "readonly" or "readwrite"
* @returns {indexedDB.ObjectStore.transaction}
*/
function getObjectStore(store_name, mode) {
    console.log("...get store object: "+store_name+"...");
    var transaction = db.transaction(store_name, mode);
    return transaction.objectStore(store_name);
}

/**
* will empty the contents of the indexedDb.DB_NAME.store_name
* be carefull with this
* @param {string} store_name
* @returns {Promise} resolves to an event, rejects with a an error message
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
* removes the entry in store_name with key == key
* @param {string} store_name
* @param {string} key
* @returns {Promise} resolves with an event, rejects with an error message
*/
function deleteObjectFromStore(store_name, key) {
    console.log("...delete from object store: "+store_name+"...");
    return new Promise(function(resolve, reject){
        
        var store = getObjectStore(store_name, 'readwrite');
        var req = store.delete(key);
        req.onsuccess = function(evt) {
            console.log('delete successful: '+ key);
            resolve(evt);
        };
        req.onerror = function (err) {
            console.warn('delete unsuccessful: '+ key);
            reject(err);
        };
        
    });
}


/**
* @param {obj} evt
* --NOT IN USE--
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
* @returns {Promise} resolves with a resource
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
* @returns {Promise} resolves with array of activities, rejects with message
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
            //console.log(response);
            resolve(response.data.activities);
        }).error(function(error){
            //console.warn('need to get activities straight from indexedDB');
            reject('no internet connection');
            
        });
    });
}


/**
* Builds out an array of activities to be added to the store
* This isn't really necessary now but could be in the future
* @param {array} activites
* @returns {Promise} addObjectsToIndexedDB which returns a Promise
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
    return addObjectsToIndexedDB(DB_ACTIVITY_STORE_NAME, activity_array);
}

/**
* this will return a shallow copy or clone of the passed in object
* prevents from changing referenced variables
* @param {obj} original
* @returns {obj} clone of the object
*/
function shallowCopy( original )  
{
    // First create an empty object with
    // same prototype of our original source
    var clone = Object.create( Object.getPrototypeOf( original ) ) ;

    var i , keys = Object.getOwnPropertyNames( original ) ;

    for ( i = 0 ; i < keys.length ; i ++ )
    {
        // copy each property into the clone
        Object.defineProperty( clone , keys[ i ] ,
            Object.getOwnPropertyDescriptor( original , keys[ i ] )
        ) ;
    }

    return clone ;
}

/**
* Checks to see if any of the local db activities are dirty
* If so, it send it to OFSC
* @returns {Promise} resolves with message, rejects with message
*/
function sendActivityChangesToOFSC(){
    console.log('...send activity to ofsc if dirty...');
    return new Promise(function(resolve, reject){
        
        var get_activities = getActivitiesFromIndexedDb();
        get_activities.then(function(activities){
            var promise_array = [];
            promise_array = activities.map(function(obj){
                return new Promise(function(resolve_2, reject_2){
                    // create an array of promises. Each item to insert gets its own promise.
                    // the array of promises will be evaluated as a group below in Promise.all()
                    var tmp_obj = shallowCopy(obj);
                    if(tmp_obj.dirty){
                        
                        console.warn('object is dirty');
                        
                        var tmp_activity = {}; 
                        tmp_activity.properties = tmp_obj;
                        tmp_activity.activity_id = tmp_obj.id;
                        
                        updateActivityInOFSC(tmp_activity).then(function(response){ 
                            
                            if(response.result_code === 0){
                                removeDirtyBitFromLocalDBObject(DB_ACTIVITY_STORE_NAME, response.data.activity_id).then(function(){
                                    resolve_2('...activity has been cleaned');
                                });
                            }
                            else {
                                reject_2(response);
                            }
                            
                        }).catch(function(error){ 

                            reject_2(error);
                            
                        })
                        
                        
                    }
                    else {
                        resolve_2('...clean object...');
                    }
                });
            });
            return Promise.all(promise_array).then(function(value){
                
                resolve('...local activity properties (not statuses) are in sync with ofsc...');
                
            }).catch(function(err){
                
                reject(err);
                
            });
        });
        
    });
    
}
                             


/**
* adds all objects in the obj_array to the db.store_name
* @param {string} store_name
* @param {array} obj_array
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
            resolve('...finished adding to local db...'); 
        }).catch(function(err){
            reject(err);
        });
    });
}

/**
* set the local object's dirty bit to 0
* @param {string} store_name
* @param {string} key
* @returns {Promise} resolves with event, rejects with message
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
* sorts the activites on the home page by the start_time
* -- should be implemented to sort more dynamically --
* @param {array} array
* @param {int} order
* @returns {array} array that is sorted by the start_time
*/
function sortArrayOfObjects(array, order){
    
    order || (order = 1);
    
    
    array.sort(function(a, b){
        
        if( new Date(a.start_time).getTime() > new Date(b.start_time).getTime() ) {
            return 1 * order;
        }
        else {
            return -1 * order;
        }
        return 0;
    });
    return array;
}


/**
* gets all activities from the local IndexedDB
* @returns {Promise} resolves with activities from IndexedDB
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
                activities = sortArrayOfObjects(activities);
                resolve(activities);
            }
        };
    });
    
}
/**
* updates the element specified by model name as a list with data
* if the items id is in the editable string then it will be presented as an input
* updating locally and to OFSC when blurred or changed
* @param {string} element_id_to_append_to
* @param {array} data - data to add to list
* @param {string} editable - fields that are editable
*/
function updateActivityDetailList(element_id_to_append_to, data, editable){
    console.log('...update activity detail list...');
    if(!editable){editable = '';}
    
    var item_string = '';
    
    for(var i in data){
        if(VISIBLE_ACTIVITY_FIELDS.indexOf(i) > -1){
            var li_content = '';
            if(editable.indexOf(i) > -1 ){
                if(Helix.options[i]){
                    li_content += '<select onchange="updateActivity(event);" id="'+i+'">'+Helix.options[i].map(function(option){
                        if(option.value === data[i]){
                            return '<option value="'+option.value+'" selected> '+option.label+'</option>';
                        }
                        else {
                            return '<option value="'+option.value+'" > '+option.label+'</option>';
                        }


                    }).join('')+'</select>';
                }
                else {
                    li_content += '<input value="'+data[i]+'" onblur="updateActivity(event);" id="'+i+'">';
                }
            }
            else {
                li_content = data[i];
            }


            item_string += '<li>'+i+': '+li_content+'</li>';
        }
    }
        
    
    $('#'+element_id_to_append_to).html(item_string); 
    
}

/**
* updates the element specified by model name as a table with data
* @param {string} element_id_to_append_to
* @param {array} data
*/
function updateActivityTable(element_id_to_append_to, data, filters){
    console.log('...update activity table...');
    
    var header_cells = '', item_string = '', filter_out = false;
    
    for(var field in VISIBLE_ACTIVITY_FIELDS){// build out the header info first
        header_cells += '<th>'+VISIBLE_ACTIVITY_FIELDS[field]+'</th>';
    }
        
    
    var items_string = data.map(function(item, index){
        item_string = '';
        filter_out = false;
        
        
        // if the item does not match the optional filter object then we won't show it
        for(var f in filters){
            if(item[f] !== filters[f]){
                filter_out = true;
            }
        }
        
        if(filter_out){
             return '';
        }
        else {
            for(var i in item){

                if(VISIBLE_ACTIVITY_FIELDS.indexOf(i) > -1){
                    
                    item_string += '<td>'+item[i]+'</td>';
                    
                }
            }


            return '<tr style="cursor: pointer;" onclick="navigateWithParameters({\'id\':'+item.id+'},\'activity_detail\');">'+item_string+'</tr>';
        }
    }).join("");
    
    $('#'+element_id_to_append_to).html('<tr>'+header_cells+'</tr>'+items_string); 
    
}

/**
* updates id="feedback" element with feedback param
* @param {string} feedback
*/
function updateFeedback(feedback){
    $('#feedback').html(feedback);
    setTimeout(function(){
        $('#feedback').html('---');
    }, 3000);
}

/**
* updates id="db_status" element with in sync message
* @param {bool} in_sync
*/
function updateDBStatus(in_sync){
    localStorage.setItem('dbs_in_sync', in_sync);
    if(in_sync){
        $('#db_status').html('databases are in sync');
    }
    else{
        $('#db_status').html('databases are out of sync');
    }
}


/**
* Sets localStorage( [{param_obj.key, param_obj.value}] ), 
* then initializes the right view
* @param {obj} param_obj
* @param {string} page
* @returns {function} getView()
*/
function navigateWithParameters(param_obj, page){
    for(var i in param_obj){
        localStorage.setItem(i, param_obj[i]);
    }
    for(var i in PAGE_SET){
        $('#'+PAGE_SET[i]).hide();
    }
    return getView(page); // this will show the page we need
}

/**
* updates and activity in local db -> update in OFSC
* if OFSC updates then clear dirty bit 
* @param {click_event} event
*/
function updateActivity(event) {
    console.log('...update activity...');
    var activity;
    
    getIndexedDBEntry(DB_ACTIVITY_STORE_NAME, localStorage.getItem('id') ).then(function(local_db_activity){
        
        activity = shallowCopy(local_db_activity);
        activity[event.target.id] = event.target.value;
        activity['dirty'] = 1;
        
        //return updateActivityInLocalDB(activity);
        
        return new Promise(function(resolve, reject){

             // need to get the transaction and store for adding to the local db
            var store = getObjectStore(DB_ACTIVITY_STORE_NAME, 'readwrite');
            var req;

            // using put instead of add because put will update if the key index exists
            req = store.put(activity);

            req.onsuccess = function (evt) {
                
                updateDBStatus(false);
                
                localStorage.setItem('local_indexeddb_last_update', new Date().getTime() );
                resolve(evt);
            };
            req.onerror = function(evt) {
                console.warn(evt);
                reject('could not add to local db');
            };

        });
    }).then(function(evt){
        
        // is not checking if there is actually connection. It checks if the device's connection capability is on or not
        // basically checking if device is in Airplane Mode or not
        if(window.navigator.onLine){
        
            var tmp_activity = {};
            // put in properties object 
            tmp_activity.properties = shallowCopy(activity);
            // set the activity_id so that the api knows which activity to update
            tmp_activity.activity_id = tmp_activity.properties.id;

            console.log(tmp_activity);

            return updateActivityInOFSC(tmp_activity).then(function(response){
                
                updateDBStatus(true);
                
                updateFeedback('activity has been updated locally and in ofsc'); 
                
                return removeDirtyBitFromLocalDBObject(DB_ACTIVITY_STORE_NAME, activity.id);
            });
        }
        else {
            updateFeedback( 'device is in "Airplane Mode"' ); 
        }
        
    }).catch(function(response){
        
        console.warn(response);
        updateFeedback( response.toString() ); 
        
    });
}

function failedPromise(){}


/**
* sends an activity to addObjectToIndexedDB 
* -- should probably be removed or redone to not call addObjects function. Do add here --
* @param {obj} activity
* @returns {Promise} resolves with the activity, rejects with a message
*/
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
* updates OFSC with activity object of form
{ api_key: OFSC_API_KEY, activity: {activity} }
* @param {obj} activity
* @returns {Promise} resolves with response from helixsxd, rejects with a message
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
            
            reject(error);
            
        });
    });
}


/**
* formats n so that it is a string with a length of at least 2
* @param {int} n
* @returns {string} n.toString() with a length of at least
*/
function formatTime(n){
    return n > 9 ? "" + n: "0" + n;
}

/**
* Allows us to have consistency of date formatting
* @param {string} - (Optional) string that will be reformated
* @returns {obj} { year: yyyy, month: mm, date: dd, hour: hh, minute: mm, second: ss, time: hh:mm:ss, date: yyyy-mm-dd, date_time: yyyy-mm-dd hh:mm:ss }
*/
function getDateTimeObject( date_time_string ){
    if(date_time_string){
        var d = new Date( date_time_string );
        d.setDate(d.getDate() + 1);
    }
    else {
        var d = new Date();
    }
    
    
    var year = d.getFullYear();
    var month = formatTime( d.getMonth() + 1 );
    var date = formatTime(d.getDate());
    
    var hours = formatTime(d.getHours());
    var minutes = formatTime(d.getMinutes());
    var seconds = formatTime(d.getSeconds());
    
    return {
        year: year,
        month: month,
        date: date,
        hour: hours,
        minute: minutes,
        second: seconds,
        time: hours + ":" + minutes + ":" + seconds,
        date: year + "-" + month + "-" + date,
        date_time: year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
    };
}

/**
* updates the local db -> sends to ofsc [x-> queues in local db ]
* @param {string} status
*/
function statusActivity(status){
    console.log('...update activity...');
    var activity;
    var time_strings = getDateTimeObject();
    
    getIndexedDBEntry( DB_ACTIVITY_STORE_NAME, localStorage.getItem('id') ).then(function(local_db_activity){
        activity = shallowCopy(local_db_activity);
        activity.status = status;
        
        switch(status){
            case 'started':
                activity.start_time = time_strings.date_time;
                break;
            case 'complete':
                activity.end_time = time_strings.date_time;
        }
        
        activity.dirty = 1;
        
        //return updateActivityInLocalDB(activity);
        
        return new Promise(function(resolve, reject){

             // need to get the transaction and store for adding to the local db
            var store = getObjectStore(DB_ACTIVITY_STORE_NAME, 'readwrite');
            var req;

            // using put instead of add because put will update if the key index exists
            req = store.put(activity);

            req.onsuccess = function (evt) {
                
                updateDBStatus(false);                
                localStorage.setItem('local_indexeddb_last_update', new Date().getTime() );
                resolve(evt);
            };
            req.onerror = function(evt) {
                console.warn(evt);
                reject('could not add to local db');
            };

        });
        
    }).then(function(evt){
        
        
        
        return updateStatusInOFSC({
            status: status,
            activity_id: activity.id,
            date: time_strings.date,
            time: time_strings.date_time
        });
        
    }).then(function(response){
        
        if(response.result_code === 0){
            updateDBStatus(true);
            updateFeedback('activity has been updated locally and in ofsc');
            return removeDirtyBitFromLocalDBObject(DB_ACTIVITY_STORE_NAME, activity.id);
        }
        else {
            updateFeedback('activity encountered problem in OFSC');
            console.warn(response);
        }
        
    }).catch(function(msg){
        
        console.warn(msg);
        console.log('queueing status object');
        // need to queue the status_object for when we get connection back
        addStatusObjectToQueue({
            status: status,
            activity_id: activity.id,
            date: time_strings.date,
            time: time_strings.date_time
        }).then(function(response){
            console.warn(msg);
            updateFeedback(msg);
        });
    });
}

/**
* queues a status_object => {status: ,date: ,time: ,activity_id: [,properties: [{name: value}] ]} in the local db so that we can send in later to OFSC
* @param {obj} status_object
* @returns {Promise} resolves with message, rejects with message
*/
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

/**
* sends an object to OFSC with status_object = {status: ,date: ,time: ,activity_id: [,properties: [{name: value}] ]}
* @param {obj} status_object
* @returns {Promise} resolves with response from helixsxd, rejects with status_object
*
*/
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

/**
* returns the local db entry specified by key
* @param {string} store_name
* @param {string} key
* @returns {Promise} resolves with indexed db object, rejects with message
*/
function getIndexedDBEntry(store_name, key){
    console.log('...get entry from local db...');
    return new Promise(function(resolve, reject){
        
        var store = getObjectStore(store_name, 'readwrite');

        var req = store.get(key);

        req.onsuccess = function(event) {
            
            //console.log(req.result);
            
            resolve(req.result);
        };
        req.onerror = function(err) {
            reject(err);
        }; 
    });
}

/**
* @param {string} param
* gets a url parameter
* ---- not using url parameters ----
*/
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
* Gets status objects in the DB_STATUS_QUEUE_STORE_NAME ObjectStore
* @returns {Promise} resolves with array of status objects
*/
function getStatusQueue(){
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

/**
* this will send the status queue to update ofsc
* On a failed update, it will try up to 5 times
* @param {int} tries (initially empty)
* @returns {Promise} resolves with message, rejects with message
*/
function sendStatusQueue(tries){
    // limiting the number of retries for our status queue.
    // this should probably be done in middle-ware but for now this will do
    var max_tries = 5;
    // if tries is not defined then it is the first loop so set it to 0
    tries || (tries = 0);
    
    return new Promise(function(resolve, reject){
        
        getStatusQueue().then(function(statuses){
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
                            
                            // if the update was succesful then remove the status object from the queue
                            if(response.result_code === 0){
                                deleteObjectFromStore(DB_STATUS_QUEUE_STORE_NAME, obj.id).then(function(){
                                    resolve(response);
                                });
                                
                            }
                            // if we get a response code of 8 it most likely means that our requests were
                            // just received out of order so we need to retry them
                            else {
                                reject(response);
                            }
                            
                        }).error(function(error){
                            //console.log(error);
                            console.warn('activity did not update need to queue status update in local db');
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
                    console.warn('TRIES: '+tries);
                    tries++;
                    if(tries > max_tries){
                        console.warn(err);
                        resolve('MAX TRIES exceeded');
                    }
                    else {

                        resolve('trying to send statuses again');
                        return sendStatusQueue(tries);
                    }
                    
                });
            }
            else {
                resolve('...no statuses in queue...');
            }
        });
    });
}

function loadActivitiesFromOFSC(){
    console.log('------ load from ofsc -----');
    getActivitiesFromOFSC().then(function(activities){

        return addObjectsToIndexedDB( DB_ACTIVITY_STORE_NAME, activities);

    }).then(function(){
        
        return getView('home');
        
    }).then(function(){
        console.log('..activities loaded from ofsc and added to local db');
        console.log('------ load from ofsc -----');
    }).catch(function(err){
        console.warn(err);
        console.log('------ load from ofsc -----');
    });
}


/**
* Since we are loading all javascript files FOR NOW, we need to differentiate 
* by getting what page we are on
* NOTE: this currently won't ever be anything but 'home', but it should be implemented so
* that the serviceWorker checks localStorage for most recent view and then passes that value in as
* <page>
* @params {string} page (view) to initialize 
*/
function sendLocalChangesToOFSC(){
    
    console.log('------ send local changes -----');
    return new Promise(function(resolve, reject){
        
        if(window.navigator.onLine){

            sendActivityChangesToOFSC().then(function(msg){
                console.log(msg);

                return sendStatusQueue();

            }).then(function(msg){
                
                updateFeedback(msg);
                
                console.log(msg);
                console.log('------ end send local changes -----');

                
                resolve(msg);
                
            }).catch(function(err){

                updateFeedback(err);

                console.log(err);
                console.log('------ end send local changes -----');
                
                resolve(err);

            });
        }
        else {
            console.log('------ end send local changes -----');
            
            updateFeedback('device is in "Airplane Mode"');
            
            resolve('device is in "Airplane Mode"');
        }
        
    });
    
}



/**
* Refresh and show the view
* @params {string} view to show 
* @returns {Promise} resolves with '', rejects with message
*/
function getView(view){
    
    console.log('------ changing view -----');
    
    return new Promise(function(resolve, reject){
        
        switch(view){
            case 'home':

                getActivitiesFromIndexedDb().then(function(activities) {

                    updateActivityTable('activities', activities, {date: localStorage.getItem('showing_date')} );
                    
                    resolve();
                });

                break;

            case 'activity_detail':
                console.log('..on activity_detail view..');

                var id = localStorage.getItem('id');

                if(id) {
                    getIndexedDBEntry( DB_ACTIVITY_STORE_NAME, id ).then(function(activity){
                        
                        updateActivityDetailList('activity_details', activity,'address,name');
                        
                        resolve();
                        
                    });
                }
                else {
                    reject('No id in local storage');
                }

                break;
        }
    }).then(function(){
        
        $('#'+view).show();
        
    }).catch(function(err){
        
        console.warn(err);
        
    }).then(function(){
        
        console.log('------ end of changing view -----');
        
    });
    
    
}






















