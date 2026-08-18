import { CLINICAL_FOOD_CATALOG, ClinicalFoodItem } from '../data/foodCatalog';

export interface SubstitutionOption {
  food: ClinicalFoodItem;
  equivalentPortionReadyGrams: number;
  costDifferenceMonthly: number;
  explanation: string;
}

export function generateCalculatedSubstitutions(
  targetFood: ClinicalFoodItem,
  currentPortionGrams: number
): SubstitutionOption[] {
  const currentKcal = (currentPortionGrams / 100) * targetFood.kcalPer100g;

  const candidates = CLINICAL_FOOD_CATALOG.filter(
    (f) => f.category === targetFood.category && f.id !== targetFood.id
  );

  return candidates.map((food) => {
    const equivalentPortionReadyGrams = Math.round((currentKcal / food.kcalPer100g) * 100);
    const currentCostMonthly = (currentPortionGrams / 1000) * 30 * (targetFood.pricePerUmc / targetFood.umcSizeKg);
    const newCostMonthly = (equivalentPortionReadyGrams / 1000) * 30 * (food.pricePerUmc / food.umcSizeKg);
    const costDifferenceMonthly = Number((newCostMonthly - currentCostMonthly).toFixed(2));

    let explanation = `Substituição calculada de ${currentPortionGrams}g de ${targetFood.name} por ${equivalentPortionReadyGrams}g de ${food.name}.`;
    if (costDifferenceMonthly < 0) {
      explanation += ` Economiza R$ ${Math.abs(costDifferenceMonthly).toFixed(2)}/mês!`;
    }

    return {
      food,
      equivalentPortionReadyGrams,
      costDifferenceMonthly,
      explanation,
    };
  });
}
