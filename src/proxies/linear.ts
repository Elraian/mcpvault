import type { ProxyAdapter } from "./types.js";

export const linearAdapter: ProxyAdapter = {
  service: "linear",
  displayName: "Linear",
  tokenUrl: "https://linear.app/settings/api",
  hint: "Personal API key (`lin_api_...`). Read+Write scope for full agent functionality.",

  credentialFields: [
    { key: "api_key", prompt: "Linear personal API key", secret: true, placeholder: "lin_api_..." },
  ],

  validate: async (creds) => {
    try {
      const res = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          Authorization: String(creds.api_key),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query: "{ viewer { id name email organization { name urlKey } } }" }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      const data = (await res.json()) as {
        data?: { viewer?: { name?: string; email?: string; organization?: { name?: string; urlKey?: string } } };
        errors?: Array<{ message?: string }>;
      };
      if (data.errors?.length) {
        return { ok: false, error: data.errors.map((e) => e.message).join("; ") };
      }
      const viewer = data.data?.viewer;
      const org = viewer?.organization?.name ?? "linear";
      const label = viewer?.organization?.urlKey ?? slugify(org);
      return {
        ok: true,
        identity: `${org} (${viewer?.name ?? viewer?.email ?? "unknown"})`,
        suggestedLabel: slugify(label),
        details: { viewer },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@modelcontextprotocol/server-everything", "linear"], // placeholder — replaced below per real package
  authMapping: (creds) => ({ LINEAR_API_KEY: String(creds.api_key) }),
};

// Override placeholder spawn — use the well-known community Linear MCP server.
linearAdapter.spawnArgs = ["-y", "linear-mcp-server"];

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "linear";
}
