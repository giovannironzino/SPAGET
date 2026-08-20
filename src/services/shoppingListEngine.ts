import { MonthlyConsumptionItem } from './consumptionProjectionEngine';
import { convertFoodState } from './foodYieldEngine';
import { ClinicalFoodItem } from '../data/foodCatalog';

export interface GrossShoppingItem {
  food: ClinicalFoodItem;
  monthlyConsumedKg30D: number;
  grossRawRequiredKg30D: number;
  weeklyGrossRawRequiredKg: number;
  category: 'supermarket' | 'farmersMarket' | 'bakery';
  purchaseFrequency: 'weekly' | 'biweekly' | 'monthly';
}

/**
 * Calculates raw grocery list for 30 days based on physical yield profile (Cru vs Cozido),
 * and classifies items by perishable validity/purchase cycle.
 */
export function generateGrossShoppingList(
  monthlyConsumption: MonthlyConsumptionItem[]
): GrossShoppingItem[] {
  return monthlyConsumption.map((item) => {
    // Physical Yield Profile: Consumed -> Prepared -> Raw Edible -> Gross Raw
    const yieldProfile = {
      cookedToPreparedRatio: 1.0,
      preparedToRawEdibleRatio: item.food.fc, // Fator de Cocção (Ex: Arroz = 0.40)
      rawEdibleToGrossRawRatio: item.food.fcr, // Fator de Correção (Ex: Osso/Casca descarte)
    };

    const grossRawRequiredGrams = convertFoodState({
      quantity: item.monthlyConsumedGrams30D,
      fromState: 'consumed',
      toState: 'gross_raw',
      yieldProfile,
    });

    const grossRawRequiredKg30D = Number((grossRawRequiredGrams / 1000).toFixed(2));
    const weeklyGrossRawRequiredKg = Number((grossRawRequiredKg30D / 4.28).toFixed(2)); // Month has ~4.28 weeks

    // Categorize purchase frequency based on perishable status
    let purchaseFrequency: 'weekly' | 'biweekly' | 'monthly' = 'monthly';
    
    // Farmers Market (Feira) and Bakery (Padaria) are highly perishable (must buy weekly)
    if (item.food.defaultLocation === 'farmersMarket' || item.food.defaultLocation === 'bakery') {
      purchaseFrequency = 'weekly';
    }
    
    // Eggs (even if supermarket) are better bought weekly or biweekly to prevent rotting
    if (item.food.id === 'cf-prot-ovos') {
      purchaseFrequency = 'weekly';
    }

    return {
      food: item.food,
      monthlyConsumedKg30D: item.monthlyConsumedKg30D,
      grossRawRequiredKg30D,
      weeklyGrossRawRequiredKg,
      category: item.food.defaultLocation,
      purchaseFrequency,
    };
  });
}
