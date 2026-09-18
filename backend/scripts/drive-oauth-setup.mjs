/**
 * One-time helper: get a Google OAuth refresh token for Drive uploads
 * into a personal My Drive folder (service accounts have no storage quota).
 *
 * Prerequisites:
 * 1. Google Cloud Console → APIs & Services → Enable "Google Drive API"
 * 2. Credentials → Create OAuth client ID → Application type: Desktop app
 * 3. Put client id/secret in backend/.env as:
 *      GOOGLE_OAUTH_CLIENT_ID=...
 *      GOOGLE_OAUTH_CLIENT_SECRET=...
 * 4. Run: npm run drive:auth
 * 5. Sign in with the Google account that OWNS the payment folder
 * 6. Paste the printed GOOGLE_OAUTH_REFRESH_TOKEN into .env and restart backend
 */
import "dotenv/config";
import http from "node:http";
import { URL } from "node:url";
import { google } from "googleapis";

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
const redirectUri = "http://127.0.0.1:53682/oauth2callback";
const scope = ["https://www.googleapis.com/auth/drive"];

if (!clientId || !clientSecret) {
  console.error(
    "Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET in backend/.env",
  );
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope,
});

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1:53682");
    if (url.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const code = url.searchParams.get("code");
    const err = url.searchParams.get("error");
    if (err) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end(`OAuth error: ${err}`);
      server.close();
      process.exit(1);
    }
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing code");
      return;
    }

    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      "<h1>Drive OAuth OK</h1><p>You can close this tab and return to the terminal.</p>",
    );

    console.log("\nAdd these to backend/.env:\n");
    console.log(`GOOGLE_OAUTH_CLIENT_ID=${clientId}`);
    console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${clientSecret}`);
    if (tokens.refresh_token) {
      console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      console.log(
        "# No refresh_token returned. Revoke app access at https://myaccount.google.com/permissions and run again with prompt=consent.",
      );
    }
    console.log(
      "\nKeep GOOGLE_DRIVE_FOLDER_ID pointing at your payment folder. Restart the backend after saving.\n",
    );

    server.close();
    process.exit(0);
  } catch (e) {
    console.error(e);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Failed to exchange code");
    server.close();
    process.exit(1);
  }
});

server.listen(53682, "127.0.0.1", () => {
  console.log("Open this URL in your browser and approve Drive access:\n");
  console.log(authUrl);
  console.log("\nWaiting for OAuth callback on", redirectUri);
});
