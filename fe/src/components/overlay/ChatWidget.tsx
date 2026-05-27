import { useStream, type ChatMsg } from "@/context/StreamContext";

interface OverlayChatWidgetProps {
  large?: boolean;
  full?: boolean;
}

const BADGE_ICONS: Record<ChatMsg["badge"], string> = {
  Pokeball: "/images/badges/pokeball.png",
  "Shield Gold": "/images/badges/shield_gold.png",
  Viper: "/images/badges/viper.png",
  Mod: "/images/badges/shield_blue.png",
  VIP: "/images/badges/shield_futuristic.png",
};

const TIER_FRAME_CLASSES: Record<ChatMsg["badge"], string> = {
  Pokeball: "frame-tier-1",
  Mod: "frame-tier-2",
  "Shield Gold": "frame-tier-3",
  Viper: "frame-tier-4",
  VIP: "frame-tier-5",
};

const TIER_CLASSES: Record<ChatMsg["badge"], string> = {
  Pokeball: "tier-1",
  Mod: "tier-2",
  "Shield Gold": "tier-3",
  Viper: "tier-4",
  VIP: "tier-5",
};

export function OverlayChatWidget({ large = false, full = false }: OverlayChatWidgetProps) {
  const { chat } = useStream();
  
  // Show last 10 messages for large or full, or 8 for default
  const displayCount = large || full ? 10 : 8;
  const messages = chat.slice(-displayCount);

  const containerClasses = full
    ? "w-full max-w-[470px] mx-auto h-full pt-4 pb-4 px-6 flex flex-col transition-all duration-300"
    : `absolute top-6 right-6 z-10 overflow-hidden glass rounded-xl transition-all duration-300 pointer-events-none flex flex-col ${
        large 
          ? "w-[470px] max-h-[calc(100%-3rem)] pt-5 pb-5 px-8 shadow-2xl border border-primary/20 bg-black/75" 
          : "w-[312px] max-h-[calc(100%-3rem)] pt-3 pb-3 px-6"
      }`;

  return (
    <div className={containerClasses}>
      <div 
        className={`font-display uppercase tracking-widest text-muted-foreground transition-all ${
          large || full ? "text-xs mb-3 border-b border-border/20 pb-2 flex justify-between items-center" : "text-[10px] mb-2"
        }`}
      >
        <span>Live Stream Chat</span>
        {(large || full) && <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">Simulator Preview</span>}
      </div>
      
      <div className={`transition-all overflow-visible flex-1 flex flex-col justify-end ${large || full ? "gap-3" : "gap-1.5"}`}>
        {messages.map((m) => {
          const isHighTier = m.badge === "Mod" || m.badge === "Shield Gold" || m.badge === "Viper" || m.badge === "VIP";
          const tierIndex = m.badge === "Mod" ? 2 : m.badge === "Shield Gold" ? 3 : m.badge === "Viper" ? 4 : m.badge === "VIP" ? 5 : 1;
          const animClass = isHighTier ? `animate-neon-aura-tier-${tierIndex}` : '';

          return (
            <div 
              key={m.id} 
              className={`pop-chat-container ${
                isHighTier ? 'animate-high-tier-fade-in' : 'animate-slide-fade-in'
              }`}
            >
              {/* Username Pill */}
              <div 
                className="pop-username-pill"
                style={{ backgroundColor: m.color }}
              >
                <img 
                  src={BADGE_ICONS[m.badge]} 
                  alt={m.badge} 
                  title={m.badge} 
                  className={`${large || full ? 'w-5 h-5' : 'w-4 h-4'} object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] shrink-0`} 
                />
                <span className="font-semibold text-white">
                  {m.user}
                </span>
              </div>

              {/* Message Speech Bubble */}
              <div 
                className={`pop-message-bubble ${TIER_CLASSES[m.badge]} flex items-start gap-2.5 backdrop-blur-md ${animClass}`}
                style={{ 
                  backgroundColor: `${m.color}15`, 
                  '--bubble-bg': `${m.color}ef`,
                  '--tier-color': m.color 
                } as React.CSSProperties}
              >
                {(large || full) && m.avatar && (
                  <img 
                    src={m.avatar} 
                    alt="" 
                    className="w-6 h-6 rounded-md bg-secondary/50 shrink-0 border border-border/50" 
                  />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-foreground/90 break-words block text-sm">
                    {m.text}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
