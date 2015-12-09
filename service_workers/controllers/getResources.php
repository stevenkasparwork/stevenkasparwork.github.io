
<?php
header('Access-Control-Allow-Origin: *');

function getResources($password, $login, $company) {


    date_default_timezone_set('America/Chicago');
    $date = date(DATE_ATOM, time());
    $auth_string = md5($date.md5($password));

    $userNode = '<user>
                <now>'.$date.'</now>
                <login>'.$login.'</login>
                <company>'.$company.'</company>
                <auth_string>'.$auth_string.'</auth_string>
            </user>';

    $body = '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
                xmlns:ns1="urn:toatech:ResourceManagement:1.0">
                <SOAP-ENV:Body>
                   <ns1:get_resources_list>
                   '.$userNode.'
                   </ns1:get_resources_list>
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

    $resource_array = array();

    /* get all of the locations returned */

    foreach($xmlDOM->xpath('//resource') as $resource){
        foreach($resource->xpath('//property') as $property){
            array_push($resource_array, array(
                'name' => (string)$property->name,
                'value' => (string)$property->value
            ));
        }
    }
    
    return $resource_array;

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


$return_array = getResources($password, $login, $company);

echo json_encode(array('result_code' => 0, 'data' => $return_array) );
            
            
?>