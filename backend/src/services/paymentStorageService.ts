import { randomUUID } from "node:crypto";
import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";

export type StorageUploadResult = {
  file_id: string;
  file_url: string;
  web_view_link: string;
};

function getBucket(): string {
  return (
    process.env.PAYMENT_STORAGE_BUCKET?.trim() || "payment-proofs"
  );
}

async function ensureBucket(bucket: string): Promise<void> {
  const { data, error } = await supabase.storage.getBucket(bucket);
  if (data && !error) return;

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  });

  // Ignore race where another request created it first
  if (
    createError &&
    !/already exists|duplicate/i.test(createError.message)
  ) {
    throw new AppError(
      502,
      `Could not create Supabase storage bucket "${bucket}": ${createError.message}. Create a private bucket named "${bucket}" in the Supabase dashboard (Storage).`,
      "STORAGE_BUCKET_ERROR",
    );
  }
}

/**
 * Upload payment screenshot to Supabase Storage (free tier).
 * Returns the object path (stored in DB); admin views use a signed URL.
 */
export async function uploadPaymentScreenshot(input: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  transactionId: string;
  participantLabel: string;
}): Promise<StorageUploadResult> {
  const bucket = getBucket();
  await ensureBucket(bucket);

  const safeTxn = input.transactionId.replace(/[^\w.-]+/g, "_").slice(0, 24);
  const ext =
    input.mimeType === "image/png"
      ? "png"
      : input.mimeType === "image/webp"
        ? "webp"
        : "jpg";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const path = `proofs/${stamp}_${safeTxn}_${randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, input.buffer, {
    contentType: input.mimeType,
    upsert: false,
  });

  if (error) {
    throw new AppError(
      502,
      `Failed to upload payment screenshot to Supabase Storage: ${error.message}`,
      "STORAGE_UPLOAD_FAILED",
    );
  }

  // Path is what we persist; signed URLs are generated when admins open the file.
  return {
    file_id: path,
    file_url: path,
    web_view_link: path,
  };
}

/** Turn a stored path (or legacy http URL) into a viewable link for admins. */
export async function resolvePaymentScreenshotUrl(
  stored: string | null | undefined,
  expiresInSeconds = 60 * 60,
): Promise<string | null> {
  if (!stored) return null;
  if (/^https?:\/\//i.test(stored)) return stored;

  const bucket = getBucket();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(stored, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
