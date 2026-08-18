import { PersonalNutritionContext } from '../types/foodPredictor';
import { FractionatedMealQuota } from './mealStructureEngine';
import { ClinicalFoodItem } from '../data/foodCatalog';

export interface UserCustomMealCompositionResult {
  mealId: string;
  mealName: string;
  userSelectedFoodsWithPortions: Array<{
    food: ClinicalFoodItem;
    portionGrams: number;
    kcal: number;
    proteinGrams: number;
    carbGrams: number;
  }>;
  totalMealKcal: number;
  targetMealKcal: number;
  adjustmentNotes: string[];
}

export function composeCustomUserMeal(
  context: PersonalNutritionContext,
  mealQuota: FractionatedMealQuota,
  userSelectedFoods: ClinicalFoodItem[]
): UserCustomMealCompositionResult {
  if (userSelectedFoods.length === 0) {
    return {
      mealId: mealQuota.mealId,
      mealName: mealQuota.mealName,
      userSelectedFoodsWithPortions: [],
      totalMealKcal: 0,
      targetMealKcal: mealQuota.targetKcal,
      adjustmentNotes: ['Nenhum alimento selecionado.'],
    };
  }

  // Divide target calories evenly among selected items
  const kcalPerItem = mealQuota.targetKcal / userSelectedFoods.length;

  let totalMealKcal = 0;
  const userSelectedFoodsWithPortions = userSelectedFoods.map((food) => {
    const portionGrams = Math.max(20, Math.round((kcalPerItem / food.kcalPer100g) * 100));
    const multiplier = portionGrams / 100;
    const kcal = Math.round(multiplier * food.kcalPer100g);
    const proteinGrams = Number((multiplier * food.proteinPer100g).toFixed(1));
    const carbGrams = Number((multiplier * food.carbsPer100g).toFixed(1));

    totalMealKcal += kcal;

    return {
      food,
      portionGrams,
      kcal,
      proteinGrams,
      carbGrams,
    };
  });

  return {
    mealId: mealQuota.mealId,
    mealName: mealQuota.mealName,
    userSelectedFoodsWithPortions,
    totalMealKcal,
    targetMealKcal: mealQuota.targetKcal,
    adjustmentNotes: [
      `Refeição personalizada montada com sucesso! Quantidades calculadas para atingir ${totalMealKcal} kcal sem que você precise fazer contas.`,
    ],
  };
}
