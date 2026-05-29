import { StreamerbotClient, StreamerbotEventPayload } from "@streamerbot/client";
import prisma from "../lib/prisma";
import { getOrCreateUser, addPoints, processDailyLogin } from "../lib/userCache";
import { broadcastChat } from "../lib/ws";
import { generateSubscriberTts } from "./elevenlabs";
import { setActiveTheme } from "../routes/theme";
import { generateRedeemReply } from "./ai";
import { aiQueue } from "./aiQueue";
import { COST_ROAST, COST_TANYA, DAILY_LOGIN_POINTS } from "../lib/points";

const client = new StreamerbotClient({
  host: process.env.STREAMERBOT_HOST || "127.0.0.1",
  port: Number(process.env.STREAMERBOT_PORT) || 8080,
});



let currentStreamId: number | null = null;

// In-memory set: tracks users who already !absen this broadcast session
const absenSet = new Set<string>();

async function getOrSyncStream(broadcast: any): Promise<number> {
  const stream = await prisma.stream.upsert({
    where: { youtubeVideoId: broadcast.id },
    update: { title: broadcast.title, status: broadcast.status },
    create: {
      youtubeVideoId: broadcast.id,
      title: broadcast.title,
      description: broadcast.description,
      status: broadcast.status,
      startedAt: new Date(broadcast.actualStartTime || new Date()),
    },
  });

  currentStreamId = stream.id;
  return stream.id;
}

client.on("YouTube.BroadcastStarted", async (data: StreamerbotEventPayload<"YouTube.BroadcastStarted">) => {
  console.log("YouTube.BroadcastStarted", data);
  absenSet.clear(); // Reset per broadcast session
  await getOrSyncStream(data.data);
});

client.on("YouTube.*", (data: any) => {
  console.log("YouTube.*", data);
});

client.on("YouTube.NewSubscriber", async ({ event, data }) => {
  console.log("Received event:", event.source, event.type);
  console.log("Event data:", data);

  const tts = await generateSubscriberTts(data.username).catch(() => null);

  broadcastChat({
    type: "subscriber",
    data: {
      username: data.username,
      avatar: data.avatar,
      createdAt: data.createdAt,
      audioBase64: tts?.audioBase64 || null,
      audioDurationMs: tts?.durationMs || null,
    }
  });
});

client.on("YouTube.Message", async (data: any) => {
  if (!data?.data?.user || !data?.data?.broadcast) return;

  const { user, broadcast, message, publishedAt } = data.data;

  const cachedUser = await getOrCreateUser(
    user.id,
    user.name,
    user.profileImageUrl,
    user.isOwner,
    user.isModerator,
  );

  addPoints(user.id);

  broadcastChat({
    type: "chat",
    user: {
      name: cachedUser.name,
      color: cachedUser.tier.color,
      badge: cachedUser.tier.badge,
      points: cachedUser.points,
      profileImageUrl: cachedUser.profileImageUrl,
    },
    content: message,
    publishedAt,
  });

  // --- Command Handling ---
  if (message.startsWith("!")) {
    const command = message.split(" ")[0].toLowerCase();

    if (command === "!login" || command === "!absen") {
      const isFirst = await processDailyLogin(user.id, DAILY_LOGIN_POINTS);
      if (isFirst) {
        broadcastChat({
          type: "chat",
          user: { name: "SYSTEM", color: "#FFD700", badge: "shield_gold", points: 0, profileImageUrl: null },
          content: `@${user.name} berhasil login! +${DAILY_LOGIN_POINTS} points.`,
          publishedAt: new Date().toISOString(),
        });
      }
    }

    if (command === "!tanya") {
      const q = message.split(" ").slice(1).join(" ");
      if (q && cachedUser.points >= COST_TANYA) {
        cachedUser.points -= COST_TANYA;
        aiQueue.add(async () => {
          const reply = await generateRedeemReply(user.id, user.name, q, "tanya");
          broadcastChat({
            type: "chat",
            user: { name: "AI_BOT", color: "#C084FC", badge: "viper", points: 0, profileImageUrl: null },
            content: `@${user.name}: ${reply || "Hmm, aku bingung mau jawab apa."}`,
            publishedAt: new Date().toISOString(),
          });
        });
      } else if (q) {
        broadcastChat({
          type: "chat",
          user: { name: "SYSTEM", color: "#FF4444", badge: "pokeball", points: 0, profileImageUrl: null },
          content: `@${user.name} point tidak cukup untuk !tanya (Butuh ${COST_TANYA} pts).`,
          publishedAt: new Date().toISOString(),
        });
      }
    }

    if (command === "!roast") {
      const target = message.split(" ")[1] || user.name;
      if (cachedUser.points >= COST_ROAST) {
        cachedUser.points -= COST_ROAST;
        aiQueue.add(async () => {
          const reply = await generateRedeemReply(user.id, target, `Roast si ${target}!`, "roast");
          const roastText = reply || "Gak tega aku nge-roast dia...";

          // Broadcast to overlay
          broadcastChat({
            type: "chat",
            user: { name: "AI_ROAST", color: "#FF6B00", badge: "viper", points: 0, profileImageUrl: null },
            content: roastText,
            publishedAt: new Date().toISOString(),
          });

          // Send to YouTube chat
          client.sendMessage("youtube", roastText).catch((err: any) =>
            console.error("[streamerbot] Failed to send roast to YouTube:", err)
          );
        });
      } else {
        broadcastChat({
          type: "chat",
          user: { name: "SYSTEM", color: "#FF4444", badge: "pokeball", points: 0, profileImageUrl: null },
          content: `@${user.name} point tidak cukup untuk !roast (Butuh ${COST_ROAST} pts).`,
          publishedAt: new Date().toISOString(),
        });
      }
    }

    if (command === "!theme") {
      const themeId = message.split(" ")[1]?.toLowerCase().trim();
      if (themeId) {
        const ok = setActiveTheme(themeId);
        if (ok) {
          console.log(`[command] !theme: switched to "${themeId}" by ${user.name}`);
        } else {
          console.log(`[command] !theme: unknown theme "${themeId}" from ${user.name}`);
        }
      }
    }
  }

  if (!currentStreamId) {
    await getOrSyncStream(broadcast);
  }

  if (currentStreamId) {
    persistMessage(currentStreamId, cachedUser.dbId, message, publishedAt).catch(console.error);
  }

  console.log("[chat] " + cachedUser.tier.badge + " | " + user.name + ": " + message);
});

client.on("Obs.StreamingStarted", (data: any) => {
  console.log("[obs] StreamingStarted", data);
});

async function persistMessage(streamId: number, userId: number, message: string, publishedAt: string) {
  await prisma.message.create({
    data: {
      content: message,
      streamId,
      userId,
      publishedAt: new Date(publishedAt),
    },
  });
}

export { client };