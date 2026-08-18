/**
 * SPAGET 3.2 - Food Knowledge Base Contracts
 */

export interface FoodComposition {
  energyKcal: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
  calciumMg?: number;
  ironMg?: number;
  sodiumMg?: number;
  nutrients?: Record<string, number>;
  source: 'USDA' | 'TACO' | 'SPAGET';
  sourceId: string;
  fetchedAt: string;
}

export interface FoodOnClassification {
  iri: string;
  preferredLabel: string;
  synonyms: string[];
  hierarchicalAncestors: Array<{ iri: string; label: string }>;
  source: 'foodon';
  fetchedAt: string;
}

export interface ObservedFoodContext {
  foodCode: string;
  foodName: string;
  mealContext: {
    breakfast: number; // 0 to 1 score
    morningSnack: number;
    lunch: number;
    afternoonSnack: number;
    dinner: number;
    supper: number;
  };
  commonPreparations: string[];
  commonHouseholdMeasures: string[];
  observedFrequency: number;
}

export interface FoodPreparation {
  id: string;
  namePt: string;
  baseFoodId: string;
  preparationMethod: 'grilled' | 'boiled' | 'roasted' | 'shredded' | 'raw' | 'cooked';
  compatibleMealContexts: Array<'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER' | 'SUPPER'>;
  preparationTimeMinutes?: number;
  batchFriendly: boolean;
  freezerFriendly: boolean;
}

export interface FoodKnowledgeEntity {
  id: string;
  canonicalNamePt: string;
  aliasesPt: string[];
  composition: FoodComposition;
  foodOn?: FoodOnClassification;
  observedContext?: ObservedFoodContext;
  preparations: FoodPreparation[];
  defaultMealContexts: Array<'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER' | 'SUPPER'>;
}
