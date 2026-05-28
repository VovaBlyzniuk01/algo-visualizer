const GLOBAL_PREVIEW_SLOWDOWN = 1.35;

export const getCardDelay = (base = 120) =>
  Math.max(40, Math.round(base * GLOBAL_PREVIEW_SLOWDOWN));
