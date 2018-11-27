"use strict";
const SALT = "63468D4A7232221586C7B820888B269C384741C86D473B2923FA91CBCCF79863";
const aes = {
    get IV_SIZE() { return 16; },
    /**
     * Get default encryption parameters.
     *
     * @returns {AesGcmParams}
     * @param {?Uint8Array} iv
     */
    getAlgorthm: iv => {
        if (iv === undefined) {
            iv = crypto.getRandomValues(new Uint8Array(aes.IV_SIZE));
        }

        if (iv.length != aes.IV_SIZE) {
            throw new RangeError(`IV must be ${aes.IV_SIZE} bytes`);
        }

        return {
            name: 'AES-GCM',
            length: 256,
            iv: iv
        };
    },

    /**
     * Generate Crypto Key
     *
     * @param {String} password
     * @return {CryptoKey}
     */
    generateKey: async password => {
        var encoder = new TextEncoder();
        var algo = {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt: encoder.encode(SALT),
            iterations: 1000
        };
        let key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2'}, false, ['deriveKey']);
        return crypto.subtle.deriveKey(algo, key, aes.getAlgorthm(), false, ['encrypt', 'decrypt']);
    }
};

const v1 = {
    identifier: [0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0xFF],
    /**
     * @param {Uint8Array} encrypted
     * @return {boolean}
     */
    match: encrypted => encrypted[0] === v1.identifier[0] && encrypted[1] === v1.identifier[1] && encrypted[2] === v1.identifier[2],
    /**
     * @param {String} password
     * @param {String} plaintext
     * @returns {Uint8Array}
     */
    encrypt: async (password, plaintext) => {
        let key = await aes.generateKey(password),
            algo = aes.getAlgorthm(),
            encoder = new TextEncoder();

        let encrypted = new Uint8Array(await crypto.subtle.encrypt(algo, key, encoder.encode(plaintext)));
        let output = new Uint8Array(v1.identifier.length + algo.iv.length + encrypted.length);
        output.set(v1.identifier)
        output.set(algo.iv, v1.identifier.length);
        output.set(encrypted, v1.identifier.length + algo.iv.length);

        return output;
    },
    /**
     * @param {String} password
     * @param {Uint8Array} encrypted
     * @return {string}
     */
    decrypt: async (password, encrypted) => {
        if (!v1.match(encrypted)) {
            throw new TypeError("Incorrect backup version version.");
        }

        let iv = encrypted.subarray(v1.identifier.length, v1.identifier.length + aes.IV_SIZE),
            key = await aes.generateKey(password),
            algo = aes.getAlgorthm(iv);

        encrypted = encrypted.subarray(v1.identifier.length + aes.IV_SIZE);

        let output = await crypto.subtle.decrypt(algo, key, encrypted);
        return new TextDecoder().decode(output);
    }
}

const algos = [v1];
class Encryption {
    /**
     * Encrypt the provided data with the most recent file format.
     *
     * @param {String} password
     * @param {String} plaintext
     * @returns {Uint8Array}
     */
    static async encrypt (password, plaintext) { return algos[algos.length - 1].encrypt(password, plaintext) }

    /**
     * Attempt to decrypt the provided data by sniffing it's format.
     *
     * @param {String} password
     * @param {Uint8Array} encrypted
     * @return {string}
     */
    static async decrypt (password, encrypted) {
        let algo = algos.find(a => a.match(encrypted));
        if (algo === undefined)
            throw new Error("Backup not supported.");

        return algo.decrypt(password, encrypted);
    }
}

export { Encryption };