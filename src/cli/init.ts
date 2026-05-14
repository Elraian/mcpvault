import { intro, outro, note, log } from "@clack/prompts";
import { createVault, vaultFileExists } from "../vault.js";
import { VAULT_FILE } from "../paths.js";
import { unlockWithPassword } from "../session.js";
import { askPassword, spinner, c } from "./prompt.js";

export async function cmdInit(): Promise<void> {
  intro(c.bgCyan(c.black(" mcpvault init ")));

  if (await vaultFileExists()) {
    log.error(`A vault already exists at ${VAULT_FILE}.`);
    log.info("Refusing to overwrite. Delete the file manually if you really want to start over.");
    process.exit(1);
  }

  note(
    `Path: ${c.cyan(VAULT_FILE)}\n\n` +
      `You'll set a master password now. It encrypts everything stored in the vault.\n` +
      `${c.yellow("If you forget it, the vault is unrecoverable.")} Save it in a password manager.`,
    "Setup",
  );

  const pw1 = await askPassword("Master password (min 8 chars)");
  if (pw1.length < 8) {
    log.error("Password too short. Aborting.");
    process.exit(1);
  }
  const pw2 = await askPassword("Confirm master password");
  if (pw1 !== pw2) {
    log.error("Passwords don't match. Aborting.");
    process.exit(1);
  }

  const s = spinner();
  s.start("Deriving key (Argon2id, ~5s) and creating encrypted vault");
  await createVault(pw1);
  s.message("Caching session key in OS keyring");
  await unlockWithPassword(pw1);
  s.stop("Vault created and unlocked");

  outro(
    `${c.green("Done.")} Next steps:\n` +
      `  ${c.cyan("mcpvault add supabase")}   — add a Supabase account\n` +
      `  ${c.cyan("mcpvault setup")}          — wire into Claude Code / Desktop / Cursor`,
  );
}
