import { Layers, Bolt, Search, Lock, Key, Pulse } from "./icons";

export function Features() {
  return (
    <section className="border-b border-border bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <Eyebrow>What's in the box</Eyebrow>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05]">
            Built for agents{" "}
            <span className="font-serif italic font-normal text-fg/60">
              that actually do work.
            </span>
          </h2>
        </div>

        {/* Asymmetric grid: featured 2-col card + 4 single cards */}
        <div className="mt-14 grid lg:grid-cols-3 gap-px bg-border-strong rounded-2xl overflow-hidden border border-border-strong">
          <FeatureCard
            featured
            icon={<Layers className="h-4 w-4" />}
            title="Many accounts per service"
            body="Personal Supabase, three client Supabases, a demo org — all live side by side. Labels stay alphanumeric; descriptions feed fuzzy search."
          >
            <div className="mt-6 grid grid-cols-2 gap-px bg-border-strong rounded-lg overflow-hidden border border-border">
              {[
                ["personal", true],
                ["client-acme", false],
                ["client-merel", false],
                ["demo", false],
              ].map(([label, active]) => (
                <div
                  key={label as string}
                  className="bg-bg/70 p-3 flex items-center gap-2"
                >
                  <span
                    className={
                      active ? "text-acid-500" : "text-dim"
                    }
                  >
                    {active ? "●" : "○"}
                  </span>
                  <span
                    className={`font-mono text-[12px] ${
                      active ? "text-fg" : "text-muted"
                    }`}
                  >
                    {label as string}
                  </span>
                </div>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            icon={<Bolt className="h-4 w-4" />}
            title="Switch in real time"
            body={
              <>
                Wrappers re-read the active label on every tool call. Going from{" "}
                <code className="font-mono text-[12px] text-fg">personal</code> →{" "}
                <code className="font-mono text-[12px] text-fg">client-acme</code> is
                one MCP call. Zero restart.
              </>
            }
          />

          <FeatureCard
            icon={<Search className="h-4 w-4" />}
            title="Fuzzy find by description"
            body={
              <>
                Write project or client names into descriptions. Claude calls{" "}
                <code className="font-mono text-[12px] text-fg">
                  find_account("supabase", "Acme")
                </code>{" "}
                and gets back the right label.
              </>
            }
          />

          <FeatureCard
            icon={<Lock className="h-4 w-4" />}
            title="AES-256-GCM at rest"
            body={
              <>
                Argon2id KDF (m=64 MiB, t=3, p=1) from your master password. Vault
                file lives at{" "}
                <code className="font-mono text-[12px] text-fg">
                  ~/.mcp-vault/vault.enc
                </code>
                . The password never touches disk.
              </>
            }
          />

          <FeatureCard
            icon={<Key className="h-4 w-4" />}
            title="Unlock once, stay unlocked"
            body="Derived session key cached in OS keychain (DPAPI on Windows, Keychain on macOS, Secret Service on Linux). Survives reboots until you explicitly lock."
          />

          <FeatureCard
            icon={<Pulse className="h-4 w-4" />}
            title="Append-only audit log"
            body={
              <>
                Records which account was used per request,{" "}
                <span className="text-fg">never the credential</span>. Answer "what
                did the agent touch on Tuesday?" without exposing keys.
              </>
            }
          />
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

function FeatureCard({
  icon,
  title,
  body,
  featured,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  featured?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`bg-surface/60 p-7 md:p-8 ${
        featured ? "lg:row-span-2 lg:col-span-1" : ""
      } group hover:bg-surface transition`}
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-md bg-surface-2 ring-1 ring-white/8 flex items-center justify-center text-acid-400 group-hover:text-acid-300 transition">
          {icon}
        </div>
        {featured && (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-acid-400/80">
            Featured
          </span>
        )}
      </div>
      <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[14px] text-muted leading-relaxed">{body}</p>
      {children}
    </div>
  );
}
