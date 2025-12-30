import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("spotify_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 1️⃣ 取得 Top Tracks
  const topTracksRes = await fetch(
    "https://api.spotify.com/v1/me/top/tracks?limit=20",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!topTracksRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch top tracks" },
      { status: 500 }
    );
  }

  const topTracksData = await topTracksRes.json();
  const trackIds = topTracksData.items.map((t: any) => t.id).join(",");

  // 2️⃣ 批次取得 Audio Features（關鍵）
  const featuresRes = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!featuresRes.ok) {
    const body = await featuresRes.text();
    console.error("Audio features error:", body);
    return NextResponse.json(
      { error: "Failed to fetch audio features" },
      { status: 500 }
    );
  }

  const featuresData = await featuresRes.json();
  const validFeatures = featuresData.audio_features.filter(
    (f: any) => f && f.energy != null
  );

  if (validFeatures.length === 0) {
    return NextResponse.json(
      { error: "No valid audio features found" },
      { status: 404 }
    );
  }

  // 3️⃣ 計算平均值
  const avg = (key: string) =>
    validFeatures.reduce((sum: number, f: any) => sum + f[key], 0) /
    validFeatures.length;

  return NextResponse.json({
    tracksAnalyzed: validFeatures.length,
    energy: avg("energy"),
    valence: avg("valence"),
    tempo: avg("tempo"),
  });
}
