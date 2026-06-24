// SM-2 Spaced Repetition System
// Intervals: 1 → 3 → 7 → 14 → 30 days

export interface SRSRecord {
  interval: number;   // days until next review
  ease: number;       // ease factor (default 2.5)
  repetitions: number;
  nextReview: Date;
  lastAttempt: Date;
}

// quality: 0=complete blackout, 1=incorrect, 2=incorrect easy recall,
//          3=correct with difficulty, 4=correct, 5=perfect
export function calculateNextReview(
  record: SRSRecord,
  quality: number // 0-5
): SRSRecord {
  let { interval, ease, repetitions } = record;

  if (quality < 3) {
    // Reset on failure
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions += 1;
  }

  // Cap interval at 30 days max for BITSAT prep
  interval = Math.min(interval, 30);

  // Clamp standard intervals to BITSAT-specific schedule
  if (interval <= 1) interval = 1;
  else if (interval <= 3) interval = 3;
  else if (interval <= 7) interval = 7;
  else if (interval <= 14) interval = 14;
  else interval = 30;

  // Update ease factor
  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ease = Math.max(1.3, ease); // Never go below 1.3

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    interval,
    ease,
    repetitions,
    nextReview,
    lastAttempt: new Date(),
  };
}

// Convert boolean correct/incorrect → SM-2 quality score
export function answerToQuality(correct: boolean, timeTaken: number, expectedTime = 60): number {
  if (!correct) return 1;

  // Penalize if took too long (> 2x expected time)
  const ratio = timeTaken / expectedTime;
  if (ratio > 2) return 3;
  if (ratio > 1.5) return 4;
  return 5;
}

export function isDueForReview(record: SRSRecord): boolean {
  return new Date() >= record.nextReview;
}
