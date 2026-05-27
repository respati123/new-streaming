#!/bin/bash

# Cleanup function to gracefully stop both BE and FE on exit
cleanup() {
  echo ""
  echo "Stopping all services..."
  kill $BE_PID $FE_PID 2>/dev/null
  exit 0
}

# Trap Ctrl+C (SIGINT) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "🚀 Starting Backend Service (Port 3001)..."
bun run dev &
BE_PID=$!

# Wait a short moment for backend to initialize
sleep 1.5

echo "🚀 Starting Frontend Service (Port 5173)..."
cd aura-stream-stage && bun run dev &
FE_PID=$!

# Keep script running
wait $BE_PID $FE_PID
