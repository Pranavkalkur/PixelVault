import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Unlock, Download, FileText, Eye, EyeOff } from 'lucide-react';
import DropZone from './DropZone';
import {
    loadImage,
    imageToPixels,
    decode as lsbDecode,
} from '../lib/steganography';
import { deserialize } from '../lib/serialization';
import { decrypt } from '../lib/crypto';

const PROCESSING_STAGES = [
    'PROCESSING…',
    'EXTRACTING LSB…',
    'DECRYPTING AES…',
    'RECONSTRUCTING PAYLOAD…',
];

const DecodePanel: React.FC = () => {
    // Stego image
    const [stegoFile, setStegoFile] = useState<File | null>(null);
    const [stegoPreview, setStegoPreview] = useState<string | null>(null);

    // Password
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Result
    const [resultText, setResultText] = useState<string | null>(null);
    const [displayedText, setDisplayedText] = useState('');
    const [resultFile, setResultFile] = useState<{ blob: Blob; name: string } | null>(null);

    // State
    const [processing, setProcessing] = useState(false);
    const [processingStage, setProcessingStage] = useState(0);
    const [error, setError] = useState('');
    const [shaking, setShaking] = useState(false);
    const stageInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleFile = useCallback((file: File) => {
        setStegoFile(file);
        setStegoPreview(URL.createObjectURL(file));
        setResultText(null);
        setDisplayedText('');
        setResultFile(null);
        setError('');
    }, []);

    const handleClear = useCallback(() => {
        setStegoFile(null);
        setStegoPreview(null);
        setResultText(null);
        setDisplayedText('');
        setResultFile(null);
        setError('');
    }, []);

    // ── Processing stage cycling ──
    useEffect(() => {
        if (processing) {
            stageInterval.current = setInterval(() => {
                setProcessingStage((s) => (s + 1) % PROCESSING_STAGES.length);
            }, 600);
        } else {
            if (stageInterval.current) clearInterval(stageInterval.current);
            setProcessingStage(0);
        }
        return () => {
            if (stageInterval.current) clearInterval(stageInterval.current);
        };
    }, [processing]);

    // ── Typewriter effect ──
    useEffect(() => {
        if (resultText === null) {
            setDisplayedText('');
            return;
        }
        let i = 0;
        setDisplayedText('');
        const interval = setInterval(() => {
            if (i < resultText.length) {
                setDisplayedText(resultText.slice(0, i + 1));
                i++;
            } else {
                clearInterval(interval);
            }
        }, 20);
        return () => clearInterval(interval);
    }, [resultText]);

    const handleDecode = useCallback(async () => {
        if (!stegoFile || !password) return;
        setError('');
        setResultText(null);
        setDisplayedText('');
        setResultFile(null);
        setProcessing(true);

        try {
            const img = await loadImage(stegoFile);
            const { imageData } = imageToPixels(img);
            const bits = lsbDecode(imageData);
            const { type, filename, ciphertext, iv, salt } = deserialize(bits);
            const plaintext = await decrypt(ciphertext, iv, salt, password);

            if (type === 'text') {
                setResultText(new TextDecoder().decode(plaintext));
            } else {
                const blob = new Blob([plaintext]);
                setResultFile({ blob, name: filename || 'hidden_file' });
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Decoding failed.';
            const friendlyMsg = msg.includes('decrypt')
                ? 'Decryption failed. Verify key.'
                : msg;
            setError(friendlyMsg);
            setPassword('');
            setShaking(true);
            setTimeout(() => setShaking(false), 500);
        } finally {
            setProcessing(false);
        }
    }, [stegoFile, password]);

    const downloadFile = () => {
        if (!resultFile) return;
        const url = URL.createObjectURL(resultFile.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resultFile.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Reveal state: show only the result ──
    if (resultText !== null) {
        return (
            <div className="space-y-8">
                <div className="min-h-[200px] flex items-center justify-center">
                    <p className="typewriter text-xl sm:text-2xl text-black leading-relaxed px-4">
                        {displayedText}
                    </p>
                </div>
                <button
                    className="btn-primary w-full"
                    onClick={() => {
                        setResultText(null);
                        setDisplayedText('');
                    }}
                >
                    DECODE ANOTHER
                </button>
            </div>
        );
    }

    if (resultFile) {
        return (
            <div className="space-y-8">
                <div className="min-h-[200px] flex flex-col items-center justify-center gap-6">
                    <FileText size={48} strokeWidth={1} className="text-black" />
                    <p className="font-mono text-lg font-bold text-black">
                        {resultFile.name}
                    </p>
                    <button className="btn-primary" onClick={downloadFile}>
                        <Download size={16} />
                        DOWNLOAD FILE
                    </button>
                </div>
                <button
                    className="btn-secondary w-full justify-center"
                    onClick={handleClear}
                >
                    DECODE ANOTHER
                </button>
            </div>
        );
    }

    return (
        <div className={`space-y-8 ${shaking ? 'shake' : ''}`}>
            {/* ── Stego image ────────── */}
            <DropZone
                file={stegoFile}
                preview={stegoPreview}
                onFile={handleFile}
                onClear={handleClear}
                label="Drop Encoded Image to Extract Data"
            />

            {/* ── Password ───────────── */}
            <div>
                <span className="label">Decryption Password</span>
                <div className="flex items-center gap-3">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        className="input-field flex-1"
                        placeholder={error ? 'Decryption failed. Verify key.' : 'Enter the password used during encoding'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="p-1 text-black hover:opacity-50 transition-opacity"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                    </button>
                </div>
            </div>

            {/* ── Error ──────────────── */}
            {error && (
                <div className="result-panel error">
                    <p className="font-mono text-sm font-bold uppercase tracking-wide">
                        {error}
                    </p>
                </div>
            )}

            {/* ── Action ─────────────── */}
            <button
                className="btn-primary w-full"
                disabled={!stegoFile || !password || processing}
                onClick={handleDecode}
            >
                {processing ? (
                    <span className="processing-text">
                        {PROCESSING_STAGES[processingStage]}
                    </span>
                ) : (
                    <>
                        <Unlock size={16} strokeWidth={2} />
                        DECRYPT
                    </>
                )}
            </button>
        </div>
    );
};

export default DecodePanel;
