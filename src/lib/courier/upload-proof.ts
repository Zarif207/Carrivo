"use client";

import { endSession } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { ShipmentDetail } from "@/types";

interface XhrResult {
  status: number;
  body: unknown;
}

function send(path: string, file: File, onProgress: (percent: number) => void, signal?: AbortSignal): Promise<XhrResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/bff${path}`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.response as unknown });
    xhr.onerror = () => reject(new ApiError(0, "The upload didn't reach the server. Check your connection and try again."));
    xhr.ontimeout = () => reject(new ApiError(0, "The upload took too long. Check your connection and try again."));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.timeout = 120_000;

    const form = new FormData();
    form.append("image", file, file.name); // the API wants exactly one file in `image`
    xhr.send(form);
  });
}

/**
 * POST /shipments/:id/proof through the BFF with real upload progress (fetch can't report it).
 * Same session rule as apiFetch: one refresh attempt on 401, then the session ends.
 */
export async function uploadProof(shipmentId: string, file: File, onProgress: (percent: number) => void, signal?: AbortSignal): Promise<ShipmentDetail> {
  const path = endpoints.shipments.proof(shipmentId);
  let result = await send(path, file, onProgress, signal);
  if (result.status === 401) {
    const refreshed = await fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
      .then((r) => r.ok)
      .catch(() => false);
    if (refreshed) {
      onProgress(0);
      result = await send(path, file, onProgress, signal);
    }
    if (!refreshed || result.status === 401) {
      endSession();
      throw new ApiError(401, "Your session ended. Log in again.");
    }
  }
  const body = result.body as { success?: boolean; data?: ShipmentDetail } | null;
  if (result.status < 200 || result.status >= 300 || !body || body.success !== true || !body.data) {
    throw ApiError.fromBody(result.status, body, "The photo couldn't be saved. Try again.");
  }
  return body.data;
}
