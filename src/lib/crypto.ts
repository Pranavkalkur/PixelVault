/**
 * PixelVault — Cryptography Module
 *
 * Handles password-based key derivation (PBKDF2) and
 * AES-GCM encryption / decryption via the Web Crypto API.
 */

const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH = 256;
const SALT_BYTES = 16;
const IV_BYTES = 12;

/** Derive a 256-bit AES-GCM key from a password and salt. */
async function deriveKey(
    password: string,
    salt: Uint8Array,
): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey'],
    );

    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt'],
    );
}

export interface EncryptedPayload {
    ciphertext: ArrayBuffer;
    iv: Uint8Array;
    salt: Uint8Array;
}

/**
 * Encrypt arbitrary data with a user-supplied password.
 * Returns an object with the ciphertext, IV, and salt —
 * all of which are needed to decrypt later.
 */
export async function encrypt(
    data: ArrayBuffer,
    password: string,
): Promise<EncryptedPayload> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveKey(password, salt);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        data,
    );

    return { ciphertext, iv, salt };
}

/**
 * Decrypt ciphertext using the original IV, salt, and password.
 * Throws if the password is wrong (AES-GCM auth tag mismatch).
 */
export async function decrypt(
    ciphertext: ArrayBuffer,
    iv: Uint8Array,
    salt: Uint8Array,
    password: string,
): Promise<ArrayBuffer> {
    const key = await deriveKey(password, salt);

    return crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        ciphertext,
    );
}
