import { type DonationEvt } from "@/context/StreamContext";

export function Style3Cyberpunk({ d }: { d: DonationEvt }) {
  return (
    <div className="absolute bottom-10 right-10 z-30 pointer-events-none">
      <div className="relative bg-black/90 border border-cyan-500/50 p-6 w-[400px] animate-slide-in-right overflow-hidden clip-path-cyberpunk shadow-[0_0_20px_rgba(6,182,212,0.3)]">
        {/* Neon Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-fuchsia-500"></div>
        <div className="absolute top-2 right-2 w-16 h-1 bg-yellow-400/80"></div>
        
        <div className="flex gap-4">
          <div className="w-16 h-16 border-2 border-cyan-400 p-1 flex-shrink-0 relative group">
            <img src={d.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${d.name}`} className="w-full h-full object-cover filter contrast-125 sepia-[.3] hue-rotate-[180deg]" alt="Avatar" />
            <div className="absolute inset-0 bg-cyan-400/20 mix-blend-overlay"></div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-yellow-400 font-mono tracking-widest uppercase animate-pulse">
              [ SYSTEM.DONATION_DETECTED ]
            </div>
            <div className="text-xl text-cyan-300 font-bold uppercase tracking-wide mt-1 drop-shadow-[2px_2px_0px_rgba(255,0,255,0.8)]">
              {d.youtubeName || d.name}
            </div>
            <div className="text-3xl text-white font-black italic mt-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
              Rp {d.amount.toLocaleString("id-ID")}
            </div>
          </div>
        </div>
        {d.message && (
          <div className="mt-4 p-3 border-l-4 border-fuchsia-500 bg-fuchsia-500/10 text-cyan-50 font-mono text-sm leading-relaxed">
            &gt; {d.message}
            <span className="animate-blink ml-1">_</span>
          </div>
        )}
      </div>
    </div>
  );
}
