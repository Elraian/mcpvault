import { intro, outro, note, log } from "@clack/prompts";
import { openWithCachedKey } from "../session.js";
import { persistVault } from "../vault.js";
import { CredentialsByService, ServiceSchema, type Service } from "../schema.js";
import { ask, askOptional, askPassword, confirm, pickMany, spinner, redactForDisplay, c } from "./prompt.js";
import { logEvent } from "../log.js";
import { validateCredentials } from "../validate.js";

interface CredField {
  key: string;
  prompt: string;
  secret?: boolean;
  optional?: boolean;
}

const CRED_FIELDS: Record<Service, CredField[]> = {
  supabase: [
    { key: "pat", prompt: "Supabase PAT (sbp_...)", secret: true },
    { key: "default_project_ref", prompt: "Default project ref", optional: true },
    { key: "org_id", prompt: "Organization id", optional: true },
  ],
  github: [
    { key: "pat", prompt: "GitHub PAT", secret: true },
    { key: "username", prompt: "Username", optional: true },
  ],
  vercel: [
    { key: "token", prompt: "Vercel API token", secret: true },
    { key: "team_id", prompt: "Team id", optional: true },
  ],
  stripe: [
    { key: "secret_key", prompt: "Stripe secret key", secret: true },
    { key: "mode", prompt: "Mode (test|live)" },
  ],
};

export async function cmdUpdate(serviceArg: string, label: string): Promise<void> {
  const service = ServiceSchema.parse(serviceArg) as Service;
  const vault = await openWithCachedKey();
  const existing = vault.get(service, label);

  intro(c.bgCyan(c.black(` mvault update ${service} ${label} `)));

  const picks = await pickMany<"description" | "tags" | "credentials">(
    "What to change?",
    [
      { value: "description", label: "Description", hint: existing.description || "(none)" },
      { value: "tags", label: "Tags", hint: existing.tags.join(", ") || "(none)" },
      { value: "credentials", label: "Credentials (rotate token)", hint: "PAT / token / key" },
    ],
    true,
  );

  const patch: { description?: string; tags?: string[]; credentials?: Record<string, unknown> } = {};

  if (picks.includes("description")) {
    const v = await askOptional("New description", { placeholder: existing.description || "(none)" });
    patch.description = v ?? existing.description;
  }
  if (picks.includes("tags")) {
    const v = await askOptional("New tags (comma-separated)", { placeholder: existing.tags.join(", ") || "(none)" });
    patch.tags = v ? v.split(",").map((s) => s.trim()).filter(Boolean) : existing.tags;
  }
  if (picks.includes("credentials")) {
    log.info("Leave blank to keep current value.");
    const merged: Record<string, unknown> = { ...existing.credentials };
    for (const f of CRED_FIELDS[service]) {
      const v = f.secret ? await askPassword(`${f.prompt} (blank=keep)`) : await askOptional(`${f.prompt} (blank=keep)`);
      const value = (v ?? "").trim();
      if (!value) continue;
      merged[f.key] = value;
      if (f.secret) log.success(`Pasted: ${c.dim(redactForDisplay(value))}`);
    }
    try {
      CredentialsByService[service].parse(merged);
    } catch (e: any) {
      log.error(`Invalid resulting credentials: ${e.message}`);
      outro(c.yellow("Aborted."));
      return;
    }
    // Validate before saving.
    const s = spinner();
    s.start(`Validating with ${service} API`);
    const r = await validateCredentials(service, merged);
    if (!r.ok) {
      s.stop(c.red("Validation failed"));
      log.error(r.error ?? "Unknown error");
      outro(c.yellow("Aborted (vault unchanged)."));
      return;
    }
    s.stop(`${c.green("✓")} Authenticated as ${c.bold(r.identity ?? "(unknown)")}`);
    patch.credentials = merged;
  }

  if (Object.keys(patch).length === 0) {
    outro("No changes selected.");
    return;
  }

  const summary: string[] = [];
  if (patch.description !== undefined) summary.push(`description: ${patch.description}`);
  if (patch.tags !== undefined) summary.push(`tags: ${patch.tags.join(", ") || "(none)"}`);
  if (patch.credentials) {
    summary.push("credentials:");
    for (const [k, v] of Object.entries(patch.credentials)) {
      const isSecret = /pat|token|key|secret/i.test(k);
      summary.push(`  ${k}: ${isSecret && typeof v === "string" ? c.dim(redactForDisplay(v)) : String(v)}`);
    }
  }
  note(summary.join("\n"), "Changes");

  const ok = await confirm("Apply?", true);
  if (!ok) {
    outro(c.yellow("Cancelled."));
    return;
  }
  vault.update(service, label, patch);
  await persistVault(vault);
  await logEvent({ kind: "update", service, label });
  outro(`${c.green("✓")} Updated ${service} account "${label}".`);
}
