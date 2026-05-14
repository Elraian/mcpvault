#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("mcpvault")
  .description("Local MCP credential vault — multi-account credentials for AI agents")
  .version("0.1.0");

// ─── Vault management (user-facing) ─────────────────────────────────────────────

program
  .command("init")
  .description("Create a new vault and set the master password")
  .action(async () => {
    const { cmdInit } = await import("./cli/init.js");
    await cmdInit();
  });

program
  .command("setup")
  .description("Auto-wire vault into Claude Code / Claude Desktop / Cursor")
  .action(async () => {
    const { cmdSetup } = await import("./cli/setup.js");
    await cmdSetup();
  });

program
  .command("unlock")
  .description("Unlock the vault (caches session key in OS keyring)")
  .action(async () => {
    const { cmdUnlock } = await import("./cli/unlock.js");
    await cmdUnlock();
  });

program
  .command("lock")
  .description("Lock the vault (clears the cached session key)")
  .action(async () => {
    const { cmdLock } = await import("./cli/unlock.js");
    await cmdLock();
  });

program
  .command("status")
  .description("Print whether the vault is unlocked")
  .action(async () => {
    const { cmdStatus } = await import("./cli/unlock.js");
    await cmdStatus();
  });

program
  .command("add <service>")
  .description("Add an account (service: supabase, github, vercel, stripe)")
  .action(async (service: string) => {
    const { cmdAdd } = await import("./cli/add.js");
    await cmdAdd(service);
  });

program
  .command("list [service]")
  .description("List accounts (optionally filtered by service)")
  .action(async (service?: string) => {
    const { cmdList } = await import("./cli/list.js");
    await cmdList(service);
  });

program
  .command("remove <service> <label>")
  .description("Remove an account")
  .action(async (service: string, label: string) => {
    const { cmdRemove } = await import("./cli/remove.js");
    await cmdRemove(service, label);
  });

program
  .command("update <service> <label>")
  .description("Update an existing account (description, tags, or credentials)")
  .action(async (service: string, label: string) => {
    const { cmdUpdate } = await import("./cli/update.js");
    await cmdUpdate(service, label);
  });

program
  .command("activate <service> <label>")
  .description("Set the active account for a service (what the wrappers will use)")
  .action(async (service: string, label: string) => {
    const { cmdActivate } = await import("./cli/activate.js");
    await cmdActivate(service, label);
  });

program
  .command("active")
  .description("Show currently active account per service")
  .action(async () => {
    const { cmdActive } = await import("./cli/activate.js");
    await cmdActive();
  });

program
  .command("doctor")
  .description("Diagnose vault / keyring / file issues")
  .action(async () => {
    const { cmdDoctor } = await import("./cli/doctor.js");
    await cmdDoctor();
  });

// ─── MCP servers (spawned by chat clients — not for humans) ─────────────────────

program
  .command("server")
  .description("Start the vault MCP server on stdio (used by Claude Code / Claude Desktop / Cursor)")
  .action(async () => {
    const { startVaultServer } = await import("./server.js");
    await startVaultServer();
  });

program
  .command("wrap <service>")
  .description("Start a service wrapper MCP server on stdio")
  .action(async (service: string) => {
    switch (service) {
      case "supabase": {
        const { startSupabaseWrapper } = await import("./wrappers/supabase.js");
        await startSupabaseWrapper();
        return;
      }
      case "github": {
        const { startGithubWrapper } = await import("./wrappers/github.js");
        await startGithubWrapper();
        return;
      }
      case "vercel": {
        const { startVercelWrapper } = await import("./wrappers/vercel.js");
        await startVercelWrapper();
        return;
      }
      case "stripe": {
        const { startStripeWrapper } = await import("./wrappers/stripe.js");
        await startStripeWrapper();
        return;
      }
      default:
        process.stderr.write(`unknown service "${service}". Valid: supabase, github, vercel, stripe.\n`);
        process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`${err?.message ?? err}\n`);
  process.exit(1);
});
