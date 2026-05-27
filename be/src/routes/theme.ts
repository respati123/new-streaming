import { Hono } from "hono";
import { broadcastChat } from "../lib/ws";

const VALID_THEMES = ["cyberpunk", "retro"];

let activeTheme = "cyberpunk";

export function getActiveTheme() {
  return activeTheme;
}

export function setActiveTheme(id: string): boolean {
  if (!VALID_THEMES.includes(id)) return false;
  activeTheme = id;
  broadcastChat({ type: "theme_changed", data: { theme: id } });
  console.log(`[theme] Active theme set to: ${id}`);
  return true;
}

export const themeRoute = new Hono();

// GET /api/theme/current
themeRoute.get("/current", (c) => {
  return c.json({ theme: activeTheme });
});

// GET /api/theme/list
themeRoute.get("/list", (c) => {
  return c.json({ themes: VALID_THEMES });
});

// POST /api/theme/set  { theme: "cyberpunk" }
themeRoute.post("/set", async (c) => {
  const body = await c.req.json();
  const { theme } = body;

  if (!theme || typeof theme !== "string") {
    return c.json({ ok: false, error: "theme field required" }, 400);
  }

  const ok = setActiveTheme(theme);
  if (!ok) {
    return c.json({ ok: false, error: `Unknown theme: "${theme}". Valid: ${VALID_THEMES.join(", ")}` }, 400);
  }

  return c.json({ ok: true, theme: activeTheme });
});
