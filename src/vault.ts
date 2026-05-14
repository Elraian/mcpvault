import { mkdir, readFile, writeFile, access, rename } from "node:fs/promises";
import { dirname } from "node:path";
import { decryptVault, encryptVault, encryptVaultWithKey, type VaultParams } from "./crypto.js";
import {
  type Account,
  type RedactedAccount,
  type Service,
  type VaultData,
  VaultDataSchema,
  redactAccount,
  validateAccount,
} from "./schema.js";
import { VAULT_DIR, VAULT_FILE } from "./paths.js";

export class VaultLockedError extends Error {
  constructor(msg = "vault is locked") {
    super(msg);
    this.name = "VaultLockedError";
  }
}

export class AccountNotFoundError extends Error {
  constructor(service: Service, label: string) {
    super(`no ${service} account labeled "${label}"`);
    this.name = "AccountNotFoundError";
  }
}

export class AccountExistsError extends Error {
  constructor(service: Service, label: string) {
    super(`${service} account "${label}" already exists`);
    this.name = "AccountExistsError";
  }
}

/**
 * In-memory unlocked vault. Holds the derived key + params so we can re-encrypt
 * on writes without rerunning Argon2.
 */
export class UnlockedVault {
  constructor(
    public data: VaultData,
    public key: Buffer,
    public params: VaultParams,
  ) {}

  list(service?: Service): RedactedAccount[] {
    return this.data.accounts
      .filter((a) => !service || a.service === service)
      .map(redactAccount);
  }

  get(service: Service, label: string): Account {
    const a = this.data.accounts.find((a) => a.service === service && a.label === label);
    if (!a) throw new AccountNotFoundError(service, label);
    return a;
  }

  has(service: Service, label: string): boolean {
    return this.data.accounts.some((a) => a.service === service && a.label === label);
  }

  add(account: Account): void {
    if (this.has(account.service, account.label)) {
      throw new AccountExistsError(account.service, account.label);
    }
    validateAccount(account);
    this.data.accounts.push(account);
  }

  update(service: Service, label: string, patch: Partial<Pick<Account, "description" | "tags" | "credentials">>): Account {
    const idx = this.data.accounts.findIndex((a) => a.service === service && a.label === label);
    if (idx < 0) throw new AccountNotFoundError(service, label);
    const merged: Account = {
      ...this.data.accounts[idx],
      description: patch.description ?? this.data.accounts[idx].description,
      tags: patch.tags ?? this.data.accounts[idx].tags,
      credentials: patch.credentials
        ? { ...this.data.accounts[idx].credentials, ...patch.credentials }
        : this.data.accounts[idx].credentials,
      updated_at: new Date().toISOString(),
    };
    validateAccount(merged);
    this.data.accounts[idx] = merged;
    return merged;
  }

  remove(service: Service, label: string): void {
    const before = this.data.accounts.length;
    this.data.accounts = this.data.accounts.filter((a) => !(a.service === service && a.label === label));
    if (this.data.accounts.length === before) throw new AccountNotFoundError(service, label);
  }

  /**
   * Fuzzy search across label + description + tags. Returns top N with a score in [0,1].
   * Scoring: token-overlap on label is weighted highest, description next, tags last.
   */
  find(service: Service, query: string, limit = 3): Array<{ account: RedactedAccount; score: number }> {
    const q = normalize(query);
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];
    const candidates = this.data.accounts.filter((a) => a.service === service);
    const scored = candidates.map((a) => {
      const labelN = normalize(a.label);
      const descN = normalize(a.description);
      const tagsN = a.tags.map(normalize).join(" ");
      let s = 0;
      let max = 0;
      for (const t of tokens) {
        max += 3; // weight per token (label=3 best case)
        if (labelN === t) s += 3;
        else if (labelN.includes(t)) s += 2;
        else if (descN.includes(t)) s += 1.5;
        else if (tagsN.includes(t)) s += 1;
      }
      const score = max > 0 ? s / max : 0;
      return { account: redactAccount(a), score };
    });
    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  serialize(): string {
    return JSON.stringify(this.data);
  }
}

export function emptyVault(): VaultData {
  return { version: 1, accounts: [] };
}

export async function vaultFileExists(path = VAULT_FILE): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function createVault(password: string, path = VAULT_FILE): Promise<void> {
  if (await vaultFileExists(path)) {
    throw new Error(`vault already exists at ${path}`);
  }
  await mkdir(dirname(path), { recursive: true });
  const blob = encryptVault(JSON.stringify(emptyVault()), password);
  await writeAtomic(path, blob);
}

export async function unlockVault(password: string, path = VAULT_FILE): Promise<UnlockedVault> {
  const blob = await readFile(path);
  const { plaintext, key, params } = decryptVault(blob, password);
  const parsed = VaultDataSchema.parse(JSON.parse(plaintext.toString("utf8")));
  return new UnlockedVault(parsed, key, params);
}

export async function persistVault(vault: UnlockedVault, path = VAULT_FILE): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const blob = encryptVaultWithKey(vault.serialize(), vault.key, vault.params);
  await writeAtomic(path, blob);
}

async function writeAtomic(path: string, data: Buffer): Promise<void> {
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, data, { mode: 0o600 });
  await rename(tmp, path);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

export { VAULT_DIR, VAULT_FILE };
