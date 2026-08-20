import { Real30DayCalendarProjection, CalendarDayMealPlan } from '../types/mealCalendar';
import { PlannedMealSlot } from './personalizedMealPlanEngine';

export function buildReal30DayCalendar(
  startDateIso: string,
  baseMealSlots: PlannedMealSlot[],
  rotatedWeekByDay?: Array<{ dayName: string; slots: PlannedMealSlot[] }>
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

    // Find rotated food list for this specific day of week if available
    const rotatedDay = rotatedWeekByDay?.find((r) => r.dayName === dayName);
    const activeSlotsForDay = rotatedDay ? rotatedDay.slots : baseMealSlots;

    const meals = activeSlotsForDay.map((slot) => {
      const mainItems = slot.selectedFoods.map((f) => {
        // Humanized portions logic: Translate gram weights to readable portions
        let nameAndPortion = f.food.name;
        if (f.food.id === 'cf-prot-ovos') {
          const eggsCount = Math.round(f.portionReadyGrams / 50);
          nameAndPortion = `${f.food.name} (${eggsCount} ovos médios)`;
        } else if (f.food.id === 'cf-carb-pao-integral' || f.food.id === 'cf-carb-pao-frances') {
          const slices = Math.round(f.portionReadyGrams / 25);
          nameAndPortion = `${f.food.name} (${slices} fatia(s)/unidades)`;
        } else if (f.food.id === 'cf-prod-banana-prata' || f.food.id === 'cf-prod-maca') {
          nameAndPortion = `${f.food.name} (1 unidade média)`;
        } else if (f.food.id === 'cf-pantry-leite-integral') {
          const cups = (f.portionReadyGrams / 200).toFixed(1);
          nameAndPortion = `${f.food.name} (${cups} copo(s) de 200ml)`;
        }

        return {
          foodName: nameAndPortion,
          portionGrams: f.portionReadyGrams,
          preparationName: f.food.category === 'protein' ? 'Grelhado / Cozido' : 'Pronto para Consumo',
        };
      });

      const alternativeOptions = [
        {
          optionName: 'Alternativa Light',
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
        approximateTime: slot.mealId === 'cafe' ? '07:30' : slot.mealId === 'almoco' ? '12:30' : slot.mealId === 'lanche' ? '16:30' : '20:00',
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
