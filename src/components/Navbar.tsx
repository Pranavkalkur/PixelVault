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
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                maxWidth: '72rem',
                margin: '0 auto',
                padding: '1rem 2rem',
            }}
        >
            {/* ── Col 1: Brand (left) ── */}
            <div className="select-none">
                <span className="text-xl font-black tracking-[-0.04em] text-black lowercase">
                    pixelvault
                </span>
            </div>

            {/* ── Col 2: Mode toggle (center) ── */}
            <nav className="pill-toggle">
                {modes.map((m) => (
                    <button
                        key={m.value}
                        className={mode === m.value ? 'active' : ''}
                        onClick={() => onModeChange(m.value)}
                    >
                        {m.label}
                    </button>
                ))}
            </nav>

            {/* ── Col 3: Empty spacer (right) ── */}
            <div />
        </div>
    </header>
);

export default Navbar;
