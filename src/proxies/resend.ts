import type { ProxyAdapter } from "./types.js";

export const resendAdapter: ProxyAdapter = {
  service: "resend",
  displayName: "Resend",
  tokenUrl: "https://resend.com/api-keys",
  hint: "Create an API key (`re_...`). Full Access for send + read; Sending Access for send-only.",

  credentialFields: [
    { key: "api_key", prompt: "Resend API key", secret: true, placeholder: "re_..." },
  ],

  validate: async (creds) => {
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: {
          Authorization: `Bearer ${String(creds.api_key)}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      const data = (await res.json()) as { data?: Array<{ name?: string; id?: string }> };
      const domains = data.data ?? [];
      const primary = domains[0]?.name ?? "(no verified domains yet)";
      return {
        ok: true,
        identity: `resend (${domains.length} domain${domains.length === 1 ? "" : "s"}, primary: ${primary})`,
        suggestedLabel: slugify(primary || "resend"),
        details: { domains },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "resend-mcp-server"],
  authMapping: (creds) => ({ RESEND_API_KEY: String(creds.api_key) }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "resend";
}
