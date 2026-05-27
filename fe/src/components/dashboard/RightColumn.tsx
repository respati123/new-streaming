import { useState } from "react";

const LEADERBOARD = [
  { name: "respati", points: 12450, tier: "DIAMOND" },
  { name: "kazura", points: 9820, tier: "PLATINUM" },
  { name: "nyxlust", points: 7610, tier: "GOLD" },
  { name: "draco", points: 6300, tier: "GOLD" },
  { name: "miraa", points: 5120, tier: "SILVER" },
  { name: "orbital", points: 4400, tier: "SILVER" },
  { name: "ghostbyte", points: 3210, tier: "BRONZE" },
  { name: "pixelqueen", points: 1850, tier: "BRONZE" },
];

const TIER_COLOR: Record<string, string> = {
  DIAMOND: "bg-cyan-400 text-cyan-950",
  PLATINUM: "bg-slate-200 text-slate-900",
  GOLD: "bg-yellow-400 text-yellow-950",
  SILVER: "bg-zinc-400 text-zinc-900",
  BRONZE: "bg-amber-700 text-amber-50",
};

export function Leaderboard() {
  return (
    <div className="glass glow-border rounded-xl p-4">
      <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground mb-3">Leaderboard</h3>
      <div className="max-h-[230px] overflow-y-auto space-y-1.5 pr-1">
        {LEADERBOARD.map((u, i) => (
          <div key={u.name} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-secondary/40 transition">
            <span className="font-display text-xs w-5 text-muted-foreground">#{i + 1}</span>
            <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${u.name}`} className="w-7 h-7 rounded-md" />
            <span className="text-sm flex-1 truncate font-semibold">{u.name}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-display ${TIER_COLOR[u.tier]}`}>{u.tier}</span>
            <span className="text-xs font-mono text-foreground/80 w-14 text-right">{u.points.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const HOTKEYS = [
  "Mute TTS",
  "Sfx Explosion",
  "Sfx Cheer",
  "Change Scene",
  "Brb Screen",
  "Pause Stream",
  "Toggle Cam",
  "Replay Clip",
  "Confetti",
];

export function StreamerBotActions() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="glass glow-border rounded-xl p-4">
      <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground mb-3">Streamer.bot Actions</h3>
      <div className="grid grid-cols-3 gap-2">
        {HOTKEYS.map((k) => (
          <button
            key={k}
            onClick={() => {
              setActive(k);
              setTimeout(() => setActive(null), 800);
            }}
            className={`relative px-2 py-3 rounded-md border border-border bg-secondary/40 text-xs font-display uppercase tracking-wide transition-all hover:bg-secondary/70 active:scale-95 ${
              active === k ? "animate-pulse-ring bg-primary text-primary-foreground" : ""
            }`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

const HISTORY = [
  { status: "DONE", title: "Subnautica deep dive ep. 4", msgs: 4321 },
  { status: "DONE", title: "Just chatting + Q&A", msgs: 2110 },
  { status: "RAID", title: "Valorant ranked grind", msgs: 8765 },
  { status: "DONE", title: "Late night drawing", msgs: 980 },
];

export function StreamHistory() {
  return (
    <div className="glass glow-border rounded-xl p-4">
      <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground mb-3">Stream History</h3>
      <div className="space-y-2">
        {HISTORY.map((h, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30 border border-border">
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-display ${
                h.status === "RAID" ? "bg-accent text-accent-foreground" : "bg-emerald-500/80 text-white"
              }`}
            >
              {h.status}
            </span>
            <span className="text-sm flex-1 truncate">{h.title}</span>
            <span className="text-xs text-muted-foreground font-mono">{h.msgs.toLocaleString()} msgs</span>
          </div>
        ))}
      </div>
    </div>
  );
}
