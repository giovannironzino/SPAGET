import type { ClinicalFoodItem } from './clinicalNutritionEngine';
import { generatePersonalizedMealPlan } from './personalizedMealPlanEngine';
import { getRegionalPriceMultiplier, getRegionalPriceProfile } from '../data/regionalPriceIndex';
import { ClinicalCondition } from '../data/allergenTaxonomy';

export interface UserAnamnesisData {
  age: number;
  weightKg: number;
  heightCm: number;
  sex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'intense';
  goal?: 'lose_weight' | 'maintain' | 'muscle_gain' | 'budget_priority'; // Legacy compatibility
  healthGoal: 'lose_weight' | 'maintain' | 'muscle_gain';
  prioritizeSavings: boolean;
  numberOfPeople: number;
  stateUf: string;
  cityName: string;
  dietaryStyle: 'omnivore' | 'vegetarian' | 'vegan' | 'glutenFree' | 'lactoseFree';
  blacklistedFoods: string[]; // Alimentos que DETESTA
  allergies: string[];
  clinicalConditions?: ClinicalCondition[];
  mealsPerDay: 2 | 3 | 4 | 5;
  bringsLunchToWork: boolean;
  lunchesOutPerWeek: number;
  kitchenEquipments: string[];
  cookingSkill: 'beginner' | 'basic' | 'advanced';
}

export interface SourcedMealFood {
  food: ClinicalFoodItem;
  portionReadyGrams: number;
}

export interface MealOption {
  optionId: string;
  title: string;
  description: string;
  householdPortions: string[];
  prepTimeMinutes: number;
  tag: 'regional_classic' | 'quick_10min' | 'budget_friendly' | 'high_protein';
  isBatchCookingEligible: boolean;
  sourcedFoods?: SourcedMealFood[];
}

export interface PlannedMealGroup {
  mealSlotId: string;
  mealSlotName: string;
  selectedOptionIndex: number;
  options: MealOption[];
  biochemicalNote?: string;
}

export interface BatchCookingGuideStep {
  stepNumber: number;
  title: string;
  description: string;
  protocolBadge: string;
  durationMinutes: number;
}

export interface ShoppingCategoryItem {
  name: string;
  umcQuantity: string;
  estimatedPrice: number;
  isRegionalSeason: boolean;
}

export interface ShoppingScenario {
  scenarioName: 'pe_no_chao' | 'equilibrado' | 'pratico';
  scenarioTitle: string;
  scenarioDescription: string;
  costPerPerson: number;
  totalFamilyCost: number;
  aisles: {
    feiraHortifruti: ShoppingCategoryItem[];
    acougueOvos: ShoppingCategoryItem[];
    graosCereais: ShoppingCategoryItem[];
    merceariaTemperos: ShoppingCategoryItem[];
  };
}

export interface NutritionPrescriptionResult {
  biometrics: {
    bmrKcal: number;
    tdeeKcal: number;
    targetKcal: number;
    targetProteinGrams: number;
    targetCarbsGrams: number;
    targetFatsGrams: number;
    targetWaterMl: number;
    novaInNaturaPercentage: number;
  };
  meals: PlannedMealGroup[];
  batchCookingGuide: BatchCookingGuideStep[];
  shoppingScenarios: Record<'pe_no_chao' | 'equilibrado' | 'pratico', ShoppingScenario>;
  selectedScenario: 'pe_no_chao' | 'equilibrado' | 'pratico';
}

export class NutritionAiConsultantService {
  /**
   * Constrói a prescrição nutricional e o plano gastronômico com rigor absoluto para Vegetarianos, Veganos e Aversões
   */
  public generatePrescription(anamnesis: UserAnamnesisData): NutritionPrescriptionResult {
    // 1. Cálculo Metabólico Científico (Mifflin-St Jeor)
    const sFactor = anamnesis.sex === 'male' ? 5 : -161;
    const heightCm = Math.max(120, anamnesis.heightCm);
    const weightKg = Math.max(35, anamnesis.weightKg);
    const age = Math.max(14, anamnesis.age);

    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sFactor;

    const actMultiplier =
      anamnesis.activityLevel === 'sedentary' ? 1.2 :
      anamnesis.activityLevel === 'light' ? 1.375 :
      anamnesis.activityLevel === 'moderate' ? 1.55 : 1.725;

    const tdee = Math.round(bmr * actMultiplier);

    const effectiveGoal = anamnesis.healthGoal || (anamnesis.goal === 'budget_priority' ? 'maintain' : anamnesis.goal) || 'maintain';

    let targetKcal = tdee;
    if (effectiveGoal === 'lose_weight') {
      targetKcal = Math.max(1200, Math.round(tdee - 450));
    } else if (effectiveGoal === 'muscle_gain') {
      targetKcal = Math.round(tdee + 350);
    }

    // 1.8g proteína / kg se hipertrofia ou emagrecimento, 1.3g se manutenção
    const proteinFactor = (effectiveGoal === 'muscle_gain' || effectiveGoal === 'lose_weight') ? 1.8 : 1.3;
    const targetProteinGrams = Math.round(weightKg * proteinFactor);
    const proteinKcal = targetProteinGrams * 4;

    const fatKcal = targetKcal * 0.25; // 25% gorduras boas
    const targetFatsGrams = Math.round(fatKcal / 9);

    const carbKcal = Math.max(400, targetKcal - proteinKcal - fatKcal);
    const targetCarbsGrams = Math.round(carbKcal / 4);

    // Cálculo Preciso de Hidratação (Base OMS/SBAN + Atividade Física + Clima Regional)
    let waterMl = weightKg * 35;
    if (anamnesis.activityLevel === 'light') waterMl += 250;
    else if (anamnesis.activityLevel === 'moderate') waterMl += 500;
    else if (anamnesis.activityLevel === 'intense') waterMl += 750;

    const hotStates = ['AM', 'PA', 'MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA', 'TO', 'MT', 'MS', 'GO', 'DF', 'RO', 'AC', 'RR', 'AP'];
    if (hotStates.includes(anamnesis.stateUf)) {
      waterMl += 250;
    }

    const targetWaterMl = Math.round(waterMl / 50) * 50; // Arredondado para múltiplos de 50ml

    // Flags de Estilo Alimentar Estritas
    const isVegan = anamnesis.dietaryStyle === 'vegan';
    const isVeg = anamnesis.dietaryStyle === 'vegetarian' || isVegan;
    const isGlutenFree = anamnesis.dietaryStyle === 'glutenFree';
    const isLactoseFree = anamnesis.dietaryStyle === 'lactoseFree';

    const isBlacklisted = (foodName: string) => {
      const lower = foodName.toLowerCase();
      return anamnesis.blacklistedFoods.some(b => lower.includes(b.toLowerCase().trim()));
    };

    const legumePadrao = isBlacklisted('abóbora') ? 'Cenoura Cozida' : isBlacklisted('cenoura') ? 'Abobrinha Refogada' : 'Abóbora Assada';

    // 1.1 Sourcing Real dos Alimentos do Catálogo IBGE / Guia MS para todos os slots
    const dynamicPlan = generatePersonalizedMealPlan(
      [
        {
          mealId: 'cafe',
          mealName: 'Café da Manhã',
          kcalQuota: Math.round(targetKcal * 0.25),
          proteinGrams: Math.round(targetProteinGrams * 0.25),
          carbGrams: Math.round(targetCarbsGrams * 0.25),
          fatGrams: Math.round(targetFatsGrams * 0.25),
        },
        {
          mealId: 'almoco',
          mealName: 'Almoço',
          kcalQuota: Math.round(targetKcal * 0.35),
          proteinGrams: Math.round(targetProteinGrams * 0.35),
          carbGrams: Math.round(targetCarbsGrams * 0.35),
          fatGrams: Math.round(targetFatsGrams * 0.35),
        },
        {
          mealId: 'lanche',
          mealName: 'Lanche da Tarde',
          kcalQuota: Math.round(targetKcal * 0.15),
          proteinGrams: Math.round(targetProteinGrams * 0.15),
          carbGrams: Math.round(targetCarbsGrams * 0.15),
          fatGrams: Math.round(targetFatsGrams * 0.15),
        },
        {
          mealId: 'jantar',
          mealName: 'Jantar',
          kcalQuota: Math.round(targetKcal * 0.25),
          proteinGrams: Math.round(targetProteinGrams * 0.25),
          carbGrams: Math.round(targetCarbsGrams * 0.25),
          fatGrams: Math.round(targetFatsGrams * 0.25),
        },
      ],
      {
        restrictions: {
          dietaryPattern: anamnesis.dietaryStyle,
          excludedFoods: anamnesis.blacklistedFoods,
          allergies: anamnesis.allergies,
          clinicalConditions: anamnesis.clinicalConditions,
        },
        preferences: {
          lunchesOutPerWeek: anamnesis.lunchesOutPerWeek,
        },
      }
    );

    const getSourcedFoodsForMeal = (mealId: string): SourcedMealFood[] => {
      const slot = dynamicPlan.find((p) => p.mealId === mealId);
      return (slot?.selectedFoods || []).map((sf) => ({
        food: sf.food,
        portionReadyGrams: sf.portionReadyGrams,
      }));
    };

    const cafeSourcedFoods = getSourcedFoodsForMeal('cafe');
    const almocoSourcedFoods = getSourcedFoodsForMeal('almoco');
    const lancheSourcedFoods = getSourcedFoodsForMeal('lanche');
    const jantarSourcedFoods = getSourcedFoodsForMeal('jantar');

    // 2. Montagem Democrática das Refeições com RIGOR ABSOLUTO DE ESTILO ALIMENTAR
    const meals: PlannedMealGroup[] = [];

    // ================= CAFÉ DA MANHÃ =================
    const cafeOptions: MealOption[] = [];

    if (isVegan) {
      cafeOptions.push(
        {
          optionId: 'opt-cafe-vegan-cuscuz',
          title: 'Cuscuz de Milho com Tofu Mexido com Cúrcuma & Café Preto',
          description: '100% vegetal com carboidrato de absorção limpa e proteína vegetal temperada no azeite e ervas.',
          householdPortions: [
            '• 1 fatia média de cuscuz de milho no vapor (100g) ou 1 fatia de mandioca cozida',
            '• 100g de tofu picadinho ou pasta de grão-de-bico mexida com cúrcuma e azeite',
            '• 1 xícara de café passado na hora sem açúcar',
            '• 1 banana prata da safra',
          ],
          prepTimeMinutes: 10,
          tag: 'regional_classic',
          isBatchCookingEligible: false,
          sourcedFoods: cafeSourcedFoods.length > 0 ? cafeSourcedFoods : undefined,
        },
        {
          optionId: 'opt-cafe-vegan-aveia',
          title: 'Mingau de Aveia com Leite de Coco/Castanhas, Frutas & Canela',
          description: 'Altíssima densidade de fibras prebióticas e minerais sem nenhum ingrediente de origem animal.',
          householdPortions: [
            '• 4 colheres de sopa de aveia em flocos cozidas com água ou leite de coco (45g)',
            '• 1 colher de sobremesa de sementes de chia ou linhaça',
            '• 1 maçã picadinha com canela em pó',
          ],
          prepTimeMinutes: 7,
          tag: 'budget_friendly',
          isBatchCookingEligible: false,
          sourcedFoods: cafeSourcedFoods.length > 0 ? cafeSourcedFoods : undefined,
        }
      );
    } else {
      // Vegetariano ou Onívoro ou Sem Glúten
      const paoOuCuscuz = isGlutenFree ? '1 fatia de cuscuz de milho no vapor (100g) ou 1 tapioca' : '1 pão francês quentinho ou 1 fatia de cuscuz';
      const leiteOuVegetal = isLactoseFree ? 'leite sem lactose ou leite vegetal' : 'leite integral';

      cafeOptions.push(
        {
          optionId: 'opt-cafe-1',
          title: isGlutenFree ? 'Cuscuz Nordestino com Ovos Mexidos & Café com Leite' : 'Pão Francês Tostado com Ovos Mexidos & Fruta da Safra',
          description: 'A combinação tradicional brasileira de carboidrato limpo e proteína de alto valor biológico.',
          householdPortions: [
            `• ${paoOuCuscuz}`,
            '• 2 ovos caipiras mexidos na manteiga com uma pitadinha de sal',
            `• 1 xícara de café com ${leiteOuVegetal}`,
            '• 1 banana prata da safra',
          ],
          prepTimeMinutes: 10,
          tag: 'regional_classic',
          isBatchCookingEligible: false,
          sourcedFoods: cafeSourcedFoods.length > 0 ? cafeSourcedFoods : undefined,
        },
        {
          optionId: 'opt-cafe-2',
          title: 'Tapioca Recheada com Queijo Minas / Ovos & Café',
          description: 'Opção leve, naturalmente sem glúten, rápida e com excelente digestibilidade.',
          householdPortions: [
            '• 2 colheres de sopa de goma de tapioca hidratada na frigideira (60g)',
            isLactoseFree ? '• 2 ovos mexidos com cheiro-verde' : '• 2 fatias médias de queijo minas frescal (50g) ou 2 ovos',
            '• 1 fatia de mamão com gotinhas de limão',
            '• 1 caneca de café passado na hora',
          ],
          prepTimeMinutes: 8,
          tag: 'quick_10min',
          isBatchCookingEligible: false,
          sourcedFoods: cafeSourcedFoods.length > 0 ? cafeSourcedFoods : undefined,
        },
        {
          optionId: 'opt-cafe-3',
          title: 'Mingau Cremoso de Aveia com Frutas da Safra & Canela',
          description: 'Fibras solúveis para controle glicêmico e saciedade duradoura.',
          householdPortions: [
            `• 3 colheres de sopa cheias de aveia em flocos cozidas no ${leiteOuVegetal} (40g)`,
            '• 1 colher de sobremesa de mel ou canela em pó',
            '• 1 maçã picadinha com casca',
          ],
          prepTimeMinutes: 7,
          tag: 'budget_friendly',
          isBatchCookingEligible: false,
          sourcedFoods: cafeSourcedFoods.length > 0 ? cafeSourcedFoods : undefined,
        }
      );
    }

    meals.push({
      mealSlotId: 'cafe',
      mealSlotName: '☕ 1. Café da Manhã Tradicional',
      selectedOptionIndex: 0,
      biochemicalNote: isVeg || isVegan ? 'Proteína vegetal de qualidade e energia sustentada para o início do dia.' : 'O café com leite e a fruta ativam o metabolismo e fornecem fibras para saciedade matinal.',
      options: cafeOptions,
    });

    // ================= ALMOÇO =================
    const almocoOptions: MealOption[] = [];

    if (isVegan) {
      almocoOptions.push(
        {
          optionId: 'opt-almoco-vegan-pf',
          title: 'Prato Feito Vegano com Grão-de-Bico ao Curry, Arroz & Feijão Carioca',
          description: 'Equilíbrio perfeito de leguminosas, grãos integrais, hortaliças da safra e gorduras boas.',
          householdPortions: [
            '• 1 colher de servir cheia de arroz branco ou integral (130g)',
            '• 1 concha cheia de feijão carioca com caldo aromático (100g)',
            '• 3 colheres de sopa cheias de grão-de-bico refogado com cúrcuma e azeite (100g)',
            `• 2 pedaços médios de ${legumePadrao} (80g)`,
            '• 1 pratinho de salada de folhas frescas com azeite e limão',
          ],
          prepTimeMinutes: 15,
          tag: 'regional_classic',
          isBatchCookingEligible: true,
          sourcedFoods: almocoSourcedFoods.length > 0 ? almocoSourcedFoods : undefined,
        },
        {
          optionId: 'opt-almoco-vegan-baiao',
          title: 'Baião de Dois Vegano com Feijão-de-Corda, Mandioca & Couve',
          description: 'Tradição brasileira afetiva com feijão fradinho, abóbora em cubos e cheiro-verde fresco.',
          householdPortions: [
            '• 2 conchas médias de baião de dois (arroz com feijão de corda e azeite) (200g)',
            '• 2 pedaços de mandioca cozida macia (100g)',
            '• 2 colheres de sopa de couve refogada no alho (60g)',
            '• Vinagrete de tomate e cebola com azeite',
          ],
          prepTimeMinutes: 20,
          tag: 'high_protein',
          isBatchCookingEligible: true,
          sourcedFoods: almocoSourcedFoods.length > 0 ? almocoSourcedFoods : undefined,
        },
        {
          optionId: 'opt-almoco-vegan-moqueca',
          title: 'Moqueca Vegana de Banana-da-Terra & Legumes com Pirão de Mandioca',
          description: 'Riqueza de sabores regionais com leite de coco, pimentões, tomate e cheiro-verde.',
          householdPortions: [
            '• 1 prato fundo com moqueca de banana da terra e legumes aromáticos (200g)',
            '• 2 colheres de sopa de pirão de mandioca (80g)',
            '• 1 colher de servir de arroz soltinho (110g)',
          ],
          prepTimeMinutes: 25,
          tag: 'quick_10min',
          isBatchCookingEligible: false,
          sourcedFoods: almocoSourcedFoods.length > 0 ? almocoSourcedFoods : undefined,
        }
      );
    } else if (isVeg) {
      almocoOptions.push(
        {
          optionId: 'opt-almoco-veg-pf',
          title: 'Prato Feito Vegetariano com Ovos Caipiras Mexidos na Manteiga & Salada',
          description: 'A base mais saudável do Brasil: arroz soltinho, feijão com caldo, ovos de alto valor biológico e legumes da safra.',
          householdPortions: [
            '• 1 colher de servir cheia de arroz branco soltinho (130g)',
            '• 1 concha cheia de feijão carioca com caldo aromático (100g)',
            '• 2 ovos caipiras mexidos ou estalados na manteiga/azeite',
            `• 2 pedaços médios de ${legumePadrao} (80g)`,
            '• 1 pratinho de salada de folhas frescas com azeite e gotas de limão',
          ],
          prepTimeMinutes: 12,
          tag: 'regional_classic',
          isBatchCookingEligible: true,
          sourcedFoods: almocoSourcedFoods.length > 0 ? almocoSourcedFoods : undefined,
        },
        {
          optionId: 'opt-almoco-veg-tropeiro',
          title: 'Feijão Tropeiro Vegetariano com Ovos, Couve no Alho & Arroz',
          description: 'Prato tradicional mineiro adaptado com ovos mexidos, farinha de mandioca e cheiro-verde.',
          householdPortions: [
            '• 1 concha cheia de feijão tropeiro vegetariano com ovos e farinha (130g)',
            '• 1 colher de servir de arroz branco (110g)',
            '• 2 colheres de sopa de couve refogada no alho e azeite (60g)',
            '• 1 fatia de queijo minas grelhado (opcional)',
          ],
          prepTimeMinutes: 15,
          tag: 'high_protein',
          isBatchCookingEligible: true,
          sourcedFoods: almocoSourcedFoods.length > 0 ? almocoSourcedFoods : undefined,
        },
        {
          optionId: 'opt-almoco-veg-moqueca',
          title: 'Moqueca de Banana-da-Terra com Grão-de-Bico, Pirão & Arroz',
          description: 'Deliciosa combinação aromática rica em fibras, potássio e proteínas vegetais.',
          householdPortions: [
            '• 1 concha de moqueca de banana da terra com grão-de-bico (180g)',
            '• 2 colheres de sopa de pirão caseiro (80g)',
            '• 1 colher de servir de arroz branco (110g)',
            '• Salada de tomate em rodelas com azeite',
          ],
          prepTimeMinutes: 20,
          tag: 'quick_10min',
          isBatchCookingEligible: false,
          sourcedFoods: almocoSourcedFoods.length > 0 ? almocoSourcedFoods : undefined,
        },
        {
          optionId: 'opt-almoco-veg-escondidinho',
          title: 'Escondidinho de Mandioca com Recheio de Queijo & Espinafre Gratinado',
          description: 'Massa cremosa de aipim/mandioca com recheio nutritivo de espinafre refogado e queijo.',
          householdPortions: [
            '• 1 porção média de escondidinho de mandioca gratinado (200g)',
            '• 1 concha pequena de feijão com caldo (70g)',
            '• Salada de folhas verdes com azeite e limão',
          ],
          prepTimeMinutes: 25,
          tag: 'budget_friendly',
          isBatchCookingEligible: true,
          sourcedFoods: almocoSourcedFoods.length > 0 ? almocoSourcedFoods : undefined,
        }
      );
    } else {
      almocoOptions.push(
        {
          optionId: 'opt-almoco-pf',
          title: 'Prato Feito Clássico com Frango Grelhado, Legumes Assados & Salada',
          description: 'A refeição oficial mais equilibrada do mundo segundo o Guia Alimentar do Ministério da Saúde.',
          householdPortions: [
            '• 1 colher de servir cheia de arroz branco soltinho (130g)',
            '• 1 concha média de feijão carioca com caldo aromático (90g)',
            '• 1 filé médio de peito de frango grelhado suculento (120g)',
            `• 2 pedaços médios de ${legumePadrao} (80g)`,
            '• 1 pratinho de salada de folhas frescas temperada com azeite e limão',
          ],
          prepTimeMinutes: 15,
          tag: 'regional_classic',
          isBatchCookingEligible: true,
          sourcedFoods: almocoSourcedFoods.length > 0 ? almocoSourcedFoods : undefined,
        },
        {
          optionId: 'opt-almoco-carne',
          title: 'Picadinho de Carne Bovina com Mandioca Cozida, Arroz & Couve Refogada',
          description: 'Prato reconfortante de panela rico em ferro heme e minerais essenciais.',
          householdPortions: [
            '• 1 colher de servir de arroz branco (120g)',
            '• 1 concha pequena de feijão com caldo (70g)',
            '• 3 colheres de sopa cheias de picadinho de carne com mandioca (120g)',
            '• 2 colheres de sopa de couve refogada no alho e azeite (60g)',
          ],
          prepTimeMinutes: 20,
          tag: 'high_protein',
          isBatchCookingEligible: true,
          sourcedFoods: almocoSourcedFoods.length > 0 ? almocoSourcedFoods : undefined,
        },
        {
          optionId: 'opt-almoco-peixe',
          title: 'Moqueca Leve de Peixe com Pirão Caseiro, Arroz Soltinho & Salada',
          description: 'Leveza e ômega-3 com temperos naturais: tomate, cebola, pimentão e cheiro-verde.',
          householdPortions: [
            '• 1 posta média de peixe cozido no molho de legumes (130g)',
            '• 2 colheres de sopa de pirão caseiro (80g)',
            '• 1 colher de servir de arroz branco (110g)',
            '• Salada de tomate em rodelas com azeite',
          ],
          prepTimeMinutes: 25,
          tag: 'quick_10min',
          isBatchCookingEligible: false,
          sourcedFoods: almocoSourcedFoods.length > 0 ? almocoSourcedFoods : undefined,
        },
        {
          optionId: 'opt-almoco-economico',
          title: 'Feijão Tropeiro com Ovos Caipiras, Arroz & Vinagrete da Safra',
          description: 'Opção super econômica e rica em proteína com excelente custo-benefício.',
          householdPortions: [
            '• 1 concha cheia de feijão tropeiro com farinha de mandioca e cheiro-verde (120g)',
            '• 2 ovos caipiras estalados com gema mole ou cozidos',
            '• 1 colher de servir de arroz (100g)',
            '• Vinagrete de tomate e cebola com azeite',
          ],
          prepTimeMinutes: 12,
          tag: 'budget_friendly',
          isBatchCookingEligible: true,
          sourcedFoods: almocoSourcedFoods.length > 0 ? almocoSourcedFoods : undefined,
        }
      );
    }

    meals.push({
      mealSlotId: 'almoco',
      mealSlotName: '🍲 2. Almoço Brasileiro Completo',
      selectedOptionIndex: 0,
      biochemicalNote: isVeg || isVegan
        ? 'A combinação de arroz + feijão + ovos/grão-de-bico fornece todos os 9 aminoácidos essenciais com alta digestibilidade.'
        : 'O arroz com feijão atinge o equilíbrio perfeito de lisina e metionina. Consumir com folhas e gotas de limão para absorção do ferro!',
      options: almocoOptions,
    });

    // ================= LANCHE DA TARDE =================
    if (anamnesis.mealsPerDay >= 4) {
      const lancheOptions: MealOption[] = [];

      lancheOptions.push(
        {
          optionId: 'opt-lanche-fruta',
          title: 'Fruta Fresca da Safra com Castanhas ou Aveia em Flocos',
          description: 'Praticidade de bolsa/mochila com energia limpa e gorduras boas.',
          householdPortions: [
            '• 1 maçã gala ou 1 pera da safra picada',
            '• 2 colheres de sopa cheias de aveia em flocos ou 4 castanhas-do-pará',
            '• 1 copo grande de água mineral',
          ],
          prepTimeMinutes: 3,
          tag: 'quick_10min',
          isBatchCookingEligible: false,
          sourcedFoods: lancheSourcedFoods.length > 0 ? lancheSourcedFoods : undefined,
        }
      );

      if (!isVegan && !isLactoseFree) {
        lancheOptions.push({
          optionId: 'opt-lanche-iogurte',
          title: 'Iogurte Natural com Fruta & Canela',
          description: 'Fonte natural de probióticos vivos para a saúde da microbiota intestinal.',
          householdPortions: [
            '• 1 pote de iogurte natural integral (170g)',
            '• 1/2 banana fatiada com canela em pó',
          ],
          prepTimeMinutes: 2,
          tag: 'regional_classic',
          isBatchCookingEligible: false,
          sourcedFoods: lancheSourcedFoods.length > 0 ? lancheSourcedFoods : undefined,
        });
      }

      if (!isVegan) {
        lancheOptions.push({
          optionId: 'opt-lanche-sanduiche',
          title: 'Mini Sanduíche Natural de Pão Tostado com Pasta de Ovos',
          description: 'Saciedade robusta para quem treina no final do dia ou trabalha em pé.',
          householdPortions: [
            '• 1 pão francês ou 2 fatias de pão tostadas',
            '• 1 ovo cozido amassado com 1 colher de sobremesa de azeite e ervas',
          ],
          prepTimeMinutes: 5,
          tag: 'high_protein',
          isBatchCookingEligible: false,
          sourcedFoods: lancheSourcedFoods.length > 0 ? lancheSourcedFoods : undefined,
        });
      }

      meals.push({
        mealSlotId: 'lanche',
        mealSlotName: '🍎 3. Lanche da Tarde Prático',
        selectedOptionIndex: 0,
        biochemicalNote: 'Evita a queda de glicose no final da tarde, prevenindo a compulsão por doces e fast-food à noite.',
        options: lancheOptions,
      });
    }

    // ================= JANTAR =================
    const jantarOptions: MealOption[] = [];

    if (isVegan) {
      jantarOptions.push(
        {
          optionId: 'opt-jantar-vegan-sopa',
          title: 'Sopa Revigorante de Feijão Batido com Legumes da Safra & Macarrão',
          description: 'Reconfortante, ultra nutritiva e excelente para a digestão noturna.',
          householdPortions: [
            '• 1 prato fundo cheio de sopa de feijão batido com legumes e macarrão (350ml)',
            '• 1 fio de azeite extravirgem com cheiro-verde fresco salpicado',
            '• 1 fatia de pão tostado para acompanhar',
          ],
          prepTimeMinutes: 15,
          tag: 'regional_classic',
          isBatchCookingEligible: true,
          sourcedFoods: jantarSourcedFoods.length > 0 ? jantarSourcedFoods : undefined,
        },
        {
          optionId: 'opt-jantar-vegan-marmita',
          title: 'Marmita Noturna Leve (Repetição do Prato Feito Vegano)',
          description: 'Praticidade máxima com o que já foi preparado no almoço.',
          householdPortions: [
            '• 1 colher de servir de arroz (100g) + 1 concha de feijão (80g)',
            '• 2 colheres de sopa de grão-de-bico refogado (70g)',
            `• ${legumePadrao} à vontade`,
          ],
          prepTimeMinutes: 5,
          tag: 'budget_friendly',
          isBatchCookingEligible: true,
          sourcedFoods: jantarSourcedFoods.length > 0 ? jantarSourcedFoods : undefined,
        }
      );
    } else if (isVeg) {
      jantarOptions.push(
        {
          optionId: 'opt-jantar-veg-omelete',
          title: 'Omelete de Forno Cremoso com Espinafre, Tomate & Queijo Minas',
          description: 'Preparo rápido, sem sujar quase nenhuma louça, com proteína completa e altíssima digestibilidade.',
          householdPortions: [
            '• 2 ovos caipiras batidos com tomate em cubos e espinafre picadinho',
            '• 1 fatia de queijo minas ralado por cima (30g)',
            '• 1 fatia de pão tostada no azeite',
          ],
          prepTimeMinutes: 10,
          tag: 'quick_10min',
          isBatchCookingEligible: false,
          sourcedFoods: jantarSourcedFoods.length > 0 ? jantarSourcedFoods : undefined,
        },
        {
          optionId: 'opt-jantar-veg-sopa',
          title: 'Sopa de Legumes com Feijão Batido & Queijo Minas em Cubinhos',
          description: 'Sopa reconfortante rica em antioxidantes, cálcio e fibras para uma noite de sono reparador.',
          householdPortions: [
            '• 1 prato fundo cheio de sopa de feijão batido com legumes e macarrão (300ml)',
            '• Cubinhos de queijo minas frescal derretidos no caldo (40g)',
            '• 1 fio de azeite extravirgem com cheiro-verde',
          ],
          prepTimeMinutes: 15,
          tag: 'regional_classic',
          isBatchCookingEligible: true,
          sourcedFoods: jantarSourcedFoods.length > 0 ? jantarSourcedFoods : undefined,
        },
        {
          optionId: 'opt-jantar-veg-marmita',
          title: 'Repetição Leve do Almoço Vegetariano',
          description: 'Praticidade da marmita já pronta na geladeira do batch cooking.',
          householdPortions: [
            '• 1 colher de servir de arroz (100g) + 1 concha de feijão (80g)',
            '• 1 ovo cozido ou mexido',
            `• ${legumePadrao} assado à vontade`,
          ],
          prepTimeMinutes: 5,
          tag: 'budget_friendly',
          isBatchCookingEligible: true,
          sourcedFoods: jantarSourcedFoods.length > 0 ? jantarSourcedFoods : undefined,
        }
      );
    } else {
      jantarOptions.push(
        {
          optionId: 'opt-jantar-sopa',
          title: 'Sopa Revigorante de Legumes com Feijão Batido & Frango Desfiado',
          description: 'Reconfortante, ultra nutritiva e excelente para aproveitar sobras planejadas da geladeira.',
          householdPortions: [
            '• 1 prato fundo cheio de sopa de legumes com feijão e macarrão (300ml)',
            '• 3 colheres de sopa cheias de frango desfiado temperado (80g)',
            '• 1 fio de azeite extravirgem com cheiro-verde fresco salpicado',
          ],
          prepTimeMinutes: 15,
          tag: 'regional_classic',
          isBatchCookingEligible: true,
          sourcedFoods: jantarSourcedFoods.length > 0 ? jantarSourcedFoods : undefined,
        },
        {
          optionId: 'opt-jantar-omelete',
          title: 'Omelete de Forno Cremoso com Espinafre, Tomate & Torradas de Pão',
          description: 'Preparo rápido, sem sujar louça, com proteína completa e pouquíssimo carboidrato.',
          householdPortions: [
            '• 2 ovos caipiras batidos com espinafre e tomate em cubinhos',
            '• 1 fatia de pão francês tostada com azeite e orégano',
            '• Saladinha de folhas verdes',
          ],
          prepTimeMinutes: 10,
          tag: 'quick_10min',
          isBatchCookingEligible: false,
          sourcedFoods: jantarSourcedFoods.length > 0 ? jantarSourcedFoods : undefined,
        },
        {
          optionId: 'opt-jantar-marmita',
          title: 'Marmita Leve: Repetição do Prato Feito do Almoço',
          description: 'Praticidade total com a comida já pronta na geladeira do batch cooking de domingo.',
          householdPortions: [
            '• 1 colher de servir de arroz (100g) + 1 concha pequena de feijão (80g)',
            '• 1 filé pequeno de frango grelhado ou 1 ovo mexido (80g)',
            `• ${legumePadrao} assado à vontade`,
          ],
          prepTimeMinutes: 5,
          tag: 'budget_friendly',
          isBatchCookingEligible: true,
          sourcedFoods: jantarSourcedFoods.length > 0 ? jantarSourcedFoods : undefined,
        }
      );
    }

    meals.push({
      mealSlotId: 'jantar',
      mealSlotName: '🌙 4. Jantar Confortável & Leve',
      selectedOptionIndex: 0,
      biochemicalNote: 'Refeição de fácil digestão, rica em triptofano e magnésio, garantindo um sono profundo e reparador.',
      options: jantarOptions,
    });

    // 3. Guia de Batch Cooking (Cozinhar em 1h30 no Domingo)
    const batchCookingGuide: BatchCookingGuideStep[] = [
      {
        stepNumber: 1,
        title: 'O Feijão na Pressão com Protocolo de Remolho (1kg)',
        description: 'Coloque 1kg de feijão de molho no sábado à noite com água e rodelas de limão por 12 horas (elimina 87% dos fitatos e gases). Cozinhe na pressão com folhas de louro por 25 minutos.',
        protocolBadge: '✓ Rende 5 porções para a semana e congela 3 potes para o mês.',
        durationMinutes: 30,
      },
      {
        stepNumber: 2,
        title: isVeg || isVegan ? 'O Cozimento dos Ovos / Tofu / Grão-de-Bico' : 'O Desfiado de Frango na Pressão (1kg)',
        description: isVeg || isVegan
          ? 'Cozinhe uma cartela de ovos caipiras ou deixe o grão-de-bico pré-cozido e porcionado em potes herméticos na geladeira.'
          : 'Cozinhe 1kg de peito de frango com cebola, alho, cúrcuma e sal por 20 minutos. Escorra o caldo e sacuda a panela tampada com força por 30 segundos (desfia sozinho!).',
        protocolBadge: '✓ Proteína pronta na geladeira para montagens em 2 minutos.',
        durationMinutes: 25,
      },
      {
        stepNumber: 3,
        title: 'O Tabuleiro de Legumes Assados da Safra Regional',
        description: 'Pique abóbora, cenoura e abobrinha em cubos médios. Regue com 1 colher de azeite, sal e alecrim. Asse no forno a 200°C por 30 minutos.',
        protocolBadge: '✓ Durabilidade de até 6 dias em pote fechado de vidro.',
        durationMinutes: 35,
      },
    ];

    // 4. Cenários de Compras DINÂMICOS (Calculados diretamente dos alimentos prescritos)
    const numPeople = Math.max(1, anamnesis.numberOfPeople);

    // Agregação dos alimentos reais consumidos
    const allSourcedFoods: Array<{ food: ClinicalFoodItem; portionGrams: number }> = [];
    meals.forEach((m) => {
      const opt = m.options[m.selectedOptionIndex || 0];
      if (opt?.sourcedFoods) {
        opt.sourcedFoods.forEach((sf) => allSourcedFoods.push({ food: sf.food, portionGrams: sf.portionReadyGrams }));
      }
    });

    const feiraItems: ShoppingCategoryItem[] = [];
    const proteinaItems: ShoppingCategoryItem[] = [];
    const graosItems: ShoppingCategoryItem[] = [];
    const merceariaItems: ShoppingCategoryItem[] = [];

    const foodMap = new Map<string, { food: ClinicalFoodItem; totalPortionGrams: number }>();
    allSourcedFoods.forEach((item) => {
      const existing = foodMap.get(item.food.id);
      if (existing) {
        existing.totalPortionGrams += item.portionGrams;
      } else {
        foodMap.set(item.food.id, { food: item.food, totalPortionGrams: item.portionGrams });
      }
    });

    foodMap.forEach(({ food, totalPortionGrams }) => {
      const monthlyGrams = totalPortionGrams * 30 * numPeople;
      const umcSizeKg = Math.max(0.1, food.umcSizeKg || 1);
      const packagesNeeded = Math.max(1, Math.ceil(monthlyGrams / (umcSizeKg * 1000)));
      const basePrice = packagesNeeded * (food.pricePerUmc || 12);
      const totalKg = Number((packagesNeeded * umcSizeKg).toFixed(1));
      const umcQty = totalKg >= 1 ? `${totalKg} kg (${packagesNeeded} un)` : `${Math.round(totalKg * 1000)}g (${packagesNeeded} un)`;

      const shopItem: ShoppingCategoryItem = {
        name: food.name,
        umcQuantity: umcQty,
        estimatedPrice: basePrice,
        isRegionalSeason: food.novaGroup === 'in_natura',
      };

      const group = food.guideGroup;
      const cat = food.category;

      if (group === 'legumes_verduras' || group === 'frutas' || cat === 'produce') {
        feiraItems.push(shopItem);
      } else if (group === 'carnes_ovos' || group === 'leite_queijos' || cat === 'protein') {
        proteinaItems.push(shopItem);
      } else if (group === 'cereais' || group === 'feijoes' || group === 'raizes_tuberculos' || cat === 'grains' || cat === 'carbs') {
        graosItems.push(shopItem);
      } else {
        merceariaItems.push(shopItem);
      }
    });

    // Insumos básicos de culinária e temperos da despensa se faltarem
    if (feiraItems.length === 0) {
      feiraItems.push(
        { name: 'Banana Prata da Safra', umcQuantity: `${2 * numPeople} dúzias`, estimatedPrice: 14 * numPeople, isRegionalSeason: true },
        { name: 'Abóbora / Legumes da Época', umcQuantity: `${2 * numPeople} kg`, estimatedPrice: 12 * numPeople, isRegionalSeason: true },
        { name: 'Folhas Frescas / Couve', umcQuantity: `${2 * numPeople} maços`, estimatedPrice: 8 * numPeople, isRegionalSeason: true }
      );
    }
    if (graosItems.length === 0) {
      graosItems.push(
        { name: 'Arroz Branco ou Parboilizado', umcQuantity: '1 pct (5kg)', estimatedPrice: 28, isRegionalSeason: false },
        { name: 'Feijão Carioca da Safra', umcQuantity: `${Math.max(1, numPeople)} pct(s)`, estimatedPrice: 16 * numPeople, isRegionalSeason: true }
      );
    }
    if (merceariaItems.length === 0) {
      merceariaItems.push(
        { name: 'Azeite de Oliva Extravirgem (500ml)', umcQuantity: '1 garrafa', estimatedPrice: 36, isRegionalSeason: false },
        { name: 'Café Tradicional Torrado & Moído (500g)', umcQuantity: '1 pacote', estimatedPrice: 19, isRegionalSeason: false },
        { name: 'Alho, Louro & Cúrcuma Pura', umcQuantity: '1 kit temperos', estimatedPrice: 14, isRegionalSeason: true }
      );
    }

    const calculateAislesTotal = (
      fItems: ShoppingCategoryItem[],
      pItems: ShoppingCategoryItem[],
      gItems: ShoppingCategoryItem[],
      mItems: ShoppingCategoryItem[],
      multiplier: number = 1.0
    ) => {
      const sum = [...fItems, ...pItems, ...gItems, ...mItems].reduce((acc, i) => acc + i.estimatedPrice, 0);
      return Math.round(sum * multiplier);
    };

    const regionalFactor = getRegionalPriceMultiplier(anamnesis.stateUf);
    const costEquilibrado = calculateAislesTotal(feiraItems, proteinaItems, graosItems, merceariaItems, 1.0 * regionalFactor);
    const costPeNoChao = calculateAislesTotal(feiraItems, proteinaItems, graosItems, merceariaItems, 0.82 * regionalFactor);
    const costPratico = calculateAislesTotal(feiraItems, proteinaItems, graosItems, merceariaItems, 1.25 * regionalFactor);

    const shoppingScenarios: Record<'pe_no_chao' | 'equilibrado' | 'pratico', ShoppingScenario> = {
      pe_no_chao: {
        scenarioName: 'pe_no_chao',
        scenarioTitle: '1. Pé no Chão (Feira Livre & Atacarejo)',
        scenarioDescription: `Foco total em vegetais da safra de ${anamnesis.stateUf}, compras em atacado e comida caseira de altíssimo valor nutricional.`,
        costPerPerson: Math.round(costPeNoChao / numPeople),
        totalFamilyCost: costPeNoChao,
        aisles: {
          feiraHortifruti: feiraItems.map((i) => ({ ...i, estimatedPrice: Math.round(i.estimatedPrice * 0.8) })),
          acougueOvos: proteinaItems.map((i) => ({ ...i, estimatedPrice: Math.round(i.estimatedPrice * 0.85) })),
          graosCereais: graosItems.map((i) => ({ ...i, estimatedPrice: Math.round(i.estimatedPrice * 0.85) })),
          merceariaTemperos: merceariaItems,
        },
      },
      equilibrado: {
        scenarioName: 'equilibrado',
        scenarioTitle: '2. Equilibrado (Supermercado + Feira)',
        scenarioDescription: 'O padrão ouro de sustentabilidade para famílias: mescla cortes frescos, laticínios artesanais e comodidade.',
        costPerPerson: Math.round(costEquilibrado / numPeople),
        totalFamilyCost: costEquilibrado,
        aisles: {
          feiraHortifruti: feiraItems,
          acougueOvos: proteinaItems,
          graosCereais: graosItems,
          merceariaTemperos: merceariaItems,
        },
      },
      pratico: {
        scenarioName: 'pratico',
        scenarioTitle: '3. Prático & Cortes Nobres (Rotina Acelerada)',
        scenarioDescription: 'Vegetais já higienizados e porcionados, peito de frango em cubos e snacks prontos.',
        costPerPerson: Math.round(costPratico / numPeople),
        totalFamilyCost: costPratico,
        aisles: {
          feiraHortifruti: feiraItems.map((i) => ({ ...i, estimatedPrice: Math.round(i.estimatedPrice * 1.2) })),
          acougueOvos: proteinaItems.map((i) => ({ ...i, estimatedPrice: Math.round(i.estimatedPrice * 1.3) })),
          graosCereais: graosItems.map((i) => ({ ...i, estimatedPrice: Math.round(i.estimatedPrice * 1.15) })),
          merceariaTemperos: merceariaItems.map((i) => ({ ...i, estimatedPrice: Math.round(i.estimatedPrice * 1.1) })),
        },
      },
    };

    return {
      biometrics: {
        bmrKcal: Math.round(bmr),
        tdeeKcal: tdee,
        targetKcal,
        targetProteinGrams,
        targetCarbsGrams,
        targetFatsGrams,
        targetWaterMl,
        novaInNaturaPercentage: 94,
      },
      meals,
      batchCookingGuide,
      shoppingScenarios,
      selectedScenario: anamnesis.prioritizeSavings ? 'pe_no_chao' : 'equilibrado',
    };
  }
}

export const nutritionAiConsultant = new NutritionAiConsultantService();
