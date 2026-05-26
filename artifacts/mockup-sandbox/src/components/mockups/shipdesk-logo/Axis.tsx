import React from "react";

export function Axis() {
  const PrimaryLogo = ({ className = "", dark = false }: { className?: string, dark?: boolean }) => (
    <div className={`flex items-center gap-4 ${className}`}>
      <LogoMark className="w-12 h-12" dark={dark} />
      <span className={`text-4xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#0F172A]'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
        ShipDesk
      </span>
    </div>
  );

  const LogoMark = ({ className = "", dark = false, monochrome = false }: { className?: string, dark?: boolean, monochrome?: boolean }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background shape */}
      <rect
        x="36" y="14" width="28" height="72" rx="14"
        transform="rotate(45 50 50)"
        fill={monochrome ? (dark ? "white" : "#0F172A") : (dark ? "white" : "#0F172A")}
      />
      {/* Foreground shape */}
      <rect
        x="36" y="14" width="28" height="72" rx="14"
        transform="rotate(-45 50 50)"
        fill={monochrome ? (dark ? "white" : "#0F172A") : "#6366F1"}
        fillOpacity={monochrome ? "1" : "0.9"}
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Hero Section */}
      <section className="bg-[#0F172A] text-white py-32 px-8 flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden">
        {/* Subtle grid background for "precision" vibe */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <PrimaryLogo className="scale-150 transform origin-center" dark={true} />
          <p className="mt-8 text-slate-400 tracking-widest uppercase text-sm font-medium">Concept Direction: The Axis</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-8 py-16 space-y-24">
        
        {/* Light Version */}
        <section className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-4">01. Light Background</h2>
          <div className="bg-white rounded-2xl p-16 flex items-center justify-center shadow-sm border border-slate-100">
            <PrimaryLogo />
          </div>
        </section>

        {/* Icon Grid */}
        <section className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-4">02. Mark Scaling</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center gap-6 shadow-sm border border-slate-100">
              <LogoMark className="w-[80px] h-[80px]" />
              <span className="text-xs text-slate-400 font-mono">80px (App Header)</span>
            </div>
            <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center gap-6 shadow-sm border border-slate-100">
              <LogoMark className="w-[48px] h-[48px]" />
              <span className="text-xs text-slate-400 font-mono">48px (Mobile)</span>
            </div>
            <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center gap-6 shadow-sm border border-slate-100">
              <LogoMark className="w-[32px] h-[32px]" />
              <span className="text-xs text-slate-400 font-mono">32px (Favicon)</span>
            </div>
          </div>
        </section>

        {/* Single Color */}
        <section className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-4">03. Single Color</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-16 flex items-center justify-center shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <LogoMark className="w-12 h-12" monochrome={true} />
                <span className="text-4xl font-bold tracking-tight text-[#0F172A]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  ShipDesk
                </span>
              </div>
            </div>
            <div className="bg-[#0F172A] rounded-2xl p-16 flex items-center justify-center shadow-sm">
              <div className="flex items-center gap-4">
                <LogoMark className="w-12 h-12" dark={true} monochrome={true} />
                <span className="text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                  ShipDesk
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Palette & Typography */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <section className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-4">04. Color Palette</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="h-24 w-full rounded-xl bg-[#0F172A] shadow-inner"></div>
                <div>
                  <div className="font-medium text-slate-900">Deep Navy</div>
                  <div className="text-xs text-slate-500 font-mono">#0F172A</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-24 w-full rounded-xl bg-[#6366F1] shadow-inner"></div>
                <div>
                  <div className="font-medium text-slate-900">Cool Indigo</div>
                  <div className="text-xs text-slate-500 font-mono">#6366F1</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-24 w-full rounded-xl bg-white border border-slate-200 shadow-sm"></div>
                <div>
                  <div className="font-medium text-slate-900">Clean White</div>
                  <div className="text-xs text-slate-500 font-mono">#FFFFFF</div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-4">05. Typography Specimen</h2>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>
              <div>
                <div className="text-sm text-slate-400 mb-2">Inter / Regular</div>
                <div className="text-3xl font-normal text-slate-900">ShipDesk Portal</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-2">Inter / Medium</div>
                <div className="text-3xl font-medium text-slate-900">ShipDesk Portal</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-2">Inter / Bold</div>
                <div className="text-3xl font-bold text-[#0F172A]">ShipDesk Portal</div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="text-sm text-slate-400 mb-2">Alphabet</div>
                <div className="text-lg text-slate-600 break-words leading-relaxed">
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>
                  abcdefghijklmnopqrstuvwxyz<br/>
                  0123456789 !@#$%^&*()
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
