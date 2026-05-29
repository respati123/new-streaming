export function getAlertFrameClass(amount: number): string {
  if (amount < 10000) return "alert-frame-tier-1";
  if (amount < 50000) return "alert-frame-tier-2";
  if (amount < 100000) return "alert-frame-tier-3";
  if (amount < 250000) return "alert-frame-tier-4";
  return "alert-frame-tier-5";
}

export function Particles() {
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
