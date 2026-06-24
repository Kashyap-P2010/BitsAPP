import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/settings
export async function GET() {
  try {
    const stats = await prisma.userStats.findUnique({
      where: { id: "singleton" },
      select: {
        bitsatDate: true,
        totalXp: true,
        streak: true,
        longestStreak: true,
        totalMinutes: true,
        totalQuestions: true,
        totalCorrect: true,
      },
    });

    if (!stats) {
      return NextResponse.json({ error: "Stats not found" }, { status: 404 });
    }

    const questionCount = await prisma.question.count();
    const sessionCount = await prisma.session.count();

    return NextResponse.json({ settings: stats, meta: { questionCount, sessionCount } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

// PATCH /api/settings
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { bitsatDate?: string };

    if (body.bitsatDate) {
      // Validate format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(body.bitsatDate)) {
        return NextResponse.json({ error: "Invalid date format (expected YYYY-MM-DD)" }, { status: 400 });
      }

      const parsed = new Date(body.bitsatDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }

      if (parsed <= new Date()) {
        return NextResponse.json({ error: "BITSAT date must be in the future" }, { status: 400 });
      }
    }

    const updated = await prisma.userStats.update({
      where: { id: "singleton" },
      data: {
        ...(body.bitsatDate ? { bitsatDate: body.bitsatDate } : {}),
      },
    });

    return NextResponse.json({ settings: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

// DELETE /api/settings — reset all progress (danger zone)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope"); // "progress" | "all"

  try {
    if (scope === "progress") {
      // Wipe attempt history + sessions + SRS — keep questions
      await prisma.attempt.deleteMany({});
      await prisma.session.deleteMany({});
      await prisma.spacedRepetition.deleteMany({});
      await prisma.userStats.update({
        where: { id: "singleton" },
        data: {
          totalXp: 0,
          streak: 0,
          longestStreak: 0,
          lastStudyDate: null,
          totalMinutes: 0,
          totalQuestions: 0,
          totalCorrect: 0,
        },
      });
      return NextResponse.json({ message: "Progress reset successfully" });
    }

    return NextResponse.json({ error: "Unknown scope" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
