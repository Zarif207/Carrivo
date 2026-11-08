import "server-only";

import { endpoints } from "@/lib/api/endpoints";
import type { Paginated } from "@/lib/api/types";
import type { AppNotification, NotificationQuery } from "@/types";
import { sessionFetchList } from "./session-fetch";

/* Notification reads for any signed-in role (GET /notifications/my is "Auth" in the API). */

export const listMyNotifications = (query: NotificationQuery): Promise<Paginated<AppNotification>> =>
  sessionFetchList<AppNotification>(endpoints.notifications.mine, { query });
