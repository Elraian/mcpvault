# Programmatic usage examples

mcpvault's MCP servers (vault + wrappers) speak standard MCP JSON-RPC over stdio. The two scripts in this folder show how to talk to them directly from Node — useful for testing, scripting, or building your own client on top.

## Prerequisites

- mcpvault installed and built (`npm i -g mcpvault` or `npm run build` in a clone)
- Vault initialized and unlocked (`mcpvault init`, `mcpvault unlock`)
- For wrapper examples: at least one account added (`mcpvault add supabase`) and activated

## `talk-to-vault-mcp.mjs`

Spawns `mcpvault server` (the control plane) and calls a tool.

```sh
node talk-to-vault-mcp.mjs list_accounts
node talk-to-vault-mcp.mjs find_account '{"service":"supabase","query":"acme"}'
node talk-to-vault-mcp.mjs activate_account '{"service":"supabase","label":"client-acme"}'
```

## `talk-to-wrapper-mcp.mjs`

Spawns `mcpvault wrap supabase` (the Supabase wrapper) and calls a tool.

```sh
node talk-to-wrapper-mcp.mjs supabase_list_organizations
node talk-to-wrapper-mcp.mjs supabase_list_projects
```

(Edit the spawn line in the script to use a different wrapper: `wrap github`, `wrap vercel`, `wrap stripe`.)

## Notes

- Both scripts assume `dist/index.js` exists relative to the project root (i.e., they call `node <repo>/dist/index.js server`). When running against a globally installed package, point them at the installed binary instead.
- These are demo scripts. For production usage, use the `@modelcontextprotocol/sdk` client library — it handles retries, schema validation, and progress notifications.
