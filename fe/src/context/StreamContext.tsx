import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type ThemeName = "cyberpunk" | "retro";

export type ChatMsg = {
  id: string;
  user: string;
  color: string;
  badge: "Pokeball" | "Shield Gold" | "Viper" | "Mod" | "VIP";
  avatar: string;
  text: string;
  ts: number;
};

export type DonationEvt = {
  id: string;
  name: string;
  amount: number;
  message: string;
  withAI?: boolean;
  audioBase64?: string | null;
  audioDurationMs?: number | null;
  userAudioBase64?: string | null;
  userAudioDurationMs?: number | null;
  aiAudioBase64?: string | null;
  aiAudioDurationMs?: number | null;
  userMessage?: string;
  originalDonatorName?: string;
  youtubeName?: string;
  profileImageUrl?: string;
};

export type AbsenEvt = { id: string; user: string; kind: "sub" | "absen" };
export type FxEvt = { id: string; kind: "lightning" | "wipe" | "reveal" };
export type SpawnEvt = {
  id: string;
  user: string;
  color: string;
  text?: string;
  badge?: string;
  characterId?: string;
};

type Listeners = {
  donation: (e: DonationEvt) => void;
  absen: (e: AbsenEvt) => void;
  fx: (e: FxEvt) => void;
  spawn: (e: SpawnEvt) => void;
  alert_style_changed: (style: number) => void;
};

type Bus = {
  on: <K extends keyof Listeners>(k: K, fn: Listeners[K]) => () => void;
  emit: <K extends keyof Listeners>(k: K, payload: Parameters<Listeners[K]>[0]) => void;
};

type Ctx = {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  chat: ChatMsg[];
  pushChat: (m: Omit<ChatMsg, "id" | "ts">) => void;
  bus: Bus;
};

const StreamCtx = createContext<Ctx | null>(null);

const COLORS = ["#5eead4", "#f472b6", "#fbbf24", "#a78bfa", "#60a5fa", "#fb7185", "#34d399"];
const BADGES: ChatMsg["badge"][] = ["Pokeball", "Shield Gold", "Viper", "Mod", "VIP"];
const SAMPLE_USERS = ["respati", "kazura", "nyxlust", "draco", "miraa", "orbital", "ghostbyte", "pixelqueen"];
const SAMPLE_MSGS = [
  "POG that was clean",
  "kEKW",
  "let's gooo",
  "first absen!",
  "respati main apa nih bang",
  "TTS testing 1 2 3",
  "subbed for 3 months!",
  "lag bang lag",
];

function rid() {
  return Math.random().toString(36).slice(2, 10);
}

function mapBadge(badge: string | null | undefined): ChatMsg["badge"] {
  if (!badge) return "Pokeball";
  const b = badge.toLowerCase();
  if (b === "shield_futuristic") return "VIP";
  if (b === "shield_gold") return "Shield Gold";
  if (b === "viper") return "Viper";
  if (b === "shield_blue") return "Mod";
  if (b === "pokeball") return "Pokeball";
  // Fallbacks
  if (b.includes("vip")) return "VIP";
  if (b.includes("mod")) return "Mod";
  if (b.includes("gold")) return "Shield Gold";
  if (b.includes("viper")) return "Viper";
  return "Pokeball";
}

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("cyberpunk");
  const [chat, setChat] = useState<ChatMsg[]>([]);

  const listenersRef = useRef<{ [K in keyof Listeners]: Set<Listeners[K]> }>({
    donation: new Set(),
    absen: new Set(),
    fx: new Set(),
    spawn: new Set(),
    alert_style_changed: new Set(),
  });

  const bus: Bus = useMemo(
    () => ({
      on: (k, fn) => {
        (listenersRef.current[k] as Set<typeof fn>).add(fn);
        return () => {
          (listenersRef.current[k] as Set<typeof fn>).delete(fn);
        };
      },
      emit: (k, payload) => {
        (listenersRef.current[k] as Set<(p: typeof payload) => void>).forEach((fn) => fn(payload));
      },
    }),
    [],
  );

  const pushChat = useCallback((m: Omit<ChatMsg, "id" | "ts">) => {
    setChat((prev) => {
      // Avoid duplicate messages
      const isDuplicate = prev.some(
        (existing) => existing.text === m.text && existing.user === m.user && Math.abs(existing.ts - Date.now()) < 500
      );
      if (isDuplicate) return prev;
      return [...prev.slice(-40), { ...m, id: rid(), ts: Date.now() }];
    });
  }, []);

  const setTheme = useCallback(async (newTheme: ThemeName) => {
    setThemeState(newTheme);
    try {
      await fetch("/api/theme/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (e) {
      console.error("[theme] failed to sync theme with backend:", e);
    }
  }, []);

  // Client-only initialization
  useEffect(() => {
    // 1. Fetch current theme
    fetch("/api/theme/current")
      .then((r) => r.json())
      .then((d) => {
        if (d.theme) {
          setThemeState(d.theme);
        }
      })
      .catch((err) => console.error("[theme] failed to fetch current theme", err));

    // 2. Fetch history
    fetch("/api/streams/history/recent?limit=40")
      .then((r) => r.json())
      .then((d) => {
        if (d.messages && Array.isArray(d.messages)) {
          const mapped = d.messages.map((m: any) => ({
            id: m.id || rid(),
            user: m.user.name,
            color: m.user.color || "#FFFFFF",
            badge: mapBadge(m.user.badge),
            avatar: m.user.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.user.name}`,
            text: m.content,
            ts: new Date(m.publishedAt).getTime(),
          }));
          setChat(mapped);
        }
      })
      .catch((err) => console.error("[chat] failed to fetch recent history", err));

    // 3. Setup WebSocket connection
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
      console.log("[ws] connecting to:", wsUrl);

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("[ws] connected successfully");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[ws] event received:", data.type, data);

          if (data.type === "chat") {
            pushChat({
              user: data.user.name,
              color: data.user.color || "#FFFFFF",
              badge: mapBadge(data.user.badge),
              avatar: data.user.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${data.user.name}`,
              text: data.content,
            });
            bus.emit("spawn", {
              id: data.id || rid(),
              user: data.user.name,
              color: data.user.color || "#FFFFFF",
              text: data.content,
              badge: data.user.badge || undefined,
              characterId: data.user.characterId || undefined,
            });
          } else if (data.type === "transition") {
            bus.emit("fx", {
              id: data.id || rid(),
              kind: data.phase === "start" ? "wipe" : "reveal",
            });
          } else if (data.type === "lightning") {
            bus.emit("fx", {
              id: data.id || rid(),
              kind: "lightning",
            });
          } else if (data.type === "donation") {
            bus.emit("donation", {
              id: String(data.id || rid()),
              name: data.donatorName,
              amount: data.amount,
              message: data.message,
              withAI: data.isAiReply,
              audioBase64: data.audioBase64,
              audioDurationMs: data.audioDurationMs,
              userAudioBase64: data.userAudioBase64,
              userAudioDurationMs: data.userAudioDurationMs,
              aiAudioBase64: data.aiAudioBase64,
              aiAudioDurationMs: data.aiAudioDurationMs,
              userMessage: data.userMessage,
              originalDonatorName: data.originalDonatorName,
              youtubeName: data.youtubeName,
              profileImageUrl: data.profileImageUrl,
            });
          } else if (data.type === "subscriber") {
            const sub = data.data || data;
            const user = sub.username;
            bus.emit("absen", {
              id: data.id || rid(),
              user,
              kind: "sub",
            });
            bus.emit("spawn", {
              id: data.id || rid(),
              user,
              color: "#f472b6",
              text: "Just subscribed!",
            });
            pushChat({
              user,
              color: "#f472b6",
              badge: "VIP",
              avatar: sub.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user}`,
              text: "Just subscribed!",
            });
          } else if (data.type === "absen") {
            const abs = data.data || data;
            const user = abs.username;
            bus.emit("absen", {
              id: data.id || rid(),
              user,
              kind: "absen",
            });
            bus.emit("spawn", {
              id: data.id || rid(),
              user,
              color: "#34d399",
              text: "Absen bang!",
            });
            pushChat({
              user,
              color: "#34d399",
              badge: "Pokeball",
              avatar: abs.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user}`,
              text: "Absen bang!",
            });
          } else if (data.type === "theme_changed") {
            const themeName = (data.data?.theme || data.theme) as ThemeName;
            if (themeName) {
              setThemeState(themeName);
            }
          } else if (data.type === "alert_style_changed") {
            bus.emit("alert_style_changed" as any, data.data.style);
          }
        } catch (e) {
          console.error("[ws] failed to parse message", e);
        }
      };

      socket.onclose = () => {
        console.log("[ws] disconnected, reconnecting in 3 seconds...");
        reconnectTimeout = setTimeout(connectWs, 3000);
      };

      socket.onerror = (e) => {
        console.error("[ws] error:", e);
        socket?.close();
      };
    };

    connectWs();

    return () => {
      if (socket) {
        socket.onclose = null; // Prevent reconnection trigger
        socket.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [pushChat, bus]);

  // theme application class names on HTML document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-cyberpunk", "theme-retro");
    root.classList.add(`theme-${theme}`);
    document.body.classList.add("has-bg");
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, chat, pushChat, bus }),
    [theme, chat, pushChat, bus],
  );

  return <StreamCtx.Provider value={value}>{children}</StreamCtx.Provider>;
}

export function useStream() {
  const ctx = useContext(StreamCtx);
  if (!ctx) throw new Error("useStream must be inside StreamProvider");
  return ctx;
}

export const _internals = { COLORS, SAMPLE_USERS, BADGES, rid };
