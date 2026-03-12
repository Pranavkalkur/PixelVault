import { useState } from 'react';
import Background from './components/Background';
import Navbar, { type AppMode } from './components/Navbar';
import EncodePanel from './components/EncodePanel';
import DecodePanel from './components/DecodePanel';
import SteganalysisPanel from './components/SteganalysisPanel';

function App() {
  const [mode, setMode] = useState<AppMode>('encode');

  return (
    <>
      <Background />
      <Navbar mode={mode} onModeChange={setMode} />

      {/* ── Main workspace ───────────────────── */}
      <main className="relative z-10 flex items-start justify-center min-h-screen pb-16 px-4 pt-[150px] sm:pt-[120px]">
        <div className="w-full max-w-2xl">
          {/* ── Panel title ──────── */}
          <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-black mb-2">
            {mode === 'encode' && 'Hide Your Secret'}
            {mode === 'decode' && 'Reveal the Hidden'}
            {mode === 'steganalysis' && 'Steganalysis'}
          </h1>
          <p className="text-sm text-charcoal mb-10 max-w-lg">
            {mode === 'encode' &&
              'Encrypt and embed a secret message or file inside a cover image.'}
            {mode === 'decode' &&
              'Extract and decrypt the hidden payload from a stego-image.'}
            {mode === 'steganalysis' &&
              'Detect whether an image contains hidden steganographic data.'}
          </p>

          {/* ── Active panel ─────── */}
          {mode === 'encode' && <EncodePanel />}
          {mode === 'decode' && <DecodePanel />}
          {mode === 'steganalysis' && <SteganalysisPanel />}
        </div>
      </main>
    </>
  );
}

export default App;
