import {
  UserBiometricData,
  UserExpectation,
  UserRestrictions,
  SafetyEvaluation,
} from '../types/foodPredictor';

export function evaluateNutritionSafety(
  personData: UserBiometricData,
  expectation: UserExpectation,
  restrictions?: UserRestrictions
): SafetyEvaluation {
  const permittedActions: string[] = ['Cálculo de metas alimentares', 'Projeção de compras UMC'];
  const restrictedActions: string[] = [];

  let status: 'permitted' | 'restricted' | 'escalation_required' = 'permitted';
  let escalationReason: string | undefined = undefined;
  let userFacingExplanation: string | undefined = undefined;

  const heightM = personData.heightCm / 100;
  const bmi = personData.weightKg / (heightM * heightM);

  // Check extreme caloric deficits or impossible timeframes
  if (expectation.goalType === 'lose_weight' && expectation.targetWeightKg && expectation.targetTimeframeDays) {
    const weightLossRequestedKg = personData.weightKg - expectation.targetWeightKg;
    const weeklyRateRequested = (weightLossRequestedKg / expectation.targetTimeframeDays) * 7;

    if (weeklyRateRequested > 1.2) {
      status = 'restricted';
      restrictedActions.push('Geração de dieta com déficit extremo');
      escalationReason = `Ritmo solicitado (${weeklyRateRequested.toFixed(1)}kg/semana) excede o limite adotado pelo sistema para este caso.`;
      
      const safeDays = Math.ceil((weightLossRequestedKg / 0.75) * 7);
      userFacingExplanation = `Para alcançar ${expectation.targetWeightKg}kg de forma saudável e sem estagnar seu metabolismo, o limite adotado pelo sistema recomenda um prazo de aproximadamente ${safeDays} dias.`;
    }
  }

  // Safety calorie floor
  const minSafeDailyCaloriesKcal = personData.sex === 'female' ? 1200 : 1500;

  return {
    status,
    permittedActions,
    restrictedActions,
    calculationConstraints: {
      maxSafeWeightLossRatePerWeekKg: 1.0,
      minSafeDailyCaloriesKcal,
      recommendedTimeframeDays: status === 'restricted' ? 60 : expectation.targetTimeframeDays,
    },
    escalationRequiredReason: escalationReason,
    userFacingExplanation,
  };
}
