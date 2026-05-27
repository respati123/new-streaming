import { useEffect, useState, useRef } from "react";
import { useStream, type AbsenEvt, type DonationEvt, type FxEvt } from "@/context/StreamContext";
import { unlockAudio, playDonationSound } from "@/lib/audio";

function getAlertFrameClass(amount: number): string {
  if (amount < 10000) return "alert-frame-tier-1";
  if (amount < 50000) return "alert-frame-tier-2";
  if (amount < 100000) return "alert-frame-tier-3";
  if (amount < 250000) return "alert-frame-tier-4";
  return "alert-frame-tier-5";
}

export function DonationAlert() {
  const { bus } = useStream();
  const [d, setD] = useState<DonationEvt | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const addTimeout = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearAllTimeouts();
    };
  }, []);

  useEffect(() => {
    return bus.on("donation", (e) => {
      // Differentiate: ignore AI Dialogue box donations
      if (e.withAI) return;

      // 1. Stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearAllTimeouts();

      // 2. Set state
      setD(e);
      unlockAudio();

      // 3. Playback logic
      playDonationSound().finally(() => {
        if (e.audioBase64) {
          const audio = new Audio(`data:audio/mp3;base64,${e.audioBase64}`);
          audio.volume = 1;
          audioRef.current = audio;

          audio.onended = () => {
            addTimeout(() => {
              setD(null);
            }, 2000);
          };

          audio.play().catch((err) => {
            console.error("[audio] Audio play failed", err);
            addTimeout(() => {
              setD(null);
            }, 5000);
          });
        } else {
          addTimeout(() => {
            setD(null);
          }, 4000);
        }
      });
    });
  }, [bus]);

  if (!d) return null;

  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div 
        className={`backdrop-blur-md px-8 py-6 animate-pop-in relative overflow-hidden min-w-[480px] max-w-[540px] rounded-xl ${getAlertFrameClass(d.amount)}`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
      >
        <Particles />
        
        <div className="flex gap-5 items-center">
          {/* Circular Avatar Frame */}
          <div className="relative w-16 h-16 flex-shrink-0 rounded-full bg-accent/10 border border-accent/40 overflow-hidden flex items-center justify-center p-0.5 shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]">
            <img
              src={d.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${d.name}`}
              className="w-full h-full object-cover rounded-full bg-black/50"
              alt="Donation Avatar"
            />
          </div>

          {/* Donation Info */}
          <div className="flex-1 text-left">
            <div className="text-xs font-display uppercase tracking-[0.3em] text-accent mb-0.5 drop-shadow-sm">
              New Donation
            </div>
            
            <div className="text-xl font-display glow-text leading-tight mb-1">
              <span className="text-primary font-bold">{d.youtubeName || d.name}</span>
              <span className="mx-1 text-foreground">berdonasi</span>
              <span className="text-accent font-bold">Rp {d.amount.toLocaleString("id-ID")}</span>
            </div>
            
            {/* Show alias if youtubeName is available and they differ, or just show alias if we have youtubeName */}
            {d.youtubeName && (
              <div className="text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block"></span>
                Alias: <span className="text-white/80">{d.name}</span>
              </div>
            )}
            
            <p className="text-sm text-foreground mt-1 italic border-l-2 border-accent/50 pl-3 py-0.5 bg-accent/5 rounded-r">
              "{d.message}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


function Particles() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-accent"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-up ${1.5 + Math.random()}s ease-out ${i * 0.05}s forwards`,
            boxShadow: "0 0 8px var(--glow)",
          }}
        />
      ))}
    </div>
  );
}

export function AbsenToasts() {
  const { bus } = useStream();
  const [toasts, setToasts] = useState<AbsenEvt[]>([]);
  useEffect(() => {
    return bus.on("absen", (e) => {
      setToasts((prev) => [...prev.slice(-4), e]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== e.id));
      }, 4000);
    });
  }, [bus]);
  return (
    <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass glow-border rounded-lg px-4 py-2 text-sm animate-slide-in-right flex items-center gap-2"
        >
          <span
            className={`text-[9px] font-display px-1.5 py-0.5 rounded ${
              t.kind === "sub" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
            }`}
          >
            {t.kind === "sub" ? "SUB" : "ABSEN"}
          </span>
          <span className="font-semibold">{t.user}</span>
          <span className="text-muted-foreground">{t.kind === "sub" ? "joined the squad!" : "is here!"}</span>
        </div>
      ))}
    </div>
  );
}

export function FxLayer() {
  const { bus } = useStream();
  const [fx, setFx] = useState<FxEvt | null>(null);
  useEffect(() => {
    return bus.on("fx", (e) => {
      setFx(e);
      setTimeout(() => setFx(null), 1200);
    });
  }, [bus]);
  if (!fx) return null;

  if (fx.kind === "lightning") {
    return (
      <>
        <div className="absolute inset-0 z-40 pointer-events-none animate-flash bg-gradient-to-b from-white via-yellow-100 to-transparent" />
        <div className="absolute inset-0 z-30 pointer-events-none animate-rumble" />
      </>
    );
  }
  if (fx.kind === "wipe") {
    return (
      <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 w-full bg-primary"
          style={{ animation: "slide-out-right 0.9s ease-in forwards", transform: "translateX(-100%)" }}
        />
        <div
          className="absolute inset-y-0 left-0 w-full bg-accent"
          style={{ animation: "slide-out-right 1.1s ease-in 0.1s forwards", transform: "translateX(-100%)" }}
        />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, transparent 0%, oklch(0 0 0) 80%)",
          animation: "flash-bolt 1s ease-out forwards",
        }}
      />
    </div>
  );
}
