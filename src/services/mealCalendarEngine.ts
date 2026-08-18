import { Real30DayCalendarProjection, CalendarDayMealPlan } from '../types/mealCalendar';
import { PlannedMealSlot } from './personalizedMealPlanEngine';

export function buildReal30DayCalendar(
  startDateIso: string,
  baseMealSlots: PlannedMealSlot[]
): Real30DayCalendarProjection {
  const startDate = new Date(startDateIso);
  const dailyCalendar: CalendarDayMealPlan[] = [];

  const dayOfWeekPt = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  for (let i = 0; i < 30; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);

    const currentIso = current.toISOString().split('T')[0];
    const dayName = dayOfWeekPt[current.getDay()];
    const dayFormatted = `${dayName}, ${String(current.getDate()).padStart(2, '0')}/${String(current.getMonth() + 1).padStart(2, '0')}`;

    const meals = baseMealSlots.map((slot) => {
      const mainItems = slot.selectedFoods.map((f) => ({
        foodName: f.food.name,
        portionGrams: f.portionReadyGrams,
        preparationName: f.food.category === 'protein' ? 'Grelhado / Cozido' : 'Pronto',
      }));

      const alternativeOptions = [
        {
          optionName: 'Alternativa Leve',
          items: mainItems.map((item) => ({ ...item, portionGrams: Math.round(item.portionGrams * 0.9) })),
        },
        {
          optionName: 'Alternativa Prática',
          items: mainItems,
        },
      ];

      return {
        mealId: slot.mealId,
        mealName: slot.mealName,
        approximateTime: '12:00',
        mainSuggestion: { items: mainItems },
        alternativeOptions,
      };
    });

    dailyCalendar.push({
      dateIso: currentIso,
      formattedDate: dayFormatted,
      dayOfWeekName: dayName,
      dayNumber: i + 1,
      meals,
    });
  }

  const endDateIso = dailyCalendar[29].dateIso;

  return {
    startDateIso,
    endDateIso,
    totalDays: 30,
    dailyCalendar,
  };
}
