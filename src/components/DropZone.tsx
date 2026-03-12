import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImageIcon, FileIcon, X } from 'lucide-react';

interface DropZoneProps {
    accept?: Record<string, string[]>;
    label?: string;
    file: File | null;
    preview?: string | null;
    onFile: (file: File) => void;
    onClear: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({
    accept = { 'image/png': ['.png'], 'image/bmp': ['.bmp'] },
    label = 'Drag & Drop Cover Image',
    file,
    preview,
    onFile,
    onClear,
}) => {
    const onDrop = useCallback(
        (accepted: File[]) => {
            if (accepted.length > 0) onFile(accepted[0]);
        },
        [onFile],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        multiple: false,
    });

    if (file) {
        return (
            <div className="dropzone has-file relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClear();
                    }}
                    className="absolute top-3 right-3 p-1 border border-black hover:bg-black hover:text-white transition-colors"
                    aria-label="Remove file"
                >
                    <X size={12} />
                </button>

                {preview ? (
                    <img
                        src={preview}
                        alt="Preview"
                        className="preview-img mx-auto max-h-48 mb-4 border border-black"
                    />
                ) : (
                    <FileIcon size={36} className="mx-auto mb-4 text-charcoal" />
                )}

                <p className="text-sm font-mono font-medium text-black truncate max-w-xs mx-auto">
                    {file.name}
                </p>
                <p className="text-xs font-mono text-text-muted mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                </p>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
                {isDragActive ? (
                    <ImageIcon size={36} className="text-black" />
                ) : (
                    <Upload size={36} className="text-charcoal" strokeWidth={1} />
                )}
                <p className="text-sm font-semibold text-black uppercase tracking-wide">
                    {label}
                </p>
                <p className="text-xs font-mono text-text-muted">
                    (PNG or BMP strictly)
                </p>
            </div>
        </div>
    );
};

export default DropZone;
