import { type DonationEvt } from "@/context/StreamContext";

export function Style1Minimal({ d }: { d: DonationEvt }) {
  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="bg-black/80 border border-white/10 rounded-full px-6 py-3 flex items-center gap-4 animate-slide-in-down shadow-2xl backdrop-blur-md">
        <img
          src={d.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${d.name}`}
          className="w-8 h-8 rounded-full border border-white/20"
          alt="Avatar"
        />
        <div className="flex items-baseline gap-2">
          <span className="text-white font-bold text-sm">{d.youtubeName || d.name}</span>
          <span className="text-white/60 text-xs">donated</span>
          <span className="text-emerald-400 font-bold">Rp {d.amount.toLocaleString("id-ID")}</span>
        </div>
        {d.message && (
          <>
            <div className="w-px h-4 bg-white/20"></div>
            <span className="text-white/80 text-sm italic max-w-[200px] truncate">"{d.message}"</span>
          </>
        )}
      </div>
    </div>
  );
}
