"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Artist = {
  name: string;
  image?: string;
  genres?: string[];
  spotifyUrl?: string;
};

type Track = {
  name: string;
  artists: string;
  album: string;
  image?: string;
  spotifyUrl?: string;
};

type ArtistsByTime = Record<string, Artist[]>;
type GenresByTime = Record<string, { genre: string; percent: number }[]>;
type TracksByTime = Record<string, Track[]>;

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [artistsByTime, setArtistsByTime] = useState<ArtistsByTime | null>(null);
  const [genresByTime, setGenresByTime] = useState<GenresByTime | null>(null);
  const [tracksByTime, setTracksByTime] = useState<TracksByTime | null>(null);

  const [activeTab, setActiveTab] =
    useState<"tracks" | "artists" | "genres">("tracks");

  const [topN, setTopN] = useState<number>(10);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    async function init() {
      try {
        const profileRes = await fetch("/api/spotify/profile");
        if (profileRes.status === 401) {
          setLoggedIn(false);
          return;
        }

        const profileData = await profileRes.json();
        setProfile(profileData.profile);

        setArtistsByTime(
          await (await fetch("/api/spotify/top-artists-by-time")).json()
        );
        setGenresByTime(
          await (await fetch("/api/spotify/top-genres-by-time")).json()
        );
        setTracksByTime(
          await (await fetch("/api/spotify/top-tracks-by-time")).json()
        );

        setLoggedIn(true);
      } catch {
        setLoggedIn(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    // 觸發動畫（Tab 或 Top N 變動）
    setAnimateKey((k) => k + 1);
  }, [activeTab, topN]);

  if (loggedIn === null) return <main style={center}>Loading...</main>;

  if (loggedIn === false)
    return (
      <main style={{ ...center, flexDirection: "column" }}>
        <h1>SpotifyAnalyzer</h1>
        <a href="/api/auth/login">
          <button style={spotifyButton}>Login with Spotify</button>
        </a>
      </main>
    );

  const ranges: Record<string, string> = {
    short_term: "Last Month",
    medium_term: "Last 6 Months",
    long_term: "Last Year",
  };

  return (
    <main style={page}>
      {/* Profile */}
      {profile && (
        <div style={profileRow}>
          {profile.image && <img src={profile.image} style={avatar} />}
          <h2>{profile.name}</h2>
        </div>
      )}

      {/* Tabs */}
      <div style={tabs}>
        {[
          ["tracks", "Top Tracks"],
          ["artists", "Top Artists"],
          ["genres", "Top Genres"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            style={{
              ...tabBtn,
              backgroundColor: activeTab === key ? "#1ED760" : "#eee",
              color: activeTab === key ? "#fff" : "#000",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top N controls（放在 Tabs 下方） */}
      {(activeTab === "tracks" || activeTab === "artists") && (
        <div style={topNWrap}>
          {[10, 50].map((n) => (
            <button
              key={n}
              onClick={() => setTopN(n)}
              style={{
                ...tabBtn,
                backgroundColor: topN === n ? "#1ED760" : "#f3f3f3",
                color: topN === n ? "#fff" : "#000",
              }}
            >
              Top {n}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div key={animateKey} style={columnsAnimated}>
        {Object.entries(ranges).map(([rangeKey, rangeLabel]) => (
          <div key={rangeKey} style={column}>
            <h3>{rangeLabel}</h3>

            {/* Tracks */}
            {activeTab === "tracks" &&
              tracksByTime?.[rangeKey]
                ?.slice(0, topN)
                .map((t, i) => (
                  <a
                    key={t.name}
                    href={t.spotifyUrl}
                    target="_blank"
                    style={card}
                  >
                    <span style={rank}>{i + 1}</span>
                    {t.image && <img src={t.image} style={thumb} />}
                    <div>
                      <strong>{t.name}</strong>
                      <div style={sub}>{t.artists}</div>
                    </div>
                  </a>
                ))}

            {/* Artists */}
            {activeTab === "artists" &&
              artistsByTime?.[rangeKey]
                ?.slice(0, topN)
                .map((a, i) => (
                  <a
                    key={a.name}
                    href={a.spotifyUrl}
                    target="_blank"
                    style={card}
                  >
                    <span style={rank}>{i + 1}</span>
                    {a.image && <img src={a.image} style={thumb} />}
                    <div>
                      <strong>{a.name}</strong>
                      <div style={sub}>
                        {a.genres?.slice(0, 2).join(", ")}
                      </div>
                    </div>
                  </a>
                ))}

            {/* Genres */}
            {activeTab === "genres" &&
              genresByTime?.[rangeKey]?.map((g, i) => (
                <div key={g.genre} style={{ marginBottom: 14 }}>
                  <strong>
                    {i + 1}. {g.genre}
                  </strong>
                  <div style={barWrap}>
                    <div style={{ ...bar, width: `${g.percent}%` }} />
                    <span>{g.percent}%</span>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </main>
  );
}

/* ---------- styles ---------- */

const center: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const page: CSSProperties = {
  ...center,
  flexDirection: "column",
  padding: 32,
};

const spotifyButton: CSSProperties = {
  backgroundColor: "#1ED760",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "10px 18px",
  fontWeight: 600,
  cursor: "pointer",
};

const profileRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  marginBottom: 28,
};

const avatar: CSSProperties = { 
  width: 88, 
  height: 88, 
  borderRadius: "50%", 
};

const tabs: CSSProperties = { 
  display: "flex", 
  gap: 12, 
  marginBottom: 12, 
};

const topNWrap: CSSProperties = {
  display: "flex",
  gap: 12,
  marginBottom: 28,
};

const tabBtn: CSSProperties = {
  border: "none",
  borderRadius: 6,
  padding: "8px 14px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.25s ease",
};

const columnsAnimated: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 24,
  width: "100%",
  maxWidth: 1000,
  animation: "fadeIn 0.35s ease",
};

const column: CSSProperties = {
  borderLeft: "2px solid #f0f0f0",
  paddingLeft: 16,
};

const card: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  padding: 8,
  marginBottom: 10,
  border: "1px solid #eee",
  borderRadius: 8,
  textDecoration: "none",
  color: "#000",
  transition: "transform 0.15s ease",
};

const rank: CSSProperties = { 
  width: 20, 
  fontWeight: 600, 
};

const thumb: CSSProperties = { 
  width: 48, 
  height: 48, 
  borderRadius: 6, 
};

const sub: CSSProperties = { 
  fontSize: 12, 
  color: "#666", 
};

const barWrap: CSSProperties = { 
  display: "flex", 
  alignItems: "center", 
  gap: 8, 
};

const bar: CSSProperties = {
  height: 14,
  backgroundColor: "#1ED760",
  borderRadius: 4,
};
