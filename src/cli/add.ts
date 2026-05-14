import { intro, outro, note, log } from "@clack/prompts";
import open from "open";
import { openWithCachedKey } from "../session.js";
import { persistVault } from "../vault.js";
import { CredentialsByService, ServiceSchema, type Service, type Account } from "../schema.js";
import { ask, askOptional, askPassword, confirm, pick, spinner, redactForDisplay, c } from "./prompt.js";
import { logEvent } from "../log.js";
import { validateCredentials } from "../validate.js";

interface CredField {
  key: string;
  prompt: string;
  secret?: boolean;
  optional?: boolean;
  default?: string;
}

const CRED_FIELDS: Record<Service, CredField[]> = {
  supabase: [
    { key: "pat", prompt: "Supabase Personal Access Token (sbp_...)", secret: true },
    { key: "default_project_ref", prompt: "Default project ref (20-char id from project URL)", optional: true },
    { key: "org_id", prompt: "Organization id", optional: true },
  ],
  github: [
    { key: "pat", prompt: "GitHub Personal Access Token (ghp_... or github_pat_...)", secret: true },
    { key: "username", prompt: "GitHub username", optional: true },
  ],
  vercel: [
    { key: "token", prompt: "Vercel API token", secret: true },
    { key: "team_id", prompt: "Team id (team_...)", optional: true },
  ],
  stripe: [
    { key: "secret_key", prompt: "Stripe secret key (sk_test_... or sk_live_...)", secret: true },
    { key: "mode", prompt: "Mode (test|live)", default: "test" },
  ],
};

const TOKEN_URLS: Record<Service, { url: string; hint: string }> = {
  supabase: {
    url: "https://supabase.com/dashboard/account/tokens",
    hint: "Click 'Generate new token'. Token is shown only once — copy it before closing.",
  },
  github: {
    url: "https://github.com/settings/personal-access-tokens",
    hint: "Fine-grained recommended. Grant 'Contents: read' + 'Issues: read/write' minimum.",
  },
  vercel: {
    url: "https://vercel.com/account/tokens",
    hint: "Click 'Create Token'. Note team id (team_...) separately if relevant.",
  },
  stripe: {
    url: "https://dashboard.stripe.com/apikeys",
    hint: "Restricted read-only key recommended. Be careful with live keys.",
  },
};

async function collectCreds(service: Service): Promise<Record<string, string | undefined>> {
  const out: Record<string, string | undefined> = {};
  for (const f of CRED_FIELDS[service]) {
    while (true) {
      let v: string | undefined;
      if (f.secret) {
        v = await askPassword(f.prompt);
      } else if (f.optional) {
        v = await askOptional(f.prompt);
      } else {
        v = await ask(f.prompt, { defaultValue: f.default });
      }
      const value = (v ?? "").trim() || f.default;
      if (!value && !f.optional) {
        log.warn("Required field — please try again.");
        continue;
      }
      if (f.secret && value) {
        log.success(`Pasted: ${c.dim(redactForDisplay(value))}`);
      }
      out[f.key] = value;
      break;
    }
  }
  return out;
}

export async function cmdAdd(serviceArg: string): Promise<void> {
  const service = ServiceSchema.parse(serviceArg) as Service;
  intro(c.bgCyan(c.black(` mcpvault add ${service} `)));

  const vault = await openWithCachedKey();
  const tokenInfo = TOKEN_URLS[service];

  note(`Get a token at:\n${c.cyan(tokenInfo.url)}\n\n${c.dim(tokenInfo.hint)}`, "Where to get a token");
  const wantsBrowser = await confirm("Open token page in your browser?", false);
  if (wantsBrowser) {
    try {
      await open(tokenInfo.url);
    } catch {
      log.warn("Couldn't auto-open browser — open the URL above manually.");
    }
  }

  while (true) {
    const meta = {
      label: await ask("Label", {
        placeholder: "e.g. client-acme, personal",
        validate: (v) => (/^[a-zA-Z0-9_\-]+$/.test(v) ? undefined : "Use letters, digits, - and _ only"),
      }),
      description: await askOptional("Description (for fuzzy search)", { placeholder: "e.g. Acme Corp production" }),
      tags: await askOptional("Tags (comma-separated)", { placeholder: "e.g. work, production" }),
    };

    if (vault.has(service, meta.label)) {
      log.error(`A ${service} account labeled "${meta.label}" already exists.`);
      const retry = await confirm("Pick a different label?", true);
      if (!retry) {
        outro(c.yellow("Aborted."));
        return;
      }
      continue;
    }

    const credInputs = await collectCreds(service);
    if (service === "stripe" && credInputs.mode && !["test", "live"].includes(credInputs.mode)) {
      log.error("mode must be 'test' or 'live'");
      continue;
    }
    try {
      CredentialsByService[service].parse(credInputs);
    } catch (e: any) {
      log.error(`Invalid credentials: ${e.message}`);
      continue;
    }

    // Validate against real API before saving.
    const s = spinner();
    s.start(`Validating with ${service} API`);
    const result = await validateCredentials(service, credInputs as Record<string, unknown>);
    if (!result.ok) {
      s.stop(c.red("Validation failed"));
      log.error(result.error ?? "Unknown error");
      const retry = await confirm("Re-enter credentials? (the token is probably wrong)", true);
      if (!retry) {
        outro(c.yellow("Aborted."));
        return;
      }
      continue;
    }
    s.stop(`${c.green("✓")} Authenticated as ${c.bold(result.identity ?? "(unknown)")}`);

    const now = new Date().toISOString();
    const account: Account = {
      service,
      label: meta.label,
      description: meta.description ?? "",
      tags: meta.tags ? meta.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      credentials: credInputs as Record<string, unknown>,
      created_at: now,
      updated_at: now,
    };

    note(summarize(account), "Review");
    const ok = await confirm("Save this account?", true);
    if (!ok) {
      const retry = await confirm("Re-enter fields?", true);
      if (!retry) {
        outro(c.yellow("Aborted."));
        return;
      }
      continue;
    }

    vault.add(account);
    await persistVault(vault);
    await logEvent({ kind: "add", service, label: account.label });

    outro(
      `${c.green("✓")} Saved ${c.bold(service)} account ${c.cyan(account.label)}.\n` +
        `Activate: ${c.dim(`mcpvault activate ${service} ${account.label}`)}\n` +
        `Or ask Claude: ${c.dim(`"switch to ${account.label}"`)}`,
    );
    return;
  }
}

function summarize(account: Account): string {
  const lines: string[] = [];
  lines.push(`${c.dim("service:")}     ${account.service}`);
  lines.push(`${c.dim("label:")}       ${c.cyan(account.label)}`);
  lines.push(`${c.dim("description:")} ${account.description || c.dim("(none)")}`);
  lines.push(`${c.dim("tags:")}        ${account.tags.length ? account.tags.join(", ") : c.dim("(none)")}`);
  lines.push(`${c.dim("credentials:")}`);
  for (const [k, v] of Object.entries(account.credentials)) {
    const isSecret = /pat|token|key|secret/i.test(k);
    const display = isSecret && typeof v === "string" ? c.dim(redactForDisplay(v)) : String(v ?? c.dim("(none)"));
    lines.push(`  ${c.dim(k + ":")}  ${display}`);
  }
  return lines.join("\n");
}
