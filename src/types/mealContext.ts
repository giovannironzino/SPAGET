/**
 * SPAGET 3.2 - MealContext & Ranking Contracts
 */

export type MealContextType =
  | 'BREAKFAST'
  | 'MORNING_SNACK'
  | 'LUNCH'
  | 'AFTERNOON_SNACK'
  | 'DINNER'
  | 'SUPPER';

export interface MealContextEvaluation {
  compatibilityScore: number; // 0 to 100
  nutritionCompatible: boolean;
  culinaryCompatible: boolean;
  culturalCompatibility: number; // 0 to 100 from POF
  userCompatibility: number;     // 0 to 100 from user preferences
  reasons: string[];
}

export type UserRepetitionTolerance = 'high_repetition' | 'moderate_rotation' | 'high_variety';
