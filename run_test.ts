import { encrypt, decrypt } from './src/lib/crypto.js';
import { serialize, deserialize } from './src/lib/serialization.js';
import * as crypto from 'crypto';

// Polyfill Web Crypto API
globalThis.crypto = crypto.webcrypto as any;

async function test(password) {
    console.log(`\nTesting password: "${password}" (${password.length} chars)`);
    try {
        const payload = new TextEncoder().encode("Hello world").buffer;

        // 1. Encrypt
        const encrypted = await encrypt(payload, password);

        // 2. Serialize
        const { bits, byteLength } = serialize(encrypted, 'text', '');

        // 3. Simulate Steganography (append and remove delimiter)
        const bytes = new Uint8Array(Math.floor(bits.length / 8));
        for (let i = 0; i < bytes.length; i++) {
            let byte = 0;
            for (let b = 0; b < 8; b++) {
                byte = (byte << 1) | bits[i * 8 + b];
            }
            bytes[i] = byte;
        }

        // Simulate Stego's remove delimiter logic:
        // Stego checks the bit array and REMOVES the delimiter bits when finding it.
        // So the bits fed to deserialize WILL NOT HAVE the delimiter!
        const delimiterStr = "EOF====";
        const delimBytes = new TextEncoder().encode(delimiterStr);
        // Remove the exact delimiter bytes from the end
        const recoveredBytes = bytes.slice(0, bytes.length - delimBytes.length);

        // Convert back to bits as stego.decode would return
        const recoveredBits = new Uint8Array(recoveredBytes.length * 8);
        for (let i = 0; i < recoveredBytes.length; i++) {
            for (let b = 7; b >= 0; b--) {
                recoveredBits[i * 8 + (7 - b)] = (recoveredBytes[i] >> b) & 1;
            }
        }

        // 4. Deserialize
        const deserialized = deserialize(recoveredBits);

        // 5. Decrypt
        const plaintext = await decrypt(
            deserialized.ciphertext,
            deserialized.iv,
            deserialized.salt,
            password
        );
        const text = new TextDecoder().decode(plaintext);
        console.log(`✅ Success! Recovered text: ${text}`);
    } catch (err) {
        console.error(`❌ Failed: ${err.message}`);
    }
}

async function run() {
    await test("1234");
    await test("12345");
    await test("123456");
    await test("1234567");
    await test("12345678");
}

run();
