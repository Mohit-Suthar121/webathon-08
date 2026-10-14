const RATE_LIMIT_PREFIX = "reliefhub_ratelimit_";
const MAX_REQUESTS_PER_HOUR = 3;
const ONE_HOUR_MS = 60 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  message?: string;
}

export function checkPhoneRateLimit(phone: string): RateLimitResult {
  if (typeof window === "undefined") return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR };
  
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  if (!cleanPhone || cleanPhone.length < 5) {
    return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR };
  }

  const key = `${RATE_LIMIT_PREFIX}${cleanPhone}`;
  const now = Date.now();

  try {
    const raw = localStorage.getItem(key);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];

    // Filter out timestamps older than 1 hour
    const recent = timestamps.filter((t) => now - t < ONE_HOUR_MS);

    if (recent.length >= MAX_REQUESTS_PER_HOUR) {
      const oldest = Math.min(...recent);
      const waitMinutes = Math.ceil((ONE_HOUR_MS - (now - oldest)) / 60000);
      return {
        allowed: false,
        remaining: 0,
        message: `Emergency rate limit active: Maximum ${MAX_REQUESTS_PER_HOUR} requests per hour for this phone number. Please wait ~${waitMinutes} min or call emergency dispatch directly at 112.`,
      };
    }

    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_HOUR - recent.length,
    };
  } catch {
    return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR };
  }
}

export function recordPhoneSubmission(phone: string): void {
  if (typeof window === "undefined") return;
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  if (!cleanPhone) return;

  const key = `${RATE_LIMIT_PREFIX}${cleanPhone}`;
  const now = Date.now();

  try {
    const raw = localStorage.getItem(key);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const recent = timestamps.filter((t) => now - t < ONE_HOUR_MS);
    recent.push(now);
    localStorage.setItem(key, JSON.stringify(recent));
  } catch (err) {
    console.error("Failed to record phone submission", err);
  }
}
