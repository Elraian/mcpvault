import type { ProxyAdapter } from "./types.js";

export const openaiAdapter: ProxyAdapter = {
  service: "openai",
  displayName: "OpenAI",
  tokenUrl: "https://platform.openai.com/api-keys",
  hint:
    "Create a project API key (`sk-proj-...` or `sk-...`). " +
    "Restrict permissions to read-only or specific resources where possible — keys can drain credits fast.",

  credentialFields: [
    { key: "api_key", prompt: "OpenAI API key", secret: true, placeholder: "sk-proj-..." },
    { key: "organization", prompt: "Organization id", optional: true, placeholder: "org-..." },
  ],

  validate: async (creds) => {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${String(creds.api_key)}`,
        Accept: "application/json",
      };
      if (creds.organization) headers["OpenAI-Organization"] = String(creds.organization);
      const res = await fetch("https://api.openai.com/v1/models?limit=1", { headers });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      const data = (await res.json()) as { data?: Array<{ id?: string }> };
      const sample = data.data?.[0]?.id;
      return {
        ok: true,
        identity: `openai (${creds.organization ?? "default org"})${sample ? ` · sees: ${sample}` : ""}`,
        suggestedLabel: creds.organization ? slugify(String(creds.organization)) : "openai",
        details: { hasModels: !!sample },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "openai-mcp-server"],
  authMapping: (creds) => ({
    OPENAI_API_KEY: String(creds.api_key),
    OPENAI_ORGANIZATION: String(creds.organization ?? ""),
  }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "openai";
}
