export const CREATOR_COOKIE = "slate_creator";

export function generateCreatorToken(): string {
  // Prefer crypto when available (Node / modern browsers)
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `slate_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}
