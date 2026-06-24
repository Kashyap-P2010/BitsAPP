"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  Calendar,
  Database,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  BarChart2,
  Trash2,
  RefreshCw,
  Info,
} from "lucide-react";
import { getDaysUntil } from "@/lib/utils";

interface SettingsData {
  settings: {
    bitsatDate: string;
    totalXp: number;
    streak: number;
    longestStreak: number;
    totalMinutes: number;
    totalQuestions: number;
    totalCorrect: number;
  };
  meta: {
    questionCount: number;
    sessionCount: number;
  };
}

type ToastType = "success" | "error" | "info";

interface Toast {
  message: string;
  type: ToastType;
}

// Reusable section wrapper
function Section({
  title,
  icon,
  iconColor = "#6366f1",
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="glass"
      style={{ padding: "24px 28px", marginBottom: 16 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          paddingBottom: 14,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${iconColor}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

// Labelled row helper
function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 24,
        padding: "12px 0",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.5 }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bitsatDate, setBitsatDate] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: SettingsData) => {
        setData(d);
        setBitsatDate(d.settings.bitsatDate);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function showToast(message: string, type: ToastType) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function saveBitsatDate() {
    if (!bitsatDate) return;
    setSavingDate(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bitsatDate }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "Failed to save date", "error");
      } else {
        setData((prev) =>
          prev ? { ...prev, settings: { ...prev.settings, bitsatDate } } : prev
        );
        showToast("BITSAT date updated!", "success");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSavingDate(false);
    }
  }

  async function resetProgress() {
    setResetting(true);
    try {
      const res = await fetch("/api/settings?scope=progress", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "Reset failed", "error");
      } else {
        showToast("Progress reset. Fresh start!", "success");
        setResetConfirm(false);
        // Reload stats
        const fresh = await fetch("/api/settings").then((r) => r.json());
        setData(fresh);
      }
    } catch {
      showToast("Network error during reset", "error");
    } finally {
      setResetting(false);
    }
  }

  const daysLeft = bitsatDate ? getDaysUntil(bitsatDate) : 0;
  const dateChanged = data?.settings.bitsatDate !== bitsatDate;
  const accuracy =
    data && data.settings.totalQuestions > 0
      ? Math.round((data.settings.totalCorrect / data.settings.totalQuestions) * 100)
      : 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 64 }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            padding: "12px 20px",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            background:
              toast.type === "success"
                ? "var(--emerald-dim)"
                : toast.type === "error"
                ? "var(--rose-dim)"
                : "var(--accent-dim)",
            border: `1px solid ${
              toast.type === "success" ? "#10b98140" : toast.type === "error" ? "#f43f5e40" : "#6366f140"
            }`,
            color:
              toast.type === "success"
                ? "#10b981"
                : toast.type === "error"
                ? "#f43f5e"
                : "#a78bfa",
            animation: "slideUp 0.2s ease",
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : toast.type === "error" ? (
            <AlertTriangle size={16} />
          ) : (
            <Info size={16} />
          )}
          {toast.message}
        </div>
      )}

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
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            padding: 4,
            borderRadius: 6,
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <Settings size={20} color="#6366f1" />
        <span style={{ fontWeight: 700, fontSize: 16 }}>Settings</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", paddingTop: 80, fontSize: 14 }}>
            Loading settings...
          </div>
        ) : (
          <>
            {/* ── BITSAT Exam Date ── */}
            <Section
              title="BITSAT Exam Date"
              icon={<Calendar size={16} color="#6366f1" />}
              iconColor="#6366f1"
            >
              <Row
                label="Target date"
                description="Set to your actual BITSAT exam date. This drives the readiness score and countdown."
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <input
                    id="bitsat-date-input"
                    type="date"
                    value={bitsatDate}
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    onChange={(e) => setBitsatDate(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      fontSize: 14,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  />
                  {bitsatDate && (
                    <span
                      style={{
                        fontSize: 11,
                        color: daysLeft > 90 ? "#10b981" : daysLeft > 30 ? "#f59e0b" : "#f43f5e",
                        fontWeight: 600,
                      }}
                    >
                      {daysLeft} days away
                    </span>
                  )}
                </div>
              </Row>

              {dateChanged && (
                <div style={{ marginTop: 4 }}>
                  <button
                    id="save-date-btn"
                    onClick={saveBitsatDate}
                    disabled={savingDate}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      border: "none",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: savingDate ? "not-allowed" : "pointer",
                      opacity: savingDate ? 0.7 : 1,
                      fontFamily: "inherit",
                      transition: "opacity 0.15s ease",
                    }}
                  >
                    {savingDate ? "Saving…" : "Save Date"}
                  </button>
                </div>
              )}
            </Section>

            {/* ── Database Info ── */}
            <Section
              title="Question Database"
              icon={<Database size={16} color="#10b981" />}
              iconColor="#10b981"
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {[
                  { label: "Questions in DB", value: data?.meta.questionCount ?? 0, icon: <BookOpen size={14} color="#6366f1" />, color: "#6366f1" },
                  { label: "Sessions completed", value: data?.meta.sessionCount ?? 0, icon: <BarChart2 size={14} color="#10b981" />, color: "#10b981" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      {s.icon}
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                        {s.label.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: "var(--accent-dim)",
                  border: "1px solid #6366f120",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <Info size={14} color="#6366f1" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  To add more questions, edit{" "}
                  <code
                    style={{
                      background: "var(--border)",
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontSize: 11,
                      color: "#a78bfa",
                    }}
                  >
                    data/questions.json
                  </code>{" "}
                  and run{" "}
                  <code
                    style={{
                      background: "var(--border)",
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontSize: 11,
                      color: "#a78bfa",
                    }}
                  >
                    npm run db:seed
                  </code>
                  . Duplicates are skipped automatically.
                </span>
              </div>
            </Section>

            {/* ── Study Summary ── */}
            <Section
              title="Your Progress Summary"
              icon={<BarChart2 size={16} color="#8b5cf6" />}
              iconColor="#8b5cf6"
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                }}
              >
                {[
                  { label: "XP Earned", value: data?.settings.totalXp ?? 0, color: "#f59e0b" },
                  { label: "Best Streak", value: `${data?.settings.longestStreak ?? 0}d`, color: "#f43f5e" },
                  { label: "Accuracy", value: `${accuracy}%`, color: accuracy >= 70 ? "#10b981" : accuracy >= 50 ? "#f59e0b" : "#f43f5e" },
                  { label: "Questions", value: data?.settings.totalQuestions ?? 0, color: "#6366f1" },
                  { label: "Correct", value: data?.settings.totalCorrect ?? 0, color: "#10b981" },
                  { label: "Study Time", value: `${data?.settings.totalMinutes ?? 0}m`, color: "#8b5cf6" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 8,
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>
                      {s.label.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Danger Zone ── */}
            <div
              className="glass"
              style={{
                padding: "24px 28px",
                borderColor: "#f43f5e30",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 20,
                  paddingBottom: 14,
                  borderBottom: "1px solid #f43f5e20",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--rose-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={16} color="#f43f5e" />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#f43f5e" }}>
                  Danger Zone
                </span>
              </div>

              <Row
                label="Reset all progress"
                description="Clears your attempt history, sessions, streak, XP, and spaced repetition schedule. Questions are preserved. This cannot be undone."
              >
                {!resetConfirm ? (
                  <button
                    id="reset-progress-btn"
                    onClick={() => setResetConfirm(true)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: "var(--rose-dim)",
                      border: "1px solid #f43f5e40",
                      color: "#f43f5e",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f43f5e";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--rose-dim)";
                      e.currentTarget.style.color = "#f43f5e";
                    }}
                  >
                    <Trash2 size={13} />
                    Reset
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <span style={{ fontSize: 12, color: "#f43f5e", fontWeight: 600, whiteSpace: "nowrap" }}>
                      Are you sure?
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setResetConfirm(false)}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 7,
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        id="confirm-reset-btn"
                        onClick={resetProgress}
                        disabled={resetting}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 7,
                          background: "#f43f5e",
                          border: "none",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: resetting ? "not-allowed" : "pointer",
                          opacity: resetting ? 0.7 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontFamily: "inherit",
                        }}
                      >
                        {resetting ? (
                          <RefreshCw size={12} style={{ animation: "spin 0.6s linear infinite" }} />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        {resetting ? "Resetting…" : "Yes, reset"}
                      </button>
                    </div>
                  </div>
                )}
              </Row>
            </div>

            {/* App info */}
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "var(--text-muted)",
                paddingTop: 8,
                lineHeight: 1.7,
              }}
            >
              BITSAT LR Grind · Local-first · No accounts · No cloud
              <br />
              All data stored in{" "}
              <code style={{ fontSize: 10, color: "#6366f1" }}>prisma/dev.db</code>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
