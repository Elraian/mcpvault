import { SupabaseMark, GitHubMark, VercelMark, StripeMark } from "./icons";

const services = [
  {
    name: "Supabase",
    blurb: "Read-only project + SQL access",
    Icon: SupabaseMark,
    iconClass: "text-emerald-400",
    iconBg: "bg-emerald-500/10 ring-emerald-500/20",
    tools: [
      "list_projects",
      "run_sql",
      "list_tables",
      "get_logs",
      "list_organizations",
    ],
  },
  {
    name: "GitHub",
    blurb: "Repos, issues, PRs, code search",
    Icon: GitHubMark,
    iconClass: "text-fg",
    iconBg: "bg-white/8 ring-white/10",
    tools: [
      "list_repos",
      "get_repo",
      "list_issues",
      "create_issue",
      "list_pulls",
      "get_file",
      "search_code",
    ],
  },
  {
    name: "Vercel",
    blurb: "Projects, deployments, domains",
    Icon: VercelMark,
    iconClass: "text-fg",
    iconBg: "bg-white/8 ring-white/10",
    tools: ["list_projects", "list_deployments", "get_deployment", "list_domains"],
  },
  {
    name: "Stripe",
    blurb: "Customers, charges, subscriptions",
    badge: "read-only",
    Icon: StripeMark,
    iconClass: "text-violet-300",
    iconBg: "bg-violet-500/10 ring-violet-500/20",
    tools: [
      "list_customers",
      "retrieve_customer",
      "list_charges",
      "list_subscriptions",
      "retrieve",
    ],
  },
];

export function Services() {
  return (
    <section id="services" className="border-b border-border bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <Eyebrow>Wrappers</Eyebrow>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05]">
            Four services{" "}
            <span className="font-serif italic font-normal text-fg/60">
              on day one.
            </span>
          </h2>
          <p className="mt-5 text-[16px] text-muted leading-relaxed">
            Each wrapper exposes a small, opinionated set of tools that match the
            way you actually use the API from a chat — not the full surface area.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 gap-4">
          {services.map((s) => (
            <article
              key={s.name}
              className="group rounded-2xl border border-border-strong bg-surface/50 hover:bg-surface transition p-7"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`h-11 w-11 shrink-0 rounded-lg ring-1 flex items-center justify-center ${s.iconBg}`}
                >
                  <s.Icon className={`h-4.5 w-4.5 ${s.iconClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[17px] font-semibold tracking-tight">
                      {s.name}
                    </h3>
                    {s.badge && (
                      <span className="inline-flex items-center rounded-md bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] font-mono">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-faint">{s.blurb}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {s.tools.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[11.5px] px-2 py-0.5 rounded-md bg-surface-2 text-muted ring-1 ring-white/5"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border-strong bg-surface/40 p-5 text-[13.5px] text-muted">
          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-acid-400/10 text-acid-400 ring-1 ring-acid-400/20 text-[10px] font-mono shrink-0">
            v2
          </span>
          <span>
            <span className="text-fg font-medium">Coming next:</span> OAuth services
            (Gmail, Drive, Slack), 1Password / Bitwarden adapters, and project{" "}
            <em className="not-italic font-serif">contexts</em> — switch Supabase +
            GitHub + Vercel + Stripe at once.
          </span>
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
