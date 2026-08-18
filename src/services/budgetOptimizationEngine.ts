import { CommercialPurchaseCalculation } from '../types/foodPredictor';
import { CLINICAL_FOOD_CATALOG } from '../data/foodCatalog';

export interface BudgetOptimizationResult {
  currentSpend: number;
  optimizedSpend: number;
  totalSavings: number;
  proposedSwaps: Array<{
    originalFoodName: string;
    suggestedFoodName: string;
    monthlySavings: number;
    reason: string;
  }>;
}

export function optimizeFoodBudget(
  currentPurchases: CommercialPurchaseCalculation[],
  targetBudgetLimit?: number
): BudgetOptimizationResult {
  let currentSpend = 0;
  currentPurchases.forEach((p) => (currentSpend += p.totalOutofPocketCost));

  const proposedSwaps: Array<{
    originalFoodName: string;
    suggestedFoodName: string;
    monthlySavings: number;
    reason: string;
  }> = [];

  let optimizedSpend = currentSpend;

  // Example optimization check: Swap expensive meats or brand UMCs for seasonal equivalent
  currentPurchases.forEach((item) => {
    if (item.foodId === 'cf-prot-patinho' && item.unitsToPurchase > 0) {
      const frango = CLINICAL_FOOD_CATALOG.find((f) => f.id === 'cf-prot-frango-peito');
      if (frango) {
        const originalCost = item.totalOutofPocketCost;
        const newCost = item.unitsToPurchase * frango.pricePerUmc;
        const savings = Number((originalCost - newCost).toFixed(2));

        if (savings > 0) {
          proposedSwaps.push({
            originalFoodName: item.foodName,
            suggestedFoodName: frango.name,
            monthlySavings: savings,
            reason: 'Substituição por proteína magra equivalente de menor custo comercial.',
          });
          optimizedSpend -= savings;
        }
      }
    }
  });

  const totalSavings = Number((currentSpend - optimizedSpend).toFixed(2));

  return {
    currentSpend: Number(currentSpend.toFixed(2)),
    optimizedSpend: Number(optimizedSpend.toFixed(2)),
    totalSavings,
    proposedSwaps,
  };
}
