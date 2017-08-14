// secrets 

var worker = new Worker("/js/secure/secrets_worker.js");

function goChanger(data) {
    // make the worker change the secret pin
    $('#changeSecretButton').addClass('disabled');

    $('#spinlabel').addClass('hidden');
    $('#spinner').removeClass('hidden');
    $('#spinner').addClass('fa-spin');

    worker.postMessage(data);
}

var savedPostData = "";
var savedCSRFToken = "";
var savedMnemonic = "";
var firstTime = false;

worker.addEventListener('message', function(event) {
    if (event.data.mType == 'save') {
	// show user the mnemonic

	savedPostData = event.data.message;
	savedCSRFToken = event.data.csrf_token;
	savedMnemonic = event.data.mnemonic;
	firstTime = !(event.data.pin_set);

	$('#spinlabel').removeClass('hidden');
	$('#spinner').addClass('hidden');
	$('#spinner').removeClass('fa-spin');

	// show mnemonic
	showMnemonic();

    } else {
	if (event.data.mType == 'error') { 
	    $('#changeSecretButton').removeClass('disabled'); 
	    $('#spinlabel').removeClass('hidden');
	    $('#spinner').addClass('hidden');
	    $('#spinner').removeClass('fa-spin');
	}

	if ('layout' in event.data && event.data.layout == 'topCenter') { noty({text: event.data.message, type: event.data.mType, layout: event.data.layout}); }
	else { noty({text: event.data.message, type: event.data.mType, layout: 'topCenter'}); }
    }
}, false);

function overwriteMnemonic() { savedMnemonic = CryptoJS.lib.WordArray.random(512/8).toString(CryptoJS.enc.Hex); }

function showMnemonic() {
    // show the mnemonic to the user

    $('#mnemonicText').html('<em>'+savedMnemonic+'</em>');
    $('#modalMnemonic').modal('show');

}

function sendSecrets() {
    // send the secrets we generated to Block.io

    $('#saveSecretsButton').addClass("disabled");
    $('#cancelSecretsButton').addClass('hidden');
    $("#isPayingAttention").attr("disabled", true);
    $('#senderSpinlabel').addClass('hidden');
    $('#senderSpinner').removeClass('hidden');
    $('#senderSpinner').addClass('fa-spin');
	    
    // the user was indeed paying attention, let's save their secrets
    noty({text: 'Sending Signed Secrets...', type: 'warning', layout: 'topCenter'});
    
    base_url = String(window.location).replace(String(window.location.pathname), '').split('?')[0];

    $.ajax({
        type: "POST",
        beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', savedCSRFToken)},
        url: (base_url+"/api/v2/change_secrets/"),
        data: savedPostData, // post data
        dataType: "json",
        //      data: { secrets: secrets, pubkeys: pubkeys, signatures: signatures },                                                                                                          
        success: function(data, textStatus, jqXHR)
        { // successful response

	    // overwrite the mnemonic, we don't need it anymore
	    overwriteMnemonic();

	    // show the appropriate notifications
	    noty({text: 'PIN changed successfully', type: 'success', layout: 'topCenter'});
	    noty({text: 'Please wait...', type: 'warning', layout: 'topCenter'});
	    setTimeout(reloadPage,5000,firstTime);
        },
        error: function (jqXHR, textStatus, errorThrown)
        { // error occurred

	    $('#saveSecretsButton').removeClass("disabled");
	    $("#isPayingAttention").removeAttr("disabled");
	    $('#cancelSecretsButton').removeClass('hidden');

	    $('#senderSpinlabel').removeClass('hidden');
	    $('#senderSpinner').addClass('hidden');
	    $('#senderSpinner').removeClass('fa-spin');
	    
	    try {
		parsedError = JSON.parse(jqXHR.responseText);
		noty({text: parsedError.data.error_message, type: 'error', layout: 'topCenter'});
	    } catch (err) {
		noty({text: 'Unable to change secrets. Please report this error.', type: 'error', layout: 'topCenter'});
	    }
        }
    });
    
}

