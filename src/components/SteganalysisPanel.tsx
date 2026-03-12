import React, { useState, useCallback } from 'react';
import DropZone from './DropZone';
import { loadImage, imageToPixels, decode } from '../lib/steganography';

interface AnalysisResult {
    detected: boolean;
    payloadBytes: number;
    totalCapacity: number;
    usagePercent: number;
}

const SteganalysisPanel: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const handleFile = useCallback((f: File) => {
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setResult(null);
    }, []);

    const handleClear = useCallback(() => {
        setFile(null);
        setPreview(null);
        setResult(null);
    }, []);

    const analyze = useCallback(async () => {
        if (!file) return;
        setAnalyzing(true);
        setResult(null);

        try {
            const img = await loadImage(file);
            const { imageData, width, height } = imageToPixels(img);

            // Total capacity in bytes (3 usable channels per pixel, 1 bit each)
            const totalCapacity = Math.floor((width * height * 3) / 8);

            // Extract LSB bits — decode() scans for the EOF==== delimiter
            const extractedBits = decode(imageData);

            // Check if a valid payload with delimiter was found
            // If decode found and stripped the delimiter, the extracted bits
            // represent a real payload. We verify by checking length > 0
            // and that the first byte is a valid type flag (0x00=text, 0x01=file)
            const payloadBytes = Math.floor(extractedBits.length / 8);

            // Reconstruct first byte to check type flag
            let firstByte = 0;
            if (extractedBits.length >= 8) {
                for (let b = 0; b < 8; b++) {
                    firstByte = (firstByte << 1) | extractedBits[b];
                }
            }

            // PixelVault payloads start with 0x00 (text) or 0x01 (file)
            // and must be at least 31 bytes (1 type + 16 salt + 12 iv + 2 fnameLen)
            const hasValidHeader =
                payloadBytes >= 31 && (firstByte === 0x00 || firstByte === 0x01);

            // Also check: if extractedBits.length equals the total pixel capacity,
            // it means decode() exhausted all pixels WITHOUT finding the delimiter
            const delimiterFound =
                extractedBits.length < (width * height * 3);

            const detected = hasValidHeader && delimiterFound;
            const usagePercent = totalCapacity > 0
                ? Math.round((payloadBytes / totalCapacity) * 100 * 10) / 10
                : 0;

            setResult({
                detected,
                payloadBytes: detected ? payloadBytes : 0,
                totalCapacity,
                usagePercent: detected ? usagePercent : 0,
            });
        } catch (e) {
            console.error('Analysis failed:', e);
            setResult({
                detected: false,
                payloadBytes: 0,
                totalCapacity: 0,
                usagePercent: 0,
            });
        } finally {
            setAnalyzing(false);
        }
    }, [file]);

    return (
        <div className="space-y-8">
            {/* ── Upload ── */}
            <DropZone
                file={file}
                preview={preview}
                onFile={handleFile}
                onClear={handleClear}
                label="Drop an image to analyze"
            />

            {/* ── Analyze button ── */}
            <button
                className="btn-primary w-full"
                disabled={!file || analyzing}
                onClick={analyze}
            >
                {analyzing ? (
                    <span className="processing-text">ANALYZING…</span>
                ) : (
                    'ANALYZE'
                )}
            </button>

            {/* ── Verdict ── */}
            {result && (
                <div
                    className="border-2 border-black p-8 text-center space-y-6"
                    style={{ background: result.detected ? 'var(--color-black)' : 'var(--color-white)' }}
                >
                    {/* Main verdict */}
                    <div>
                        <p
                            className="font-mono text-3xl font-black tracking-tight"
                            style={{ color: result.detected ? 'var(--color-white)' : 'var(--color-black)' }}
                        >
                            {result.detected ? 'STEGANOGRAPHY DETECTED' : 'NO HIDDEN DATA FOUND'}
                        </p>
                        <p
                            className="font-mono text-sm mt-2"
                            style={{ color: result.detected ? 'rgba(255,255,255,0.6)' : 'var(--color-charcoal)' }}
                        >
                            {result.detected
                                ? 'This image contains an embedded PixelVault payload.'
                                : 'This image does not appear to contain steganographic data.'}
                        </p>
                    </div>

                    {/* Stats (only when detected) */}
                    {result.detected && (
                        <div
                            className="grid grid-cols-3 gap-4 pt-6"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}
                        >
                            <div>
                                <p className="font-mono text-2xl font-black text-white">
                                    {formatBytes(result.payloadBytes)}
                                </p>
                                <p className="font-mono text-xs text-white/50 uppercase tracking-wider mt-1">
                                    Payload Size
                                </p>
                            </div>
                            <div>
                                <p className="font-mono text-2xl font-black text-white">
                                    {formatBytes(result.totalCapacity)}
                                </p>
                                <p className="font-mono text-xs text-white/50 uppercase tracking-wider mt-1">
                                    Image Capacity
                                </p>
                            </div>
                            <div>
                                <p className="font-mono text-2xl font-black text-white">
                                    {result.usagePercent}%
                                </p>
                                <p className="font-mono text-xs text-white/50 uppercase tracking-wider mt-1">
                                    Capacity Used
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default SteganalysisPanel;
