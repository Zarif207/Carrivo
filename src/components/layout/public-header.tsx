import { Suspense } from "react";
import { HeaderAccount } from "./header-account";
import { SignedOutActions } from "./header-account-client";
import { SiteHeader } from "./site-header";

/**
 * The public site header. The shell is static (prerendered with the signed-out actions); only the
 * account area reads the session, request-time, and streams in under its own <Suspense>.
 */
export function PublicSiteHeader() {
  return (
    <SiteHeader
      account={
        <Suspense fallback={<SignedOutActions variant="desktop" />}>
          <HeaderAccount variant="desktop" />
        </Suspense>
      }
      mobileAccount={
        <Suspense fallback={<SignedOutActions variant="mobile" />}>
          <HeaderAccount variant="mobile" />
        </Suspense>
      }
    />
  );
}
