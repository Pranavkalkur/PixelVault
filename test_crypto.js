import { webcrypto as crypto } from 'node:crypto';
globalThis.crypto = crypto;

const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH = 256;
const SALT_BYTES = 16;
const IV_BYTES = 12;

async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt'],
    );
}

async function run() {
    try {
        const text = new TextEncoder().encode("Hello world").buffer;

        // Let's test derived keys for different password lengths
        for (let pass of ['123', '12345', '123456', '12345678']) {
            console.log("Testing:", pass);
            const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
            const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
            const key = await deriveKey(pass, salt);
            const ciphertext = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                text
            );

            const key2 = await deriveKey(pass, salt);
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key2,
                ciphertext
            );
            console.log("Success with:", pass, new TextDecoder().decode(decrypted));
        }
    } catch (err) {
        console.error("FAIL:", err);
    }
}
run();
