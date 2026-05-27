export function WebcamFrame({ label = "RESPATI" }: { label?: string }) {
  return (
    <div className="absolute bottom-6 right-6 z-10">
      <div className="relative w-[260px] h-[200px]">
        <div className="absolute -inset-1 rounded-xl glow-border" />
        <div className="relative w-full h-full glass rounded-xl overflow-hidden grid place-items-center">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "linear-gradient(135deg, var(--primary) 0%, transparent 40%, var(--accent) 100%)",
            }}
          />
          <div className="relative text-5xl font-display glow-text">📹</div>
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-live" />
            <span className="text-[10px] font-display uppercase tracking-widest">Cam</span>
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span className="text-sm font-display tracking-widest glow-text">{label}</span>
            <span className="text-[10px] font-mono text-muted-foreground">1080p</span>
          </div>
        </div>
      </div>
    </div>
  );
}
