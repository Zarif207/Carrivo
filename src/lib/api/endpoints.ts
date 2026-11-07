/**
 * Every API path the UI uses, relative to API_BASE_URL (…/api/v1). One place, so no
 * component ever hand-writes a URL. Source: docs/API_CONTRACT.md.
 */

const seg = (value: string): string => encodeURIComponent(value);

export const endpoints = {
  health: "/health",

  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    refreshToken: "/auth/refresh-token",
    changePassword: "/auth/change-password",
    /** Browser navigation only (302 to Google), never fetch()ed. */
    googleStart: "/auth/google",
    googleExchange: "/auth/google/exchange",
  },

  users: {
    me: "/users/me",
  },

  zones: {
    list: "/zones",
    create: "/zones",
    detail: (id: string) => `/zones/${seg(id)}`,
  },

  hubs: {
    list: "/hubs",
    create: "/hubs",
    detail: (id: string) => `/hubs/${seg(id)}`,
  },

  pricing: {
    estimate: "/pricing/estimate",
    list: "/pricing",
    create: "/pricing",
    detail: (id: string) => `/pricing/${seg(id)}`,
  },

  shipments: {
    list: "/shipments",
    create: "/shipments",
    detail: (id: string) => `/shipments/${seg(id)}`,
    cancel: (id: string) => `/shipments/${seg(id)}/cancel`,
    pickup: (id: string) => `/shipments/${seg(id)}/pickup`,
    assign: (id: string) => `/shipments/${seg(id)}/assign`,
    unassign: (id: string) => `/shipments/${seg(id)}/unassign`,
    status: (id: string) => `/shipments/${seg(id)}/status`,
    proof: (id: string) => `/shipments/${seg(id)}/proof`,
  },

  tracking: {
    detail: (trackingId: string) => `/tracking/${seg(trackingId)}`,
  },

  couriers: {
    list: "/couriers",
    myTasks: "/couriers/me/tasks",
    myEarnings: "/couriers/me/earnings",
    myAvailability: "/couriers/me/availability",
  },

  payments: {
    initiate: "/payments/initiate",
    verify: "/payments/verify",
    mine: "/payments/my",
    detail: (id: string) => `/payments/${seg(id)}`,
  },

  admin: {
    users: "/admin/users",
    userRole: (id: string) => `/admin/users/${seg(id)}/role`,
    userStatus: (id: string) => `/admin/users/${seg(id)}/status`,
    dashboardStats: "/admin/dashboard-stats",
    auditLogs: "/admin/audit-logs",
    payments: "/admin/payments",
    refund: (id: string) => `/admin/payments/${seg(id)}/refund`,
  },

  notifications: {
    mine: "/notifications/my",
    readAll: "/notifications/read-all",
    read: (id: string) => `/notifications/${seg(id)}/read`,
  },
} as const;
