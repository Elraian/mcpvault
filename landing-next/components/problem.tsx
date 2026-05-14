export function Problem() {
  return (
    <section className="border-b border-border bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05]">
            One agent. Five clients.{" "}
            <span className="font-serif italic font-normal text-fg/60">
              Twenty tokens
            </span>{" "}
            in a notes app.
          </h2>
          <p className="mt-5 text-[16.5px] text-muted leading-relaxed max-w-xl">
            Every MCP server expects one set of credentials in env vars. So you
            either restart Claude every time you change clients, or you give one
            agent access to everything at once. Neither is fine.
          </p>
        </div>

        {/* Asymmetric cards: before is dimmer/smaller, after is featured */}
        <div className="mt-14 grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5">
            <Card tone="rose" label="Before">
              <List
                items={[
                  ["Edit", " claude_desktop_config.json", ", swap a token, restart Claude."],
                  ["Or paste the same PAT into every wrapper", "", " and pray you're hitting the right project."],
                  ["Tokens scattered across", " 1Password, .env files, Notion, Slack DMs", "."],
                  ["No record of which account the agent used", "", " when it ran a query."],
                ]}
              />
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card tone="acid" label="With mcp-vault" featured>
              <List
                tone="acid"
                items={[
                  ["", "One encrypted file.", " Many accounts per service. Personal, three clients, a demo org."],
                  ["", "\"Switch me to the Acme Supabase\"", " — Claude does it. Instant. No restart."],
                  ["Credentials never leave the wrapper process —", " Claude only sees results.", ""],
                  ["", "Append-only audit log:", " who-was-used-when, never the secret itself."],
                ]}
              />
            </Card>
          </div>
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
  tone,
  label,
  featured,
  children,
}: {
  tone: "rose" | "acid";
  label: string;
  featured?: boolean;
  children: React.ReactNode;
}) {
  const dotColor = tone === "rose" ? "bg-rose-400/70" : "bg-acid-500";
  const textColor = tone === "rose" ? "text-faint" : "text-acid-400";
  const cardClass = featured
    ? "gborder bg-surface/80 shadow-card"
    : "border border-border-strong bg-surface/40";

  return (
    <div className={`relative h-full rounded-2xl ${cardClass} p-7 md:p-8`}>
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        <span
          className={`text-[10.5px] uppercase tracking-[0.22em] font-mono ${textColor}`}
        >
          {label}
        </span>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function List({
  items,
  tone = "rose",
}: {
  items: [string, string, string][];
  tone?: "rose" | "acid";
}) {
  const dotColor = tone === "rose" ? "bg-rose-400/60" : "bg-acid-500";
  return (
    <ul className="space-y-4 text-[14.5px] text-muted leading-relaxed">
      {items.map(([pre, em, post], i) => (
        <li key={i} className="flex gap-3.5">
          <span className={`mt-2 h-1 w-1 rounded-full shrink-0 ${dotColor}`} />
          <span>
            {pre}
            <span className="text-fg">{em}</span>
            {post}
          </span>
        </li>
      ))}
    </ul>
  );
}
