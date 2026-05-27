# Goal: Monorepo Restructuring for BE and FE

## Context
The user wants to unify the frontend (`aura-stream-stage`) and the backend (root directory) into "1 folder". Due to the differing architectures (TanStack Start SSR vs Hono Node WebSocket), a Monorepo workspace is the safest and most standard approach.

## Execution Steps
1. **Create Directory Structure**: 
   - Create `apps/` directory at the root.
2. **Move Frontend**: 
   - Rename/Move `aura-stream-stage` to `apps/frontend`.
3. **Move Backend**: 
   - Move backend files (`src`, `prisma`, `package.json`, `tsconfig.json`, `.env`) into `apps/backend`.
4. **Create Root Config**: 
   - Create a root `package.json` with `workspaces: ["apps/*"]`.
   - Add `concurrently` (or native Bun script if possible) to run both `dev` scripts at once.
5. **Reinstall & Verify**: 
   - Remove all old `node_modules`.
   - Run `bun install` from the root.
   - Run `bun run dev` to verify both processes start.
