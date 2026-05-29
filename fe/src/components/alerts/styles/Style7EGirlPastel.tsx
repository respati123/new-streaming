import { type DonationEvt } from "@/context/StreamContext";

export function Style7EGirlPastel({ d }: { d: DonationEvt }) {
  return (
    <div className="absolute top-10 left-10 z-30 pointer-events-none">
      <div className="bg-pink-100 border-[3px] border-pink-300 rounded-[40px] p-4 w-[380px] shadow-[0_10px_25px_rgba(244,114,182,0.4)] animate-bounce flex items-center gap-4 relative overflow-visible">
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 text-4xl animate-pulse">💖</div>
        <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse delay-100">✨</div>
        
        <img
          src={d.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${d.name}`}
          className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover z-10"
          alt="Avatar"
        />
        
        <div className="flex-1">
          <div className="text-pink-600 font-extrabold text-lg tracking-wide">
            {d.youtubeName || d.name}
          </div>
          <div className="text-pink-400 font-bold text-2xl mt-0.5">
            Rp {d.amount.toLocaleString("id-ID")}
          </div>
          {d.message && (
            <div className="bg-white/60 text-pink-700 text-sm p-2 rounded-2xl mt-2 italic font-medium">
              "{d.message}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
