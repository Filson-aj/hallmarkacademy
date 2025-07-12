import type { NextApiRequest, NextApiResponse } from 'next';

// pages/api/dropbox/token.ts
interface DropboxTokenResponse {
    access_token: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ access_token?: string; error?: string }>
): Promise<void> {
    const { DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_REFRESH_TOKEN } = process.env;
    console.log("⇢ TOKENS:", {
        DROPBOX_APP_KEY: Boolean(DROPBOX_APP_KEY),
        DROPBOX_APP_SECRET: Boolean(DROPBOX_APP_SECRET),
        DROPBOX_REFRESH_TOKEN: Boolean(DROPBOX_REFRESH_TOKEN),
    });

    if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET || !DROPBOX_REFRESH_TOKEN) {
        console.error("Missing one or more Dropbox env vars");
        return res.status(500).json({ error: "Dropbox env vars not set" });
    }

    const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: DROPBOX_REFRESH_TOKEN,
        client_id: DROPBOX_APP_KEY,
        client_secret: DROPBOX_APP_SECRET,
    });

    let tokenRes: Response;
    try {
        tokenRes = await fetch("https://api.dropbox.com/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });
    } catch (networkErr) {
        console.error("Network error fetching Dropbox token:", networkErr);
        return res.status(500).json({ error: "Network error refreshing token" });
    }

    const json: DropboxTokenResponse = await tokenRes.json();
    if (!tokenRes.ok) {
        console.error("Dropbox token endpoint returned error:", json);
        return res.status(500).json({ error: json.error_description || json.error || "Token refresh failed" });
    }

    console.log("Got new access_token (len):", (json.access_token as string).length);
    return res.status(200).json({ access_token: json.access_token });
}
