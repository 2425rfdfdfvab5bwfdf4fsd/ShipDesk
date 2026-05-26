import React from 'react';

const LogoMark = ({ className = '', size = 24, singleColor = false, isDark = false }: { className?: string; size?: number, singleColor?: boolean, isDark?: boolean }) => {
  const dotColor = singleColor ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#F8FAFC' : '#0D1117');
  const accentColor = singleColor ? (isDark ? '#FFFFFF' : '#000000') : '#7C3AED';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="2" width="4" height="4" rx="2" fill={dotColor} />
      <rect x="10" y="2" width="4" height="4" rx="2" fill={dotColor} />
      
      {/* Accent - top right arrow pointing up and right */}
      <path d="M18 2H22V6M22 2L17 7" stroke={accentColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      <rect x="2" y="10" width="4" height="4" rx="2" fill={dotColor} />
      <rect x="10" y="10" width="4" height="4" rx="2" fill={dotColor} />
      <rect x="18" y="10" width="4" height="4" rx="2" fill={dotColor} />
      
      <rect x="2" y="18" width="4" height="4" rx="2" fill={dotColor} />
      <rect x="10" y="18" width="4" height="4" rx="2" fill={dotColor} />
      <rect x="18" y="18" width="4" height="4" rx="2" fill={dotColor} />
    </svg>
  );
};

export function Grid() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-semibold tracking-tight">ShipDesk Brand Direction: The Grid</h1>
        <p className="text-slate-500 mt-1">Structure, Visibility, and "Shipping" Status</p>
      </header>

      <main className="max-w-6xl mx-auto mt-12 space-y-16 px-8">
        
        {/* 1. Hero section - Dark Background */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">1. Primary Logo (Dark Mode)</h2>
          <div className="bg-[#0D1117] rounded-2xl p-24 flex items-center justify-center">
            <div className="flex items-center gap-6">
              <LogoMark size={64} isDark={true} />
              <span className="text-white text-6xl font-bold tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                ShipDesk
              </span>
            </div>
          </div>
        </section>

        {/* 2. Light version */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">2. Primary Logo (Light Mode)</h2>
          <div className="bg-white border border-slate-200 rounded-2xl p-24 flex items-center justify-center">
            <div className="flex items-center gap-6">
              <LogoMark size={64} isDark={false} />
              <span className="text-[#0D1117] text-6xl font-bold tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                ShipDesk
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* 3. Icon-only grid */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">3. Mark Scale Test</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-12">
              <div className="flex items-end gap-12">
                <div className="flex flex-col items-center gap-4">
                  <LogoMark size={80} isDark={false} />
                  <span className="text-xs text-slate-400">80px</span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <LogoMark size={48} isDark={false} />
                  <span className="text-xs text-slate-400">48px</span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <LogoMark size={32} isDark={false} />
                  <span className="text-xs text-slate-400">32px (Favicon)</span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Single-color version */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">4. Single Color Application</h2>
            <div className="grid grid-cols-2 rounded-2xl overflow-hidden border border-slate-200">
              <div className="bg-white p-12 flex items-center justify-center">
                <LogoMark size={64} singleColor={true} isDark={false} />
              </div>
              <div className="bg-[#0D1117] p-12 flex items-center justify-center">
                <LogoMark size={64} singleColor={true} isDark={true} />
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* 5. Color palette */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">5. Brand Colors</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#0D1117] border border-slate-200"></div>
                <div className="text-sm font-medium">Slate Black</div>
                <div className="text-xs text-slate-500 font-mono">#0D1117</div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#7C3AED]"></div>
                <div className="text-sm font-medium">Electric Violet</div>
                <div className="text-xs text-slate-500 font-mono">#7C3AED</div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#F8FAFC] border border-slate-200"></div>
                <div className="text-sm font-medium">Soft White</div>
                <div className="text-xs text-slate-500 font-mono">#F8FAFC</div>
              </div>
            </div>
          </section>

          {/* 6. Typography */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">6. Typography</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-8">
              <div>
                <div className="text-xs text-slate-400 mb-2">Wordmark Font</div>
                <div className="text-4xl font-bold tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>Inter Bold</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-2">Alphabet</div>
                <div className="text-lg text-slate-800 break-all" style={{ fontFamily: "'Inter', sans-serif" }}>
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>
                  abcdefghijklmnopqrstuvwxyz<br/>
                  0123456789
                </div>
              </div>
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}
