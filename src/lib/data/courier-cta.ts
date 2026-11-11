import "server-only";

import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SIGNED_OUT_CTA, courierCta, type CourierCta } from "@/lib/courier-cta";
import type { MyCourierApplications } from "@/types";

/**
 * The visitor's courier call to action (request-time; deduplicated per render, so the several buttons
 * on one page cost one GET /users/me, shared with the header, plus one applications read for
 * customers). Never throws and never redirects: a public page falls back to the signed-out button,
 * whose link still routes a signed-in visitor correctly through the proxy.
 */
export const getCourierCta = cache(async (): Promise<CourierCta> => {
  try {
    const current = await getCurrentUser(); // awaits connection() before cookies and the clock
    if (!current) return SIGNED_OUT_CTA;
    const { role } = current.user;
    let mine: MyCourierApplications | null = null;
    if (role === "CUSTOMER") {
      mine = await serverFetch<MyCourierApplications>(endpoints.courierApplications.mine, { auth: current.session.token })
        .then((result) => result.data)
        .catch(() => null);
    }
    return courierCta(role, mine, new Date());
  } catch (error) {
    unstable_rethrow(error); // prerender bail-outs belong to Next
    return SIGNED_OUT_CTA;
  }
});
