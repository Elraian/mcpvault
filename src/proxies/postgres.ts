import type { ProxyAdapter } from "./types.js";

/**
 * Postgres — uses the official @modelcontextprotocol/server-postgres MCP server.
 *
 * Multi-account in mcpvault = multi-database. Each "account" represents one
 * connection string (different host/db/user). Useful for devs juggling
 * dev/staging/prod databases or multiple clients.
 *
 * The Postgres MCP server reads the connection string as a positional CLI arg
 * (not env var), so we use argMapping instead of authMapping.
 */
export const postgresAdapter: ProxyAdapter = {
  service: "postgres",
  displayName: "PostgreSQL",
  tokenUrl: "https://supabase.com/docs/guides/database/connecting-to-postgres",
  hint:
    "A Postgres connection string: postgresql://user:password@host:port/database. " +
    "READ-ONLY recommended (use a least-privilege role).",

  credentialFields: [
    {
      key: "connection_string",
      prompt: "Connection string",
      secret: true,
      placeholder: "postgresql://user:pass@host:5432/db",
    },
  ],

  validate: async (creds) => {
    const cs = String(creds.connection_string).trim();
    if (!/^postgres(ql)?:\/\//i.test(cs)) {
      return { ok: false, error: "connection string must start with postgresql:// or postgres://" };
    }
    // Parse out host/db for the identity hint. We don't actually connect here —
    // pg client lib would be a heavy dep for the validate step, and the server
    // itself will fail loudly if creds are wrong on first use.
    try {
      const u = new URL(cs.replace(/^postgres:/, "postgresql:"));
      const db = u.pathname.replace(/^\//, "") || "(no db)";
      const host = u.hostname || "(no host)";
      return {
        ok: true,
        identity: `${u.username || "anon"}@${host}/${db}`,
        suggestedLabel: slugify(`${host}-${db}`),
        details: { host, db, user: u.username },
      };
    } catch (e: any) {
      return { ok: false, error: `not a valid URL: ${e.message}` };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@modelcontextprotocol/server-postgres"],
  // Postgres server takes the connection string as a positional arg.
  authMapping: () => ({}),
  argMapping: (creds) => [String(creds.connection_string)],
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "postgres";
}
