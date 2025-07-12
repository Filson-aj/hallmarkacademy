// pages/api/dropbox/callback.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Only respond to GET from Dropbox’s redirect
    if (req.method !== "GET") {
        return res
            .status(405)
            .setHeader("Allow", "GET")
            .send("Method Not Allowed");
    }

    const code = Array.isArray(req.query.code)
        ? req.query.code[0]
        : req.query.code;

    if (!code) {
        return res.status(400).send("Missing code");
    }

    // Show it in the browser so you can copy/paste into your curl
    res
        .status(200)
        .setHeader("Content-Type", "text/plain")
        .send(
            `✅ Dropbox returned code:\n\n${code}\n\n` +
            `Next, run this:\n` +
            `\n` +
            `curl https://api.dropbox.com/oauth2/token \\\n` +
            `  --request POST \\\n` +
            `  --header "Content-Type: application/x-www-form-urlencoded" \\\n` +
            `  --data-urlencode "code=${code}" \\\n` +
            `  --data-urlencode "grant_type=authorization_code" \\\n` +
            `  --data-urlencode "redirect_uri=http://localhost:3000/api/dropbox/callback" \\\n` +
            `  --data-urlencode "client_id=${process.env.DROPBOX_APP_KEY}" \\\n` +
            `  --data-urlencode "client_secret=${process.env.DROPBOX_APP_SECRET}"\n`
        );
}
