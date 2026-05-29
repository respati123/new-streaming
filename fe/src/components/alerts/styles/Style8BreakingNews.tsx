import { type DonationEvt } from "@/context/StreamContext";

export function Style8BreakingNews({ d }: { d: DonationEvt }) {
  return (
    <div className="absolute bottom-0 left-0 w-full z-30 pointer-events-none animate-slide-in-up">
      <div className="bg-red-600 border-t-4 border-red-800 flex items-stretch h-16 shadow-[0_-5px_20px_rgba(220,38,38,0.4)]">
        
        {/* Left Badge */}
        <div className="bg-white px-8 flex items-center justify-center font-black text-red-600 text-2xl uppercase tracking-tighter skew-x-[-15deg] -ml-4 border-r-8 border-red-800 relative z-10">
          <span className="skew-x-[15deg] ml-4">BREAKING DONATION</span>
        </div>

        {/* Ticker Content */}
        <div className="flex-1 flex items-center overflow-hidden relative">
          <div className="whitespace-nowrap flex items-center gap-8 font-bold text-white text-xl animate-marquee pl-full">
            <span>{d.youtubeName || d.name} JUST DONATED</span>
            <span className="bg-yellow-400 text-black px-3 py-1 rounded-sm">Rp {d.amount.toLocaleString("id-ID")}</span>
            {d.message && (
              <span className="italic font-medium text-red-100">"{d.message}"</span>
            )}
            
            {/* Duplicated for seamless marquee */}
            <span className="ml-24">{d.youtubeName || d.name} JUST DONATED</span>
            <span className="bg-yellow-400 text-black px-3 py-1 rounded-sm">Rp {d.amount.toLocaleString("id-ID")}</span>
            {d.message && (
              <span className="italic font-medium text-red-100">"{d.message}"</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
