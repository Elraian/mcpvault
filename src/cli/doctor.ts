import { access, stat } from "node:fs/promises";
import { VAULT_FILE, VAULT_DIR, LOG_FILE } from "../paths.js";
import { isUnlocked } from "../session.js";
import { readActive } from "../active.js";
import { c } from "./prompt.js";

export async function cmdDoctor(): Promise<void> {
  let issues = 0;
  const check = async (label: string, fn: () => Promise<string | true>) => {
    try {
      const r = await fn();
      if (r === true) process.stdout.write(`  ${c.green("✓")} ${label}\n`);
      else {
        process.stdout.write(`  ${c.yellow("!")} ${label}: ${c.dim(r)}\n`);
        issues++;
      }
    } catch (e: any) {
      process.stdout.write(`  ${c.red("✗")} ${label}: ${c.red(e.message)}\n`);
      issues++;
    }
  };

  process.stdout.write(`\n${c.bold("mvault doctor")}\n`);
  process.stdout.write(`  ${c.dim("vault dir:")} ${VAULT_DIR}\n\n`);

  await check("vault file exists", async () => {
    try {
      const s = await stat(VAULT_FILE);
      return s.isFile() ? true : "not a file";
    } catch {
      return "not initialized — run `mvault init`";
    }
  });

  await check("vault unlocked (OS keyring has session key)", async () => (isUnlocked() ? true : "locked — run `mvault unlock`"));

  await check("active.json readable", async () => {
    try {
      await readActive();
      return true;
    } catch (e: any) {
      return e.message;
    }
  });

  await check("audit log writable", async () => {
    try {
      await access(LOG_FILE);
      return true;
    } catch {
      return "no log yet (will be created on first event)";
    }
  });

  if (issues === 0) {
    process.stdout.write(`\n${c.green("All checks passed.")}\n`);
  } else {
    process.stdout.write(`\n${c.yellow(`${issues} issue(s) found.`)}\n`);
    if (issues > 0) process.exit(1);
  }
}
