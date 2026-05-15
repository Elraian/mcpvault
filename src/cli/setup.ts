import { intro, outro, note, log } from "@clack/prompts";
import { readFile, writeFile, rename, mkdir, access, copyFile } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pickMany, confirm, c } from "./prompt.js";

// Resolve mcpvault's own dist/index.js so the MCP entries point at this install.
function resolveEntry(): string {
  // Built code lives at <pkg>/dist/cli/setup.js. Walk up to dist/index.js.
  const here = fileURLToPath(import.meta.url);
  const distDir = dirname(dirname(here));
  return join(distDir, "index.js");
}

type ClientId = "claude-code" | "claude-desktop" | "cursor" | "cline" | "windsurf" | "codex" | "custom";

type ConfigFormat = "json" | "toml";

interface ClientTarget {
  id: ClientId;
  name: string;
  configPath: string;
  /** Whether the config file is allowed to be created if it doesn't exist. */
  ensure: boolean;
  format: ConfigFormat;
}

/** Locate the user-data dir for a VS Code-flavored editor. Cline lives inside this. */
function vscodeUserDir(home: string, pf: NodeJS.Platform, app: "Code" | "Code - Insiders"): string {
  if (pf === "win32") return join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), app, "User");
  if (pf === "darwin") return join(home, "Library", "Application Support", app, "User");
  return join(home, ".config", app, "User");
}

function detect(): ClientTarget[] {
  const home = homedir();
  const pf = platform();
  const targets: ClientTarget[] = [];

  // Claude Code (user-level)
  targets.push({
    id: "claude-code",
    name: "Claude Code",
    configPath: join(home, ".claude.json"),
    ensure: false,
    format: "json",
  });

  // Claude Desktop
  let claudeDesktopPath: string;
  if (pf === "win32") {
    claudeDesktopPath = join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
  } else if (pf === "darwin") {
    claudeDesktopPath = join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else {
    claudeDesktopPath = join(home, ".config", "Claude", "claude_desktop_config.json");
  }
  targets.push({
    id: "claude-desktop",
    name: "Claude Desktop",
    configPath: claudeDesktopPath,
    ensure: true,
    format: "json",
  });

  // Cursor (user-level mcp config)
  targets.push({
    id: "cursor",
    name: "Cursor",
    configPath: join(home, ".cursor", "mcp.json"),
    ensure: true,
    format: "json",
  });

  // Cline (VS Code extension by saoudrizwan)
  targets.push({
    id: "cline",
    name: "Cline (VS Code)",
    configPath: join(
      vscodeUserDir(home, pf, "Code"),
      "globalStorage",
      "saoudrizwan.claude-dev",
      "settings",
      "cline_mcp_settings.json",
    ),
    ensure: true,
    format: "json",
  });

  // Windsurf (Codeium)
  targets.push({
    id: "windsurf",
    name: "Windsurf",
    configPath: join(home, ".codeium", "windsurf", "mcp_config.json"),
    ensure: true,
    format: "json",
  });

  // Codex CLI (OpenAI) — TOML format, uses [mcp_servers.NAME] sections
  targets.push({
    id: "codex",
    name: "Codex CLI",
    configPath: join(home, ".codex", "config.toml"),
    ensure: true,
    format: "toml",
  });

  return targets;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

interface PatchResult {
  client: string;
  configPath: string;
  added: string[];
  updated: string[];
  backupPath?: string;
}

interface ServerEntry {
  command: string;
  args: string[];
}

async function patchJson(client: ClientTarget, entries: Record<string, ServerEntry>): Promise<PatchResult> {
  const present = await exists(client.configPath);

  let cfg: any = {};
  if (present) {
    const raw = await readFile(client.configPath, "utf8");
    try {
      cfg = JSON.parse(raw);
    } catch (e: any) {
      throw new Error(`${client.configPath} is not valid JSON: ${e.message}`);
    }
  } else if (!client.ensure) {
    throw new Error(`No config at ${client.configPath} — skipping`);
  }

  cfg.mcpServers = cfg.mcpServers ?? {};
  const added: string[] = [];
  const updated: string[] = [];
  for (const [name, value] of Object.entries(entries)) {
    if (name in cfg.mcpServers) updated.push(name);
    else added.push(name);
    cfg.mcpServers[name] = value;
  }

  let backupPath: string | undefined;
  if (present) {
    backupPath = `${client.configPath}.mcpvault-bak-${Date.now()}`;
    await copyFile(client.configPath, backupPath);
  } else {
    await mkdir(dirname(client.configPath), { recursive: true });
  }

  const tmp = `${client.configPath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  await rename(tmp, client.configPath);

  return { client: client.name, configPath: client.configPath, added, updated, backupPath };
}

async function patchToml(client: ClientTarget, entries: Record<string, ServerEntry>): Promise<PatchResult> {
  const TOML = await import("smol-toml");
  const present = await exists(client.configPath);

  let cfg: Record<string, any> = {};
  if (present) {
    const raw = await readFile(client.configPath, "utf8");
    try {
      cfg = TOML.parse(raw) as Record<string, any>;
    } catch (e: any) {
      throw new Error(`${client.configPath} is not valid TOML: ${e.message}`);
    }
  } else if (!client.ensure) {
    throw new Error(`No config at ${client.configPath} — skipping`);
  }

  cfg.mcp_servers = (cfg.mcp_servers as Record<string, ServerEntry> | undefined) ?? {};
  const added: string[] = [];
  const updated: string[] = [];
  for (const [name, value] of Object.entries(entries)) {
    if (name in cfg.mcp_servers) updated.push(name);
    else added.push(name);
    cfg.mcp_servers[name] = value;
  }

  let backupPath: string | undefined;
  if (present) {
    backupPath = `${client.configPath}.mcpvault-bak-${Date.now()}`;
    await copyFile(client.configPath, backupPath);
  } else {
    await mkdir(dirname(client.configPath), { recursive: true });
  }

  const tmp = `${client.configPath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, TOML.stringify(cfg), { mode: 0o600 });
  await rename(tmp, client.configPath);

  return { client: client.name, configPath: client.configPath, added, updated, backupPath };
}

async function patch(client: ClientTarget, entries: Record<string, ServerEntry>): Promise<PatchResult> {
  if (client.format === "toml") return patchToml(client, entries);
  return patchJson(client, entries);
}

interface SetupOptions {
  /** Override target: skip detection, patch this specific file. Format inferred from extension. */
  configPath?: string;
}

export async function cmdSetup(opts: SetupOptions = {}): Promise<void> {
  intro(c.bgCyan(c.black(" mcpvault setup ")));

  const entry = resolveEntry();
  const { PROXY_SERVICES } = await import("../proxies/registry.js");
  const entries: Record<string, ServerEntry> = {
    vault: { command: "node", args: [entry, "server"] },
    // First-party
    "vault-supabase": { command: "node", args: [entry, "wrap", "supabase"] },
    "vault-github": { command: "node", args: [entry, "wrap", "github"] },
    "vault-vercel": { command: "node", args: [entry, "wrap", "vercel"] },
    "vault-stripe": { command: "node", args: [entry, "wrap", "stripe"] },
  };
  // Proxy services
  for (const svc of PROXY_SERVICES) {
    entries[`vault-${svc}`] = { command: "node", args: [entry, "wrap", svc] };
  }

  // --config <path> escape hatch: patch any arbitrary config file the user points us at.
  if (opts.configPath) {
    const format: ConfigFormat = opts.configPath.toLowerCase().endsWith(".toml") ? "toml" : "json";
    const customTarget: ClientTarget = {
      id: "custom",
      name: `Custom (${opts.configPath})`,
      configPath: opts.configPath,
      ensure: true,
      format,
    };
    note(
      `Patching ${c.bold(format.toUpperCase())} file at:\n  ${c.cyan(opts.configPath)}\n\nWill add 5 mcpvault server entries (vault, vault-supabase, vault-github, vault-vercel, vault-stripe). Existing entries preserved.`,
      "Custom config target",
    );
    const ok = await confirm("Proceed?", true);
    if (!ok) {
      outro(c.yellow("Cancelled."));
      return;
    }
    try {
      const r = await patch(customTarget, entries);
      const parts: string[] = [];
      if (r.added.length) parts.push(`${c.green("added")} ${r.added.join(", ")}`);
      if (r.updated.length) parts.push(`${c.yellow("updated")} ${r.updated.join(", ")}`);
      log.success(`${r.client}: ${parts.join(" · ") || "no changes"}`);
      if (r.backupPath) log.info(`  backup: ${c.dim(r.backupPath)}`);
    } catch (e: any) {
      log.error(`Failed: ${e.message}`);
      outro(c.red("Setup failed."));
      process.exit(1);
    }
    outro(`${c.green("✓")} Done. Restart the chat client when ready.`);
    return;
  }

  // Default flow: auto-detect supported clients + let user pick.
  const targets = detect();
  const targetStatus = await Promise.all(
    targets.map(async (t) => ({ ...t, present: await exists(t.configPath) })),
  );

  note(
    targetStatus
      .map((t) => {
        const marker = t.present ? c.green("●") : c.dim("○");
        const path = c.dim(t.configPath);
        const fmt = t.format === "toml" ? c.dim(" (TOML)") : "";
        return `${marker} ${c.bold(t.name)}${fmt}\n   ${path}${t.present ? "" : c.dim(" (not found yet — will be created)")}`;
      })
      .join("\n"),
    "Detected chat clients",
  );

  const picks = await pickMany<ClientId>(
    "Which to wire up?",
    targetStatus.map((t) => ({
      value: t.id,
      label: t.name,
      hint: t.present ? "existing — will merge" : "config will be created",
    })),
    true,
  );

  if (picks.length === 0) {
    outro(c.yellow("Nothing selected."));
    return;
  }

  const chosen = targetStatus.filter((t) => picks.includes(t.id));
  for (const t of chosen) {
    if (!t.present) {
      const ok = await confirm(`${t.name} config does not exist. Create it at ${c.dim(t.configPath)}?`, true);
      if (!ok) {
        log.info(`Skipped ${t.name}.`);
        continue;
      }
    }
    try {
      const r = await patch(t, entries);
      const parts: string[] = [];
      if (r.added.length) parts.push(`${c.green("added")} ${r.added.join(", ")}`);
      if (r.updated.length) parts.push(`${c.yellow("updated")} ${r.updated.join(", ")}`);
      log.success(`${t.name}: ${parts.join(" · ") || "no changes"}`);
      if (r.backupPath) log.info(`  backup: ${c.dim(r.backupPath)}`);
    } catch (e: any) {
      log.error(`${t.name}: ${e.message}`);
    }
  }

  outro(
    `${c.green("✓")} Setup complete. ${c.bold("Restart your chat client(s)")} to load the new tools.\n` +
      `  Claude Code:    type ${c.cyan("/restart")} or reopen the window\n` +
      `  Claude Desktop: fully quit (tray → Quit) and reopen\n` +
      `  Cursor:         reload window (Ctrl+Shift+P → "Developer: Reload Window")\n` +
      `  Cline:          reload VS Code window\n` +
      `  Windsurf:       restart the app\n` +
      `  Codex CLI:      restart codex` +
      `\n\n${c.dim("Using a client we don't auto-detect? Run `mcpvault setup --config <path-to-mcp-config>`.")}`,
  );
}
