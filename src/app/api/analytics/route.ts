import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Overall accuracy over time (by session)
    const sessions = await prisma.session.findMany({
      orderBy: { timestamp: "asc" },
      select: { timestamp: true, accuracy: true, questionsAttempted: true, mode: true },
    });

    // Topic-level breakdown
    const attempts = await prisma.attempt.findMany({
      include: { question: { select: { topic: true, subtopic: true } } },
    });

    const topicStats: Record<string, { correct: number; total: number }> = {};
    for (const a of attempts) {
      const t = a.question.topic;
      if (!topicStats[t]) topicStats[t] = { correct: 0, total: 0 };
      topicStats[t].total++;
      if (a.correct) topicStats[t].correct++;
    }

    const topicData = Object.entries(topicStats).map(([topic, data]) => ({
      topic,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      total: data.total,
      correct: data.correct,
    }));

    // Study heatmap data (last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentAttempts = await prisma.attempt.findMany({
      where: { timestamp: { gte: oneYearAgo } },
      select: { timestamp: true },
    });

    const heatmap: Record<string, number> = {};
    for (const a of recentAttempts) {
      const day = a.timestamp.toISOString().split("T")[0];
      heatmap[day] = (heatmap[day] ?? 0) + 1;
    }

    // Questions solved trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await prisma.session.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      orderBy: { timestamp: "asc" },
      select: { timestamp: true, questionsAttempted: true, accuracy: true },
    });

    return NextResponse.json({
      sessions,
      topicData,
      heatmap,
      recentSessions,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
