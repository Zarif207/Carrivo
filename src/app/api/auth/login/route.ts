import type { NextRequest } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { assertSessionConfigured, authErrorResponse, signedInResponse } from "@/lib/auth/establish";
import { checkOrigin, clientIpOf, jsonError, readJson } from "@/lib/auth/http";
import { loginBodySchema } from "@/lib/validation/auth";
import type { AuthResult } from "@/types";

/** POST /api/auth/login { email, password, next? } → { user, redirectTo } + httpOnly session cookies. */
export async function POST(request: NextRequest) {
  const blocked = checkOrigin(request);
  if (blocked) return blocked;

  const parsed = loginBodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(400, "Validation failed", parsed.error.issues.map((i) => ({ path: `body.${i.path.join(".")}`, message: i.message })));
  }
  const { next, ...credentials } = parsed.data;

  try {
    assertSessionConfigured();
    const { data } = await serverFetch<AuthResult>(endpoints.auth.login, {
      method: "POST",
      auth: false,
      clientIp: clientIpOf(request),
      body: credentials,
    });
    return signedInResponse(data, next, "Login successful");
  } catch (error) {
    return authErrorResponse(error);
  }
}
