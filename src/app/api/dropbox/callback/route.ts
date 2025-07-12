// src/app/api/dropbox/callback/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) {
        return new NextResponse("No code provided", { status: 400 });
    }
    // Show the code in the browser for you to copy
    return new NextResponse(
        `Dropbox returned code: ${code}\n\n` +
        `Now copy that code into your terminal to exchange for tokens.`
    );
}
