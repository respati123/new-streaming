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
    <div className="absolute top-10 right-10 z-30 pointer-events-none mt-12 mr-4">
      {/* Added mt-12 to compensate for the avatar breaking out of the top border */}
      <div 
        className={`backdrop-blur-md px-6 pt-20 pb-8 animate-slide-in-right relative min-w-[320px] max-w-[380px] rounded-2xl ${getAlertFrameClass(d.amount)}`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
      >
        <Particles />
        
        {/* Floating Avatar Container */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-accent/10 border-4 border-black overflow-hidden flex items-center justify-center p-0.5 shadow-[0_0_40px_rgba(255,255,255,0.2)] z-10 glow-border">
          <img
            src={d.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${d.name}`}
            className="w-full h-full object-cover rounded-full bg-black/80"
            alt="Donation Avatar"
          />
        </div>

        <div className="flex flex-col items-center text-center relative z-0 mt-2">
          <div className="text-[10px] font-display uppercase tracking-[0.4em] text-accent mb-2 drop-shadow-sm glow-text">
            New Donation
          </div>
          
          <div className="text-2xl font-display leading-tight mb-0.5">
            <span className="text-primary font-bold glow-text">{d.youtubeName || d.name}</span>
          </div>

          {d.youtubeName && (
            <div className="text-[11px] font-medium text-white/50 mb-3 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block"></span>
              Alias: <span className="text-white/80">{d.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block"></span>
            </div>
          )}
          
          <div className="text-sm text-foreground/80 mb-1 mt-1">berdonasi sebesar</div>
          
          <div className="text-4xl font-display glow-text text-accent font-bold mb-6 drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)]">
            Rp {d.amount.toLocaleString("id-ID")}
          </div>
          
          <div className="w-full relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent blur-sm"></div>
            <p className="relative text-base text-foreground italic border-y border-accent/30 py-3 px-4 bg-black/40 rounded-lg shadow-inner">
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
