import { CommercialPurchaseCalculation } from '../types/foodPredictor';
import { getDynamicFoodCatalog } from '../data/foodCatalog';

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

/**
 * Universal Multi-Variable Budget Optimizer:
 * Identifies high-cost items and searches the dynamic catalog for equivalent items in the same category
 * with lower cost per kg or better nutritional density.
 */
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
  const catalog = getDynamicFoodCatalog();

  // Evaluate every item in the cart
  currentPurchases.forEach((item) => {
    if (item.unitsToPurchase > 0 && item.pricePerUmc > 0) {
      const itemPricePerKg = item.pricePerUmc / Math.max(0.1, item.umcSizeKg);

      // Find candidates in the same purchase location with lower price per kg
      const cheaperCandidates = catalog.filter((candidate) => {
        if (candidate.defaultLocation !== item.category) return false;
        if (candidate.id === item.foodId || candidate.name.toLowerCase() === item.foodName.toLowerCase()) return false;
        
        const candidatePricePerKg = candidate.pricePerUmc / Math.max(0.1, candidate.umcSizeKg);
        return candidatePricePerKg < itemPricePerKg * 0.85; // At least 15% cheaper
      });

      if (cheaperCandidates.length > 0) {
        // Pick best candidate
        const bestCandidate = cheaperCandidates.sort((a, b) => (a.pricePerUmc / a.umcSizeKg) - (b.pricePerUmc / b.umcSizeKg))[0];
        const newUnits = Math.ceil(item.grossRawRequiredKg / Math.max(0.1, bestCandidate.umcSizeKg));
        const newCost = Number((newUnits * bestCandidate.pricePerUmc).toFixed(2));
        const savings = Number((item.totalOutofPocketCost - newCost).toFixed(2));

        if (savings > 5) {
          // Avoid duplicate swaps
          if (!proposedSwaps.some(s => s.originalFoodName === item.foodName)) {
            proposedSwaps.push({
              originalFoodName: item.foodName,
              suggestedFoodName: bestCandidate.name,
              monthlySavings: savings,
              reason: `Substituição por item equivalente de menor custo comercial (${bestCandidate.umcUnitName} a R$ ${bestCandidate.pricePerUmc.toFixed(2)}).`,
            });
            optimizedSpend -= savings;
          }
        }
      }
    }
  });

  const totalSavings = Number(Math.max(0, currentSpend - optimizedSpend).toFixed(2));

  return {
    currentSpend: Number(currentSpend.toFixed(2)),
    optimizedSpend: Number((currentSpend - totalSavings).toFixed(2)),
    totalSavings,
    proposedSwaps,
  };
}
