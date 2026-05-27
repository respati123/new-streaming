import { useEffect, useRef } from "react";
import { useStream, type ChatMsg } from "@/context/StreamContext";

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

export function ChatBox() {
  const { chat } = useStream();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [chat]);
  return (
    <div className="glass glow-border rounded-xl pt-4 pb-4 px-2 h-[420px] flex flex-col">
      <div className="flex items-center justify-between mb-3 px-4">
        <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">Live Chat</h3>
        <span className="text-xs text-muted-foreground">{chat.length} msgs</span>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto space-y-2 px-5 pr-2">
        {chat.map((m) => {
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
                  className="w-4 h-4 object-contain drop-shadow-md shrink-0" 
                />
                <span className="text-xs font-semibold text-white">
                  {m.user}
                </span>
              </div>

              {/* Message Speech Bubble */}
              <div 
                className={`pop-message-bubble ${TIER_CLASSES[m.badge]} flex items-start gap-2.5 backdrop-blur-sm ${animClass}`}
                style={{ 
                  backgroundColor: `${m.color}15`, 
                  '--bubble-bg': `${m.color}ef`,
                  '--tier-color': m.color 
                } as React.CSSProperties}
              >
                <img 
                  src={m.avatar} 
                  alt="" 
                  className="w-7 h-7 rounded-md bg-muted shrink-0" 
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground/90 break-words">
                    {m.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
