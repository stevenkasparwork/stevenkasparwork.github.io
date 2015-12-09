
<?php
header('Access-Control-Allow-Origin: *');


function createActivity($params, $password, $login, $company) {

    date_default_timezone_set('America/Chicago');
    $date = date(DATE_ATOM, time());
    $auth_string = md5($date.md5($password));

    $userNode = '<user>
        <now>'.$date.'</now>
        <login>'.$login.'</login>
        <company>'.$company.'</company>
        <auth_string>'.$auth_string.'</auth_string>
    </user>';

    $body = '
        <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
            xmlns:ns1="urn:toa:activity">
            <SOAP-ENV:Body>
                <ns1:create_activity>'.
                    $userNode.'
                    <date>'.$params['date'].'</date>

                    <resource_id>'.$params['bucket_id'].'</resource_id>

                    <position_in_route>'.$params['position_in_route'].'</position_in_route>';

       foreach($params['properties'] as $key => $value){
           $body .= '<properties>
                        <name>'.$key.'</name>
                        <value>'.$value.'</value>
                    </properties>';
       }          

     $body .= '  </ns1:create_activity>
            </SOAP-ENV:Body>
        </SOAP-ENV:Envelope>'; 

    $headers = array( 
        'Content-Type: text/xml; charset="utf-8"', 
        'Content-Length: '.strlen($body), 
        'Accept: text/xml',//'Accept: text/xml', 
        'Cache-Control: no-cache', 
        'Pragma: no-cache', 
        'Host: demo.etadirect.com'
    ); 

    $url = "https://demo.etadirect.com/soap/activity/v2/?wsdl";

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

    foreach($xmlDOM->xpath('//result_code') as $result_code) {
        $response_code = $result_code;
    }

    $property_array = array();

    foreach($xmlDOM->xpath('//properties') as $property) {
        $property_array[(string)$property->name] = NULL;
        $property_array[(string)$property->name] = (string)$property->value;

        if( (string)$property->name == 'id' ) {
            $activity_id = (string)$property->value;
        }
    }

    return array(
            'result_code' => (int)$response_code,
            'activity_id' => $activity_id,
            'properties' => $property_array,
            'response' => $data,
        'request' => $body
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



$return_array = createActivity($_POST['activity_info'], $password, $login, $company);

echo json_encode(array('result_code' => $return_array['result_code'], 'data' => $return_array) );
            
            
?>