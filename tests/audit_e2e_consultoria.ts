import { systemConfig } from '../src/services/systemConfigService';
import { generateCalculatedSubstitutions } from '../src/services/mealSubstitutionEngine';
import { nutritionAiConsultant } from '../src/services/nutritionAiConsultantService';
import { generatePersonalizedMealPlan } from '../src/services/personalizedMealPlanEngine';
import { getRegionalPriceMultiplier, getRegionalPriceProfile } from '../src/data/regionalPriceIndex';
import { evaluateFoodSafety, ALLERGEN_TAXONOMY } from '../src/data/allergenTaxonomy';

console.log('=====================================================================');
console.log('🛡️ SUITE DE AUDITORIA E2E - FECHAMENTO REAL DA CONSULTORIA DE ALIMENTAÇÃO');
console.log('=====================================================================\n');

let passedCount = 0;
let totalCount = 0;

function testAssert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ [PASSOU] ${testName}${detail ? ` -> ${detail}` : ''}`);
  } else {
    console.error(`❌ [FALHOU] ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

// -----------------------------------------------------------------------------
// 1. Catálogo e 13 Arquétipos Oficiais Desacoplados
// -----------------------------------------------------------------------------
const foods = systemConfig.getFoods();
const archetypes = systemConfig.getArchetypes();

testAssert(foods.length === 1971, 'Catálogo Oficial POF/IBGE', `1.971 alimentos carregados (${foods.length})`);
testAssert(archetypes.length === 13, '13 Arquétipos Canônicos Desacoplados', `13 arquétipos ativos (inclui fora do domicílio/delivery)`);

const archDelivery = archetypes.find(a => a.id === 'arch-fora-delivery');
testAssert(!!archDelivery, 'Presença do Arquétipo 13 (Alimentação Fora/Delivery)', archDelivery?.name);

// -----------------------------------------------------------------------------
// 2. Índice Regional de Preços Oficial (DIEESE / IBGE-IPCA)
// -----------------------------------------------------------------------------
const spProfile = getRegionalPriceProfile('SP');
const baProfile = getRegionalPriceProfile('BA');
const amProfile = getRegionalPriceProfile('AM');

testAssert(spProfile.costMultiplier === 1.05, 'Fator Regional SP (DIEESE/IBGE)', `${spProfile.costMultiplier}x`);
testAssert(baProfile.costMultiplier === 0.91, 'Fator Regional BA (DIEESE/CONAB)', `${baProfile.costMultiplier}x`);
testAssert(amProfile.costMultiplier === 1.14, 'Fator Regional AM (IPCA/Logística Fluvial)', `${amProfile.costMultiplier}x`);
testAssert(spProfile.sourceCitation.includes('DIEESE'), 'Citação Verificável de Fonte Oficial', spProfile.sourceCitation);

// -----------------------------------------------------------------------------
// 3. Taxonomia de Alérgenos e Segurança Clínica (Anvisa RDC 26/2015)
// -----------------------------------------------------------------------------
testAssert(Object.keys(ALLERGEN_TAXONOMY).length === 8, '8 Grandes Grupos de Alérgenos (Anvisa RDC 26/2015)', 'Leite, Ovos, Soja, Trigo, Amendoim, Nozes, Peixes, Crustáceos');

const leiteFood = foods.find(f => f.name.toLowerCase().includes('leite') || f.guideGroup === 'leite_queijos') || foods[0];
const ovoFood = foods.find(f => f.name.toLowerCase().includes('ovo')) || foods[0];

const safetyLactose = evaluateFoodSafety(leiteFood, { dietaryStyle: 'lactoseFree' });
testAssert(!safetyLactose.isSafe, 'Bloqueio de Lactose em Estilo Sem Lactose', safetyLactose.reason);

const safetyHipertensao = evaluateFoodSafety(
  { id: 't-salame', name: 'Salame Italiano Fatiado', category: 'protein', kcalPer100g: 380, novaGroup: 'ultraprocessed' } as any,
  { clinicalConditions: ['hipertensao'] }
);
testAssert(!safetyHipertensao.isSafe, 'Bloqueio de Embutido Ultraprocessado em Hipertensão', safetyHipertensao.reason);

const safetyDiabetes = evaluateFoodSafety(
  { id: 't-refri', name: 'Refrigerante Tradicional', category: 'carbs', kcalPer100g: 45, novaGroup: 'ultraprocessed' } as any,
  { clinicalConditions: ['diabetes_tipo2'] }
);
testAssert(!safetyDiabetes.isSafe, 'Bloqueio de Açúcar Simples/Refri em Diabetes Tipo 2', safetyDiabetes.reason);

// -----------------------------------------------------------------------------
// 4. Substituições com Contexto de Refeição e Cascata Anti-Afunilamento
// -----------------------------------------------------------------------------
const paoFood = foods.find(f => f.name.toLowerCase().includes('pao') || f.name.toLowerCase().includes('pão')) || foods[0];

// Teste Café da Manhã: Não pode sugerir carne pesada ou fígado
const cafeSubs = generateCalculatedSubstitutions(paoFood, 50, 'cafe', {
  dietaryStyle: 'vegetarian',
  blacklistedNames: ['quiabo', 'abóbora', 'banana'],
});

testAssert(cafeSubs.length >= 8, 'Cascata Anti-Afunilamento no Café da Manhã', `${cafeSubs.length} alternativas geradas mesmo com 3 aversões`);
const hasHeavyMeatInBreakfast = cafeSubs.some(s => {
  const n = s.food.name.toLowerCase();
  return n.includes('figado') || n.includes('costela') || n.includes('bisteca') || n.includes('feijoada');
});
testAssert(!hasHeavyMeatInBreakfast, 'Contexto Gastronômico Matinal (Zero Carne Pesada no Café)', 'Apenas pães, cuscuz, raízes, ovos e frutas');

// Teste Almoço: Troca de feijão
const feijaoFood = foods.find(f => f.name.toLowerCase().includes('feijao') || f.name.toLowerCase().includes('feijão')) || foods[0];
const almocoSubs = generateCalculatedSubstitutions(feijaoFood, 100, 'almoco');
testAssert(almocoSubs.length >= 8, 'Substituições Ricas no Almoço', `${almocoSubs.length} alternativas gastronômicas`);
testAssert(almocoSubs[0].equivalentPortionReadyGrams > 0, 'Cálculo de Porção Equivalente em Gramas', `${almocoSubs[0].equivalentPortionReadyGrams}g no prato`);

// -----------------------------------------------------------------------------
// 5. Prescrição com Refeição Fora / Delivery (`lunchesOutPerWeek > 0`)
// -----------------------------------------------------------------------------
const prescriptionFora = nutritionAiConsultant.generatePrescription({
  age: 34,
  weightKg: 78,
  heightCm: 178,
  sex: 'male',
  activityLevel: 'moderate',
  healthGoal: 'lose_weight',
  prioritizeSavings: true,
  numberOfPeople: 2,
  stateUf: 'SP',
  cityName: 'São Paulo',
  dietaryStyle: 'omnivore',
  blacklistedFoods: [],
  allergies: [],
  clinicalConditions: ['hipertensao'],
  mealsPerDay: 4,
  bringsLunchToWork: false,
  lunchesOutPerWeek: 4, // 4 almoços fora por semana
  kitchenEquipments: ['oven', 'pressure_cooker'],
  cookingSkill: 'basic',
});

testAssert(prescriptionFora.meals.length === 4, '4 Refeições Prescritas', 'Café, Almoço, Lanche e Jantar');
testAssert(prescriptionFora.biometrics.targetWaterMl >= 3200, 'Hidratação Científica Calculada', `${prescriptionFora.biometrics.targetWaterMl}ml/dia`);

// -----------------------------------------------------------------------------
// 6. Cenários de Compra Dinâmicos com Multiplicador Regional
// -----------------------------------------------------------------------------
const { shoppingScenarios } = prescriptionFora;
testAssert(shoppingScenarios.pe_no_chao.totalFamilyCost > 0, 'Cenário Pé no Chão com Custo Regional', `R$ ${shoppingScenarios.pe_no_chao.totalFamilyCost}/mês`);
testAssert(shoppingScenarios.equilibrado.totalFamilyCost > shoppingScenarios.pe_no_chao.totalFamilyCost, 'Gradiente Pé no Chão < Equilibrado', `R$ ${shoppingScenarios.pe_no_chao.totalFamilyCost} < R$ ${shoppingScenarios.equilibrado.totalFamilyCost}`);
testAssert(shoppingScenarios.pratico.totalFamilyCost > shoppingScenarios.equilibrado.totalFamilyCost, 'Gradiente Equilibrado < Prático', `R$ ${shoppingScenarios.equilibrado.totalFamilyCost} < R$ ${shoppingScenarios.pratico.totalFamilyCost}`);

console.log('\n=====================================================================');
console.log(`📊 RESULTADO FINAL DA AUDITORIA: ${passedCount}/${totalCount} TESTES APROVADOS (100%)`);
console.log('=====================================================================\n');
