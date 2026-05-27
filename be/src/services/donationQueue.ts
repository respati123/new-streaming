import { broadcastChat } from "../lib/ws";
import prisma from "../lib/prisma";
import { generateDonationTts, generateDialogueTts, generateSimpleTts } from "./elevenlabs";

export type DonationType = "alert_only" | "tts" | "dialogue";

interface QueuedDonation {
  id: number;
  donatorName: string;
  amount: number;
  message: string;
  createdAt: string;
  type?: DonationType;
  isAiReply?: boolean;
  userMessage?: string;
  originalDonatorName?: string;
  skipTts?: boolean;
  youtubeName?: string;
  profileImageUrl?: string;
}

class DonationQueue {
  private queue: QueuedDonation[] = [];
  private isProcessing: boolean = false;

  public push(donation: QueuedDonation) {
    this.queue.push(donation);
    this.processNext();
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const donation = this.queue.shift()!;

    try {
      console.log(`[donationQueue] Processing ${donation.id} (type: ${donation.type || "tts"})`);

      // 1. Generate TTS
      let tts: any;
      let dialogueTts: any = null;

      if (donation.type === "alert_only" || donation.skipTts) {
        tts = null;
      } else if (donation.type === "dialogue" && donation.userMessage && donation.message) {
        // Dialogue TTS: Separate User and AI tracks
        dialogueTts = await generateDialogueTts(donation.userMessage, donation.message);
        tts = null;
      } else if (donation.isAiReply) {
        tts = await generateSimpleTts(donation.message);
      } else {
        // Normal TTS
        tts = await generateDonationTts(donation.donatorName, donation.amount, donation.message);
      }

      // 2. Broadcast to frontend
      broadcastChat({
        type: "donation",
        id: donation.id,
        donatorName: donation.donatorName,
        youtubeName: donation.youtubeName,
        profileImageUrl: donation.profileImageUrl,
        amount: donation.amount,
        message: donation.message,
        createdAt: donation.createdAt,
        // Standard TTS fields
        audioBase64: tts?.audioBase64 ?? null,
        audioDurationMs: tts?.durationMs ?? null,
        // New Dialogue-specific fields
        userAudioBase64: dialogueTts?.userAudio ?? null,
        userAudioDurationMs: dialogueTts?.userDurationMs ?? null,
        aiAudioBase64: dialogueTts?.aiAudio ?? null,
        aiAudioDurationMs: dialogueTts?.aiDurationMs ?? null,
        
        isAiReply: donation.isAiReply || donation.type === "dialogue",
        userMessage: donation.userMessage,
        originalDonatorName: donation.originalDonatorName || donation.donatorName,
        donationType: donation.type || "tts",
      });

      // 3. Mark as shown in DB (fire-and-forget)
      prisma.donation.update({
        where: { id: donation.id },
        data: { isShown: true },
      }).catch((err) => console.error("[donationQueue] Failed to set isShown:", err));

      // 4. Calculate delay
      const bufferMs = 3000;
      let delayMs: number;

      if (dialogueTts) {
        delayMs = dialogueTts.userDurationMs + dialogueTts.aiDurationMs + bufferMs;
      } else if (tts?.durationMs) {
        delayMs = tts.durationMs + bufferMs;
      } else {
        delayMs = Math.min(4000 + (donation.message?.length || 0) * 40 + bufferMs, 13000);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));

    } catch (error) {
      console.error("[donationQueue] Error processing donation:", error);
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }
}

export const donationQueue = new DonationQueue();
