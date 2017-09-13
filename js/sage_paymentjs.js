jQuery(document ).ready(function() {

    PayJS(['jquery', 'PayJS/Core', 'PayJS/Request', 'PayJS/Response', 'PayJS/Formatting', 'PayJS/Validation'],
    function($, $CORE, $REQUEST, $RESPONSE, $FORMATTING, $VALIDATION) {

        //$("#edit-continue").prop('disabled', true);
        var isValidCC = false,
            isValidExp = false,
            isValidCVV = false;
        var variables = Drupal.settings.sage_paymentjs.variables;
        
        // when using REQUEST library, initialize via CORE instead of UI
        $CORE.Initialize({
            clientId: variables[6],
            postbackUrl: "https://www.example.com/myHandler.php",
            environment: "cert",
            merchantId: variables[5],
            authKey: variables[1],
            salt: variables[0],
            requestType: "payment",
            orderNumber: variables[2],
            amount: variables[3],
            preAuth: "false",
        });


        $("#edit-commerce-payment-payment-details-payment-submit").click(function() {
            //$(this).prop('disabled', true).removeClass("not-disabled");
            $("#payment-details :input").prop('disabled', true);
            //$("#edit-commerce-payment-payment-method").addClass("animated").removeClass("static");
            $("#edit-commerce-payment-payment-method").addClass("animated");
            $("#edit-commerce-payment-payment-method").fadeTo(2000, 0.1);

            $CORE.setBilling({
                name: variables[4]['name_line'],
                address: variables[4]['thoroughfare'],
                city: variables[4]['locality'],
                state: variables[4]['administrative_area'],
                postalCode: variables[4]['postal_code']
            });

            var cc = $("#edit-commerce-payment-payment-details-cc-number").val();
            var exp = $("#edit-commerce-payment-payment-details-cc-expiration").val();
            var cvv = $("#edit-commerce-payment-payment-details-cc-cvv").val();
            
            // run the payment
            $REQUEST.doPayment(cc, exp, cvv, function(data, status, jqxhr) {
                // if you want to use the RESPONSE module with REQUEST, run the ajax response through tryParse...
                //$RESPONSE.tryParse(resp);
                $RESPONSE.tryParse(data, status, jqxhr);

                var resp = $RESPONSE.getApiResponse(),
                    hash = $RESPONSE.getResponseHash().hash;
                console.log(resp);
                console.log(hash);
                // compare response
                compareResponseandHash(resp, hash);

                $("#paymentResponse").text(
                    $RESPONSE.getTransactionSuccess() ? "APPROVED" : "DECLINED"
                )
                $("#edit-commerce-payment-payment-method").hide();
                $("#paymentResponse").fadeTo(1000, 1);  
            })
        })
      
        $(".billing .form-control").blur(function(){
            toggleClasses($(this).val().length > 0, $(this).parent());
            checkForCompleteAndValidForm();
        })

        $("#edit-commerce-payment-payment-details-cc-number").blur(function() {
            var cc = $("#edit-commerce-payment-payment-details-cc-number").val();
            // we'll format the credit card number with dashes
            cc = $FORMATTING.formatCardNumberInput(cc, '-');
            $("#edit-commerce-payment-payment-details-cc-number").val(cc);
            // and then check it for validity
            isValidCC = $VALIDATION.isValidCreditCard(cc);
            toggleClasses(isValidCC, $(".form-item-commerce-payment-payment-details-cc-number"));
            checkForCompleteAndValidForm();
        })

        $("#edit-commerce-payment-payment-details-cc-expiration").blur(function() {
            var exp = $("#edit-commerce-payment-payment-details-cc-expiration").val();
            exp = $FORMATTING.formatExpirationDateInput(exp, '/');
            $("#edit-commerce-payment-payment-details-cc-expiration").val(exp);
            isValidExp = $VALIDATION.isValidExpirationDate(exp);
            toggleClasses(isValidExp, $(".form-item-commerce-payment-payment-details-cc-expiration"));
            checkForCompleteAndValidForm();
        })

        $("#edit-commerce-payment-payment-details-cc-cvv").blur(function() {
            var cvv = $("#edit-commerce-payment-payment-details-cc-cvv").val();
            cvv = cvv.replace(/\D/g,'');
            $("#edit-commerce-payment-payment-details-cc-cvv").val(cvv);
            isValidCVV = $VALIDATION.isValidCvv(cvv, $("#edit-commerce-payment-payment-details-cc-number").val()[0]);
            toggleClasses(isValidCVV, $(".form-item-commerce-payment-payment-details-cc-cvv"));
            checkForCompleteAndValidForm();
        })

        function compareResponseandHash(resp, hash){
            //alert(resp);
            $.post(
                variables[7] + "/sites/all/modules/custom/sage_paymentjs/js/verify.php",
                resp, // sage response string
                function(r) {
                    var calcHash = r.hash;
                    if(hash === calcHash){
                        $("#edit-continue").click(); // complete checkout
                    }
                    else{
                        alert('Oops, there is a problem with your payment, please submit again.');
                    }
                },
                "json"
            );
        }

        function toggleClasses(isValid, obj) {
            if (isValid) {
                obj.addClass("has-success").removeClass("has-error");
                obj.children(".help-block").text("Valid");
            } else {
                obj.removeClass("has-success").addClass("has-error");
                obj.children(".help-block").text("Invalid");
            }
        }

        function checkForCompleteAndValidForm() {
            var isValidBilling = true;
            $.each($(".billing"), function(){ isValidBilling = isValidBilling && $(this).hasClass("has-success") });
            
            // assuming most people fill out the form from top-to-bottom,
            // checking it from bottom-to-top takes advantage of short-circuiting
            if (isValidCVV && isValidExp && isValidCC && isValidBilling) {
                $("#edit-commerce-payment-payment-details-payment-submit").prop('disabled', false).addClass("not-disabled");
            }
        }
    });
});

