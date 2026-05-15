/**
 * Proxy adapter: glue that lets mcpvault spawn an existing community MCP server
 * with the active account's credentials injected. The community server does the
 * actual API work; mcpvault provides the encrypted vault + multi-account routing.
 *
 * Adding a new service is a ~30-line file conforming to this interface.
 */

export interface CredField {
  key: string;
  prompt: string;
  secret?: boolean;
  optional?: boolean;
  placeholder?: string;
}

export interface ValidationResult {
  ok: boolean;
  identity?: string;
  suggestedLabel?: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface ProxyAdapter {
  /** Service id; matches what users type in `mcpvault add <id>` and `wrap <id>`. */
  service: string;
  /** Human-readable name shown in prompts and the welcome banner. */
  displayName: string;
  /** Where the user goes to generate a credential. */
  tokenUrl: string;
  /** One-line hint about token type / scopes. */
  hint: string;

  /** Fields collected during `mcpvault add <service>`. */
  credentialFields: CredField[];

  /** Optional live validation against the upstream API on `add`. */
  validate?: (creds: Record<string, unknown>) => Promise<ValidationResult>;

  /** Command to spawn the community MCP server (e.g. "npx"). */
  spawnCmd: string;
  /** Base args to the spawn command (e.g. ["-y", "@notionhq/notion-mcp-server"]). */
  spawnArgs: string[];

  /** Map credentials → env vars passed to the child process. */
  authMapping: (creds: Record<string, unknown>) => Record<string, string>;

  /** Optional: extra args derived from credentials, appended after spawnArgs. */
  argMapping?: (creds: Record<string, unknown>) => string[];
}
