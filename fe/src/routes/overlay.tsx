import { createFileRoute } from "@tanstack/react-router";
import { StreamProvider } from "@/context/StreamContext";
import { OverlayCanvas } from "@/components/overlay/Canvas";
import { AbsenToasts, DonationAlert, FxLayer } from "@/components/overlay/Alerts";
import { AiDialogueBox } from "@/components/overlay/AiDialogueBox";
import { WebcamFrame } from "@/components/overlay/WebcamFrame";
import { OverlayChatWidget } from "@/components/overlay/ChatWidget";

export const Route = createFileRoute("/overlay")({
  head: () => ({
    meta: [
      { title: "Stream Overlay — Pipeline" },
      { name: "description", content: "Transparent OBS browser-source overlay." },
    ],
  }),
  component: OverlayPage,
});

function OverlayPage() {
  return (
    <StreamProvider>
      <OverlayInner />
    </StreamProvider>
  );
}

function OverlayInner() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: "transparent" }}
    >
      <OverlayCanvas />
      <OverlayChatWidget />
      <WebcamFrame label="RESPATI" />
      <DonationAlert />
      <AiDialogueBox />
      <AbsenToasts />
      <FxLayer />
    </div>
  );
}
