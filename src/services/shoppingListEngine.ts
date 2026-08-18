import { MonthlyConsumptionItem } from './consumptionProjectionEngine';
import { convertFoodState } from './foodYieldEngine';
import { ClinicalFoodItem } from '../data/foodCatalog';

export interface GrossShoppingItem {
  food: ClinicalFoodItem;
  monthlyConsumedKg30D: number;
  grossRawRequiredKg30D: number;
  category: 'supermarket' | 'farmersMarket' | 'bakery';
  purchaseFrequency: 'weekly' | 'biweekly' | 'monthly';
}

export function generateGrossShoppingList(
  monthlyConsumption: MonthlyConsumptionItem[]
): GrossShoppingItem[] {
  return monthlyConsumption.map((item) => {
    // Physical Yield Profile: Consumed -> Prepared -> Raw Edible -> Gross Raw
    const yieldProfile = {
      cookedToPreparedRatio: 1.0,
      preparedToRawEdibleRatio: item.food.fc, // Fator de Cocção
      rawEdibleToGrossRawRatio: item.food.fcr, // Fator de Correção
    };

    const grossRawRequiredGrams = convertFoodState({
      quantity: item.monthlyConsumedGrams30D,
      fromState: 'consumed',
      toState: 'gross_raw',
      yieldProfile,
    });

    const grossRawRequiredKg30D = Number((grossRawRequiredGrams / 1000).toFixed(2));

    let purchaseFrequency: 'weekly' | 'biweekly' | 'monthly' = 'monthly';
    if (item.food.defaultLocation === 'farmersMarket') purchaseFrequency = 'weekly';
    if (item.food.defaultLocation === 'bakery') purchaseFrequency = 'weekly';

    return {
      food: item.food,
      monthlyConsumedKg30D: item.monthlyConsumedKg30D,
      grossRawRequiredKg30D,
      category: item.food.defaultLocation,
      purchaseFrequency,
    };
  });
}
