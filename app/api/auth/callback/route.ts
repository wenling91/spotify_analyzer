import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "No code provided" },
      { status: 400 }
    );
  }

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return NextResponse.json(tokenData, { status: 500 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://127.0.0.1:3000";
  const response = NextResponse.redirect(baseUrl);

  // 根據環境自動判斷是否使用 secure
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set("spotify_access_token", tokenData.access_token, {
    httpOnly: true,
    secure: isProduction, // 本機開發必須是 false
    sameSite: "lax",
    maxAge: tokenData.expires_in,
  });

  return response;
}
