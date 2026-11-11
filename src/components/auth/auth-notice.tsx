import { CircleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Messages for ?reason= and ?error= on /login and /register (Google errors come from the API, contract §3.6). */
const NOTICES: Record<string, { tone: "info" | "error"; text: string }> = {
  expired: { tone: "info", text: "Your session ended. Log in again to continue." },
  "role-changed": { tone: "info", text: "Your role changed, please sign in again. If your courier application was approved, you'll land on your courier dashboard." },
  "logged-out": { tone: "info", text: "You're logged out." },
  account_exists: {
    tone: "error",
    text: "That email already has a Carrivo account. Log in with your password; Google sign-in doesn't link to an existing account.",
  },
  account_deactivated: { tone: "error", text: "This account has been deactivated. Contact support if you think this is a mistake." },
  google_cancelled: { tone: "info", text: "Google sign-in was cancelled." },
  google_failed: { tone: "error", text: "Google sign-in didn't work. Try again, or use your email and password." },
};

export function AuthNotice({ reason, error }: { reason?: string | null; error?: string | null }) {
  const notice = (error && NOTICES[error]) || (reason && NOTICES[reason]);
  if (!notice) return null;
  const Icon = notice.tone === "error" ? CircleAlert : Info;
  return (
    <p
      role={notice.tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl p-4 text-sm font-medium",
        notice.tone === "error" ? "bg-danger-soft text-danger" : "bg-info-soft text-info",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {notice.text}
    </p>
  );
}
