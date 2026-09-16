"use client";

export default function CosmicBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#F7F6F2]">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 cosmic-grid opacity-25" />

      {/* Radial Glow Gradients */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-radial from-[#2F6BFF]/04 via-[#9A722D]/04 to-transparent blur-3xl opacity-40" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-radial from-[#2F6BFF]/05 via-transparent to-transparent blur-3xl opacity-30" />

      {/* SVG Tech Grid Dots and Subtle Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2F6BFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2F6BFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Tech Nodes */}
        <circle cx="15%" cy="20%" r="2" fill="#2F6BFF" className="animate-pulse" />
        <circle cx="85%" cy="15%" r="2" fill="#C5A15A" />
        <circle cx="70%" cy="40%" r="1.5" fill="#2F6BFF" className="animate-pulse" />
        <circle cx="25%" cy="65%" r="2" fill="#C5A15A" />
        <circle cx="90%" cy="75%" r="1.5" fill="#2F6BFF" />
        <circle cx="45%" cy="85%" r="2" fill="#2F6BFF" />
        <circle cx="10%" cy="90%" r="1.5" fill="#C5A15A" />

        {/* Subtle Orbital Connecting Lines */}
        <line x1="15%" y1="20%" x2="25%" y2="28%" stroke="rgba(47, 107, 255, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="70%" y1="40%" x2="85%" y2="15%" stroke="rgba(197, 161, 90, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    </div>
  );
}
