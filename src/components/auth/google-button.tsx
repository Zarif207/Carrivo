import { cn } from "@/lib/utils";

/** A plain link (full navigation): Google sign-in leaves the site and comes back to /auth/google/callback. */
export function GoogleButton({ next, label = "Continue with Google", className }: { next?: string | null; label?: string; className?: string }) {
  const href = next ? `/api/auth/google/start?next=${encodeURIComponent(next)}` : "/api/auth/google/start";
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-input bg-card px-6 text-base font-semibold outline-none transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.57-5.15 3.57-8.81Z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95h-4v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1h-4A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1Z" />
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
      </svg>
      {label}
    </a>
  );
}
