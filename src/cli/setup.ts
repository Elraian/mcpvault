import { intro, outro, note, log } from "@clack/prompts";
import { readFile, writeFile, rename, mkdir, access, copyFile } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pickMany, confirm, c } from "./prompt.js";

// Resolve mvault's own dist/index.js so the MCP entries point at this install.
function resolveEntry(): string {
  // Built code lives at <pkg>/dist/cli/setup.js. Walk up to dist/index.js.
  const here = fileURLToPath(import.meta.url);
  const distDir = dirname(dirname(here));
  return join(distDir, "index.js");
}

interface ClientTarget {
  id: "claude-code" | "claude-desktop" | "cursor";
  name: string;
  configPath: string;
  /** Some configs (Claude Desktop, Cursor) require the file to exist with valid JSON */
  ensure: boolean;
  /** Slug prefix for entry names within mcpServers */
  prefix: string;
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
    prefix: "vault",
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
    prefix: "vault",
  });

  // Cursor
  targets.push({
    id: "cursor",
    name: "Cursor",
    configPath: join(home, ".cursor", "mcp.json"),
    ensure: true,
    prefix: "vault",
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

async function patch(client: ClientTarget, entries: Record<string, unknown>): Promise<PatchResult> {
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

  // Backup existing file before mutation.
  let backupPath: string | undefined;
  if (present) {
    backupPath = `${client.configPath}.mvault-bak-${Date.now()}`;
    await copyFile(client.configPath, backupPath);
  } else {
    await mkdir(dirname(client.configPath), { recursive: true });
  }

  const tmp = `${client.configPath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  await rename(tmp, client.configPath);

  return { client: client.name, configPath: client.configPath, added, updated, backupPath };
}

export async function cmdSetup(): Promise<void> {
  intro(c.bgCyan(c.black(" mvault setup ")));

  const entry = resolveEntry();
  const entries: Record<string, unknown> = {
    vault: { command: "node", args: [entry, "server"] },
    "vault-supabase": { command: "node", args: [entry, "wrap", "supabase"] },
    "vault-github": { command: "node", args: [entry, "wrap", "github"] },
    "vault-vercel": { command: "node", args: [entry, "wrap", "vercel"] },
    "vault-stripe": { command: "node", args: [entry, "wrap", "stripe"] },
  };

  const targets = detect();
  const targetStatus = await Promise.all(
    targets.map(async (t) => ({ ...t, present: await exists(t.configPath) })),
  );

  note(
    targetStatus
      .map((t) => {
        const marker = t.present ? c.green("●") : c.dim("○");
        const path = c.dim(t.configPath);
        return `${marker} ${c.bold(t.name)}\n   ${path}${t.present ? "" : c.dim(" (not found yet — will be created)")}`;
      })
      .join("\n"),
    "Detected chat clients",
  );

  const picks = await pickMany<"claude-code" | "claude-desktop" | "cursor">(
    "Which to wire up?",
    targetStatus.map((t) => ({
      value: t.id,
      label: t.name,
      hint: t.present ? "existing config — will merge" : "config will be created",
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
      `  Cursor:         reload window (Ctrl+Shift+P → "Developer: Reload Window")`,
  );
}
