"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEncrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
const constants_1 = require("./constants");
const handleDecrypt = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const passphrase = constants_1.passPhrase;
        const key = yield crypto_1.default.subtle.importKey("raw", new TextEncoder().encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"]);
        const derivedKey = yield crypto_1.default.subtle.deriveKey({
            name: "PBKDF2",
            salt: new Uint8Array([]),
            iterations: 100000,
            hash: "SHA-256"
        }, key, { name: "AES-CBC", length: 256 }, true, ["decrypt"]);
        const passphraseBuffer = new TextEncoder().encode(passphrase);
        const hashBuffer = yield crypto_1.default.subtle.digest('SHA-256', passphraseBuffer);
        const iv = new Uint8Array(hashBuffer.slice(0, 16));
        const encryptedBytes = new Uint8Array(atob(data).split('').map(char => char.charCodeAt(0)));
        const encryptedArrayBuffer = encryptedBytes.buffer;
        const decryptedArrayBuffer = yield crypto_1.default.subtle.decrypt({
            name: "AES-CBC",
            iv: iv
        }, derivedKey, encryptedArrayBuffer);
        let decryptedData = new TextDecoder().decode(decryptedArrayBuffer);
        // console.log(decryptedData)
        return decryptedData;
    }
    catch (error) {
        console.error("Decryption failed:", error);
    }
});
exports.default = handleDecrypt;
// -------------------------------
const handleEncrypt = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const passphrase = constants_1.passPhrase;
        const textEncoder = new TextEncoder();
        const encodedData = textEncoder.encode(data);
        const passphraseBuffer = new TextEncoder().encode(passphrase);
        const hashBuffer = yield crypto_1.default.subtle.digest('SHA-256', passphraseBuffer);
        const iv = new Uint8Array(hashBuffer.slice(0, 16));
        const importedKey = yield crypto_1.default.subtle.importKey("raw", textEncoder.encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"]);
        const key = yield crypto_1.default.subtle.deriveKey({
            name: "PBKDF2",
            salt: new Uint8Array([]),
            iterations: 100000,
            hash: "SHA-256"
        }, importedKey, { name: "AES-CBC", length: 256 }, true, ["encrypt"]);
        const encrypted = yield crypto_1.default.subtle.encrypt({
            name: 'AES-CBC',
            iv: iv,
        }, key, encodedData);
        const encryptedData = btoa(String.fromCharCode(...Array.from(new Uint8Array(encrypted))));
        return encryptedData;
    }
    catch (error) {
        console.error("Encryption failed:", error);
    }
});
exports.handleEncrypt = handleEncrypt;
//# sourceMappingURL=decryption.js.map