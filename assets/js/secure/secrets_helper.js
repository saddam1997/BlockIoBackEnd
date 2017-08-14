// basic encryption algorithms for block.io

function isAlphaNumeric(str) {
    str = String(str); // just in case
    return /^[0-9a-zA-Z]+$/.test(str);
}

function encrypt (data, passphrase) {    
    var HEX_KEY = pinToAesKey(passphrase)['key'];
    var key = CryptoJS.enc.Hex.parse(HEX_KEY);
    var enc = CryptoJS.AES.encrypt(data, key, { mode: CryptoJS.mode.ECB });
    
    return enc.ciphertext.toString(CryptoJS.enc.Base64).split(/\s/).join('');
}

function decrypt (b64ciph, passphrase, isMnemonic) {
    // hashes passphrase into pbkdf2-derived key

    // set default param values
    if(isMnemonic === undefined) {
      isMnemonic = false;
   }
    
    var HEX_KEY = pinToAesKey(passphrase, isMnemonic)['key'];
    var key = CryptoJS.enc.Hex.parse(HEX_KEY);
    var cipher = CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Base64.parse(b64ciph) });
    var dec = CryptoJS.AES.decrypt(cipher, key, { mode: CryptoJS.mode.ECB });
    
    return dec.toString(CryptoJS.enc.Utf8);
}

function pinToAesKey(passphrase, isMnemonicSeed) {
    // returns a mnemonic seed, and encryption key

    // set default param values
    if(isMnemonicSeed === undefined) {
      isMnemonicSeed = false;
    }

    var iterations = 2048;
    var mnemonicSeed = passphrase;
    
    if (!isMnemonicSeed) {
	// keep this small so the generated mnemonic is manageable
	mnemonicSeed = CryptoJS.PBKDF2(passphrase, "", { keySize: 128/32, iterations: iterations/2, hasher:CryptoJS.algo.SHA256 }).toString(CryptoJS.enc.Hex);
    }
    
    var encryptionKey = CryptoJS.PBKDF2(mnemonicSeed, "", { keySize: 256/32, iterations: iterations/2, hasher:CryptoJS.algo.SHA256 }).toString(CryptoJS.enc.Hex);
    
//    console.log("Encryption Key: "+encryptionKey+" Mnemonic Seed: "+mnemonicSeed);
    
    return { key: encryptionKey, mnemonicSeed: mnemonicSeed };
	    
}
