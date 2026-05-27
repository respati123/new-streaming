import { useEffect, useRef, useState } from "react";
import { useStream } from "@/context/StreamContext";
import { SpriteEngine } from "@/lib/SpriteEngine";

interface OverlayCanvasProps {
  fitContainer?: boolean;
}

export function OverlayCanvas({ fitContainer = false }: OverlayCanvasProps) {
  const { bus } = useStream();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SpriteEngine | null>(null);
  const [ready, setReady] = useState(false);
  const charMapRef = useRef<Record<string, string>>({});
  const CHAR_IDS = ["char_1", "char_2", "char_3", "char_4", "char_5"];

  useEffect(() => {
    if (!canvasRef.current) return;
    setReady(false);

    const bounds = fitContainer
      ? {
          fitContainer: true,
          scaleMultiplier: 0.5,
          minYPercentage: 0.4,
          maxYPercentage: 0.9,
          minXPercentage: 0.05,
          maxXPercentage: 0.95,
        }
      : {
          fitContainer: false,
          scaleMultiplier: 1.0,
          minYPercentage: 0.6,
          maxYPercentage: 0.95,
          minXPercentage: 0.05,
          maxXPercentage: 0.95,
        };

    const engine = new SpriteEngine(canvasRef.current, bounds);
    engineRef.current = engine;

    engine.loadAssets().then(() => {
      setReady(true);
      engine.start();
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
      setReady(false);
    };
  }, [fitContainer]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !ready) return;

    const unsubSpawn = bus.on("spawn", (e) => {
      if (!charMapRef.current[e.user]) {
        charMapRef.current[e.user] = e.characterId || CHAR_IDS[Math.floor(Math.random() * CHAR_IDS.length)];
      }
      
      const charId = charMapRef.current[e.user];
      
      engine.spawnForUser(e.user, e.badge, e.color, charId);

      if (e.text) {
        engine.showChat(e.user, e.text);
      }
    });

    return () => {
      unsubSpawn();
    };
  }, [bus, ready]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        imageRendering: "pixelated",
        zIndex: 10,
      }}
    />
  );
}
