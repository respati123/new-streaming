import { Hono } from "hono";
import prisma from "../lib/prisma";
import { broadcastChat } from "../lib/ws";
import { donationQueue, type DonationType } from "../services/donationQueue";
import { generateAiReply } from "../services/ai";
import { getTier } from "../lib/points";
import { setActiveTheme } from "./theme";
import { generateSubscriberTts } from "../services/elevenlabs";

export const testRoute = new Hono();

// POST /api/test/chat — Send a chat message via WebSocket
testRoute.post("/chat", async (c) => {
  const body = await c.req.json();
  const { userId, name, message, profileImageUrl, isOwner, isModerator, points } = body;

  if (!message) return c.json({ ok: false, error: "field 'message' wajib" }, 400);

  const displayName = name || "Anon";

  // Upsert user
  const fakeUserId = userId || `test-${Date.now()}`;
  const userPoints = points !== undefined ? Number(points) : 0;
  const user = await prisma.user.upsert({
    where: { youtubeId: fakeUserId },
    update: { 
      name: displayName, 
      lastSeen: new Date(), 
      ...(points !== undefined ? { points: userPoints, lifetimePoints: userPoints } : {})
    },
    create: { 
      youtubeId: fakeUserId, 
      name: displayName, 
      points: userPoints, 
      lifetimePoints: userPoints, 
      lastSeen: new Date() 
    },
  });

  // Find or create active stream
  let stream = await prisma.stream.findFirst({ where: { status: "live" } });
  if (!stream) {
    stream = await prisma.stream.create({
      data: { youtubeVideoId: `test-${Date.now()}`, title: "Test Stream", status: "live", startedAt: new Date() },
    });
  }

  // Save message
  const savedMessage = await prisma.message.create({
    data: { content: message, userId: user.id, streamId: stream.id, publishedAt: new Date() },
  });

  // Determine tier
  const tier = getTier(user.lifetimePoints);

  // Broadcast via WebSocket
  broadcastChat({
    type: "chat",
    user: {
      name: user.name,
      color: tier.color,
      badge: isModerator ? "shield_gold" : isOwner ? "shield_futuristic" : tier.badge,
      points: user.points,
      profileImageUrl: profileImageUrl || null,
    },
    content: message,
    publishedAt: savedMessage.publishedAt.toISOString(),
  });

  return c.json({ ok: true, user: user.name, tier: tier.name });
});

// POST /api/test/chat/burst — Send multiple chat messages with delay
testRoute.post("/chat/burst", async (c) => {
  const body = await c.req.json();
  const { delay = 300, messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ ok: false, error: "field 'messages' harus array non-empty" }, 400);
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (i > 0) await new Promise((r) => setTimeout(r, delay));

    const displayName = msg.name || "Anon";
    const fakeUserId = msg.userId || `test-${Date.now()}-${i}`;

    const user = await prisma.user.upsert({
      where: { youtubeId: fakeUserId },
      update: { name: displayName, lastSeen: new Date() },
      create: { youtubeId: fakeUserId, name: displayName, lastSeen: new Date() },
    });

    let stream = await prisma.stream.findFirst({ where: { status: "live" } });
    if (!stream) {
      stream = await prisma.stream.create({
        data: { youtubeVideoId: `test-${Date.now()}`, title: "Test Stream", status: "live", startedAt: new Date() },
      });
    }

    const savedMessage = await prisma.message.create({
      data: { content: msg.message, userId: user.id, streamId: stream.id, publishedAt: new Date() },
    });

    const tier = getTier(user.lifetimePoints);
    broadcastChat({
      type: "chat",
      user: {
        name: user.name,
        color: tier.color,
        badge: msg.isModerator ? "shield_gold" : msg.isOwner ? "shield_futuristic" : tier.badge,
        points: user.points,
        profileImageUrl: msg.profileImageUrl || null,
      },
      content: msg.message,
      publishedAt: savedMessage.publishedAt.toISOString(),
    });
  }

  return c.json({
    ok: true,
    sent: messages.length,
    messages: messages.map((m: any) => `${m.name || "Anon"}: ${m.message}`),
  });
});

// POST /api/test/donation — Trigger donation alert with new rules
testRoute.post("/donation", async (c) => {
  const body = await c.req.json();
  const { donatorName = "TestDonator", amount = 10000, message = "Halo bang!" } = body;

  // Determine donation type before DB insert
  let donationType: DonationType = "tts";
  if (amount < 5000) {
    donationType = "alert_only";
  } else if (amount >= 10000) {
    donationType = "dialogue";
  }

  const donation = await prisma.donation.create({
    data: {
      externalId: `test-${Date.now()}`,
      donatorName,
      amountRaw: amount,
      message,
      type: "test",
      donationType,
    },
  });

  if (donationType === "dialogue") {
    (async () => {
      const aiResponse = await generateAiReply("test-user", donatorName, message);
      donationQueue.push({
        id: donation.id,
        donatorName,
        amount,
        message: aiResponse || "AI busy but hello!",
        userMessage: message,
        createdAt: new Date().toISOString(),
        type: "dialogue",
      });
    })();
  } else {
    donationQueue.push({
      id: donation.id,
      donatorName,
      amount,
      message,
      createdAt: new Date().toISOString(),
      type: donationType,
    });
  }

  return c.json({ ok: true, donationType, amount });
});


// POST /api/test/ai-dialogue — Trigger AI dialogue box via WebSocket
testRoute.post("/ai-dialogue", async (c) => {
  const body = await c.req.json();
  const { name = "Test User", message = "Halo Respati!", skipTts = false } = body;

  const aiResponse = await generateAiReply("test-user", name, message);
  if (!aiResponse) {
    return c.json({ ok: false, error: "Gagal generate AI response" }, 500);
  }

  donationQueue.push({
    id: Date.now(),
    donatorName: "AI Respati",
    amount: 0,
    message: aiResponse,
    userMessage: message,
    originalDonatorName: name,
    createdAt: new Date().toISOString(),
    isAiReply: true,
    skipTts,
  });

  return c.json({ ok: true, userMessage: message, aiResponse });
});

// POST /api/test/subscriber — Trigger single subscriber alert
testRoute.post("/subscriber", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { username = "TestSubscriber" } = body;

  const tts = await generateSubscriberTts(username).catch(() => null);

  broadcastChat({
    type: "subscriber",
    data: {
      username,
      avatar: null,
      createdAt: new Date().toISOString(),
      audioBase64: tts?.audioBase64 || null,
      audioDurationMs: tts?.durationMs || null,
    },
  });

  return c.json({ ok: true, username });
});

// POST /api/test/absen — Trigger single absen alert
testRoute.post("/absen", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { username = "TestUser", avatar = null, points = 0 } = body;

  broadcastChat({
    type: "absen",
    data: { username, avatar, points },
  });

  return c.json({ ok: true, username, points });
});

// POST /api/test/absen/stack — Trigger 5 absen alerts with delay to test stacking
testRoute.post("/absen/stack", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { delay = 600 } = body; // ms between each alert

  const fakeUsers = [
    { username: "Budi123",    avatar: null, points: 50 },
    { username: "SitiGaming", avatar: null, points: 0  },
    { username: "JokoDev",    avatar: null, points: 0  },
    { username: "Ani_Stream", avatar: null, points: 50 },
    { username: "RezaXYZ",    avatar: null, points: 0  },
  ];

  (async () => {
    for (const user of fakeUsers) {
      broadcastChat({ type: "absen", data: user });
      await new Promise((r) => setTimeout(r, delay));
    }
  })();

  return c.json({ ok: true, sent: fakeUsers.length, delay, users: fakeUsers.map(u => u.username) });
});

// POST /api/test/absen/chaos — Chaos simulation (20 users fast)
testRoute.post("/absen/chaos", async (c) => {
  const users = Array.from({ length: 20 }).map((_, i) => ({
    username: `Viewer_${i + 1}`,
    avatar: null,
    points: Math.random() > 0.7 ? 50 : 0
  }));

  (async () => {
    for (const user of users) {
      broadcastChat({ type: "absen", data: user });
      // Delay acak antara 100ms - 400ms biar kayak chat beneran
      await new Promise((r) => setTimeout(r, 100 + Math.random() * 300));
    }
  })();

  return c.json({ ok: true, note: "Chaos mode engaged! Sending 20 absens fast." });
});

// POST /api/test/chat/chaos — Chat chaos simulation (20 messages with varying lengths)
testRoute.post("/chat/chaos", async (c) => {
  const viewers = [
    { name: "Andi_Gaming", points: 150, badge: "Pokeball", color: "#9ca3af" },
    { name: "BudiSlayer", points: 2500, badge: "Shield Gold", color: "#eab308" },
    { name: "Citra_Chutes", points: 5500, badge: "Viper", color: "#22c55e" },
    { name: "DewiXP", points: 12000, badge: "VIP", color: "#a855f7" },
    { name: "EkoPurnama", points: 0, badge: "Pokeball", color: "#9ca3af" },
    { name: "Fajar_Mod", points: 1000, badge: "Mod", color: "#3b82f6" },
    { name: "Gita_Pratama", points: 6000, badge: "Viper", color: "#22c55e" },
    { name: "Hendra_G", points: 50, badge: "Pokeball", color: "#9ca3af" },
    { name: "IndahSari", points: 15000, badge: "VIP", color: "#a855f7" },
    { name: "Joko_Widodo", points: 0, badge: "Pokeball", color: "#9ca3af" },
    { name: "Kiki_Lover", points: 300, badge: "Pokeball", color: "#9ca3af" },
    { name: "Lani_Cute", points: 2100, badge: "Shield Gold", color: "#eab308" },
    { name: "Mamat_Racing", points: 500, badge: "Pokeball", color: "#9ca3af" },
    { name: "Novi_Z", points: 7000, badge: "Viper", color: "#22c55e" },
    { name: "Oki_Doki", points: 100, badge: "Pokeball", color: "#9ca3af" },
    { name: "Putra_Petir", points: 11000, badge: "VIP", color: "#a855f7" },
    { name: "Qori_Q", points: 0, badge: "Pokeball", color: "#9ca3af" },
    { name: "Rian_Gamer", points: 1800, badge: "Shield Gold", color: "#eab308" },
    { name: "Siti_Aminah", points: 8000, badge: "Viper", color: "#22c55e" },
    { name: "Taufik_H", points: 12000, badge: "VIP", color: "#a855f7" }
  ];

  const messages = [
    "Halo bang! Selamat sore!",
    "Gokil banget stream-nya hari ini 🔥🔥🔥",
    "Wkwkwk kocak parah sih itu tadi pas kalah",
    "Bang, spill spesifikasi PC-nya dong!",
    "Ini pesan yang sangat panjang sekali untuk menguji apakah pembungkusan teks (text wrapping) pada gelembung percakapan (speech bubble) di theme cyberpunk maupun retro berfungsi dengan sangat baik dan tidak merusak tata letak (layout) atau meluber keluar dari batas bingkai 9-slice yang sudah kita pasang tadi. Semoga aman!",
    "GG WP!",
    "Lanjutkan bang, jangan kasih kendor!",
    "Sawer dong guys biar rame!",
    "Absen dulu dari Jakarta hadir!",
    "Coba main game horor dong next stream",
    "HALO HALO HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM HALO SPAM",
    "Mantap kali layatnya keren abis",
    "Poin saya sisa berapa ya bang?",
    "Roast saya dong bang, nama saya Ucup",
    "Ini juga contoh copypasta super panjang: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Wih dapet badge baru nih!",
    "Semangat terus streamingnya yaaa, moga makin sukses!",
    "Hype banget nih chatnya rame bener",
    "Keren abis bingkai chatnya!",
    "Spam emoji 👾🎮👾🎮👾🎮👾🎮👾🎮👾🎮👾🎮👾🎮👾🎮👾🎮👾🎮👾"
  ];

  (async () => {
    try {
      let stream = await prisma.stream.findFirst({ where: { status: "live" } });
      if (!stream) {
        stream = await prisma.stream.create({
          data: { youtubeVideoId: `test-${Date.now()}`, title: "Test Stream", status: "live", startedAt: new Date() },
        });
      }

      for (let i = 0; i < 20; i++) {
        const viewer = viewers[i % viewers.length];
        const message = messages[i % messages.length];

        // Background save to DB
        (async () => {
          try {
            const user = await prisma.user.upsert({
              where: { youtubeId: `test-${viewer.name}` },
              update: { name: viewer.name, lastSeen: new Date() },
              create: { youtubeId: `test-${viewer.name}`, name: viewer.name, points: viewer.points, lifetimePoints: viewer.points, lastSeen: new Date() },
            });

            await prisma.message.create({
              data: { content: message, userId: user.id, streamId: stream!.id, publishedAt: new Date() },
            });
          } catch (dbErr) {
            console.error("[chat/chaos] DB Save Error:", dbErr);
          }
        })();

        // Broadcast immediately
        broadcastChat({
          type: "chat",
          user: {
            name: viewer.name,
            color: viewer.color,
            badge: viewer.badge as any,
            points: viewer.points,
            profileImageUrl: null,
          },
          content: message,
          publishedAt: new Date().toISOString(),
        });

        // Delay between 100ms and 400ms
        await new Promise((r) => setTimeout(r, 100 + Math.random() * 300));
      }
    } catch (err) {
      console.error("[chat/chaos] Chaos loop error:", err);
    }
  })();

  return c.json({ ok: true, note: "Engaged 20 chat messages chaos simulation." });
});

// POST /api/test/transition — Trigger transition overlay
testRoute.post("/transition", async (c) => {
  const body = await c.req.json();
  const { phase } = body;

  if (phase !== "start" && phase !== "end") {
    return c.json({ ok: false, error: "phase harus 'start' atau 'end'" }, 400);
  }

  broadcastChat({ type: "transition", phase });
  return c.json({ ok: true, phase });
});

// POST /api/test/lightning — Trigger lightning flash overlay
testRoute.post("/lightning", async (c) => {
  const body = await c.req.json();
  const { amount = 100000, donatorName = "TestDonator", message = "Mega donation!" } = body;

  const donation = await prisma.donation.create({
    data: {
      externalId: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      donatorName,
      amountRaw: amount,
      message,
      type: "donation",
    },
  });

  donationQueue.push({
    id: donation.id,
    donatorName,
    amount,
    message,
    createdAt: donation.createdAt.toISOString(),
    skipTts: true,
  });

  return c.json({ ok: true, note: "Lightning triggers on amount >= 50,000", amount });
});

// POST /api/test/tiers — Send one message from each tier user to preview badges
testRoute.post("/tiers", async (c) => {
  const tierUsers = [
    { youtubeId: "test-pokeball",     name: "NovicePlayer",  points: 0,     tier: "Pokeball (0 pts)" },
    { youtubeId: "test-shield-blue",  name: "BlueKnight",    points: 500,   tier: "Shield Blue (500 pts)" },
    { youtubeId: "test-shield-gold",  name: "GoldGuardian",  points: 2000,  tier: "Shield Gold (2000 pts)" },
    { youtubeId: "test-viper",        name: "ViperStrike",   points: 5000,  tier: "Viper (5000 pts)" },
    { youtubeId: "test-futuristic",   name: "FuturistX",     points: 10000, tier: "Shield Futuristic (10k pts)" },
  ];

  let stream = await prisma.stream.findFirst({ where: { status: "live" } });
  if (!stream) {
    stream = await prisma.stream.create({
      data: { youtubeVideoId: `test-${Date.now()}`, title: "Test Stream", status: "live", startedAt: new Date() },
    });
  }

  const results = [];

  for (const tu of tierUsers) {
    const user = await prisma.user.upsert({
      where: { youtubeId: tu.youtubeId },
      update: { name: tu.name, points: tu.points, lifetimePoints: tu.points, lastSeen: new Date() },
      create: { youtubeId: tu.youtubeId, name: tu.name, points: tu.points, lifetimePoints: tu.points, lastSeen: new Date() },
    });

    await prisma.message.create({
      data: { content: `Hello! I'm tier ${tu.tier}`, userId: user.id, streamId: stream.id, publishedAt: new Date() },
    });

    const tier = getTier(user.lifetimePoints);
    broadcastChat({
      type: "chat",
      user: {
        name: user.name,
        color: tier.color,
        badge: tier.badge,
        points: user.points,
        profileImageUrl: null,
      },
      content: `Hello! I'm tier ${tu.tier}`,
      publishedAt: new Date().toISOString(),
    });

    results.push({ name: user.name, points: user.points, badge: tier.badge, color: tier.color });
    await new Promise((r) => setTimeout(r, 400));
  }

  return c.json({ ok: true, sent: results });
});

// POST /api/test/reset — Clear all test data
testRoute.post("/reset", async (c) => {
  await prisma.donation.deleteMany();
  await prisma.message.deleteMany();
  await prisma.stream.deleteMany();
  await prisma.user.deleteMany();
  return c.json({ ok: true, message: "All test data cleared" });
});

import { COST_TANYA, COST_ROAST } from "../lib/points";
import { generateRedeemReply } from "../services/ai";

// POST /api/test/redeem/points — Add/Set points for a test user
testRoute.post("/redeem/points", async (c) => {
  const { youtubeId = "test-user", amount = 1000 } = await c.req.json();
  const user = await prisma.user.upsert({
    where: { youtubeId },
    update: { points: { increment: amount }, lifetimePoints: { increment: amount } },
    create: { youtubeId, name: "Test User", points: amount, lifetimePoints: amount, lastSeen: new Date() },
  });
  return c.json({ ok: true, name: user.name, points: user.points });
});

// POST /api/test/redeem/tanya — Simulate !tanya command
testRoute.post("/redeem/tanya", async (c) => {
  const { youtubeId = "test-user", question = "Apa itu AI?" } = await c.req.json();
  const user = await prisma.user.findUnique({ where: { youtubeId } });
  if (!user || user.points < COST_TANYA) return c.json({ ok: false, error: "Poin tidak cukup atau user tidak ada" }, 400);

  await prisma.user.update({ where: { youtubeId }, data: { points: { decrement: COST_TANYA } } });
  const reply = await generateRedeemReply(youtubeId, user.name, question, "tanya");

  broadcastChat({
    type: "chat",
    user: { name: "AI_BOT", color: "#C084FC", badge: "viper", points: 0, profileImageUrl: null },
    content: `@${user.name}: ${reply}`,
    publishedAt: new Date().toISOString(),
  });

  return c.json({ ok: true, reply });
});

// POST /api/test/redeem/roast — Simulate !roast command
testRoute.post("/redeem/roast", async (c) => {
  const { youtubeId = "test-user", target = "respati" } = await c.req.json();
  const user = await prisma.user.findUnique({ where: { youtubeId } });
  if (!user || user.points < COST_ROAST) return c.json({ ok: false, error: "Poin tidak cukup" }, 400);

  await prisma.user.update({ where: { youtubeId }, data: { points: { decrement: COST_ROAST } } });
  const reply = await generateRedeemReply(youtubeId, target, `Roast si ${target}`, "roast");

  broadcastChat({
    type: "chat",
    user: { name: "AI_ROAST", color: "#FF6B00", badge: "viper", points: 0, profileImageUrl: null },
    content: reply || "Gak tega nge-roast dia.",
    publishedAt: new Date().toISOString(),
  });

  return c.json({ ok: true, reply });
});
