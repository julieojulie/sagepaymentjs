<?php

    $developer = [
        "ID" => "8eBNdAveZDL1mkxLuyuttXGi25Rxrtsa",
        "KEY" => "ia4HkGrcNGkToJPb"
    ];

    $req = file_get_contents('php://input');

    $results = [
       'hash' => base64_encode(hash_hmac('sha512', $req, $developer['KEY'], true)),
    ];
    
    echo json_encode($results);
?>

