import { useStream, type ThemeName } from "@/context/StreamContext";

const THEMES: { id: ThemeName; label: string }[] = [
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "retro", label: "Retro" },
  { id: "ios", label: "iOS" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useStream();
  return (
    <div className="glass rounded-full p-1 flex gap-1">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`px-3 py-1.5 text-xs font-display uppercase tracking-wider rounded-full transition-all ${
            theme === t.id
              ? "bg-primary text-primary-foreground glow-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
