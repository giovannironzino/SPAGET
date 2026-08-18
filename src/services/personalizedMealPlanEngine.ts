import { FractionatedMealQuota } from './mealStructureEngine';
import { CLINICAL_FOOD_CATALOG, ClinicalFoodItem } from '../data/foodCatalog';

export interface PlannedMealSlot {
  mealId: string;
  mealName: string;
  selectedFoods: Array<{
    food: ClinicalFoodItem;
    portionReadyGrams: number;
    daysPerWeek: number;
  }>;
}

export function generatePersonalizedMealPlan(
  fractionatedQuotas: FractionatedMealQuota[]
): PlannedMealSlot[] {
  return fractionatedQuotas.map((quota) => {
    // Select default recommended foods based on meal category
    let proteinFood = CLINICAL_FOOD_CATALOG.find((f) => f.id === 'cf-prot-frango-peito') || CLINICAL_FOOD_CATALOG[0];
    let carbFood = CLINICAL_FOOD_CATALOG.find((f) => f.id === 'cf-grain-arroz-branco') || CLINICAL_FOOD_CATALOG[5];
    let produceFood = CLINICAL_FOOD_CATALOG.find((f) => f.id === 'cf-prod-banana-prata');

    if (quota.mealId === 'cafe') {
      proteinFood = CLINICAL_FOOD_CATALOG.find((f) => f.id === 'cf-prot-ovos') || proteinFood;
      carbFood = CLINICAL_FOOD_CATALOG.find((f) => f.id === 'cf-carb-pao-integral') || carbFood;
    }

    const proteinPortionG = Math.round((quota.proteinGrams / proteinFood.proteinPer100g) * 100);
    const carbPortionG = Math.round((quota.carbGrams / carbFood.carbsPer100g) * 100);

    const selectedFoods = [
      { food: proteinFood, portionReadyGrams: proteinPortionG, daysPerWeek: 7 },
      { food: carbFood, portionReadyGrams: carbPortionG, daysPerWeek: 7 },
    ];

    if (produceFood) {
      selectedFoods.push({ food: produceFood, portionReadyGrams: 100, daysPerWeek: 7 });
    }

    return {
      mealId: quota.mealId,
      mealName: quota.mealName,
      selectedFoods,
    };
  });
}
