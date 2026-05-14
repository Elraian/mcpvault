import { intro, outro, log } from "@clack/prompts";
import { unlockWithPassword, lockSession, isUnlocked } from "../session.js";
import { askPassword, spinner, c } from "./prompt.js";
import { logEvent } from "../log.js";

export async function cmdUnlock(): Promise<void> {
  if (isUnlocked()) {
    log.info("Vault is already unlocked. Run `mvault lock` first if you want to re-enter the password.");
    return;
  }
  intro(c.bgCyan(c.black(" mvault unlock ")));
  const pw = await askPassword("Master password");
  const s = spinner();
  s.start("Deriving key (Argon2id, ~5s)");
  try {
    await unlockWithPassword(pw);
    await logEvent({ kind: "unlock", ok: true });
    s.stop(`${c.green("✓")} Unlocked. Session key cached in OS keyring.`);
    outro("");
  } catch (e: any) {
    await logEvent({ kind: "unlock", ok: false });
    s.stop(c.red("Failed"));
    log.error(e.message);
    process.exit(1);
  }
}

export async function cmdLock(): Promise<void> {
  lockSession();
  await logEvent({ kind: "lock" });
  log.success("Vault locked. Cached session key cleared.");
}

export async function cmdStatus(): Promise<void> {
  if (isUnlocked()) {
    log.success("Unlocked");
  } else {
    log.warn("Locked");
  }
}
