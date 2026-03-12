import React from 'react';

interface CapacityBarProps {
    used: number;   // bytes used
    total: number;  // bytes available
}

const CapacityBar: React.FC<CapacityBarProps> = ({ used, total }) => {
    if (total === 0) return null;

    const pct = Math.min((used / total) * 100, 100);
    const overflow = used > total;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <span className="label mb-0">Capacity</span>
                <span
                    className={`font-mono text-xs tracking-wide ${overflow ? 'font-bold text-black' : 'text-text-muted'}`}
                >
                    {(used / 1024).toFixed(1)} / {(total / 1024).toFixed(1)} KB
                    {overflow && ' *'}
                </span>
            </div>
            <div className="capacity-bar">
                <div
                    className={`capacity-bar-fill ${overflow ? 'overflow' : ''}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {overflow && (
                <p className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                    * Payload exceeds image capacity
                </p>
            )}
        </div>
    );
};

export default CapacityBar;
