import { PlannedMealSlot } from './personalizedMealPlanEngine';
import { ClinicalFoodItem } from '../data/foodCatalog';

export interface MonthlyConsumptionItem {
  food: ClinicalFoodItem;
  weeklyConsumedGrams: number;
  monthlyConsumedGrams30D: number; // 30 real calendar days math: (weeklyConsumedGrams / 7) * 30
  monthlyConsumedKg30D: number;
}

export function project30DayConsumption(
  plannedSlots: PlannedMealSlot[],
  householdCount: number = 1
): MonthlyConsumptionItem[] {
  const count = Math.max(1, householdCount);
  const consumptionMap: Record<string, { food: ClinicalFoodItem; weeklyConsumedGrams: number }> = {};

  plannedSlots.forEach((slot) => {
    slot.selectedFoods.forEach((item) => {
      const weeklyGrams = item.portionReadyGrams * item.daysPerWeek * count;

      if (consumptionMap[item.food.id]) {
        consumptionMap[item.food.id].weeklyConsumedGrams += weeklyGrams;
      } else {
        consumptionMap[item.food.id] = {
          food: item.food,
          weeklyConsumedGrams: weeklyGrams,
        };
      }
    });
  });

  return Object.values(consumptionMap).map(({ food, weeklyConsumedGrams }) => {
    const monthlyConsumedGrams30D = Math.round((weeklyConsumedGrams / 7) * 30);
    const monthlyConsumedKg30D = Number((monthlyConsumedGrams30D / 1000).toFixed(2));

    return {
      food,
      weeklyConsumedGrams,
      monthlyConsumedGrams30D,
      monthlyConsumedKg30D,
    };
  });
}

export function project30DayConsumptionFromRotatedWeek(
  weeklyMealSlotsByDay: Array<{ slots: PlannedMealSlot[] }>,
  householdCount: number = 1
): MonthlyConsumptionItem[] {
  const count = Math.max(1, householdCount);
  const consumptionMap: Record<string, { food: ClinicalFoodItem; weeklyConsumedGrams: number }> = {};

  weeklyMealSlotsByDay.forEach((day) => {
    day.slots.forEach((slot) => {
      slot.selectedFoods.forEach((item) => {
        // Since we are summing over 7 days, each food's portion in each day is eaten exactly 1 day per week in the cycle
        const portionGrams = item.portionReadyGrams * count;

        if (consumptionMap[item.food.id]) {
          consumptionMap[item.food.id].weeklyConsumedGrams += portionGrams;
        } else {
          consumptionMap[item.food.id] = {
            food: item.food,
            weeklyConsumedGrams: portionGrams,
          };
        }
      });
    });
  });

  return Object.values(consumptionMap).map(({ food, weeklyConsumedGrams }) => {
    const monthlyConsumedGrams30D = Math.round((weeklyConsumedGrams / 7) * 30);
    const monthlyConsumedKg30D = Number((monthlyConsumedGrams30D / 1000).toFixed(2));

    return {
      food,
      weeklyConsumedGrams,
      monthlyConsumedGrams30D,
      monthlyConsumedKg30D,
    };
  });
}
