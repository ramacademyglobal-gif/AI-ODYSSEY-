import { google } from "googleapis";
import { Readable } from "node:stream";
import { AppError } from "../middleware/errorHandler.js";

export type DriveUploadResult = {
  file_id: string;
  file_url: string;
  web_view_link: string;
};

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

/**
 * Prefer OAuth (personal/Workspace user with storage quota).
 * Fall back to service account (works only with Shared Drives, not My Drive).
 */
function loadDriveAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();

  if (clientId && clientSecret && refreshToken) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });
    return oauth2;
  }

  const jsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (jsonPath) {
    return new google.auth.GoogleAuth({
      keyFile: jsonPath,
      scopes: [DRIVE_SCOPE],
    });
  }

  if (clientEmail && privateKey) {
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: [DRIVE_SCOPE],
    });
  }

  throw new AppError(
    503,
    "Google Drive is not configured. For personal My Drive folders, add GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET + GOOGLE_OAUTH_REFRESH_TOKEN (run: npm run drive:auth). Service accounts only work with Shared Drives.",
    "DRIVE_NOT_CONFIGURED",
  );
}

/**
 * Accepts a raw folder id or a full Drive folder URL and returns the id only.
 * Example URL: https://drive.google.com/drive/folders/<FOLDER_ID>
 */
function getFolderId(): string {
  const raw = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!raw) {
    throw new AppError(
      503,
      "GOOGLE_DRIVE_FOLDER_ID is missing in backend .env",
      "DRIVE_FOLDER_MISSING",
    );
  }

  const fromUrl = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1];
  const folderId = fromUrl ?? raw.replace(/^["']|["']$/g, "").trim();

  if (!folderId) {
    throw new AppError(
      503,
      "GOOGLE_DRIVE_FOLDER_ID is invalid",
      "DRIVE_FOLDER_MISSING",
    );
  }

  return folderId;
}

function mapDriveError(err: unknown): AppError {
  const message = err instanceof Error ? err.message : "Unknown Drive error";
  const lower = message.toLowerCase();

  if (
    lower.includes("storage quota") ||
    lower.includes("service accounts do not have storage")
  ) {
    return new AppError(
      502,
      "Google service accounts cannot upload into personal My Drive (no storage quota). Use OAuth instead: create an OAuth Desktop client in Google Cloud, then run `npm run drive:auth` in backend and add the printed GOOGLE_OAUTH_* values to .env. Or move the folder into a Shared Drive and keep the service account.",
      "DRIVE_SA_QUOTA",
    );
  }

  return new AppError(
    502,
    `Failed to upload payment screenshot to Google Drive: ${message}`,
    "DRIVE_UPLOAD_FAILED",
  );
}

/**
 * Upload a payment screenshot into the configured Drive folder.
 * Returns a web view link organizers can open anytime.
 */
export async function uploadPaymentScreenshot(input: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  transactionId: string;
  participantLabel: string;
}): Promise<DriveUploadResult> {
  const auth = loadDriveAuth();
  const drive = google.drive({ version: "v3", auth });
  const folderId = getFolderId();

  const safeTxn = input.transactionId.replace(/[^\w.-]+/g, "_").slice(0, 64);
  const ext =
    input.mimeType === "image/png"
      ? "png"
      : input.mimeType === "image/webp"
        ? "webp"
        : "jpg";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = `${timestamp}_${safeTxn}_${input.participantLabel}.${ext}`.slice(
    0,
    180,
  );

  try {
    const created = await drive.files.create({
      requestBody: {
        name,
        parents: [folderId],
        description: `AI ODYSSEY 24 payment proof · txn ${input.transactionId} · ${input.participantLabel}`,
      },
      media: {
        mimeType: input.mimeType,
        body: Readable.from(input.buffer),
      },
      fields: "id, webViewLink, webContentLink",
      supportsAllDrives: true,
    });

    const fileId = created.data.id;
    if (!fileId) {
      throw new AppError(
        500,
        "Drive upload succeeded but no file id was returned",
        "DRIVE_UPLOAD_FAILED",
      );
    }

    const webViewLink =
      created.data.webViewLink ||
      `https://drive.google.com/file/d/${fileId}/view`;

    return {
      file_id: fileId,
      file_url: webViewLink,
      web_view_link: webViewLink,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw mapDriveError(err);
  }
}
