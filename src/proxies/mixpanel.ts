import type { ProxyAdapter } from "./types.js";

export const mixpanelAdapter: ProxyAdapter = {
  service: "mixpanel",
  displayName: "Mixpanel",
  tokenUrl: "https://mixpanel.com/settings/project",
  hint:
    "Project settings → Service Accounts → create one. You'll get a username + secret. " +
    "Note your Project ID (numeric, from the URL or project settings).",

  credentialFields: [
    { key: "service_account_username", prompt: "Service account username" },
    { key: "service_account_secret", prompt: "Service account secret", secret: true },
    { key: "project_id", prompt: "Project ID (numeric)" },
  ],

  validate: async (creds) => {
    const auth = "Basic " + Buffer.from(
      `${String(creds.service_account_username)}:${String(creds.service_account_secret)}`,
    ).toString("base64");
    try {
      const res = await fetch(
        `https://mixpanel.com/api/app/projects/${encodeURIComponent(String(creds.project_id))}/`,
        { headers: { Authorization: auth, Accept: "application/json" } },
      );
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      const proj = (await res.json()) as { name?: string; id?: number };
      return {
        ok: true,
        identity: `mixpanel ${proj.name ?? proj.id ?? "project"}`,
        suggestedLabel: slugify(proj.name ?? `mixpanel-${proj.id}`),
        details: { proj },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "mixpanel-mcp-server"],
  authMapping: (creds) => ({
    MIXPANEL_USERNAME: String(creds.service_account_username),
    MIXPANEL_SECRET: String(creds.service_account_secret),
    MIXPANEL_PROJECT_ID: String(creds.project_id),
  }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "mixpanel";
}
