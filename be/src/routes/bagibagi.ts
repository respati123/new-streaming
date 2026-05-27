import { Hono } from "hono";
import prisma from "../lib/prisma";
import { donationQueue, type DonationType } from "../services/donationQueue";
import { generateAiReply } from "../services/ai";
import { addPoints } from "../lib/userCache";

export const bagibagiRoute = new Hono();

interface BagibagiPayload {
  transaction_id: string;
  name: string;
  amount: number;
  message: string;
  mediaShareUrl?: string;
  created_at: string;
}

const POINTS_PER_1000 = 10;

bagibagiRoute.post("/webhook", async (c) => {
  const payload: BagibagiPayload = await c.req.json();
  console.log(`[bagibagi] donation received:`, payload);

  let cleanMessage = payload.message || "";
  let youtubeId: string | null = null;

  // Parse pattern: [youtubeID] message
  const match = cleanMessage.match(/^\[(.*?)\]\s*(.*)$/);
  if (match) {
    youtubeId = match[1];
    cleanMessage = match[2];
  }

  // Determine donation type from amount
  let donationType: DonationType = "tts";
  if (payload.amount < 5000) {
    donationType = "alert_only";
  } else if (payload.amount >= 10000) {
    donationType = "dialogue";
  }

  // Resolve userId if youtubeId is known
  let resolvedUserId: number | null = null;
  let resolvedYoutubeName: string | undefined = undefined;
  let resolvedProfileImageUrl: string | undefined = undefined;
  
  if (youtubeId) {
    const pointsToAdd = Math.floor(payload.amount / 1000) * POINTS_PER_1000;

    const user = await prisma.user.upsert({
      where: { youtubeId },
      update: {
        lastSeen: new Date(),
        points: { increment: pointsToAdd },
        lifetimePoints: { increment: pointsToAdd },
      },
      create: {
        youtubeId,
        name: payload.name,
        points: pointsToAdd,
        lifetimePoints: pointsToAdd,
        lastSeen: new Date(),
      },
    });

    resolvedUserId = user.id;
    resolvedYoutubeName = user.name;
    if (user.profileImageUrl) {
      resolvedProfileImageUrl = user.profileImageUrl;
    }

    if (pointsToAdd > 0) {
      addPoints(youtubeId, pointsToAdd);
    }
  }

  // Persist to DB
  const donation = await prisma.donation.create({
    data: {
      externalId: payload.transaction_id,
      donatorName: payload.name,
      amountRaw: payload.amount,
      message: cleanMessage,
      type: "bagibagi",
      donationType,
      userId: resolvedUserId,
    },
  });

  // Handle Dialogue
  if (donationType === "dialogue" && cleanMessage.trim().length > 0) {
    (async () => {
      const aiResponse = await generateAiReply(youtubeId || "unknown", payload.name, cleanMessage);

      // Persist AI reply to DB for context/history
      if (aiResponse) {
        await prisma.donation.update({
          where: { id: donation.id },
          data: { aiReply: aiResponse },
        }).catch(err => console.error("[bagibagi] Failed to save aiReply:", err));
      }

      donationQueue.push({
        id: donation.id,
        donatorName: payload.name,
        youtubeName: resolvedYoutubeName,
        profileImageUrl: resolvedProfileImageUrl,
        amount: payload.amount,
        message: aiResponse || "Terima kasih banyak!",
        userMessage: cleanMessage,
        createdAt: new Date().toISOString(),
        type: "dialogue",
      });
    })();
  } else {
    donationQueue.push({
      id: donation.id,
      donatorName: payload.name,
      youtubeName: resolvedYoutubeName,
      profileImageUrl: resolvedProfileImageUrl,
      amount: payload.amount,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      type: donationType,
    });
  }

  return c.json({ ok: true });
});
