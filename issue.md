# Implement AI Queueing System for Chat Commands

## Context
When viewers use chat commands like `!tanya` or `!roast`, the backend makes synchronous requests to the OpenAI API via `generateRedeemReply`. If multiple viewers use these commands simultaneously, it causes concurrent API requests, which can lead to rate limits (429 errors) and server lag.

## Implementation Steps

### 1. Create the Queue Service
Create `be/src/services/aiQueue.ts`:
- Build a standard class-based Async Queue (`AIQueue`).
- Maintain an internal array of tasks.
- Implement a `processNext()` loop that runs tasks sequentially.
- Add a 1000ms timeout between tasks to respect OpenAI rate limits.

### 2. Integrate into Streamer.bot Events
In `be/src/services/streamerbot.ts`:
- Import `aiQueue`.
- Wrap the `generateRedeemReply` and `broadcastChat` logic for `!tanya` inside `aiQueue.add(...)`.
- Wrap the `generateRedeemReply`, `broadcastChat`, and `client.sendMessage` logic for `!roast` inside `aiQueue.add(...)`.
- Ensure points are still deducted *before* entering the queue so users can't spam bypass the point check.

## Verification
- Spam `!tanya` in the chat.
- Check the console to verify that the AI replies are generated sequentially rather than all at once.
