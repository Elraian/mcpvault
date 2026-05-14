import { Entry } from "@napi-rs/keyring";
import { KEYRING_SERVICE as DEFAULT_KEYRING_SERVICE, KEYRING_ACCOUNT_KEY } from "./paths.js";

// Tests can override this so they don't touch the user's real keyring entry.
const KEYRING_SERVICE = process.env.MVAULT_KEYRING_SERVICE ?? DEFAULT_KEYRING_SERVICE;

export interface CachedSession {
  key_b64: string;
  m: number;
  t: number;
  p: number;
  salt_b64: string;
}

function entry(): Entry {
  return new Entry(KEYRING_SERVICE, KEYRING_ACCOUNT_KEY);
}

export function saveSession(s: CachedSession): void {
  entry().setPassword(JSON.stringify(s));
}

export function loadSession(): CachedSession | null {
  try {
    const v = entry().getPassword();
    if (!v) return null;
    return JSON.parse(v) as CachedSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    entry().deletePassword();
  } catch {
    // already absent — fine
  }
}
