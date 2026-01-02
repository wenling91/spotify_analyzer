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
  const [error, setError] = useState<string | null>(null);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    async function init() {
      try {
        // Fetch profile first
        const profileRes = await fetch("/api/spotify/profile");
        
        if (profileRes.status === 401) {
          setLoggedIn(false);
          return;
        }

        if (!profileRes.ok) {
          const errorData = await profileRes.json();
          setError(errorData.error || "Failed to fetch profile");
          setLoggedIn(false);
          return;
        }

        const profileData = await profileRes.json();
        
        if (profileData.error) {
          setError(profileData.error);
          setLoggedIn(false);
          return;
        }

        setProfile(profileData.profile);

        // Fetch music data in parallel with error handling
        const [artistsRes, genresRes, tracksRes] = await Promise.all([
          fetch("/api/spotify/top-artists-by-time"),
          fetch("/api/spotify/top-genres-by-time"),
          fetch("/api/spotify/top-tracks-by-time"),
        ]);

        // Check for token expiration
        if (artistsRes.status === 401 || genresRes.status === 401 || tracksRes.status === 401) {
          setError("Your session has expired. Please login again.");
          setLoggedIn(false);
          return;
        }

        // Check for rate limiting
        if (artistsRes.status === 429 || genresRes.status === 429 || tracksRes.status === 429) {
          setError("Too many requests. Please try again in a few minutes.");
        }

        // Parse responses
        const [artistsData, genresData, tracksData] = await Promise.all([
          artistsRes.json(),
          genresRes.json(),
          tracksRes.json(),
        ]);

        setArtistsByTime(artistsData);
        setGenresByTime(genresData);
        setTracksByTime(tracksData);

        setLoggedIn(true);
      } catch (err) {
        console.error("Init error:", err);
        setError("Something went wrong. Please try again later.");
        setLoggedIn(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    setAnimateKey((k) => k + 1);
  }, [activeTab, topN]);

  if (loggedIn === null)
    return (
      <main style={loadingScreen}>
        <div style={spinner} />
        <p style={{ marginTop: 20, color: "#666", fontSize: 16 }}>Loading your music...</p>
      </main>
    );

  if (loggedIn === false)
    return (
      <main style={loginScreen}>
        <div style={loginCard}>
          <div style={logoCircle}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <h1 style={loginTitle}>Spotify Music Analyzer</h1>
          <p style={loginSubtitle}>Discover your music taste over time</p>
          
          {error && (
            <div style={errorBox}>
              <p style={{ margin: 0, fontSize: 14 }}>⚠️ {error}</p>
            </div>
          )}
          
          <a href="/api/auth/login" style={{ textDecoration: "none" }}>
            <button style={spotifyButton}>
              <span>Login with Spotify</span>
            </button>
          </a>
        </div>
      </main>
    );

  const ranges: Record<string, string> = {
    short_term: "Last Month",
    medium_term: "Last 6 Months",
    long_term: "Last Year",
  };

  return (
    <main style={page}>
      <div style={container}>
        {/* Header with Profile */}
        {profile && (
          <div style={header}>
            <div style={profileSection}>
              {profile.image && (
                <div style={avatarWrapper}>
                  <img src={profile.image} style={avatar} alt="Profile" />
                </div>
              )}
              <div>
                <h1 style={userName}>{profile.name}</h1>
                <p style={userSubtitle}>{profile.name}'s music taste</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={errorBanner}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <strong>Error</strong>
              <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>{error}</p>
            </div>
          </div>
        )}

        {/* Loading Message for Data */}
        {!artistsByTime && !genresByTime && !tracksByTime && !error && (
          <div style={loadingBanner}>
            <div style={smallSpinner} />
            <span>Loading your music data...</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={tabsContainer}>
          <div style={tabs}>
            {[
              ["tracks", "Top Tracks", "🎵"],
              ["artists", "Top Artists", "🎤"],
              ["genres", "Top Genres", "🎸"],
            ].map(([key, label, emoji]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                style={{
                  ...tabBtn,
                  ...(activeTab === key ? tabBtnActive : {}),
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== key) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(30, 215, 96, 0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== key) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                  }
                }}
              >
                <span style={{ marginRight: 8 }}>{emoji}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Top N controls */}
          {(activeTab === "tracks" || activeTab === "artists") && (
            <div style={topNWrap}>
              {[10, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setTopN(n)}
                  style={{
                    ...topNBtn,
                    ...(topN === n ? topNBtnActive : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (topN !== n) {
                      e.currentTarget.style.backgroundColor = "#f0f0f0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (topN !== n) {
                      e.currentTarget.style.backgroundColor = "#fafafa";
                    }
                  }}
                >
                  Top {n}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div key={animateKey} style={columnsAnimated}>
          {Object.entries(ranges).map(([rangeKey, rangeLabel]) => (
            <div key={rangeKey} style={column}>
              <div style={columnHeader}>
                <h3 style={columnTitle}>{rangeLabel}</h3>
              </div>

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
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(4px)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.08)";
                        e.currentTarget.style.borderColor = "#1ED760";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.04)";
                        e.currentTarget.style.borderColor = "#f0f0f0";
                      }}
                    >
                      <span style={i < 3 ? rankTop : rank}>{i + 1}</span>
                      {t.image && (
                        <div style={thumbWrapper}>
                          <img src={t.image} style={thumb} alt={t.name} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={cardTitle}>{t.name}</div>
                        <div style={cardSubtitle}>{t.artists}</div>
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
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(4px)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.08)";
                        e.currentTarget.style.borderColor = "#1ED760";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.04)";
                        e.currentTarget.style.borderColor = "#f0f0f0";
                      }}
                    >
                      <span style={i < 3 ? rankTop : rank}>{i + 1}</span>
                      {a.image && (
                        <div style={thumbWrapper}>
                          <img src={a.image} style={thumbArtist} alt={a.name} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={cardTitle}>{a.name}</div>
                        <div style={cardSubtitle}>
                          {a.genres?.slice(0, 2).join(", ") || "Artist"}
                        </div>
                      </div>
                    </a>
                  ))}

              {/* Genres */}
              {activeTab === "genres" &&
                genresByTime?.[rangeKey]?.map((g, i) => (
                  <div key={g.genre} style={genreCard}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={i < 3 ? rankTop : rank}>{i + 1}</span>
                      <strong style={genreTitle}>{g.genre}</strong>
                    </div>
                    <div style={barContainer}>
                      <div style={barBackground}>
                        <div
                          style={{
                            ...barFill,
                            width: `${g.percent}%`,
                          }}
                        />
                      </div>
                      <span style={barLabel}>{g.percent}%</span>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </main>
  );
}

/* ---------- Styles ---------- */

const loadingScreen: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #1ED760 0%, #1DB954 100%)",
};

const spinner: CSSProperties = {
  width: 50,
  height: 50,
  border: "4px solid rgba(255, 255, 255, 0.3)",
  borderTop: "4px solid white",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const loginScreen: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #1ED760 0%, #1DB954 100%)",
  padding: 20,
};

const loginCard: CSSProperties = {
  background: "white",
  borderRadius: 24,
  padding: "60px 50px",
  textAlign: "center",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  maxWidth: 440,
  width: "100%",
};

const logoCircle: CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #1ED760 0%, #1DB954 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 30px",
  boxShadow: "0 8px 24px rgba(30, 215, 96, 0.4)",
};

const loginTitle: CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
  marginBottom: 12,
  color: "#191414",
};

const loginSubtitle: CSSProperties = {
  fontSize: 16,
  color: "#666",
  marginBottom: 36,
};

const spotifyButton: CSSProperties = {
  background: "linear-gradient(135deg, #1ED760 0%, #1DB954 100%)",
  color: "white",
  borderWidth: 0,
  borderStyle: "none",
  borderRadius: 50,
  padding: "16px 48px",
  fontSize: 18,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 16px rgba(30, 215, 96, 0.4)",
  transition: "all 0.3s ease",
  display: "inline-block",
};

const page: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(to bottom, #f8fafb 0%, #ffffff 100%)",
  padding: "40px 20px",
};

const container: CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  width: "100%",
};

const header: CSSProperties = {
  marginBottom: 40,
};

const profileSection: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 20,
  padding: 24,
  background: "white",
  borderRadius: 20,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
};

const avatarWrapper: CSSProperties = {
  position: "relative",
};

const avatar: CSSProperties = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  borderWidth: 4,
  borderStyle: "solid",
  borderColor: "#1ED760",
  boxShadow: "0 4px 12px rgba(30, 215, 96, 0.3)",
};

const userName: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "#191414",
  margin: 0,
};

const userSubtitle: CSSProperties = {
  fontSize: 14,
  color: "#666",
  margin: "4px 0 0 0",
};

const tabsContainer: CSSProperties = {
  marginBottom: 32,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const tabs: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const tabBtn: CSSProperties = {
  background: "white",
  color: "#666",
  borderWidth: 2,
  borderStyle: "solid",
  borderColor: "#f0f0f0",
  borderRadius: 12,
  padding: "14px 28px",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.3s ease",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  display: "flex",
  alignItems: "center",
};

const tabBtnActive: CSSProperties = {
  background: "linear-gradient(135deg, #1ED760 0%, #1DB954 100%)",
  color: "white",
  borderWidth: 2,
  borderStyle: "solid",
  borderColor: "#1ED760",
  boxShadow: "0 4px 16px rgba(30, 215, 96, 0.3)",
  transform: "translateY(-2px)",
};

const topNWrap: CSSProperties = {
  display: "flex",
  gap: 8,
};

const topNBtn: CSSProperties = {
  background: "#fafafa",
  color: "#666",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e0e0e0",
  borderRadius: 8,
  padding: "8px 20px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const topNBtnActive: CSSProperties = {
  background: "#1ED760",
  color: "white",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#1ED760",
};

const columnsAnimated: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 24,
  animation: "fadeIn 0.5s ease",
};

const column: CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
};

const columnHeader: CSSProperties = {
  marginBottom: 20,
  paddingBottom: 16,
  borderBottomWidth: 2,
  borderBottomStyle: "solid",
  borderBottomColor: "#f0f0f0",
};

const columnTitle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#191414",
  margin: 0,
};

const card: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: 12,
  marginBottom: 10,
  borderWidth: 2,
  borderStyle: "solid",
  borderColor: "#f0f0f0",
  borderRadius: 12,
  textDecoration: "none",
  color: "#191414",
  transition: "all 0.3s ease",
  background: "white",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
};

const rank: CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 14,
  color: "#666",
  flexShrink: 0,
};

const rankTop: CSSProperties = {
  ...rank,
  background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
  color: "white",
  borderRadius: "50%",
  fontSize: 13,
  boxShadow: "0 2px 8px rgba(255, 215, 0, 0.3)",
};

const thumbWrapper: CSSProperties = {
  flexShrink: 0,
};

const thumb: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 8,
  objectFit: "cover",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
};

const thumbArtist: CSSProperties = {
  ...thumb,
  borderRadius: "50%",
};

const cardTitle: CSSProperties = {
  fontWeight: 600,
  fontSize: 15,
  color: "#191414",
  marginBottom: 4,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const cardSubtitle: CSSProperties = {
  fontSize: 13,
  color: "#888",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const genreCard: CSSProperties = {
  padding: "16px 0",
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "#f5f5f5",
};

const genreTitle: CSSProperties = {
  fontSize: 15,
  color: "#191414",
  textTransform: "capitalize",
  flex: 1,
};

const barContainer: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const barBackground: CSSProperties = {
  flex: 1,
  height: 10,
  backgroundColor: "#f0f0f0",
  borderRadius: 10,
  overflow: "hidden",
};

const barFill: CSSProperties = {
  height: "100%",
  background: "linear-gradient(90deg, #1ED760 0%, #1DB954 100%)",
  borderRadius: 10,
  transition: "width 0.8s ease",
  boxShadow: "0 0 8px rgba(30, 215, 96, 0.4)",
};

const barLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#1ED760",
  minWidth: 45,
  textAlign: "right",
};

const errorBox: CSSProperties = {
  backgroundColor: "#FEE",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#FCC",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 20,
  color: "#C33",
};

const errorBanner: CSSProperties = {
  backgroundColor: "#FEF3F2",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#FEE4E2",
  borderRadius: 12,
  padding: 16,
  marginBottom: 24,
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  color: "#B42318",
};

const loadingBanner: CSSProperties = {
  backgroundColor: "#F0F9FF",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#E0F2FE",
  borderRadius: 12,
  padding: 16,
  marginBottom: 24,
  display: "flex",
  gap: 12,
  alignItems: "center",
  justifyContent: "center",
  color: "#0369A1",
};

const smallSpinner: CSSProperties = {
  width: 20,
  height: 20,
  border: "3px solid rgba(3, 105, 161, 0.3)",
  borderTop: "3px solid #0369A1",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};