import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChatBox } from "@/components/dashboard/ChatBox";
import { OverlayControl } from "@/components/dashboard/OverlayControl";
import { AlertStyleGallery } from "@/components/dashboard/AlertStyleGallery";
import { Leaderboard, StreamerBotActions, StreamHistory } from "@/components/dashboard/RightColumn";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { StreamProvider } from "@/context/StreamContext";
import { OverlayCanvas } from "@/components/overlay/Canvas";
import { AbsenToasts, DonationAlert, FxLayer } from "@/components/overlay/Alerts";
import { AiDialogueBox } from "@/components/overlay/AiDialogueBox";
import { ChatSimulatorForm } from "@/components/dashboard/ChatSimulatorForm";
import { OverlayChatWidget } from "@/components/overlay/ChatWidget";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Streamer Dashboard — Pipeline" },
      { name: "description", content: "AI-powered streaming automation dashboard." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"preview" | "chat" | "simulator">("preview");

  return (
    <StreamProvider>
      <div className="min-h-screen p-4 lg:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg glass-2 grid place-items-center font-display text-lg glow-text">⌬</div>
            <div>
              <h1 className="text-xl font-display tracking-wide glow-text">PIPELINE.STREAM</h1>
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Streamer Dashboard</p>
            </div>
            <span className="ml-3 inline-flex items-center gap-1.5 glass px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-live" />
              <span className="text-[10px] font-display uppercase tracking-widest">Live</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/overlay"
              target="_blank"
              className="glass px-3 py-1.5 rounded-full text-xs font-display uppercase tracking-wider hover:bg-secondary/60"
            >
              Open Overlay ↗
            </Link>
            <ThemeSwitcher />
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex border-b border-border/30 mb-6 gap-6">
          <button
            onClick={() => setActiveTab("preview")}
            className={`pb-3 text-xs font-display uppercase tracking-widest transition-all relative ${
              activeTab === "preview"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeTab === "preview" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary animate-pulse" />
            )}
            👁️ Overlay Preview
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`pb-3 text-xs font-display uppercase tracking-widest transition-all relative ${
              activeTab === "chat"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeTab === "chat" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary animate-pulse" />
            )}
            💬 Live Chat & Monitor
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`pb-3 text-xs font-display uppercase tracking-widest transition-all relative ${
              activeTab === "simulator"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeTab === "simulator" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary animate-pulse" />
            )}
            ⚡ Chat Simulator
          </button>
        </div>

        {activeTab === "preview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pop-in">
            {/* Big Preview Area */}
            <div className="lg:col-span-8 space-y-4">
              <div className="glass glow-border rounded-xl p-4 flex flex-col space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                    Overlay Live Preview
                  </h3>
                  <span className="text-[10px] glass px-2.5 py-1 rounded-full text-primary uppercase font-display tracking-wider">
                    Interactive Arena
                  </span>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black/60 shadow-2xl">
                  <OverlayCanvas fitContainer />
                  <DonationAlert />
                  <AiDialogueBox />
                  <AbsenToasts />
                  <FxLayer />
                  <div className="absolute bottom-2 left-2 text-[9px] font-display uppercase tracking-widest text-muted-foreground">
                    /overlay · live
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Browser-source preview. Open <span className="text-primary font-bold">/overlay</span> in OBS for transparent capture.
                </p>
              </div>
            </div>

            {/* Controls sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <OverlayControl />
              <AlertStyleGallery />
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pop-in">
            {/* Live Chat Column */}
            <div className="lg:col-span-5 space-y-4">
              <ChatBox />
              <OverlayControl />
            </div>

            {/* Stream Monitor Info Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Leaderboard />
                <StreamerBotActions />
              </div>
              <StreamHistory />
            </div>
          </div>
        )}

        {activeTab === "simulator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pop-in">
            {/* Big Interactive Preview Area with Overlay Chat */}
            <div className="lg:col-span-8 space-y-4">
              <div className="glass glow-border rounded-xl p-4 flex flex-col space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                    Overlay Live Chat Preview
                  </h3>
                  <span className="text-[10px] glass px-2.5 py-1 rounded-full text-primary uppercase font-display tracking-wider">
                    Interactive Arena
                  </span>
                </div>
                <div className="relative h-[500px] rounded-xl overflow-hidden border border-border bg-black/40 shadow-2xl flex flex-col justify-stretch">
                  <OverlayChatWidget full />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Test chat and commands using the panel on the right. Tiers are point-based and dynamic!
                </p>
              </div>
            </div>

            {/* Chat Simulator Form on the Right */}
            <div className="lg:col-span-4 space-y-4">
              <ChatSimulatorForm />
            </div>
          </div>
        )}
      </div>
    </StreamProvider>
  );
}
