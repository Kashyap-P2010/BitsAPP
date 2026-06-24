import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextReview, answerToQuality } from "@/lib/srs";
import { getToday } from "@/lib/utils";

// POST /api/attempts
// Body: { questionId, correct, timeTaken, sessionId }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionId, correct, timeTaken, sessionId } = body as {
      questionId: string;
      correct: boolean;
      timeTaken: number;
      sessionId?: string;
    };

    // Record the attempt
    const attempt = await prisma.attempt.create({
      data: { questionId, correct, timeTaken, sessionId },
    });

    // Update spaced repetition
    const existing = await prisma.spacedRepetition.findUnique({
      where: { questionId },
    });

    const quality = answerToQuality(correct, timeTaken);
    const srsInput = existing
      ? {
          interval: existing.interval,
          ease: existing.ease,
          repetitions: existing.repetitions,
          nextReview: existing.nextReview,
          lastAttempt: existing.lastAttempt,
        }
      : {
          interval: 1,
          ease: 2.5,
          repetitions: 0,
          nextReview: new Date(),
          lastAttempt: new Date(),
        };

    const nextSRS = calculateNextReview(srsInput, quality);

    await prisma.spacedRepetition.upsert({
      where: { questionId },
      update: {
        interval: nextSRS.interval,
        ease: nextSRS.ease,
        repetitions: nextSRS.repetitions,
        nextReview: nextSRS.nextReview,
        lastAttempt: nextSRS.lastAttempt,
      },
      create: {
        questionId,
        interval: nextSRS.interval,
        ease: nextSRS.ease,
        repetitions: nextSRS.repetitions,
        nextReview: nextSRS.nextReview,
        lastAttempt: nextSRS.lastAttempt,
      },
    });

    // Update global user stats
    const today = getToday();
    const currentStats = await prisma.userStats.findUnique({
      where: { id: "singleton" },
    });

    if (currentStats) {
      const isNewDay = currentStats.lastStudyDate !== today;
      const streakBroken =
        currentStats.lastStudyDate &&
        new Date(today).getTime() - new Date(currentStats.lastStudyDate).getTime() >
          2 * 24 * 60 * 60 * 1000;

      const newStreak = isNewDay
        ? streakBroken
          ? 1
          : currentStats.streak + 1
        : currentStats.streak;

      const xpGained = correct ? 10 : 2;

      await prisma.userStats.update({
        where: { id: "singleton" },
        data: {
          totalQuestions: { increment: 1 },
          totalCorrect: correct ? { increment: 1 } : undefined,
          totalXp: { increment: xpGained },
          streak: newStreak,
          longestStreak: Math.max(currentStats.longestStreak, newStreak),
          lastStudyDate: today,
        },
      });
    }

    return NextResponse.json({
      attempt,
      nextReview: nextSRS.nextReview,
      interval: nextSRS.interval,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
  }
}
