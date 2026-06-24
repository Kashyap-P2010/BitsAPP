import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateReadiness } from "@/lib/readiness";

export async function GET() {
  try {
    const stats = await prisma.userStats.findUnique({
      where: { id: "singleton" },
    });

    if (!stats) {
      // Initialize on first visit
      const newStats = await prisma.userStats.create({
        data: { id: "singleton" },
      });
      return NextResponse.json({ stats: newStats, readiness: null });
    }

    // Topic accuracies
    const attempts = await prisma.attempt.findMany({
      include: { question: { select: { topic: true } } },
    });

    const topicMap: Record<string, { correct: number; total: number }> = {};
    for (const a of attempts) {
      const t = a.question.topic;
      if (!topicMap[t]) topicMap[t] = { correct: 0, total: 0 };
      topicMap[t].total++;
      if (a.correct) topicMap[t].correct++;
    }

    const topicAccuracies: Record<string, number> = {};
    for (const [t, data] of Object.entries(topicMap)) {
      topicAccuracies[t] = data.total > 0 ? data.correct / data.total : 0;
    }

    const sessionCount = await prisma.session.count();

    const readiness = calculateReadiness({
      totalQuestions: stats.totalQuestions,
      totalCorrect: stats.totalCorrect,
      totalMinutes: stats.totalMinutes,
      streak: stats.streak,
      topicAccuracies,
      sessionCount,
    });

    // Weakest and strongest topics
    const sortedTopics = Object.entries(topicAccuracies).sort(([, a], [, b]) => a - b);
    const weakestTopic = sortedTopics[0]?.[0] ?? "Not enough data";
    const strongestTopic = sortedTopics[sortedTopics.length - 1]?.[0] ?? "Not enough data";

    return NextResponse.json({ stats, readiness, weakestTopic, strongestTopic });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
