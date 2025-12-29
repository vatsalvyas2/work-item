
import type { Task, ScoreBreakdown } from './types';

// CONSTANTS
const PPM = 10 / (24 * 60); // Penalty Per Minute: 10 penalty points per day, normalized to minutes.
const MAX_PENALTY = 25;

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

  const plannedTarget = task.originalDueDate;
  const expectedTarget = task.dueDate;
  const endTime = task.completedAt;
  
  breakdown.reworkPenalty = calculateReworkPenalty(task.reworkCount);

  // If we don't have the necessary dates, we can't calculate time-based penalties.
  if (!plannedTarget || !expectedTarget) {
    const finalScore = -100 - breakdown.reworkPenalty;
    return { finalScore, breakdown };
  }
  
  const plannedTargetMs = plannedTarget.getTime();
  const expectedTargetMs = expectedTarget.getTime();
  const endTimeMs = endTime.getTime();

  // 1. EXTENSION PENALTY
  const extensionMinutes = (expectedTargetMs > plannedTargetMs) ? (expectedTargetMs - plannedTargetMs) / (1000 * 60) : 0;
  
  const extensionUsageRatio = (expectedTargetMs === plannedTargetMs)
    ? 0
    : Math.min(1, Math.max(0, (endTimeMs - plannedTargetMs) / (expectedTargetMs - plannedTargetMs)));
            
  breakdown.extensionPenalty = Math.min(
    MAX_PENALTY,
    extensionMinutes * PPM * 10 * extensionUsageRatio
  );

  // 2. DELAY PENALTY
  const delayMinutes = (endTimeMs > expectedTargetMs) ? (endTimeMs - expectedTargetMs) / (1000 * 60) : 0;
  
  breakdown.delayPenalty = Math.min(
    MAX_PENALTY,
    delayMinutes * PPM
  );

  // 4. FINAL SCORE
  const baseScore = -100;
  const timeAdjustedScore = Math.max(
    -100,
    baseScore - breakdown.extensionPenalty - breakdown.delayPenalty
  );
  
  const finalScore = timeAdjustedScore - breakdown.reworkPenalty;

  return { 
      finalScore: Math.round(finalScore),
      breakdown: {
          extensionPenalty: Math.round(breakdown.extensionPenalty),
          delayPenalty: Math.round(breakdown.delayPenalty),
          reworkPenalty: Math.round(breakdown.reworkPenalty),
      }
  };
}


function calculateReworkPenalty(reworkCount?: number): number {
    if (!reworkCount || reworkCount === 0) {
        return 0;
    }
    const penalty = Math.pow(3, Math.min(reworkCount, 3)); // Max of 3 reworks for penalty calc
    return Math.min(MAX_PENALTY, penalty);
}
