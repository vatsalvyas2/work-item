
import type { Task } from './types';

// CONSTANTS
const PPM = 10 / (24 * 60); // Penalty Per Minute: 10 penalty points per day, normalized to minutes.
const MAX_PENALTY = 25;

/**
 * Calculates the score for a given task based on extension, delay, and rework penalties.
 * @param task The task object to score.
 * @returns The final score for the task.
 */
export function calculateTaskScore(task: Task): number {
  if (!task.completedAt) {
    // Cannot score an incomplete task
    return 0;
  }

  const plannedTarget = task.originalDueDate;
  const expectedTarget = task.dueDate;
  const endTime = task.completedAt;

  // If we don't have the necessary dates, we can't calculate time-based penalties.
  if (!plannedTarget || !expectedTarget) {
    const reworkPenalty = calculateReworkPenalty(task.reworkCount);
    return -100 - reworkPenalty;
  }
  
  const plannedTargetMs = plannedTarget.getTime();
  const expectedTargetMs = expectedTarget.getTime();
  const endTimeMs = endTime.getTime();

  // 1. EXTENSION PENALTY
  const extensionMinutes = (expectedTargetMs > plannedTargetMs) ? (expectedTargetMs - plannedTargetMs) / (1000 * 60) : 0;
  
  const extensionUsageRatio = (expectedTargetMs === plannedTargetMs)
    ? 0
    : Math.min(1, Math.max(0, (endTimeMs - plannedTargetMs) / (expectedTargetMs - plannedTargetMs)));
            
  const extensionPenalty = Math.min(
    MAX_PENALTY,
    extensionMinutes * PPM * 10 * extensionUsageRatio
  );

  // 2. DELAY PENALTY
  const delayMinutes = (endTimeMs > expectedTargetMs) ? (endTimeMs - expectedTargetMs) / (1000 * 60) : 0;
  
  const delayPenalty = Math.min(
    MAX_PENALTY,
    delayMinutes * PPM
  );

  // 3. REWORK PENALTY
  const reworkPenalty = calculateReworkPenalty(task.reworkCount);

  // 4. FINAL SCORE
  const baseScore = -100;
  const timeAdjustedScore = Math.max(
    -100,
    baseScore - extensionPenalty - delayPenalty
  );
  
  const finalScore = timeAdjustedScore - reworkPenalty;

  return Math.round(finalScore);
}


function calculateReworkPenalty(reworkCount?: number): number {
    if (!reworkCount || reworkCount === 0) {
        return 0;
    }
    const penalty = Math.pow(3, Math.min(reworkCount, 3)); // Max of 3 reworks for penalty calc
    return Math.min(MAX_PENALTY, penalty);
}
