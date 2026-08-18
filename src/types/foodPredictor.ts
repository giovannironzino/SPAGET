/**
 * SPAGET 3.1 - Architecture Data Contracts
 */

export type NormalizedDeviation = number; // Bounded strictly between 0.0 and 1.0

export interface UserBiometricData {
  ageYears: number;
  weightKg: number;
  heightCm: number;
  sex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  numberOfDependents: number;
  cityState: string;
}

export interface UserExpectation {
  goalType: 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'gain_muscle';
  targetWeightKg?: number;
  targetTimeframeDays?: number;
  customNotes?: string;
}

export interface UserRoutine {
  dailyMealsCount: number;
  mealDefinitions: Array<{
    id: string;
    name: string;
    targetPercentage: number;
    approximateTime: string;
  }>;
  weeklyVariation: {
    hasWorkVsHomeOffice: boolean;
    hasTrainingVsRestDays: boolean;
    trainingDaysCount: number;
  };
  mealsOutPerWeek: Array<{
    mealId: string;
    daysCount: number; // e.g. Lunch out 2 days/week
  }>;
  cookingFrequency: 'daily' | 'batch_2_days' | 'batch_weekly' | 'minimal';
  storageCapacity: 'small_fridge' | 'fridge_freezer' | 'chest_freezer';
}

export interface UserPreferences {
  preferredFoodIds: string[];
  acceptedFoodIds: string[];
  rejectedFoodIds: string[];
  preferredPreparations?: string[];
}

export interface UserRestrictions {
  dietaryPattern?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
  allergies: string[]; // HardConstraints
  intolerances: string[];
  excludedFoods: string[];
}

export interface SafetyEvaluation {
  status: 'permitted' | 'restricted' | 'escalation_required';
  permittedActions: string[];
  restrictedActions: string[];
  calculationConstraints: {
    maxSafeWeightLossRatePerWeekKg?: number;
    minSafeDailyCaloriesKcal?: number;
    maxSafeDailyCaloriesKcal?: number;
    recommendedTimeframeDays?: number;
  };
  escalationRequiredReason?: string;
  userFacingExplanation?: string;
}

export interface NutritionalStrategy {
  strategyName: string;
  energyRequirementMethod: string;
  bodyReferenceMethod: string;
  bodyReferenceWeightKg: number;
  dailyEnergyKcal: number;
  proteinStrategyGrams: number;
  fatStrategyGrams: number;
  carbStrategyGrams: number;
  minFiberStrategyGrams: number;
  isCustomizedForGoal: boolean;
}

export interface PersonalNutritionContext {
  personData: UserBiometricData;
  expectation: UserExpectation;
  routine: UserRoutine;
  preferences: UserPreferences;
  restrictions: UserRestrictions;
  safetyEvaluation: SafetyEvaluation;
  calculatedStrategy: NutritionalStrategy;
}

export interface CalculatedTarget {
  targetType: 'energy' | 'protein' | 'carbs' | 'fats' | 'fiber' | 'calcium' | 'iron';
  value: number;
  unit: string;
  calculationMethod: string;
  inputs: Record<string, any>;
  generatedAt: string;
}

export interface ObjectiveProjection {
  currentState: { weightKg: number; bmi: number };
  expectedState: { targetWeightKg: number };
  targetState: { calculatedFeasibleWeightKg: number };
  estimatedTimelineDays: number;
  expectedWeeklyRateKg: number;
  assumptions: string[];
  uncertaintyMarginPct: number;
  status: 'on_track' | 'requires_adjustment' | 'incompatible';
}

export interface GlobalDeviationScore {
  // Blocking Constraints (Must equal 0 for valid plan)
  safetyConstraintViolations: number;
  hardConstraintViolations: number;
  userChoiceViolations: number;

  // Normalized Deviation Components (0.0 to 1.0)
  objectiveTrajectoryDeviation: NormalizedDeviation;
  nutritionalTargetDeviation: NormalizedDeviation;
  declaredPreferenceDeviation: NormalizedDeviation;
  routineFitDeviation: NormalizedDeviation;
  costEfficiencyDeviation: NormalizedDeviation;
}

export interface OptimizationProfile {
  objectiveWeight: number;   // e.g. 1.0
  nutritionalWeight: number; // e.g. 0.8
  preferenceWeight: number;  // e.g. 0.6
  routineWeight: number;     // e.g. 0.4
  costWeight: number;        // e.g. 0.2
}

export type FoodState = 'consumed' | 'prepared' | 'raw_edible' | 'gross_raw';

export interface FoodYieldProfile {
  cookedToPreparedRatio: number;  // e.g. 1.0
  preparedToRawEdibleRatio: number; // Fator de Cocção (FC). e.g. 0.4 for rice (100g cooked = 40g raw)
  rawEdibleToGrossRawRatio: number; // Fator de Correção (FCr). e.g. 1.3 for pumpkin peel waste
}

export interface CommercialPurchaseCalculation {
  foodId: string;
  foodName: string;
  category: 'supermarket' | 'farmersMarket' | 'bakery';
  grossRawRequiredKg: number;
  umcUnitName: string;
  umcSizeKg: number;
  pricePerUmc: number;
  unitsToPurchase: number;
  totalPurchasedKg: number;
  pantryCarryOverKg: number;
  totalOutofPocketCost: number;
}

export interface NextCycleAdjustments {
  consumptionAdjustments: Record<string, number>;
  observedRoutineAdjustments: Record<string, any>;
  priceAdjustments: Record<string, number>;
  pantryAdjustments: Record<string, number>;
  adherenceObservations: Record<string, any>;
}

export interface FoodDataSufficiencyState {
  objectiveDataComplete: boolean;
  anthropometricDataComplete: boolean;
  safetyDataComplete: boolean;
  routineDataComplete: boolean;
  preferenceDataComplete: boolean;
  restrictionDataComplete: boolean;
  mealStructureDataComplete: boolean;
  calculationReady: boolean;
  missingRequiredFields: string[];
}
