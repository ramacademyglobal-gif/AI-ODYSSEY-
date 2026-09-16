"use client";

export default function OrbitGraphic() {
  return (
    <div className="relative w-full aspect-square max-w-[500px] mx-auto flex items-center justify-center pointer-events-none select-none">
      {/* Outer Glow Ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#C5A15A]/20 via-[#368BFF]/10 to-transparent blur-2xl animate-pulse-soft" />

      {/* Main Orbit Ring 1 (Gold Thin Line) */}
      <div className="absolute w-[90%] h-[90%] rounded-full border border-[#C5A15A]/30 animate-spin-slow" style={{ animationDuration: "80s" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#E3C984] rounded-full shadow-[0_0_12px_#E3C984]" />
      </div>

      {/* Orbit Ring 2 (Elliptical Tilted Orbit) */}
      <div className="absolute w-[100%] h-[40%] rounded-full border border-[#368BFF]/30 rotate-[35deg] animate-spin-slow" style={{ animationDuration: "50s", animationDirection: "reverse" }}>
        <div className="absolute bottom-0 right-1/4 w-2.5 h-2.5 bg-[#368BFF] rounded-full shadow-[0_0_10px_#368BFF]" />
      </div>

      {/* Orbit Ring 3 (Inner Counter Ring) */}
      <div className="absolute w-[65%] h-[65%] rounded-full border border-dashed border-[#C5A15A]/40 animate-spin-slow" style={{ animationDuration: "40s" }} />

      {/* Center Planet Sphere */}
      <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-[#0E1E31] via-[#071421] to-[#040B13] border border-[#C5A15A]/40 shadow-[inset_0_0_30px_rgba(197,161,90,0.3)] flex items-center justify-center overflow-hidden">
        {/* Planet Surface Grid Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 200 200">
          <ellipse cx="100" cy="100" rx="90" ry="35" stroke="#C5A15A" strokeWidth="1" fill="none" />
          <ellipse cx="100" cy="100" rx="90" ry="70" stroke="#C5A15A" strokeWidth="1" fill="none" strokeDasharray="3 3" />
          <line x1="100" y1="10" x2="100" y2="190" stroke="#C5A15A" strokeWidth="1" />
          <line x1="10" y1="100" x2="190" y2="100" stroke="#C5A15A" strokeWidth="1" />
          
          {/* Neural Node Connections */}
          <circle cx="60" cy="80" r="3" fill="#E3C984" />
          <circle cx="140" cy="120" r="3" fill="#368BFF" />
          <circle cx="120" cy="60" r="2.5" fill="#E3C984" />
          <circle cx="80" cy="140" r="2.5" fill="#FAF9F6" />
          <line x1="60" y1="80" x2="120" y2="60" stroke="rgba(227,201,132,0.6)" strokeWidth="1" />
          <line x1="60" y1="80" x2="80" y2="140" stroke="rgba(227,201,132,0.6)" strokeWidth="1" />
          <line x1="140" y1="120" x2="120" y2="60" stroke="rgba(56,139,255,0.6)" strokeWidth="1" />
        </svg>

        {/* Center AI Odyssey Core Emblem */}
        <div className="z-10 flex flex-col items-center justify-center text-center p-4">
          <span className="text-[10px] font-mono tracking-widest text-[#E3C984] uppercase">MISSION</span>
          <span className="text-lg sm:text-xl font-serif font-bold text-[#FAF9F6] tracking-wider">AI ODYSSEY</span>
          <span className="text-[9px] font-mono text-[#368BFF] tracking-widest uppercase">CONTROL</span>
        </div>
      </div>

      {/* Floating Orbital Node Cards */}
      <div className="absolute top-4 right-2 bg-[#0E1E31]/80 backdrop-blur-md border border-[#C5A15A]/30 px-3 py-1.5 rounded text-[11px] font-mono text-[#E3C984] shadow-lg animate-float-gentle">
        STATUS: 24h LAUNCH
      </div>

      <div className="absolute bottom-6 left-0 bg-[#0E1E31]/80 backdrop-blur-md border border-[#368BFF]/40 px-3 py-1.5 rounded text-[11px] font-mono text-[#368BFF] shadow-lg animate-float-gentle" style={{ animationDelay: "2s" }}>
        TRACKS: 10 AI MISSIONS
      </div>
    </div>
  );
}
