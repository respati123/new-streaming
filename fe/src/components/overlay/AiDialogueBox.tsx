import { useEffect, useState, useRef } from "react";
import { useStream, type DonationEvt } from "@/context/StreamContext";
import { unlockAudio, playDonationSound } from "@/lib/audio";

export function AiDialogueBox() {
  const { bus, theme } = useStream();
  const [d, setD] = useState<DonationEvt | null>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [phase, setPhase] = useState<"user" | "ai">("ai");
  const [currentFrame, setCurrentFrame] = useState(1);
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

  // Avatar cycling animation while visible
  useEffect(() => {
    if (!visible || !d) return;
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev % 3) + 1);
    }, 150);
    return () => clearInterval(interval);
  }, [visible, d]);

  useEffect(() => {
    return bus.on("donation", (e) => {
      // Differentiate: Only handle AI Dialogue donations
      if (!e.withAI) return;

      // 1. Stop current audio/timers
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearAllTimeouts();

      // 2. Setup state
      setD(e);
      setCurrentFrame(1);
      setExiting(false);
      setVisible(true);
      unlockAudio();

      // 3. Playback Logic
      playDonationSound().finally(() => {
        // Case 1: Sequential AI dialogue (User TTS + AI TTS)
        if (e.userAudioBase64 && e.aiAudioBase64) {
          setPhase("user");
          const userAudio = new Audio(`data:audio/mp3;base64,${e.userAudioBase64}`);
          userAudio.volume = 1;
          audioRef.current = userAudio;

          const playAiAudio = () => {
            setPhase("ai");
            const aiAudio = new Audio(`data:audio/mp3;base64,${e.aiAudioBase64}`);
            aiAudio.volume = 1;
            audioRef.current = aiAudio;

            aiAudio.onended = () => {
              addTimeout(() => {
                setExiting(true);
                addTimeout(() => {
                  setVisible(false);
                  setD(null);
                }, 500); // match transition out timing
              }, 2000);
            };

            aiAudio.play().catch((err) => {
              console.error("[AiDialogueBox] AI Audio play failed", err);
              addTimeout(() => {
                setExiting(true);
                addTimeout(() => {
                  setVisible(false);
                  setD(null);
                }, 500);
              }, 5000);
            });
          };

          userAudio.onended = () => {
            addTimeout(playAiAudio, 600); // Natural gap between voices
          };

          userAudio.play().catch((err) => {
            console.error("[AiDialogueBox] User Audio play failed", err);
            playAiAudio();
          });

        } else if (e.audioBase64) {
          // Case 2: Standard single-track TTS under AI dialogue box
          setPhase("ai");
          const audio = new Audio(`data:audio/mp3;base64,${e.audioBase64}`);
          audio.volume = 1;
          audioRef.current = audio;

          audio.onended = () => {
            addTimeout(() => {
              setExiting(true);
              addTimeout(() => {
                setVisible(false);
                setD(null);
              }, 500);
            }, 2000);
          };

          audio.play().catch((err) => {
            console.error("[AiDialogueBox] Audio play failed", err);
            addTimeout(() => {
              setExiting(true);
              addTimeout(() => {
                setVisible(false);
                setD(null);
              }, 500);
            }, 5000);
          });

        } else {
          // Case 3: Fallback for no audio
          setPhase("ai");
          const delay = 5000 + e.message.length * 40;
          addTimeout(() => {
            setExiting(true);
            addTimeout(() => {
              setVisible(false);
              setD(null);
            }, 500);
          }, Math.min(delay, 15000));
        }
      });
    });
  }, [bus]);

  if (!d || !visible) return null;

  const currentName = phase === "user" && d.originalDonatorName
    ? d.originalDonatorName
    : d.name;

  const currentText = phase === "user" && d.userMessage
    ? d.userMessage
    : d.message;

  const isCyberpunk = theme === "cyberpunk";

  return (
    <div
      className={`absolute bottom-10 left-0 w-full px-10 z-20 pointer-events-none transition-all duration-500 ease-out ${
        visible && !exiting ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
    >
      <div className="max-w-[800px] mx-auto relative pointer-events-auto">
        
        {/* NPC Name Tag */}
        <div className="dialogue-name-tag">
          <span>{currentName.toUpperCase()}</span>
        </div>

        {/* Main Dialogue Box */}
        <div className="dialogue-container-box backdrop-blur-md">
          
          {/* Cyberpunk Corners */}
          {isCyberpunk && (
            <>
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-accent opacity-85 z-10" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-accent opacity-85 z-10" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-accent opacity-85 z-10" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-accent opacity-85 z-10" />
            </>
          )}

          <div className="p-4 flex gap-5 items-center">
            
            {/* Character Avatar Box */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 border border-accent/20 rounded-md relative overflow-hidden bg-black/50 p-0.5">
                <div className="absolute inset-0 bg-accent/5 mix-blend-overlay z-2 pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-3">
                  <div className="absolute w-full h-[1px] bg-accent rotate-45" />
                  <div className="absolute w-full h-[1px] bg-accent -rotate-45" />
                </div>
                <img
                  src={`/images/donation${currentFrame}.png`}
                  alt="Avatar"
                  className="w-full h-full object-contain grayscale opacity-85 transition-all duration-500 hover:grayscale-0 hover:opacity-100"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            </div>

            {/* Dialogue Text Block */}
            <div className="flex-grow flex flex-col justify-between self-stretch text-left">
              <div>
                <span className="font-display text-[9px] text-accent/60 uppercase tracking-[0.15em] block mb-1.5 leading-none">
                  COMMS_LOG:
                </span>
                <div className="text-foreground/90 font-body text-base leading-relaxed tracking-wide">
                  {d.amount && d.amount > 0 ? (
                    <span className="text-yellow-400 font-bold text-sm tracking-wide block mb-1 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                      [CREDITS: Rp {d.amount.toLocaleString("id-ID")}]
                    </span>
                  ) : null}
                  <span>{currentText}</span>
                  <span className="inline-block w-1.5 h-[1.1em] bg-accent ml-1 align-middle animate-pulse" />
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
