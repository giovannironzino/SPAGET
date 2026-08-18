import { PersonalNutritionContext } from '../types/foodPredictor';
import { PlannedMealSlot } from './personalizedMealPlanEngine';

export interface ValidationSummary {
  isValid: boolean;
  dailyEnergyAdherencePct: number;
  proteinAdherencePct: number;
  fiberCheckPassed: boolean;
  objectiveAlignmentStatus: 'aligned' | 'deviated';
  validationMessages: string[];
}

export function validateMealPlanConformity(
  context: PersonalNutritionContext,
  plannedSlots: PlannedMealSlot[]
): ValidationSummary {
  let totalKcalPlanned = 0;
  let totalProteinPlannedG = 0;
  let totalFiberPlannedG = 0;

  plannedSlots.forEach((slot) => {
    slot.selectedFoods.forEach((item) => {
      const multiplier = item.portionReadyGrams / 100;
      totalKcalPlanned += multiplier * item.food.kcalPer100g;
      totalProteinPlannedG += multiplier * item.food.proteinPer100g;
      totalFiberPlannedG += multiplier * item.food.fiberPer100g;
    });
  });

  const targetKcal = context.calculatedStrategy.dailyEnergyKcal;
  const targetProteinG = context.calculatedStrategy.proteinStrategyGrams;
  const minFiberG = context.calculatedStrategy.minFiberStrategyGrams;

  const dailyEnergyAdherencePct = Math.round((totalKcalPlanned / targetKcal) * 100);
  const proteinAdherencePct = Math.round((totalProteinPlannedG / targetProteinG) * 100);
  const fiberCheckPassed = totalFiberPlannedG >= minFiberG;

  const isValid =
    dailyEnergyAdherencePct >= 90 &&
    dailyEnergyAdherencePct <= 110 &&
    proteinAdherencePct >= 85;

  const validationMessages: string[] = [];
  if (isValid) {
    validationMessages.push('Plano totalmente validado e alinhado ao seu objetivo!');
  } else {
    validationMessages.push('Pequenos ajustes de porção recomendados para atingir 100% de precisão.');
  }

  return {
    isValid,
    dailyEnergyAdherencePct,
    proteinAdherencePct,
    fiberCheckPassed,
    objectiveAlignmentStatus: isValid ? 'aligned' : 'deviated',
    validationMessages,
  };
}
