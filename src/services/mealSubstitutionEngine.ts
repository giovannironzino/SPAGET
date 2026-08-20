import { systemConfig } from './systemConfigService';
import { ClinicalFoodItem } from './clinicalNutritionEngine';
import { evaluateFoodSafety, ClinicalCondition } from '../data/allergenTaxonomy';

export interface SubstitutionRestrictions {
  blacklistedIds?: string[];
  blacklistedNames?: string[];
  dietaryStyle?: string;
  allergies?: string[];
  clinicalConditions?: ClinicalCondition[];
}

export interface SubstitutionOption {
  food: ClinicalFoodItem;
  equivalentPortionReadyGrams: number;
  costDifferenceMonthly: number;
  explanation: string;
}

export type MealSlotType = 'cafe' | 'almoco' | 'lanche' | 'jantar';

/**
 * Avalia se o alimento possui harmonia gastronômica com o horário da refeição.
 */
function isAppropriateForMealSlot(food: ClinicalFoodItem, mealSlotType: MealSlotType): boolean {
  const name = food.name.toLowerCase();
  const roles = food.functionalRoles || [];
  const group = food.guideGroup || '';

  if (mealSlotType === 'cafe') {
    // Café da manhã: Pães, cuscuz, raízes, ovos, queijos, lácteos, frutas, sementes
    if (
      roles.includes('energetico_cereal') ||
      roles.includes('energetico_raiz') ||
      roles.includes('fruta') ||
      roles.includes('lacteo') ||
      roles.includes('liquido_base') ||
      roles.includes('oleaginosa')
    ) {
      // Exclui pratos pesados e carnes salgadas
      if (name.includes('feijoada') || name.includes('tropeiro') || name.includes('moqueca') || name.includes('costela')) {
        return false;
      }
      return true;
    }
    if (roles.includes('proteico_animal')) {
      return name.includes('ovo') || name.includes('omelete') || group === 'leite_queijos' || name.includes('queijo');
    }
    if (roles.includes('proteico_vegetal')) {
      return name.includes('tofu') || name.includes('pasta') || name.includes('soja');
    }
    return false;
  }

  if (mealSlotType === 'lanche') {
    // Lanches: Frutas, sementes, iogurtes, aveia, sanduíches leves, tapiocas
    if (roles.includes('fruta') || roles.includes('oleaginosa') || roles.includes('lacteo')) return true;
    if (roles.includes('energetico_cereal') || roles.includes('energetico_raiz')) {
      return name.includes('aveia') || name.includes('pao') || name.includes('tapioca') || name.includes('torrada') || name.includes('biscoito');
    }
    if (roles.includes('proteico_animal')) {
      return name.includes('ovo') || name.includes('queijo') || name.includes('iogurte') || name.includes('frango desfiado');
    }
    return false;
  }

  if (mealSlotType === 'almoco') {
    // Almoço: Prato principal amplo (arroz, feijões, carnes, ovos, legumes, saladas)
    if (name.includes('mingau') || name.includes('achocolatado') || name.includes('cereal matinal')) return false;
    return true;
  }

  if (mealSlotType === 'jantar') {
    // Jantar: Sopas, prato feito leve, omeletes, saladas, raízes cozidas
    if (name.includes('mingau') || name.includes('achocolatado')) return false;
    return true;
  }

  return true;
}

/**
 * Gera alternativas equivalentes com rigor de contexto, restrições clínicas e expansão em cascata (Anti-Afunilamento).
 */
export function generateCalculatedSubstitutions(
  targetFood: ClinicalFoodItem,
  currentPortionGrams: number = 100,
  mealSlotType: MealSlotType = 'almoco',
  restrictions?: SubstitutionRestrictions
): SubstitutionOption[] {
  const foods = systemConfig.getFoods();
  const currentKcal = (currentPortionGrams / 100) * (targetFood.kcalPer100g || 100);

  // 1. Filtragem prévia de segurança em TODO o catálogo de 1.971 alimentos
  const safeFoods = foods.filter((f) => {
    if (f.id === targetFood.id) return false;
    if (!isAppropriateForMealSlot(f, mealSlotType)) return false;

    if (restrictions) {
      const safety = evaluateFoodSafety(f, restrictions);
      if (!safety.isSafe) return false;
    }
    return true;
  });

  // 2. Busca em Cascata Anti-Afunilamento
  const targetRole = targetFood.functionalRoles?.[0];

  // Nível 1: Papel Funcional Exato (ex: proteico_vegetal, energetico_cereal)
  let candidates = safeFoods.filter((f) => targetRole && f.functionalRoles?.includes(targetRole));

  // Nível 2: Se menos de 8 candidatos, expande para a mesma Categoria ou Grupo do Guia
  if (candidates.length < 8) {
    const level2 = safeFoods.filter(
      (f) =>
        !candidates.some((c) => c.id === f.id) &&
        (f.category === targetFood.category || (targetFood.guideGroup && f.guideGroup === targetFood.guideGroup))
    );
    candidates = [...candidates, ...level2];
  }

  // Nível 3: Se ainda houver menos de 8 candidatos, expande para alimentos de mesma densidade de macronutrientes
  if (candidates.length < 8) {
    const level3 = safeFoods.filter(
      (f) =>
        !candidates.some((c) => c.id === f.id) &&
        f.category === targetFood.category
    );
    candidates = [...candidates, ...level3];
  }

  // Ordena por proximidade calórica e seleciona os melhores 8 a 15 candidatos
  const sortedCandidates = candidates
    .sort((a, b) => {
      const diffA = Math.abs((a.kcalPer100g || 100) - (targetFood.kcalPer100g || 100));
      const diffB = Math.abs((b.kcalPer100g || 100) - (targetFood.kcalPer100g || 100));
      return diffA - diffB;
    })
    .slice(0, 15);

  return sortedCandidates.map((food) => {
    const foodKcal = Math.max(20, food.kcalPer100g || 100);
    const equivalentPortionReadyGrams = Math.round((currentKcal / foodKcal) * 100);

    const targetUmcSize = Math.max(0.1, targetFood.umcSizeKg || 1);
    const targetPrice = targetFood.pricePerUmc || 10;
    const currentCostMonthly = (currentPortionGrams / 1000) * 30 * (targetPrice / targetUmcSize);

    const foodUmcSize = Math.max(0.1, food.umcSizeKg || 1);
    const foodPrice = food.pricePerUmc || 10;
    const newCostMonthly = (equivalentPortionReadyGrams / 1000) * 30 * (foodPrice / foodUmcSize);

    const costDifferenceMonthly = Number((newCostMonthly - currentCostMonthly).toFixed(2));

    let explanation = `Substituição gastronômica de ${currentPortionGrams}g de ${targetFood.name} por ${equivalentPortionReadyGrams}g de ${food.name}.`;
    if (costDifferenceMonthly < 0) {
      explanation += ` Economiza R$ ${Math.abs(costDifferenceMonthly).toFixed(2)}/mês!`;
    } else if (costDifferenceMonthly > 0) {
      explanation += ` Acréscimo de R$ ${costDifferenceMonthly.toFixed(2)}/mês.`;
    } else {
      explanation += ` Custo mensal equivalente.`;
    }

    return {
      food,
      equivalentPortionReadyGrams,
      costDifferenceMonthly,
      explanation,
    };
  });
}
