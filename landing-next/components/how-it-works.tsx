export function HowItWorks() {
  return (
    <section id="how" className="relative border-b border-border bg-bg overflow-hidden">
      {/* diagonal accent line */}
      <div
        aria-hidden="true"
        className="absolute -top-40 right-[-20%] h-[300px] w-[60%] rotate-[-8deg] opacity-[0.05] bg-gradient-to-r from-transparent via-acid-400 to-transparent blur-2xl"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 max-w-5xl">
          <div className="max-w-xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05]">
              Three pieces.{" "}
              <span className="font-serif italic font-normal text-fg/60">
                Two are invisible.
              </span>
            </h2>
          </div>
          <p className="text-[15.5px] text-muted max-w-md leading-relaxed">
            A CLI to manage accounts, a vault MCP server Claude can call, and
            per-service wrappers that re-read the active account on every request.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-px bg-border-strong rounded-2xl overflow-hidden border border-border-strong">
          <Step
            number="01"
            kind="CLI"
            title="Drop credentials into the vault"
            blurb={
              <>
                <code className="font-mono text-[12.5px] text-fg">
                  mcp-vault add supabase
                </code>{" "}
                walks you through label, description, and PAT. The description is
                what fuzzy search matches.
              </>
            }
          >
            <CodeBlock>
              <Line dim>$</Line> mcp-vault add supabase{"\n"}
              Label:{" "}
              <span className="text-fg">client-acme</span>
              {"\n"}
              Description:{" "}
              <span className="text-fg">Acme Corp production</span>
              {"\n"}
              PAT: <span className="text-fg">****************</span>
              {"\n"}
              <span className="text-acid-400">✓ Added.</span>
            </CodeBlock>
          </Step>

          <Step
            number="02"
            kind="MCP"
            title="Point Claude at the wrappers"
            blurb={
              <>
                Add four lines to{" "}
                <code className="font-mono text-[12.5px] text-fg">
                  claude_desktop_config.json
                </code>
                . mcp-vault becomes both the control plane and every per-service wrapper.
              </>
            }
          >
            <CodeBlock>
              <span className="text-dim">"mcpServers"</span>: {"{"}
              {"\n  "}
              <span className="text-acid-400">"vault"</span>: {"{"}{" "}
              <span className="text-dim">"args"</span>: [
              <span className="text-fg">"server"</span>] {"}"},{"\n  "}
              <span className="text-acid-400">"supabase"</span>: {"{"}{" "}
              <span className="text-dim">"args"</span>: [
              <span className="text-fg">"wrap"</span>,{" "}
              <span className="text-fg">"supabase"</span>] {"}"},{"\n  "}
              <span className="text-acid-400">"github"</span>: {"{"}{" "}
              <span className="text-dim">"args"</span>: [
              <span className="text-fg">"wrap"</span>,{" "}
              <span className="text-fg">"github"</span>] {"}"}
              {"\n"}
              {"}"}
            </CodeBlock>
          </Step>

          <Step
            number="03"
            kind="Claude"
            title="Ask in plain language"
            blurb={
              <>
                Claude finds the right account, activates it, runs the tool. Each
                wrapper re-reads the active label on every call —{" "}
                <span className="text-fg">switching is instant</span>.
              </>
            }
          >
            <CodeBlock>
              <span className="text-dim">›</span> "Switch to my personal Supabase
              {"\n   "}and list the recent migrations"{"\n\n"}
              <span className="text-acid-400">activate_account</span>(personal){" "}
              <span className="text-acid-400">✓</span>
              {"\n"}
              <span className="text-acid-400">supabase_list_migrations</span>(){"\n"}
              <span className="text-dim">→ 4 migrations on personal/main</span>
            </CodeBlock>
          </Step>
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

function Step({
  number,
  kind,
  title,
  blurb,
  children,
}: {
  number: string;
  kind: string;
  title: string;
  blurb: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface/60 p-7 md:p-8 group hover:bg-surface transition">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">
          {number} — {kind}
        </span>
        <div className="h-1.5 w-1.5 rounded-full bg-acid-500/30 group-hover:bg-acid-500 transition" />
      </div>
      <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.01em] leading-snug">
        {title}
      </h3>
      <p className="mt-2.5 text-[14px] text-muted leading-relaxed">{blurb}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="rounded-lg border border-border bg-bg/60 p-4 font-mono text-[11.5px] leading-[1.65] text-muted overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function Line({ dim, children }: { dim?: boolean; children: React.ReactNode }) {
  return <span className={dim ? "text-dim" : ""}>{children}</span>;
}
