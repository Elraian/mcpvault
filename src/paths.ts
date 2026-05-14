import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";

const NEW_DIR = join(homedir(), ".mvault");
const LEGACY_DIR = join(homedir(), ".mcp-vault");

function resolveVaultDir(): string {
  if (process.env.MVAULT_DIR) return process.env.MVAULT_DIR;
  if (process.env.MCP_VAULT_DIR) return process.env.MCP_VAULT_DIR;
  // Existing installs keep working — prefer legacy dir if it already has data.
  if (existsSync(join(LEGACY_DIR, "vault.enc"))) return LEGACY_DIR;
  return NEW_DIR;
}

export const VAULT_DIR = resolveVaultDir();
export const VAULT_FILE = join(VAULT_DIR, "vault.enc");
export const ACTIVE_FILE = join(VAULT_DIR, "active.json");
export const LOG_FILE = join(VAULT_DIR, "vault.log");

// Keyring service/account names used to cache the derived key after unlock.
// Kept as "mcp-vault" so existing users don't have to re-enter the master password
// after upgrading from the mcp-vault name.
export const KEYRING_SERVICE = "mcp-vault";
export const KEYRING_ACCOUNT_KEY = "session-key";
export const KEYRING_ACCOUNT_PARAMS = "session-params";
