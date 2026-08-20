import pofDataset from '../data/foodKnowledge/pofUsageDataset.json';
import { MealContextType, MealContextEvaluation } from '../types/mealContext';
import { ClinicalFoodItem } from '../data/foodCatalog';

export function evaluateMealContext(
  food: ClinicalFoodItem,
  mealType: MealContextType,
  userPreferredFoodIds: string[] = []
): MealContextEvaluation {
  const reasons: string[] = [];
  const pofData = (pofDataset as Record<string, any>)[food.id];

  let pofScore = 0.5; // Default neutral
  if (pofData) {
    if (mealType === 'BREAKFAST') pofScore = pofData.breakfast || 0.1;
    if (mealType === 'MORNING_SNACK') pofScore = pofData.morningSnack || 0.2;
    if (mealType === 'LUNCH') pofScore = pofData.lunch || 0.8;
    if (mealType === 'AFTERNOON_SNACK') pofScore = pofData.afternoonSnack || 0.3;
    if (mealType === 'DINNER') pofScore = pofData.dinner || 0.8;
    if (mealType === 'SUPPER') pofScore = pofData.supper || 0.2;
  }

  const isUserPreferred = userPreferredFoodIds.includes(food.id);
  const userCompatibility = isUserPreferred ? 100 : 70;
  const culturalCompatibility = Math.round(pofScore * 100);

  // Culinary compatibility check (e.g. no heavy meats in breakfast unless preferred)
  let culinaryCompatible = true;
  const isHeavyMeat = food.functionalRoles?.includes('proteico_animal') && !food.name.toLowerCase().includes('ovo') && !food.name.toLowerCase().includes('queijo');
  if ((mealType === 'BREAKFAST' || mealType === 'AFTERNOON_SNACK') && isHeavyMeat) {
    if (!isUserPreferred) {
      culinaryCompatible = false;
      reasons.push(`Carnes grelhadas ou pesadas são menos comuns em ${mealType}.`);
    }
  }

  if (mealType === 'AFTERNOON_SNACK' && food.functionalRoles?.includes('energetico_cereal') && food.name.toLowerCase().includes('arroz') && !isUserPreferred) {
    culinaryCompatible = false;
    reasons.push('Arroz isolado é menos comum como lanche vespertino.');
  }

  const compatibilityScore = Math.round(
    culturalCompatibility * 0.4 + userCompatibility * 0.4 + (culinaryCompatible ? 20 : 0)
  );

  return {
    compatibilityScore,
    nutritionCompatible: true,
    culinaryCompatible,
    culturalCompatibility,
    userCompatibility,
    reasons,
  };
}
