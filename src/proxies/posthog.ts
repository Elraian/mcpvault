import type { ProxyAdapter } from "./types.js";

export const posthogAdapter: ProxyAdapter = {
  service: "posthog",
  displayName: "PostHog",
  tokenUrl: "https://us.posthog.com/project/settings/personal-api-keys",
  hint:
    "Create a Personal API key (phx_...). Scope: read access to events, insights, and persons at minimum. Note your Project ID (e.g. 12345) from project settings.",

  credentialFields: [
    { key: "personal_api_key", prompt: "PostHog personal API key (phx_...)", secret: true },
    { key: "project_id", prompt: "Project id (numeric, from project settings)" },
    { key: "host", prompt: "PostHog host", optional: true, placeholder: "https://us.posthog.com" },
  ],

  validate: async (creds) => {
    const host = String(creds.host || "https://us.posthog.com").replace(/\/$/, "");
    try {
      const res = await fetch(`${host}/api/users/@me/`, {
        headers: {
          Authorization: `Bearer ${String(creds.personal_api_key)}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      const me = (await res.json()) as { email?: string; first_name?: string; organization?: { name?: string } };
      const org = me.organization?.name ?? me.email ?? "posthog";
      return {
        ok: true,
        identity: `${me.first_name ?? me.email ?? "user"} @ ${org}`,
        suggestedLabel: slugify(org),
        details: { me },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@andrew_eragon/mcp-server-posthog"],
  authMapping: (creds) => ({
    POSTHOG_API_KEY: String(creds.personal_api_key),
    POSTHOG_PROJECT_ID: String(creds.project_id ?? ""),
    POSTHOG_HOST: String(creds.host || "https://us.posthog.com"),
  }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "posthog";
}
