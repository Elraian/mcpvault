import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  AccountExistsError,
  AccountNotFoundError,
  createVault,
  persistVault,
  unlockVault,
  vaultFileExists,
} from "../src/vault.js";
import type { Account } from "../src/schema.js";

let tmp: string;
let vaultPath: string;

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), "mvtest-"));
  vaultPath = join(tmp, "vault.enc");
});

afterEach(async () => {
  await rm(tmp, { recursive: true, force: true });
});

function mkAccount(overrides: Partial<Account> = {}): Account {
  const now = new Date().toISOString();
  return {
    service: "supabase",
    label: "personal",
    description: "my personal supabase",
    tags: [],
    credentials: { pat: "sbp_test_xxx" },
    created_at: now,
    updated_at: now,
    ...overrides,
  } as Account;
}

describe("vault file lifecycle", () => {
  it("createVault writes a file that unlocks with the right password", async () => {
    await createVault("pw", vaultPath);
    expect(await vaultFileExists(vaultPath)).toBe(true);
    const v = await unlockVault("pw", vaultPath);
    expect(v.data.accounts).toEqual([]);
  });

  it("createVault refuses to overwrite existing", async () => {
    await createVault("pw", vaultPath);
    await expect(createVault("pw", vaultPath)).rejects.toThrow(/already exists/);
  });

  it("persist + unlock roundtrip preserves accounts", async () => {
    await createVault("pw", vaultPath);
    const v = await unlockVault("pw", vaultPath);
    v.add(mkAccount({ label: "client-a" }));
    v.add(mkAccount({ label: "client-b", description: "Acme Corp project" }));
    await persistVault(v, vaultPath);
    const v2 = await unlockVault("pw", vaultPath);
    expect(v2.data.accounts.map((a) => a.label).sort()).toEqual(["client-a", "client-b"]);
  });

  it("persist uses cached key (no rerun) — fast second write", async () => {
    await createVault("pw", vaultPath);
    const v = await unlockVault("pw", vaultPath);
    v.add(mkAccount({ label: "a" }));
    const t0 = Date.now();
    await persistVault(v, vaultPath);
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(2000); // pure JS Argon2 alone would be ~5s
  });
});

describe("vault operations", () => {
  it("rejects duplicate labels per service", async () => {
    await createVault("pw", vaultPath);
    const v = await unlockVault("pw", vaultPath);
    v.add(mkAccount({ label: "dup" }));
    expect(() => v.add(mkAccount({ label: "dup" }))).toThrow(AccountExistsError);
  });

  it("allows same label across different services", async () => {
    await createVault("pw", vaultPath);
    const v = await unlockVault("pw", vaultPath);
    v.add(mkAccount({ service: "supabase", label: "main" }));
    v.add(mkAccount({ service: "github", label: "main", credentials: { pat: "ghp_xxx" } }));
    expect(v.list().length).toBe(2);
  });

  it("get throws when missing", async () => {
    await createVault("pw", vaultPath);
    const v = await unlockVault("pw", vaultPath);
    expect(() => v.get("supabase", "nope")).toThrow(AccountNotFoundError);
  });

  it("update merges and rejects invalid credentials shape", async () => {
    await createVault("pw", vaultPath);
    const v = await unlockVault("pw", vaultPath);
    v.add(mkAccount({ label: "a" }));
    const updated = v.update("supabase", "a", { description: "renamed" });
    expect(updated.description).toBe("renamed");
    expect(() => v.update("supabase", "a", { credentials: { pat: "" } as any })).toThrow();
  });

  it("remove drops account and is idempotent-failure", async () => {
    await createVault("pw", vaultPath);
    const v = await unlockVault("pw", vaultPath);
    v.add(mkAccount({ label: "a" }));
    v.remove("supabase", "a");
    expect(v.list().length).toBe(0);
    expect(() => v.remove("supabase", "a")).toThrow(AccountNotFoundError);
  });

  it("list filters by service and never returns credentials", async () => {
    await createVault("pw", vaultPath);
    const v = await unlockVault("pw", vaultPath);
    v.add(mkAccount({ service: "supabase", label: "a" }));
    v.add(mkAccount({ service: "github", label: "b", credentials: { pat: "ghp_xxx" } }));
    const subs = v.list("supabase");
    expect(subs).toHaveLength(1);
    expect((subs[0] as any).credentials).toBeUndefined();
  });
});

describe("find (fuzzy search)", () => {
  it("ranks exact-label match top", async () => {
    await createVault("pw", vaultPath);
    const v = await unlockVault("pw", vaultPath);
    v.add(mkAccount({ label: "acme", description: "" }));
    v.add(mkAccount({ label: "personal", description: "Acme Corp work happens here too" }));
    const hits = v.find("supabase", "acme");
    expect(hits[0].account.label).toBe("acme");
    expect(hits[0].score).toBeGreaterThan(hits[1].score);
  });

  it("matches via description", async () => {
    await createVault("pw", vaultPath);
    const v = await unlockVault("pw", vaultPath);
    v.add(mkAccount({ label: "client-2", description: "Acme Corp main production project" }));
    const hits = v.find("supabase", "Acme Corp");
    expect(hits[0].account.label).toBe("client-2");
  });

  it("returns empty when no match", async () => {
    await createVault("pw", vaultPath);
    const v = await unlockVault("pw", vaultPath);
    v.add(mkAccount({ label: "personal" }));
    const hits = v.find("supabase", "totally-unrelated");
    expect(hits).toEqual([]);
  });
});
