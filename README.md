# mcpvault

Local, encrypted credential vault for AI agents. Keep many accounts per service (Supabase, GitHub, Vercel, Stripe), and let Claude / Cursor / Codex pick the right one mid-conversation.

> *"I'm working on the Acme project today — switch me to that Supabase account and list the projects."*

The agent calls a vault tool, the right credentials are loaded, the request executes against the real API. No restart, no manual token-swapping.

## Install

```sh
npm i -g @elraian/mcpvault
```

> Requires Node 20+. Works on Windows, macOS, Linux.
> The CLI command after install is just `mcpvault` (also aliased as `mvault` and `mcp-vault`).

## Setup in 3 commands

```sh
mcpvault init                 # create vault, set master password
mcpvault add supabase         # paste a PAT — validated immediately against the API
mcpvault setup                # auto-wire into Claude Code / Desktop / Cursor
```

Then restart your chat client. That's it.

## Day-to-day

| Command | What it does |
|---|---|
| `mcpvault add <service>` | Add an account. Validates the token live, suggests a label. |
| `mcpvault list` | See all accounts. The currently active one is marked ● per service. |
| `mcpvault update <svc> <label>` | Rotate a token, edit description/tags. |
| `mcpvault remove <svc> <label>` | Delete an account (with type-the-label confirmation). |
| `mcpvault activate <svc> <label>` | Set the active account. Wrappers pick it up on next call. |
| `mcpvault active` | Show what's active per service. |
| `mcpvault status` / `lock` / `unlock` | Vault lock state. |
| `mcpvault doctor` | Diagnose vault / keyring / file issues. |
| `mcpvault setup` | Re-run to wire additional clients later. |

`mcpvault`, `mvault`, and `mcp-vault` all work — they're aliases.

## What you can ask the agent

After `mcpvault setup` + restart, your agent has these tools available:

**vault** (control plane)
`unlock_vault`, `lock_vault`, `vault_status`, `list_accounts`, `find_account`, `get_active`, `activate_account`, `add_account`, `update_account`, `delete_account`, `export_redacted`

**vault-supabase**
`supabase_list_projects`, `supabase_list_organizations`, `supabase_run_sql`, `supabase_list_tables`, `supabase_get_logs`

**vault-github**
`github_list_repos`, `github_get_repo`, `github_list_issues`, `github_create_issue`, `github_list_pulls`, `github_get_file`, `github_search_code`

**vault-vercel**
`vercel_list_projects`, `vercel_list_deployments`, `vercel_get_deployment`, `vercel_list_domains`

**vault-stripe** *(read-only by design — no writes)*
`stripe_list_customers`, `stripe_retrieve_customer`, `stripe_list_charges`, `stripe_list_subscriptions`, `stripe_retrieve`

## Example flow

```text
You:    Switch to the Acme Supabase account and list its projects.

Agent:  [find_account "Acme"] → matched "client-acme"
        [activate_account supabase client-acme]
        [supabase_list_projects]
        Active is now client-acme. 3 projects: acme-prod, acme-staging, acme-internal.

You:    Now switch to my personal one and show me its orgs.

Agent:  [activate_account supabase personal]
        [supabase_list_organizations]
        Personal account has 1 org: my-projects.
```

Same wrapper process. Zero restart between switches.

## Security model

| Layer | Mechanism |
|---|---|
| Vault file on disk | AES-256-GCM, Argon2id KDF (m=64 MiB, t=3, p=1) |
| Master password | Never written to disk; held in memory after `unlock` |
| Session key (after unlock) | OS keyring (Windows Credential Manager / macOS Keychain / libsecret on Linux). Survives reboots so you don't re-type your password daily. |
| Wrapper MCP processes | Read decrypted creds from keyring per request. Credentials never returned through MCP — only the API result is. |
| Stripe wrapper | Read-only by design. No `create_charge`, no `refund`. |
| Audit log | `~/.mcpvault/vault.log` records which account was used per request, never the credential. |

If you want stricter behavior (re-enter master password every boot), run `mcpvault lock` before shutdown, or call `lock_vault` through your agent.

## Files on disk

```
~/.mcpvault/
├── vault.enc         # AES-256-GCM, Argon2id-derived key
├── active.json       # plain JSON, only labels — no secrets
└── vault.log         # append-only audit log
```

> The legacy paths `~/.mcp-vault/` and `~/.mvault/` are also recognized for existing users — auto-detected from disk.

## Architecture

```
Chat client (Claude Code / Desktop / Cursor)
   │
   ├── spawns: mcpvault server          ← control plane (list/find/activate/add)
   ├── spawns: mcpvault wrap supabase   ← per-service wrapper
   ├── spawns: mcpvault wrap github
   ├── spawns: mcpvault wrap vercel
   └── spawns: mcpvault wrap stripe
                    │
                    ├── reads: ~/.mcpvault/active.json    (which label per service)
                    └── reads: ~/.mcpvault/vault.enc      (encrypted creds)
                                │
                         decrypted with key from
                         OS keyring (cached at unlock)
```

Each wrapper re-reads the active label on every tool call, so switching accounts is instant — no process restart.

## Development

```sh
git clone https://github.com/Elraian/mcpvault.git
cd mcpvault
npm install
npm run build
npm test           # ~22 unit + e2e tests
npm link           # exposes `mcpvault` globally for local testing
```

## Why this exists

Most MCP servers are locked to one account at startup. If you have 10 Supabase projects across 4 clients, you either register the Supabase MCP 10 times or constantly swap tokens by hand. `mcpvault` lets the agent search and switch accounts naturally during a conversation. Same idea applies to any service Anthropic / Cursor / etc. don't natively multi-account.

## Roadmap

- v2: OAuth-based services (Gmail, Drive, Slack — needs refresh logic)
- v3: 1Password / Bitwarden CLI integration
- v3: Account "contexts" — switch Supabase + GitHub + Vercel + Stripe atomically per project
- v4: Web UI (Tauri / system tray)

## Credits

Built by **[AISIDE](https://aiside.ee)** — [@Elraian](https://github.com/Elraian).

- **Site:** <https://mcpvault.online>
- **Source:** <https://github.com/Elraian/mcpvault>
- **npm:** <https://www.npmjs.com/package/@elraian/mcpvault>

If this saves you time, a star on the repo costs you nothing and helps a lot.

## License

MIT — see [LICENSE](LICENSE).
