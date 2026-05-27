import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const VOICE_ID_USER = process.env.ELEVENLABS_VOICE_ID_USER;

// Validate on startup
if (!ELEVENLABS_API_KEY) {
  console.warn("[elevenlabs] WARNING: ELEVENLABS_API_KEY is not set in .env");
} else {
  console.log(`[elevenlabs] API key loaded: ${ELEVENLABS_API_KEY.slice(0, 8)}...`);
}

if (!VOICE_ID) {
  console.warn("[elevenlabs] WARNING: ELEVENLABS_VOICE_ID is not set in .env");
} else {
  console.log(`[elevenlabs] Voice ID loaded: ${VOICE_ID}`);
}

if (!VOICE_ID_USER) {
  console.warn("[elevenlabs] WARNING: VOICE_ID_USER is not set in .env");
} else {
  console.log(`[elevenlabs] User Voice ID loaded: ${VOICE_ID_USER}`);
}

const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

interface TtsResult {
  audioBase64: string;
  durationMs: number;
}

export interface DialogueTtsResult {
  userAudio: string;
  userDurationMs: number;
  aiAudio: string;
  aiDurationMs: number;
}

/**
 * Generate TTS audio for a donation event using ElevenLabs SDK.
 * Returns base64-encoded MP3 audio and estimated duration in milliseconds.
 */
export async function generateDonationTts(
  donatorName: string,
  amount: number,
  message: string
): Promise<TtsResult | null> {
  if (!ELEVENLABS_API_KEY || !VOICE_ID) {
    console.error("[elevenlabs] Cannot generate TTS: missing API key or Voice ID");
    return null;
  }

  const formattedAmount = new Intl.NumberFormat("id-ID").format(amount);
  const script = buildScript(donatorName, formattedAmount, message);

  console.log(`[elevenlabs] generating TTS for voice ${VOICE_ID}: "${script}"`);

  try {
    const audioStream = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      modelId: "eleven_flash_v2_5",
      text: script,
      outputFormat: "mp3_44100_128",
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        useSpeakerBoost: true,
        speed: 1.0,
      },
    });

    // Collect stream into a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    if (audioBuffer.byteLength === 0) {
      console.error("[elevenlabs] Received empty audio buffer");
      return null;
    }

    const audioBase64 = audioBuffer.toString("base64");

    // Estimate duration: ~110 words/min for Indonesian TTS (more conservative)
    const wordCount = script.split(/\s+/).length;
    const durationMs = Math.max((wordCount / 110) * 60 * 1000, 3000);

    console.log(
      `[elevenlabs] TTS OK: ${audioBuffer.byteLength} bytes, ~${Math.round(durationMs / 1000)}s`
    );

    return { audioBase64, durationMs };
  } catch (error: any) {
    console.error("[elevenlabs] TTS generation failed:");
    console.error("  status:", error?.statusCode ?? error?.status ?? "unknown");
    console.error("  message:", error?.message ?? String(error));
    if (error?.body) {
      console.error("  body:", JSON.stringify(error.body));
    }
    return null;
  }
}

/**
 * Generate TTS audio for an AI dialogue event using ElevenLabs SDK.
 * Generates two separate tracks (user and AI) for better frontend sync.
 */
export async function generateDialogueTts(
  userMessage: string,
  aiMessage: string
): Promise<DialogueTtsResult | null> {
  if (!ELEVENLABS_API_KEY || !VOICE_ID || !VOICE_ID_USER) {
    console.error("[elevenlabs] Cannot generate dialogue TTS: missing API key or Voice ID");
    return null;
  }

  console.log(`[elevenlabs] generating dialogue TTS (sequential)...`);

  try {
    // 1. Generate User Audio
    const userStream = await elevenlabs.textToSpeech.convert(VOICE_ID_USER, {
      modelId: "eleven_flash_v2_5",
      text: userMessage,
      outputFormat: "mp3_44100_128",
      voiceSettings: { stability: 0.5, similarityBoost: 0.75, useSpeakerBoost: true, speed: 1.0 },
    });

    const userChunks: Buffer[] = [];
    for await (const chunk of userStream) {
      userChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const userBuffer = Buffer.concat(userChunks);

    // 2. Generate AI Audio
    const aiStream = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      modelId: "eleven_flash_v2_5",
      text: aiMessage,
      outputFormat: "mp3_44100_128",
      voiceSettings: { stability: 0.5, similarityBoost: 0.75, useSpeakerBoost: true, speed: 1.0 },
    });

    const aiChunks: Buffer[] = [];
    for await (const chunk of aiStream) {
      aiChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const aiBuffer = Buffer.concat(aiChunks);

    if (userBuffer.byteLength === 0 || aiBuffer.byteLength === 0) {
      console.error("[elevenlabs] Received empty audio buffer for one of the dialogue parts");
      return null;
    }

    const userAudio = userBuffer.toString("base64");
    const aiAudio = aiBuffer.toString("base64");

    // Estimate durations
    const userWords = userMessage.split(/\s+/).length;
    const aiWords = aiMessage.split(/\s+/).length;
    
    const userDurationMs = Math.max((userWords / 110) * 60 * 1000, 2000);
    const aiDurationMs = Math.max((aiWords / 110) * 60 * 1000, 2000);

    console.log(
      `[elevenlabs] Sequential Dialogue TTS OK: user=${userBuffer.byteLength} bytes, ai=${aiBuffer.byteLength} bytes`
    );

    return { userAudio, userDurationMs, aiAudio, aiDurationMs };
  } catch (error: any) {
    console.error("[elevenlabs] Sequential Dialogue TTS generation failed:", error?.message);
    return null;
  }
}

/**
 * Generate TTS audio for plain text using ElevenLabs SDK.
 */
export async function generateSimpleTts(
  text: string
): Promise<TtsResult | null> {
  if (!ELEVENLABS_API_KEY || !VOICE_ID) {
    console.error("[elevenlabs] Cannot generate simple TTS: missing API key or Voice ID");
    return null;
  }

  try {
    const audioStream = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      modelId: "eleven_flash_v2_5",
      text: text,
      outputFormat: "mp3_44100_128",
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        useSpeakerBoost: true,
        speed: 1.0,
      },
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);
    if (audioBuffer.byteLength === 0) return null;

    const audioBase64 = audioBuffer.toString("base64");
    const wordCount = text.split(/\s+/).length;
    const durationMs = Math.max((wordCount / 110) * 60 * 1000, 3000);

    return { audioBase64, durationMs };
  } catch (error: any) {
    console.error("[elevenlabs] Simple TTS generation failed:", error?.message);
    return null;
  }
}

/**
 * Ping ElevenLabs to verify connectivity and API key validity.
 * Returns error message string on failure, null on success.
 */
export async function checkElevenLabsConnection(): Promise<{ ok: boolean; error?: string; voices?: number }> {
  if (!ELEVENLABS_API_KEY) {
    return { ok: false, error: "ELEVENLABS_API_KEY not set in .env" };
  }

  try {
    const result = await elevenlabs.voices.getAll();
    return { ok: true, voices: result.voices.length };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message ?? String(error),
    };
  }
}

/**
 * Generate TTS audio for a new subscriber event.
 */
export async function generateSubscriberTts(
  username: string
): Promise<TtsResult | null> {
  if (!ELEVENLABS_API_KEY || !VOICE_ID) {
    console.error("[elevenlabs] Cannot generate Subscriber TTS: missing API key or Voice ID");
    return null;
  }

  const script = `Wuidih! Ada subscriber baru nih! Selamat datang ${username}! Makasih ya udah subscribe!`;

  console.log(`[elevenlabs] generating Subscriber TTS for: "${script}"`);

  try {
    const audioStream = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      modelId: "eleven_flash_v2_5",
      text: script,
      outputFormat: "mp3_44100_128",
      voiceSettings: { stability: 0.5, similarityBoost: 0.75, useSpeakerBoost: true, speed: 1.0 },
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);
    if (audioBuffer.byteLength === 0) return null;

    const audioBase64 = audioBuffer.toString("base64");
    const wordCount = script.split(/\s+/).length;
    const durationMs = Math.max((wordCount / 110) * 60 * 1000, 3000);

    return { audioBase64, durationMs };
  } catch (error: any) {
    console.error("[elevenlabs] Subscriber TTS generation failed:", error?.message);
    return null;
  }
}

/**
 * Generate TTS audio for a !absen check-in event.
 */
export async function generateAbsenTts(
  username: string
): Promise<TtsResult | null> {
  if (!ELEVENLABS_API_KEY || !VOICE_ID) {
    console.error("[elevenlabs] Cannot generate Absen TTS: missing API key or Voice ID");
    return null;
  }

  const script = `${username} hadir!`;

  console.log(`[elevenlabs] generating Absen TTS for: "${script}"`);

  try {
    const audioStream = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      modelId: "eleven_flash_v2_5",
      text: script,
      outputFormat: "mp3_44100_128",
      voiceSettings: { stability: 0.4, similarityBoost: 0.75, useSpeakerBoost: true, speed: 1.1 },
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);
    if (audioBuffer.byteLength === 0) return null;

    const audioBase64 = audioBuffer.toString("base64");
    const wordCount = script.split(/\s+/).length;
    const durationMs = Math.max((wordCount / 110) * 60 * 1000, 1500);

    return { audioBase64, durationMs };
  } catch (error: any) {
    console.error("[elevenlabs] Absen TTS generation failed:", error?.message);
    return null;
  }
}


function buildScript(name: string, amount: string, message: string): string {
  if (message && message.trim()) {
    return `${name} berdonasi Rp ${amount}! ${name} berpesan: ${message}`;
  }
  return `${name} berdonasi Rp ${amount}! Terima kasih ${name}!`;
}
