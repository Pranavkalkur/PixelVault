import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Type, File as FileIcon, Eye, EyeOff } from 'lucide-react';
import DropZone from './DropZone';
import CapacityBar from './CapacityBar';
import {
    loadImage,
    imageToPixels,
    getCapacity,
    encode as lsbEncode,
    imageDataToPNG,
} from '../lib/steganography';
import { encrypt } from '../lib/crypto';
import { serialize } from '../lib/serialization';

type PayloadType = 'text' | 'file';

const PROCESSING_STAGES = [
    'PROCESSING…',
    'SERIALIZING PAYLOAD…',
    'ENCRYPTING AES-256…',
    'INJECTING LSB DATA…',
    'ENCODING PNG…',
];

const EncodePanel: React.FC = () => {
    // Cover image
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [capacity, setCapacity] = useState(0);

    // Payload
    const [payloadType, setPayloadType] = useState<PayloadType>('text');
    const [secretText, setSecretText] = useState('');
    const [secretFile, setSecretFile] = useState<File | null>(null);

    // Password
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // State
    const [processing, setProcessing] = useState(false);
    const [processingStage, setProcessingStage] = useState(0);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const stageInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Computed payload size ──
    const payloadSize =
        payloadType === 'text'
            ? new TextEncoder().encode(secretText).length + 31 + 7
            : secretFile
                ? secretFile.size + 31 + secretFile.name.length + 7
                : 0;

    // ── Load cover image & compute capacity ──
    useEffect(() => {
        if (!coverFile) {
            setCoverPreview(null);
            setCapacity(0);
            return;
        }
        const url = URL.createObjectURL(coverFile);
        setCoverPreview(url);

        (async () => {
            const img = await loadImage(coverFile);
            setCapacity(getCapacity(img.naturalWidth, img.naturalHeight));
        })();

        return () => URL.revokeObjectURL(url);
    }, [coverFile]);

    // ── Processing stage cycling ──
    useEffect(() => {
        if (processing) {
            stageInterval.current = setInterval(() => {
                setProcessingStage((s) => (s + 1) % PROCESSING_STAGES.length);
            }, 800);
        } else {
            if (stageInterval.current) clearInterval(stageInterval.current);
            setProcessingStage(0);
        }
        return () => {
            if (stageInterval.current) clearInterval(stageInterval.current);
        };
    }, [processing]);

    // ── Encode ──
    const handleEncode = useCallback(async () => {
        if (!coverFile || !password) return;
        setError('');
        setSuccess(false);
        setProcessing(true);

        try {
            let payload: ArrayBuffer;
            let filename = '';

            if (payloadType === 'text') {
                payload = new TextEncoder().encode(secretText).buffer as ArrayBuffer;
            } else {
                if (!secretFile) throw new Error('No secret file selected.');
                payload = await secretFile.arrayBuffer();
                filename = secretFile.name;
            }

            const encrypted = await encrypt(payload, password);
            const { bits } = serialize(encrypted, payloadType, filename);
            const img = await loadImage(coverFile);
            const { imageData } = imageToPixels(img);
            const modified = lsbEncode(imageData, bits);
            const blob = await imageDataToPNG(modified);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pixelvault_${coverFile.name}`;
            a.click();
            URL.revokeObjectURL(url);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Encoding failed.');
        } finally {
            setProcessing(false);
        }
    }, [coverFile, password, payloadType, secretText, secretFile]);

    const canEncode =
        coverFile &&
        password.length > 0 &&
        (payloadType === 'text' ? secretText.length > 0 : !!secretFile) &&
        payloadSize <= capacity;

    return (
        <div className="space-y-8">
            {/* ── Cover image ────────── */}
            <DropZone
                file={coverFile}
                preview={coverPreview}
                onFile={setCoverFile}
                onClear={() => setCoverFile(null)}
            />

            {/* ── Capacity bar ───────── */}
            {capacity > 0 && <CapacityBar used={payloadSize} total={capacity} />}

            {/* ── Payload type toggle ── */}
            <div>
                <span className="label">Secret Payload</span>
                <div className="pill-toggle">
                    <button
                        className={payloadType === 'text' ? 'active' : ''}
                        onClick={() => setPayloadType('text')}
                    >
                        <Type size={12} className="inline mr-1.5 -mt-0.5" />
                        Text
                    </button>
                    <button
                        className={payloadType === 'file' ? 'active' : ''}
                        onClick={() => setPayloadType('file')}
                    >
                        <FileIcon size={12} className="inline mr-1.5 -mt-0.5" />
                        File
                    </button>
                </div>
            </div>

            {/* ── Payload input ──────── */}
            {payloadType === 'text' ? (
                <div className="relative">
                    <textarea
                        className="input-field"
                        placeholder="Type the payload to be encrypted and concealed…"
                        value={secretText}
                        onChange={(e) => setSecretText(e.target.value)}
                        rows={5}
                    />
                    {capacity > 0 && (
                        <span className="absolute bottom-3 right-3 font-mono text-xs text-text-muted">
                            {(payloadSize / 1024).toFixed(1)} KB / {(capacity / 1024).toFixed(1)} KB
                        </span>
                    )}
                </div>
            ) : (
                <DropZone
                    accept={{}}
                    label="Drop the file you want to hide"
                    file={secretFile}
                    preview={null}
                    onFile={setSecretFile}
                    onClear={() => setSecretFile(null)}
                />
            )}

            {/* ── Cryptographic security ── */}
            <hr className="divider" />

            <div>
                <span className="label">Encryption Password</span>
                <div className="flex items-center gap-3">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        className="input-field flex-1"
                        placeholder="Enter a strong password"
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

            {/* ── Action button ──────── */}
            <button
                className={`btn-primary w-full ${success ? 'success' : ''}`}
                disabled={!canEncode || processing}
                onClick={handleEncode}
            >
                {processing ? (
                    <span className="processing-text">
                        {PROCESSING_STAGES[processingStage]}
                    </span>
                ) : success ? (
                    <span className="font-mono text-sm tracking-wider">
                        [ STATUS: PAYLOAD SECURED ]
                    </span>
                ) : (
                    <>
                        <Download size={16} strokeWidth={2} />
                        ENCRYPT & HIDE
                    </>
                )}
            </button>
        </div>
    );
};

export default EncodePanel;
