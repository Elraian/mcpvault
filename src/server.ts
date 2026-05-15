import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { unlockWithPassword, openWithCachedKey, lockSession, isUnlocked, VaultLockedError } from "./session.js";
import { persistVault } from "./vault.js";
import { CredentialsByService, ServiceSchema, type Service, type Account } from "./schema.js";
import { setActive, readActive, getActiveLabel, clearActive } from "./active.js";
import { logEvent } from "./log.js";
import { VERSION } from "./version.js";

function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] };
}

function json(obj: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] };
}

function fail(msg: string) {
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}

async function withVault<T>(fn: (v: Awaited<ReturnType<typeof openWithCachedKey>>) => Promise<T>): Promise<T> {
  return fn(await openWithCachedKey());
}

export async function startVaultServer(): Promise<void> {
  const server = new McpServer({ name: "mcpvault", version: VERSION });

  server.registerTool(
    "unlock_vault",
    {
      description:
        "Unlock the vault with the master password. The derived key is cached in the OS keyring so subsequent reads skip Argon2. Required before any other tool that touches accounts.",
      inputSchema: { master_password: z.string().min(1) },
    },
    async ({ master_password }) => {
      try {
        await unlockWithPassword(master_password);
        await logEvent({ kind: "unlock", ok: true });
        return text("Vault unlocked. Session key cached.");
      } catch (e: any) {
        await logEvent({ kind: "unlock", ok: false });
        return fail(`Unlock failed: ${e.message}`);
      }
    },
  );

  server.registerTool(
    "lock_vault",
    {
      description: "Lock the vault (clears the cached session key from the OS keyring). Future tool calls will need unlock_vault.",
      inputSchema: {},
    },
    async () => {
      lockSession();
      await logEvent({ kind: "lock" });
      return text("Vault locked.");
    },
  );

  server.registerTool(
    "vault_status",
    {
      description: "Check whether the vault is unlocked.",
      inputSchema: {},
    },
    async () => json({ unlocked: isUnlocked() }),
  );

  server.registerTool(
    "list_accounts",
    {
      description: "List all stored accounts (redacted — never includes secrets). Optionally filter by service.",
      inputSchema: { service: ServiceSchema.optional() },
    },
    async ({ service }) => {
      try {
        return await withVault(async (v) => json({ accounts: v.list(service as Service | undefined) }));
      } catch (e: any) {
        if (e instanceof VaultLockedError) return fail(e.message);
        return fail(e.message);
      }
    },
  );

  server.registerTool(
    "find_account",
    {
      description:
        "Fuzzy-search accounts for a given service by label, description, or tags. Returns top 3 with confidence scores in [0,1]. Use when the user describes a project in natural language and you need to pick the right account.",
      inputSchema: {
        service: ServiceSchema,
        query: z.string().min(1),
      },
    },
    async ({ service, query }) => {
      try {
        return await withVault(async (v) => json({ matches: v.find(service as Service, query) }));
      } catch (e: any) {
        return fail(e.message);
      }
    },
  );

  server.registerTool(
    "get_active",
    {
      description: "Get the currently active account label per service, or for a single service if specified.",
      inputSchema: { service: ServiceSchema.optional() },
    },
    async ({ service }) => {
      const state = await readActive();
      if (service) return json({ service, active: state.active[service as Service] ?? null });
      return json({ active: state.active });
    },
  );

  server.registerTool(
    "activate_account",
    {
      description:
        "Set the active account for a service. After activation, wrapper MCPs (supabase, github, vercel, stripe) will use this account's credentials on subsequent requests. No restart needed.",
      inputSchema: {
        service: ServiceSchema,
        label: z.string().min(1),
      },
    },
    async ({ service, label }) => {
      try {
        return await withVault(async (v) => {
          v.get(service as Service, label); // throws if missing
          await setActive(service as Service, label);
          await logEvent({ kind: "activate", service, label });
          return text(`Active ${service} account is now "${label}".`);
        });
      } catch (e: any) {
        return fail(e.message);
      }
    },
  );

  server.registerTool(
    "add_account",
    {
      description:
        "Add a new account. credentials shape depends on service: supabase={pat,default_project_ref?,org_id?}, github={pat,username?}, vercel={token,team_id?}, stripe={secret_key,mode}.",
      inputSchema: {
        service: ServiceSchema,
        label: z.string().regex(/^[a-zA-Z0-9_\-]+$/, "label must be alphanumeric with - or _"),
        description: z.string().default(""),
        tags: z.array(z.string()).default([]),
        credentials: z.record(z.unknown()),
      },
    },
    async ({ service, label, description, tags, credentials }) => {
      try {
        return await withVault(async (v) => {
          CredentialsByService[service as Service].parse(credentials);
          const now = new Date().toISOString();
          const account: Account = {
            service: service as Service,
            label,
            description: description ?? "",
            tags: tags ?? [],
            credentials: credentials as Record<string, unknown>,
            created_at: now,
            updated_at: now,
          };
          v.add(account);
          await persistVault(v);
          await logEvent({ kind: "add", service, label });
          return text(`Added ${service} account "${label}".`);
        });
      } catch (e: any) {
        return fail(e.message);
      }
    },
  );

  server.registerTool(
    "update_account",
    {
      description: "Update an existing account's description, tags, or credentials.",
      inputSchema: {
        service: ServiceSchema,
        label: z.string().min(1),
        patch: z.object({
          description: z.string().optional(),
          tags: z.array(z.string()).optional(),
          credentials: z.record(z.unknown()).optional(),
        }),
      },
    },
    async ({ service, label, patch }) => {
      try {
        return await withVault(async (v) => {
          v.update(service as Service, label, patch);
          await persistVault(v);
          await logEvent({ kind: "update", service, label });
          return text(`Updated ${service} account "${label}".`);
        });
      } catch (e: any) {
        return fail(e.message);
      }
    },
  );

  server.registerTool(
    "delete_account",
    {
      description: "Permanently remove an account from the vault. Active selection for that service is cleared if it matched.",
      inputSchema: {
        service: ServiceSchema,
        label: z.string().min(1),
      },
    },
    async ({ service, label }) => {
      try {
        return await withVault(async (v) => {
          v.remove(service as Service, label);
          await persistVault(v);
          const active = await getActiveLabel(service as Service);
          if (active === label) await clearActive(service as Service);
          await logEvent({ kind: "remove", service, label });
          return text(`Removed ${service} account "${label}".`);
        });
      } catch (e: any) {
        return fail(e.message);
      }
    },
  );

  server.registerTool(
    "export_redacted",
    {
      description: "Dump the vault structure with credentials masked. Useful for backups and inspection.",
      inputSchema: {},
    },
    async () => {
      try {
        return await withVault(async (v) => json({ accounts: v.list() }));
      } catch (e: any) {
        return fail(e.message);
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
