import crypto from 'crypto'
import { passPhrase } from './constants';

const handleDecrypt = async (data: string) => {
        try {
        const passphrase = passPhrase;
    
        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(passphrase),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );
    
        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new Uint8Array([]), 
                iterations: 100000,
                hash: "SHA-256"
            },
            key,
            { name: "AES-CBC", length: 256 },
            true,
            ["decrypt"]
        );
    
        const passphraseBuffer = new TextEncoder().encode(passphrase);
    
        const hashBuffer = await crypto.subtle.digest('SHA-256', passphraseBuffer);
    
        const iv = new Uint8Array(hashBuffer.slice(0, 16));
    
        const encryptedBytes = new Uint8Array(atob(data).split('').map(char => char.charCodeAt(0)));
    
        const encryptedArrayBuffer = encryptedBytes.buffer;
    
        const decryptedArrayBuffer = await crypto.subtle.decrypt(
            {
                name: "AES-CBC",
                iv: iv
            },
            derivedKey,
            encryptedArrayBuffer
        );
    
        let decryptedData = new TextDecoder().decode(decryptedArrayBuffer);
    
        // console.log(decryptedData)

        return decryptedData
    
        } catch (error) {
            console.error("Decryption failed:", error);
        }
    };

export default handleDecrypt

// -------------------------------

export const handleEncrypt = async (data: string) => {

    try {

        const passphrase = passPhrase;

        const textEncoder = new TextEncoder();

        const encodedData = textEncoder.encode(data);

        const passphraseBuffer = new TextEncoder().encode(passphrase);

        const hashBuffer = await crypto.subtle.digest('SHA-256', passphraseBuffer);

        const iv = new Uint8Array(hashBuffer.slice(0, 16));

        const importedKey = await crypto.subtle.importKey(
            "raw",
            textEncoder.encode(passphrase),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new Uint8Array([]), 
                iterations: 100000,
                hash: "SHA-256"
            },
            importedKey,
            { name: "AES-CBC", length: 256 },
            true,
            ["encrypt"]
        );

        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-CBC',
                iv: iv,
            },
            key,
            encodedData
        );

        const encryptedData = btoa(String.fromCharCode(...Array.from(new Uint8Array(encrypted))));
        
        return encryptedData
        
        } catch (error) {

        console.error("Encryption failed:", error);
        
    }
    
}