
import type { Task, ScoreBreakdown } from './types';

// CONSTANTS
const PPM = 10 / (24 * 60); // Penalty Per Minute: 10 penalty points per day, normalized to minutes.
const MAX_PENALTY_PER_CATEGORY = 25;

/**
 * Calculates the score and its breakdown for a given task.
 * @param task The task object to score.
 * @returns An object containing the final score and the breakdown of penalties.
 */
export function calculateTaskScore(task: Task): { finalScore: number; breakdown: ScoreBreakdown } {
  const breakdown: ScoreBreakdown = {
    extensionPenalty: 0,
    delayPenalty: 0,
    reworkPenalty: 0,
  };

  if (!task.completedAt) {
    // Cannot score an incomplete task
    return { finalScore: 0, breakdown };
  }
  
  // 3. REWORK PENALTY
  breakdown.reworkPenalty = calculateReworkPenalty(task.reworkCount);

  // If we don't have the necessary dates, we can only calculate the rework penalty.
  if (!task.originalDueDate || !task.dueDate) {
    const scoreWithoutTimePenalties = 0 - breakdown.reworkPenalty;
    const finalScore = Math.max(-75, scoreWithoutTimePenalties);
    return { 
        finalScore, 
        breakdown: {
            ...breakdown,
            reworkPenalty: Math.round(breakdown.reworkPenalty)
        }
    };
  }
  
  const plannedTargetMs = task.originalDueDate.getTime();
  const expectedTargetMs = task.dueDate.getTime();
  const endTimeMs = task.completedAt.getTime();

  // 1. EXTENSION PENALTY
  const extensionMinutes = (expectedTargetMs > plannedTargetMs) ? (expectedTargetMs - plannedTargetMs) / (1000 * 60) : 0;
  
  const extensionUsageRatio = (expectedTargetMs === plannedTargetMs)
    ? 0
    : Math.min(
        1,
        Math.max(
          0,
          (endTimeMs - plannedTargetMs) / (expectedTargetMs - plannedTargetMs)
        )
      );
            
  breakdown.extensionPenalty = Math.min(
    MAX_PENALTY_PER_CATEGORY,
    extensionMinutes * PPM * 10 * extensionUsageRatio
  );

  // 2. DELAY PENALTY
  const delayMinutes = (endTimeMs > expectedTargetMs) ? (endTimeMs - expectedTargetMs) / (1000 * 60) : 0;
  
  breakdown.delayPenalty = Math.min(
    MAX_PENALTY_PER_CATEGORY,
    delayMinutes * PPM
  );

  // 4. FINAL SCORE
  const baseScore = 0;
  const totalPenalty = breakdown.extensionPenalty + breakdown.delayPenalty + breakdown.reworkPenalty;
  
  const calculatedScore = baseScore - totalPenalty;

  const finalScore = Math.max(-75, Math.round(calculatedScore));

  return { 
      finalScore: finalScore,
      breakdown: {
          extensionPenalty: Math.round(breakdown.extensionPenalty),
          delayPenalty: Math.round(breakdown.delayPenalty),
          reworkPenalty: Math.round(breakdown.reworkPenalty),
      }
  };
}

/**
 * Calculates the penalty for rework.
 * @param reworkCount The number of reworks.
 * @returns The rework penalty, capped at the max penalty.
 */
function calculateReworkPenalty(reworkCount?: number): number {
    if (!reworkCount || reworkCount === 0) {
        return 0;
    }
    // Exponential penalty for each rework, capped at MAX_PENALTY_PER_CATEGORY
    const penalty = Math.pow(3, reworkCount);
    return Math.min(MAX_PENALTY_PER_CATEGORY, penalty);
}

