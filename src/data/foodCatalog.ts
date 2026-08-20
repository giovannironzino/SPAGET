import type { ClinicalFoodItem } from '../services/clinicalNutritionEngine';
import { systemConfig } from '../services/systemConfigService';
import canonicalIbgeFoods from './canonicalIbgeFoods.json';

export type { ClinicalFoodItem };

export type FoodCategoryGroup = 'protein' | 'grains' | 'carbs' | 'produce' | 'pantry';

export interface NeutralFoodItem {
  id: string;
  name: string;
  group: FoodCategoryGroup;
  defaultUnit: 'kg' | 'cartela' | 'litro' | 'pacote';
  estimatedKgPerUnit: number;
  defaultPricePerUnit: number;
  isCurrentSeason?: boolean;
  cropSeasonMonthName?: string;
}

/**
 * Dynamic getter to always fetch the latest foods from Management Center / Firebase / IBGE
 */
export function getDynamicFoodCatalog(): ClinicalFoodItem[] {
  const dynamicFoods = systemConfig.getFoods();
  if (dynamicFoods && dynamicFoods.length > 0) {
    return dynamicFoods;
  }
  return canonicalIbgeFoods as unknown as ClinicalFoodItem[];
}

// Exported for backward compatibility with pure deterministic solvers
export const CLINICAL_FOOD_CATALOG: ClinicalFoodItem[] = getDynamicFoodCatalog();

export const NEUTRAL_FOOD_CATALOG: NeutralFoodItem[] = CLINICAL_FOOD_CATALOG.map((item) => ({
  id: item.id,
  name: item.name,
  group: item.category,
  defaultUnit: 'kg',
  estimatedKgPerUnit: item.umcSizeKg || 1.0,
  defaultPricePerUnit: item.pricePerUmc || 10.0,
}));
