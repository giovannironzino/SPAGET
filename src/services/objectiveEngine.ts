import {
  UserBiometricData,
  UserExpectation,
  NutritionalStrategy,
} from '../types/foodPredictor';

export function calculateNutritionalStrategy(
  personData: UserBiometricData,
  expectation: UserExpectation
): NutritionalStrategy {
  // Determine Body Reference Strategy
  const heightM = personData.heightCm / 100;
  const bmi = personData.weightKg / (heightM * heightM);
  const isOverweightOrObese = bmi >= 25.0;
  const idealWeightKg = 22.5 * heightM * heightM;

  let bodyReferenceWeightKg = personData.weightKg;
  let bodyReferenceMethod = 'Peso Atual Bruto';

  if (isOverweightOrObese) {
    // Adjusted Weight strategy for BMI >= 25
    bodyReferenceWeightKg = idealWeightKg + 0.25 * (personData.weightKg - idealWeightKg);
    bodyReferenceMethod = `Peso Alvo: ${bodyReferenceWeightKg.toFixed(1)}kg (Baseado no Peso Clínico Ajustado para o seu IMC atual de ${bmi.toFixed(1)})`;
  }

  // Energy Requirement Methodology (Mifflin-St Jeor + TEF 10%)
  let bmr = 10 * personData.weightKg + 6.25 * personData.heightCm - 5 * personData.ageYears;
  bmr += personData.sex === 'male' ? 5 : -161;

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };

  const getWithTefKcal = Math.round(bmr * activityMultipliers[personData.activityLevel] * 1.10);

  let goalMultiplier = 1.0;
  let strategyName = 'Manutenção de Equilíbrio Energético';

  if (expectation.goalType === 'lose_weight') {
    goalMultiplier = 0.85; // -15%
    strategyName = 'Estratégia de Déficit Moderado (-15% kcal)';
  } else if (expectation.goalType === 'gain_weight' || expectation.goalType === 'gain_muscle') {
    goalMultiplier = 1.15; // +15%
    strategyName = 'Estratégia de Superávit Controlado (+15% kcal)';
  }

  const dailyEnergyKcal = Math.round(getWithTefKcal * goalMultiplier);

  // Targets derived from context & strategy
  const proteinStrategyGrams = Math.round(bodyReferenceWeightKg * 2.0);
  const fatStrategyGrams = Math.round((dailyEnergyKcal * 0.25) / 9);
  const remainingKcal = Math.max(0, dailyEnergyKcal - (proteinStrategyGrams * 4 + fatStrategyGrams * 9));
  const carbStrategyGrams = Math.round(remainingKcal / 4);
  const minFiberStrategyGrams = Math.round((dailyEnergyKcal / 1000) * 14);

  return {
    strategyName,
    energyRequirementMethod: 'Mifflin-St Jeor + Fator Atividade + TEF (10%)',
    bodyReferenceMethod,
    bodyReferenceWeightKg: Number(bodyReferenceWeightKg.toFixed(1)),
    dailyEnergyKcal,
    proteinStrategyGrams,
    fatStrategyGrams,
    carbStrategyGrams,
    minFiberStrategyGrams,
    isCustomizedForGoal: true,
  };
}
