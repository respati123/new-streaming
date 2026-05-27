import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pipeline.Stream — AI Streaming Automation" },
      { name: "description", content: "Real-time interactive streamer dashboard and gaming overlay system." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="max-w-2xl w-full glass-2 glow-border rounded-2xl p-10 text-center">
        <div className="text-[11px] font-display uppercase tracking-[0.4em] text-muted-foreground mb-3">
          AI Streaming Automation · MVP
        </div>
        <h1 className="text-5xl font-display glow-text mb-4">PIPELINE.STREAM</h1>
        <p className="text-muted-foreground mb-8">
          Real-time interactive streamer dashboard and transparent gaming overlay. Themed glassmorphism, simulated WS,
          AI dialogue alerts.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/dashboard"
            className="px-5 py-3 rounded-md bg-primary text-primary-foreground font-display uppercase tracking-wider text-sm glow-border hover:brightness-110"
          >
            Open Dashboard
          </Link>
          <Link
            to="/overlay"
            className="px-5 py-3 rounded-md glass font-display uppercase tracking-wider text-sm hover:bg-secondary/60"
          >
            View Overlay
          </Link>
        </div>
      </div>
    </div>
  );
}
