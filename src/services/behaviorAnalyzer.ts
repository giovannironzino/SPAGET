export type ShoppingLocation = 'supermarket' | 'farmersMarket' | 'bakery';

export interface BehavioralFoodItem {
  id: string;
  name: string;
  location: ShoppingLocation;
  weeklyQuantity: number;
  unit: 'kg' | 'pacote' | 'cartela' | 'litro' | 'unidade';
  estimatedPricePerUnit: number;
  estimatedKcalPerUnit: number;
}

export interface BehavioralAnalysisResult {
  householdCount: number;
  targetWeeklyKcal: number;
  selectedWeeklyKcal: number;
  coveragePercentage: number;
  coverageStatus: 'optimal' | 'underestimated' | 'overestimated';
  feedbackMessage: string;
  itemsByLocation: Record<ShoppingLocation, BehavioralFoodItem[]>;
  totalWeeklyCostBase: number;
  totalMonthlyCostBase: number;
  totalMonthlyWithSafetyMargin: number;
}

export const SHOPPING_LOCATIONS_INFO: Record<ShoppingLocation, { label: string; icon: string; description: string }> = {
  supermarket: {
    label: '🛒 Supermercado / Atacadista',
    icon: 'ShoppingBag',
    description: 'Mercearia de prateleira, grãos, óleos, congelados e produtos da cozinha.',
  },
  farmersMarket: {
    label: '🥬 Feira Livre / Sacolão / Açougue',
    icon: 'Store',
    description: 'Frutas, legumes, verduras de época e carnes frescas de açougue.',
  },
  bakery: {
    label: '🥖 Padaria & Laticínios Diários',
    icon: 'Coffee',
    description: 'Pão francês, leite fresco, queijos e conveniências diárias.',
  },
};

/**
 * Default fallback items organized by real shopping locations
 */
export const DEFAULT_BEHAVIORAL_ITEMS: BehavioralFoodItem[] = [
  // Supermercado
  { id: 'beh-sup-1', name: 'Arroz Branco / Integral (Pacote 5kg)', location: 'supermarket', weeklyQuantity: 1, unit: 'pacote', estimatedPricePerUnit: 29.90, estimatedKcalPerUnit: 18000 },
  { id: 'beh-sup-2', name: 'Feijão Carioca / Preto (Pacote 1kg)', location: 'supermarket', weeklyQuantity: 1, unit: 'pacote', estimatedPricePerUnit: 7.90, estimatedKcalPerUnit: 3400 },
  { id: 'beh-sup-3', name: 'Peito de Frango / Proteína de Prateleira (kg)', location: 'supermarket', weeklyQuantity: 2, unit: 'kg', estimatedPricePerUnit: 19.90, estimatedKcalPerUnit: 3300 },
  { id: 'beh-sup-4', name: 'Óleo de Soja / Azeite de Oliva (Unidade)', location: 'supermarket', weeklyQuantity: 1, unit: 'unidade', estimatedPricePerUnit: 7.50, estimatedKcalPerUnit: 8000 },
  { id: 'beh-sup-5', name: 'Macarrão / Aveia / Grãos (Pacote)', location: 'supermarket', weeklyQuantity: 2, unit: 'pacote', estimatedPricePerUnit: 5.50, estimatedKcalPerUnit: 3600 },

  // Feira Livre
  { id: 'beh-fair-1', name: 'Frutas da Estação (Banana, Laranja, Maçã - kg)', location: 'farmersMarket', weeklyQuantity: 3, unit: 'kg', estimatedPricePerUnit: 6.50, estimatedKcalPerUnit: 2700 },
  { id: 'beh-fair-2', name: 'Legumes & Verduras de Época (Batata, Tomate, Cenoura - kg)', location: 'farmersMarket', weeklyQuantity: 3, unit: 'kg', estimatedPricePerUnit: 5.80, estimatedKcalPerUnit: 1800 },
  { id: 'beh-fair-3', name: 'Ovos Caipiras / de Feira (Cartela 30un)', location: 'farmersMarket', weeklyQuantity: 1, unit: 'cartela', estimatedPricePerUnit: 21.00, estimatedKcalPerUnit: 2200 },
  { id: 'beh-fair-4', name: 'Carne Fresca de Açougue / Peixe (kg)', location: 'farmersMarket', weeklyQuantity: 1.5, unit: 'kg', estimatedPricePerUnit: 34.00, estimatedKcalPerUnit: 3100 },

  // Padaria
  { id: 'beh-bakery-1', name: 'Pão Francês de Padaria (kg)', location: 'bakery', weeklyQuantity: 1.5, unit: 'kg', estimatedPricePerUnit: 14.00, estimatedKcalPerUnit: 4000 },
  { id: 'beh-bakery-2', name: 'Leite UHT / Fresco (Litro)', location: 'bakery', weeklyQuantity: 4, unit: 'litro', estimatedPricePerUnit: 5.20, estimatedKcalPerUnit: 2400 },
  { id: 'beh-bakery-3', name: 'Café Torrado e Moído (Pacote 500g)', location: 'bakery', weeklyQuantity: 1, unit: 'pacote', estimatedPricePerUnit: 18.90, estimatedKcalPerUnit: 200 },
];

/**
 * Calculate energy balance analysis
 */
export function analyzeBehavioralEnergyBalance(
  householdCount: number,
  targetHouseholdDailyKcal: number,
  activeItems: BehavioralFoodItem[],
  safetyMarginPct: number = 15
): BehavioralAnalysisResult {
  const count = Math.max(1, householdCount);
  const targetWeeklyKcal = Math.round(targetHouseholdDailyKcal * 7);

  let selectedWeeklyKcal = 0;
  let totalWeeklyCostBase = 0;

  const itemsByLocation: Record<ShoppingLocation, BehavioralFoodItem[]> = {
    supermarket: [],
    farmersMarket: [],
    bakery: [],
  };

  activeItems.forEach((item) => {
    if (item.weeklyQuantity > 0) {
      itemsByLocation[item.location].push(item);
      selectedWeeklyKcal += item.weeklyQuantity * item.estimatedKcalPerUnit;
      totalWeeklyCostBase += item.weeklyQuantity * item.estimatedPricePerUnit;
    }
  });

  const coveragePercentage = targetWeeklyKcal > 0
    ? Math.round((selectedWeeklyKcal / targetWeeklyKcal) * 100)
    : 100;

  let coverageStatus: 'optimal' | 'underestimated' | 'overestimated' = 'optimal';
  let feedbackMessage = `Sua rotina declarada cobre ${coveragePercentage}% da necessidade energética da casa (${targetWeeklyKcal.toLocaleString('pt-BR')} kcal/semana). Excelente equilíbrio factual!`;

  if (coveragePercentage < 80) {
    coverageStatus = 'underestimated';
    feedbackMessage = `Atenção: A rotina declarada cobre apenas ${coveragePercentage}% da energia necessária para o seu domicílio (${targetWeeklyKcal.toLocaleString('pt-BR')} kcal/semana). Há risco de omitir compras diárias ou passar necessidade.`;
  } else if (coveragePercentage > 135) {
    coverageStatus = 'overestimated';
    feedbackMessage = `💡 A rotina declarada ultrapassa a necessidade energética factual da casa em ${coveragePercentage}%. Verifique se não há desperdício ou acúmulo de compras.`;
  }

  const totalMonthlyCostBase = Math.round(totalWeeklyCostBase * 4.33);
  const totalMonthlyWithSafetyMargin = Math.round(totalMonthlyCostBase * (1 + safetyMarginPct / 100));

  return {
    householdCount: count,
    targetWeeklyKcal,
    selectedWeeklyKcal: Math.round(selectedWeeklyKcal),
    coveragePercentage,
    coverageStatus,
    feedbackMessage,
    itemsByLocation,
    totalWeeklyCostBase: Math.round(totalWeeklyCostBase),
    totalMonthlyCostBase,
    totalMonthlyWithSafetyMargin,
  };
}
