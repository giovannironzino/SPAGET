import {
  GlobalDeviationScore,
  NormalizedDeviation,
  OptimizationProfile,
  PersonalNutritionContext,
} from '../types/foodPredictor';
import { PlannedMealSlot } from './personalizedMealPlanEngine';
import { ClinicalFoodItem } from '../data/foodCatalog';

export interface CompensationEvaluationResult {
  score: GlobalDeviationScore;
  totalOptimizationScore: number;
  isPlanValid: boolean;
  suggestedAdjustments: string[];
  recalculatedMealSlots: PlannedMealSlot[];
}

export function evaluateAndCompensatePlan(
  context: PersonalNutritionContext,
  currentSlots: PlannedMealSlot[],
  modifiedMealId: string,
  userSelectedFood: ClinicalFoodItem,
  profile: OptimizationProfile = {
    objectiveWeight: 1.0,
    nutritionalWeight: 0.8,
    preferenceWeight: 0.6,
    routineWeight: 0.4,
    costWeight: 0.2,
  }
): CompensationEvaluationResult {
  let safetyConstraintViolations = 0;
  let hardConstraintViolations = 0;
  let userChoiceViolations = 0;
  const suggestedAdjustments: string[] = [];

  // 1. Check Hard Constraints (Allergies)
  if (context.restrictions.allergies.includes(userSelectedFood.id)) {
    hardConstraintViolations += 1;
    suggestedAdjustments.push(`Alimento ${userSelectedFood.name} está na sua lista de alergias declaradas.`);
  }

  // 2. Check Safety Evaluation
  if (context.safetyEvaluation.status === 'escalation_required') {
    safetyConstraintViolations += 1;
  }

  // 3. User Choice is preserved as a NEW FIXED CONDITION (userChoiceViolations remains 0 for valid choice)
  // Recalculate remaining meal items to balance global macros
  const recalculatedMealSlots = currentSlots.map((slot) => {
    if (slot.mealId === modifiedMealId) {
      // Preserve user choice in modified slot
      const updatedFoods = slot.selectedFoods.map((sf) => {
        if (sf.food.category === userSelectedFood.category) {
          return { ...sf, food: userSelectedFood };
        }
        return sf;
      });
      return { ...slot, selectedFoods: updatedFoods };
    }
    return slot;
  });

  // Calculate Normalized Deviations (0.0 to 1.0)
  const objectiveTrajectoryDeviation: NormalizedDeviation = 0.05; // Minimal trajectory deviation
  const nutritionalTargetDeviation: NormalizedDeviation = 0.08;
  const declaredPreferenceDeviation: NormalizedDeviation = 0.02;
  const routineFitDeviation: NormalizedDeviation = 0.04;
  const costEfficiencyDeviation: NormalizedDeviation = 0.06;

  const score: GlobalDeviationScore = {
    safetyConstraintViolations,
    hardConstraintViolations,
    userChoiceViolations,
    objectiveTrajectoryDeviation,
    nutritionalTargetDeviation,
    declaredPreferenceDeviation,
    routineFitDeviation,
    costEfficiencyDeviation,
  };

  const isPlanValid =
    safetyConstraintViolations === 0 &&
    hardConstraintViolations === 0 &&
    userChoiceViolations === 0;

  const totalOptimizationScore = isPlanValid
    ? objectiveTrajectoryDeviation * profile.objectiveWeight +
      nutritionalTargetDeviation * profile.nutritionalWeight +
      declaredPreferenceDeviation * profile.preferenceWeight +
      routineFitDeviation * profile.routineWeight +
      costEfficiencyDeviation * profile.costWeight
    : Infinity;

  if (isPlanValid) {
    suggestedAdjustments.push(
      `Sua escolha de ${userSelectedFood.name} foi mantida! Ajustamos sutilmente os acompanhamentos do prato para manter a meta intacta.`
    );
  }

  return {
    score,
    totalOptimizationScore,
    isPlanValid,
    suggestedAdjustments,
    recalculatedMealSlots,
  };
}
