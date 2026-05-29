import { useState, useEffect } from "react";

const STYLES = [
  { id: 1, name: "Minimal Ticker" },
  { id: 2, name: "Holographic Card" },
  { id: 3, name: "Cyberpunk Glitch" },
  { id: 4, name: "Retro Pixel RPG" },
  { id: 5, name: "iOS Clean" },
  { id: 6, name: "Anime Speedlines" },
  { id: 7, name: "E-Girl Pastel" },
  { id: 8, name: "Breaking News" },
  { id: 9, name: "Dark Stealth" },
  { id: 10, name: "Glass Sidebar" },
];

export function AlertStyleGallery() {
  const [active, setActive] = useState<number>(2);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/alerts/style/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.style) setActive(data.style);
      })
      .catch(console.error);
  }, []);

  const setStyle = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts/style/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: id }),
      });
      const data = await res.json();
      if (data.ok) {
        setActive(id);
      }
    } catch (e) {
      console.error("Failed to set style", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass glow-border rounded-xl p-4 space-y-4">
      <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground flex items-center justify-between">
        <span>Donation Alert Gallery</span>
        {loading && <span className="text-[10px] text-accent animate-pulse">Syncing...</span>}
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            disabled={loading}
            className={`
              p-3 rounded-lg text-xs font-display tracking-wide text-left transition-all border
              ${active === s.id 
                ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] scale-100" 
                : "bg-black/40 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/30 scale-95 hover:scale-100"}
            `}
          >
            <div className="font-mono text-[10px] text-white/40 mb-1">STYLE_0{s.id}</div>
            <div className="font-bold">{s.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
