import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import canonicalIbgeFoods from '../data/canonicalIbgeFoods.json';
import { CATEGORIES_INFO, getDefaultExpenses } from '../data/defaultCategories';
import { DIETARY_PROFILES, DietaryProfileInfo } from '../data/profilePresets';
import { BRAZIL_STATES, StateOption } from '../data/brazilLocations';
import type { ClinicalFoodItem } from './clinicalNutritionEngine';
import type { CategoryInfo, CategoryKey, CategorizedExpenseItem } from '../types';
import type { FoodFunctionalRole, GuideFoodGroup } from '../types/foodRoles';

export type NovaClassification = 'in_natura' | 'culinary_ingredient' | 'processed' | 'ultraprocessed';

export interface ArchetypeSlot {
  slotId: string;
  slotName: string; // ex: "Proteína Principal", "Grão Base" - NUNCA nome de alimento
  role?: FoodFunctionalRole; // Novo papel funcional do Guia Alimentar (MS)
  categoryTag: 'protein' | 'grains' | 'carbs' | 'produce' | 'pantry'; // Legado para retrocompatibilidade
  novaGroup: NovaClassification;
  isOptional?: boolean;
  defaultGramsTarget?: number;
}

export interface DynamicRecipeArchetype {
  id: string;
  name: string;
  description: string;
  guidelineChapter: string;
  slots: ArchetypeSlot[];
  batchCookingEligible: boolean;
  prepTimeMinutes: number;
  recommendedOccasion: 'weekday_routine' | 'weekend_family' | 'quick_meal';
  observedExamples?: string[]; // Exemplos ilustrativos para a UI (não afeta regras de seleção)
}

export interface ShoppingScenarioConfig {
  peNoChaoBase: number;
  equilibradoBase: number;
  praticoBase: number;
  vegDiscountPct: number;
}

export interface SundayCompensationConfig {
  extraWaterMl: number;
  snackCalorieCutKcal: number;
}

export interface IngredientSubstitutionRule {
  id: string;
  targetCategory: 'protein' | 'carbs' | 'produce';
  originalFood: string;
  substitutes: string[];
}

export interface BatchCookingProtocolStep {
  stepNumber: number;
  title: string;
  description: string;
  badge: string;
  durationMinutes: number;
}

export interface SystemCalibrationRules {
  foodUnderestimationFloor: number; // R$ 300
  deliveryMaxPercentageOfIncome: number; // 12%
  streamingMaxCount: number; // 4
  healthReserveSuggested: number; // R$ 50
  scenarioMinimoDiscretionaryCutPct: number; // 100%
  scenarioIdealDiscretionaryCutPct: number; // 40%
}

export interface SidehustleTemplate {
  id: string;
  habilidade: string;
  comoGeraRenda: string;
  quantoCobrar: string;
  quantoPoderiaGerar: number;
  comoConseguirClientes: string;
  categoria: 'servicos' | 'aulas' | 'alimentacao' | 'digital' | 'geral';
}

export interface SystemPromptSettings {
  aiToneOfVoice: 'empathetic' | 'practical' | 'disciplined';
  customHouseGuidelines: string;
  isAiEnabled: boolean;
  systemPersonaName: string;
}

export interface EducationalArticle {
  id: string;
  title: string;
  category: 'nutricao' | 'financas' | 'matematica';
  summary: string;
  content: string;
}

export interface ManagementSystemData {
  foods: ClinicalFoodItem[];
  recipeArchetypes: DynamicRecipeArchetype[];
  shoppingScenarioConfig: ShoppingScenarioConfig;
  sundayCompensationConfig: SundayCompensationConfig;
  ingredientSubstitutionRules: IngredientSubstitutionRule[];
  batchCookingProtocols: BatchCookingProtocolStep[];
  categoriesInfo: CategoryInfo[];
  defaultExpenses: Record<CategoryKey, CategorizedExpenseItem[]>;
  dietaryProfiles: Record<string, DietaryProfileInfo>;
  geoLocations: StateOption[];
  calibrationRules: SystemCalibrationRules;
  sidehustleTemplates: SidehustleTemplate[];
  promptSettings: SystemPromptSettings;
  educationalArticles: EducationalArticle[];
  lastUpdated: string;
}

// 12 Padrões Oficiais do Capítulo 3 do Guia Alimentar (Ministério da Saúde) Desacoplados
const DEFAULT_ARCHETYPES: DynamicRecipeArchetype[] = [
  // --- REFEIÇÕES PRINCIPAIS (ALMOÇO E JANTAR) ---
  {
    id: 'arch-pf-tradicional',
    name: '1. Prato Feito Tradicional Brasileiro (Arroz, Feijão, Proteína & Salada)',
    description: 'A base da alimentação brasileira saudável: equilíbrio perfeito de aminoácidos com grãos, leguminosas, carne/ovo e hortaliças.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3: A Combinação Arroz e Feijão',
    slots: [
      { slotId: 's1', slotName: 'Grão Base (Energia)', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 140 },
      { slotId: 's2', slotName: 'Leguminosa (Fibras & Minerais)', role: 'proteico_vegetal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 90 },
      { slotId: 's3', slotName: 'Proteína Principal', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 120 },
      { slotId: 's4', slotName: 'Hortaliça Cozida / Refogada', role: 'hortalica', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 80 },
      { slotId: 's5', slotName: 'Salada Crua / Folhas', role: 'hortalica', categoryTag: 'produce', novaGroup: 'in_natura', isOptional: true, defaultGramsTarget: 50 },
    ],
    observedExamples: ['Arroz branco soltinho', 'Feijão carioca com caldo', 'Filé de peito de frango ou ovos caipiras', 'Abóbora assada', 'Alface e tomate'],
    batchCookingEligible: true,
    prepTimeMinutes: 20,
    recommendedOccasion: 'weekday_routine',
  },
  {
    id: 'arch-ensopado',
    name: '2. Ensopado & Picadinho de Panela com Raízes da Terra',
    description: 'Prato reconfortante de cozimento lento que valoriza cortes magros e tubérculos regionais.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3: Alimentos In Natura e Culinária Caseira',
    slots: [
      { slotId: 's1', slotName: 'Proteína Principal', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 130 },
      { slotId: 's2', slotName: 'Tubérculo / Raiz Regional', role: 'energetico_raiz', categoryTag: 'carbs', novaGroup: 'in_natura', defaultGramsTarget: 120 },
      { slotId: 's3', slotName: 'Hortaliça Cozida no Molho', role: 'hortalica', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 80 },
      { slotId: 's4', slotName: 'Grão Base de Acompanhamento', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 100 },
    ],
    observedExamples: ['Carne em cubos ou frango', 'Mandioca ou batata doce cozida', 'Cenoura em rodelas', 'Arroz branco'],
    batchCookingEligible: true,
    prepTimeMinutes: 30,
    recommendedOccasion: 'weekday_routine',
  },
  {
    id: 'arch-moqueca',
    name: '3. Moqueca & Peixada Regional Brasileira',
    description: 'Tradição litorânea brasileira rica em ômega-3, carotenoides e gorduras boas com pirão de raiz artesanal.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3: A Diversidade Regional dos 5 Brasis',
    slots: [
      { slotId: 's1', slotName: 'Pescado ou Proteína Vegetal', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 140 },
      { slotId: 's2', slotName: 'Molho Aromático de Hortaliças', role: 'hortalica', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 100 },
      { slotId: 's3', slotName: 'Pirão de Farinha de Raiz', role: 'energetico_raiz', categoryTag: 'carbs', novaGroup: 'in_natura', defaultGramsTarget: 90 },
      { slotId: 's4', slotName: 'Grão Base', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 110 },
    ],
    observedExamples: ['Filé de tilápia ou banana-da-terra', 'Tomate, pimentão e cebola', 'Pirão de mandioca', 'Arroz soltinho'],
    batchCookingEligible: false,
    prepTimeMinutes: 25,
    recommendedOccasion: 'weekend_family',
  },
  {
    id: 'arch-massa-hortalicas',
    name: '4. Prato de Massa com Molho Caseiro & Hortaliças',
    description: 'Combinação clássica de carboidrato de rápida assimilação com proteína e vegetais frescos.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3: Preparações Culinárias Variadas',
    slots: [
      { slotId: 's1', slotName: 'Massa Energética Base', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 140 },
      { slotId: 's2', slotName: 'Proteína Principal ou Queijo', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 100 },
      { slotId: 's3', slotName: 'Hortaliça Cozida ou Salada', role: 'hortalica', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 80 },
    ],
    observedExamples: ['Macarrão ao alho e óleo ou molho de tomate', 'Frango desfiado ou queijo minas', 'Brócolis ou salada de folhas'],
    batchCookingEligible: true,
    prepTimeMinutes: 20,
    recommendedOccasion: 'weekday_routine',
  },
  {
    id: 'arch-tropeiro-baiao',
    name: '5. Feijão Tropeiro / Baião de Dois / Galinhada',
    description: 'Pratos únicos e econômicos de panela com altíssimo rendimento e aproveitamento integral.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3: Tradições e Preparações Únicas',
    slots: [
      { slotId: 's1', slotName: 'Leguminosa Base', role: 'proteico_vegetal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 120 },
      { slotId: 's2', slotName: 'Proteína Secundária / Ovos', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 90 },
      { slotId: 's3', slotName: 'Farinha de Raiz ou Grão', role: 'energetico_raiz', categoryTag: 'carbs', novaGroup: 'in_natura', defaultGramsTarget: 60 },
      { slotId: 's4', slotName: 'Hortaliça Refogada', role: 'hortalica', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 70 },
    ],
    observedExamples: ['Feijão de corda ou carioca', 'Ovos caipiras mexidos / queijo coalho', 'Farinha de mandioca torrada', 'Couve refogada no alho'],
    batchCookingEligible: true,
    prepTimeMinutes: 15,
    recommendedOccasion: 'quick_meal',
  },
  {
    id: 'arch-sopa-nutritiva',
    name: '6. Sopa & Caldo Nutritivo de Legumes com Feijão Batido',
    description: 'Jantar leve e de fácil digestão que combate o desperdício aproveitando sobras limpas da geladeira.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 5: Aproveitamento Integral e Zero Desperdício',
    slots: [
      { slotId: 's1', slotName: 'Caldo de Leguminosa', role: 'proteico_vegetal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 200 },
      { slotId: 's2', slotName: 'Mix de Hortaliças em Cubos', role: 'hortalica', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 120 },
      { slotId: 's3', slotName: 'Proteína Desfiada ou Queijo', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 80 },
      { slotId: 's4', slotName: 'Massa ou Torrada de Pão', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 50 },
    ],
    observedExamples: ['Caldo de feijão carioca batido', 'Chuchu, abóbora e cenoura em cubinhos', 'Frango desfiado / queijo minas', 'Macarrão ou torrada'],
    batchCookingEligible: true,
    prepTimeMinutes: 15,
    recommendedOccasion: 'quick_meal',
  },

  // --- CAFÉ DA MANHÃ ---
  {
    id: 'arch-cafe-pao',
    name: '7. Café da Manhã Tradicional com Pão & Bebida Quente',
    description: 'Padrão tradicional de desjejum brasileiro com energia limpa e proteína leve.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3: O Café da Manhã Brasileiro',
    slots: [
      { slotId: 's1', slotName: 'Pão / Cereal Matinal', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 60 },
      { slotId: 's2', slotName: 'Proteína / Recheio', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 50 },
      { slotId: 's3', slotName: 'Lácteo ou Bebida Quente', role: 'lacteo', categoryTag: 'pantry', novaGroup: 'in_natura', defaultGramsTarget: 150 },
      { slotId: 's4', slotName: 'Fruta Fresca da Safra', role: 'fruta', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 100 },
    ],
    observedExamples: ['Pão francês tostado', 'Ovos caipiras mexidos', 'Café com leite integral', 'Banana prata'],
    batchCookingEligible: false,
    prepTimeMinutes: 10,
    recommendedOccasion: 'weekday_routine',
  },
  {
    id: 'arch-cafe-regional',
    name: '8. Café da Manhã Regional com Tubérculo ou Cuscuz',
    description: 'Herança culinária do Norte e Nordeste rica em milho, mandioca e queijos artesanais.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3: A Diversidade Regional no Café da Manhã',
    slots: [
      { slotId: 's1', slotName: 'Cuscuz de Milho ou Tubérculo Cozido', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 100 },
      { slotId: 's2', slotName: 'Proteína ou Queijo Tostado', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 50 },
      { slotId: 's3', slotName: 'Bebida Tradicional', role: 'liquido_base', categoryTag: 'pantry', novaGroup: 'in_natura', defaultGramsTarget: 150 },
      { slotId: 's4', slotName: 'Fruta Regional', role: 'fruta', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 100 },
    ],
    observedExamples: ['Cuscuz de milho ou mandioca cozida', 'Queijo coalho na chapa ou ovos', 'Café passado na hora', 'Mamão com limão'],
    batchCookingEligible: false,
    prepTimeMinutes: 10,
    recommendedOccasion: 'weekday_routine',
  },
  {
    id: 'arch-cafe-proteico',
    name: '9. Café da Manhã Proteico com Aveia & Ovos',
    description: 'Combinação equilibrada de fibras prebióticas e aminoácidos essenciais para saciedade matinal duradoura.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3: Café da Manhã e Energia Sustentada',
    slots: [
      { slotId: 's1', slotName: 'Aveia em Flocos / Goma', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 45 },
      { slotId: 's2', slotName: 'Proteína de Alto Valor Biológico', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 100 },
      { slotId: 's3', slotName: 'Fruta Rica em Fibras', role: 'fruta', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 100 },
    ],
    observedExamples: ['Mingau cremoso de aveia ou tapioca', 'Ovos caipiras mexidos', 'Maçã picada com canela'],
    batchCookingEligible: false,
    prepTimeMinutes: 8,
    recommendedOccasion: 'weekday_routine',
  },

  // --- PEQUENAS REFEIÇÕES (LANCHES) ---
  {
    id: 'arch-lanche-fruta',
    name: '10. Pequena Refeição: Fruta Fresca & Fibras Solúveis',
    description: 'Lanche prático e leve para controle glicêmico entre refeições principais.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3: Pequenas Refeições e Frutas da Safra',
    slots: [
      { slotId: 's1', slotName: 'Fruta Fresca da Safra', role: 'fruta', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 120 },
      { slotId: 's2', slotName: 'Cereal em Flocos / Sementes', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 25 },
    ],
    observedExamples: ['Maçã gala ou pera fatiada', 'Aveia em flocos finos'],
    batchCookingEligible: false,
    prepTimeMinutes: 3,
    recommendedOccasion: 'quick_meal',
  },
  {
    id: 'arch-lanche-lacteo',
    name: '11. Pequena Refeição: Lácteo Natural & Fruta',
    description: 'Probióticos vivos e cálcio para a saúde da microbiota e saciedade vespertina.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3: Laticínios e Frutas',
    slots: [
      { slotId: 's1', slotName: 'Lácteo Fermentado Natural', role: 'lacteo', categoryTag: 'pantry', novaGroup: 'in_natura', defaultGramsTarget: 170 },
      { slotId: 's2', slotName: 'Fruta em Pedaços', role: 'fruta', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 80 },
    ],
    observedExamples: ['Iogurte natural integral sem açúcar', 'Banana em rodelas com canela'],
    batchCookingEligible: false,
    prepTimeMinutes: 2,
    recommendedOccasion: 'quick_meal',
  },
  {
    id: 'arch-lanche-oleaginosas',
    name: '12. Pequena Refeição: Castanhas Nobres & Fruta Seca',
    description: 'Gorduras boas, selênio, zinco e antioxidantes com transporte ultra prático.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 3: Castanhas e Frutas',
    slots: [
      { slotId: 's1', slotName: 'Oleaginosa Brasileira', role: 'oleaginosa', categoryTag: 'pantry', novaGroup: 'in_natura', defaultGramsTarget: 30 },
      { slotId: 's2', slotName: 'Fruta da Época', role: 'fruta', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 100 },
    ],
    observedExamples: ['Castanhas-do-pará ou castanha de caju', 'Laranja ou tangerina da safra'],
    batchCookingEligible: false,
    prepTimeMinutes: 2,
    recommendedOccasion: 'quick_meal',
  },
  {
    id: 'arch-fora-delivery',
    name: '13. Alimentação Fora / Restaurante por Quilo / Marmita Executiva / Delivery',
    description: 'Orientação estruturada do Guia Alimentar para refeições no trabalho, self-service por quilo ou delivery planejado.',
    guidelineChapter: 'Guia Alimentar (MS) - Capítulo 4: O Ato de Comer e a Alimentação Fora do Lar',
    slots: [
      { slotId: 's1', slotName: 'Proteína Principal Grelhada / Assada', role: 'proteico_animal', categoryTag: 'protein', novaGroup: 'in_natura', defaultGramsTarget: 120 },
      { slotId: 's2', slotName: 'Cereal Base da Casa', role: 'energetico_cereal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 120 },
      { slotId: 's3', slotName: 'Leguminosa Tradicional', role: 'proteico_vegetal', categoryTag: 'grains', novaGroup: 'in_natura', defaultGramsTarget: 90 },
      { slotId: 's4', slotName: 'Buffet de Saladas Frescas & Legumes', role: 'hortalica', categoryTag: 'produce', novaGroup: 'in_natura', defaultGramsTarget: 100 },
    ],
    observedExamples: ['Filé de frango ou peixe grelhado', 'Arroz branco ou integral', 'Feijão carioca com caldo', 'Mix de folhas e legumes cozidos no vapor'],
    batchCookingEligible: false,
    prepTimeMinutes: 0,
    recommendedOccasion: 'quick_meal',
  }
];

const DEFAULT_SUBSTITUTIONS: IngredientSubstitutionRule[] = [
  {
    id: 'sub-prot-ovos',
    targetCategory: 'protein',
    originalFood: '2 Ovos Caipiras Mexidos (100g)',
    substitutes: [
      '2 fatias de queijo minas frescal na chapa (50g)',
      '4 colheres de sopa de grão-de-bico refogado no azeite (80g)',
      '100g de tofu grelhado com cúrcuma e azeite',
    ]
  },
  {
    id: 'sub-carb-arroz',
    targetCategory: 'carbs',
    originalFood: '1 colher de servir de Arroz Branco (130g)',
    substitutes: [
      '2 pedaços médios de mandioca/aipim cozida (100g)',
      '1 fatia média de cuscuz de milho no vapor (100g)',
      '1 batata-doce média assada com casca (120g)',
    ]
  },
  {
    id: 'sub-prod-abobora',
    targetCategory: 'produce',
    originalFood: '2 pedaços de Abóbora Assada (80g)',
    substitutes: [
      '2 colheres de sopa de cenoura cozida no vapor (70g)',
      '2 colheres de sopa de abobrinha refogada no alho (80g)',
      '2 colheres de sopa de couve refogada no azeite (60g)',
    ]
  }
];

const DEFAULT_BATCH_STEPS: BatchCookingProtocolStep[] = [
  {
    stepNumber: 1,
    title: 'O Feijão na Panela de Pressão com Protocolo de Remolho (1kg)',
    description: 'Coloque o feijão de molho na véspera com água e gotas de limão por 12h (elimina fitatos e gases). Cozinhe na pressão com louro e alho por 25 minutos.',
    badge: '✓ Rende 5 porções para a semana e congela 3 potes no freezer.',
    durationMinutes: 30,
  },
  {
    stepNumber: 2,
    title: 'O Preparo de Proteínas / Ovos e Queijos em Lote',
    description: 'Cozinhe 8 ovos para a semana (duram 5 dias com casca na geladeira) ou desfie peito de frango na pressão sacudindo a panela.',
    badge: '✓ Proteína base pronta para montagens em 5 minutos.',
    durationMinutes: 25,
  },
  {
    stepNumber: 3,
    title: 'O Tabuleiro de Legumes Assados da Safra Regional',
    description: 'Corte abóbora, cenoura e batata em cubos. Regue com 1 colher de azeite, sal e alecrim. Asse no forno a 200°C por 30 minutos até dourar.',
    badge: '✓ Durabilidade de 5 a 6 dias na geladeira em pote fechado.',
    durationMinutes: 35,
  }
];

// Migração suave de chave de armazenamento: v4 -> v5 (adiciona 13º arquétipo para fora do domicílio)
const STORAGE_KEY = 'spaget_management_system_config_v5';
const LEGACY_STORAGE_KEY = 'spaget_management_system_config_v4';

class SystemConfigService {
  private data: ManagementSystemData;
  private listeners: Array<(data: ManagementSystemData) => void> = [];

  constructor() {
    this.data = this.loadInitialData();
  }

  private loadInitialData(): ManagementSystemData {
    try {
      // 1. Tenta carregar v4
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.foods) && parsed.foods.length > 0) {
          return {
            ...parsed,
            recipeArchetypes: parsed.recipeArchetypes || DEFAULT_ARCHETYPES,
            shoppingScenarioConfig: parsed.shoppingScenarioConfig || { peNoChaoBase: 350, equilibradoBase: 450, praticoBase: 580, vegDiscountPct: 10 },
            sundayCompensationConfig: parsed.sundayCompensationConfig || { extraWaterMl: 300, snackCalorieCutKcal: 60 },
            ingredientSubstitutionRules: parsed.ingredientSubstitutionRules || DEFAULT_SUBSTITUTIONS,
            batchCookingProtocols: parsed.batchCookingProtocols || DEFAULT_BATCH_STEPS,
          };
        }
      }

      // 2. Migração transparente de v3 para v4 se existir
      const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyStored) {
        const legacyParsed = JSON.parse(legacyStored);
        const migrated: ManagementSystemData = {
          ...this.createDefaultData(),
          ...legacyParsed,
          recipeArchetypes: DEFAULT_ARCHETYPES, // Atualiza para os 12 arquétipos desacoplados
          lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return migrated;
      }
    } catch (e) {
      console.warn('Failed to load system config from localStorage, fallback to defaults:', e);
    }

    return this.createDefaultData();
  }

  private createDefaultData(): ManagementSystemData {
    const rawFoods = (canonicalIbgeFoods as any[]) || [];
    const typedFoods: ClinicalFoodItem[] = rawFoods.map((f, idx) => {
      let novaGroup: NovaClassification = 'in_natura';
      const lower = (f.name || '').toLowerCase();
      if (lower.includes('oleo') || lower.includes('azeite') || lower.includes('manteiga') || lower.includes('sal') || lower.includes('acucar')) {
        novaGroup = 'culinary_ingredient';
      } else if (lower.includes('enlatado') || lower.includes('conserva') || lower.includes('queijo') || lower.includes('pao')) {
        novaGroup = 'processed';
      } else if (lower.includes('refrigerante') || lower.includes('salgadinho') || lower.includes('empanado') || lower.includes('embutido') || lower.includes('biscoito recheado') || lower.includes('miojo')) {
        novaGroup = 'ultraprocessed';
      }

      return {
        id: f.id || `ibge-${idx}`,
        name: f.name || 'Alimento',
        category: f.category || 'produce',
        defaultLocation: f.defaultLocation || 'supermarket',
        novaGroup,
        guideGroup: f.guideGroup || 'cereais',
        functionalRoles: f.functionalRoles || ['energetico_cereal'],
        kcalPer100g: Number(f.kcalPer100g || 100),
        proteinPer100g: Number(f.proteinPer100g || 0),
        carbsPer100g: Number(f.carbsPer100g || 0),
        fatsPer100g: Number(f.fatsPer100g || 0),
        fiberPer100g: Number(f.fiberPer100g || 0),
        fc: Number(f.fc || 1.0),
        fcr: Number(f.fcr || 1.0),
        umcUnitName: f.umcUnitName || 'Unidade 1kg',
        umcSizeKg: Number(f.umcSizeKg || 1.0),
        pricePerUmc: Number(f.pricePerUmc || 10.0),
        householdMeasures: f.householdMeasures || [{ label: '1 porção média', grams: 100 }],
      };
    });

    return {
      foods: typedFoods,
      recipeArchetypes: DEFAULT_ARCHETYPES,
      shoppingScenarioConfig: { peNoChaoBase: 350, equilibradoBase: 450, praticoBase: 580, vegDiscountPct: 10 },
      sundayCompensationConfig: { extraWaterMl: 300, snackCalorieCutKcal: 60 },
      ingredientSubstitutionRules: DEFAULT_SUBSTITUTIONS,
      batchCookingProtocols: DEFAULT_BATCH_STEPS,
      categoriesInfo: CATEGORIES_INFO,
      defaultExpenses: getDefaultExpenses(),
      dietaryProfiles: DIETARY_PROFILES,
      geoLocations: BRAZIL_STATES,
      calibrationRules: {
        foodUnderestimationFloor: 300,
        deliveryMaxPercentageOfIncome: 12,
        streamingMaxCount: 4,
        healthReserveSuggested: 50,
        scenarioMinimoDiscretionaryCutPct: 100,
        scenarioIdealDiscretionaryCutPct: 40,
      },
      sidehustleTemplates: [
        {
          id: 'sh-1',
          habilidade: 'Serviços de Organização e Assistência Local',
          comoGeraRenda: 'Organização de armários, despensas ou serviços pontuais para comércios locais.',
          quantoCobrar: 'R$ 50 a R$ 80 por atendimento',
          quantoPoderiaGerar: 800,
          comoConseguirClientes: 'Abordar 5 lojistas ou vizinhos oferecendo ajuda pontual para tarefas atrasadas.',
          categoria: 'servicos'
        },
        {
          id: 'sh-2',
          habilidade: 'Aulas Particulares ou Mentoria Prática',
          comoGeraRenda: 'Ensinar matérias escolares, informática básica, culinária ou inglês.',
          quantoCobrar: 'R$ 60 por hora de mentoria',
          quantoPoderiaGerar: 1200,
          comoConseguirClientes: 'Divulgar nos grupos de WhatsApp do condomínio ou escolas locais.',
          categoria: 'aulas'
        }
      ],
      promptSettings: {
        aiToneOfVoice: 'practical',
        customHouseGuidelines: 'Priorizar sempre alimentos in natura do Guia do Ministério da Saúde.',
        isAiEnabled: true,
        systemPersonaName: 'Consultoria SPAGET',
      },
      educationalArticles: [
        {
          id: 'art-1',
          title: 'A Regra de Ouro do Guia Alimentar: Prefira Sempre Alimentos In Natura',
          category: 'nutricao',
          summary: 'Como economizar até 40% na feira livre comprando direto do produtor alimentos in natura.',
          content: 'O Guia Alimentar para a População Brasileira recomenda que alimentos in natura ou minimamente processados sejam a base da alimentação...'
        }
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  public getData(): ManagementSystemData {
    return this.data;
  }

  public getFoods(): ClinicalFoodItem[] {
    return this.data.foods;
  }

  public getArchetypes(): DynamicRecipeArchetype[] {
    return this.data.recipeArchetypes;
  }

  public subscribe(listener: (data: ManagementSystemData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.data.lastUpdated = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Error saving systemConfig to localStorage:', e);
    }

    try {
      const configRef = doc(db, 'system_config', 'spaget_master_config');
      setDoc(configRef, this.data, { merge: true }).catch((err) => {
        console.warn('Cloud sync of system_config deferred:', err.message);
      });
    } catch (e) {
      // Offline fallback
    }

    this.listeners.forEach((listener) => listener(this.data));
  }

  public updateShoppingScenarioConfig(newConfig: Partial<ShoppingScenarioConfig>) {
    this.data.shoppingScenarioConfig = { ...this.data.shoppingScenarioConfig, ...newConfig };
    this.notify();
  }

  public updateSundayCompensationConfig(newConfig: Partial<SundayCompensationConfig>) {
    this.data.sundayCompensationConfig = { ...this.data.sundayCompensationConfig, ...newConfig };
    this.notify();
  }

  public saveArchetype(archetype: DynamicRecipeArchetype) {
    const idx = this.data.recipeArchetypes.findIndex((a) => a.id === archetype.id);
    if (idx >= 0) {
      this.data.recipeArchetypes[idx] = archetype;
    } else {
      this.data.recipeArchetypes.push(archetype);
    }
    this.notify();
  }

  public deleteArchetype(id: string) {
    this.data.recipeArchetypes = this.data.recipeArchetypes.filter((a) => a.id !== id);
    this.notify();
  }

  public saveFood(food: ClinicalFoodItem) {
    const idx = this.data.foods.findIndex((f) => f.id === food.id);
    if (idx >= 0) {
      this.data.foods[idx] = food;
    } else {
      this.data.foods.unshift(food);
    }
    this.notify();
  }

  public deleteFood(foodId: string) {
    this.data.foods = this.data.foods.filter((f) => f.id !== foodId);
    this.notify();
  }

  public resetToFactoryDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.createDefaultData();
    this.notify();
  }
}

export const systemConfig = new SystemConfigService();
