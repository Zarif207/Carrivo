import type { NextRequest } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { assertSessionConfigured, authErrorResponse, signedInResponse } from "@/lib/auth/establish";
import { checkOrigin, clientIpOf, jsonError, readJson } from "@/lib/auth/http";
import { demoBodySchema, type DemoRole } from "@/lib/validation/auth";
import type { AuthResult } from "@/types";

/** The fixed seeded accounts. Only a role comes from the browser; email and password never do. */
const DEMO_EMAILS: Record<DemoRole, string | undefined> = {
  ADMIN: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL,
  COURIER: process.env.NEXT_PUBLIC_DEMO_COURIER_EMAIL,
  CUSTOMER: process.env.NEXT_PUBLIC_DEMO_CUSTOMER_EMAIL,
};

/** POST /api/auth/demo { role } → signs in as that role's demo account using the server-only DEMO_PASSWORD. */
export async function POST(request: NextRequest) {
  const blocked = checkOrigin(request);
  if (blocked) return blocked;

  const parsed = demoBodySchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, "Choose Admin, Courier or Customer.", [{ path: "body.role", message: "Invalid role" }]);

  const password = process.env.DEMO_PASSWORD;
  const email = DEMO_EMAILS[parsed.data.role];
  if (!password || !email) {
    return jsonError(503, "Demo login isn't set up on this server yet. Sign in with your own account or ask the site owner to add the demo password.", [], "DEMO_NOT_CONFIGURED");
  }

  try {
    assertSessionConfigured();
    const { data } = await serverFetch<AuthResult>(endpoints.auth.login, {
      method: "POST",
      auth: false,
      clientIp: clientIpOf(request),
      body: { email, password },
    });
    return signedInResponse(data, parsed.data.next, "Login successful");
  } catch (error) {
    return authErrorResponse(error);
  }
}
