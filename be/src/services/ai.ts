import prisma from "../lib/prisma";

export async function generateAiReply(
  youtubeId: string,
  donatorName: string,
  donationMessage: string
): Promise<string | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("[ai] Missing OPENROUTER_API_KEY");
    return null;
  }

  try {
    // 1. Resolve User
    const user = youtubeId !== "unknown" ? await prisma.user.findUnique({ where: { youtubeId } }) : null;

    // 2. Fetch 10 Personal Donations (History)
    const personalHistory = await prisma.donation.findMany({
      where: {
        OR: [
          { donatorName: donatorName },
          ...(user ? [{ userId: user.id }] : [])
        ]
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    personalHistory.reverse();

    // 3. Fetch 5 Global Messages (Stream Vibe)
    const globalVibe = await prisma.message.findMany({
      take: 5,
      orderBy: { publishedAt: "desc" },
      include: { user: true },
    });
    globalVibe.reverse();

    const vibeText = globalVibe.map(m => `${m.user.name}: ${m.content}`).join("\n");

    // Format History
    const historyText = personalHistory
      .filter(h => h.message !== donationMessage || h.aiReply !== null)
      .map(h => {
        let text = `- ${donatorName}: ${h.message}`;
        if (h.aiReply) text += `\n- AI: ${h.aiReply}`;
        return text;
      })
      .join("\n");

    const systemPrompt = `[SYSTEM]: Kamu adalah persona AI interaktif di live streaming milik Respati. Jawab dengan gaya bahasa asyik, singkat, dan natural.
Fokus pada user yang sedang chat sekarang.

[VIBE STREAM SAAT INI]:
${vibeText || "Belum ada chat."}

[USER SEKARANG]
Username: ${donatorName}
Youtube ID: ${youtubeId}
Info yang diketahui: ${user?.bio || "Belum ada info khusus."}

[HISTORY CHAT DENGAN USER INI]
${historyText || "Belum ada riwayat."}

Aturan:
- Gunakan [HISTORY] dan [USER SEKARANG] agar jawabanmu personal.
- SANGAT PENTING: Jawaban + Pertanyaan Balasan MAKSIMAL 140 KARAKTER.
- Jangan pakai emoji.`;

    const messagesPayload: any[] = [
      { role: "system", content: systemPrompt },
    ];

    messagesPayload.push({
      role: "user",
      content: `[PESAN BARU]: ${donationMessage}\n\nBeri tanggapan singkat dan 1 pertanyaan balasan!`
    });

    console.log(`[ai] Prompting with personal bio and history for ${donatorName}`);
    console.log("[ai] Final Prompt Payload:", JSON.stringify(messagesPayload, null, 2));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messagesPayload,
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ai] OpenRouter API error:", response.status, errorText);
      return null;
    }

    const data: any = await response.json();
    const aiReply = data.choices[0].message.content.trim();

    // Auto-Learning: Extract facts in the background
    if (user) {
      extractAndSaveUserFacts(user.id, user.bio || "", donationMessage, aiReply).catch(err =>
        console.error("[ai] Auto-learning error:", err)
      );
    }

    return aiReply;
  } catch (error) {
    console.error("[ai] Error generating reply:", error);
    return null;
  }
}

/**
 * Background task to extract new facts and update user bio
 */
async function extractAndSaveUserFacts(userId: number, currentBio: string, userMsg: string, aiMsg: string) {
  try {
    const prompt = `[SYSTEM]: Kamu adalah asisten memori. Tugasmu adalah mengekstrak fakta permanen tentang user dari percakapan berikut.
Fakta permanen meliputi: nama asli, hobi, kesukaan, pekerjaan, atau informasi pribadi lainnya.

[BIO SAAT INI]:
${currentBio || "Belum ada info."}

[PERCAKAPAN TERBARU]:
User: ${userMsg}
AI: ${aiMsg}

[TUGAS]:
Gabungkan fakta baru dari [PERCAKAPAN TERBARU] ke dalam [BIO SAAT INI]. 
- Buat dalam kalimat singkat, padat, dan informatif (comma separated).
- Jangan hapus info lama yang masih relevan.
- Jika tidak ada info baru, kembalikan [BIO SAAT INI] apa adanya.
- MAKSIMAL 200 KARAKTER.
- Hanya kembalikan teks bio-nya saja, jangan ada penjelasan lain.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Use a cheaper/faster model for extraction
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data: any = await response.json();
    const newBio = data.choices?.[0]?.message?.content?.trim();

    if (newBio && newBio !== currentBio && !newBio.includes("AI:")) {
      console.log(`[ai] Learned new facts for user ${userId}: ${newBio}`);
      await prisma.user.update({
        where: { id: userId },
        data: { bio: newBio }
      });
    }
  } catch (err) {
    console.error("[ai] Failed to extract facts:", err);
  }
}

/**
 * AI response for point redeems like !tanya and !roast
 */
export async function generateRedeemReply(
  youtubeId: string,
  userName: string,
  message: string,
  type: "tanya" | "roast"
): Promise<string | null> {
  if (!process.env.OPENROUTER_API_KEY) return null;

  try {
    const user = await prisma.user.findUnique({ where: { youtubeId } });
    const globalVibe = await prisma.message.findMany({
      take: 5,
      orderBy: { publishedAt: "desc" },
      include: { user: true },
    });
    globalVibe.reverse();
    const vibeText = globalVibe.map(m => `${m.user.name}: ${m.content}`).join("\n");

    let instruction = "";
    if (type === "roast") {
      instruction = `Tugas: ROASTING user bernama ${userName} secara asyik, lucu, dan tajam tapi jangan kasar. 
Gunakan info [USER INFO] untuk bahan roasting agar terasa personal.
Jangan pakai emoji. Maksimal 140 karakter.`;
    } else {
      instruction = `Tugas: Jawab pertanyaan dari ${userName} dengan gaya asyik dan membantu.
Jangan pakai emoji. Maksimal 140 karakter.`;
    }

    const systemPrompt = `[SYSTEM]: Kamu adalah persona AI di livestream Respati.
${instruction}

[VIBE STREAM]:
${vibeText}

[USER INFO]:
Nama: ${userName}
Bio/Fakta: ${user?.bio || "Belum ada info khusus."}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.8,
        max_tokens: 100,
      }),
    });

    const data: any = await response.json();
    if (!data.choices || data.choices.length === 0) {
      console.error("[ai] OpenRouter invalid response:", JSON.stringify(data));
      return null;
    }
    const aiReply = data.choices[0].message?.content?.trim() || null;

    if (aiReply && user) {
      // Also try to learn from redeems
      extractAndSaveUserFacts(user.id, user.bio || "", message, aiReply).catch(() => { });
    }

    return aiReply;
  } catch (error) {
    console.error("[ai] Error in generateRedeemReply:", error);
    return null;
  }
}
