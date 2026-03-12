/**
 * PixelVault — Steganography Module
 *
 * LSB (Least Significant Bit) encoding and decoding via the
 * HTML5 Canvas API.  Operates on R, G, B channels only —
 * the Alpha channel is left untouched.
 */

import { DELIMITER } from './serialization';

// ─── Canvas helpers ──────────────────────────────────────

/** Load a File / Blob into an HTMLImageElement. */
export function loadImage(file: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

/** Draw an image onto an off-screen canvas and return its pixel data. */
export function imageToPixels(img: HTMLImageElement): {
    imageData: ImageData;
    width: number;
    height: number;
} {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { imageData, width: canvas.width, height: canvas.height };
}

// ─── Capacity ────────────────────────────────────────────

/** Returns the maximum payload size in **bytes** for a given image. */
export function getCapacity(width: number, height: number): number {
    // 3 usable channels (R, G, B) per pixel, 1 bit each → 3 bits per pixel
    return Math.floor((width * height * 3) / 8);
}

// ─── Encode ──────────────────────────────────────────────

/**
 * Embed a bit-stream into the LSBs of the image's RGB channels.
 * Returns the modified ImageData (caller must render to canvas / PNG).
 */
export function encode(
    imageData: ImageData,
    payloadBits: Uint8Array,
): ImageData {
    const pixels = imageData.data; // Uint8ClampedArray  [R,G,B,A, R,G,B,A, …]
    const capacity = getCapacity(imageData.width, imageData.height) * 8; // in bits

    if (payloadBits.length > capacity) {
        throw new Error(
            `Payload too large. Need ${payloadBits.length} bits, but image only holds ${capacity} bits.`,
        );
    }

    let bitIndex = 0;

    for (let i = 0; i < pixels.length && bitIndex < payloadBits.length; i++) {
        // Skip every 4th byte (Alpha channel)
        if ((i + 1) % 4 === 0) continue;

        // Clear LSB then set it to the payload bit
        pixels[i] = (pixels[i] & 0xfe) | payloadBits[bitIndex];
        bitIndex++;
    }

    return imageData;
}

// ─── Decode ──────────────────────────────────────────────

/**
 * Extract hidden bits from the LSBs of the image's RGB channels.
 * Stops when the EOF delimiter is found or the image is exhausted.
 */
export function decode(imageData: ImageData): Uint8Array {
    const pixels = imageData.data;
    const delimiterBits = delimiterToBits();
    const bits: number[] = [];

    for (let i = 0; i < pixels.length; i++) {
        if ((i + 1) % 4 === 0) continue; // skip Alpha

        bits.push(pixels[i] & 1);

        // Check for delimiter after every full byte
        if (bits.length % 8 === 0 && bits.length >= delimiterBits.length) {
            if (endsWithDelimiter(bits, delimiterBits)) {
                // Remove the delimiter bits from the result
                return new Uint8Array(bits.slice(0, bits.length - delimiterBits.length));
            }
        }
    }

    // No delimiter found — return everything
    return new Uint8Array(bits);
}

// ─── LSB Visualisation (Steganalysis) ────────────────────

/**
 * Produce a new ImageData that amplifies the LSBs for visual
 * steganalysis.  Each channel's LSB is multiplied by 255 so
 * embedded data appears as bright noise against a black background.
 */
export function visualizeLSB(imageData: ImageData): ImageData {
    const src = imageData.data;
    const out = new Uint8ClampedArray(src.length);

    for (let i = 0; i < src.length; i += 4) {
        out[i] = (src[i] & 1) * 255;       // R
        out[i + 1] = (src[i + 1] & 1) * 255; // G
        out[i + 2] = (src[i + 2] & 1) * 255; // B
        out[i + 3] = 255;                      // A — fully opaque
    }

    return new ImageData(out, imageData.width, imageData.height);
}

// ─── PNG export ──────────────────────────────────────────

/**
 * Render modified ImageData to a canvas and export as a PNG Blob.
 */
export function imageDataToPNG(imageData: ImageData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))),
            'image/png',
        );
    });
}

// ─── Internal ────────────────────────────────────────────

function delimiterToBits(): number[] {
    const bits: number[] = [];
    for (const byte of DELIMITER) {
        for (let b = 7; b >= 0; b--) {
            bits.push((byte >> b) & 1);
        }
    }
    return bits;
}

function endsWithDelimiter(bits: number[], delim: number[]): boolean {
    const start = bits.length - delim.length;
    for (let i = 0; i < delim.length; i++) {
        if (bits[start + i] !== delim[i]) return false;
    }
    return true;
}
