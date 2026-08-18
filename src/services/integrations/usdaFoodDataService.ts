import usdaCache from '../../data/foodKnowledge/usdaCompositionCache.json';

export interface UsdaCompositionResult {
  energyKcal: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
}

export async function fetchUsdaFoodComposition(foodId: string): Promise<UsdaCompositionResult | null> {
  const cached = (usdaCache as Record<string, any>)[foodId];
  if (cached) {
    return {
      energyKcal: cached.energyKcal,
      proteinG: cached.proteinG,
      carbohydrateG: cached.carbohydrateG,
      fatG: cached.fatG,
      fiberG: cached.fiberG,
    };
  }

  // Fallback API call if offline cache miss & env key is present
  const apiKey = (import.meta as any).env?.VITE_USDA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodId)}&api_key=${apiKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.foods && data.foods.length > 0) {
      const top = data.foods[0];
      const getNutrient = (id: number) => top.foodNutrients?.find((n: any) => n.nutrientId === id)?.value || 0;
      return {
        energyKcal: getNutrient(1008),
        proteinG: getNutrient(1003),
        carbohydrateG: getNutrient(1005),
        fatG: getNutrient(1004),
        fiberG: getNutrient(1079),
      };
    }
  } catch (err) {
    console.warn('USDA API offline fallback activated:', err);
  }

  return null;
}
