import { Logo } from "./icons";

export function Footer() {
  return (
    <footer className="bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-14 grid sm:grid-cols-2 md:grid-cols-4 gap-10 text-[13.5px]">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-surface-2 ring-1 ring-white/8 text-acid-400">
              <Logo className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight">mcp-vault</span>
          </div>
          <p className="mt-4 text-[13px] text-faint leading-relaxed max-w-xs">
            Local, encrypted credential vault for AI agents. MIT-licensed.
          </p>
          <div className="mt-5 flex items-center gap-3 text-[11px] font-mono text-dim">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-acid-500" />
              v1.0
            </span>
            <span className="text-dim">·</span>
            <span>macOS · Windows · Linux</span>
          </div>
        </div>

        <Col title="Product">
          <FLink href="#how">How it works</FLink>
          <FLink href="#security">Security</FLink>
          <FLink href="#services">Services</FLink>
          <FLink href="#install">Install</FLink>
        </Col>

        <Col title="Resources">
          <FLink href="#">README</FLink>
          <FLink href="#">CLI reference</FLink>
          <FLink href="#">Architecture</FLink>
          <FLink href="#faq">FAQ</FLink>
        </Col>

        <Col title="Repo">
          <FLink href="#">GitHub</FLink>
          <FLink href="#">Issues</FLink>
          <FLink href="#">Releases</FLink>
          <FLink href="#">License</FLink>
        </Col>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-faint">
          <div>© 2026 mcp-vault — local-first, no telemetry.</div>
          <div className="font-mono">argon2id · aes-256-gcm · keychain</div>
        </div>
      </div>
    </footer>
  );
}

function Col({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.22em] text-faint font-mono">
        {title}
      </div>
      <ul className="mt-4 space-y-2.5 text-muted">{children}</ul>
    </div>
  );
}

function FLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a href={href} className="hover:text-fg transition">
        {children}
      </a>
    </li>
  );
}
