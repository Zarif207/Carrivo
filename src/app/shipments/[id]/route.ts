import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { UUID } from "@/lib/ids";
import type { Role } from "@/types";

/**
 * Landing URL used in the API's emails: FRONTEND_URL/shipments/:id.
 * Sends each role to its own view of the shipment; logged-out visitors go to /login and come back here.
 */

function targetFor(role: Role, id: string): string {
  switch (role) {
    case "CUSTOMER":
      return `/dashboard/shipments/${id}`;
    case "COURIER":
      return `/courier/tasks/${id}`;
    case "ADMIN":
      // /admin/shipments opens the detail sheet for ?view=<id> (Phase 7).
      return `/admin/shipments?view=${id}`;
  }
}

export async function GET(request: NextRequest, { params }: RouteContext<"/shipments/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  // Route handler: always request time, so reading the clock here is fine.
  const session = readSession(request.cookies, Date.now());

  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `/shipments/${id}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(new URL(targetFor(session.role, id), request.url));
}
