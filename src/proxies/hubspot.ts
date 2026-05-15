import type { ProxyAdapter } from "./types.js";

export const hubspotAdapter: ProxyAdapter = {
  service: "hubspot",
  displayName: "HubSpot",
  tokenUrl: "https://app.hubspot.com/private-apps/",
  hint:
    "Create a Private App and generate a token. " +
    "Scope: crm.objects.contacts.read (and any other CRM objects you need read/write on).",

  credentialFields: [
    { key: "access_token", prompt: "HubSpot Private App access token", secret: true, placeholder: "pat-na1-..." },
  ],

  validate: async (creds) => {
    try {
      const res = await fetch(
        "https://api.hubapi.com/oauth/v1/access-tokens/" + encodeURIComponent(String(creds.access_token)),
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) {
        // Private App tokens won't validate via that endpoint; try the account info endpoint instead.
        const res2 = await fetch("https://api.hubapi.com/account-info/v3/details", {
          headers: {
            Authorization: `Bearer ${String(creds.access_token)}`,
            Accept: "application/json",
          },
        });
        if (!res2.ok) {
          const body = await res2.text();
          return { ok: false, error: `${res2.status} ${res2.statusText}: ${body.slice(0, 200)}` };
        }
        const info = (await res2.json()) as { portalId?: number; accountType?: string };
        return {
          ok: true,
          identity: `hubspot portal ${info.portalId ?? "(unknown)"} (${info.accountType ?? "?"})`,
          suggestedLabel: `hubspot-${info.portalId ?? "main"}`,
          details: { info },
        };
      }
      const info = (await res.json()) as { hub_id?: number; user?: string };
      return {
        ok: true,
        identity: `hubspot hub ${info.hub_id ?? "?"}`,
        suggestedLabel: `hubspot-${info.hub_id ?? "main"}`,
        details: { info },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@hubspot/mcp-server"],
  authMapping: (creds) => ({
    HUBSPOT_ACCESS_TOKEN: String(creds.access_token),
    PRIVATE_APP_ACCESS_TOKEN: String(creds.access_token),
  }),
};
