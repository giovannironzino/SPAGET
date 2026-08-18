import { FoodCategoryGroup, NeutralFoodItem, NEUTRAL_FOOD_CATALOG } from '../data/foodCatalog';

export interface BiometricProfile {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  numberOfDependents: number;
  cityState: string;
  weightGoal?: 'lose' | 'maintain' | 'gain';
}

export interface BiometricResult {
  bmi: number;
  bmiCategory: string;
  bmiColorClass: string;
  tdeeKcal: number;
  totalHouseholdKcal: number;
  weightGoalLabel: string;
}

export function calculateBiometrics(profile: BiometricProfile): BiometricResult {
  const heightM = profile.heightCm / 100;
  const bmi = profile.weightKg / (heightM * heightM);

  let bmiCategory = 'Peso Ideal';
  let bmiColorClass = 'text-emerald-700 bg-emerald-50 border-emerald-300';

  if (bmi < 18.5) {
    bmiCategory = 'Abaixo do Peso';
    bmiColorClass = 'text-amber-700 bg-amber-50 border-amber-300';
  } else if (bmi >= 25 && bmi < 29.9) {
    bmiCategory = 'Sobrepeso';
    bmiColorClass = 'text-amber-700 bg-amber-50 border-amber-300';
  } else if (bmi >= 30) {
    bmiCategory = 'Obesidade';
    bmiColorClass = 'text-red-700 bg-red-50 border-red-300';
  }

  let bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.ageYears;
  if (profile.sex === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };

  let goalMultiplier = 1.0;
  let weightGoalLabel = 'Manutenção de Peso';

  if (profile.weightGoal === 'lose') {
    goalMultiplier = 0.85; // -15% Deficit for safe weight loss
    weightGoalLabel = 'Emagrecimento (-15% kcal)';
  } else if (profile.weightGoal === 'gain') {
    goalMultiplier = 1.15; // +15% Surplus for weight/muscle gain
    weightGoalLabel = 'Ganho de Massa (+15% kcal)';
  }

  const tdeeKcal = Math.round(bmr * activityMultipliers[profile.activityLevel] * goalMultiplier);
  const householdCount = Math.max(1, 1 + profile.numberOfDependents);
  const totalHouseholdKcal = tdeeKcal * householdCount;

  return {
    bmi: Number(bmi.toFixed(1)),
    bmiCategory,
    bmiColorClass,
    tdeeKcal,
    totalHouseholdKcal,
    weightGoalLabel,
  };
}

export interface GroupGrossTarget {
  group: FoodCategoryGroup;
  name: string;
  targetKg: number;
  selectedKg: number;
  isComplete: boolean;
}

export interface SelectedFoodItemState {
  item: NeutralFoodItem;
  quantityUnits: number;
  pricePerUnit: number;
  totalKg: number;
  totalCost: number;
}

export interface ResearchEvidence {
  cityState: string;
  sourcesResearched: string[];
  evidenceNotes: string;
  researchedPrices: Record<string, { minPrice: number; avgPrice: number; maxPrice: number }>;
}

export interface GranularNutritionalResult {
  biometrics: BiometricResult;
  householdCount: number;
  groupTargets: Record<FoodCategoryGroup, GroupGrossTarget>;
  selectedItems: SelectedFoodItemState[];
  totalWeeklyCostBase: number;
  totalMonthlyCostBase: number;
  totalMonthlyWithSafetyMargin: number;
  safetyMarginPercentage: number;
}

/**
 * Calculate factual target weights per group (kg for 7 days) based on household count & goal
 */
export function calculateGroupTargets(
  householdCount: number,
  weightGoal: 'lose' | 'maintain' | 'gain' = 'maintain'
): Record<FoodCategoryGroup, number> {
  const count = Math.max(1, householdCount);
  let goalFactor = 1.0;
  if (weightGoal === 'lose') goalFactor = 0.88;
  if (weightGoal === 'gain') goalFactor = 1.12;

  return {
    protein: Number((2.0 * count * goalFactor).toFixed(1)),
    grains: Number((2.5 * count * goalFactor).toFixed(1)),
    carbs: Number((2.0 * count * goalFactor).toFixed(1)),
    produce: Number((2.5 * count * goalFactor).toFixed(1)),
    pantry: Number((1.2 * count).toFixed(1)),
  };
}

/**
 * Calculate selected coverage per group based on user's chosen item quantities
 */
export function computeGroupCoverage(
  householdCount: number,
  selectedQuantities: Record<string, number>,
  customPrices: Record<string, number>
): GranularNutritionalResult {
  const targets = calculateGroupTargets(householdCount);
  const selectedItemsState: SelectedFoodItemState[] = [];

  const selectedKgPerGroup: Record<FoodCategoryGroup, number> = {
    protein: 0,
    grains: 0,
    carbs: 0,
    produce: 0,
    pantry: 0,
  };

  let totalWeeklyCostBase = 0;

  NEUTRAL_FOOD_CATALOG.forEach((item) => {
    const qty = selectedQuantities[item.id] || 0;
    if (qty > 0) {
      const priceUnit = customPrices[item.id] !== undefined ? customPrices[item.id] : item.defaultPricePerUnit;
      const totalKg = Number((qty * item.estimatedKgPerUnit).toFixed(1));
      const totalCost = qty * priceUnit;

      selectedKgPerGroup[item.group] += totalKg;
      totalWeeklyCostBase += totalCost;

      selectedItemsState.push({
        item,
        quantityUnits: qty,
        pricePerUnit: priceUnit,
        totalKg,
        totalCost,
      });
    }
  });

  const groupTargets: Record<FoodCategoryGroup, GroupGrossTarget> = {
    protein: {
      group: 'protein',
      name: 'Proteínas',
      targetKg: targets.protein,
      selectedKg: Number(selectedKgPerGroup.protein.toFixed(1)),
      isComplete: selectedKgPerGroup.protein >= targets.protein * 0.85,
    },
    grains: {
      group: 'grains',
      name: 'Grãos Essenciais',
      targetKg: targets.grains,
      selectedKg: Number(selectedKgPerGroup.grains.toFixed(1)),
      isComplete: selectedKgPerGroup.grains >= targets.grains * 0.85,
    },
    carbs: {
      group: 'carbs',
      name: 'Tubérculos & Carboidratos',
      targetKg: targets.carbs,
      selectedKg: Number(selectedKgPerGroup.carbs.toFixed(1)),
      isComplete: selectedKgPerGroup.carbs >= targets.carbs * 0.85,
    },
    produce: {
      group: 'produce',
      name: 'Frutas, Legumes & Verduras',
      targetKg: targets.produce,
      selectedKg: Number(selectedKgPerGroup.produce.toFixed(1)),
      isComplete: selectedKgPerGroup.produce >= targets.produce * 0.85,
    },
    pantry: {
      group: 'pantry',
      name: 'Mercearia, Laticínios & Limpeza',
      targetKg: targets.pantry,
      selectedKg: Number(selectedKgPerGroup.pantry.toFixed(1)),
      isComplete: selectedKgPerGroup.pantry >= targets.pantry * 0.85,
    },
  };

  const totalMonthlyCostBase = Math.round(totalWeeklyCostBase * 4.33);

  return {
    biometrics: {
      bmi: 0,
      bmiCategory: '',
      bmiColorClass: '',
      tdeeKcal: 0,
      totalHouseholdKcal: 0,
      weightGoalLabel: '',
    },
    householdCount,
    groupTargets,
    selectedItems: selectedItemsState,
    totalWeeklyCostBase: Math.round(totalWeeklyCostBase),
    totalMonthlyCostBase,
    totalMonthlyWithSafetyMargin: Math.round(totalMonthlyCostBase * 1.15),
    safetyMarginPercentage: 15,
  };
}

/**
 * Convert human frequency habits (daily/weekly) into total weekly gross weight (kg)
 */
export function convertFrequencyToKg(
  type: 'daily' | 'weekly' | 'direct',
  count: number,
  householdCount: number,
  estimatedKgPerUnit: number
): number {
  const countHousehold = Math.max(1, householdCount);
  if (type === 'daily') {
    // e.g. 2 eggs/day per person for 7 days
    return Number((count * 7 * countHousehold * estimatedKgPerUnit).toFixed(1));
  }
  if (type === 'weekly') {
    // e.g. 4 times/week per person
    return Number((count * countHousehold * estimatedKgPerUnit).toFixed(1));
  }
  // Direct quantity
  return Number((count * estimatedKgPerUnit).toFixed(1));
}
