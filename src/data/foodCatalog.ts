export type FoodCategoryGroup = 'protein' | 'grains' | 'carbs' | 'produce' | 'pantry';

export interface NeutralFoodItem {
  id: string;
  name: string;
  group: FoodCategoryGroup;
  defaultUnit: 'kg' | 'cartela' | 'litro' | 'pacote';
  estimatedKgPerUnit: number; // Conversion to kg for gross weight math
  defaultPricePerUnit: number; // National benchmark baseline
  isCurrentSeason?: boolean; // Objective crop indicator for current month
  cropSeasonMonthName?: string;
}

export const NEUTRAL_FOOD_CATALOG: NeutralFoodItem[] = [
  // 🥩 PROTEÍNAS
  {
    id: 'prot-frango-peito',
    name: 'Peito de Frango (Filé ou Sassami)',
    group: 'protein',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 19.90,
  },
  {
    id: 'prot-frango-coxa',
    name: 'Coxa e Sobrecoxa de Frango',
    group: 'protein',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 14.50,
  },
  {
    id: 'prot-ovos',
    name: 'Ovos de Galinha (Cartela com 30 unidades)',
    group: 'protein',
    defaultUnit: 'cartela',
    estimatedKgPerUnit: 1.8, // 30 eggs ~ 1.8kg
    defaultPricePerUnit: 21.00,
  },
  {
    id: 'prot-carne-moida',
    name: 'Carne Bovina Moída (Acém / Patinho)',
    group: 'protein',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 34.90,
  },
  {
    id: 'prot-carne-bisteca',
    name: 'Carne Suína (Bisteca / Lombo)',
    group: 'protein',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 22.00,
  },
  {
    id: 'prot-peixe-sardinha',
    name: 'Peixe (Sardinha / Tilápia / Filé)',
    group: 'protein',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 28.00,
  },

  // 🌾 GRÃOS
  {
    id: 'graos-arroz-branco',
    name: 'Arroz Branco Tipo 1 (Pacote 5kg)',
    group: 'grains',
    defaultUnit: 'pacote',
    estimatedKgPerUnit: 5.0,
    defaultPricePerUnit: 29.90,
  },
  {
    id: 'graos-arroz-integral',
    name: 'Arroz Integral (Pacote 1kg)',
    group: 'grains',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 7.50,
  },
  {
    id: 'graos-feijao-carioca',
    name: 'Feijão Carioca (Pacote 1kg)',
    group: 'grains',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 7.90,
  },
  {
    id: 'graos-feijao-preto',
    name: 'Feijão Preto (Pacote 1kg)',
    group: 'grains',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 8.20,
  },
  {
    id: 'graos-lentilha',
    name: 'Lentilha / Grão-de-Bico (Pacote 500g)',
    group: 'grains',
    defaultUnit: 'pacote',
    estimatedKgPerUnit: 0.5,
    defaultPricePerUnit: 6.90,
  },

  // 🥔 TUBÉRCULOS & CARBOIDRATOS (ENERGIA)
  {
    id: 'carbs-batata-inglesa',
    name: 'Batata Inglesa',
    group: 'carbs',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 6.50,
  },
  {
    id: 'carbs-batata-doce',
    name: 'Batata Doce / Mandioca',
    group: 'carbs',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 5.80,
  },
  {
    id: 'carbs-macarrao',
    name: 'Macarrão de Sêmola/Espaguete (500g)',
    group: 'carbs',
    defaultUnit: 'pacote',
    estimatedKgPerUnit: 0.5,
    defaultPricePerUnit: 4.20,
  },
  {
    id: 'carbs-aveia',
    name: 'Aveia em Flocos (500g)',
    group: 'carbs',
    defaultUnit: 'pacote',
    estimatedKgPerUnit: 0.5,
    defaultPricePerUnit: 6.50,
  },
  {
    id: 'carbs-pao-frances',
    name: 'Pão Francês / Pão de Fôrma',
    group: 'carbs',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 14.00,
  },

  // 🍎 FRUTAS, LEGUMES & VERDURAS (HORTIFRUTI)
  {
    id: 'prod-banana-prata',
    name: 'Banana Prata / Caturra',
    group: 'produce',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 5.90,
    isCurrentSeason: true,
    cropSeasonMonthName: 'Safra de Agosto/Setembro',
  },
  {
    id: 'prod-laranja-pera',
    name: 'Laranja Pêra / Mexerica',
    group: 'produce',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 4.50,
    isCurrentSeason: true,
    cropSeasonMonthName: 'Safra de Agosto/Setembro',
  },
  {
    id: 'prod-maca-gala',
    name: 'Maçã Gala / Fuji',
    group: 'produce',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 8.90,
    isCurrentSeason: true,
    cropSeasonMonthName: 'Safra de Agosto',
  },
  {
    id: 'prod-mamao-formosa',
    name: 'Mamão Formosa / Papaia',
    group: 'produce',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 7.90,
  },
  {
    id: 'prod-tomate-salada',
    name: 'Tomate de Salada',
    group: 'produce',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 7.90,
  },
  {
    id: 'prod-cenoura',
    name: 'Cenoura / Beterraba',
    group: 'produce',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 5.50,
    isCurrentSeason: true,
    cropSeasonMonthName: 'Safra de Agosto',
  },
  {
    id: 'prod-cebola-alho',
    name: 'Cebola & Alho (Temperos de Feira)',
    group: 'produce',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 6.80,
  },
  {
    id: 'prod-alface-folhas',
    name: 'Alface / Espinafre / Folhas (Maço)',
    group: 'produce',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 0.5,
    defaultPricePerUnit: 4.50,
  },

  // 🥛 MERCEARIA, LATICÍNIOS & LIMPEZA DA COZINHA
  {
    id: 'pantry-leite-uht',
    name: 'Leite UHT Integral/Desnatado (Litro)',
    group: 'pantry',
    defaultUnit: 'litro',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 5.20,
  },
  {
    id: 'pantry-cafe-moido',
    name: 'Café Torrado e Moído (500g)',
    group: 'pantry',
    defaultUnit: 'pacote',
    estimatedKgPerUnit: 0.5,
    defaultPricePerUnit: 18.90,
  },
  {
    id: 'pantry-oleo-soja',
    name: 'Óleo de Soja / Azeite de Oliva',
    group: 'pantry',
    defaultUnit: 'litro',
    estimatedKgPerUnit: 0.9,
    defaultPricePerUnit: 7.50,
  },
  {
    id: 'pantry-sal-temperos',
    name: 'Sal, Açúcar & Temperos Secos',
    group: 'pantry',
    defaultUnit: 'kg',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 6.00,
  },
  {
    id: 'pantry-detergente-limpeza',
    name: 'Detergente, Bucha Pia & Papel Toalha',
    group: 'pantry',
    defaultUnit: 'pacote',
    estimatedKgPerUnit: 1.0,
    defaultPricePerUnit: 12.50,
  },
];
