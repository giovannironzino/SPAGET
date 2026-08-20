import { systemConfig, DynamicRecipeArchetype } from './systemConfigService';
import type { ClinicalFoodItem } from './clinicalNutritionEngine';
import { FoodFunctionalRole } from '../types/foodRoles';
import { evaluateFoodSafety, ClinicalCondition } from '../data/allergenTaxonomy';
import { userPreferencesService } from './userPreferencesService';

export interface FractionatedMealQuota {
  mealId: string;
  mealName: string;
  kcalQuota: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

export interface PersonalNutritionContext {
  restrictions?: {
    dietaryPattern?: string;
    excludedFoods?: string[];
    allergies?: string[];
    clinicalConditions?: ClinicalCondition[];
  };
  preferences?: {
    lunchesOutPerWeek?: number;
  };
}

export interface PlannedMealSlot {
  mealId: string;
  mealName: string;
  archetypeId?: string;
  archetypeName?: string;
  selectedFoods: Array<{
    food: ClinicalFoodItem;
    portionReadyGrams: number;
    daysPerWeek: number;
  }>;
}

/**
 * Filtra catálogo de alimentos com avaliação de segurança clínica e de alérgenos da Anvisa
 */
function getFilteredCatalog(
  restrictions?: PersonalNutritionContext['restrictions'],
  preferences?: PersonalNutritionContext['preferences']
): ClinicalFoodItem[] {
  let catalog = systemConfig.getFoods();

  if (restrictions) {
    catalog = catalog.filter((f) => {
      const safety = evaluateFoodSafety(f, {
        allergies: restrictions.allergies,
        blacklistedNames: restrictions.excludedFoods,
        dietaryStyle: restrictions.dietaryPattern,
        clinicalConditions: restrictions.clinicalConditions,
      });
      return safety.isSafe;
    });
  }

  return catalog.length > 0 ? catalog : systemConfig.getFoods();
}

/**
 * Universal Solver: matches meal quotas to Ministry of Health Recipe Archetypes dynamically
 */
export function generatePersonalizedMealPlan(
  fractionatedQuotas: FractionatedMealQuota[],
  personalContext?: PersonalNutritionContext
): PlannedMealSlot[] {
  const restrictions = personalContext?.restrictions;
  const preferences = personalContext?.preferences;
  const userPrefs = userPreferencesService.getPreferences();

  const mergedRestrictions = {
    ...restrictions,
    dietaryPattern: restrictions?.dietaryPattern || userPrefs?.dietaryStyle || 'omnivore',
    excludedFoods: Array.from(new Set([...(restrictions?.excludedFoods || []), ...(userPrefs?.blacklistedFoods || [])])),
    allergies: Array.from(new Set([...(restrictions?.allergies || []), ...(userPrefs?.allergies || [])])),
    clinicalConditions: restrictions?.clinicalConditions || userPrefs?.clinicalConditions,
  };

  const catalog = getFilteredCatalog(mergedRestrictions, preferences);
  let archetypes = systemConfig.getArchetypes();
  if (userPrefs?.hiddenArchetypeIds && userPrefs.hiddenArchetypeIds.length > 0) {
    const activeArchetypes = archetypes.filter((a) => !userPrefs.hiddenArchetypeIds?.includes(a.id));
    if (activeArchetypes.length > 0) archetypes = activeArchetypes;
  }

  return fractionatedQuotas.map((quota, qIdx) => {
    const selectedFoods: Array<{ food: ClinicalFoodItem; portionReadyGrams: number; daysPerWeek: number }> = [];

    // Select suitable archetype based on meal slot type using deterministic variety rotation
    let chosenArchetype: DynamicRecipeArchetype | undefined;

    if (quota.mealId.includes('cafe') || quota.mealId.includes('desjejum')) {
      const cafeArchetypes = archetypes.filter((a) => a.id === 'arch-cafe-pao' || a.id === 'arch-cafe-regional' || a.id === 'arch-cafe-proteico');
      const idx = cafeArchetypes.length > 0 ? (qIdx * 3 + 1) % cafeArchetypes.length : 0;
      chosenArchetype = cafeArchetypes[idx] || archetypes[6] || archetypes[0];
    } else if (quota.mealId.includes('lanche')) {
      const lancheArchetypes = archetypes.filter((a) => a.id === 'arch-lanche-fruta' || a.id === 'arch-lanche-lacteo' || a.id === 'arch-lanche-oleaginosas');
      const idx = lancheArchetypes.length > 0 ? (qIdx * 5 + 2) % lancheArchetypes.length : 0;
      chosenArchetype = lancheArchetypes[idx] || archetypes[9] || archetypes[0];
    } else if (quota.mealId.includes('jantar')) {
      const jantarArchetypes = archetypes.filter((a) => a.id === 'arch-sopa-nutritiva' || a.id === 'arch-ensopado' || a.id === 'arch-massa-hortalicas');
      const idx = jantarArchetypes.length > 0 ? (qIdx * 7 + 3) % jantarArchetypes.length : 0;
      chosenArchetype = jantarArchetypes[idx] || archetypes[5] || archetypes[0];
    } else {
      // Almoço / Principal
      let almocoArchetypes = archetypes.filter(
        (a) =>
          a.id === 'arch-pf-tradicional' ||
          a.id === 'arch-ensopado' ||
          a.id === 'arch-moqueca' ||
          a.id === 'arch-tropeiro-baiao' ||
          a.id === 'arch-massa-hortalicas'
      );

      // Se o usuário almoça fora da casa durante a semana, inclui o arquétipo 13
      if (preferences?.lunchesOutPerWeek && preferences.lunchesOutPerWeek > 0) {
        const foraArch = archetypes.find((a) => a.id === 'arch-fora-delivery');
        if (foraArch) almocoArchetypes = [foraArch, ...almocoArchetypes];
      }

      const idx = almocoArchetypes.length > 0 ? (qIdx * 2) % almocoArchetypes.length : 0;
      chosenArchetype = almocoArchetypes[idx] || archetypes[0];
    }

    if (chosenArchetype && chosenArchetype.slots) {
      // Allocate each slot dynamically from filtered catalog using FoodFunctionalRole
      chosenArchetype.slots.forEach((slot, sIdx) => {
        const candidates = catalog.filter((f) => {
          if (slot.role && f.functionalRoles && f.functionalRoles.length > 0) {
            return f.functionalRoles.includes(slot.role as FoodFunctionalRole);
          }
          return f.category === slot.categoryTag;
        });

        // Deterministic candidate rotation
        const candidateIdx = candidates.length > 0 ? (qIdx * 7 + sIdx * 3) % candidates.length : 0;
        const candidate = candidates[candidateIdx] || catalog[sIdx % catalog.length];

        if (candidate) {
          selectedFoods.push({
            food: candidate,
            portionReadyGrams: slot.defaultGramsTarget || 100,
            daysPerWeek: chosenArchetype?.id === 'arch-fora-delivery' ? (preferences?.lunchesOutPerWeek || 3) : 7,
          });
        }
      });
    }

    return {
      mealId: quota.mealId,
      mealName: quota.mealName,
      archetypeId: chosenArchetype?.id,
      archetypeName: chosenArchetype?.name,
      selectedFoods,
    };
  });
}
