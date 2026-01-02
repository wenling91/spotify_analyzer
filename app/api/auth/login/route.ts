import { NextResponse } from "next/server";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    scope: [
      "user-read-email",
      "user-top-read",
      "user-read-private",
    ].join(" "),
    show_dialog: "true",
  });

  return NextResponse.redirect(
    `${SPOTIFY_AUTH_URL}?${params.toString()}`
  );
}
