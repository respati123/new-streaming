import { useState } from "react";

interface DummyUser {
  name: string;
  isOwner: boolean;
  isModerator: boolean;
  points: number;
  badge: string;
}

const DUMMY_USERS: DummyUser[] = [
  { name: "Bang Respati", isOwner: true, isModerator: false, points: -1, badge: "🛡️ Owner" },
  { name: "Kazura", isOwner: false, isModerator: true, points: -1, badge: "🔰 Mod" },
  { name: "NyxLust", isOwner: false, isModerator: false, points: 12000, badge: "👾 Futuristic (12k pts)" },
  { name: "Draco", isOwner: false, isModerator: false, points: 6000, badge: "🐍 Viper (6k pts)" },
  { name: "Miraa", isOwner: false, isModerator: false, points: 2500, badge: "🔶 Gold (2.5k pts)" },
  { name: "Orbital", isOwner: false, isModerator: false, points: 800, badge: "🔷 Blue (800 pts)" },
  { name: "GhostByte", isOwner: false, isModerator: false, points: 50, badge: "⚪ Pokeball (50 pts)" },
];

const COMMANDS = [
  { command: "!absen", desc: "Simulate daily check-in", template: "!absen" },
  { command: "!sub", desc: "Simulate new subscriber alert", template: "!sub" },
  { command: "!saweria", desc: "Simulate donation alert (dialogue/TTS)", template: "!saweria 50000 Mantap bang!" },
  { command: "!ai", desc: "Trigger AI dialogue reply sequentially", template: "!ai Halo AI!" },
  { command: "!lightning", desc: "Trigger lightning screen flash (min 50k)", template: "!lightning" },
  { command: "!transition", desc: "Trigger OBS screen wipe transition", template: "!transition start" },
  { command: "!chatchaos", desc: "Spam 20 random chat messages with varying lengths", template: "!chatchaos" },
];

export function ChatSimulatorForm() {
  const [selectedUserIndex, setSelectedUserIndex] = useState(6); // Default: GhostByte
  const [customName, setCustomName] = useState("");
  const [mode, setMode] = useState<"default" | "commands">("default");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; text: string } | null>(null);

  const selectedUser = DUMMY_USERS[selectedUserIndex];
  const displayName = customName.trim() || selectedUser.name;

  const showStatus = (text: string, success = true) => {
    setStatus({ success, text });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    const msgText = message.trim();

    try {
      if (msgText.startsWith("!")) {
        const parts = msgText.split(" ");
        const cmd = parts[0].toLowerCase();

        if (cmd === "!absen") {
          await fetch("/api/test/absen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: displayName, points: selectedUser.points }),
          });
          showStatus(`Command !absen triggered for @${displayName}`);
        } else if (cmd === "!sub") {
          await fetch("/api/test/subscriber", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: displayName }),
          });
          showStatus(`Command !sub triggered for @${displayName}`);
        } else if (cmd === "!saweria") {
          // Parse: !saweria [amount] [message]
          const amtStr = parts[1] || "50000";
          const amount = parseInt(amtStr, 10) || 50000;
          const donationMsg = parts.slice(2).join(" ") || "Mantap streamnya!";

          await fetch("/api/test/donation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ donatorName: displayName, amount, message: donationMsg }),
          });
          showStatus(`Donation of Rp${amount.toLocaleString()} simulated from @${displayName}`);
        } else if (cmd === "!ai") {
          const aiMsg = parts.slice(1).join(" ") || "Halo AI!";
          await fetch("/api/test/ai-dialogue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: displayName, message: aiMsg }),
          });
          showStatus(`AI Dialogue triggered: "${aiMsg}"`);
        } else if (cmd === "!lightning") {
          await fetch("/api/test/lightning", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ donatorName: displayName, amount: 100000, message: "Mega donation!" }),
          });
          showStatus("⚡ Lightning Flash triggered");
        } else if (cmd === "!transition") {
          const phase = parts[1] || "start";
          await fetch("/api/test/transition", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phase: phase === "end" || phase === "reveal" ? "end" : "start" }),
          });
          showStatus(`Transition phase '${phase}' triggered`);
        } else if (cmd === "!chatchaos" || cmd === "!chaos") {
          await fetch("/api/test/chat/chaos", {
            method: "POST"
          });
          showStatus("🔥 Chat Chaos simulation triggered! Sending 20 messages...");
        } else {
          // Unknown command, send as standard chat
          await sendStandardChat(msgText);
        }
      } else {
        // Standard chat message
        await sendStandardChat(msgText);
      }
      setMessage("");
    } catch (err) {
      console.error("[simulator] failed to send:", err);
      showStatus("Gagal mengirim simulasi.", false);
    } finally {
      setIsSending(false);
    }
  };

  const sendStandardChat = async (msgText: string) => {
    const res = await fetch("/api/test/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: `test-${displayName.toLowerCase().replace(/\s+/g, "-")}`,
        name: displayName,
        message: msgText,
        profileImageUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${displayName}`,
        isOwner: selectedUser.isOwner,
        isModerator: selectedUser.isModerator,
        points: selectedUser.points,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      showStatus(`Pesan dikirim sebagai ${displayName} (${data.tier})`);
    } else {
      throw new Error(data.error);
    }
  };

  return (
    <div className="glass glow-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">Chat Simulator</h3>
        <span className="text-[10px] uppercase font-display bg-primary/20 text-primary px-2 py-0.5 rounded-full tracking-wide">
          Active Test
        </span>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        {/* User Selector Row */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-display uppercase tracking-wider text-muted-foreground">Select User Persona</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select
              value={selectedUserIndex}
              onChange={(e) => {
                setSelectedUserIndex(Number(e.target.value));
                setCustomName("");
              }}
              className="bg-input border border-border/80 rounded-md px-3 py-2 text-xs outline-none focus:ring-2 ring-ring w-full"
            >
              {DUMMY_USERS.map((u, i) => (
                <option key={u.name} value={i}>
                  {u.name} ({u.badge})
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Or type custom name..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="bg-input border border-border/80 rounded-md px-3 py-2 text-xs outline-none focus:ring-2 ring-ring w-full placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-border/20 pb-2 gap-4">
          <button
            type="button"
            onClick={() => setMode("default")}
            className={`text-xs font-display uppercase tracking-widest pb-1 relative transition-colors ${
              mode === "default" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {mode === "default" && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />}
            💬 Normal Chat
          </button>
          <button
            type="button"
            onClick={() => setMode("commands")}
            className={`text-xs font-display uppercase tracking-widest pb-1 relative transition-colors ${
              mode === "commands" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {mode === "commands" && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />}
            🤖 Commands & Alerts
          </button>
        </div>

        {/* Command Chips list */}
        {mode === "commands" && (
          <div className="space-y-1.5 animate-pop-in">
            <label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Select Command Template</label>
            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
              {COMMANDS.map((c) => (
                <button
                  type="button"
                  key={c.command}
                  onClick={() => setMessage(c.template)}
                  title={c.desc}
                  className="px-2.5 py-1 rounded bg-secondary/50 border border-border hover:bg-secondary text-[11px] font-mono text-primary-foreground hover:text-primary transition active:scale-95"
                >
                  {c.command}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input Box */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-display uppercase tracking-wider text-muted-foreground">Message</label>
          <textarea
            placeholder={mode === "commands" ? "Type or select a command (e.g. !absen, !ai Halo Respati)" : "Type chat message..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            required
            className="w-full bg-input border border-border/80 rounded-md px-3 py-2 text-xs outline-none focus:ring-2 ring-ring resize-none placeholder:text-muted-foreground/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        {/* Status notification */}
        {status && (
          <div
            className={`text-xs p-2 rounded border font-display transition-all ${
              status.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {status.text}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSending || !message.trim()}
          className="w-full py-2.5 bg-primary text-primary-foreground hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition rounded-md text-xs font-display uppercase tracking-wider font-semibold glow-border"
        >
          {isSending ? "Sending..." : "Send to Live Overlay"}
        </button>
      </form>
    </div>
  );
}
