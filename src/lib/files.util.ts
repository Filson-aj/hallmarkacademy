import { Dropbox } from "dropbox";

const {
    DROPBOX_APP_KEY,
    DROPBOX_APP_SECRET,
    DROPBOX_REFRESH_TOKEN,
} = process.env;

/**
 * Exchange refresh token for a fresh access token
 */
async function fetchAccessToken(): Promise<string> {
    if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET || !DROPBOX_REFRESH_TOKEN) {
        throw new Error("Dropbox env vars not configured");
    }
    const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: DROPBOX_REFRESH_TOKEN,
        client_id: DROPBOX_APP_KEY,
        client_secret: DROPBOX_APP_SECRET,
    });

    const res = await fetch("https://api.dropbox.com/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to refresh Dropbox token: ${err}`);
    }
    const json = await res.json();
    return json.access_token;
}

/**
 * Convert a URL or direct path into a Dropbox API path
 */
export function urlToDropboxPath(input: string): string | null {
    if (/^https?:\/\//.test(input)) {
        try {
            const parts = input.split("/upload/");
            if (parts.length !== 2) return null;
            let remainder = parts[1];
            remainder = remainder.replace(/^v\d+\//, "");
            return `/${remainder}`;
        } catch {
            return null;
        }
    }
    if (input.startsWith("/")) {
        return input;
    }
    return null;
}

/**
 * Deletes a file from Dropbox using the refresh-token flow
 */
export async function deleteFromDropbox(url: string): Promise<void> {
    const path = urlToDropboxPath(url);
    if (!path) {
        throw new Error(`Cannot derive Dropbox path from URL: ${url}`);
    }
    // get fresh access token
    const accessToken = await fetchAccessToken();
    // init client
    const dbx = new Dropbox({ accessToken, fetch });
    // delete file
    await dbx.filesDeleteV2({ path });
}
