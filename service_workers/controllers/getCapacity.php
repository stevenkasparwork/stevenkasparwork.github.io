
<?php
header('Access-Control-Allow-Origin: *');

function getCapacity($params, $password, $login, $company) {


    date_default_timezone_set('America/Chicago');
    $date = date(DATE_ATOM, time());
    $auth_string = md5($date.md5($password));

    $userNode = '<user>
                <now>'.$date.'</now>
                <login>'.$login.'</login>
                <company>'.$company.'</company>
                <auth_string>'.$auth_string.'</auth_string>
            </user>';

    $body = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
            xmlns:urn="urn:toa:capacity">            
            <soapenv:Header/>            
            <soapenv:Body>

                <urn:get_capacity>'.
                    $userNode;

    for($i = 0; $i < count($params['dates']); $i++){
        $body .= '<date>'.$params['dates'][$i].'</date>';
    }


    foreach($params['time_slot_info'] as $ts){
        $body .= '<time_slot>'.$ts['label'].'</time_slot>';
    }

        if($params['calculate_duration'] != ''){
            $body .= '<calculate_duration>'.$params['calculate_duration'].'</calculate_duration>';
        }
        if($params['calculate_travel_time'] != ''){
            $body .= '<calculate_travel_time>'.$params['calculate_travel_time'].'</calculate_travel_time>';
        }
        if($params['calculate_work_skill'] != ''){
            $body .= '<calculate_work_skill>'.$params['calculate_work_skill'].'</calculate_work_skill>';
        }
        if($params['return_time_slot_info'] != ''){
            $body .= '<return_time_slot_info>'.$params['return_time_slot_info'].'</return_time_slot_info>';
        }
        if($params['determine_location_by_work_zone'] != ''){
            $body .= '<determine_location_by_work_zone>'.$params['determine_location_by_work_zone'].'</determine_location_by_work_zone>';
        }
        if($params['dont_aggregate_results'] != ''){
            $body .= '<dont_aggregate_results>'.$params['dont_aggregate_results'].'</dont_aggregate_results>';
        }
        if($params['min_time_to_end_of_time_slot'] != ''){
            $body .= '<min_time_to_end_of_time_slot>'.$params['min_time_to_end_of_time_slot'].'</min_time_to_end_of_time_slot>';
        }
        if($params['default_duration'] != ''){
            $body .= '<default_duration>'.$params['default_duration'].'</default_duration>';
        }


        foreach($params['work_skills'] as $work_skill){
            $body .= '<work_skill>'.$work_skill.'</work_skill>';
        }
                    // Co Settings -> Acitivity Types -> Activity Type Label
    if(isset($params['activity_fields'])) {


        foreach($params['activity_fields'] as $key => $value) {
            $body .= '
                    <activity_field>
                        <name>'.$key.'</name>
                        <value>'.$value.'</value>
                    </activity_field>';
        }
    }

    $body.='   </urn:get_capacity>
            </soapenv:Body>
        </soapenv:Envelope>'; 


    $headers = array( 
        'Content-Type: text/xml; charset="utf-8"', 
        'Content-Length: '.strlen($body), 
        'Accept: text/xml',//'Accept: text/xml', 
        'Cache-Control: no-cache', 
        'Pragma: no-cache', 
        'Host: demo.etadirect.com'
    ); 


    $url = "https://demo.etadirect.com/soap/capacity/?wsdl";


    $ch = curl_init(); 
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
    curl_setopt($ch, CURLOPT_TIMEOUT, 60); 
    curl_setopt($ch, CURLOPT_POST, true); 
    curl_setopt($ch, CURLOPT_URL, $url); 
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);

    $data = curl_exec($ch);

    $xmlDOM = simplexml_load_string($data);

    $return_array = array();
    $capacity_array = array();
    $location_array = array();
    $work_skill_array = array();

    /* get all of the locations returned */

    foreach($xmlDOM->xpath('//location') as $location){
        if( !in_array( (string)$location, $location_array ) ) {
            array_push($location_array, (string)$location);
        }
    }

    // sometimes the work_skills will be passed in and we can count on just those
    // work skill being returned. Other times the work_skills wil be empty and OFSC will
    // return all of the work_skills associated with the company.
    // then we will have to go through and get every work_skill element returned and push
    // it onto the work_skill_array
    if( count($params['work_skills']) ){
        $work_skill_array = $params['work_skills'];
    }
    else {

        foreach($xmlDOM->xpath('//work_skill') as $work_skill){
            if( !in_array( (string)$work_skill, $work_skill_array) ){
                array_push($work_skill_array, (string)$work_skill);
            }
        }

   }

    /*  build out an empty array of time slots and dates that we queried for 

        so we will have $capacity_array[$time_slots]['all_work_skills'][$date][$location] = array()
            which will be all of the returned work_skills combined.

        alse, we will have so we will have $capacity_array[$time_slots]['availability_info'][$date][$location] = array()
            which is more for debugging at this point and shows each returned capacity slot in its proper place


    */
    foreach($params['time_slot_info'] as $ts){

        $capacity_array[$ts['label']] = array(
            'info' => array(
                'display_label' => $ts['display_label']
            ),
            'availability_info' => array(),
            'all_work_skills_info' => array() 
        );
        for($d = 0; $d < count($params['dates']); $d++) {

            $capacity_array[$ts['label']]['availability_info'][$params['dates'][$d]] = array();
            $capacity_array[$ts['label']]['all_work_skills_info'][$params['dates'][$d]] = array();

            // add each location to the arrays so we can track what is being returned and compare later
            foreach($location_array as $location){
                $capacity_array[$ts['label']]['availability_info'][$params['dates'][$d]][$location] = array();
                $capacity_array[$ts['label']]['all_work_skills_info'][$params['dates'][$d]][$location] = array();
            }
        }
    }


    /* Here we go through the response and fill in the arrays created above
        We have an array for each work skill and also the overall array 'all_work_skills_info' which will return
        the lowest amount of minutes available for the work skills queried for
    */

    foreach($xmlDOM->xpath('//capacity') as $element) {

        $location = (string)$element->location;
        $quota = (int)$element->quota;
        $date = (string)$element->date;
        $available = (int)$element->available;
        $time_slot = (string)$element->time_slot;
        $work_skill = (string)$element->work_skill;

        // OFSC returns alot of capacity elements which are still up in the air on what they mean.
        // The capacity elements that we are concerned with have a work_skill and time_slot
        if(strlen($time_slot) > 0 && strlen($work_skill) > 0){

            $capacity_array[$time_slot]['availability_info'][$date][$location][$work_skill] = array(
                'location' => $location,
                'quota' => $quota,
                'available' => $available,
                'work_skill' => $work_skill
            );

            // if the all work skill hasn't been defined for this time slot and date and location then set it
            if( !isset($capacity_array[$time_slot]['all_work_skills_info'][$date][$location]['available']) ){
                $capacity_array[$time_slot]['all_work_skills_info'][$date][$location] = array(
                    'location' => $location,
                    'quota' => $quota,
                    'available' => $available,
                    'work_skills' => array($work_skill)
                );
            }
            // if it has been set then we need to see if the available time is less bc we are taking the time
            // available for the least available work_skill
            else if( !in_array($work_skill, $capacity_array[$time_slot]['all_work_skills_info'][$date][$location]['work_skills']) ) {

                // if the available for this time slot is less then set the new available time
                if( $available < $capacity_array[$time_slot]['all_work_skills_info'][$date][$location]['available']  ) {

                    $capacity_array[$time_slot]['all_work_skills_info'][$date][$location]['available'] = $available;

                    // push the work skill onto the work_skills array. 
                    // VERY IMPORTANT so that later we can go through and make sure every work skill was considered.
                    array_push($capacity_array[$time_slot]['all_work_skills_info'][$date][$location]['work_skills'], $work_skill);
                }
                else {

                    array_push($capacity_array[$time_slot]['all_work_skills_info'][$date][$location]['work_skills'], $work_skill);

                }
            }
        }
    }

    // now we have to go through the all work skills array and if the length of the work skills
    // array is not the same as the $work_skill_array then we know there was not availability or availability was unset
    // for at least one of the queried for work_skills
    foreach($capacity_array as $time_slot => $time_slot_obj){

        foreach($time_slot_obj['all_work_skills_info'] as $date => $date_obj){

            // define an empty array that will become our returned available time object
            $location_with_higher_availablility = array();
            $highest_time_available = NULL;

            foreach($date_obj as $location => $location_obj){

                if( count($location_obj['work_skills']) < count($work_skill_array) ) {
                    $capacity_array[$time_slot]['all_work_skills_info'][$date][$location]['available'] = 0;
                }
                //echo "---$highest_time_available---";
                if( $capacity_array[$time_slot]['all_work_skills_info'][$date][$location]['available'] > $highest_time_available || $highest_time_available == NULL){

                    // set the new highest time
                    $highest_time_available = $capacity_array[$time_slot]['all_work_skills_info'][$date][$location]['available'];

                    // save this object
                    $location_with_higher_availablility = $capacity_array[$time_slot]['all_work_skills_info'][$date][$location];

                }/*
                else {
                    print_r($capacity_array[$time_slot]['all_work_skills_info'][$date][$location]);
                }*/

            }

            // after going through locations set the highest available to the 
            $capacity_array[$time_slot]['all_work_skills_info'][$date]['available'] = $location_with_higher_availablility['available'];
            $capacity_array[$time_slot]['all_work_skills_info'][$date]['location'] = $location_with_higher_availablility['location'];

        } 

    }



    $time_slot_info = array();
    foreach($xmlDOM->xpath('//time_slot_info') as $element) {
    $time_slot_info[(string)$element->label] = array(
        'name' => (string)$element->name,
        'time_from' => (string)$element->time_from,
        'time_to' => (string)$element->time_to
    );

    }
    $activity_type_label = $params['activity_fields']['worktype_label'];

    foreach($xmlDOM->xpath('//activity_duration') as $activity_duration) {
        $activity_duration = (string)$activity_duration;
    }

    return array(
        'result_code' => 0,
        'dates' => $params['dates'],
        'capacity_info'=> $capacity_array,
        'business_info' => $business_info,
        'time_slot_info' => $time_slot_info,
        'activity_type_label' => $activity_type_label,
        'activity_duration' => $activity_duration,
        'work_skills' => $work_skill_array,
        'locations' => $location_array,
        'soap_reponse' => $data,
        'soap-request' => $body,
        'post_time_slots' => $params['time_slot_info']
    );


} 


function encrypt_decrypt($action, $string) {
    $output = false;

    $encrypt_method = "AES-256-CBC";
    $secret_key = 'helix-sxd';
    $secret_iv = 'sxd-helix';

    // hash
    $key = hash('sha256', $secret_key);
    
    // iv - encrypt method AES-256-CBC expects 16 bytes - else you will get a warning
    $iv = substr(hash('sha256', $secret_iv), 0, 16);

    if( $action == 'encrypt' ) {
        $output = openssl_encrypt($string, $encrypt_method, $key, 0, $iv);
        $output = base64_encode($output);
    }
    else if( $action == 'decrypt' ){
        $output = openssl_decrypt(base64_decode($string), $encrypt_method, $key, 0, $iv);
    }

    return $output;
}

$decrypted_txt = encrypt_decrypt('decrypt', $_POST['api_key']);

$credentials_array = explode(" ", $decrypted_txt);
$password = $credentials_array[0];
$login = $credentials_array[1];
$company = $credentials_array[2];


$return_array = getCapacity($_POST['capacity_fields'], $password, $login, $company);

echo json_encode(array('result_code' => 0, 'data' => $return_array) );
            
            
?>