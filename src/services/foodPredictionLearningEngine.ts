import { NextCycleAdjustments, CommercialPurchaseCalculation } from '../types/foodPredictor';

export interface FoodCycleActualData {
  actualSpentByCategory: { supermarket: number; farmersMarket: number; bakery: number };
  actualPurchasedItems: Array<{ foodId: string; quantityKg: number; cost: number }>;
  actualPantryCarryOverKg: Record<string, number>;
}

export function processCycleLearning(
  predictedPurchases: CommercialPurchaseCalculation[],
  actualData: FoodCycleActualData
): NextCycleAdjustments {
  const priceAdjustments: Record<string, number> = {};
  const pantryAdjustments: Record<string, number> = { ...actualData.actualPantryCarryOverKg };
  const consumptionAdjustments: Record<string, number> = {};
  const adherenceObservations: Record<string, any> = {};

  actualData.actualPurchasedItems.forEach((actualItem) => {
    const predicted = predictedPurchases.find((p) => p.foodId === actualItem.foodId);
    if (predicted && actualItem.quantityKg > 0) {
      const actualUnitPrice = actualItem.cost / actualItem.quantityKg;
      priceAdjustments[actualItem.foodId] = Number((actualUnitPrice * predicted.umcSizeKg).toFixed(2));
    }
  });

  adherenceObservations.lastCycleStatus = 'completed';

  return {
    consumptionAdjustments,
    observedRoutineAdjustments: {},
    priceAdjustments,
    pantryAdjustments,
    adherenceObservations,
  };
}
