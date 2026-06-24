"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { formatTime } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  topic: string;
  subtopic: string;
  difficulty: number;
  source_name: string;
  source_url: string;
}

type SessionState = "loading" | "active" | "answered" | "finished";

const SESSION_DURATION = 30 * 60; // 30 minutes in seconds

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "daily";
  const topic = searchParams.get("topic") ?? undefined;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [sessionId] = useState(() => `sess_${Date.now()}`);
  const [results, setResults] = useState<{ correct: number; total: number; xp: number }>({
    correct: 0,
    total: 0,
    xp: 0,
  });

  const questionStartTime = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load questions
  useEffect(() => {
    const params = new URLSearchParams({ mode, limit: "25" });
    if (topic) params.set("topic", topic);

    fetch(`/api/questions?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.questions?.length > 0) {
          setQuestions(d.questions);
          setSessionState("active");
          questionStartTime.current = Date.now();
        } else {
          setSessionState("finished");
        }
      });
  }, [mode, topic]);

  // Timer
  useEffect(() => {
    if (sessionState === "active" || sessionState === "answered") {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            endSession();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current!);
  }, [sessionState === "active"]);

  const currentQuestion = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;

  const handleAnswer = useCallback(
    async (optionIdx: number) => {
      if (sessionState !== "active") return;
      const timeTaken = Math.round((Date.now() - questionStartTime.current) / 1000);
      setSelectedOption(optionIdx);
      setSessionState("answered");

      const correct = optionIdx === currentQuestion.answer;

      // Record attempt
      await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          correct,
          timeTaken,
          sessionId,
        }),
      });

      setResults((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1,
        xp: prev.xp + (correct ? 10 : 2),
      }));
    },
    [sessionState, currentQuestion, sessionId]
  );

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length || timeLeft === 0) {
      endSession();
      return;
    }
    setCurrentIdx((i) => i + 1);
    setSelectedOption(null);
    setSessionState("active");
    questionStartTime.current = Date.now();
  };

  const endSession = async () => {
    clearInterval(timerRef.current!);
    const duration = SESSION_DURATION - timeLeft;
    const accuracy = results.total > 0 ? (results.correct / results.total) * 100 : 0;

    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        duration,
        questionsAttempted: results.total,
        correctAnswers: results.correct,
        accuracy,
        mode,
        topic,
        xpEarned: results.xp,
      }),
    });
    setSessionState("finished");
  };

  const timerPercent = (timeLeft / SESSION_DURATION) * 100;
  const timerColor = timeLeft < 300 ? "#f43f5e" : timeLeft < 600 ? "#f59e0b" : "#6366f1";

  // ---- LOADING ----
  if (sessionState === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTop: "3px solid #6366f1",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>Loading questions...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ---- FINISHED ----
  if (sessionState === "finished") {
    const accuracy = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "var(--bg)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {accuracy >= 70 ? "🎉" : accuracy >= 50 ? "💪" : "📚"}
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              marginBottom: 8,
            }}
            className="gradient-text"
          >
            Session Complete!
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
            {accuracy >= 70
              ? "Excellent work! You're building strong foundations."
              : accuracy >= 50
              ? "Good effort. Review your mistakes and keep going."
              : "Don't worry — every mistake is a lesson. Keep grinding."}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginBottom: 32,
            }}
          >
            {[
              { label: "Questions", value: results.total, color: "#6366f1" },
              { label: "Correct", value: results.correct, color: "#10b981" },
              { label: "Accuracy", value: `${accuracy}%`, color: accuracy >= 70 ? "#10b981" : "#f59e0b" },
            ].map((s) => (
              <div key={s.label} className="glass" style={{ padding: "16px 12px" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div
            className="glass"
            style={{
              padding: "12px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Zap size={16} color="#f59e0b" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b" }}>
              +{results.xp} XP earned!
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
            <button
              onClick={() => router.push("/session?mode=daily")}
              style={{
                padding: "14px 24px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Another Session
            </button>
            <button
              onClick={() => router.push("/")}
              style={{
                padding: "14px 24px",
                borderRadius: 12,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- ACTIVE SESSION ----
  const isAnswered = sessionState === "answered";
  const isCorrect = isAnswered && selectedOption === currentQuestion.answer;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Session header */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
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
          }}
        >
          <ArrowLeft size={20} />
        </button>

        {/* Timer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 999,
            background: `${timerColor}20`,
            border: `1px solid ${timerColor}40`,
          }}
        >
          <Clock size={14} color={timerColor} />
          <span style={{ fontWeight: 700, fontSize: 15, color: timerColor, fontVariantNumeric: "tabular-nums" }}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "var(--border-subtle)",
              overflow: "hidden",
            }}
          >
            <div
              className="progress-fill"
              style={{ height: "100%", width: `${progress}%` }}
            />
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
            {currentIdx + 1} / {questions.length}
          </div>
        </div>

        {/* Question counter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              color: "#10b981",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CheckCircle2 size={13} />
            {results.correct}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>/</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{results.total}</div>
        </div>
      </div>

      {/* Question card */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "32px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 700 }}>
          {/* Topic badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 999,
                background: "var(--accent-dim)",
                color: "#a78bfa",
                letterSpacing: "0.03em",
              }}
            >
              {currentQuestion.topic}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
              {currentQuestion.subtopic}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color:
                  currentQuestion.difficulty === 1
                    ? "#10b981"
                    : currentQuestion.difficulty === 2
                    ? "#f59e0b"
                    : "#f43f5e",
                fontWeight: 600,
              }}
            >
              {["", "Easy", "Medium", "Hard"][currentQuestion.difficulty]}
            </span>
          </div>

          {/* Question text */}
          <div
            className="glass"
            style={{
              padding: "24px 28px",
              marginBottom: 20,
              lineHeight: 1.7,
              fontSize: 17,
              fontWeight: 500,
              whiteSpace: "pre-wrap",
            }}
          >
            {currentQuestion.question}
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {currentQuestion.options.map((opt, idx) => {
              let extraClass = "";
              if (isAnswered) {
                if (idx === currentQuestion.answer) extraClass = "option-correct";
                else if (idx === selectedOption) extraClass = "option-wrong";
              } else if (idx === selectedOption) {
                extraClass = "option-selected";
              }

              return (
                <button
                  key={idx}
                  id={`option-${idx}`}
                  className={`option-btn ${extraClass}`}
                  onClick={() => handleAnswer(idx)}
                  disabled={isAnswered}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontSize: 15,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: isAnswered ? "default" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background:
                        isAnswered && idx === currentQuestion.answer
                          ? "#10b98130"
                          : isAnswered && idx === selectedOption
                          ? "#f43f5e30"
                          : "var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                      color:
                        isAnswered && idx === currentQuestion.answer
                          ? "#10b981"
                          : isAnswered && idx === selectedOption
                          ? "#f43f5e"
                          : "var(--text-secondary)",
                    }}
                  >
                    {["A", "B", "C", "D"][idx]}
                  </span>
                  {opt}
                  {isAnswered && idx === currentQuestion.answer && (
                    <CheckCircle2 size={16} color="#10b981" style={{ marginLeft: "auto" }} />
                  )}
                  {isAnswered && idx === selectedOption && idx !== currentQuestion.answer && (
                    <XCircle size={16} color="#f43f5e" style={{ marginLeft: "auto" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation (post-answer) */}
          {isAnswered && (
            <div
              className="glass"
              style={{
                padding: "20px 24px",
                borderColor: isCorrect ? "#10b98140" : "#f43f5e40",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {isCorrect ? (
                  <CheckCircle2 size={18} color="#10b981" />
                ) : (
                  <AlertTriangle size={18} color="#f59e0b" />
                )}
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: isCorrect ? "#10b981" : "#f59e0b",
                  }}
                >
                  {isCorrect ? "Correct! +10 XP" : "Incorrect — review this"}
                </span>
              </div>

              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
                {currentQuestion.explanation}
              </p>

              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Source:</span>
                <a
                  href={currentQuestion.source_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 11,
                    color: "#6366f1",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {currentQuestion.source_name}
                  <ExternalLink size={10} />
                </a>
              </div>

              <button
                id="next-question-btn"
                onClick={nextQuestion}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "inherit",
                }}
              >
                {currentIdx + 1 >= questions.length ? "Finish Session" : "Next Question"}
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ color: "var(--text-secondary)" }}>Loading...</div>
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}
