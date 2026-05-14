import {
  text,
  password as clackPassword,
  confirm as clackConfirm,
  isCancel,
  cancel,
  select,
  multiselect,
  spinner as clackSpinner,
  type Option,
} from "@clack/prompts";
import pc from "picocolors";

/** Centralized abort handler: if user hits ctrl-c / esc, end the process cleanly. */
function ensure<T>(v: T | symbol): T {
  if (isCancel(v)) {
    cancel("Cancelled");
    process.exit(0);
  }
  return v as T;
}

export async function ask(
  message: string,
  opts: { placeholder?: string; defaultValue?: string; validate?: (v: string) => string | Error | undefined } = {},
): Promise<string> {
  const validateFn = opts.validate;
  const v = await text({
    message,
    placeholder: opts.placeholder,
    defaultValue: opts.defaultValue,
    validate: validateFn ? (val: string | undefined) => validateFn(val ?? "") : undefined,
  });
  return ensure(v);
}

export async function askOptional(message: string, opts: { placeholder?: string } = {}): Promise<string | undefined> {
  const v = await text({
    message: `${message} ${pc.dim("(optional)")}`,
    placeholder: opts.placeholder,
    defaultValue: "",
  });
  const r = ensure(v);
  return r.trim() ? r.trim() : undefined;
}

export async function askPassword(message: string): Promise<string> {
  const v = await clackPassword({ message });
  return ensure(v);
}

export async function confirm(message: string, initial = true): Promise<boolean> {
  const v = await clackConfirm({ message, initialValue: initial });
  return ensure(v);
}

export async function pick<T extends string>(message: string, options: Array<Option<T>>): Promise<T> {
  const v = await select<T>({ message, options });
  return ensure(v);
}

export async function pickMany<T extends string>(message: string, options: Array<Option<T>>, required = false): Promise<T[]> {
  const v = await multiselect<T>({ message, options, required });
  return ensure(v);
}

export function spinner() {
  return clackSpinner();
}

export function redactForDisplay(s: string): string {
  if (!s) return "(empty)";
  const len = s.length;
  if (len <= 12) return `${"*".repeat(len)} (${len} chars)`;
  return `${s.slice(0, 6)}…${s.slice(-4)} (${len} chars)`;
}

export const c = pc;
