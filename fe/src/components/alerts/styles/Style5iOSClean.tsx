import { type DonationEvt } from "@/context/StreamContext";

export function Style5iOSClean({ d }: { d: DonationEvt }) {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-4 w-[360px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-slide-in-up flex gap-4 items-center">
        <img
          src={d.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${d.name}`}
          className="w-14 h-14 rounded-2xl object-cover shadow-sm"
          alt="Avatar"
        />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-black font-semibold text-base">{d.youtubeName || d.name}</span>
            <span className="text-blue-600 font-bold text-sm bg-blue-100 px-2 py-0.5 rounded-full">
              Rp {(d.amount / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="text-gray-600 text-sm leading-snug line-clamp-2">
            {d.message || "Sent a donation."}
          </div>
        </div>
      </div>
    </div>
  );
}
