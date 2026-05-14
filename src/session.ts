import { readFile } from "node:fs/promises";
import { decryptVault } from "./crypto.js";
import { UnlockedVault } from "./vault.js";
import { VaultDataSchema } from "./schema.js";
import { VAULT_FILE } from "./paths.js";
import { loadSession, saveSession, clearSession, type CachedSession } from "./keyring.js";

export class VaultNotInitializedError extends Error {
  constructor() {
    super("vault not initialized — run `mcpvault init` first");
    this.name = "VaultNotInitializedError";
  }
}

export class VaultLockedError extends Error {
  constructor() {
    super("vault is locked — run `mcpvault unlock` or use the unlock_vault tool");
    this.name = "VaultLockedError";
  }
}

/**
 * Unlock the vault using a master password. Decrypts, runs KDF, caches the
 * derived key in the OS keyring so subsequent reads skip Argon2.
 */
export async function unlockWithPassword(password: string, path = VAULT_FILE): Promise<UnlockedVault> {
  let blob: Buffer;
  try {
    blob = await readFile(path);
  } catch (e: any) {
    if (e?.code === "ENOENT") throw new VaultNotInitializedError();
    throw e;
  }
  const { plaintext, key, params } = decryptVault(blob, password);
  const data = VaultDataSchema.parse(JSON.parse(plaintext.toString("utf8")));
  const session: CachedSession = {
    key_b64: key.toString("base64"),
    m: params.m,
    t: params.t,
    p: params.p,
    salt_b64: params.salt.toString("base64"),
  };
  saveSession(session);
  return new UnlockedVault(data, key, params);
}

/**
 * Open the vault using the cached session key from the OS keyring. Skips KDF.
 * Throws VaultLockedError if no cached session exists.
 */
export async function openWithCachedKey(path = VAULT_FILE): Promise<UnlockedVault> {
  let blob: Buffer;
  try {
    blob = await readFile(path);
  } catch (e: any) {
    if (e?.code === "ENOENT") throw new VaultNotInitializedError();
    throw e;
  }
  const s = loadSession();
  if (!s) throw new VaultLockedError();
  const key = Buffer.from(s.key_b64, "base64");
  const salt = Buffer.from(s.salt_b64, "base64");
  // Decrypt directly with cached key — same algorithm as decryptVault but without re-running KDF.
  const { createDecipheriv } = await import("node:crypto");
  const MAGIC = Buffer.from("MVLT", "ascii");
  if (!blob.subarray(0, 4).equals(MAGIC)) throw new Error("not a vault file (bad magic)");
  // Skip header (we already know params from keyring; re-parse to extract nonce, tag, ct positions)
  const SALT_BYTES = 16, NONCE_BYTES = 12, TAG_BYTES = 16;
  let o = 4 + 1 + 4 + 1 + 1; // magic+version+m+t+p
  o += SALT_BYTES;
  const nonce = blob.subarray(o, o + NONCE_BYTES); o += NONCE_BYTES;
  const tag = blob.subarray(o, o + TAG_BYTES); o += TAG_BYTES;
  const ct = blob.subarray(o);
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  let plaintext: Buffer;
  try {
    plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  } catch {
    // Cached key doesn't match this vault file — likely vault was re-initialized.
    clearSession();
    throw new VaultLockedError();
  }
  const data = VaultDataSchema.parse(JSON.parse(plaintext.toString("utf8")));
  return new UnlockedVault(data, key, { m: s.m, t: s.t, p: s.p, salt });
}

export function lockSession(): void {
  clearSession();
}

export function isUnlocked(): boolean {
  return loadSession() !== null;
}
