import type { ProxyAdapter } from "./types.js";

export const airtableAdapter: ProxyAdapter = {
  service: "airtable",
  displayName: "Airtable",
  tokenUrl: "https://airtable.com/create/tokens",
  hint:
    "Create a personal access token (`pat...`). Required scopes for full agent use: " +
    "data.records:read, data.records:write, schema.bases:read. Restrict access to specific bases.",

  credentialFields: [
    { key: "personal_access_token", prompt: "Airtable personal access token", secret: true, placeholder: "pat..." },
  ],

  validate: async (creds) => {
    try {
      const res = await fetch("https://api.airtable.com/v0/meta/whoami", {
        headers: {
          Authorization: `Bearer ${String(creds.personal_access_token)}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      const me = (await res.json()) as { id?: string; email?: string; scopes?: string[] };
      return {
        ok: true,
        identity: `airtable (${me.email ?? me.id ?? "user"})`,
        suggestedLabel: slugify(me.email ?? "airtable"),
        details: { me },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "airtable-mcp-server"],
  authMapping: (creds) => ({ AIRTABLE_API_KEY: String(creds.personal_access_token) }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "airtable";
}
