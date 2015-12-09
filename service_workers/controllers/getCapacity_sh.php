
<?php
header('Access-Control-Allow-Origin: *');

    function getCapacity($params, $password, $login, $company) {
        //error_reporting(0);
        // Perform AJAX-handling here...
        // echo response
        $time_slots = array(
        array(
            'id' => 1,
            'name' => '08-10',
            'label' => '08-10',
            'status' => true,
            'time_from' => '08:00:00',
            'time_to' => '10:00:00',
            'time_from_short' => '8',
            'time_to_short' => '10'
        ),
        array(
            'id' => 2,
            'name' => '10-12',
            'label' => '10-12',
            'status' => true,
            'time_from' => '10:00:00',
            'time_to' => '12:00:00',
            'time_from_short' => '10',
            'time_to_short' => '12'
        ),
        array(
            'id' => 3,
            'name' => '13-15',
            'label' => '13-15',
            'status' => true,
            'time_from' => '13:00:00',
            'time_to' => '15:00:00',
            'time_from_short' => '1',
            'time_to_short' => '3'
        ),
        array(
            'id' => 4,
            'name' => '15-17',
            'label' => '15-17',
            'status' => true,
            'time_from' => '15:00:00',
            'time_to' => '17:00:00',
            'time_from_short' => '3',
            'time_to_short' => '5'
        ));
            
        $business_info = array(
            'time_slots' => $time_slots
        );
        
        
        $apiSet = "capacity";
        
        $url = "https://demo.etadirect.com/soap/".$apiSet."/?wsdl";
                
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
        
        
        foreach($business_info['time_slots'] as $ts){
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
    
print_r($headers);
        if (! extension_loaded('curl')) load_curl();
        $ch = curl_init(); 
print_r($ch);
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
        
        /* First we build out an empty array of time slots and dates that we queried for */
        for($i = 0; $i < count($business_info['time_slots']); $i++){
            
            $capacity_array[$business_info['time_slots'][$i]['label']] = array(
                'info' => array(
                    'id' => $business_info['time_slots'][$i]['id'],
                    'name' => $business_info['time_slots'][$i]['name'],
                    'status' => $business_info['time_slots'][$i]['status'],
                    'time_from' => $business_info['time_slots'][$i]['time_from'],
                    'time_to' => $business_info['time_slots'][$i]['time_to'],
                    'time_from_short' => $business_info['time_slots'][$i]['time_from_short'],
                    'time_to_short' => $business_info['time_slots'][$i]['time_to_short']
                ),
                'availability_info' => array()
            );
            for($d = 0; $d < count($params['dates']); $d++) {
                $capacity_array[$business_info['time_slots'][$i]['label']]['availability_info'][$params['dates'][$d]] = array();
                $capacity_array[$business_info['time_slots'][$i]['label']]['all_work_skills_info'][$params['dates'][$d]] = array();
            }
        }
        
        /* Here we go through the response and fill in the arrays created above
            We have an array for each work skill and also the overall array 'all_work_skills_info' which will return
            the lowest amount of minutes available for the work skills queried for
        */
        
        $work_skill_array = array();
        foreach($xmlDOM->xpath('//capacity') as $element) {
            $location = (string)$element->location;
            $quota = (string)$element->quota;
            $date = (string)$element->date;
            $available = (string)$element->available;
            $time_slot = (string)$element->time_slot;
            $work_skill = (string)$element->work_skill;
            
            //echo $time_slot.":".$work_skill.":";
            
            if(isset($time_slot, $work_skill) && strlen($time_slot) > 0 && strlen($work_skill) > 0){
                //echo $time_slot."...";
               // print_r($capacity_array[(string)$time_slot]);
                $capacity_array[$time_slot]['availability_info'][$date][$work_skill] = array(
                    'location' => $location,
                    'quota' => $quota,
                    'available' => $available,
                    'work_skill' => $work_skill
                );
                
                if(!isset($capacity_array[$time_slot]['all_work_skills_info'][$date]['available'])){
                    $capacity_array[$time_slot]['all_work_skills_info'][$date] = array(
                        'location' => $location,
                        'quota' => $quota,
                        'available' => (int)$available,
                        'work_skills' => array($work_skill)
                    );
                }
                else {
                    if( $available < $capacity_array[$time_slot]['all_work_skills_info'][$date]['available']  ) {
                        $capacity_array[$time_slot]['all_work_skills_info'][$date]['available'] = $available;
                        
                        array_push($capacity_array[$time_slot]['all_work_skills_info'][$date]['work_skills'], $work_skill);
                    }
                    else {
                        $capacity_array[$time_slot]['all_work_skills_info'][$date]['available'] = 0;
                    }
                }
                
            }
        }
        //print_r($capacity_array);
        // now we have to go through the all work skills array and if the length of the work skills
        // array is not the same as the $work_skill_array then we know there was not availability for
        // all returned work skills and therefor is not available
        foreach($capacity_array as $time_slot => $time_slot_obj){
            
            foreach($time_slot_obj['all_work_skills_info'] as $date => $date_obj){
                //print_r($date_obj);
                if( count($date_obj['work_skills']) != count($params['work_skills']) ) {
                    $capacity_array[$time_slot]['all_work_skills_info'][$date]['available'] = 0;
                }
                
            } 
            
        }
        
        
        
        $time_slot_info = array();
        foreach($xmlDOM->xpath('//time_slot_info') as $element) {
            array_push($time_slot_info, array(
                'name' => (string)$element->name,
                'label' => (string)$element->label,
                'time_from' => (string)$element->time_from,
                'time_to' => (string)$element->time_to
            ));
            
        }
        $activity_type_label = $params['activity_fields']['worktype_label'];
        $activity_duration = (string)$xmlDOM->xpath('//activity_duration');
        
        return array(
            'result_code' => 0,
            'dates' => $params['dates'],
            'capacity_info'=> $capacity_array,
            'business_info' => $business_info,
            'time_slot_info' => $time_slot_info,
            'activity_type_label' => $activity_type_label,
            'activity_duration' => $activity_duration,
            'work_skills' => $params['work_skills'],
            'soap_reponse' => $data,
            'soap-request' => $body
        );
            
          
    }


    $password = "JMoa2W8eTs";
    $login = "soap";
    $company = "sunrise1130.demo";

$return_array = getCapacity($_POST['capacity_fields'], $password, $login, $company);

echo json_encode(array('result_code' => 0, 'data' => $return_array) );
            
            
?>