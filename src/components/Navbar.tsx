import React from 'react';

export type AppMode = 'encode' | 'decode' | 'steganalysis';

interface NavbarProps {
    mode: AppMode;
    onModeChange: (mode: AppMode) => void;
}

const modes: { value: AppMode; label: string }[] = [
    { value: 'encode', label: 'Encode' },
    { value: 'decode', label: 'Decode' },
    { value: 'steganalysis', label: 'Analyze' },
];

const Navbar: React.FC<NavbarProps> = ({ mode, onModeChange }) => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black">
        <div className="flex flex-col sm:flex-row justify-between items-center max-w-5xl mx-auto px-4 sm:px-8 py-3 gap-3 sm:gap-0">
            {/* ── Col 1: Brand (left) ── */}
            <div className="select-none flex items-center gap-2 sm:flex-1">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 40 40"
                    fill="none"
                    className="w-5 h-5 sm:w-6 sm:h-6 text-black"
                >
                    <path
                        d="M4 20 L20 6 L36 20 L20 34 Z"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinejoin="miter"
                    />
                    <rect x="16" y="16" width="8" height="8" fill="currentColor" />
                </svg>
                <span className="text-lg sm:text-xl font-black tracking-[-0.04em] text-black lowercase">
                    pixelvault
                </span>
            </div>

            {/* ── Col 2: Mode toggle (center) ── */}
            <nav className="pill-toggle flex flex-wrap justify-center flex-shrink-0 w-full sm:w-auto mt-1 sm:mt-0">
                {modes.map((m) => (
                    <button
                        key={m.value}
                        className={mode === m.value ? 'active flex-1 sm:flex-none' : 'flex-1 sm:flex-none'}
                        onClick={() => onModeChange(m.value)}
                    >
                        {m.label}
                    </button>
                ))}
            </nav>

            {/* ── Col 3: Empty spacer (right) ── */}
            <div className="hidden sm:block sm:flex-1" />
        </div>
    </header>
);

export default Navbar;
