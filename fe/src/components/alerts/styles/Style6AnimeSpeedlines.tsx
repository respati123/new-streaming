import { type DonationEvt } from "@/context/StreamContext";

export function Style6AnimeSpeedlines({ d }: { d: DonationEvt }) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
      <div className="relative w-[600px] h-[300px] flex items-center justify-center animate-zoom-in">
        {/* Speedlines Background (CSS based) */}
        <div 
          className="absolute inset-0 rounded-full" 
          style={{ 
            background: "repeating-conic-gradient(from 0deg, white 0deg 10deg, transparent 10deg 20deg)",
            maskImage: "radial-gradient(circle, transparent 30%, black 70%)",
            animation: "spin 2s linear infinite"
          }}
        />
        
        <div className="z-10 bg-white border-[8px] border-black p-8 -skew-x-12 shadow-[12px_12px_0_0_rgba(239,68,68,1)] flex gap-6 items-center">
          <img
            src={d.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${d.name}`}
            className="w-24 h-24 border-[4px] border-black skew-x-12 grayscale"
            alt="Avatar"
          />
          <div className="skew-x-12 flex flex-col items-start">
            <div className="text-red-500 font-black text-4xl uppercase tracking-tighter stroke-black" style={{ WebkitTextStroke: "2px black" }}>
              {d.youtubeName || d.name}!!
            </div>
            <div className="text-black font-black text-5xl mt-2">
              Rp {d.amount.toLocaleString("id-ID")}
            </div>
            {d.message && (
              <div className="bg-black text-white p-2 mt-2 font-bold text-lg inline-block">
                {d.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
