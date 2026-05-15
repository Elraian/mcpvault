import type { ProxyAdapter } from "./types.js";

/**
 * MongoDB — connection-string based, multi-database = multi-account.
 * Uses the mongodb-mcp-server community package.
 */
export const mongodbAdapter: ProxyAdapter = {
  service: "mongodb",
  displayName: "MongoDB",
  tokenUrl: "https://cloud.mongodb.com/v2/projects/",
  hint:
    "A MongoDB connection string: mongodb+srv://user:pass@cluster.mongodb.net/dbname (or mongodb://...). " +
    "READ-ONLY user recommended (least privilege).",

  credentialFields: [
    {
      key: "connection_string",
      prompt: "MongoDB connection string",
      secret: true,
      placeholder: "mongodb+srv://user:pass@cluster.mongodb.net/db",
    },
  ],

  validate: async (creds) => {
    const cs = String(creds.connection_string).trim();
    if (!/^mongodb(\+srv)?:\/\//i.test(cs)) {
      return { ok: false, error: "connection string must start with mongodb:// or mongodb+srv://" };
    }
    try {
      const u = new URL(cs.replace(/^mongodb(\+srv)?:/, "https:"));
      const db = u.pathname.replace(/^\//, "").split("?")[0] || "(no db)";
      return {
        ok: true,
        identity: `${u.username || "anon"}@${u.hostname}/${db}`,
        suggestedLabel: slugify(`${u.hostname.split(".")[0]}-${db}`),
        details: { host: u.hostname, db, user: u.username },
      };
    } catch (e: any) {
      return { ok: false, error: `not a valid URL: ${e.message}` };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "mongodb-mcp-server"],
  authMapping: (creds) => ({ MDB_MCP_CONNECTION_STRING: String(creds.connection_string) }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "mongodb";
}
