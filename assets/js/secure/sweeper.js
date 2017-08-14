var sweepInterval = "";
var verifiedWIF = ""; // used for recording the last WIF we verified
var curCoinNetwork = "";
var sweepWifElement = "";

$(document).ready(function(){

    if ($('.sweep_wif_id').length) {
	sweepWifElement = $("input[name="+$('.sweep_wif_id').text()+"]");

	$('.sweepaddressbutton').click(function(){
	    // show the sweep address modal
	    verifiedWIF = ""; // reset the WIF we verified last
	    $('#sweepAddressModal').modal('show');
	    sweepWifElement.on('input', function() {
		
		if (sweepWifElement.val().length > 50 || (verifiedWIF.length > 0 && verifiedWIF != sweepWifElement.val()))
		{
		    verifyWIF(); // check if the WIF is valid whenever the input changes
		}
		
	    });
	    
	});

	$('#sweepCancelButton').click(function(){
	    // clear the on-change event
	    sweepWifElement.unbind();
	});
	
	$('#sweepFinalButton').click(function(){
	    // we want to sweep the coins; let's get going
	    
	    if (verifiedWIF.length) {
		executeSweep(); // git 'er done
	    }
	    else
	    { // we're not ready for the sweep, disable this button
		$(this).attr('disabled',true);
	    }
	});
    }

});

function executeSweep() {
    // start the sweeping process

    $('#sweepFinalButton').attr('disabled',true);
    $('#sweepCancelButton').attr('disabled',false);
    $('#sweepSpinner').removeClass('hidden').addClass('fa-spin');

    noty({text: "Beginning sweep. Your Private Key will stay here with you.", type: 'warning', layout: 'topCenter'});

    // create an address for this sweep
    var sweepDestLabel = "sweep_"+(CryptoJS.SHA256(Bitcoin.ECKey.fromWIF(verifiedWIF).pub.getAddress(curCoinNetwork).toString('hex')).toString(CryptoJS.enc.Hex).substring(0,4));
    var sweepDestAddress = "";

    var destCreated = false;
    var curApiKey = $("input[name='api_key']").val();

    $.getJSON("/api/v2/get_new_address/?api_key="+curApiKey+"&label="+sweepDestLabel, function(response){
	// success!
	noty({text: "Created destination address (Label="+sweepDestLabel+")", type: 'warning', layout: 'topCenter'});
	sweepDestAddress = response.data.address;

	executeSweepPhase2(sweepDestAddress, curApiKey); // go to tx creation
    }).fail(function() {
	$.getJSON("/api/v2/get_address_balance/?api_key="+curApiKey+"&label="+sweepDestLabel, function(response){
	    // does it already exist?
	    sweepDestAddress = response.data.balances[0].address;
	    executeSweepPhase2(sweepDestAddress, curApiKey);
	}).fail(function() {
	    // destination could not be created -- aborting sweep
	    noty({text: "Sweep Aborted: Destination address could not be created.", type: 'error', layout: 'topCenter'});	    
	    $('#sweepFinalButton').attr('disabled',false);
	    $('#sweepSpinner').addClass('hidden').removeClass('fa-spin');
	});
    });

}

function executeSweepPhase2(sweepDestAddress, curApiKey) {
    // ask Block.io to create the transaction
    
    var curKey = Bitcoin.ECKey.fromWIF(verifiedWIF);
    var txinfo = undefined;

    noty({text: "Creating transaction...", type: 'warning', layout: 'topCenter'});	    
    $.getJSON("/api/v2/sweep_from_address/?api_key="+curApiKey+"&from_address="+curKey.pub.getAddress(curCoinNetwork).toString('hex')+"&public_key="+curKey.pub.toHex()+"&to_address="+sweepDestAddress, function(response){

	txinfo = generalSign(response.data, curKey);

	// data's been signed, let's finalize the transaction
	$.post("/api/v2/sign_and_finalize_sweep/?api_key="+curApiKey, "signature_data="+JSON.stringify(txinfo), function(response) {
	    // it was a success
	    var formatted_amount = BigNumber(response.data.amount_sent).number_with_delimiter(parseInt($('#precision').text()));

	    noty({text: "Sweep completed: "+formatted_amount+" "+response.data.network+" were transferred into your wallet.", type: 'success', layout: 'topCenter'});
	    noty({text: 'Updating balances...', type: 'warning', layout: 'topCenter'});
	    setTimeout(reloadPage,5000);
	}, "json").fail(function(response){
	    // finalization failed
	    noty({text: "Sweep Aborted: " + JSON.parse(response.responseText).data.error_message, type: 'error', layout: 'topCenter'});
	    $('#sweepFinalButton').attr('disabled',false);
	    $('#sweepCancelButton').attr('disabled',false);
	    $('#sweepSpinner').addClass('hidden').removeClass('fa-spin');
	});
    }).fail(function(response){
	// failed, let's show the error
	noty({text: "Sweep Aborted: " + JSON.parse(response.responseText).data.error_message, type: 'error', layout: 'topCenter'});
	$('#sweepFinalButton').attr('disabled',false);
	$('#sweepCancelButton').attr('disabled',false);
	$('#sweepSpinner').addClass('hidden').removeClass('fa-spin');
    });
}

function setCurCoinNetwork(curNetwork) {
    // sets the network variable to use with blockiojs

    var networkSet = false;
    var curNetwork = curNetwork.toUpperCase();

    if (curNetwork == "BTC")
	{
	    curCoinNetwork = Bitcoin.networks.bitcoin;
	    networkSet = true;
	}
    else if (curNetwork == "DOGE")
	{
	    curCoinNetwork = Bitcoin.networks.dogecoin;
	    networkSet = true;
	}
    else if (curNetwork == "LTC")
	{
	    curCoinNetwork = Bitcoin.networks.litecoin;
	    networkSet = true;
	}
    else if (curNetwork == "BTCTEST")
	{
	    curCoinNetwork = Bitcoin.networks.bitcoin_testnet;
	    networkSet = true;
	}
    else if (curNetwork == "DOGETEST")
	{
	    curCoinNetwork = Bitcoin.networks.dogecoin_testnet;
	    networkSet = true;
	}
    else if (curNetwork == "LTCTEST")
	{
	    curCoinNetwork = Bitcoin.networks.litecoin_testnet;
	    networkSet = true;
	}

    return networkSet;
}

function verifyWIF() {
    // verifies the user entered a proper Private Key

    if (verifiedWIF.length > 0 && sweepWifElement.val() === verifiedWIF)
    {
	console.log("VERIFIED!");
	return true;
    }

    $('#sweepFinalButton').attr('disabled',true);

    if (curCoinNetwork.length == 0)
	setCurCoinNetwork(curNetwork);

    var curWIF = sweepWifElement.val();

    if (curWIF.length < 50)
	return false; // string is too short, can't be a full WIF

    var curAddress = "";
    var curApiKey = $("input[name='api_key']").val();

    
    try {
	
	// verify Wallet Import Format version byte
	if (Base58Sweeper.decode(curWIF)[0] != curCoinNetwork.wif) {
	    throw "Invalid version byte";
	}

	curWIF = Bitcoin.ECKey.fromWIF(curWIF);
	curAddress = curWIF.pub.getAddress(curCoinNetwork).toString('hex');

	$('#sweep-from').html("<strong>Address</strong>: " + curAddress); // set the address

	// get the balance available to withdraw from this address
	$.getJSON('/api/v2/get_address_balance/?api_key='+curApiKey+'&address='+curAddress, function(response) {
//	    console.log("Available Balance: " + response.data.available_balance + "+" + response.data.pending_received_balance);

	    var avail_balance = BigNumber(response.data.available_balance);
	    var pending_balance = BigNumber(response.data.pending_received_balance);

	    var sweepable_balance = (avail_balance.plus(pending_balance));

	    // update the sweepable balance
	    $('#sweep-bal-available').text(sweepable_balance.number_with_delimiter(parseInt($('#precision').text())));

	    if (!(sweepable_balance.equals(BigNumber('0.0'))))
	    { // enable the sweep button -- we're good to go
		$('#sweepFinalButton').attr('disabled', false);
		$('#sweepCancelButton').attr('disabled',false);
		$('#sweepFinalButton').removeClass('disabled');
	    }

	});

	verifiedWIF = curWIF.toWIF(curCoinNetwork); // must be the same as what the user entered
    } catch(err) {
	$('#sweep-from').text("Waiting for valid Private Key ("+curNetwork.toUpperCase()+")..."); // reset the address
	verifiedWIF = ""; // reset the WIF
	$('#sweep-bal-available').text(BigNumber('0.0').number_with_delimiter(parseInt($('#precision').text())));
    }

}

// base58 helper
(function() {
  var ALPHABET, ALPHABET_MAP, Base58, i;

  Base58Sweeper = (typeof module !== "undefined" && module !== null ? module.exports : void 0) || (window.Base58 = {});

  ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  ALPHABET_MAP = {};

  i = 0;

  while (i < ALPHABET.length) {
    ALPHABET_MAP[ALPHABET.charAt(i)] = i;
    i++;
  }

  Base58Sweeper.encode = function(buffer) {
    var carry, digits, j;
    if (buffer.length === 0) {
      return "";
    }
    i = void 0;
    j = void 0;
    digits = [0];
    i = 0;
    while (i < buffer.length) {
      j = 0;
      while (j < digits.length) {
        digits[j] <<= 8;
        j++;
      }
      digits[0] += buffer[i];
      carry = 0;
      j = 0;
      while (j < digits.length) {
        digits[j] += carry;
        carry = (digits[j] / 58) | 0;
        digits[j] %= 58;
        ++j;
      }
      while (carry) {
        digits.push(carry % 58);
        carry = (carry / 58) | 0;
      }
      i++;
    }
    i = 0;
    while (buffer[i] === 0 && i < buffer.length - 1) {
      digits.push(0);
      i++;
    }
    return digits.reverse().map(function(digit) {
      return ALPHABET[digit];
    }).join("");
  };

  Base58Sweeper.decode = function(string) {
    var bytes, c, carry, j;
    if (string.length === 0) {
      return new (typeof Uint8Array !== "undefined" && Uint8Array !== null ? Uint8Array : Buffer)(0);
    }
    i = void 0;
    j = void 0;
    bytes = [0];
    i = 0;
    while (i < string.length) {
      c = string[i];
      if (!(c in ALPHABET_MAP)) {
        throw "Base58.decode received unacceptable input. Character '" + c + "' is not in the Base58 alphabet.";
      }
      j = 0;
      while (j < bytes.length) {
        bytes[j] *= 58;
        j++;
      }
      bytes[0] += ALPHABET_MAP[c];
      carry = 0;
      j = 0;
      while (j < bytes.length) {
        bytes[j] += carry;
        carry = bytes[j] >> 8;
        bytes[j] &= 0xff;
        ++j;
      }
      while (carry) {
        bytes.push(carry & 0xff);
        carry >>= 8;
      }
      i++;
    }
    i = 0;
    while (string[i] === "1" && i < string.length - 1) {
      bytes.push(0);
      i++;
    }
    return new (typeof Uint8Array !== "undefined" && Uint8Array !== null ? Uint8Array : Buffer)(bytes.reverse());
  };

}).call(this);

