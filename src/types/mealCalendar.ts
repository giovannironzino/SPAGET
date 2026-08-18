/**
 * SPAGET 3.2 - Real Calendar Contracts
 */

export interface CalendarDayMealPlan {
  dateIso: string;          // e.g. "2026-08-20"
  formattedDate: string;    // e.g. "Quinta-feira, 20/08"
  dayOfWeekName: string;   // e.g. "Quinta-feira"
  dayNumber: number;        // 1 to 30
  meals: Array<{
    mealId: string;
    mealName: string;
    approximateTime: string;
    mainSuggestion: {
      items: Array<{ foodName: string; portionGrams: number; preparationName?: string }>;
    };
    alternativeOptions: Array<{
      optionName: string;
      items: Array<{ foodName: string; portionGrams: number; preparationName?: string }>;
    }>;
  }>;
}

export interface Real30DayCalendarProjection {
  startDateIso: string;
  endDateIso: string;
  totalDays: number; // Exactly 30 days
  dailyCalendar: CalendarDayMealPlan[];
}
