import { ClinicalFoodItem } from '../services/clinicalNutritionEngine';

export type AllergenType =
  | 'leite'
  | 'ovos'
  | 'soja'
  | 'trigo_gluten'
  | 'amendoim'
  | 'castanhas_nozes'
  | 'peixes'
  | 'crustaceos';

export type ClinicalCondition = 'hipertensao' | 'diabetes_tipo2' | 'doenca_renal';

export interface AllergenRule {
  id: AllergenType;
  label: string;
  guideGroupsExcluded?: string[];
  keywords: string[];
}

export const ALLERGEN_TAXONOMY: Record<AllergenType, AllergenRule> = {
  leite: {
    id: 'leite',
    label: 'Leite e Derivados (Lactose / Caseína)',
    guideGroupsExcluded: ['leite_queijos'],
    keywords: ['leite', 'queijo', 'iogurte', 'manteiga', 'requeijao', 'coalhada', 'nata', 'ricota'],
  },
  ovos: {
    id: 'ovos',
    label: 'Ovos e Derivados',
    keywords: ['ovo', 'gema', 'clara', 'omelete'],
  },
  soja: {
    id: 'soja',
    label: 'Soja e Derivados',
    keywords: ['soja', 'tofu', 'shoyu', 'edamame'],
  },
  trigo_gluten: {
    id: 'trigo_gluten',
    label: 'Trigo / Centeio / Cevada (Glúten)',
    keywords: ['trigo', 'pao frances', 'macarrao tradicional', 'farinha de trigo', 'biscoito', 'torrada tradicional', 'centeio', 'cevada'],
  },
  amendoim: {
    id: 'amendoim',
    label: 'Amendoim e Derivados',
    keywords: ['amendoim', 'pasta de amendoim', 'pacoca'],
  },
  castanhas_nozes: {
    id: 'castanhas_nozes',
    label: 'Castanhas, Nozes e Amêndoas',
    guideGroupsExcluded: ['castanhas_nozes'],
    keywords: ['castanha', 'noz', 'amendoa', 'avela', 'macadamia', 'pistache'],
  },
  peixes: {
    id: 'peixes',
    label: 'Peixes e Pescados',
    keywords: ['peixe', 'tilapia', 'sardinha', 'salmao', 'bacalhau', 'atum', 'merluza', 'pescada', 'corvina'],
  },
  crustaceos: {
    id: 'crustaceos',
    label: 'Crustáceos e Frutos do Mar',
    keywords: ['camarao', 'caranguejo', 'siri', 'lagosta', 'lula', 'polvo', 'marisco'],
  },
};

/**
 * Avalia se um alimento é incompatível com as condições clínicas e alergias do usuário.
 */
export function evaluateFoodSafety(
  food: ClinicalFoodItem,
  options: {
    allergies?: string[];
    blacklistedIds?: string[];
    blacklistedNames?: string[];
    dietaryStyle?: string;
    clinicalConditions?: ClinicalCondition[];
  }
): { isSafe: boolean; reason?: string } {
  const foodName = food.name.toLowerCase();
  const foodId = food.id;
  const guideGroup = food.guideGroup || '';

  // 1. Blacklist direta de Ids e Nomes
  if (options.blacklistedIds && options.blacklistedIds.includes(foodId)) {
    return { isSafe: false, reason: 'Alimento excluído diretamente pelo usuário' };
  }
  if (options.blacklistedNames && options.blacklistedNames.some((b) => foodName.includes(b.toLowerCase().trim()))) {
    return { isSafe: false, reason: 'Alimento excluído diretamente pelo usuário' };
  }

  // 2. Estilo Alimentar Estrito
  const isVegan = options.dietaryStyle === 'vegan';
  const isVeg = options.dietaryStyle === 'vegetarian' || isVegan;
  const isGlutenFree = options.dietaryStyle === 'glutenFree';
  const isLactoseFree = options.dietaryStyle === 'lactoseFree';

  if (isVegan) {
    if (guideGroup === 'carnes_ovos' || guideGroup === 'leite_queijos') {
      return { isSafe: false, reason: 'Restrição de estilo Vegano (origem animal)' };
    }
    if (food.functionalRoles?.includes('proteico_animal') || foodName.includes('ovo') || foodName.includes('queijo') || foodName.includes('leite') || foodName.includes('carne') || foodName.includes('frango') || foodName.includes('peixe')) {
      return { isSafe: false, reason: 'Restrição de estilo Vegano' };
    }
  } else if (isVeg) {
    if (guideGroup === 'carnes_ovos' && !foodName.includes('ovo')) {
      return { isSafe: false, reason: 'Restrição de estilo Vegetariano (sem carnes)' };
    }
    if (foodName.includes('carne') || foodName.includes('frango') || foodName.includes('bovino') || foodName.includes('suino') || foodName.includes('peixe') || foodName.includes('tilapia') || foodName.includes('sardinha')) {
      return { isSafe: false, reason: 'Restrição de estilo Vegetariano' };
    }
  }

  if (isGlutenFree) {
    if (ALLERGEN_TAXONOMY.trigo_gluten.keywords.some((k) => foodName.includes(k))) {
      return { isSafe: false, reason: 'Contém Glúten' };
    }
  }

  if (isLactoseFree) {
    if (guideGroup === 'leite_queijos' || ALLERGEN_TAXONOMY.leite.keywords.some((k) => foodName.includes(k))) {
      return { isSafe: false, reason: 'Contém Lactose' };
    }
  }

  // 3. Alérgenos Oficiais
  if (options.allergies && options.allergies.length > 0) {
    for (const allergy of options.allergies) {
      const lowerAllergy = allergy.toLowerCase().trim();
      for (const key of Object.keys(ALLERGEN_TAXONOMY) as AllergenType[]) {
        const rule = ALLERGEN_TAXONOMY[key];
        if (rule.keywords.some((k) => lowerAllergy.includes(k) || k.includes(lowerAllergy)) || rule.label.toLowerCase().includes(lowerAllergy)) {
          if (rule.guideGroupsExcluded && rule.guideGroupsExcluded.includes(guideGroup)) {
            return { isSafe: false, reason: `Incompatível com alergia diagnosticada: ${rule.label}` };
          }
          if (rule.keywords.some((k) => foodName.includes(k))) {
            return { isSafe: false, reason: `Incompatível com alergia diagnosticada: ${rule.label}` };
          }
        }
      }
      if (foodName.includes(lowerAllergy)) {
        return { isSafe: false, reason: `Alergia cadastrada: ${allergy}` };
      }
    }
  }

  // 4. Condições Clínicas
  if (options.clinicalConditions && options.clinicalConditions.length > 0) {
    for (const condition of options.clinicalConditions) {
      if (condition === 'hipertensao') {
        // Exclui embutidos, conservas hipersódicas, charque, queijos muito salgados
        if (
          foodName.includes('salame') ||
          foodName.includes('linguica') ||
          foodName.includes('salsicha') ||
          foodName.includes('presunto') ||
          foodName.includes('bacon') ||
          foodName.includes('charque') ||
          foodName.includes('carne seca') ||
          food.novaGroup === 'ultraprocessed'
        ) {
          return { isSafe: false, reason: 'Incompatível com Hipertensão (alto teor de sódio)' };
        }
      } else if (condition === 'diabetes_tipo2') {
        // Exclui doces concentrados, refrigerantes, xaropes e produtos ultra refinados
        if (
          foodName.includes('acucar') ||
          foodName.includes('refrigerante') ||
          foodName.includes('doce de') ||
          foodName.includes('chocolate ao leite') ||
          foodName.includes('achocolatado') ||
          food.novaGroup === 'ultraprocessed'
        ) {
          return { isSafe: false, reason: 'Incompatível com Diabetes Tipo 2 (açúcares de rápida absorção)' };
        }
      } else if (condition === 'doenca_renal') {
        // Exclui carambola (neurotoxina caramboxina) e ultraprocessados fosfatados
        if (foodName.includes('carambola') || foodName.includes('embutido') || food.novaGroup === 'ultraprocessed') {
          return { isSafe: false, reason: 'Incompatível com Doença Renal (segurança nefroprotetora)' };
        }
      }
    }
  }

  return { isSafe: true };
}
