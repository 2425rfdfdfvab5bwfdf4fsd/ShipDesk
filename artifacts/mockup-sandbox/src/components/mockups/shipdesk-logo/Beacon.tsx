import React from 'react';

const LogoMark = ({ 
  size = 64, 
  outline = "currentColor", 
  accent = "#F59E0B", 
  core = "currentColor" 
}: { 
  size?: number, 
  outline?: string, 
  accent?: string, 
  core?: string 
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 8 L92 50 L50 92 L8 50 Z" stroke={outline} strokeWidth="8" strokeLinejoin="round"/>
    <path d="M50 26 L74 50 L50 74 L26 50 Z" fill={accent}/>
    <path d="M50 40 L60 50 L50 60 L40 50 Z" fill={core}/>
  </svg>
);

const LogoWordmark = ({ className = "", color = "inherit" }: { className?: string, color?: string }) => (
  <div style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.15em", fontWeight: 400, color }} className={`tracking-[0.15em] ${className}`}>
    ShipDesk
  </div>
);

export function Beacon() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-32">
      {/* 1. Hero section */}
      <section className="bg-[#1C1C2E] text-white py-40 flex flex-col items-center justify-center">
        <div className="flex items-center gap-8">
          <LogoMark size={96} outline="#ffffff" accent="#F59E0B" core="#1C1C2E" />
          <LogoWordmark className="text-7xl" />
        </div>
        <p className="mt-12 text-[#a0a0b0] tracking-[0.2em] text-sm uppercase">The Beacon • Brand Direction</p>
      </section>

      <div className="max-w-5xl mx-auto px-8 mt-24 space-y-32">
        
        {/* 2. Light version */}
        <section>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-8">Light Background</h2>
          <div className="bg-[#FAF9F6] p-24 rounded-3xl flex items-center justify-center border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-8">
              <LogoMark size={96} outline="#1C1C2E" accent="#F59E0B" core="#FAF9F6" />
              <LogoWordmark className="text-7xl" color="#1C1C2E" />
            </div>
          </div>
        </section>

        {/* 3. Icon-only grid */}
        <section>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-8">Scalability</h2>
          <div className="flex items-end gap-16 bg-white p-16 rounded-3xl border border-neutral-200 shadow-sm">
            <div className="flex flex-col items-center gap-6">
              <LogoMark size={80} outline="#1C1C2E" accent="#F59E0B" core="#ffffff" />
              <span className="text-sm font-medium text-neutral-400">80px</span>
            </div>
            <div className="flex flex-col items-center gap-6">
              <LogoMark size={48} outline="#1C1C2E" accent="#F59E0B" core="#ffffff" />
              <span className="text-sm font-medium text-neutral-400">48px</span>
            </div>
            <div className="flex flex-col items-center gap-6">
              <LogoMark size={32} outline="#1C1C2E" accent="#F59E0B" core="#ffffff" />
              <span className="text-sm font-medium text-neutral-400">32px (Favicon)</span>
            </div>
          </div>
        </section>

        {/* 4. Single-color version */}
        <section>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-8">Single Color Applications</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-20 flex items-center justify-center rounded-3xl border border-neutral-200 shadow-sm">
              <div className="flex items-center gap-5">
                <LogoMark size={72} outline="#1C1C2E" accent="#1C1C2E" core="#ffffff" />
                <LogoWordmark className="text-5xl" color="#1C1C2E" />
              </div>
            </div>
            <div className="bg-[#1C1C2E] p-20 flex items-center justify-center rounded-3xl shadow-sm">
              <div className="flex items-center gap-5">
                <LogoMark size={72} outline="#ffffff" accent="#ffffff" core="#1C1C2E" />
                <LogoWordmark className="text-5xl" color="#ffffff" />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-16">
          {/* 5. Color palette swatches */}
          <section>
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-8">Color Palette</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[#1C1C2E] shadow-md"></div>
                <div>
                  <div className="font-bold text-lg text-neutral-800">Rich Charcoal</div>
                  <div className="text-base text-neutral-500 font-mono mt-1">#1C1C2E</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[#F59E0B] shadow-md"></div>
                <div>
                  <div className="font-bold text-lg text-neutral-800">Warm Amber</div>
                  <div className="text-base text-neutral-500 font-mono mt-1">#F59E0B</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[#FAF9F6] border border-neutral-200 shadow-sm"></div>
                <div>
                  <div className="font-bold text-lg text-neutral-800">Warm White</div>
                  <div className="text-base text-neutral-500 font-mono mt-1">#FAF9F6</div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Typography specimen */}
          <section>
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-8">Typography</h2>
            <div className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm space-y-10">
              <div>
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Primary Typeface</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }} className="text-5xl text-neutral-800">Inter</div>
                <div className="text-neutral-500 mt-2">Regular (400) • 15% Tracking</div>
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Specimen</div>
                <div style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.15em", fontWeight: 400 }} className="text-2xl text-neutral-800 break-all leading-relaxed">
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>
                  abcdefghijklmnopqrstuvwxyz<br/>
                  0123456789
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
