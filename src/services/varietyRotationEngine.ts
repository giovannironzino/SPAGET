import { UserRepetitionTolerance } from '../types/mealContext';
import { PlannedMealSlot } from './personalizedMealPlanEngine';
import { getDynamicFoodCatalog, ClinicalFoodItem } from '../data/foodCatalog';

export interface VarietyRotatedWeekPlan {
  toleranceApplied: UserRepetitionTolerance;
  weeklyMealSlotsByDay: Array<{
    dayName: string;
    dayNumber: number;
    slots: PlannedMealSlot[];
  }>;
  ingredientReuseScore: number;
}

/**
 * Universal Variety Rotation Engine:
 * Dynamically rotates foods of the same category across the week
 * based on User Repetition Tolerance without any hardcoded items.
 */
export function generateVarietyRotatedWeek(
  baseSlots: PlannedMealSlot[],
  tolerance: UserRepetitionTolerance = 'moderate_rotation'
): VarietyRotatedWeekPlan {
  const daysNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const catalog = getDynamicFoodCatalog();

  // Group foods by category for dynamic rotation
  const foodsByCategory: Record<string, ClinicalFoodItem[]> = {
    protein: catalog.filter((f) => f.category === 'protein'),
    grains: catalog.filter((f) => f.category === 'grains'),
    carbs: catalog.filter((f) => f.category === 'carbs'),
    produce: catalog.filter((f) => f.category === 'produce'),
    pantry: catalog.filter((f) => f.category === 'pantry'),
  };

  const weeklyMealSlotsByDay = daysNames.map((dayName, idx) => {
    const dayNumber = idx + 1;

    const slots = baseSlots.map((slot) => {
      const updatedFoods = slot.selectedFoods.map((item, foodIdx) => {
        // High Repetition: keep base foods exactly as planned
        if (tolerance === 'high_repetition') {
          return item;
        }

        const categoryList = foodsByCategory[item.food.category] || [];
        if (categoryList.length <= 1) return item;

        // Moderate Rotation: rotate on alternating days
        if (tolerance === 'moderate_rotation') {
          if ([2, 4, 6].includes(dayNumber)) {
            const rotIndex = (dayNumber + foodIdx) % categoryList.length;
            const candidate = categoryList[rotIndex];
            if (candidate) return { ...item, food: candidate };
          }
          return item;
        }

        // High Variety: rotate almost daily
        if (tolerance === 'high_variety') {
          const rotIndex = (dayNumber * 2 + foodIdx) % categoryList.length;
          const candidate = categoryList[rotIndex];
          if (candidate) return { ...item, food: candidate };
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
    ingredientReuseScore: tolerance === 'high_repetition' ? 98 : tolerance === 'moderate_rotation' ? 82 : 65,
  };
}
