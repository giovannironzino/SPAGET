import { CommercialPurchaseCalculation } from '../types/foodPredictor';

export interface FoodBudgetForecastResult {
  expectedSpend: number;
  lowerBound: number;
  upperBound: number;
  breakdownByCategory: {
    supermarket: number;
    farmersMarket: number;
    bakery: number;
  };
  totalPantryCarryOverValueKg: number;
  generatedAt: string;
}

export function calculateFoodBudgetForecast(
  purchases: CommercialPurchaseCalculation[]
): FoodBudgetForecastResult {
  let supermarket = 0;
  let farmersMarket = 0;
  let bakery = 0;
  let totalPantryCarryOverValueKg = 0;

  purchases.forEach((p) => {
    totalPantryCarryOverValueKg += p.pantryCarryOverKg;
    if (p.category === 'supermarket') supermarket += p.totalOutofPocketCost;
    if (p.category === 'farmersMarket') farmersMarket += p.totalOutofPocketCost;
    if (p.category === 'bakery') bakery += p.totalOutofPocketCost;
  });

  const expectedSpend = Number((supermarket + farmersMarket + bakery).toFixed(2));
  const lowerBound = Number((expectedSpend * 0.92).toFixed(2));
  const upperBound = Number((expectedSpend * 1.08).toFixed(2));

  return {
    expectedSpend,
    lowerBound,
    upperBound,
    breakdownByCategory: {
      supermarket: Number(supermarket.toFixed(2)),
      farmersMarket: Number(farmersMarket.toFixed(2)),
      bakery: Number(bakery.toFixed(2)),
    },
    totalPantryCarryOverValueKg: Number(totalPantryCarryOverValueKg.toFixed(2)),
    generatedAt: new Date().toISOString(),
  };
}
