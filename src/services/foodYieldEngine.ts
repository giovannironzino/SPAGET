import { FoodState, FoodYieldProfile } from '../types/foodPredictor';

export interface FoodStateConversionRequest {
  quantity: number;
  fromState: FoodState;
  toState: FoodState;
  yieldProfile: FoodYieldProfile;
}

export function convertFoodState(request: FoodStateConversionRequest): number {
  const { quantity, fromState, toState, yieldProfile } = request;

  if (fromState === toState) return quantity;

  // Convert to intermediate 'gross_raw' step
  let grossRawQuantity = quantity;

  if (fromState === 'consumed') {
    const prepared = quantity * yieldProfile.cookedToPreparedRatio;
    const rawEdible = prepared * yieldProfile.preparedToRawEdibleRatio;
    grossRawQuantity = rawEdible * yieldProfile.rawEdibleToGrossRawRatio;
  } else if (fromState === 'prepared') {
    const rawEdible = quantity * yieldProfile.preparedToRawEdibleRatio;
    grossRawQuantity = rawEdible * yieldProfile.rawEdibleToGrossRawRatio;
  } else if (fromState === 'raw_edible') {
    grossRawQuantity = quantity * yieldProfile.rawEdibleToGrossRawRatio;
  }

  if (toState === 'gross_raw') {
    return Number(grossRawQuantity.toFixed(2));
  }

  // Inverse conversion if needed from gross_raw
  if (toState === 'consumed') {
    const rawEdible = grossRawQuantity / yieldProfile.rawEdibleToGrossRawRatio;
    const prepared = rawEdible / yieldProfile.preparedToRawEdibleRatio;
    return Number((prepared / yieldProfile.cookedToPreparedRatio).toFixed(2));
  }

  return Number(grossRawQuantity.toFixed(2));
}
