import type { ProxyAdapter } from "./types.js";

export const datadogAdapter: ProxyAdapter = {
  service: "datadog",
  displayName: "Datadog",
  tokenUrl: "https://app.datadoghq.com/organization-settings/api-keys",
  hint:
    "Need both: an API key (Organization Settings → API Keys) AND an Application key (your user → Application Keys). " +
    "Use your Datadog site (datadoghq.com / datadoghq.eu / us3.datadoghq.com / us5.datadoghq.com / ap1.datadoghq.com).",

  credentialFields: [
    { key: "api_key", prompt: "Datadog API key", secret: true },
    { key: "app_key", prompt: "Datadog Application key", secret: true },
    { key: "site", prompt: "Datadog site", optional: true, placeholder: "datadoghq.com" },
  ],

  validate: async (creds) => {
    const site = String(creds.site || "datadoghq.com").replace(/^https?:\/\//, "").replace(/\/$/, "");
    try {
      const res = await fetch(`https://api.${site}/api/v1/validate`, {
        headers: {
          "DD-API-KEY": String(creds.api_key),
          "DD-APPLICATION-KEY": String(creds.app_key),
          Accept: "application/json",
        },
      });
      const data = (await res.json()) as { valid?: boolean; errors?: string[] };
      if (!res.ok || data.valid === false) {
        const msg = data.errors?.join("; ") ?? `${res.status} ${res.statusText}`;
        return { ok: false, error: msg };
      }
      return {
        ok: true,
        identity: `datadog (${site})`,
        suggestedLabel: slugify(site.split(".")[0] || "datadog"),
        details: { site },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "datadog-mcp-server"],
  authMapping: (creds) => ({
    DD_API_KEY: String(creds.api_key),
    DD_APP_KEY: String(creds.app_key),
    DD_SITE: String(creds.site || "datadoghq.com").replace(/^https?:\/\//, "").replace(/\/$/, ""),
  }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "datadog";
}
