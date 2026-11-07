import type { NextRequest } from "next/server";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import { assertSessionConfigured, authErrorResponse, signedInResponse } from "@/lib/auth/establish";
import { checkOrigin, clientIpOf, jsonError, readJson } from "@/lib/auth/http";
import { registerBodySchema } from "@/lib/validation/auth";
import type { AuthResult } from "@/types";

/** POST /api/auth/register → always a CUSTOMER account, signed in straight away. */
export async function POST(request: NextRequest) {
  const blocked = checkOrigin(request);
  if (blocked) return blocked;

  const parsed = registerBodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(400, "Validation failed", parsed.error.issues.map((i) => ({ path: `body.${i.path.join(".")}`, message: i.message })));
  }
  const { next, ...body } = parsed.data;

  try {
    assertSessionConfigured();
    const { data } = await serverFetch<AuthResult>(endpoints.auth.register, {
      method: "POST",
      auth: false,
      clientIp: clientIpOf(request),
      body,
    });
    return signedInResponse(data, next, "Registration successful", 201);
  } catch (error) {
    return authErrorResponse(error);
  }
}
