import Link from "next/link";
import { Logo, GitHubMark } from "./icons";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-bg/70 border-b border-border">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-surface-2 ring-1 ring-white/10 text-acid-400 group-hover:text-acid-300 transition">
            <Logo className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            mcp-vault
          </span>
          <span className="hidden sm:inline-flex items-center rounded-full border border-border-strong bg-surface px-2 py-[3px] text-[10px] font-mono uppercase tracking-[0.14em] text-faint">
            v1
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[13.5px] text-muted">
          <a href="#how" className="hover:text-fg transition">How it works</a>
          <a href="#security" className="hover:text-fg transition">Security</a>
          <a href="#services" className="hover:text-fg transition">Services</a>
          <a href="#install" className="hover:text-fg transition">Install</a>
          <a href="#faq" className="hover:text-fg transition">FAQ</a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/"
            className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-border-strong bg-surface text-[13px] text-muted hover:text-fg hover:bg-surface-2 transition"
          >
            <GitHubMark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GitHub</span>
            <span className="hidden sm:inline text-faint font-mono text-[11px]">2.1k</span>
          </a>
          <a
            href="#install"
            className="inline-flex items-center h-8 px-3.5 rounded-md bg-fg text-bg text-[13px] font-medium hover:bg-fg/90 transition"
          >
            Install
          </a>
        </div>
      </div>
    </header>
  );
}
