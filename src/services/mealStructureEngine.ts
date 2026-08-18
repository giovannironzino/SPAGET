import {
  PersonalNutritionContext,
  UserRoutine,
} from '../types/foodPredictor';

export interface FractionatedMealQuota {
  mealId: string;
  mealName: string;
  targetKcal: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  approximateTime: string;
}

export function fractionateMealsByRoutine(
  context: PersonalNutritionContext,
  routine: UserRoutine
): FractionatedMealQuota[] {
  const strat = context.calculatedStrategy;

  return routine.mealDefinitions.map((meal) => {
    const fraction = (meal.targetPercentage || (100 / routine.mealDefinitions.length)) / 100;

    return {
      mealId: meal.id,
      mealName: meal.name,
      targetKcal: Math.round(strat.dailyEnergyKcal * fraction),
      proteinGrams: Math.round(strat.proteinStrategyGrams * fraction),
      carbGrams: Math.round(strat.carbStrategyGrams * fraction),
      fatGrams: Math.round(strat.fatStrategyGrams * fraction),
      approximateTime: meal.approximateTime || '12:00',
    };
  });
}
