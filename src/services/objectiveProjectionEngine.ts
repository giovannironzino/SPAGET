import {
  UserBiometricData,
  UserExpectation,
  ObjectiveProjection,
} from '../types/foodPredictor';

export function calculateObjectiveProjection(
  personData: UserBiometricData,
  expectation: UserExpectation
): ObjectiveProjection {
  const heightM = personData.heightCm / 100;
  const bmi = Number((personData.weightKg / (heightM * heightM)).toFixed(1));

  const targetWeightKg = expectation.targetWeightKg || personData.weightKg;
  const weightDiffKg = Math.abs(personData.weightKg - targetWeightKg);

  // Safe sustainable weight loss rate: 0.5kg - 0.75kg per week
  const expectedWeeklyRateKg = expectation.goalType === 'lose_weight' ? 0.6 : 0.4;
  const estimatedTimelineDays = expectation.targetTimeframeDays || Math.max(30, Math.round((weightDiffKg / expectedWeeklyRateKg) * 7));

  const status: 'on_track' | 'requires_adjustment' | 'incompatible' =
    weightDiffKg > 0 && estimatedTimelineDays < (weightDiffKg / 1.0) * 7
      ? 'incompatible'
      : 'on_track';

  return {
    currentState: { weightKg: personData.weightKg, bmi },
    expectedState: { targetWeightKg },
    targetState: { calculatedFeasibleWeightKg: targetWeightKg },
    estimatedTimelineDays,
    expectedWeeklyRateKg,
    assumptions: [
      'Aderência média de 85% à estrutura alimentar semanal',
      'Manutenção do nível de movimento/atividade física declarado',
      'Variações normais de retenção hídrica contempladas na incerteza',
    ],
    uncertaintyMarginPct: 10,
    status,
  };
}
