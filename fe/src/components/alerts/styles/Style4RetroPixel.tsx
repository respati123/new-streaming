import { type DonationEvt } from "@/context/StreamContext";

export function Style4RetroPixel({ d }: { d: DonationEvt }) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
      <div 
        className="bg-blue-900 border-[6px] border-white p-6 min-w-[400px] animate-pop-in"
        style={{ 
          boxShadow: "inset -4px -4px 0px 0px rgba(0,0,0,0.5), 8px 8px 0px 0px rgba(0,0,0,0.3)",
          fontFamily: "'Press Start 2P', monospace" // Assumes standard pixel font
        }}
      >
        <div className="flex items-start gap-6">
          <img
            src={d.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${d.name}`}
            className="w-20 h-20 border-[4px] border-white bg-black image-pixelated"
            alt="Avatar"
          />
          <div className="flex-1">
            <div className="text-yellow-400 text-sm mb-2 leading-loose">
              {d.youtubeName || d.name} has joined your party!
            </div>
            <div className="text-white text-xl animate-pulse mb-4">
              + Rp {d.amount.toLocaleString("id-ID")} G
            </div>
            {d.message && (
              <div className="text-blue-200 text-xs leading-loose border-t-[4px] border-blue-800 pt-3">
                "{d.message}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
