import { type DonationEvt } from "@/context/StreamContext";

export function Style9DarkStealth({ d }: { d: DonationEvt }) {
  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] p-5 w-[400px] flex items-center gap-5 shadow-[0_20px_40px_rgba(0,0,0,0.8)] animate-fade-in rounded-sm">
        <div className="relative">
          <img
            src={d.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${d.name}`}
            className="w-12 h-12 grayscale contrast-125 object-cover"
            alt="Avatar"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10"></div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-gray-200 font-medium tracking-wide text-sm uppercase">
              {d.youtubeName || d.name}
            </span>
            <span className="text-white font-mono font-bold text-lg">
              {d.amount.toLocaleString("id-ID")} IDR
            </span>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-gray-700 to-transparent my-2"></div>
          {d.message ? (
            <div className="text-gray-400 text-xs tracking-wide leading-relaxed line-clamp-2">
              {d.message}
            </div>
          ) : (
            <div className="text-gray-600 text-xs tracking-wide uppercase">
              Incoming Support
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
