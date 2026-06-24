"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  Target,
  Clock,
  BookOpen,
  BarChart2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  CartesianGrid,
} from "recharts";
import { TOPIC_COLORS } from "@/lib/utils";

interface AnalyticsData {
  sessions: { timestamp: string; accuracy: number; questionsAttempted: number }[];
  topicData: { topic: string; accuracy: number; total: number; correct: number }[];
  heatmap: Record<string, number>;
  recentSessions: { timestamp: string; questionsAttempted: number; accuracy: number }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const sessions = data?.sessions ?? [];
  const topicData = data?.topicData ?? [];
  const recentSessions = data?.recentSessions ?? [];

  // Accuracy trend
  const accuracyTrend = sessions.slice(-20).map((s, i) => ({
    session: i + 1,
    accuracy: Math.round(s.accuracy),
    date: new Date(s.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
  }));

  // Radar data (top 8 topics)
  const radarData = topicData.slice(0, 8).map((t) => ({
    topic: t.topic.length > 12 ? t.topic.slice(0, 12) + "…" : t.topic,
    accuracy: t.accuracy,
  }));

  // Heatmap — last 12 weeks
  const heatmapCells = (() => {
    const cells = [];
    const today = new Date();
    for (let d = 83; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const key = date.toISOString().split("T")[0];
      cells.push({ date: key, count: data?.heatmap[key] ?? 0 });
    }
    return cells;
  })();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 48 }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "var(--bg-card)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}
        >
          <ArrowLeft size={20} />
        </button>
        <BarChart2 size={20} color="#6366f1" />
        <span style={{ fontWeight: 700, fontSize: 16 }}>Analytics</span>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", paddingTop: 80 }}>Loading analytics...</div>
        ) : sessions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              paddingTop: 80,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <BarChart2 size={48} color="var(--text-muted)" />
            <div style={{ color: "var(--text-muted)", fontSize: 15 }}>
              No analytics yet. Complete a session to see your progress.
            </div>
            <button
              onClick={() => router.push("/session?mode=daily")}
              style={{
                marginTop: 8,
                padding: "12px 24px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Start First Session
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Summary stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
              }}
            >
              {[
                {
                  label: "Sessions",
                  value: sessions.length,
                  icon: <BookOpen size={18} color="#6366f1" />,
                  color: "#6366f1",
                },
                {
                  label: "Avg Accuracy",
                  value: `${sessions.length > 0 ? Math.round(sessions.reduce((s, x) => s + x.accuracy, 0) / sessions.length) : 0}%`,
                  icon: <Target size={18} color="#10b981" />,
                  color: "#10b981",
                },
                {
                  label: "Questions Done",
                  value: sessions.reduce((s, x) => s + x.questionsAttempted, 0),
                  icon: <TrendingUp size={18} color="#8b5cf6" />,
                  color: "#8b5cf6",
                },
                {
                  label: "Topics Covered",
                  value: topicData.length,
                  icon: <Clock size={18} color="#f59e0b" />,
                  color: "#f59e0b",
                },
              ].map((s) => (
                <div key={s.label} className="glass" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                      {s.label.toUpperCase()}
                    </span>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Accuracy trend */}
            {accuracyTrend.length > 1 && (
              <div className="glass" style={{ padding: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 20, color: "var(--text-secondary)" }}>
                  Accuracy Trend
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={accuracyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} unit="%" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        color: "var(--text-primary)",
                        fontSize: 13,
                      }}
                      formatter={(v) => [`${v}%`, "Accuracy"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#6366f1" }}
                      activeDot={{ r: 6, fill: "#a78bfa" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Topic radar + topic list */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Radar chart */}
              {radarData.length >= 3 && (
                <div className="glass" style={{ padding: "24px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: "var(--text-secondary)" }}>
                    Topic Mastery Radar
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="topic" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                      <Radar
                        name="Accuracy"
                        dataKey="accuracy"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Topic list */}
              <div className="glass" style={{ padding: "24px", overflowY: "auto", maxHeight: 320 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: "var(--text-secondary)" }}>
                  Topic Performance
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {topicData
                    .sort((a, b) => b.total - a.total)
                    .map((t) => {
                      const color = TOPIC_COLORS[t.topic] ?? "#6366f1";
                      return (
                        <div key={t.topic}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                              {t.topic}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color:
                                  t.accuracy >= 70
                                    ? "#10b981"
                                    : t.accuracy >= 50
                                    ? "#f59e0b"
                                    : "#f43f5e",
                              }}
                            >
                              {t.accuracy}%
                            </span>
                          </div>
                          <div style={{ height: 4, borderRadius: 999, background: "var(--border-subtle)", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${t.accuracy}%`,
                                background: color,
                                borderRadius: 999,
                                transition: "width 0.5s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Study heatmap */}
            <div className="glass" style={{ padding: "24px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: "var(--text-secondary)" }}>
                Study Heatmap (last 12 weeks)
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(12, 1fr)",
                  gap: 3,
                  overflowX: "auto",
                }}
              >
                {heatmapCells.map((cell, i) => {
                  const intensity = Math.min(cell.count, 20) / 20;
                  return (
                    <div
                      key={i}
                      title={`${cell.date}: ${cell.count} questions`}
                      style={{
                        width: "100%",
                        paddingBottom: "100%",
                        borderRadius: 3,
                        background:
                          cell.count === 0
                            ? "var(--border)"
                            : `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`,
                      }}
                    />
                  );
                })}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                <span>Less</span>
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((op) => (
                  <div
                    key={op}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: `rgba(99, 102, 241, ${op})`,
                    }}
                  />
                ))}
                <span>More</span>
              </div>
            </div>

            {/* Recent sessions */}
            {recentSessions.length > 0 && (
              <div className="glass" style={{ padding: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: "var(--text-secondary)" }}>
                  Recent Sessions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {recentSessions.slice(-10).reverse().map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "var(--bg)",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(s.timestamp).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {s.questionsAttempted} questions
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: s.accuracy >= 70 ? "#10b981" : s.accuracy >= 50 ? "#f59e0b" : "#f43f5e",
                        }}
                      >
                        {Math.round(s.accuracy)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
