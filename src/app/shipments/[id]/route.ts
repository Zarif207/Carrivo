import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIES } from "@/lib/api/config";
import { ROLES, type Role } from "@/types";

/**
 * Landing URL used in the API's emails: FRONTEND_URL/shipments/:id.
 * Sends each role to its own view of the shipment; logged-out visitors go to /login and come back here.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isRole = (value: string | undefined): value is Role =>
  value !== undefined && (ROLES as readonly string[]).includes(value);

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

  const store = await cookies();
  const hasSession = Boolean(store.get(AUTH_COOKIES.token)?.value);
  const role = store.get(AUTH_COOKIES.role)?.value;

  if (!hasSession || !isRole(role)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `/shipments/${id}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(new URL(targetFor(role, id), request.url));
}
