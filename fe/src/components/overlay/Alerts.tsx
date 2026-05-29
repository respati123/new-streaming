import { useEffect, useState, useRef } from "react";
import { useStream, type AbsenEvt, type DonationEvt, type FxEvt } from "@/context/StreamContext";
import { unlockAudio, playDonationSound } from "@/lib/audio";
import {
  Style1Minimal,
  Style2Holographic,
  Style3Cyberpunk,
  Style4RetroPixel,
  Style5iOSClean,
  Style6AnimeSpeedlines,
  Style7EGirlPastel,
  Style8BreakingNews,
  Style9DarkStealth,
  Style10GlassSidebar
} from "../alerts";

export function DonationAlert() {
  const { bus } = useStream();
  const [d, setD] = useState<DonationEvt | null>(null);
  const [activeStyle, setActiveStyle] = useState<number>(2);
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
    fetch("/api/alerts/style/current")
      .then(res => res.json())
      .then(data => {
        if (data.style) setActiveStyle(data.style);
      })
      .catch(console.error);

    const unsubTheme = bus.on("alert_style_changed" as any, (newStyle: number) => {
      setActiveStyle(newStyle);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearAllTimeouts();
      unsubTheme();
    };
  }, [bus]);

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

  switch (activeStyle) {
    case 1: return <Style1Minimal d={d} />;
    case 2: return <Style2Holographic d={d} />;
    case 3: return <Style3Cyberpunk d={d} />;
    case 4: return <Style4RetroPixel d={d} />;
    case 5: return <Style5iOSClean d={d} />;
    case 6: return <Style6AnimeSpeedlines d={d} />;
    case 7: return <Style7EGirlPastel d={d} />;
    case 8: return <Style8BreakingNews d={d} />;
    case 9: return <Style9DarkStealth d={d} />;
    case 10: return <Style10GlassSidebar d={d} />;
    default: return <Style2Holographic d={d} />;
  }
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
