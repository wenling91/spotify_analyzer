import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Artist = {
  name: string;
};

type GenreItem = {
  genre: string;
  count: number;
  percent: number;
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("spotify_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const baseUrl = "http://127.0.0.1:3000";

  // 1️⃣ 取得 Top Artists（by time）
  const artistsRes = await fetch(
    `${baseUrl}/api/spotify/top-artists-by-time`,
    { headers: { Cookie: `spotify_access_token=${token}` } }
  );

  // 2️⃣ 取得 Top Genres（by time）
  const genresRes = await fetch(
    `${baseUrl}/api/spotify/top-genres-by-time`,
    { headers: { Cookie: `spotify_access_token=${token}` } }
  );

  if (!artistsRes.ok || !genresRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch base data" },
      { status: 500 }
    );
  }

  const artistsByTime = await artistsRes.json();
  const genresByTime = await genresRes.json();

  /* ===============================
     📊 指標 1：Artist Concentration
     =============================== */
  const shortArtists: Artist[] = artistsByTime.short_term ?? [];
  const top3Count = shortArtists.slice(0, 3).length;
  const totalArtists = shortArtists.length || 1;

  const artistConcentration = Number(
    (top3Count / totalArtists).toFixed(2)
  );

  /* ===============================
     📊 指標 2：Genre Diversity
     =============================== */
  const shortGenres: GenreItem[] = genresByTime.short_term ?? [];
  const uniqueGenres = shortGenres.length;
  const maxGenres = 20; // 對齊 Spotify top artists limit

  const genreDiversity = Number(
    (uniqueGenres / maxGenres).toFixed(2)
  );

  /* ===============================
     📊 指標 3：Time Stability
     =============================== */
  const overlapRatio = (a: string[], b: string[]) => {
    const overlap = a.filter((x) => b.includes(x));
    return Number((overlap.length / Math.max(a.length, 1)).toFixed(2));
  };

  const artistStability = overlapRatio(
    (artistsByTime.short_term ?? []).map((a: Artist) => a.name),
    (artistsByTime.long_term ?? []).map((a: Artist) => a.name)
  );

  const genreStability = overlapRatio(
    (genresByTime.short_term ?? []).map((g: GenreItem) => g.genre),
    (genresByTime.long_term ?? []).map((g: GenreItem) => g.genre)
  );

  /* ===============================
     🧠 行為類型判斷
     =============================== */
  let listeningType = "Balanced Listener";

  if (artistConcentration > 0.6 && genreDiversity < 0.5) {
    listeningType = "Focused Listener";
  } else if (artistConcentration < 0.4 && genreDiversity > 0.6) {
    listeningType = "Explorer";
  }

  return NextResponse.json({
    listeningType,
    metrics: {
      artistConcentration,
      genreDiversity,
      artistStability,
      genreStability,
    },
  });
}
