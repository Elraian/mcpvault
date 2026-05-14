import { openWithCachedKey, VaultLockedError } from "../session.js";
import { getActiveLabel } from "../active.js";
import type { Service, Account } from "../schema.js";
import { logEvent } from "../log.js";

export class NoActiveAccountError extends Error {
  constructor(service: Service) {
    super(
      `No active ${service} account. Run \`activate_account\` (in the vault MCP) to pick one, or run \`mcpvault list ${service}\` to see what you have.`,
    );
    this.name = "NoActiveAccountError";
  }
}

/**
 * Read the active account for a service. Re-reads vault state from disk on every
 * call so account swaps take effect without restarting the wrapper process.
 */
export async function getActiveCredentials(service: Service): Promise<Account> {
  const label = await getActiveLabel(service);
  if (!label) throw new NoActiveAccountError(service);
  let vault;
  try {
    vault = await openWithCachedKey();
  } catch (e: any) {
    if (e instanceof VaultLockedError) throw e;
    throw e;
  }
  return vault.get(service, label);
}

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  [x: string]: unknown;
}

export function jsonResult(obj: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] };
}

export function errorResult(msg: string): ToolResult {
  return { content: [{ type: "text", text: msg }], isError: true };
}

/**
 * Wrap a tool handler with credential lookup + error mapping.
 * The handler receives the active account; we never expose creds via MCP.
 */
export function withActive<TArgs, TServ extends Service>(
  service: TServ,
  op: string,
  handler: (args: TArgs, account: Account) => Promise<ToolResult>,
) {
  return async (args: TArgs): Promise<ToolResult> => {
    try {
      const account = await getActiveCredentials(service);
      await logEvent({ kind: "use", service, label: account.label, op });
      return await handler(args, account);
    } catch (e: any) {
      await logEvent({ kind: "error", where: `${service}.${op}`, message: e.message });
      return errorResult(`${service}.${op} failed: ${e.message}`);
    }
  };
}

/**
 * Minimal fetch helper with bearer auth, JSON request/response, and error mapping.
 */
export async function apiCall(
  method: string,
  url: string,
  opts: {
    auth?: string; // value of Authorization header (e.g. "Bearer xxx")
    headers?: Record<string, string>;
    body?: unknown;
    asText?: boolean;
  } = {},
): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };
  if (opts.auth) headers["Authorization"] = opts.auth;
  if (opts.body !== undefined && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = JSON.parse(text);
      msg += `: ${JSON.stringify(j)}`;
    } catch {
      msg += `: ${text.slice(0, 300)}`;
    }
    throw new Error(msg);
  }
  if (opts.asText) return text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
