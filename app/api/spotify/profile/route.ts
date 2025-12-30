import { NextResponse } from "next/server";
import { cookies as getCookies } from "next/headers";

export async function GET() {
  const cookieStore = await getCookies(); // ← await!
  const accessToken = cookieStore.get("spotify_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "User not logged in" }, { status: 401 });
  }

  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();

  return NextResponse.json({
    profile: {
      name: data.display_name,
      country: data.country,
      followers: data.followers?.total,
      image: data.images?.[0]?.url,
    },
  });
}
