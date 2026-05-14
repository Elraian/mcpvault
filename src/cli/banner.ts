import { isUnlocked } from "../session.js";
import { openWithCachedKey } from "../session.js";
import { readActive } from "../active.js";
import { vaultFileExists } from "../vault.js";
import { VAULT_DIR } from "../paths.js";

// Brand colors lifted from landing-next/app/globals.css (true-color ANSI).
//   acid green #bef264 — primary accent
//   acid-300  #d9f99d — softer accent
//   acid-100  #ecfccb — softest accent
//   rose      #fb7185 — error / warning
//   muted     #a8a8ae — secondary text
//   faint     #6b6b73 — tertiary
const ESC = "\x1b";
const RESET = `${ESC}[0m`;
const BOLD = `${ESC}[1m`;
const DIM = `${ESC}[2m`;

const acid = (s: string) => `${ESC}[38;2;190;242;100m${s}${RESET}`;
const acidSoft = (s: string) => `${ESC}[38;2;217;249;157m${s}${RESET}`;
const rose = (s: string) => `${ESC}[38;2;251;113;133m${s}${RESET}`;
const muted = (s: string) => `${ESC}[38;2;168;168;174m${s}${RESET}`;
const faint = (s: string) => `${ESC}[38;2;107;107;115m${s}${RESET}`;
const bold = (s: string) => `${BOLD}${s}${RESET}`;
const dim = (s: string) => `${DIM}${s}${RESET}`;

// "mcpvault" in ANSI Shadow / Big Blocks. 8 glyphs wide-ish, 6 rows tall.
const LOGO_LINES = [
  "   ███╗   ███╗ ██████╗██████╗ ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗",
  "   ████╗ ████║██╔════╝██╔══██╗██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝",
  "   ██╔████╔██║██║     ██████╔╝██║   ██║███████║██║   ██║██║     ██║   ",
  "   ██║╚██╔╝██║██║     ██╔═══╝ ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   ",
  "   ██║ ╚═╝ ██║╚██████╗██║      ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   ",
  "   ╚═╝     ╚═╝ ╚═════╝╚═╝       ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   ",
];

interface StatusSnapshot {
  initialized: boolean;
  unlocked: boolean;
  accountsByService: Record<string, number>;
  activeByService: Record<string, string>;
}

async function gatherStatus(): Promise<StatusSnapshot> {
  const initialized = await vaultFileExists();
  const unlocked = isUnlocked();
  let accountsByService: Record<string, number> = {};
  let activeByService: Record<string, string> = {};
  if (initialized && unlocked) {
    try {
      const v = await openWithCachedKey();
      const rows = v.list();
      for (const r of rows) accountsByService[r.service] = (accountsByService[r.service] ?? 0) + 1;
      const a = await readActive();
      activeByService = a.active as Record<string, string>;
    } catch {
      // Best-effort — banner shouldn't fail on stat issues.
    }
  }
  return { initialized, unlocked, accountsByService, activeByService };
}

function box(lines: string[], padLeft = 2): string {
  const width = Math.max(...lines.map((l) => stripAnsi(l).length)) + padLeft * 2;
  const top = faint("┌" + "─".repeat(width) + "┐");
  const bottom = faint("└" + "─".repeat(width) + "┘");
  const body = lines.map((l) => {
    const realLen = stripAnsi(l).length;
    const pad = " ".repeat(width - realLen - padLeft * 2);
    return `${faint("│")}${" ".repeat(padLeft)}${l}${pad}${" ".repeat(padLeft)}${faint("│")}`;
  });
  return [top, ...body, bottom].join("\n");
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function statusLines(s: StatusSnapshot): string[] {
  const out: string[] = [];
  if (!s.initialized) {
    out.push(`${rose("●")} ${bold("not initialized")}`);
    out.push(faint("  run `mcpvault init` to create the vault"));
    return out;
  }
  if (!s.unlocked) {
    out.push(`${rose("●")} ${bold("locked")}`);
    out.push(faint("  run `mcpvault unlock` to use accounts"));
    return out;
  }
  out.push(`${acid("●")} ${bold("unlocked")}`);
  const services = Object.keys(s.accountsByService);
  if (services.length === 0) {
    out.push(faint("  no accounts yet — try `mcpvault add supabase`"));
  } else {
    for (const svc of services) {
      const count = s.accountsByService[svc];
      const active = s.activeByService[svc];
      const activeStr = active ? `${faint("active:")} ${acid(active)}` : faint("none active");
      out.push(`  ${muted(svc.padEnd(10))} ${count} ${faint(count === 1 ? "account" : "accounts")}   ${activeStr}`);
    }
  }
  return out;
}

const TAGLINE = "Local credential vault for AI agents";
const META = "v0.1.0  ·  by AISIDE  ·  github.com/Elraian/mcpvault";

const SUGGESTIONS_INIT: string[] = [
  `${acid("mcpvault init")}                  create the vault`,
  `${acid("mcpvault setup")}                 wire into Claude / Cursor`,
];
const SUGGESTIONS_LOCKED: string[] = [
  `${acid("mcpvault unlock")}                unlock the vault`,
  `${acid("mcpvault setup")}                 wire into Claude / Cursor`,
];
const SUGGESTIONS_READY: string[] = [
  `${acid("mcpvault add <service>")}         add an account`,
  `${acid("mcpvault list")}                  see all accounts`,
  `${acid("mcpvault setup")}                 wire into Claude / Cursor`,
  `${acid("mcpvault --help")}                full command list`,
];

export async function printWelcome(): Promise<void> {
  const s = await gatherStatus();
  const out: string[] = [];
  out.push("");
  out.push(...LOGO_LINES.map((l) => acid(l)));
  out.push("");
  out.push(`   ${muted(TAGLINE)}`);
  out.push(`   ${faint(META)}`);
  out.push("");
  out.push("   " + box(statusLines(s)).split("\n").join("\n   "));
  out.push("");
  out.push(`   ${faint("vault dir:")} ${dim(VAULT_DIR)}`);
  out.push("");
  out.push(`   ${faint("Get started:")}`);
  const suggestions = !s.initialized ? SUGGESTIONS_INIT : !s.unlocked ? SUGGESTIONS_LOCKED : SUGGESTIONS_READY;
  for (const line of suggestions) out.push(`     ${line}`);
  out.push("");
  process.stdout.write(out.join("\n") + "\n");
}

export const brand = {
  acid,
  acidSoft,
  rose,
  muted,
  faint,
  bold,
  dim,
};
