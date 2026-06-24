import { PrismaClient } from "@prisma/client";
import questions from "../data/questions.json";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding question database...");

  // Ensure singleton UserStats row exists
  await prisma.userStats.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  let imported = 0;
  let skipped = 0;

  for (const q of questions) {
    // Skip duplicates by question text
    const existing = await prisma.question.findFirst({
      where: { question: q.question },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.question.create({
      data: {
        question: q.question,
        options: JSON.stringify(q.options),
        answer: q.answer,
        explanation: q.explanation,
        topic: q.topic,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        source_name: q.source_name,
        source_url: q.source_url,
      },
    });

    imported++;
  }

  console.log(`✅ Imported: ${imported} questions`);
  console.log(`⏭️  Skipped (duplicates): ${skipped} questions`);
  console.log(`📚 Total in DB: ${await prisma.question.count()}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
