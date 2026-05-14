import { ArrowRight, Play, Lock } from "./icons";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      {/* Aurora glow */}
      <div className="aurora" aria-hidden="true" />
      {/* Faded grid */}
      <div className="absolute inset-0 gridbg gridbg-fade" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-28 md:pt-32 md:pb-36">
        {/* Eyebrow */}
        <div className="reveal flex justify-center" style={{ ["--reveal-delay" as string]: "0ms" }}>
          <a
            href="#security"
            className="group inline-flex items-center gap-2.5 rounded-full border border-border-strong bg-surface/70 backdrop-blur pl-1.5 pr-3.5 py-1 text-[12px] text-muted hover:text-fg transition"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-acid-400/12 text-acid-400 px-1.5 py-0.5">
              <Lock className="h-2.5 w-2.5" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em]">v1</span>
            </span>
            <span>AES-256-GCM · Argon2id · OS keychain</span>
            <ArrowRight className="h-3 w-3 opacity-50 group-hover:translate-x-0.5 group-hover:opacity-100 transition" />
          </a>
        </div>

        {/* Headline — asymmetric with serif italic accent */}
        <h1
          className="reveal mt-8 text-center font-sans tracking-[-0.04em] leading-[0.95]"
          style={{ ["--reveal-delay" as string]: "80ms" }}
        >
          <span className="block text-[44px] sm:text-[64px] md:text-[88px] font-semibold">
            One vault.
          </span>
          <span className="block text-[44px] sm:text-[64px] md:text-[88px] font-semibold text-fg/55">
            Every account.
          </span>
          <span className="block mt-2 text-[44px] sm:text-[64px] md:text-[88px] font-semibold">
            <span className="font-serif italic font-normal text-acid-400 pr-2">Switched</span>
            by Claude.
          </span>
        </h1>

        {/* Sub */}
        <p
          className="reveal mx-auto mt-8 max-w-[44rem] text-center text-[17px] md:text-[18px] text-muted leading-relaxed"
          style={{ ["--reveal-delay" as string]: "180ms" }}
        >
          A local, encrypted credential store for AI agents. Keep many accounts per
          service — Supabase, GitHub, Vercel, Stripe — and switch between them from
          natural language. <span className="text-fg">No restart, no token-swapping by hand.</span>
        </p>

        {/* CTAs */}
        <div
          className="reveal mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{ ["--reveal-delay" as string]: "260ms" }}
        >
          <a
            href="#install"
            className="btn-acid inline-flex items-center gap-2 h-11 px-5 rounded-lg text-[14px] font-semibold tracking-tight"
          >
            Install mcp-vault
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border-strong bg-surface/70 backdrop-blur text-[14px] text-muted hover:text-fg hover:bg-surface-2 transition"
          >
            <Play className="h-3 w-3" />
            See it switch
          </a>
        </div>

        <p
          className="reveal mt-6 text-center text-[12px] font-mono text-faint"
          style={{ ["--reveal-delay" as string]: "320ms" }}
        >
          $ npm install -g mcp-vault &nbsp;·&nbsp; macOS · Windows · Linux
        </p>

        {/* Hero visual: terminal + chat */}
        <div
          className="reveal relative mx-auto mt-20 md:mt-24 max-w-5xl"
          style={{ ["--reveal-delay" as string]: "400ms" }}
        >
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}

function HeroDemo() {
  return (
    <div className="relative">
      {/* Outer glow */}
      <div
        aria-hidden="true"
        className="absolute -inset-x-12 -inset-y-10 -z-10 opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 30%, rgba(190,242,100,0.25) 0%, transparent 70%)",
        }}
      />

      <div className="gborder rounded-2xl bg-surface/80 backdrop-blur-xl shadow-[0_30px_120px_-30px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 h-9 border-b border-border bg-surface-2/50">
          <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
          <div className="ml-3 text-[11px] font-mono text-faint flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-acid-500 shadow-[0_0_8px_rgba(163,230,53,0.6)]" />
            claude — mcp-vault
          </div>
          <div className="ml-auto text-[10.5px] font-mono text-dim uppercase tracking-[0.14em]">
            live
          </div>
        </div>

        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
          {/* Chat side */}
          <div className="p-6 md:p-7 space-y-5">
            <ChatBubble role="you" name="You">
              I'm working on <span className="text-fg font-medium">Acme</span> today.
              Switch me to that Supabase account and list the projects.
            </ChatBubble>

            <div className="flex items-start gap-3">
              <Avatar role="claude" />
              <div className="flex-1 space-y-2">
                <ToolCall>
                  <span className="text-acid-400">find_account</span>
                  <span className="text-faint">(</span>
                  <span className="text-fg/85">"supabase"</span>
                  <span className="text-faint">,</span>{" "}
                  <span className="text-fg/85">"Acme"</span>
                  <span className="text-faint">)</span>
                  <span className="text-faint mx-1.5">→</span>
                  <span className="text-fg">client-acme</span>
                </ToolCall>
                <ToolCall>
                  <span className="text-acid-400">activate_account</span>
                  <span className="text-faint">(</span>
                  <span className="text-fg/85">"supabase"</span>
                  <span className="text-faint">,</span>{" "}
                  <span className="text-fg/85">"client-acme"</span>
                  <span className="text-faint">)</span>
                  <span className="text-faint mx-1.5">→</span>
                  <span className="text-acid-400">✓</span>
                </ToolCall>
                <ToolCall>
                  <span className="text-acid-400">supabase_list_projects</span>
                  <span className="text-faint">()</span>
                </ToolCall>

                <div className="rounded-lg border border-border-strong bg-surface-2/80 px-3.5 py-3 text-[13.5px] text-muted leading-relaxed">
                  You're now on <span className="text-fg font-medium">client-acme</span>.
                  3 projects:{" "}
                  <code className="font-mono text-[12.5px] text-fg">acme-prod</code>,{" "}
                  <code className="font-mono text-[12.5px] text-fg">acme-staging</code>,{" "}
                  <code className="font-mono text-[12.5px] text-fg">acme-analytics</code>.
                </div>
              </div>
            </div>
          </div>

          {/* Terminal side */}
          <div className="bg-bg/60 p-6 md:p-7 font-mono text-[12.5px] leading-relaxed">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-dim">
                ~/.mcp-vault
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-acid-500" />
                unlocked
              </div>
            </div>

            <div className="space-y-1.5">
              <Line prompt>mcp-vault list supabase</Line>
              <div className="ml-3 space-y-0.5 text-[12px]">
                <Account active label="personal" desc="My side projects" />
                <Account label="client-acme" desc="Acme Corp production" />
                <Account label="client-merel" desc="Merel staging" />
                <Account label="demo" desc="Throwaway demo org" />
              </div>

              <div className="h-3" />

              <Line prompt>mcp-vault active</Line>
              <div className="ml-3 grid grid-cols-[80px_1fr] gap-x-3 text-[12px] text-muted">
                <span className="text-faint">supabase</span>
                <span className="text-fg">client-acme</span>
                <span className="text-faint">github</span>
                <span className="text-fg">personal</span>
                <span className="text-faint">vercel</span>
                <span className="text-fg">personal</span>
                <span className="text-faint">stripe</span>
                <span className="text-fg">acme-live</span>
              </div>

              <div className="h-3" />

              <Line prompt>
                <span className="caret" />
              </Line>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="border-t border-border px-4 h-9 flex items-center justify-between text-[11px] font-mono text-faint bg-surface-2/40">
          <span>vault.enc · 12 accounts · 4 services</span>
          <span className="flex items-center gap-3">
            <span>argon2id m=64MiB</span>
            <span className="text-dim">·</span>
            <span>aes-256-gcm</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  role,
  name,
  children,
}: {
  role: "you" | "claude";
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Avatar role={role} />
      <div className="rounded-lg border border-border-strong bg-surface-2/70 px-3.5 py-2.5 text-[14px] text-muted leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Avatar({ role }: { role: "you" | "claude" }) {
  if (role === "claude") {
    return (
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-acid-400/15 text-acid-400 text-[10.5px] font-semibold ring-1 ring-acid-400/20">
        C
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10.5px] font-medium text-faint ring-1 ring-white/5">
      You
    </span>
  );
}

function ToolCall({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-bg/40 px-3 py-2 text-[12px] font-mono text-muted">
      {children}
    </div>
  );
}

function Line({ prompt, children }: { prompt?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      {prompt && <span className="text-dim select-none">$</span>}
      <span>{children}</span>
    </div>
  );
}

function Account({
  active,
  label,
  desc,
}: {
  active?: boolean;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={active ? "text-acid-500" : "text-dim"}>
        {active ? "●" : "○"}
      </span>
      <span className={active ? "text-fg" : "text-muted"}>{label}</span>
      <span className="text-dim">— {desc}</span>
    </div>
  );
}
