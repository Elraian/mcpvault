import type { ProxyAdapter } from "./types.js";

export const notionAdapter: ProxyAdapter = {
  service: "notion",
  displayName: "Notion",
  tokenUrl: "https://www.notion.so/profile/integrations",
  hint: "Create an Internal Integration, copy the secret (starts with `ntn_` or `secret_`). Grant pages access from the page → Add connections.",

  credentialFields: [
    { key: "api_key", prompt: "Notion integration secret", secret: true, placeholder: "ntn_..." },
  ],

  validate: async (creds) => {
    try {
      const res = await fetch("https://api.notion.com/v1/users/me", {
        headers: {
          Authorization: `Bearer ${String(creds.api_key)}`,
          "Notion-Version": "2022-06-28",
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      const me = (await res.json()) as {
        name?: string;
        bot?: { workspace_name?: string; owner?: { user?: { name?: string } } };
      };
      const ws = me.bot?.workspace_name ?? "workspace";
      const owner = me.bot?.owner?.user?.name ?? me.name ?? "unknown";
      return {
        ok: true,
        identity: `${ws} (${owner})`,
        suggestedLabel: slugify(ws),
        details: { me },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@notionhq/notion-mcp-server"],
  authMapping: (creds) => ({
    // The official notion-mcp-server reads token from this env var or from OPENAPI_MCP_HEADERS.
    INTERNAL_INTEGRATION_TOKEN: String(creds.api_key),
    OPENAPI_MCP_HEADERS: JSON.stringify({
      Authorization: `Bearer ${String(creds.api_key)}`,
      "Notion-Version": "2022-06-28",
    }),
  }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "notion";
}
