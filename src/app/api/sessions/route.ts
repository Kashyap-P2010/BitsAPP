import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/sessions — create session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { duration, questionsAttempted, correctAnswers, accuracy, mode, topic, xpEarned } =
      body as {
        duration: number;
        questionsAttempted: number;
        correctAnswers: number;
        accuracy: number;
        mode: string;
        topic?: string;
        xpEarned: number;
      };

    const session = await prisma.session.create({
      data: {
        duration,
        questionsAttempted,
        correctAnswers,
        accuracy,
        mode,
        topic,
        xpEarned,
      },
    });

    // Update total study time
    await prisma.userStats.update({
      where: { id: "singleton" },
      data: {
        totalMinutes: { increment: Math.round(duration / 60) },
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}

// GET /api/sessions — session history
export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { timestamp: "desc" },
      take: 50,
    });
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
