import { Hono } from "hono";
import { broadcastChat } from "../lib/ws";

let activeStyle = 2; // Default to Holographic Card

export function getActiveAlertStyle() {
  return activeStyle;
}

export function setActiveAlertStyle(id: number): boolean {
  if (id < 1 || id > 10) return false;
  activeStyle = id;
  broadcastChat({ type: "alert_style_changed", data: { style: id } });
  console.log(`[alert-style] Active style set to: ${id}`);
  return true;
}

export const alertStyleRoute = new Hono();

// GET /api/alerts/style/current
alertStyleRoute.get("/current", (c) => {
  return c.json({ style: activeStyle });
});

// POST /api/alerts/style/set  { style: 3 }
alertStyleRoute.post("/set", async (c) => {
  const body = await c.req.json();
  const { style } = body;

  if (typeof style !== "number") {
    return c.json({ ok: false, error: "style field must be a number" }, 400);
  }

  const ok = setActiveAlertStyle(style);
  if (!ok) {
    return c.json({ ok: false, error: `Invalid style: ${style}. Must be 1-10` }, 400);
  }

  return c.json({ ok: true, style: activeStyle });
});
