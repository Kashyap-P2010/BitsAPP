"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Calendar,
  Zap,
  ChevronRight,
  Brain,
  BarChart2,
  Settings,
} from "lucide-react";
import { formatDuration, getDaysUntil, xpToLevel } from "@/lib/utils";

interface DashboardData {
  stats: {
    streak: number;
    totalMinutes: number;
    totalQuestions: number;
    totalCorrect: number;
    totalXp: number;
    level: number;
    bitsatDate: string;
    longestStreak: number;
  };
  readiness: {
    score: number;
    grade: string;
    breakdown: { accuracy: number; coverage: number; consistency: number; studyTime: number };
    weakAreas: string[];
    recommendation: string;
  } | null;
  weakestTopic: string;
  strongestTopic: string;
}

const MODES = [
  { id: "daily", label: "Daily Session", icon: Zap, desc: "30-min smart session", color: "#6366f1", href: "/session?mode=daily" },
  { id: "topic", label: "Topic Practice", icon: BookOpen, desc: "Pick a topic", color: "#8b5cf6", href: "/practice" },
  { id: "weak", label: "Weak Topics", icon: TrendingDown, desc: "Target your gaps", color: "#f59e0b", href: "/session?mode=weak" },
  { id: "mistakes", label: "Mistakes Mode", icon: Target, desc: "Re-attempt wrong answers", color: "#f43f5e", href: "/session?mode=mistakes" },
  { id: "mock", label: "Mock Test", icon: BarChart2, desc: "Timed full test", color: "#10b981", href: "/session?mode=mock" },
  { id: "analytics", label: "Analytics", icon: TrendingUp, desc: "Track progress", color: "#06b6d4", href: "/analytics" },
];

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const readiness = data?.readiness;
  const daysLeft = stats ? getDaysUntil(stats.bitsatDate) : 0;
  const accuracy =
    stats && stats.totalQuestions > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
      : 0;
  const { level, progress, nextLevelXp } = xpToLevel(stats?.totalXp ?? 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Top Nav */}
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,15,0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Brain size={22} color="#6366f1" />
            <span
              style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}
              className="gradient-text"
            >
              BITSAT LR Grind
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {stats?.streak ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: "var(--amber-dim)",
                  border: "1px solid #f59e0b40",
                }}
              >
                <span className="flame">🔥</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#f59e0b" }}>
                  {stats.streak}
                </span>
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 999,
                background: "var(--accent-dim)",
                border: "1px solid #6366f140",
              }}
            >
              <Zap size={13} color="#6366f1" />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#a78bfa" }}>
                Lv {level}
              </span>
            </div>
            <button
              id="settings-btn"
              onClick={() => router.push("/settings")}
              title="Settings"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 8,
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "var(--bg-elevated)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "none";
              }}
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            Ready to grind,{" "}
            <span className="gradient-text">LR champ?</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
            {daysLeft > 0
              ? `${daysLeft} days until BITSAT. Every session counts.`
              : "Keep the momentum going. Consistency beats intensity."}
          </p>
        </div>

        {/* Start Session — Primary CTA */}
        <button
          id="start-session-btn"
          onClick={() => router.push("/session?mode=daily")}
          style={{
            width: "100%",
            padding: "20px 32px",
            borderRadius: 16,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
            border: "none",
            cursor: "pointer",
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            boxShadow: "0 0 40px rgba(99,102,241,0.3), 0 8px 32px rgba(0,0,0,0.4)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.01)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 60px rgba(99,102,241,0.4), 0 12px 40px rgba(0,0,0,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 40px rgba(99,102,241,0.3), 0 8px 32px rgba(0,0,0,0.4)";
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontSize: "clamp(18px, 3vw, 24px)",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              Start 30-Minute Session
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              Smart question selection · Spaced repetition
            </div>
          </div>
          <ChevronRight size={28} color="rgba(255,255,255,0.9)" />
        </button>

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            {
              label: "Streak",
              value: loading ? "—" : `${stats?.streak ?? 0}d`,
              icon: <Flame size={18} color="#f59e0b" />,
              color: "#f59e0b",
              bg: "var(--amber-dim)",
            },
            {
              label: "Hours Studied",
              value: loading ? "—" : formatDuration(stats?.totalMinutes ?? 0),
              icon: <Clock size={18} color="#6366f1" />,
              color: "#6366f1",
              bg: "var(--accent-dim)",
            },
            {
              label: "Questions",
              value: loading ? "—" : (stats?.totalQuestions ?? 0).toString(),
              icon: <BookOpen size={18} color="#8b5cf6" />,
              color: "#8b5cf6",
              bg: "#8b5cf620",
            },
            {
              label: "Accuracy",
              value: loading ? "—" : `${accuracy}%`,
              icon: <Target size={18} color="#10b981" />,
              color: "#10b981",
              bg: "var(--emerald-dim)",
            },
            {
              label: "Days Left",
              value: loading ? "—" : daysLeft.toString(),
              icon: <Calendar size={18} color="#f43f5e" />,
              color: "#f43f5e",
              bg: "var(--rose-dim)",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass"
              style={{ padding: "18px 20px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                  {stat.label.toUpperCase()}
                </span>
                <div
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    background: stat.bg,
                  }}
                >
                  {stat.icon}
                </div>
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: stat.color,
                  letterSpacing: "-0.03em",
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Readiness + XP Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {/* Readiness Score */}
          <div className="glass" style={{ padding: "24px" }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 600,
                marginBottom: 16,
                letterSpacing: "0.05em",
              }}
            >
              BITSAT READINESS
            </div>
            {readiness ? (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                {/* Score circle */}
                <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
                  <svg width="88" height="88" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="38" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
                    <circle
                      cx="44"
                      cy="44"
                      r="38"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 38}`}
                      strokeDashoffset={`${2 * Math.PI * 38 * (1 - readiness.score / 100)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 44 44)"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: 22, fontWeight: 900, color: "#a78bfa" }}>
                      {readiness.score}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>/ 100</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: 4,
                    }}
                  >
                    {readiness.grade}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {readiness.recommendation}
                  </div>
                  {readiness.weakAreas.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {readiness.weakAreas.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "var(--rose-dim)",
                            color: "#f43f5e",
                            fontWeight: 500,
                          }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Complete a few sessions to see your readiness score.
              </div>
            )}
          </div>

          {/* XP & Level */}
          <div className="glass" style={{ padding: "24px" }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 600,
                marginBottom: 16,
                letterSpacing: "0.05em",
              }}
            >
              PROGRESS
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                {level}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Level {level}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {stats?.totalXp ?? 0} XP total
                </div>
              </div>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                }}
              >
                <span>{progress} XP</span>
                <span>{nextLevelXp} XP to Level {level + 1}</span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "var(--border-subtle)",
                  overflow: "hidden",
                }}
              >
                <div
                  className="progress-fill"
                  style={{ height: "100%", width: `${(progress / nextLevelXp) * 100}%` }}
                />
              </div>
            </div>

            {/* Topic pills */}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              {data?.strongestTopic && data.strongestTopic !== "Not enough data" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingUp size={13} color="#10b981" />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Strongest: <strong style={{ color: "#10b981" }}>{data.strongestTopic}</strong>
                  </span>
                </div>
              )}
              {data?.weakestTopic && data.weakestTopic !== "Not enough data" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingDown size={13} color="#f43f5e" />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Weakest: <strong style={{ color: "#f43f5e" }}>{data.weakestTopic}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mode Grid */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: "0.05em",
            marginBottom: 12,
          }}
        >
          PRACTICE MODES
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          {MODES.map((mode) => (
            <button
              key={mode.id}
              id={`mode-${mode.id}`}
              onClick={() => router.push(mode.href)}
              style={{
                padding: "18px 20px",
                borderRadius: 12,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget;
                btn.style.borderColor = mode.color + "60";
                btn.style.background = mode.color + "10";
                btn.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget;
                btn.style.borderColor = "var(--border)";
                btn.style.background = "var(--bg-card)";
                btn.style.transform = "translateY(0)";
              }}
            >
              <mode.icon size={20} color={mode.color} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>
                  {mode.label}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{mode.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
