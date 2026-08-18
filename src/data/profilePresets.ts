import { FoodCategoryGroup } from './foodCatalog';

export type DietaryProfileKey = 'omnivore' | 'vegetarian' | 'vegan' | 'glutenFree' | 'regional';

export interface DietaryProfileInfo {
  key: DietaryProfileKey;
  label: string;
  description: string;
  badgeColor: string;
  suggestedChips: Record<FoodCategoryGroup, Array<{ id: string; name: string; estimatedKgPerUnit: number; defaultPrice: number; isSeason?: boolean }>>;
}

export const DIETARY_PROFILES: Record<DietaryProfileKey, DietaryProfileInfo> = {
  omnivore: {
    key: 'omnivore',
    label: 'Onívoro (Variado)',
    description: 'Consumo livre de carnes, aves, ovos, grãos e vegetais.',
    badgeColor: 'bg-[#FAF7F1] text-[#22201D] border-[#E1DBD2]',
    suggestedChips: {
      protein: [
        { id: 'chip-frango', name: 'Peito de Frango', estimatedKgPerUnit: 1.0, defaultPrice: 19.90 },
        { id: 'chip-ovos', name: 'Ovos de Galinha', estimatedKgPerUnit: 1.8, defaultPrice: 21.00 },
        { id: 'chip-carne-moida', name: 'Carne Bovina Moída', estimatedKgPerUnit: 1.0, defaultPrice: 34.90 },
        { id: 'chip-bisteca', name: 'Bisteca Suína', estimatedKgPerUnit: 1.0, defaultPrice: 22.00 },
        { id: 'chip-peixe', name: 'Filé de Peixe / Tilápia', estimatedKgPerUnit: 1.0, defaultPrice: 28.00 },
      ],
      grains: [
        { id: 'chip-arroz-branco', name: 'Arroz Branco', estimatedKgPerUnit: 5.0, defaultPrice: 29.90 },
        { id: 'chip-feijao-carioca', name: 'Feijão Carioca', estimatedKgPerUnit: 1.0, defaultPrice: 7.90 },
        { id: 'chip-feijao-preto', name: 'Feijão Preto', estimatedKgPerUnit: 1.0, defaultPrice: 8.20 },
      ],
      carbs: [
        { id: 'chip-batata-inglesa', name: 'Batata Inglesa', estimatedKgPerUnit: 1.0, defaultPrice: 6.50 },
        { id: 'chip-macarrao', name: 'Macarrão Espaguete', estimatedKgPerUnit: 0.5, defaultPrice: 4.20 },
        { id: 'chip-pao-frances', name: 'Pão Francês', estimatedKgPerUnit: 1.0, defaultPrice: 14.00 },
      ],
      produce: [
        { id: 'chip-banana', name: 'Banana Prata', estimatedKgPerUnit: 1.0, defaultPrice: 5.90, isSeason: true },
        { id: 'chip-laranja', name: 'Laranja Pêra', estimatedKgPerUnit: 1.0, defaultPrice: 4.50, isSeason: true },
        { id: 'chip-maca', name: 'Maçã Gala', estimatedKgPerUnit: 1.0, defaultPrice: 8.90, isSeason: true },
        { id: 'chip-tomate', name: 'Tomate de Salada', estimatedKgPerUnit: 1.0, defaultPrice: 7.90 },
        { id: 'chip-alface', name: 'Alface / Folhas', estimatedKgPerUnit: 0.5, defaultPrice: 4.50 },
      ],
      pantry: [
        { id: 'chip-leite', name: 'Leite UHT Integral', estimatedKgPerUnit: 1.0, defaultPrice: 5.20 },
        { id: 'chip-cafe', name: 'Café Torrado e Moído', estimatedKgPerUnit: 0.5, defaultPrice: 18.90 },
        { id: 'chip-oleo', name: 'Óleo de Soja', estimatedKgPerUnit: 0.9, defaultPrice: 7.50 },
        { id: 'chip-limpeza', name: 'Detergente & Bucha', estimatedKgPerUnit: 1.0, defaultPrice: 12.50 },
      ],
    },
  },
  vegetarian: {
    key: 'vegetarian',
    label: 'Vegetariano (Ovolactovegetariano)',
    description: 'Sem carnes ou peixes; inclui ovos, laticínios, grãos e vegetais.',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    suggestedChips: {
      protein: [
        { id: 'chip-ovos-veg', name: 'Ovos de Galinha', estimatedKgPerUnit: 1.8, defaultPrice: 21.00 },
        { id: 'chip-queijo-minas', name: 'Queijo Minas / Frescal', estimatedKgPerUnit: 0.5, defaultPrice: 24.00 },
        { id: 'chip-lentilha-veg', name: 'Lentilha / Grão-de-Bico', estimatedKgPerUnit: 0.5, defaultPrice: 6.90 },
        { id: 'chip-tofu-veg', name: 'Tofu Orgânico', estimatedKgPerUnit: 0.5, defaultPrice: 16.00 },
        { id: 'chip-proteina-soja', name: 'Proteína Texturizada de Soja', estimatedKgPerUnit: 0.5, defaultPrice: 9.50 },
      ],
      grains: [
        { id: 'chip-arroz-integral-veg', name: 'Arroz Integral', estimatedKgPerUnit: 1.0, defaultPrice: 7.50 },
        { id: 'chip-feijao-carioca-veg', name: 'Feijão Carioca', estimatedKgPerUnit: 1.0, defaultPrice: 7.90 },
        { id: 'chip-quinoa', name: 'Quinoa em Grãos', estimatedKgPerUnit: 0.5, defaultPrice: 14.90 },
      ],
      carbs: [
        { id: 'chip-batata-doce-veg', name: 'Batata Doce / Mandioca', estimatedKgPerUnit: 1.0, defaultPrice: 5.80 },
        { id: 'chip-aveia-veg', name: 'Aveia em Flocos', estimatedKgPerUnit: 0.5, defaultPrice: 6.50 },
        { id: 'chip-pao-integral', name: 'Pão de Fôrma Integral', estimatedKgPerUnit: 0.5, defaultPrice: 8.90 },
      ],
      produce: [
        { id: 'chip-banana-veg', name: 'Banana Prata', estimatedKgPerUnit: 1.0, defaultPrice: 5.90, isSeason: true },
        { id: 'chip-mamao-veg', name: 'Mamão Formosa', estimatedKgPerUnit: 1.0, defaultPrice: 7.90 },
        { id: 'chip-cenoura-veg', name: 'Cenoura & Beterraba', estimatedKgPerUnit: 1.0, defaultPrice: 5.50, isSeason: true },
        { id: 'chip-cogumelos', name: 'Cogumelos Shimeji / Paris', estimatedKgPerUnit: 0.3, defaultPrice: 14.00 },
      ],
      pantry: [
        { id: 'chip-leite-veg', name: 'Leite UHT / Iogurte', estimatedKgPerUnit: 1.0, defaultPrice: 5.20 },
        { id: 'chip-[#E1DBD2]-veg', name: 'Café Torrado', estimatedKgPerUnit: 0.5, defaultPrice: 18.90 },
        { id: 'chip-azeite', name: 'Azeite de Oliva', estimatedKgPerUnit: 0.5, defaultPrice: 32.00 },
        { id: 'chip-limpeza-veg', name: 'Detergente & Bucha', estimatedKgPerUnit: 1.0, defaultPrice: 12.50 },
      ],
    },
  },
  vegan: {
    key: 'vegan',
    label: 'Vegano (100% Vegetal)',
    description: 'Sem nenhum ingrediente de origem animal.',
    badgeColor: 'bg-green-100 text-green-900 border-green-300',
    suggestedChips: {
      protein: [
        { id: 'chip-tofu-v', name: 'Tofu Orgânico', estimatedKgPerUnit: 0.5, defaultPrice: 16.00 },
        { id: 'chip-tempeh-v', name: 'Tempeh / Seitan', estimatedKgPerUnit: 0.4, defaultPrice: 19.00 },
        { id: 'chip-lentilha-v', name: 'Lentilha Vermelha / Verde', estimatedKgPerUnit: 0.5, defaultPrice: 7.50 },
        { id: 'chip-grao-bico-v', name: 'Grão-de-Bico', estimatedKgPerUnit: 0.5, defaultPrice: 8.50 },
        { id: 'chip-pts-v', name: 'Proteína de Soja (PTS)', estimatedKgPerUnit: 0.5, defaultPrice: 9.50 },
      ],
      grains: [
        { id: 'chip-arroz-int-v', name: 'Arroz Integral / Negro', estimatedKgPerUnit: 1.0, defaultPrice: 8.50 },
        { id: 'chip-feijao-preto-v', name: 'Feijão Preto / Azuki', estimatedKgPerUnit: 1.0, defaultPrice: 8.90 },
        { id: 'chip-quinoa-v', name: 'Quinoa / Amaranto', estimatedKgPerUnit: 0.5, defaultPrice: 14.90 },
      ],
      carbs: [
        { id: 'chip-batata-doce-v', name: 'Batata Doce / Inhame', estimatedKgPerUnit: 1.0, defaultPrice: 6.20 },
        { id: 'chip-aveia-v', name: 'Aveia em Flocos sem Glúten', estimatedKgPerUnit: 0.5, defaultPrice: 7.90 },
        { id: 'chip-tapioca-v', name: 'Goma de Tapioca / Mandioca', estimatedKgPerUnit: 1.0, defaultPrice: 8.90 },
      ],
      produce: [
        { id: 'chip-abacate-v', name: 'Abacate / Avocado', estimatedKgPerUnit: 1.0, defaultPrice: 9.50, isSeason: true },
        { id: 'chip-frutas-v', name: 'Banana / Laranja / Maçã', estimatedKgPerUnit: 1.0, defaultPrice: 6.00, isSeason: true },
        { id: 'chip-cogumelo-v', name: 'Cogumelos Shimeji / Hiratake', estimatedKgPerUnit: 0.3, defaultPrice: 14.00 },
        { id: 'chip-folhas-v', name: 'Espinafre / Couve / Alface', estimatedKgPerUnit: 0.5, defaultPrice: 5.00 },
      ],
      pantry: [
        { id: 'chip-leite-aveia-v', name: 'Leite Vegetal (Aveia / Amêndoas)', estimatedKgPerUnit: 1.0, defaultPrice: 12.90 },
        { id: 'chip-[#E1DBD2]-v', name: 'Café Torrado e Moído', estimatedKgPerUnit: 0.5, defaultPrice: 18.90 },
        { id: 'chip-azeite-v', name: 'Azeite de Oliva Extra Virgem', estimatedKgPerUnit: 0.5, defaultPrice: 34.00 },
        { id: 'chip-limpeza-v', name: 'Detergente Ecológico & Bucha', estimatedKgPerUnit: 1.0, defaultPrice: 12.50 },
      ],
    },
  },
  glutenFree: {
    key: 'glutenFree',
    label: 'Sem Glúten (Celíacos)',
    description: 'Foco em alimentos naturalmente isentos de glúten.',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
    suggestedChips: {
      protein: [
        { id: 'chip-frango-gf', name: 'Peito de Frango', estimatedKgPerUnit: 1.0, defaultPrice: 19.90 },
        { id: 'chip-ovos-gf', name: 'Ovos de Galinha', estimatedKgPerUnit: 1.8, defaultPrice: 21.00 },
        { id: 'chip-peixe-gf', name: 'Filé de Tilápia / Peixe', estimatedKgPerUnit: 1.0, defaultPrice: 28.00 },
      ],
      grains: [
        { id: 'chip-arroz-gf', name: 'Arroz Branco / Integral', estimatedKgPerUnit: 5.0, defaultPrice: 29.90 },
        { id: 'chip-feijao-gf', name: 'Feijão Carioca', estimatedKgPerUnit: 1.0, defaultPrice: 7.90 },
      ],
      carbs: [
        { id: 'chip-batata-gf', name: 'Batata Inglesa / Doce', estimatedKgPerUnit: 1.0, defaultPrice: 6.50 },
        { id: 'chip-tapioca-gf', name: 'Goma de Tapioca', estimatedKgPerUnit: 1.0, defaultPrice: 8.90 },
        { id: 'chip-pao-sem-gluten', name: 'Pão de Fôrma Sem Glúten', estimatedKgPerUnit: 0.4, defaultPrice: 18.90 },
      ],
      produce: [
        { id: 'chip-frutas-gf', name: 'Frutas Frescas da Estação', estimatedKgPerUnit: 1.0, defaultPrice: 6.50, isSeason: true },
        { id: 'chip-legumes-gf', name: 'Legumes & Verduras de Feira', estimatedKgPerUnit: 1.0, defaultPrice: 6.00 },
      ],
      pantry: [
        { id: 'chip-leite-gf', name: 'Leite UHT / Sem Lactose', estimatedKgPerUnit: 1.0, defaultPrice: 6.50 },
        { id: 'chip-cafe-gf', name: 'Café Torrado e Moído', estimatedKgPerUnit: 0.5, defaultPrice: 18.90 },
      ],
    },
  },
  regional: {
    key: 'regional',
    label: 'Livre / Regional & Cultural',
    description: 'Riqueza gastronômica e cultural das 5 regiões do Brasil (Norte, Nordeste, Centro-Oeste, Sudeste, Sul).',
    badgeColor: 'bg-purple-50 text-purple-900 border-purple-200',
    suggestedChips: {
      protein: [
        { id: 'chip-peixe-reg', name: 'Tambaqui / Peixe de Água Doce', estimatedKgPerUnit: 1.0, defaultPrice: 28.00 },
        { id: 'chip-carne-sol', name: 'Carne de Sol / Carne Seca', estimatedKgPerUnit: 1.0, defaultPrice: 42.00 },
        { id: 'chip-ovos-reg', name: 'Ovos Caipiras da Colônia', estimatedKgPerUnit: 1.8, defaultPrice: 22.00 },
        { id: 'chip-queijo-coalho', name: 'Queijo Coalho / Canastra', estimatedKgPerUnit: 0.5, defaultPrice: 24.00 },
        { id: 'chip-frango-reg', name: 'Frango Caipira / Galinha', estimatedKgPerUnit: 1.0, defaultPrice: 21.00 },
        { id: 'chip-linguica-artesanal', name: 'Linguiça Artesanal / Colonial', estimatedKgPerUnit: 1.0, defaultPrice: 26.00 },
      ],
      grains: [
        { id: 'chip-arroz-reg', name: 'Arroz da Terra / Agulhinha', estimatedKgPerUnit: 5.0, defaultPrice: 28.00 },
        { id: 'chip-feijao-fradinho', name: 'Feijão Fradinho / Macassar', estimatedKgPerUnit: 1.0, defaultPrice: 8.50 },
        { id: 'chip-feijao-verde', name: 'Feijão Verde / de Corda', estimatedKgPerUnit: 1.0, defaultPrice: 9.50 },
        { id: 'chip-quinoa-reg', name: 'Quinoa / Milho para Cuscus', estimatedKgPerUnit: 0.5, defaultPrice: 6.90 },
        { id: 'chip-lentilha-reg', name: 'Lentilha / Grão-de-Bico', estimatedKgPerUnit: 0.5, defaultPrice: 7.90 },
        { id: 'chip-canjica-milho', name: 'Milho de Pipoca / Canjica', estimatedKgPerUnit: 0.5, defaultPrice: 5.50 },
      ],
      carbs: [
        { id: 'chip-mandioca-reg', name: 'Mandioca / Macaxeira', estimatedKgPerUnit: 1.0, defaultPrice: 5.50 },
        { id: 'chip-farinha-uarini', name: 'Farinha de Mandioca / Uarini', estimatedKgPerUnit: 1.0, defaultPrice: 9.90 },
        { id: 'chip-batata-doce-reg', name: 'Batata Doce Roxa / Inhame', estimatedKgPerUnit: 1.0, defaultPrice: 6.00 },
        { id: 'chip-pinhao-sul', name: 'Pinhão / Polenta de Milho', estimatedKgPerUnit: 1.0, defaultPrice: 12.00 },
        { id: 'chip-mandioquinha', name: 'Mandioquinha / Batata Baroa', estimatedKgPerUnit: 1.0, defaultPrice: 8.90 },
        { id: 'chip-tapioca-reg', name: 'Goma de Tapioca de Feira', estimatedKgPerUnit: 1.0, defaultPrice: 8.90 },
      ],
      produce: [
        { id: 'chip-acai-reg', name: 'Polpa de Açaí Puro / Tucumã', estimatedKgPerUnit: 1.0, defaultPrice: 14.00, isSeason: true },
        { id: 'chip-goiaba-reg', name: 'Goiaba / Taperebá / Frutas da Região', estimatedKgPerUnit: 1.0, defaultPrice: 7.50, isSeason: true },
        { id: 'chip-abobora-cabotia', name: 'Abóbora Cabotiá / Jerimum', estimatedKgPerUnit: 1.0, defaultPrice: 4.80 },
        { id: 'chip-maxixe-quiabo', name: 'Maxixe, Quiabo & Vinagreira', estimatedKgPerUnit: 0.5, defaultPrice: 5.50 },
        { id: 'chip-couve-mineira', name: 'Couve Manteiga / Cheiro Verde', estimatedKgPerUnit: 0.5, defaultPrice: 3.90 },
        { id: 'chip-chuchu-reg', name: 'Chuchu & Chuchu de Feira', estimatedKgPerUnit: 1.0, defaultPrice: 4.20 },
      ],
      pantry: [
        { id: 'chip-cafe-coador', name: 'Café de Coador Regional', estimatedKgPerUnit: 0.5, defaultPrice: 18.90 },
        { id: 'chip-dende-manteiga', name: 'Azeite de Dendê / Manteiga de Garrafa', estimatedKgPerUnit: 0.5, defaultPrice: 16.50 },
        { id: 'chip-temperos-reg', name: 'Temperos Regionais (Coentro, Colorau)', estimatedKgPerUnit: 0.3, defaultPrice: 6.00 },
        { id: 'chip-rapadura', name: 'Rapadura / Mascavo / Melado', estimatedKgPerUnit: 0.5, defaultPrice: 8.00 },
        { id: 'chip-leite-reg', name: 'Leite Fresco da Colônia', estimatedKgPerUnit: 1.0, defaultPrice: 5.50 },
        { id: 'chip-sabao-limpeza', name: 'Detergente & Bucha Vegetal', estimatedKgPerUnit: 1.0, defaultPrice: 11.00 },
      ],
    },
  },
};
