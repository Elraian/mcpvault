import { intro, outro, log } from "@clack/prompts";
import { spawn } from "node:child_process";
import { c, spinner, confirm } from "./prompt.js";
import { VERSION } from "../version.js";

const PACKAGE = "@elraian/mcpvault";

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${PACKAGE}/latest`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

function runNpmInstall(): Promise<number> {
  return new Promise((resolve) => {
    // Use shell:true on Windows so `npm.cmd` resolves on PATH without an extension.
    const child = spawn("npm", ["install", "-g", `${PACKAGE}@latest`], {
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

export async function cmdUpgrade(): Promise<void> {
  intro(c.bgCyan(c.black(" mcpvault upgrade ")));

  const s = spinner();
  s.start("Checking npm for the latest version");
  const latest = await fetchLatestVersion();
  if (!latest) {
    s.stop(c.red("Couldn't reach npm registry"));
    log.error("Check your internet connection, then run `npm install -g @elraian/mcpvault@latest` manually.");
    process.exit(1);
  }
  s.stop(`${c.green("✓")} Latest on npm: ${c.bold(`v${latest}`)}  ·  installed: ${c.dim(`v${VERSION}`)}`);

  if (latest === VERSION) {
    outro(`${c.green("You're up to date.")} (v${VERSION})`);
    return;
  }

  const ok = await confirm(`Upgrade from ${c.cyan(`v${VERSION}`)} → ${c.cyan(`v${latest}`)}?`, true);
  if (!ok) {
    outro(c.yellow("Cancelled."));
    return;
  }

  log.info(`Running: ${c.dim(`npm install -g ${PACKAGE}@latest`)}`);
  const code = await runNpmInstall();
  if (code !== 0) {
    log.error("npm install failed. You can retry manually.");
    outro(c.red("Upgrade failed."));
    process.exit(code);
  }

  outro(`${c.green("✓")} Upgraded. Run ${c.cyan("mcpvault --version")} to confirm.`);
}
