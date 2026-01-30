// utils/aiRateLimit.ts

const LIMITS = {
  free: 10,
  pro: 100,
  premium: -1, // unlimited
};

export function checkAndIncrementAICount(
  userId: string,
  tier: "free" | "pro" | "premium" = "free"
): boolean {
  const limit = LIMITS[tier];

  // Unlimited for premium
  if (limit === -1) return true;

  const today = new Date().toISOString().slice(0, 10); // e.g., "2025-11-14"
  const key = `ai_calls_${userId}_${today}`;
  const current = parseInt(localStorage.getItem(key) || "0", 10);

  if (current >= limit) {
    return false;
  }

  localStorage.setItem(key, (current + 1).toString());
  return true;
}

export function getRemainingAICount(
  userId: string,
  tier: "free" | "pro" | "premium" = "free"
): number {
  const limit = LIMITS[tier];

  // Unlimited for premium
  if (limit === -1) return 999;

  const today = new Date().toISOString().slice(0, 10);
  const key = `ai_calls_${userId}_${today}`;
  const current = parseInt(localStorage.getItem(key) || "0", 10);
  return Math.max(0, limit - current);
}
