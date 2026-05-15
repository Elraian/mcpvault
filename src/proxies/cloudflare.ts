import type { ProxyAdapter } from "./types.js";

export const cloudflareAdapter: ProxyAdapter = {
  service: "cloudflare",
  displayName: "Cloudflare",
  tokenUrl: "https://dash.cloudflare.com/profile/api-tokens",
  hint:
    "Create a custom API token with the permissions you need (Zone:Read at minimum; add Workers/R2/DNS if your agent needs them). " +
    "Account ID is shown in the Cloudflare dashboard right sidebar.",

  credentialFields: [
    { key: "api_token", prompt: "Cloudflare API token", secret: true },
    { key: "account_id", prompt: "Account id (32-char hex)", optional: true },
  ],

  validate: async (creds) => {
    try {
      const res = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
        headers: {
          Authorization: `Bearer ${String(creds.api_token)}`,
          Accept: "application/json",
        },
      });
      const data = (await res.json()) as {
        success?: boolean;
        result?: { status?: string };
        errors?: Array<{ message?: string }>;
      };
      if (!res.ok || !data.success) {
        const msg = data.errors?.map((e) => e.message).join("; ") ?? `${res.status} ${res.statusText}`;
        return { ok: false, error: msg };
      }
      return {
        ok: true,
        identity: `cloudflare token (${data.result?.status ?? "active"})`,
        suggestedLabel: "cloudflare",
        details: data,
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@cloudflare/mcp-server-cloudflare"],
  authMapping: (creds) => ({
    CLOUDFLARE_API_TOKEN: String(creds.api_token),
    CLOUDFLARE_ACCOUNT_ID: String(creds.account_id ?? ""),
  }),
};
