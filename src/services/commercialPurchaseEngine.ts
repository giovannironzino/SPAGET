import { GrossShoppingItem } from './shoppingListEngine';
import { CommercialPurchaseCalculation } from '../types/foodPredictor';

export function calculateCommercialPurchases(
  grossShoppingList: GrossShoppingItem[],
  existingPantryCarryOver: Record<string, number> = {}
): CommercialPurchaseCalculation[] {
  return grossShoppingList.map((item) => {
    const pantryCarryOverAvailableKg = existingPantryCarryOver[item.food.id] || 0;
    const netGrossRawRequiredKg = Math.max(0, item.grossRawRequiredKg30D - pantryCarryOverAvailableKg);

    const umcSizeKg = item.food.umcSizeKg || 1.0;
    const pricePerUmc = item.food.pricePerUmc || 10.0;

    const unitsToPurchase = netGrossRawRequiredKg > 0
      ? Math.ceil(netGrossRawRequiredKg / umcSizeKg)
      : 0;

    const totalPurchasedKg = unitsToPurchase * umcSizeKg;
    const pantryCarryOverKg = Number(Math.max(0, (totalPurchasedKg + pantryCarryOverAvailableKg) - item.grossRawRequiredKg30D).toFixed(2));
    const totalOutofPocketCost = Number((unitsToPurchase * pricePerUmc).toFixed(2));

    return {
      foodId: item.food.id,
      foodName: item.food.name,
      category: item.category,
      grossRawRequiredKg: item.grossRawRequiredKg30D,
      umcUnitName: item.food.umcUnitName || 'Embalagem Comercial',
      umcSizeKg,
      pricePerUmc,
      unitsToPurchase,
      totalPurchasedKg,
      pantryCarryOverKg,
      totalOutofPocketCost,
    };
  });
}
