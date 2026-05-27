import prisma from "./prisma";

export interface Tier {
  name: string;
  badge: string;
  color: string;
  minPoints: number;
}

export const OWNER_TIER: Tier = { name: "owner", badge: "shield_futuristic", color: "#FF4444", minPoints: -1 };
export const MODERATOR_TIER: Tier = { name: "moderator", badge: "shield_gold", color: "#44FF44", minPoints: -1 };

// In-memory cache for dynamic tiers loaded from DB (descending order of minPoints)
export let DYNAMIC_TIERS: Tier[] = [];

export async function initializeTiers(): Promise<void> {
  try {
    let dbTiers = await prisma.tier.findMany({
      orderBy: { minPoints: "desc" },
    });

    if (dbTiers.length === 0) {
      console.log("[points] Tiers table is empty, seeding default tiers...");
      const defaultTiers = [
        { name: "shield_futuristic", badge: "shield_futuristic", color: "#C084FC", minPoints: 10000 },
        { name: "viper",             badge: "viper",             color: "#FFD700", minPoints: 5000 },
        { name: "shield_gold",       badge: "shield_gold",       color: "#FF6B00", minPoints: 2000 },
        { name: "shield_blue",       badge: "shield_blue",       color: "#00AAFF", minPoints: 500 },
        { name: "pokeball",          badge: "pokeball",          color: "#FFFFFF", minPoints: 0 },
      ];

      await prisma.tier.createMany({
        data: defaultTiers.map(t => ({
          name: t.name,
          badge: t.badge,
          color: t.color,
          minPoints: t.minPoints,
        })),
      });

      dbTiers = await prisma.tier.findMany({
        orderBy: { minPoints: "desc" },
      });
    }

    DYNAMIC_TIERS = dbTiers.map(t => ({
      name: t.name,
      badge: t.badge,
      color: t.color,
      minPoints: t.minPoints,
    }));
    console.log(`[points] Tiers initialized successfully: ${DYNAMIC_TIERS.length} tiers loaded`);
  } catch (error) {
    console.error("[points] Failed to initialize tiers from database:", error);
    // Fallback in case of DB failure to avoid crashing the server
    DYNAMIC_TIERS = [
      { name: "shield_futuristic", badge: "shield_futuristic", color: "#C084FC", minPoints: 10000 },
      { name: "viper",             badge: "viper",             color: "#FFD700", minPoints: 5000 },
      { name: "shield_gold",       badge: "shield_gold",       color: "#FF6B00", minPoints: 2000 },
      { name: "shield_blue",       badge: "shield_blue",       color: "#00AAFF", minPoints: 500 },
      { name: "pokeball",          badge: "pokeball",          color: "#FFFFFF", minPoints: 0 },
    ];
  }
}

export function getTier(points: number, isOwner = false, isModerator = false): Tier {
  if (isOwner) return OWNER_TIER;
  if (isModerator) return MODERATOR_TIER;

  for (const tier of DYNAMIC_TIERS) {
    if (points >= tier.minPoints) return tier;
  }

  // Fallback to the lowest dynamic tier or pokeball default
  return DYNAMIC_TIERS[DYNAMIC_TIERS.length - 1] || { name: "pokeball", badge: "pokeball", color: "#FFFFFF", minPoints: 0 };
}

export const POINTS_PER_MESSAGE = 2;
export const DAILY_LOGIN_POINTS = 100;
export const POINTS_PER_1K_DONATION = 100;

export const COST_TANYA = 250;
export const COST_ROAST = 500;