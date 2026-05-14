import { Eye } from "./icons";

export function Security() {
  return (
    <section
      id="security"
      className="relative border-b border-border bg-bg overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 gridbg opacity-[0.4]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-40 top-40 h-[400px] w-[400px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(190,242,100,0.25), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5">
          <Eyebrow>Security model</Eyebrow>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05]">
            Your credentials{" "}
            <span className="font-serif italic font-normal text-fg/60">
              don't go to the model.
            </span>
          </h2>
          <p className="mt-5 text-[16px] text-muted leading-relaxed">
            Wrappers decrypt the active credential in-process, call the upstream
            API, and return the <em className="not-italic text-fg">result</em> to
            Claude. The PAT never crosses the MCP wire. Stripe's wrapper is
            read-only by design — no{" "}
            <code className="font-mono text-[13px] text-fg">create_charge</code>,
            no <code className="font-mono text-[13px] text-fg">refund</code>.
          </p>

          <ol className="mt-10 space-y-5">
            {[
              {
                t: "AES-256-GCM, Argon2id KDF",
                d: "m=64 MiB, t=3, p=1. The vault file is meaningless without the master password.",
              },
              {
                t: "Session key in OS keychain",
                d: "Protected by your OS login. Lock at any time to invalidate it.",
              },
              {
                t: "Credentials stay in the wrapper",
                d: "Tools return API responses to Claude — never the bearer token itself.",
              },
              {
                t: "Auditable by default",
                d: "Append-only log of which label served which call. Easy to grep, easy to ship.",
              },
            ].map((item, i) => (
              <li key={i} className="flex gap-4">
                <div className="shrink-0 h-8 w-8 rounded-md bg-surface-2 ring-1 ring-white/8 flex items-center justify-center font-mono text-[11px] text-acid-400">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h4 className="text-[15px] font-medium tracking-tight">
                    {item.t}
                  </h4>
                  <p className="mt-1 text-[13.5px] text-muted leading-relaxed">
                    {item.d}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Right: file tree visual */}
        <div className="lg:col-span-7 lg:pl-8">
          <div className="gborder rounded-2xl bg-surface/80 backdrop-blur shadow-card p-7 md:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-faint">
                ~/.mcp-vault/
              </div>
              <div className="flex items-center gap-2 text-[11px] text-faint">
                <Eye className="h-3 w-3" />
                <span className="font-mono">read-only diagram</span>
              </div>
            </div>

            <div className="mt-6 font-mono text-[12.5px] leading-relaxed space-y-4">
              <FileRow
                bracket="├──"
                name="vault.enc"
                desc="AES-256-GCM ciphertext, Argon2id-derived key"
                badge="encrypted"
                badgeTone="acid"
              />
              <FileRow
                bracket="├──"
                name="active.json"
                desc="Plain JSON: only labels, no secrets"
                badge="public"
              />
              <FileRow
                bracket="└──"
                name="vault.log"
                desc="Append-only audit trail of account use"
                badge="append-only"
              />
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-faint">
                OS keychain
              </div>
              <div className="mt-4 font-mono text-[12.5px] leading-relaxed">
                <FileRow
                  bracket="●"
                  name="mcp-vault.session"
                  desc={
                    <>
                      DPAPI / Keychain / Secret Service. Cleared on{" "}
                      <span className="text-fg">lock</span>.
                    </>
                  }
                  badge="ephemeral"
                  badgeTone="acid"
                />
              </div>
            </div>

            {/* Flow diagram inline */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-faint mb-4">
                Request path
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-mono">
                <Pill>Claude</Pill>
                <Arrow />
                <Pill>wrapper</Pill>
                <Arrow />
                <Pill>decrypt in-process</Pill>
                <Arrow />
                <Pill tone="acid">upstream API</Pill>
                <Arrow />
                <Pill>result → Claude</Pill>
              </div>
              <p className="mt-3 text-[12px] text-faint leading-relaxed">
                The credential never crosses the dotted line back to Claude.
              </p>
            </div>
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

function FileRow({
  bracket,
  name,
  desc,
  badge,
  badgeTone = "neutral",
}: {
  bracket: string;
  name: string;
  desc: React.ReactNode;
  badge?: string;
  badgeTone?: "neutral" | "acid";
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={
          bracket === "●" ? "text-acid-500 shrink-0" : "text-dim shrink-0"
        }
      >
        {bracket}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-fg">{name}</span>
          {badge && (
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] font-medium ${
                badgeTone === "acid"
                  ? "bg-acid-400/12 text-acid-400 ring-1 ring-acid-400/20"
                  : "bg-surface-2 text-faint ring-1 ring-white/5"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="text-[12px] text-faint mt-1 font-sans leading-snug">
          {desc}
        </div>
      </div>
    </div>
  );
}

function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "acid";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 ${
        tone === "acid"
          ? "bg-acid-400/12 text-acid-400 ring-1 ring-acid-400/20"
          : "bg-surface-2 text-muted ring-1 ring-white/8"
      }`}
    >
      {children}
    </span>
  );
}

function Arrow() {
  return <span className="text-dim select-none">→</span>;
}
