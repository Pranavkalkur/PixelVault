/**
 * PixelVault — Serialization Module
 *
 * Converts encrypted payloads into a binary stream ready to be
 * embedded in image pixels, and parses binary streams back out.
 *
 * Wire format  (all big-endian):
 * ┌──────────┬───────────┬──────────┬──────────────────┬──────────────────────┬───────────────┐
 * │ type (1) │ salt (16) │ iv (12)  │ filenameLen (2)  │ filename (variable)  │ ciphertext …  │
 * └──────────┴───────────┴──────────┴──────────────────┴──────────────────────┴───────────────┘
 *
 * type  0x00 = text,  0x01 = file
 * The outer steganography layer appends / checks for the EOF delimiter.
 */

import type { EncryptedPayload } from './crypto';

const TEXT_TYPE_FLAG = 0x00;
const FILE_TYPE_FLAG = 0x01;

export interface SerializedPayload {
    bits: Uint8Array;  // 0/1 per element
    byteLength: number;
}

export interface DeserializedPayload {
    type: 'text' | 'file';
    filename: string;
    ciphertext: ArrayBuffer;
    iv: Uint8Array;
    salt: Uint8Array;
}

/** Delimiter appended to signal end-of-payload inside the pixel stream. */
export const DELIMITER = new TextEncoder().encode('EOF====');

// ─── Helpers ─────────────────────────────────────────────

function bytesToBits(bytes: Uint8Array): Uint8Array {
    const bits = new Uint8Array(bytes.length * 8);
    for (let i = 0; i < bytes.length; i++) {
        for (let b = 7; b >= 0; b--) {
            bits[i * 8 + (7 - b)] = (bytes[i] >> b) & 1;
        }
    }
    return bits;
}

function bitsToBytes(bits: Uint8Array): Uint8Array {
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
        let byte = 0;
        for (let b = 0; b < 8; b++) {
            byte = (byte << 1) | bits[i * 8 + b];
        }
        bytes[i] = byte;
    }
    return bytes;
}

// ─── Public API ──────────────────────────────────────────

/**
 * Pack an encrypted payload + metadata into a binary bit-stream
 * ready for LSB embedding.
 */
export function serialize(
    encrypted: EncryptedPayload,
    type: 'text' | 'file',
    filename = '',
): SerializedPayload {
    const encoder = new TextEncoder();
    const filenameBytes = encoder.encode(filename);

    // type (1) + salt (16) + iv (12) + filenameLen (2) + filename + ciphertext + delimiter
    const cipherBytes = new Uint8Array(encrypted.ciphertext);
    const totalLength =
        1 + 16 + 12 + 2 + filenameBytes.length + cipherBytes.length + DELIMITER.length;
    const buffer = new Uint8Array(totalLength);

    let offset = 0;

    // Type flag
    buffer[offset++] = type === 'text' ? TEXT_TYPE_FLAG : FILE_TYPE_FLAG;

    // Salt (16 bytes)
    buffer.set(encrypted.salt, offset);
    offset += 16;

    // IV (12 bytes)
    buffer.set(encrypted.iv, offset);
    offset += 12;

    // Filename length (2 bytes, big-endian)
    buffer[offset++] = (filenameBytes.length >> 8) & 0xff;
    buffer[offset++] = filenameBytes.length & 0xff;

    // Filename
    buffer.set(filenameBytes, offset);
    offset += filenameBytes.length;

    // Ciphertext
    buffer.set(cipherBytes, offset);
    offset += cipherBytes.length;

    // Delimiter
    buffer.set(DELIMITER, offset);

    return { bits: bytesToBits(buffer), byteLength: totalLength };
}

/**
 * Parse a bit-stream extracted from an image back into the
 * encrypted payload and its metadata.
 */
export function deserialize(bits: Uint8Array): DeserializedPayload {
    const bytes = bitsToBytes(bits);

    let offset = 0;

    // Type flag
    const typeFlag = bytes[offset++];
    const type: 'text' | 'file' = typeFlag === FILE_TYPE_FLAG ? 'file' : 'text';

    // Salt
    const salt = bytes.slice(offset, offset + 16);
    offset += 16;

    // IV
    const iv = bytes.slice(offset, offset + 12);
    offset += 12;

    // Filename length
    const filenameLen = (bytes[offset] << 8) | bytes[offset + 1];
    offset += 2;

    // Filename
    const filename = new TextDecoder().decode(bytes.slice(offset, offset + filenameLen));
    offset += filenameLen;

    // Find delimiter to determine ciphertext end
    const delimStr = new TextDecoder().decode(DELIMITER);
    const fullStr = new TextDecoder().decode(bytes.slice(offset));
    const delimIdx = fullStr.indexOf(delimStr);

    let ciphertext: ArrayBuffer;
    if (delimIdx >= 0) {
        ciphertext = bytes.slice(offset, offset + delimIdx).buffer;
    } else {
        // Fallback: use everything remaining
        ciphertext = bytes.slice(offset).buffer;
    }

    return { type, filename, ciphertext, iv, salt };
}
