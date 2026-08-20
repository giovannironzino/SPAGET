import fs from 'fs';
import path from 'path';

interface FoodItem {
  id: string;
  name: string;
  category: string;
  rawName?: string;
  guideGroup?: string;
  functionalRoles?: string[];
  [key: string]: any;
}

const foodsFilePath = path.join(process.cwd(), 'src', 'data', 'canonicalIbgeFoods.json');
const reviewQueuePath = path.join(process.cwd(), 'src', 'data', 'foodKnowledge', 'taxonomyReviewQueue.json');

const foods: FoodItem[] = JSON.parse(fs.readFileSync(foodsFilePath, 'utf8'));

const reviewQueue: Array<{ id: string; name: string; reason: string }> = [];

function classifyFood(food: FoodItem): { guideGroup: string; functionalRoles: string[]; highConfidence: boolean } {
  const name = (food.name || '').toLowerCase();
  const raw = (food.rawName || '').toLowerCase();
  const cat = (food.category || '').toLowerCase();
  const combined = `${name} ${raw} ${cat}`;

  // 1. Feijões e Leguminosas
  if (
    combined.includes('feijão') ||
    combined.includes('feijao') ||
    combined.includes('grão-de-bico') ||
    combined.includes('grao de bico') ||
    combined.includes('lentilha') ||
    combined.includes('soja') ||
    combined.includes('ervilha')
  ) {
    return { guideGroup: 'feijoes', functionalRoles: ['proteico_vegetal'], highConfidence: true };
  }

  // 2. Raízes e Tubérculos
  if (
    combined.includes('mandioca') ||
    combined.includes('aipim') ||
    combined.includes('macaxeira') ||
    combined.includes('batata') ||
    combined.includes('inhame') ||
    combined.includes('cará') ||
    combined.includes('cara')
  ) {
    return { guideGroup: 'raizes_tuberculos', functionalRoles: ['energetico_raiz'], highConfidence: true };
  }

  // 3. Cereais e Grãos Energéticos
  if (
    combined.includes('arroz') ||
    combined.includes('milho') ||
    combined.includes('aveia') ||
    combined.includes('trigo') ||
    combined.includes('macarrão') ||
    combined.includes('macarrao') ||
    combined.includes('cuscuz') ||
    combined.includes('pão') ||
    combined.includes('pao') ||
    combined.includes('farinha') ||
    combined.includes('tapioca') ||
    combined.includes('biscoito') ||
    combined.includes('polvilho') ||
    cat === 'carbs' ||
    cat === 'grains'
  ) {
    return { guideGroup: 'cereais', functionalRoles: ['energetico_cereal'], highConfidence: true };
  }

  // 4. Carnes e Ovos
  if (
    combined.includes('frango') ||
    combined.includes('galinha') ||
    combined.includes('boi') ||
    combined.includes('carne') ||
    combined.includes('bovina') ||
    combined.includes('bife') ||
    combined.includes('alcatra') ||
    combined.includes('patinho') ||
    combined.includes('porco') ||
    combined.includes('suína') ||
    combined.includes('suina') ||
    combined.includes('peixe') ||
    combined.includes('tilápia') ||
    combined.includes('sardinha') ||
    combined.includes('atum') ||
    combined.includes('camarão') ||
    combined.includes('ovo') ||
    combined.includes('ovos') ||
    cat === 'protein'
  ) {
    return { guideGroup: 'carnes_ovos', functionalRoles: ['proteico_animal'], highConfidence: true };
  }

  // 5. Leite e Queijos
  if (
    combined.includes('leite') ||
    combined.includes('queijo') ||
    combined.includes('iogurte') ||
    combined.includes('coalhada') ||
    combined.includes('requeijão') ||
    combined.includes('requeijao')
  ) {
    return { guideGroup: 'leite_queijos', functionalRoles: ['lacteo'], highConfidence: true };
  }

  // 6. Castanhas e Nozes (Oleaginosas)
  if (
    combined.includes('castanha') ||
    combined.includes('noz') ||
    combined.includes('nozes') ||
    combined.includes('amendoim') ||
    combined.includes('chia') ||
    combined.includes('linhaça') ||
    combined.includes('linhaca') ||
    combined.includes('semente')
  ) {
    return { guideGroup: 'castanhas_nozes', functionalRoles: ['oleaginosa'], highConfidence: true };
  }

  // 7. Frutas
  if (
    combined.includes('banana') ||
    combined.includes('maçã') ||
    combined.includes('maca') ||
    combined.includes('laranja') ||
    combined.includes('mamão') ||
    combined.includes('mamao') ||
    combined.includes('melancia') ||
    combined.includes('uva') ||
    combined.includes('manga') ||
    combined.includes('abacaxi') ||
    combined.includes('limão') ||
    combined.includes('limao') ||
    combined.includes('morango') ||
    combined.includes('goiaba') ||
    combined.includes('maracujá') ||
    combined.includes('caju') ||
    combined.includes('abacate')
  ) {
    return { guideGroup: 'frutas', functionalRoles: ['fruta'], highConfidence: true };
  }

  // 8. Legumes e Verduras (Hortaliças)
  if (
    combined.includes('alface') ||
    combined.includes('couve') ||
    combined.includes('tomate') ||
    combined.includes('cenoura') ||
    combined.includes('abóbora') ||
    combined.includes('abobora') ||
    combined.includes('chuchu') ||
    combined.includes('abobrinha') ||
    combined.includes('quiabo') ||
    combined.includes('espinafre') ||
    combined.includes('brócolis') ||
    combined.includes('brocolis') ||
    combined.includes('repolho') ||
    combined.includes('pepino') ||
    combined.includes('cebola') ||
    combined.includes('alho') ||
    combined.includes('pimentão') ||
    combined.includes('pimentao') ||
    cat === 'produce'
  ) {
    return { guideGroup: 'legumes_verduras', functionalRoles: ['hortalica'], highConfidence: true };
  }

  // 9. Água, Chás e Bebidas Base
  if (
    combined.includes('água') ||
    combined.includes('agua') ||
    combined.includes('café') ||
    combined.includes('cafe') ||
    combined.includes('chá') ||
    combined.includes('cha')
  ) {
    return { guideGroup: 'agua', functionalRoles: ['liquido_base'], highConfidence: true };
  }

  // Fallback seguro
  return { guideGroup: 'cereais', functionalRoles: ['energetico_cereal'], highConfidence: false };
}

let taggedCount = 0;
const enrichedFoods = foods.map((f) => {
  const { guideGroup, functionalRoles, highConfidence } = classifyFood(f);
  if (!highConfidence) {
    reviewQueue.push({ id: f.id, name: f.name, reason: 'Classificado via fallback' });
  }
  taggedCount++;
  return {
    ...f,
    guideGroup,
    functionalRoles,
  };
});

fs.writeFileSync(foodsFilePath, JSON.stringify(enrichedFoods, null, 2), 'utf8');

const reviewDir = path.dirname(reviewQueuePath);
if (!fs.existsSync(reviewDir)) {
  fs.mkdirSync(reviewDir, { recursive: true });
}
fs.writeFileSync(reviewQueuePath, JSON.stringify(reviewQueue, null, 2), 'utf8');

console.log(`Sucesso: ${taggedCount} alimentos tagueados com os 9 Grupos do Guia MS e Papéis Funcionais.`);
console.log(`Itens na fila de revisão: ${reviewQueue.length}`);
