"use client";

import imageCompression from "browser-image-compression";

/** The API accepts ≤ 4 MB; aim below it so multipart overhead and Vercel's 4.5 MB body cap never bite. */
export const PROOF_TARGET_BYTES = 3.5 * 1024 * 1024;
/** Bigger originals aren't worth decoding on a phone. */
export const PROOF_INPUT_MAX_BYTES = 25 * 1024 * 1024;
export const PROOF_ACCEPT = "image/jpeg,image/png,image/webp";

export type ProofMime = "image/jpeg" | "image/png" | "image/webp";

export class ProofFileError extends Error {
  constructor(
    readonly kind: "type" | "too-large" | "unreadable",
    message: string,
  ) {
    super(message);
    this.name = "ProofFileError";
  }
}

/**
 * The real type from the first bytes, not the name or the browser's guess: an SVG renamed to
 * .png is still text. Mirrors the API's own check (bytes must match JPEG, PNG or WebP).
 */
export async function sniffImageType(file: Blob): Promise<ProofMime | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return "image/png";
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

/** "820 KB" under 1 MB, "3.4 MB" above. */
const MB = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);

export interface PreparedProof {
  file: File;
  originalBytes: number;
}

/**
 * Checks the type, then shrinks the photo to ≤ 3.5 MB (max 2560 px on the long side).
 * PNGs become JPEGs (photos compress far better); WebP stays WebP. Throws ProofFileError.
 */
export async function prepareProof(input: File, onProgress?: (percent: number) => void): Promise<PreparedProof> {
  const type = await sniffImageType(input);
  if (!type) throw new ProofFileError("type", "That isn't a JPEG, PNG or WebP photo. Take a new photo or pick another file.");
  if (input.size > PROOF_INPUT_MAX_BYTES) throw new ProofFileError("too-large", `That file is ${MB(input.size)}. Pick a photo under 25 MB.`);

  const outType: ProofMime = type === "image/webp" ? "image/webp" : "image/jpeg";
  let compressed: Blob;
  try {
    compressed = await imageCompression(input, {
      maxSizeMB: PROOF_TARGET_BYTES / (1024 * 1024),
      maxWidthOrHeight: 2560,
      useWebWorker: true,
      fileType: outType,
      initialQuality: 0.85,
      onProgress,
    });
  } catch {
    throw new ProofFileError("unreadable", "This photo is damaged or can't be opened. Take a new photo or pick another file.");
  }

  // Already small originals can come out bigger after re-encoding: keep whichever is smaller.
  const useOriginal = input.size <= PROOF_TARGET_BYTES && input.size <= compressed.size;
  const blob = useOriginal ? input : compressed;
  const finalType = useOriginal ? type : outType;
  if (blob.size > PROOF_TARGET_BYTES) throw new ProofFileError("too-large", `Even after shrinking, the photo is ${MB(blob.size)}. Try a smaller photo.`);
  if ((await sniffImageType(blob)) === null) throw new ProofFileError("unreadable", "This photo couldn't be converted. Take a new photo or pick another file.");

  const ext = finalType === "image/webp" ? "webp" : finalType === "image/png" ? "png" : "jpg";
  const name = `${input.name.replace(/\.[^.]+$/, "") || "proof"}.${ext}`;
  return { file: new File([blob], name, { type: finalType }), originalBytes: input.size };
}

export { MB as formatMegabytes };
