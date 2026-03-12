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
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-[100px] pb-12 sm:pt-[80px]">
        <div className="w-full max-w-xl w-full">
          {/* ── Panel title ──────── */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.03em] text-black mb-2 text-center sm:text-left">
            {mode === 'encode' && 'Hide Your Secret'}
            {mode === 'decode' && 'Reveal the Hidden'}
            {mode === 'steganalysis' && 'Steganalysis'}
          </h1>
          <p className="text-sm text-charcoal mb-8 max-w-md text-center sm:text-left">
            {mode === 'encode' &&
              'Encrypt and embed a secret message or file inside a cover image.'}
            {mode === 'decode' &&
              'Extract and decrypt the hidden payload from a stego-image.'}
            {mode === 'steganalysis' &&
              'Detect whether an image contains hidden steganographic data.'}
          </p>

          {/* ── Active panel ─────── */}
          <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-black p-6 sm:p-8 rounded-none">
            {mode === 'encode' && <EncodePanel />}
            {mode === 'decode' && <DecodePanel />}
            {mode === 'steganalysis' && <SteganalysisPanel />}
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
