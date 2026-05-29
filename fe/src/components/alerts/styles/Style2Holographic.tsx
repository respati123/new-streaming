import { type DonationEvt } from "@/context/StreamContext";
import { getAlertFrameClass, Particles } from "../shared";

export function Style2Holographic({ d }: { d: DonationEvt }) {
  return (
    <div className="absolute top-10 right-10 z-30 pointer-events-none mt-12 mr-4">
      <div 
        className={`backdrop-blur-md px-6 pt-20 pb-8 animate-slide-in-right relative min-w-[320px] max-w-[380px] rounded-2xl ${getAlertFrameClass(d.amount)}`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
      >
        <Particles />
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-accent/10 border-4 border-black overflow-hidden flex items-center justify-center p-0.5 shadow-[0_0_40px_rgba(255,255,255,0.2)] z-10 glow-border">
          <img
            src={d.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${d.name}`}
            className="w-full h-full object-cover rounded-full bg-black/80"
            alt="Donation Avatar"
          />
        </div>
        <div className="flex flex-col items-center text-center relative z-0 mt-2">
          <div className="text-[10px] font-display uppercase tracking-[0.4em] text-accent mb-2 drop-shadow-sm glow-text">
            New Donation
          </div>
          <div className="text-2xl font-display leading-tight mb-0.5">
            <span className="text-primary font-bold glow-text">{d.youtubeName || d.name}</span>
          </div>
          <div className="text-sm text-foreground/80 mb-1 mt-1">berdonasi sebesar</div>
          <div className="text-4xl font-display glow-text text-accent font-bold mb-6 drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)]">
            Rp {d.amount.toLocaleString("id-ID")}
          </div>
          <div className="w-full relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent blur-sm"></div>
            <p className="relative text-base text-foreground italic border-y border-accent/30 py-3 px-4 bg-black/40 rounded-lg shadow-inner">
              "{d.message}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
