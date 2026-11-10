import { unstable_rethrow } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SignedOutActions } from "./header-account-client";
import { DesktopAccount, MobileAccount } from "./header-account-menu";
import type { ShellUser } from "./user-menu";

/**
 * The public header's account area: request-time (cookies), so it renders under <Suspense> with
 * <SignedOutActions> as the fallback and the header shell stays static. Signed-out visitors cost no
 * API call (no session cookie); signed-in ones share the request-cached GET /users/me.
 */
export async function HeaderAccount({ variant }: { variant: "desktop" | "mobile" }) {
  let user: ShellUser | null = null;
  try {
    const current = await getCurrentUser();
    // Only what the menu shows reaches the client.
    if (current) user = { name: current.user.name, email: current.user.email, image: current.user.image, role: current.user.role };
  } catch (error) {
    unstable_rethrow(error); // prerender bail-outs and redirects belong to Next
    user = null; // the API is unreachable: show the signed-out actions rather than break the page
  }
  if (!user) return <SignedOutActions variant={variant} />;
  return variant === "desktop" ? <DesktopAccount user={user} /> : <MobileAccount user={user} />;
}
