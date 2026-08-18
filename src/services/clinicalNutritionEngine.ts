export interface ClinicalBiometricProfile {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  numberOfDependents: number;
  cityState: string;
  weightGoal?: 'lose' | 'maintain' | 'gain';
}

export interface ClinicalBiometricResult {
  bmi: number;
  bmiCategory: string;
  bmiColorClass: string;
  isOverweightOrObese: boolean;
  idealWeightKg: number;
  adjustedWeightKg: number;
  weightUsedForProteinKg: number;
  bmrKcal: number;
  tdeeWithTefKcal: number;
  vetTargetKcal: number;
  totalHouseholdDailyKcal: number;
  weightGoalLabel: string;
  // Global Daily Macro Targets
  proteinTargetGrams: number;
  fatTargetGrams: number;
  carbTargetGrams: number;
  minFiberTargetGrams: number;
  // MPS (Muscle Protein Synthesis) Meal Boundaries
  minMpsProteinPerMealGrams: number;
  maxMpsProteinPerMealGrams: number;
}

export interface MealDefinition {
  id: string;
  name: string;
  percentageQuota: number; // e.g. 25 = 25%
}

export interface MealQuotaResult {
  mealId: string;
  mealName: string;
  kcalQuota: number;
  proteinQuotaGrams: number;
  carbQuotaGrams: number;
  fatQuotaGrams: number;
  mpsWarning?: string;
}

export interface ClinicalFoodItem {
  id: string;
  name: string;
  category: 'protein' | 'grains' | 'carbs' | 'produce' | 'pantry';
  defaultLocation: 'supermarket' | 'farmersMarket' | 'bakery';
  // Per 100g cooked/ready values
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  fiberPer100g: number;
  calciumMgPer100g?: number;
  ironMgPer100g?: number;
  // Factors
  fc: number;  // Fator de Cocção (Cozido -> Cru). Ex: Arroz = 0.4 (100g cozido vem de 40g cru)
  fcr: number; // Fator de Correção (Limpo -> Bruto). Ex: Abóbora com casca = 1.3
  isHybrid?: boolean; // Se contém múltiplos macros relevantes (ex: feijão, leite)
  // Packaging for UMC (Unidade Mínima Comercializável)
  umcUnitName: string; // 'Pacote 1kg', 'Cartela 30un', etc.
  umcSizeKg: number;   // Peso bruto por embalagem
  pricePerUmc: number;  // Preço da embalagem inteira
}

/**
 * 1. Calculate Biometrics with Adjusted Weight & TEF
 */
export function calculateClinicalBiometrics(profile: ClinicalBiometricProfile): ClinicalBiometricResult {
  const heightM = profile.heightCm / 100;
  const bmi = Number((profile.weightKg / (heightM * heightM)).toFixed(1));

  let bmiCategory = 'Peso Ideal';
  let bmiColorClass = 'text-emerald-700 bg-emerald-50 border-emerald-300';
  const isOverweightOrObese = bmi >= 25.0;

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

  // Ideal weight for BMI 22.5
  const idealWeightKg = Number((22.5 * heightM * heightM).toFixed(1));
  
  // Adjusted Weight formula: IdealWeight + 0.25 * (CurrentWeight - IdealWeight)
  const adjustedWeightKg = isOverweightOrObese
    ? Number((idealWeightKg + 0.25 * (profile.weightKg - idealWeightKg)).toFixed(1))
    : profile.weightKg;

  const weightUsedForProteinKg = adjustedWeightKg;

  // Mifflin-St Jeor Formula
  let bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.ageYears;
  if (profile.sex === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  bmr = Math.round(bmr);

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };

  // TEF (Thermic Effect of Food) = +10%
  const tdeeWithTefKcal = Math.round(bmr * activityMultipliers[profile.activityLevel] * 1.10);

  let goalMultiplier = 1.0;
  let weightGoalLabel = 'Manutenção de Peso';

  if (profile.weightGoal === 'lose') {
    goalMultiplier = 0.85; // -15%
    weightGoalLabel = 'Emagrecimento Saudável (-15% calorias)';
  } else if (profile.weightGoal === 'gain') {
    goalMultiplier = 1.15; // +15%
    weightGoalLabel = 'Ganho de Massa Muscular (+15% calorias)';
  }

  const vetTargetKcal = Math.round(tdeeWithTefKcal * goalMultiplier);
  const householdCount = Math.max(1, 1 + profile.numberOfDependents);
  const totalHouseholdDailyKcal = vetTargetKcal * householdCount;

  // Macro Distribution:
  // Protein = 2.0g per kg of Adjusted Weight
  const proteinTargetGrams = Math.round(weightUsedForProteinKg * 2.0);
  const proteinKcal = proteinTargetGrams * 4;

  // Fat = 25% of VET Target
  const fatTargetGrams = Math.round((vetTargetKcal * 0.25) / 9);
  const fatKcal = fatTargetGrams * 9;

  // Carb = Remaining Kcal
  const remainingKcal = Math.max(0, vetTargetKcal - (proteinKcal + fatKcal));
  const carbTargetGrams = Math.round(remainingKcal / 4);

  // Fiber Target = 14g per 1,000 kcal
  const minFiberTargetGrams = Math.round((vetTargetKcal / 1000) * 14);

  // MPS (Muscle Protein Synthesis) per main meal limits
  const minMpsProteinPerMealGrams = Number((weightUsedForProteinKg * 0.30).toFixed(1));
  const maxMpsProteinPerMealGrams = Number((weightUsedForProteinKg * 0.55).toFixed(1));

  return {
    bmi,
    bmiCategory,
    bmiColorClass,
    isOverweightOrObese,
    idealWeightKg,
    adjustedWeightKg,
    weightUsedForProteinKg,
    bmrKcal: bmr,
    tdeeWithTefKcal,
    vetTargetKcal,
    totalHouseholdDailyKcal,
    weightGoalLabel,
    proteinTargetGrams,
    fatTargetGrams,
    carbTargetGrams,
    minFiberTargetGrams,
    minMpsProteinPerMealGrams,
    maxMpsProteinPerMealGrams,
  };
}

/**
 * 2. Fractionate daily quotas into meals with MPS validation
 */
export function fractionateMealQuotas(
  biometrics: ClinicalBiometricResult,
  meals: MealDefinition[]
): MealQuotaResult[] {
  return meals.map((meal) => {
    const fraction = meal.percentageQuota / 100;
    const kcalQuota = Math.round(biometrics.vetTargetKcal * fraction);
    const proteinQuotaGrams = Math.round(biometrics.proteinTargetGrams * fraction);
    const carbQuotaGrams = Math.round(biometrics.carbTargetGrams * fraction);
    const fatQuotaGrams = Math.round(biometrics.fatTargetGrams * fraction);

    let mpsWarning: string | undefined = undefined;
    if (proteinQuotaGrams < biometrics.minMpsProteinPerMealGrams) {
      mpsWarning = `Proteína baixa para esta refeição (abaixo de ${biometrics.minMpsProteinPerMealGrams}g). Recomendado distribuir melhor para o músculo aproveitar.`;
    } else if (proteinQuotaGrams > biometrics.maxMpsProteinPerMealGrams) {
      mpsWarning = `Proteína muito concentrada nesta refeição (acima de ${biometrics.maxMpsProteinPerMealGrams}g).`;
    }

    return {
      mealId: meal.id,
      mealName: meal.name,
      kcalQuota,
      proteinQuotaGrams,
      carbQuotaGrams,
      fatQuotaGrams,
      mpsWarning,
    };
  });
}

/**
 * 3. Fat Compensation & Hybrid Food Matrix Calculation
 */
export interface MealSlotSelection {
  proteinFood?: ClinicalFoodItem;
  carbFood?: ClinicalFoodItem;
  fatFood?: ClinicalFoodItem;
  produceFood?: ClinicalFoodItem;
}

export interface CalculatedMealPortions {
  proteinPortionReadyG: number;
  carbPortionReadyG: number;
  fatPortionReadyG: number;
  producePortionReadyG: number;
  // Fat compensation details
  fatFromProteinG: number;
  excessFatG: number;
  carbDiscountG: number;
  oilQuotaGramsFinal: number;
}

export function calculateMealPortionsWithFatCompensation(
  quota: MealQuotaResult,
  selection: MealSlotSelection
): CalculatedMealPortions {
  let proteinPortionReadyG = 0;
  let fatFromProteinG = 0;
  let excessFatG = 0;
  let carbDiscountG = 0;
  let oilQuotaGramsFinal = quota.fatQuotaGrams;

  // 1. Calculate Protein Portion
  if (selection.proteinFood && selection.proteinFood.proteinPer100g > 0) {
    proteinPortionReadyG = Math.round(
      (quota.proteinQuotaGrams / selection.proteinFood.proteinPer100g) * 100
    );
    // Calculate fat coming from this protein portion
    fatFromProteinG = Math.round((proteinPortionReadyG / 100) * selection.proteinFood.fatsPer100g);

    // Fat Compensation Algorithm
    if (fatFromProteinG > quota.fatQuotaGrams) {
      excessFatG = fatFromProteinG - quota.fatQuotaGrams;
      oilQuotaGramsFinal = 0; // Zero oil quota
      // Convert excess fat to carb discount: 1g fat (9kcal) = 2.25g carb (4kcal)
      carbDiscountG = Math.round(excessFatG * 2.25);
    } else {
      oilQuotaGramsFinal = quota.fatQuotaGrams - fatFromProteinG;
    }
  }

  // 2. Calculate Carb Portion (accounting for carb discount & hybrid foods like beans)
  let adjustedCarbQuotaG = Math.max(0, quota.carbQuotaGrams - carbDiscountG);

  // If protein food is hybrid (e.g. beans), subtract its carbs from carb quota
  if (selection.proteinFood && selection.proteinFood.carbsPer100g > 0) {
    const carbsFromProteinFood = (proteinPortionReadyG / 100) * selection.proteinFood.carbsPer100g;
    adjustedCarbQuotaG = Math.max(0, adjustedCarbQuotaG - carbsFromProteinFood);
  }

  let carbPortionReadyG = 0;
  if (selection.carbFood && selection.carbFood.carbsPer100g > 0) {
    carbPortionReadyG = Math.round((adjustedCarbQuotaG / selection.carbFood.carbsPer100g) * 100);
  }

  // 3. Calculate Oil/Fat Portion
  let fatPortionReadyG = 0;
  if (selection.fatFood && selection.fatFood.fatsPer100g > 0 && oilQuotaGramsFinal > 0) {
    fatPortionReadyG = Math.round((oilQuotaGramsFinal / selection.fatFood.fatsPer100g) * 100);
  }

  // 4. Produce Portion (default 120g for fiber and micronutrients)
  const producePortionReadyG = selection.produceFood ? 120 : 0;

  return {
    proteinPortionReadyG,
    carbPortionReadyG,
    fatPortionReadyG,
    producePortionReadyG,
    fatFromProteinG,
    excessFatG,
    carbDiscountG,
    oilQuotaGramsFinal,
  };
}

/**
 * 4. Calculate Final Weekly Shopping Volume with FC, FCr and UMC (Commercial Packages)
 */
export interface WeeklyShoppingItemResult {
  food: ClinicalFoodItem;
  weeklyDays: number;
  dailyReadyPortionG: number;
  dailyRawPortionG: number;
  weeklyGrossRawKg: number;
  umcPackagesNeeded: number;
  totalCostOutofPocket: number;
  pantrySurplusKg: number;
}

export function calculateWeeklyShopping(
  food: ClinicalFoodItem,
  dailyReadyPortionG: number,
  weeklyDays: number,
  householdCount: number
): WeeklyShoppingItemResult {
  const count = Math.max(1, householdCount);
  
  // Apply Fator de Cocção (FC): Ready -> Raw
  const dailyRawPortionG = Math.round(dailyReadyPortionG * food.fc);

  // Apply Fator de Correção (FCr): Raw Clean -> Gross Purchase
  const weeklyGrossRawG = dailyRawPortionG * weeklyDays * food.fcr * count;
  const weeklyGrossRawKg = Number((weeklyGrossRawG / 1000).toFixed(2));

  // Calculate UMC (Commercial Packages)
  const umcPackagesNeeded = weeklyGrossRawKg > 0
    ? Math.ceil(weeklyGrossRawKg / food.umcSizeKg)
    : 0;

  const totalCostOutofPocket = Number((umcPackagesNeeded * food.pricePerUmc).toFixed(2));
  const totalPurchasedKg = umcPackagesNeeded * food.umcSizeKg;
  const pantrySurplusKg = Number(Math.max(0, totalPurchasedKg - weeklyGrossRawKg).toFixed(2));

  return {
    food,
    weeklyDays,
    dailyReadyPortionG,
    dailyRawPortionG,
    weeklyGrossRawKg,
    umcPackagesNeeded,
    totalCostOutofPocket,
    pantrySurplusKg,
  };
}
