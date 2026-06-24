// BITSAT Readiness Engine
// Estimates 0-100 readiness score based on study data

export interface ReadinessInput {
  totalQuestions: number;
  totalCorrect: number;
  totalMinutes: number;
  streak: number;
  topicAccuracies: Record<string, number>; // topic → accuracy 0-1
  sessionCount: number;
  mockAccuracy?: number; // optional mock test accuracy
}

export interface ReadinessResult {
  score: number;
  grade: "Beginner" | "Developing" | "Capable" | "Proficient" | "Ready";
  breakdown: {
    accuracy: number;
    coverage: number;
    consistency: number;
    studyTime: number;
  };
  weakAreas: string[];
  recommendation: string;
}

const ALL_TOPICS = [
  "Analogies", "Classification", "Series", "Statement and Conclusion",
  "Statement and Assumption", "Cause and Effect", "Assertion and Reason",
  "Syllogisms", "Logical Deduction",
  "Blood Relations", "Direction Sense", "Coding-Decoding", "Ranking",
  "Order and Sequence", "Seating Arrangement", "Circular Arrangement",
  "Linear Arrangement", "Data Sufficiency", "Puzzles",
  "Figure Series", "Figure Analogy", "Figure Classification",
  "Mirror Images", "Water Images", "Paper Folding", "Paper Cutting",
  "Embedded Figures",
];

export function calculateReadiness(input: ReadinessInput): ReadinessResult {
  const {
    totalQuestions,
    totalCorrect,
    totalMinutes,
    streak,
    topicAccuracies,
    sessionCount,
    mockAccuracy,
  } = input;

  // --- Accuracy component (40 pts) ---
  const overallAccuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
  const effectiveAccuracy = mockAccuracy !== undefined
    ? (overallAccuracy * 0.6 + mockAccuracy * 0.4)
    : overallAccuracy;
  const accuracyScore = Math.round(effectiveAccuracy * 40);

  // --- Topic coverage component (25 pts) ---
  const coveredTopics = Object.keys(topicAccuracies).length;
  const coverageRatio = coveredTopics / ALL_TOPICS.length;
  // Weight by accuracy too — partially covered doesn't count as much
  const weightedCoverage = Object.values(topicAccuracies).reduce((sum, acc) => sum + acc, 0) / ALL_TOPICS.length;
  const coverageScore = Math.round(((coverageRatio * 0.5) + (weightedCoverage * 0.5)) * 25);

  // --- Consistency component (20 pts) ---
  // Based on streak and session regularity
  // Max useful streak for scoring: 28 days (4 weeks)
  const streakScore = Math.min(streak / 28, 1) * 10;
  // Sessions: target is ~8/month = ~16 over 2 months for "good"
  const sessionScore = Math.min(sessionCount / 50, 1) * 10;
  const consistencyScore = Math.round(streakScore + sessionScore);

  // --- Study time component (15 pts) ---
  // Target: 30 min/day × 4 days/week × 2 years = 4160 minutes "full"
  // For scoring context, normalize against a 6-month milestone (~1040 min)
  const studyScore = Math.round(Math.min(totalMinutes / 1040, 1) * 15);

  const rawScore = accuracyScore + coverageScore + consistencyScore + studyScore;
  const score = Math.min(100, Math.max(0, rawScore));

  let grade: ReadinessResult["grade"];
  if (score < 20) grade = "Beginner";
  else if (score < 40) grade = "Developing";
  else if (score < 60) grade = "Capable";
  else if (score < 80) grade = "Proficient";
  else grade = "Ready";

  const weakAreas = ALL_TOPICS.filter(
    (t) => !topicAccuracies[t] || topicAccuracies[t] < 0.5
  ).slice(0, 5);

  let recommendation = "";
  if (score < 20) recommendation = "Start with basics. Focus on Analogies, Series, and Blood Relations.";
  else if (score < 40) recommendation = "Build consistency. Study at least 4 days/week. Target weak topics.";
  else if (score < 60) recommendation = "Good progress. Increase accuracy on weak topics and attempt mock tests.";
  else if (score < 80) recommendation = "Strong foundation. Focus on speed and difficult questions.";
  else recommendation = "Excellent readiness. Maintain streak and review mistakes regularly.";

  return {
    score,
    grade,
    breakdown: {
      accuracy: accuracyScore,
      coverage: coverageScore,
      consistency: consistencyScore,
      studyTime: studyScore,
    },
    weakAreas,
    recommendation,
  };
}
