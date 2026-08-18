import {
  UserBiometricData,
  UserExpectation,
  UserRoutine,
  UserPreferences,
  UserRestrictions,
  FoodDataSufficiencyState,
} from '../types/foodPredictor';

export function evaluateDataSufficiency(
  personData?: Partial<UserBiometricData>,
  expectation?: Partial<UserExpectation>,
  routine?: Partial<UserRoutine>,
  preferences?: Partial<UserPreferences>,
  restrictions?: Partial<UserRestrictions>
): FoodDataSufficiencyState {
  const missing: string[] = [];

  const anthropometricDataComplete = !!(
    personData &&
    personData.ageYears &&
    personData.weightKg &&
    personData.heightCm &&
    personData.sex &&
    personData.activityLevel
  );
  if (!anthropometricDataComplete) missing.push('Dados Corporais (Idade, Peso, Altura, Sexo, Atividade)');

  const objectiveDataComplete = !!(expectation && expectation.goalType);
  if (!objectiveDataComplete) missing.push('Objetivo/Expectativa Principal');

  const safetyDataComplete = anthropometricDataComplete; // Derived safely

  const routineDataComplete = !!(
    routine &&
    routine.dailyMealsCount &&
    routine.dailyMealsCount >= 2 &&
    routine.mealDefinitions &&
    routine.mealDefinitions.length > 0
  );
  if (!routineDataComplete) missing.push('Estrutura de Refeições e Horários');

  const preferenceDataComplete = true; // Preferences are optional (defaults apply)
  const restrictionDataComplete = true; // Restrictions are optional
  const mealStructureDataComplete = routineDataComplete;

  const calculationReady =
    anthropometricDataComplete &&
    objectiveDataComplete &&
    routineDataComplete;

  return {
    objectiveDataComplete,
    anthropometricDataComplete,
    safetyDataComplete,
    routineDataComplete,
    preferenceDataComplete,
    restrictionDataComplete,
    mealStructureDataComplete,
    calculationReady,
    missingRequiredFields: missing,
  };
}
