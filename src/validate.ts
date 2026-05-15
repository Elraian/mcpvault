import type { Service } from "./schema.js";

export interface ValidationResult {
  ok: boolean;
  identity?: string;
  details?: Record<string, unknown>;
  suggestedLabel?: string;
  error?: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "account";
}

export async function validateSupabase(pat: string): Promise<ValidationResult> {
  try {
    const res = await fetch("https://api.supabase.com/v1/organizations", {
      headers: { Authorization: `Bearer ${pat}`, Accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
    }
    const orgs = (await res.json()) as Array<{ id: string; name: string }>;
    const primary = orgs[0]?.name ?? "supabase";
    return {
      ok: true,
      identity: primary,
      details: { orgs },
      suggestedLabel: slugify(primary),
    };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function validateGitHub(pat: string): Promise<ValidationResult> {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "mcpvault",
      },
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
    }
    const user = (await res.json()) as { login: string; name?: string };
    return {
      ok: true,
      identity: user.login,
      details: { user },
      suggestedLabel: slugify(user.login),
    };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function validateVercel(token: string, teamId?: string): Promise<ValidationResult> {
  try {
    const url = teamId
      ? `https://api.vercel.com/v2/user?teamId=${encodeURIComponent(teamId)}`
      : "https://api.vercel.com/v2/user";
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as { user?: { username?: string; name?: string; email?: string } };
    const u = data.user;
    const id = u?.username ?? u?.name ?? u?.email ?? "vercel";
    return {
      ok: true,
      identity: id,
      details: { user: u },
      suggestedLabel: slugify(id),
    };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function validateStripe(secretKey: string): Promise<ValidationResult> {
  try {
    const auth = "Basic " + Buffer.from(`${secretKey}:`).toString("base64");
    const res = await fetch("https://api.stripe.com/v1/account", {
      headers: { Authorization: auth, Accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
    }
    const acct = (await res.json()) as { id: string; business_profile?: { name?: string }; email?: string };
    const id = acct.business_profile?.name ?? acct.email ?? acct.id;
    const mode = secretKey.startsWith("sk_live_") ? "live" : "test";
    return {
      ok: true,
      identity: `${id} (${mode})`,
      details: { account: acct, mode },
      suggestedLabel: slugify(`${id}-${mode}`),
    };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function validateCredentials(service: Service, credentials: Record<string, unknown>): Promise<ValidationResult> {
  switch (service) {
    case "supabase":
      return validateSupabase(String(credentials.pat));
    case "github":
      return validateGitHub(String(credentials.pat));
    case "vercel":
      return validateVercel(String(credentials.token), credentials.team_id ? String(credentials.team_id) : undefined);
    case "stripe":
      return validateStripe(String(credentials.secret_key));
    // Proxy services delegate to their adapter's validator
    case "notion":
    case "linear":
    case "postgres":
    case "posthog":
    case "slack":
    case "cloudflare":
    case "sentry":
    case "brave":
    case "aws":
    case "resend":
    case "figma":
    case "airtable":
    case "datadog":
    case "gitlab":
    case "mongodb":
    case "discord":
    case "hubspot":
    case "mixpanel":
    case "openai": {
      const { PROXY_ADAPTERS } = await import("./proxies/registry.js");
      const adapter = PROXY_ADAPTERS[service];
      if (adapter?.validate) return adapter.validate(credentials);
      return { ok: true, identity: service };
    }
  }
}
