export interface UserFoodPreferences {
  userId: string;
  dietaryStyle?: 'omnivore' | 'vegetarian' | 'vegan' | 'glutenFree' | 'lactoseFree';
  blacklistedFoods?: string[];
  allergies?: string[];
  clinicalConditions?: Array<'hipertensao' | 'diabetes_tipo2' | 'doenca_renal'>;
  favoriteArchetypeIds?: string[];
  hiddenArchetypeIds?: string[];
  customCalorieTarget?: number;
  updatedAt: string;
}

export interface UserProfileData {
  uid: string;
  email?: string;
  role: 'user' | 'admin';
  updatedAt: string;
}
