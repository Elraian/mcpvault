export function Install() {
  return (
    <section id="install" className="border-b border-border bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <Eyebrow>Install</Eyebrow>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05]">
            Up in{" "}
            <span className="font-serif italic font-normal text-fg/60">
              under five minutes.
            </span>
          </h2>
        </div>

        <div className="mt-14 grid lg:grid-cols-3 gap-5">
          <Card step="01" label="Install & init">
            <Code>
              <span className="text-dim">$</span> npm install -g mcp-vault{"\n"}
              <span className="text-dim">$</span> mcp-vault init{"\n"}
              <span className="text-dim">→</span> set master password{"\n"}
              <span className="text-acid-400">✓</span> ~/.mcp-vault/vault.enc
            </Code>
          </Card>

          <Card step="02" label="Add accounts">
            <Code>
              <span className="text-dim">$</span> mcp-vault add supabase{"\n"}
              <span className="text-dim">$</span> mcp-vault add github{"\n"}
              <span className="text-dim">$</span> mcp-vault add vercel{"\n"}
              <span className="text-dim">$</span> mcp-vault add stripe
            </Code>
          </Card>

          <Card step="03" label="Wire to Claude Desktop" featured>
            <Code featured>
              {"{"}
              {"\n  "}
              <span className="text-acid-400">"mcpServers"</span>: {"{"}
              {"\n    "}
              <span className="text-acid-400">"vault"</span>: {"{"}
              {"\n      "}
              <span className="text-dim">"command"</span>:{" "}
              <span className="text-fg">"mcp-vault"</span>,{"\n      "}
              <span className="text-dim">"args"</span>: [
              <span className="text-fg">"server"</span>]{"\n    "}
              {"}"},{"\n    "}
              <span className="text-acid-400">"supabase"</span>: {"{"}
              {"\n      "}
              <span className="text-dim">"command"</span>:{" "}
              <span className="text-fg">"mcp-vault"</span>,{"\n      "}
              <span className="text-dim">"args"</span>: [
              <span className="text-fg">"wrap"</span>,{" "}
              <span className="text-fg">"supabase"</span>]{"\n    "}
              {"}"}
              {"\n  "}
              {"}"}
              {"\n"}
              {"}"}
            </Code>
            <p className="mt-4 text-[12px] text-faint leading-relaxed">
              <code className="font-mono text-[11.5px] text-muted">
                %APPDATA%\Claude\claude_desktop_config.json
              </code>{" "}
              on Windows ·{" "}
              <code className="font-mono text-[11.5px] text-muted">
                ~/Library/Application Support/Claude
              </code>{" "}
              on macOS.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="h-px w-8 bg-acid-500/60" />
      <span className="text-[10.5px] uppercase tracking-[0.22em] text-acid-400 font-mono">
        {children}
      </span>
    </div>
  );
}

function Card({
  step,
  label,
  featured,
  children,
}: {
  step: string;
  label: string;
  featured?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl p-7 md:p-8 ${
        featured
          ? "gborder bg-surface/80 shadow-card"
          : "border border-border-strong bg-surface/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">
          Step {step} — {label}
        </span>
        {featured && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-acid-400 uppercase tracking-[0.14em]">
            <span className="h-1.5 w-1.5 rounded-full bg-acid-500 shadow-[0_0_8px_rgba(163,230,53,0.6)]" />
            critical
          </span>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Code({
  featured,
  children,
}: {
  featured?: boolean;
  children: React.ReactNode;
}) {
  return (
    <pre
      className={`rounded-lg border ${
        featured
          ? "border-border-strong bg-bg/80"
          : "border-border bg-bg/60"
      } p-4 font-mono text-[11.5px] leading-[1.7] text-muted overflow-x-auto whitespace-pre`}
    >
      {children}
    </pre>
  );
}
