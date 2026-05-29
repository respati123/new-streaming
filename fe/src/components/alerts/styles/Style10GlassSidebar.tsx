import { type DonationEvt } from "@/context/StreamContext";

export function Style10GlassSidebar({ d }: { d: DonationEvt }) {
  return (
    <div className="absolute top-0 left-0 h-full w-[300px] z-30 pointer-events-none animate-slide-in-right" style={{ animationName: "slide-in-left" }}>
      <div className="w-full h-full bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-center p-8 shadow-[20px_0_40px_rgba(0,0,0,0.3)]">
        
        <div className="w-full aspect-square rounded-2xl overflow-hidden mb-8 relative shadow-2xl">
          <img
            src={d.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${d.name}`}
            className="w-full h-full object-cover"
            alt="Avatar"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-white/60 text-xs font-medium tracking-widest uppercase mb-1">
              Supporter
            </div>
            <div className="text-white font-bold text-xl truncate">
              {d.youtubeName || d.name}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-emerald-400 font-light text-5xl tracking-tighter">
            Rp {(d.amount / 1000).toFixed(0)}<span className="text-2xl text-emerald-600">k</span>
          </div>
        </div>

        {d.message && (
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-white/40 to-transparent rounded-full"></div>
            <p className="text-white/80 text-sm leading-relaxed font-light">
              "{d.message}"
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
