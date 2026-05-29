# Gemini System Prompt & Project Context

## Project Overview
This is a streaming-focused content automation pipeline and backend service. It acts as the backbone for an end-to-end AI video content generation and live stream management system.

## Tech Stack
- **Runtime:** Bun
- **Language:** TypeScript
- **Framework:** Hono (using `@hono/node-server` and `@hono/node-ws` for WebSocket support)
- **Database / ORM:** Prisma
- **Integrations:** `@streamerbot/client` for connecting to Streamer.bot (likely for Twitch/YouTube live event handling).

## Directory Structure
- `src/`
  - `routes/` - Hono route definitions (e.g., `streams.ts`, `users.ts`, `streamerbot.ts`).
  - `services/` - Core business logic and external integrations (e.g., `streamerbot.ts`).
  - `lib/` - Shared utilities and singletons (e.g., Prisma client setup).
- `prisma/` - Prisma schema definitions and migrations.
- `skills/` - Custom agent skills (e.g., `writing_skill.md`) for defining workflows like AI scriptwriting.
- `web/` - Likely contains the frontend application (if applicable).

## Core Workflows & Goals
1. **Automated Content Pipeline:** Generating scripts, mapping scenes, and integrating with Indonesian TTS systems (Omnivoice).
2. **Streaming Integration:** Managing messages, users, and stream metadata via Prisma, while communicating with Streamer.bot over WebSockets.

## Rules for AI Interaction
- **Mandatory Planning Workflow (Strict Rule with PRs):** 
  - **Scope:** Required for all feature development and bug fixes. Minor tasks are exempt.
  - **Step 1 (Discuss & Plan Locally):** ALWAYS discuss the task first. Write down the detailed plan into an `issue.md` file locally.
  - **Step 2 (Wait for Approval):** DO NOT execute code or publish yet. Wait for the user to explicitly command you to proceed.
  - **Step 3 (Publish Issue):** Once approved, use the `gh` CLI autonomously (`gh issue create --title "..." --body-file issue.md`) to publish the issue.
  - **Step 4 (Branching):** Create and switch to a new git branch related to the issue (e.g., `git checkout -b feature/issue-3-queue`).
  - **Step 5 (Execute & Commit):** Execute the code changes and commit them to the new branch.
  - **Step 6 (Pull Request):** Push the branch to GitHub and create a Pull Request using the `gh` CLI (`gh pr create`). Ensure the PR body contains "Fixes #IssueNumber" so the issue auto-closes when merged.
  - **Step 7 (Merge):** Wait for the user to review and merge the Pull Request. Do not merge it yourself unless instructed.
- **Language:** Write code in strict TypeScript. Prefer descriptive variable names over comments.
- **Database:** Always use the existing Prisma client instance from `src/lib/prisma.ts`.
- **API:** Use Hono best practices. Keep route handlers thin; move heavy logic to `src/services/`.
- **Skills:** Refer to the `.agent/skills/` directory when the user requests a specific workflow (like `grill-me`, `to-issues`, etc.).
- **Code Style:** Use modern ES modules syntax, `async/await`, and handle errors gracefully.

## Next Steps / Current Focus
- Solidifying the WebSocket and Streamer.bot event handling.
