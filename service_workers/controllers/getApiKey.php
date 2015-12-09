
<?php
header('Access-Control-Allow-Origin: *');

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

$encrypted_text = encrypt_decrypt('encrypt', $_GET['password']." ".$_GET['login']." ".$_GET['company']);

echo "<strong>$encrypted_text</strong>";
            
            
?>