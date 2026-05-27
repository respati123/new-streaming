import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { streamerbotRoute } from "./routes/streamerbot";
import { usersRoute } from "./routes/users";
import { streamsRoute } from "./routes/streams";
import { saweriaRoute } from "./routes/saweria";
import { bagibagiRoute } from "./routes/bagibagi";
import { testRoute } from "./routes/test";
import { themeRoute } from "./routes/theme";
import { registerClient, removeClient } from "./lib/ws";
import "./services/streamerbot";
import { initializeTiers } from "./lib/points";

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
const PORT = Number(process.env.PORT) || 3001;

app.use("*", logger());
app.use("*", cors());

app.get("/", (c) => {
  return c.json({ message: "Streaming API is running" });
});

app.get("/ws/chat", upgradeWebSocket(() => ({
  onOpen(_evt, ws) {
    registerClient(ws);
    console.log("[ws] client connected");
    ws.send(JSON.stringify({ type: "connected", message: "Streaming chat ws active" }));
  },
  onClose(_evt, ws) {
    removeClient(ws);
    console.log("[ws] client disconnected");
  },
})));

app.route("/api/streamerbot", streamerbotRoute);
app.route("/api/users", usersRoute);
app.route("/api/streams", streamsRoute);
app.route("/api/saweria", saweriaRoute);
app.route("/api/bagibagi", bagibagiRoute);
app.route("/api/test", testRoute);
app.route("/api/theme", themeRoute);

async function startServer() {
  await initializeTiers();
  const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log("Server running on http://localhost:" + info.port);
  });
  injectWebSocket(server);
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});