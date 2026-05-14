import type { SVGProps } from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M9 13V9a5 5 0 0110 0v4" strokeLinecap="round" />
      <rect x="6" y="13" width="16" height="11" rx="2.5" />
      <circle cx="13" cy="18.2" r="1.4" fill="currentColor" stroke="none" />
      <path d="M21 18h3" strokeLinecap="round" />
      <path d="M21 18l1.4-1.4M21 18l1.4 1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 7h8M7 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Play(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4 3l7 4-7 4V3z" />
    </svg>
  );
}

export function GitHubMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 0a8 8 0 00-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.22.48-2.69-1.07-2.69-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.88 2.34.67.07-.52.28-.88.51-1.08-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.21 2.2.82a7.6 7.6 0 014 0c1.53-1.03 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.74-3.66 3.94.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 008 0z" />
    </svg>
  );
}

export function SupabaseMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.85 1.34c.78-1.05 2.42-.49 2.42.83v8.24h6.27c1.36 0 2.13 1.6 1.27 2.7L10.16 22.66c-.78 1.05-2.42.5-2.42-.83v-8.24H1.47c-1.36 0-2.13-1.6-1.27-2.7L13.85 1.34z" />
    </svg>
  );
}

export function VercelMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2L2 20h20L12 2z" />
    </svg>
  );
}

export function StripeMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.479 9.883c-1.626-.602-2.512-1.066-2.512-1.764 0-.587.487-.926 1.348-.926 1.554 0 3.151.59 4.235 1.105l.629-3.851C16.328 4.045 14.667 3.5 12.345 3.5c-1.94 0-3.557.491-4.703 1.402-1.18.937-1.806 2.272-1.806 3.91 0 2.973 1.815 4.252 4.785 5.318 1.913.683 2.553 1.166 2.553 1.95 0 .763-.658 1.213-1.847 1.213-1.541 0-3.881-.736-5.408-1.674L5 19.532c1.296.732 3.71 1.476 6.21 1.476 2.052 0 3.762-.482 4.913-1.397 1.292-1.022 1.962-2.515 1.962-4.402 0-3.052-1.825-4.319-4.606-5.326z" />
    </svg>
  );
}

export function ClaudeMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.3L18 8v8l-6 3.7L6 16V8l6-3.7zm-1 4.2v6.5l-3-1.85V10.3L11 8.5zm2 0l3 1.8v3.05l-3 1.85V8.5z" />
    </svg>
  );
}

export function Check(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 7l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Lock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="9" width="12" height="9" rx="1.6" />
      <path d="M7 9V6.5a3 3 0 116 0V9" strokeLinecap="round" />
    </svg>
  );
}

export function Layers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 7l7-3.5L17 7l-7 3.5L3 7z" strokeLinejoin="round" />
      <path d="M3 13l7 3.5L17 13" strokeLinejoin="round" />
    </svg>
  );
}

export function Bolt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      <path d="M11 3l-6 9h4l-1 5 6-9h-4l1-5z" strokeLinejoin="round" />
    </svg>
  );
}

export function Search(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      {...props}
    >
      <circle cx="9" cy="9" r="5" />
      <path d="M13 13l3.5 3.5" strokeLinecap="round" />
    </svg>
  );
}

export function Key(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      <circle cx="7" cy="13" r="3" />
      <path d="M9.5 11l6.5-6.5M14 7l2 2" strokeLinecap="round" />
    </svg>
  );
}

export function Pulse(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      {...props}
    >
      <path d="M2 10h4l2-5 4 10 2-5h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Eye(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}
