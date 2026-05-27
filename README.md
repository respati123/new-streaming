# Aura Stream Stage (AI Streaming Pipeline)

An end-to-end AI video content generation and live stream management system. This project provides a real-time WebSocket backend and a dynamic frontend overlay for platforms like YouTube and Twitch. It features AI-powered dialogues, Text-to-Speech (TTS) integrations, and fully customizable chat & donation widgets.

## 🚀 Tech Stack

This project is structured as a **Bun Monorepo** (using Workspaces).
- **Backend (`/be`)**: Bun, Hono (Node Server & WebSockets), Prisma (SQLite), ElevenLabs, OpenAI/OpenRouter.
- **Frontend (`/fe`)**: React, Vite, Tailwind CSS (v4), TanStack Start & Router.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Bun](https://bun.sh/) (v1.x or higher)
- Git

You will also need the following API Keys:
- **ElevenLabs API Key** (for Text-to-Speech)
- **OpenRouter / OpenAI API Key** (for AI dialogue generation)

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/respati123/new-streaming.git
   cd new-streaming
   ```

2. **Install all dependencies**
   Because this is a monorepo, running `bun install` at the root will automatically install packages for both the backend and frontend.
   ```bash
   bun install
   ```

3. **Environment Configuration**
   Navigate to the backend folder and duplicate the example environment file:
   ```bash
   cp be/.env.example be/.env
   ```
   Open `be/.env` and fill in your API keys (ElevenLabs, OpenRouter, etc.).

4. **Database Setup**
   Initialize the SQLite database and generate the Prisma Client:
   ```bash
   cd be
   bunx prisma db push
   bunx prisma generate
   cd ..
   ```

## 🏃‍♂️ Running the Project

To start both the Backend (Hono) and Frontend (Vite) simultaneously, run the following command from the **root directory**:

```bash
bun run dev
```

- **Frontend Dashboard / Overlay**: `http://localhost:5173`
- **Backend API & WebSockets**: `http://localhost:3001`
- **Database Studio**: To view the database UI, run `bun run --cwd be db:studio`

## 📁 Project Structure

```text
new-streaming/
├── package.json       # Root workspace config (runs dev scripts)
├── be/                # BACKEND
│   ├── prisma/        # Database schema and SQLite file
│   ├── src/           # Hono routes, WebSocket logic, AI services
│   └── .env           # Backend secrets
└── fe/                # FRONTEND (aura-stream-stage)
    ├── src/           # React components, UI widgets, TanStack router
    └── public/        # Static assets, sounds, images
```

## 🤖 Core Features

- **Donation Handling**: Automatically parses incoming Saweria/BagiBagi donations, associates them with users, and awards points.
- **AI Dialogue Generator**: If a donation exceeds a certain tier, the AI generates a customized, in-character response and converts it into voice via ElevenLabs.
- **Dynamic Overlays**: Provides URLs (like `/overlay`) to be imported into OBS as Browser Sources. Displays chat widgets, alerts, and active AI character conversations.
