import {
  PersonalNutritionContext,
  CalculatedTarget,
} from '../types/foodPredictor';

export function calculateNutritionalTargets(
  context: PersonalNutritionContext
): CalculatedTarget[] {
  const generatedAt = new Date().toISOString();
  const strat = context.calculatedStrategy;

  return [
    {
      targetType: 'energy',
      value: strat.dailyEnergyKcal,
      unit: 'kcal/dia',
      calculationMethod: strat.energyRequirementMethod,
      inputs: { bodyRefKg: strat.bodyReferenceWeightKg, goal: context.expectation.goalType },
      generatedAt,
    },
    {
      targetType: 'protein',
      value: strat.proteinStrategyGrams,
      unit: 'g/dia',
      calculationMethod: `2.0g por kg de ${strat.bodyReferenceMethod}`,
      inputs: { bodyRefKg: strat.bodyReferenceWeightKg },
      generatedAt,
    },
    {
      targetType: 'carbs',
      value: strat.carbStrategyGrams,
      unit: 'g/dia',
      calculationMethod: 'Saldo energético restante pós proteína e gordura',
      inputs: { totalKcal: strat.dailyEnergyKcal },
      generatedAt,
    },
    {
      targetType: 'fats',
      value: strat.fatStrategyGrams,
      unit: 'g/dia',
      calculationMethod: '25% do VET Alvo (Gorduras Saudáveis)',
      inputs: { totalKcal: strat.dailyEnergyKcal },
      generatedAt,
    },
    {
      targetType: 'fiber',
      value: strat.minFiberStrategyGrams,
      unit: 'g/dia',
      calculationMethod: '14g a cada 1.000 kcal para saúde intestinal',
      inputs: { totalKcal: strat.dailyEnergyKcal },
      generatedAt,
    },
  ];
}
