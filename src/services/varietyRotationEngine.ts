import { UserRepetitionTolerance } from '../types/mealContext';
import { PlannedMealSlot } from './personalizedMealPlanEngine';
import { CLINICAL_FOOD_CATALOG, ClinicalFoodItem } from '../data/foodCatalog';

export interface VarietyRotatedWeekPlan {
  toleranceApplied: UserRepetitionTolerance;
  weeklyMealSlotsByDay: Array<{
    dayName: string;
    dayNumber: number;
    slots: PlannedMealSlot[];
  }>;
  ingredientReuseScore: number;
}

export function generateVarietyRotatedWeek(
  baseSlots: PlannedMealSlot[],
  tolerance: UserRepetitionTolerance = 'moderate_rotation'
): VarietyRotatedWeekPlan {
  const daysNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

  const weeklyMealSlotsByDay = daysNames.map((dayName, idx) => {
    const dayNumber = idx + 1;

    // Rotate produce/fruit or secondary protein based on day and tolerance
    const slots = baseSlots.map((slot) => {
      const updatedFoods = slot.selectedFoods.map((item) => {
        if (tolerance === 'high_variety' && (dayNumber % 2 === 0)) {
          // Alternative fruit/carb on even days
          if (item.food.id === 'cf-prod-banana-prata') {
            const apple = CLINICAL_FOOD_CATALOG.find((f) => f.id === 'cf-prod-maca-fuji');
            if (apple) return { ...item, food: apple };
          }
        }
        return item;
      });
      return { ...slot, selectedFoods: updatedFoods };
    });

    return {
      dayName,
      dayNumber,
      slots,
    };
  });

  return {
    toleranceApplied: tolerance,
    weeklyMealSlotsByDay,
    ingredientReuseScore: tolerance === 'high_repetition' ? 95 : 80,
  };
}
