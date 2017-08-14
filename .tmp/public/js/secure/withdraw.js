// BigNumber.prototype.number_with_delimiter = function(precision) {
//     var number = this.toFixed(8), delimiter = ',', precision = precision || 2;
//     var split = number.split('.');
//     split[0] = split[0].replace(
//             /(\d)(?=(\d\d\d)+(?!\d))/g,
//     '$1' + delimiter
//     );
//
//     if (split.length == 1) { split[split.length] = "00"; }
//     while (split[1].length < precision) { split[1] = split[1].concat("0"); }
//     while (split[1].length > precision) { split[1] = split[1].substring(0, precision); }
//     return split.join('.');
// };

function isValidAddress(address) {
    // check if the address has a valid checksum

    response = {message: '', is_valid: true}

    try {
	Bitcoin.Address.fromBase58Check(address);
    } catch (err) {
	response['is_valid'] = false;
	response['message'] = 'Invalid payment address specified. Must be a '+$('#coin-name').text()+' address.';
    }

    return response;
}

function isValidAmount(amount, max_balance) {
    // check if the amount is a 'float', is greater than 0, and less than max_balance (accounting for min estimated network fee)

    response = {message: '', is_valid: true};

    if (max_balance == undefined) { max_balance = BigNumber(-1); } // we don't know the max balance

    try {
	amount = BigNumber(amount.replace(/,/g , ''));
    } catch (err) {
	response['is_valid'] = false;
	response['message'] = 'Invalid amount specified.';
    }

    coinSymbol = $('#coin-symbol').text();
    minWithdrawalLimit = BigNumber($('#min-withdrawal-limit').text());
    maxWithdrawalLimit = BigNumber($('#max-withdrawal-limit').text());
    estimatedNetworkFee = BigNumber($('#estimated-network-fee').text());
    precision = parseInt($('#precision').text());

    if (response['is_valid'] && minWithdrawalLimit.gt(amount)) { response['is_valid'] = false; response['message'] = 'Minimum withdrawal amount is '+minWithdrawalLimit.number_with_delimiter(precision)+' '+coinSymbol; }

    if (response['is_valid'] && amount.gt(maxWithdrawalLimit)) { response['is_valid'] = false; response['message'] = 'Maximum withdrawal per transaction is '+maxWithdrawalLimit.number_with_delimiter(0)+' '+coinSymbol; };
    if (response['is_valid'] && amount.gt(max_balance.minus(estimatedNetworkFee))) { response['is_valid'] = false; response['message'] = 'Withdrawal amount cannot exceed '+(max_balance - estimatedNetworkFee).number_with_delimiter(precision)+' '+coinSymbol + ' due to mandatory network fees. Estimated network fee: '+estimatedNetworkFee.number_with_delimiter(precision)+' '+coinSymbol; };

    return response;
}

function executeWithdrawal(api_key, from_user_ids, payment_address, amount, pin_current, csrf_token, max_balance) {
    // executes withdrawal for the user
    console.log("executeWithdrawal.........");
    $('#withdrawalButton').addClass('disabled');
    $('#withdrawSpinner').removeClass('hidden');
    $('#withdrawSpinner').addClass('fa-spin');
    $('#withdrawSpinlabel').addClass('hidden');

    // verify the validity of params
    validation = isValidAmount(String(amount),max_balance);
    if (!validation['is_valid']) {
	noty({text: validation['message'], type: 'error', layout: 'topCenter'});
	$('#withdrawalButton').removeClass('disabled');
	$('#withdrawSpinner').addClass('hidden');
	$('#withdrawSpinner').removeClass('fa-spin');
	$('#withdrawSpinlabel').removeClass('hidden');
	return false;
    }

    // valid destination address
    validation = isValidAddress(payment_address);
    if (!validation['is_valid']) {
	noty({text: validation['message'], type: 'error', layout: 'topCenter'});
	$('#withdrawalButton').removeClass('disabled');
	$('#withdrawSpinner').addClass('hidden');
	$('#withdrawSpinner').removeClass('fa-spin');
	$('#withdrawSpinlabel').removeClass('hidden');
	return false;
    }

    noty({text: 'Creating transaction...', type: 'warning', layout: 'topCenter'});

    var savedPostData = "api_key="+api_key+"&to_address="+payment_address+"&amount="+amount+"&priority="+$('#priority').text();

    if (from_user_ids.length > 0) { savedPostData += "&from_user_ids="+from_user_ids; }

    base_url = String(window.location).replace(String(window.location.pathname), '').split('?')[0].split('#')[0];

    // request withdrawal from block.io
    $.ajax({
        type: "POST",
        beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', csrf_token)},
        url: (base_url+"/api/v2/withdraw/"),
        data: savedPostData, // post data
	dataType: "json",
        success: function(data, textStatus, jqXHR)
        { // successful response

            // show the appropriate notifications
            noty({text: 'Signing transaction...', type: 'warning', layout: 'topCenter'});
	    signTransaction(jqXHR.responseText, pin_current, csrf_token, api_key, payment_address); // pass the txinfo as json string

        },
        error: function (jqXHR, textStatus, errorThrown)
        { // error occurred
	    $('#withdrawalButton').removeClass('disabled');
	    $('#withdrawSpinner').addClass('hidden');
	    $('#withdrawSpinner').removeClass('fa-spin');
	    $('#withdrawSpinlabel').removeClass('hidden');
            parsedError = JSON.parse(jqXHR.responseText);
            noty({text: parsedError.data.error_message, type: 'error', layout: 'topCenter'});
        }
    });

}

function generalSign(txinfo, key) {
    // signs the data given a key

    var pubkey = key.pub.toHex();

    // iterate over all inputs
    for (var i = 0; i < txinfo['inputs'].length; i += 1) {
	input = txinfo['inputs'][i];

	data_to_sign = input['data_to_sign'];

	// iterate sigs required
	for (var j = 0; j < input['signers'].length; j += 1) {
	    signer = input['signers'][j];

	    if (signer['signer_public_key'] === pubkey) {
		// sign the data, and update this object
		signer['signed_data'] = key.sign(data_to_sign);
	    }
	}

    }

    return txinfo;
}

function signTransaction(jsonData,curPin,csrf_token,api_key,payment_address) {
    // sign the transaction with the provided encrypted_passphrase

    txinfo = JSON.parse(jsonData)['data']

    e_pass = txinfo['encrypted_passphrase']['passphrase'];
    pubkey = txinfo['encrypted_passphrase']['signer_public_key'];

    passphrase = "";
    key = undefined;

    try {
	passphrase = decrypt(e_pass,curPin);
	key = Bitcoin.ECKey.fromPassphrase(passphrase);

	if (pubkey != key.pub.toHex()) { throw("PIN mismatch"); }

    } catch (err) {
	// invalid secret pin
	noty({text: 'Invalid Secret PIN provided.', type: 'error', layout: 'topCenter'});
	$('#withdrawalButton').removeClass('disabled');
	$('#withdrawSpinner').addClass('hidden');
	$('#withdrawSpinner').removeClass('fa-spin');
	$('#withdrawSpinlabel').removeClass('hidden');

	return false;
    }

    // decrypt the passphrase and confirm pubkey

    txinfo = generalSign(txinfo, key);

    var savedPostData = "api_key="+api_key+"&signature_data="+JSON.stringify(txinfo);

    base_url = String(window.location).replace(String(window.location.pathname), '').split('?')[0].split('#')[0];

    // send the data to Block.io
    $.ajax({
        type: "POST",
        beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', csrf_token)},
        url: (base_url+"/api/v2/sign_and_finalize_withdrawal/"),
        data: savedPostData, // post data
	dataType: "json",
        success: function(data, textStatus, jqXHR)
        { // successful response
	    response = JSON.parse(jqXHR.responseText);

	    $('#withdrawCancelButton').addClass('hidden');

            // show the appropriate notifications
	    coinSymbol = $('#coin-symbol').text();
            noty({text: 'You sent '+BigNumber(response['data']['amount_sent']).number_with_delimiter(parseInt($('#precision').text()))+' '+coinSymbol+' to '+payment_address, type: 'success', layout: 'topCenter'});

	    // reload the page with updated balances
            noty({text: 'Updating balances...', type: 'warning', layout: 'topCenter'});

	    setTimeout(reloadPage,5000);
        },
        error: function (jqXHR, textStatus, errorThrown)
        { // error occurred
	    $('#withdrawalButton').removeClass('disabled');
	    $('#withdrawSpinner').addClass('hidden');
	    $('#withdrawSpinner').removeClass('fa-spin');
	    $('#withdrawSpinlabel').removeClass('hidden');

	    noty({text: 'Unable to send signed data. Please report this error.', type: 'error', layout: 'topCenter'});

            parsedError = JSON.parse(jqXHR.responseText);
            noty({text: parsedError.data.error_message, type: 'error', layout: 'topCenter'});
        }
    });

}
