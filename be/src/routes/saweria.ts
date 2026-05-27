import { Hono } from "hono";
import prisma from "../lib/prisma";
import { donationQueue, type DonationType } from "../services/donationQueue";
import { generateAiReply } from "../services/ai";
import { addPoints } from "../lib/userCache";

export const saweriaRoute = new Hono();

interface SaweriaPayload {
  version: string;
  created_at: string;
  id: string;
  type: string;
  amount_raw: number;
  cut: number;
  donator_name: string;
  donator_email: string;
  donator_is_user: boolean;
  message: string;
  etc: { amount_to_display: number };
}

saweriaRoute.post("/webhook", async (c) => {
  const payload: SaweriaPayload = await c.req.json();
  const displayAmount = payload.etc?.amount_to_display || payload.amount_raw;

  let cleanMessage = payload.message || "";
  let extractedYoutubeId: string | null = null;

  const match = cleanMessage.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (match) {
    extractedYoutubeId = match[1];
    cleanMessage = match[2];
  }

  console.log(`[saweria] donation from ${payload.donator_name}: Rp${displayAmount} — ${cleanMessage}`);

  // Determine donation type
  let donationType: DonationType = "tts";
  if (displayAmount < 5000) {
    donationType = "alert_only";
  } else if (displayAmount >= 10000) {
    donationType = "dialogue";
  }

  // Resolve userId + award points
  let resolvedUserId: number | null = null;
  if (extractedYoutubeId) {
    const dbUser = await prisma.user.findUnique({ where: { youtubeId: extractedYoutubeId } });
    if (dbUser) {
      resolvedUserId = dbUser.id;
      const pointsToAdd = Math.floor(displayAmount / 1000) * 100; // 100 points per 1k
      addPoints(extractedYoutubeId, pointsToAdd);
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          points: { increment: pointsToAdd },
          lifetimePoints: { increment: pointsToAdd },
        },
      });
    } else {
      // Create user if not exists
      const newUser = await prisma.user.upsert({
        where: { youtubeId: extractedYoutubeId },
        update: { lastSeen: new Date() },
        create: {
          youtubeId: extractedYoutubeId,
          name: payload.donator_name,
          lastSeen: new Date(),
        },
      });
      resolvedUserId = newUser.id;
    }
  }

  // Persist to DB
  const donation = await prisma.donation.upsert({
    where: { externalId: payload.id },
    update: {},
    create: {
      externalId: payload.id,
      donatorName: payload.donator_name,
      donatorEmail: payload.donator_email,
      amountRaw: displayAmount,
      message: cleanMessage,
      type: "saweria",
      donationType,
      userId: resolvedUserId,
    },
  });

  if (donationType === "dialogue" && cleanMessage.trim().length > 0) {
    (async () => {
      const aiResponse = await generateAiReply(extractedYoutubeId || "unknown", payload.donator_name, cleanMessage);
      
      // Persist AI reply to DB for context/history
      if (aiResponse) {
        await prisma.donation.update({
          where: { id: donation.id },
          data: { aiReply: aiResponse },
        }).catch(err => console.error("[saweria] Failed to save aiReply:", err));
      }

      donationQueue.push({
        id: donation.id,
        donatorName: payload.donator_name,
        amount: displayAmount,
        message: aiResponse || "Terima kasih banyak!",
        userMessage: cleanMessage,
        createdAt: new Date().toISOString(),
        type: "dialogue",
      });
    })();
  } else {
    donationQueue.push({
      id: donation.id,
      donatorName: payload.donator_name,
      amount: displayAmount,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      type: donationType,
    });
  }

  return c.json({ ok: true });
});

saweriaRoute.get("/donations", async (c) => {
  const donations = await prisma.donation.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const total = await prisma.donation.aggregate({ _sum: { amountRaw: true } });
  return c.json({ donations, totalAmount: total._sum.amountRaw || 0, count: donations.length });
});
