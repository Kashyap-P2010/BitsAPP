"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { TOPIC_COLORS } from "@/lib/utils";

const TOPICS = {
  "Verbal Reasoning": [
    "Analogies", "Classification", "Series", "Statement and Conclusion",
    "Statement and Assumption", "Cause and Effect", "Assertion and Reason",
    "Syllogisms", "Logical Deduction",
  ],
  "Analytical Reasoning": [
    "Blood Relations", "Direction Sense", "Coding-Decoding", "Ranking",
    "Order and Sequence", "Seating Arrangement", "Circular Arrangement",
    "Linear Arrangement", "Data Sufficiency", "Puzzles",
  ],
  "Non-Verbal Reasoning": [
    "Figure Series", "Figure Analogy", "Figure Classification",
    "Mirror Images", "Water Images", "Paper Folding", "Paper Cutting",
    "Embedded Figures",
  ],
};

export default function PracticePage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "0 0 48px" }}>
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
        <BookOpen size={20} color="#6366f1" />
        <span style={{ fontWeight: 700, fontSize: 16 }}>Topic Practice</span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        {Object.entries(TOPICS).map(([category, topics]) => (
          <div key={category} style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                marginBottom: 16,
              }}
            >
              {category.toUpperCase()}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 10,
              }}
            >
              {topics.map((topic) => {
                const color = TOPIC_COLORS[topic] ?? "#6366f1";
                return (
                  <button
                    key={topic}
                    id={`topic-${topic.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => router.push(`/session?mode=topic&topic=${encodeURIComponent(topic)}`)}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      background: "var(--bg-card)",
                      border: `1px solid ${color}30`,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${color}15`;
                      e.currentTarget.style.borderColor = `${color}60`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-card)";
                      e.currentTarget.style.borderColor = `${color}30`;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: color,
                        marginBottom: 8,
                      }}
                    />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
                      {topic}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
