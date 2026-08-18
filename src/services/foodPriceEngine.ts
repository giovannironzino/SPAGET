import { CommercialPurchaseCalculation } from '../types/foodPredictor';

export interface RegionalPriceSnapshot {
  cityState: string;
  source: 'web_realtime' | 'national_benchmark';
  collectedAt: string;
  priceAdjustments: Record<string, number>;
}

export function applyRegionalPriceSnapshot(
  purchases: CommercialPurchaseCalculation[],
  cityState: string,
  priceSnapshot?: RegionalPriceSnapshot
): CommercialPurchaseCalculation[] {
  if (!priceSnapshot || Object.keys(priceSnapshot.priceAdjustments).length === 0) {
    return purchases;
  }

  return purchases.map((item) => {
    const adjustedPrice = priceSnapshot.priceAdjustments[item.foodId] || item.pricePerUmc;
    const totalOutofPocketCost = Number((item.unitsToPurchase * adjustedPrice).toFixed(2));

    return {
      ...item,
      pricePerUmc: adjustedPrice,
      totalOutofPocketCost,
    };
  });
}
