"use client";

// Client: pick or photograph, check and shrink, preview, then upload with progress (XHR via the BFF).
import { Camera, CircleAlert, ImageUp, Loader2, RefreshCw, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { ProofImage } from "@/components/shipments/detail-parts";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { PROOF_ACCEPT, ProofFileError, formatMegabytes, prepareProof } from "@/lib/courier/proof-file";
import { uploadProof } from "@/lib/courier/upload-proof";
import { cn } from "@/lib/utils";

type Phase =
  | { kind: "idle" }
  | { kind: "preparing"; percent: number }
  | { kind: "ready"; file: File; preview: string; originalBytes: number }
  | { kind: "uploading"; file: File; preview: string; originalBytes: number; percent: number };

interface ProofUploaderProps {
  shipmentId: string;
  trackingId: string;
  /** OUT_FOR_DELIVERY or DELIVERED (the only statuses the API accepts). */
  canUpload: boolean;
  existing: { url: string; uploadedAt: string | null } | null;
}

/** Plain words for every way POST /shipments/:id/proof can fail. */
function uploadError(error: unknown): string {
  if (!ApiError.isApiError(error)) return "The photo couldn't be uploaded. Try again.";
  switch (true) {
    case error.isNetworkError:
      return error.message;
    case error.status === 413:
      return "The photo is too large for the server (4 MB max). Pick a smaller photo.";
    case error.status === 409:
      return "Proof photos can only be added while the parcel is out for delivery or after it's delivered.";
    case error.status === 404:
      return "This task is no longer assigned to you.";
    case error.status === 400 || error.status === 415:
      return `The server didn't accept this file: ${error.message}`;
    default:
      return error.message;
  }
}

export function ProofUploader({ shipmentId, trackingId, canUpload, existing }: ProofUploaderProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [, startTransition] = useTransition();
  const pickRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<string | null>(null);

  const setPreview = (url: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
  };

  // Free the preview and stop an upload when the page goes away.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const reset = () => {
    setPreview(null);
    setPhase({ kind: "idle" });
  };

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPhase({ kind: "preparing", percent: 0 });
    try {
      const prepared = await prepareProof(file, (percent) => setPhase({ kind: "preparing", percent }));
      const preview = URL.createObjectURL(prepared.file);
      setPreview(preview);
      setPhase({ kind: "ready", file: prepared.file, preview, originalBytes: prepared.originalBytes });
    } catch (err) {
      reset();
      setError(err instanceof ProofFileError ? err.message : "This photo can't be used. Take a new photo or pick another file.");
    }
  };

  const upload = async () => {
    if (phase.kind !== "ready") return;
    const { file, preview, originalBytes } = phase;
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ kind: "uploading", file, preview, originalBytes, percent: 0 });
    try {
      await uploadProof(shipmentId, file, (percent) => setPhase({ kind: "uploading", file, preview, originalBytes, percent }), controller.signal);
      toast.success(existing ? "Proof photo replaced" : "Proof photo added", { description: trackingId });
      reset();
      setReplacing(false);
      startTransition(() => router.refresh()); // shows the stored image
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setPhase({ kind: "ready", file, preview, originalBytes });
        return;
      }
      const message = uploadError(err);
      setError(message);
      toast.error("Upload failed", { description: message });
      setPhase({ kind: "ready", file, preview, originalBytes }); // keep the photo so they can retry
    }
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // picking the same file again still fires
    void choose(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void choose(event.dataTransfer.files[0]);
  };

  const showPicker = canUpload && (!existing || replacing);
  const busy = phase.kind === "preparing" || phase.kind === "uploading";

  return (
    <div className="space-y-4">
      {existing && !replacing ? <ProofImage url={existing.url} uploadedAt={existing.uploadedAt} trackingId={trackingId} /> : null}

      {!canUpload && !existing ? (
        <p className="text-sm text-muted-foreground">You can add a proof photo once the parcel is out for delivery.</p>
      ) : null}

      {canUpload && existing && !replacing ? (
        <Button variant="outline" onClick={() => setReplacing(true)}>
          <RefreshCw aria-hidden="true" /> Replace photo
        </Button>
      ) : null}

      {showPicker ? (
        <div className="space-y-4">
          {/* Hidden inputs: one opens the camera on phones, one opens files. */}
          <input ref={pickRef} type="file" accept={PROOF_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
          <input
            ref={cameraRef}
            type="file"
            accept={PROOF_ACCEPT}
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={onFile}
          />

          {phase.kind === "ready" || phase.kind === "uploading" ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local blob: preview, not a remote image */}
              <img src={phase.preview} alt="Preview of the photo you're about to upload" className="aspect-4/3 w-full rounded-lg bg-surface object-cover" />
              <p className="text-sm text-muted-foreground tabular">
                {/* Only call it shrunk when it saved at least 10 %. */}
                {phase.file.size < phase.originalBytes * 0.9
                  ? `Shrunk from ${formatMegabytes(phase.originalBytes)} to ${formatMegabytes(phase.file.size)}.`
                  : `${formatMegabytes(phase.file.size)}, ready to upload.`}
              </p>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-input px-6 py-10 text-center transition-colors",
                dragging && "border-brand bg-brand/5",
              )}
            >
              {phase.kind === "preparing" ? (
                <>
                  <Loader2 className="size-8 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden="true" />
                  <p className="font-medium" role="status">
                    Preparing photo… {phase.percent ? `${phase.percent}%` : null}
                  </p>
                </>
              ) : (
                <>
                  <ImageUp className="size-8 text-muted-foreground" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-semibold">Add a photo of the handover</p>
                    <p className="text-sm text-muted-foreground">JPEG, PNG or WebP. Big photos are shrunk to under 3.5 MB first.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button type="button" onClick={() => cameraRef.current?.click()} className="md:hidden">
                      <Camera aria-hidden="true" /> Take photo
                    </Button>
                    <Button type="button" variant="outline" onClick={() => pickRef.current?.click()}>
                      <Upload aria-hidden="true" /> Choose file
                    </Button>
                  </div>
                  <p className="hidden text-xs text-muted-foreground md:block">Or drop a photo here.</p>
                </>
              )}
            </div>
          )}

          {phase.kind === "uploading" ? (
            <div className="space-y-1.5">
              <div role="progressbar" aria-label="Uploading proof photo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase.percent} className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${phase.percent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground tabular" aria-live="polite">
                {phase.percent < 100 ? `Uploading… ${phase.percent}%` : "Saving…"}
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
            {phase.kind === "uploading" ? (
              <Button variant="outline" onClick={() => abortRef.current?.abort()}>
                <X aria-hidden="true" /> Stop upload
              </Button>
            ) : null}
            {phase.kind === "ready" ? (
              <>
                <Button variant="outline" onClick={() => pickRef.current?.click()}>
                  Choose another
                </Button>
                <Button onClick={() => void upload()}>
                  <Upload aria-hidden="true" /> {existing ? "Upload and replace" : "Upload photo"}
                </Button>
              </>
            ) : null}
            {replacing && !busy ? (
              <Button
                variant="ghost"
                onClick={() => {
                  reset();
                  setError(null);
                  setReplacing(false);
                }}
              >
                Keep current photo
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
