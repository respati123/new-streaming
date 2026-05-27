import prisma from "./prisma";
import { getTier, POINTS_PER_MESSAGE, type Tier } from "./points";

export interface CachedUser {
  youtubeId: string;
  name: string;
  profileImageUrl: string | null;
  points: number;
  lifetimePoints: number;
  dbId: number;
  tier: Tier;
  isOwner: boolean;
  isModerator: boolean;
  lastLoginAt: Date | null;
}

const userCache = new Map<string, CachedUser>();

export function getCachedUser(youtubeId: string): CachedUser | undefined {
  return userCache.get(youtubeId);
}

export async function getOrCreateUser(youtubeId: string, name: string, profileImageUrl: string, isOwner: boolean, isModerator: boolean): Promise<CachedUser> {
  const cached = userCache.get(youtubeId);
  if (cached) {
    cached.name = name;
    cached.profileImageUrl = profileImageUrl;
    cached.isOwner = isOwner;
    cached.isModerator = isModerator;
    cached.tier = getTier(cached.points, isOwner, isModerator);
    return cached;
  }

  const dbUser = await prisma.user.upsert({
    where: { youtubeId },
    update: { name, profileImageUrl, lastSeen: new Date() },
    create: { youtubeId, name, profileImageUrl, lastSeen: new Date() },
  });

  const user: CachedUser = {
    youtubeId,
    name,
    profileImageUrl,
    points: dbUser.points,
    lifetimePoints: dbUser.lifetimePoints,
    dbId: dbUser.id,
    tier: getTier(dbUser.lifetimePoints, isOwner, isModerator),
    isOwner,
    isModerator,
    lastLoginAt: dbUser.lastLoginAt,
  };

  userCache.set(youtubeId, user);
  return user;
}

export function addPoints(youtubeId: string, amount: number = POINTS_PER_MESSAGE): void {
  const user = userCache.get(youtubeId);
  if (!user) return;
  user.points += amount;
  user.lifetimePoints += amount;
  user.tier = getTier(user.lifetimePoints, user.isOwner, user.isModerator);
}

/**
 * Handle daily login points.
 * Returns true if points were added, false if already logged in today.
 */
export async function processDailyLogin(youtubeId: string, points: number = 50): Promise<boolean> {
  const user = userCache.get(youtubeId);
  if (!user) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (user.lastLoginAt) {
    const lastLogin = new Date(user.lastLoginAt);
    const lastLoginDay = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());

    if (lastLoginDay.getTime() === today.getTime()) {
      return false; // Already logged in today
    }
  }

  // Update user
  user.points += points;
  user.lifetimePoints += points;
  user.lastLoginAt = now;
  user.tier = getTier(user.lifetimePoints, user.isOwner, user.isModerator);

  // Persist login time immediately (points will be synced by interval)
  await prisma.user.update({
    where: { id: user.dbId },
    data: { lastLoginAt: now }
  });

  return true;
}

export function getAllCachedUsers(): CachedUser[] {
  return Array.from(userCache.values());
}

export async function syncPointsToDb(): Promise<void> {
  const users = Array.from(userCache.values());
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.dbId },
      data: { points: user.points, lifetimePoints: user.lifetimePoints },
    });
  }
}

setInterval(() => { syncPointsToDb().catch(console.error); }, 30_000);