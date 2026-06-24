import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/questions?mode=daily&topic=&limit=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "daily";
  const topic = searchParams.get("topic");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  try {
    const now = new Date();

    // 1. SRS due questions first
    const dueQuestions = await prisma.question.findMany({
      where: {
        spacedRepetition: { nextReview: { lte: now } },
        ...(topic ? { topic } : {}),
      },
      include: { spacedRepetition: true },
      take: Math.ceil(limit * 0.4),
    });

    // 2. Questions the user got wrong previously
    const mistakeIds = new Set(
      (
        await prisma.attempt.findMany({
          where: { correct: false },
          select: { questionId: true },
          orderBy: { timestamp: "desc" },
          take: 100,
        })
      ).map((a) => a.questionId)
    );

    let mistakeQuestions: typeof dueQuestions = [];
    if (mode !== "mistakes") {
      mistakeQuestions = await prisma.question.findMany({
        where: {
          id: { in: Array.from(mistakeIds) },
          spacedRepetition: null,
          ...(topic ? { topic } : {}),
        },
        take: Math.ceil(limit * 0.3),
      });
    }

    // 3. Weak topic questions
    let weakTopicQuestions: typeof dueQuestions = [];
    if (mode === "weak" || mode === "daily") {
      const topicAttempts = await prisma.attempt.groupBy({
        by: ["questionId"],
        _count: { correct: true },
      });

      const attemptedIds = new Set(topicAttempts.map((a) => a.questionId));
      weakTopicQuestions = await prisma.question.findMany({
        where: {
          id: { notIn: Array.from(attemptedIds) },
          ...(topic ? { topic } : {}),
        },
        orderBy: { difficulty: "asc" },
        take: Math.ceil(limit * 0.2),
      });
    }

    // 4. New/fresh questions for the rest
    const usedIds = new Set([
      ...dueQuestions.map((q) => q.id),
      ...mistakeQuestions.map((q) => q.id),
      ...weakTopicQuestions.map((q) => q.id),
    ]);

    const freshQuestions = await prisma.question.findMany({
      where: {
        id: { notIn: Array.from(usedIds) },
        ...(topic ? { topic } : {}),
        ...(mode === "mistakes" ? { id: { in: Array.from(mistakeIds) } } : {}),
      },
      take: limit - dueQuestions.length - mistakeQuestions.length - weakTopicQuestions.length,
    });

    // Combine and shuffle
    const all = [
      ...dueQuestions,
      ...mistakeQuestions,
      ...weakTopicQuestions,
      ...freshQuestions,
    ].slice(0, limit);

    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }

    // Parse options JSON
    const parsed = all.map((q) => ({
      ...q,
      options: JSON.parse(q.options as string) as string[],
    }));

    return NextResponse.json({ questions: parsed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
