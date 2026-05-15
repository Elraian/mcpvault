import type { ProxyAdapter } from "./types.js";

export const sentryAdapter: ProxyAdapter = {
  service: "sentry",
  displayName: "Sentry",
  tokenUrl: "https://sentry.io/settings/account/api/auth-tokens/",
  hint:
    "Create a User Auth Token (or an org-scoped one) with at minimum: project:read, event:read, org:read. " +
    "Organization slug is shown in the URL of your Sentry dashboard.",

  credentialFields: [
    { key: "auth_token", prompt: "Sentry auth token", secret: true, placeholder: "sntrys_..." },
    { key: "org_slug", prompt: "Organization slug (from the dashboard URL)" },
    { key: "host", prompt: "Sentry host", optional: true, placeholder: "https://sentry.io" },
  ],

  validate: async (creds) => {
    const host = String(creds.host || "https://sentry.io").replace(/\/$/, "");
    try {
      const res = await fetch(`${host}/api/0/organizations/${encodeURIComponent(String(creds.org_slug))}/`, {
        headers: {
          Authorization: `Bearer ${String(creds.auth_token)}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      const org = (await res.json()) as { name?: string; slug?: string };
      return {
        ok: true,
        identity: `${org.name ?? org.slug ?? "sentry"} (sentry)`,
        suggestedLabel: org.slug ?? "sentry",
        details: { org },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@sentry/mcp-server"],
  authMapping: (creds) => ({
    SENTRY_AUTH_TOKEN: String(creds.auth_token),
    SENTRY_ORG: String(creds.org_slug),
    SENTRY_HOST: String(creds.host || "https://sentry.io"),
  }),
};
