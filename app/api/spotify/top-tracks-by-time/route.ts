import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("spotify_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const ranges = ["short_term", "medium_term", "long_term"];
  const result: Record<string, any[]> = {};

  for (const range of ranges) {
    const res = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${range}&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      result[range] = [];
      continue;
    }

    const data = await res.json();
    result[range] = data.items.map((track: any) => ({
      name: track.name,
      artists: track.artists.map((a: any) => a.name).join(", "),
      album: track.album.name,
      image: track.album.images[0]?.url,
      spotifyUrl: track.external_urls?.spotify ?? null,
    }));
  }

  return NextResponse.json(result);
}
