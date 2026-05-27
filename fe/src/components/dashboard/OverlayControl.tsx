import { useState } from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-lg p-4">
      <h4 className="font-display text-[11px] uppercase tracking-widest text-muted-foreground mb-3">{title}</h4>
      {children}
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "accent" | "ghost";
}) {
  const styles: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
    primary: "bg-primary text-primary-foreground glow-border hover:brightness-110",
    accent: "bg-accent text-accent-foreground hover:brightness-110",
    ghost: "bg-transparent border border-border text-foreground hover:bg-secondary/40",
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-xs font-display uppercase tracking-wide transition-all active:scale-95 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export function OverlayControl() {
  const [donor, setDonor] = useState("respati");
  const [amount, setAmount] = useState(50000);
  const [msg, setMsg] = useState("Mantap streamnya!");
  const [viewer, setViewer] = useState("kazura");

  const sendDonation = async (withAI = false) => {
    const finalAmount = withAI ? Math.max(amount, 10000) : amount;
    try {
      await fetch("/api/test/donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donatorName: donor, amount: finalAmount, message: msg }),
      });
    } catch (e) {
      console.error("[simulator] failed to send donation:", e);
    }
  };

  const sendAbsen = async (kind: "sub" | "absen", count = 1) => {
    try {
      if (kind === "sub") {
        await fetch("/api/test/subscriber", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: viewer }),
        });
      } else if (count === 1) {
        await fetch("/api/test/absen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: viewer }),
        });
      } else if (count === 5) {
        await fetch("/api/test/absen/stack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delay: 600 }),
        });
      } else if (count === 20) {
        await fetch("/api/test/absen/chaos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      }
    } catch (e) {
      console.error("[simulator] failed to send absen:", e);
    }
  };

  const fx = async (kind: "lightning" | "wipe" | "reveal") => {
    try {
      if (kind === "lightning") {
        await fetch("/api/test/lightning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ donatorName: donor, amount: Math.max(amount, 50000), message: msg }),
        });
      } else {
        await fetch("/api/test/transition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phase: kind === "wipe" ? "start" : "end" }),
        });
      }
    } catch (e) {
      console.error("[simulator] failed to send fx:", e);
    }
  };

  return (
    <div className="glass glow-border rounded-xl p-4 space-y-4">
      <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">Overlay Control</h3>

      <Section title="Donation Simulator">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            value={donor}
            onChange={(e) => setDonor(e.target.value)}
            placeholder="Donator Name"
            className="bg-input border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ring-ring"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(+e.target.value)}
            placeholder="Amount"
            className="bg-input border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ring-ring"
          />
        </div>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Message"
          rows={2}
          className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ring-ring mb-2"
        />
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="primary" onClick={() => sendDonation(false)}>Kirim Donasi</Btn>
          <Btn variant="accent" onClick={() => sendDonation(true)}>Kirim AI Dialogue</Btn>
        </div>
      </Section>

      <Section title="Subscriber & Absen Simulator">
        <input
          value={viewer}
          onChange={(e) => setViewer(e.target.value)}
          placeholder="Viewer Username"
          className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ring-ring mb-2"
        />
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="primary" onClick={() => sendAbsen("sub")}>Sub Baru</Btn>
          <Btn onClick={() => sendAbsen("absen")}>Absen Single</Btn>
          <Btn onClick={() => sendAbsen("absen", 5)}>Absen Stack (5)</Btn>
          <Btn variant="accent" onClick={() => sendAbsen("absen", 20)}>Absen Chaos (20)</Btn>
        </div>
      </Section>

      <Section title="Special FX & Transitions">
        <div className="grid grid-cols-3 gap-2">
          <Btn onClick={() => fx("lightning")}>⚡ Lightning</Btn>
          <Btn onClick={() => fx("wipe")}>🎬 Wipe</Btn>
          <Btn onClick={() => fx("reveal")}>👁️ Reveal</Btn>
        </div>
      </Section>
    </div>
  );
}
