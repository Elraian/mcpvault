import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

// End-to-end test that exercises both the data modules and the MCP server
// over stdio. Bypasses the interactive CLI prompts by importing modules.
let tmp: string;

beforeAll(async () => {
  tmp = await mkdtemp(join(tmpdir(), "mvtest-e2e-"));
  process.env.MVAULT_DIR = tmp;
  // Override the keyring service so we don't touch the user's real session entry.
  process.env.MVAULT_KEYRING_SERVICE = `mvault-test-${Date.now()}-${process.pid}`;
});

afterAll(async () => {
  // Cleanup keyring entry too
  const { clearSession } = await import("../src/keyring.js");
  clearSession();
  await rm(tmp, { recursive: true, force: true });
});

describe("end-to-end through modules", () => {
  it("creates vault, unlocks, adds account, persists, switches active", async () => {
    const { createVault } = await import("../src/vault.js");
    const { unlockWithPassword, openWithCachedKey, isUnlocked, lockSession } = await import("../src/session.js");
    const { persistVault } = await import("../src/vault.js");
    const { setActive, getActiveLabel } = await import("../src/active.js");

    const vaultPath = join(tmp, "vault.enc");
    await createVault("test-password-123", vaultPath);

    // Unlock with password — caches key in keyring.
    const v = await unlockWithPassword("test-password-123", vaultPath);
    expect(isUnlocked()).toBe(true);
    expect(v.data.accounts).toEqual([]);

    // Add two Supabase accounts.
    const now = new Date().toISOString();
    v.add({
      service: "supabase",
      label: "client-acme",
      description: "Acme Corp production",
      tags: ["work"],
      credentials: { pat: "sbp_acme_fake" },
      created_at: now,
      updated_at: now,
    });
    v.add({
      service: "supabase",
      label: "personal",
      description: "My personal projects",
      tags: ["personal"],
      credentials: { pat: "sbp_personal_fake" },
      created_at: now,
      updated_at: now,
    });
    await persistVault(v, vaultPath);

    // Re-open with cached key (no password) — should skip KDF.
    const t0 = Date.now();
    const v2 = await openWithCachedKey(vaultPath);
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(1000); // skipping Argon2 should be near-instant
    expect(v2.list("supabase")).toHaveLength(2);

    // Fuzzy find.
    const hits = v2.find("supabase", "Acme");
    expect(hits[0].account.label).toBe("client-acme");

    // Activate one.
    await setActive("supabase", "client-acme");
    expect(await getActiveLabel("supabase")).toBe("client-acme");

    // Wrapper helper should resolve credentials for the active account.
    const { getActiveCredentials } = await import("../src/wrappers/common.js");
    const acct = await getActiveCredentials("supabase");
    expect(acct.label).toBe("client-acme");
    expect((acct.credentials as any).pat).toBe("sbp_acme_fake");

    // Switch.
    await setActive("supabase", "personal");
    const acct2 = await getActiveCredentials("supabase");
    expect(acct2.label).toBe("personal");

    // Lock clears keyring.
    lockSession();
    expect(isUnlocked()).toBe(false);
    await expect(openWithCachedKey(vaultPath)).rejects.toThrow(/locked/);
  });
});

describe("MCP server over stdio", () => {
  it("responds to initialize + tools/list + list_accounts", async () => {
    const vaultPath = join(tmp!, "vault.enc");
    // Re-unlock so the server can read accounts.
    const { unlockWithPassword } = await import("../src/session.js");
    await unlockWithPassword("test-password-123", vaultPath);

    const distEntry = join(process.cwd(), "dist", "index.js");
    const child = spawn(process.execPath, [distEntry, "server"], {
      env: {
        ...process.env,
        MVAULT_DIR: tmp!,
        MVAULT_KEYRING_SERVICE: process.env.MVAULT_KEYRING_SERVICE,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const responses: any[] = [];
    let buf = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (line.trim()) responses.push(JSON.parse(line));
      }
    });
    let stderr = "";
    child.stderr.on("data", (c) => (stderr += c.toString()));

    const send = (msg: any) => {
      child.stdin.write(JSON.stringify(msg) + "\n");
    };

    // 1) initialize
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "smoke-test", version: "0.0.1" },
      },
    });
    await waitFor(() => responses.some((r) => r.id === 1), 5000);
    const init = responses.find((r) => r.id === 1);
    expect(init?.result?.serverInfo?.name).toBe("mcpvault");

    // 2) initialized notification
    send({ jsonrpc: "2.0", method: "notifications/initialized" });

    // 3) tools/list
    send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    await waitFor(() => responses.some((r) => r.id === 2), 5000);
    const tools = responses.find((r) => r.id === 2);
    const toolNames = tools.result.tools.map((t: any) => t.name).sort();
    expect(toolNames).toContain("unlock_vault");
    expect(toolNames).toContain("list_accounts");
    expect(toolNames).toContain("activate_account");
    expect(toolNames).toContain("find_account");

    // 4) tools/call list_accounts
    send({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "list_accounts", arguments: {} },
    });
    await waitFor(() => responses.some((r) => r.id === 3), 10000);
    const list = responses.find((r) => r.id === 3);
    const body = JSON.parse(list.result.content[0].text);
    expect(body.accounts.length).toBe(2);
    expect(body.accounts.map((a: any) => a.label).sort()).toEqual(["client-acme", "personal"]);

    // 5) tools/call find_account
    send({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "find_account", arguments: { service: "supabase", query: "acme corp" } },
    });
    await waitFor(() => responses.some((r) => r.id === 4), 10000);
    const find = responses.find((r) => r.id === 4);
    const findBody = JSON.parse(find.result.content[0].text);
    expect(findBody.matches[0].account.label).toBe("client-acme");

    child.kill();
    if (stderr.trim()) {
      // Surface only if something failed — printing here only on failure helps debugging
    }
  });
});

async function waitFor(check: () => boolean, ms: number): Promise<void> {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`timeout after ${ms}ms`);
}
