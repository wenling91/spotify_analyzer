import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("spotify_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const ranges = ["short_term", "medium_term", "long_term"];
  const result: Record<string, { genre: string; percent: number }[]> = {};

  for (const range of ranges) {
    const res = await fetch(
      `https://api.spotify.com/v1/me/top/artists?time_range=${range}&limit=20`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      result[range] = [];
      continue;
    }

    const data = await res.json();
    const genreCount: Record<string, number> = {};

    // 統計每個 genre 出現次數
    data.items.forEach((artist: any) => {
      artist.genres.forEach((genre: string) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    const total = Object.values(genreCount).reduce((a, b) => a + b, 0);

    // 計算百分比並排序取前10
    const topGenres = Object.entries(genreCount)
      .map(([genre, count]) => ({ genre, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 10);

    result[range] = topGenres;
  }

  return NextResponse.json(result);
}
