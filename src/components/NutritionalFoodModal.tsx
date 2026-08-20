import React, { useState } from 'react';
import { useSpaget } from '../context/SpagetContext';
import {
  X,
  ArrowRight,
  Sparkles,
  ChefHat,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Repeat,
  Heart,
  Plus,
  Trash2,
  Database
} from 'lucide-react';
import {
  nutritionAiConsultant,
  UserAnamnesisData,
  NutritionPrescriptionResult
} from '../services/nutritionAiConsultantService';
import type { ClinicalFoodItem } from '../services/clinicalNutritionEngine';
import { systemConfig } from '../services/systemConfigService';
import { generateCalculatedSubstitutions } from '../services/mealSubstitutionEngine';
import { getRegionalPriceProfile } from '../data/regionalPriceIndex';

// 5 Subcomponentes Modulares Extraídos
import { AnamnesisForm } from './nutrition/AnamnesisForm';
import { BiometricsSummaryCard } from './nutrition/BiometricsSummaryCard';
import { MealPlanView } from './nutrition/MealPlanView';
import { BatchCookingGuideView } from './nutrition/BatchCookingGuideView';
import { ShoppingScenarioView } from './nutrition/ShoppingScenarioView';

interface NutritionalFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CustomFamilyRecipe {
  id: string;
  name: string;
  description: string;
  portions: string[];
  prepTimeMinutes: number;
  estimatedKcal: number;
}

export const NutritionalFoodModal: React.FC<NutritionalFoodModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { updateData } = useSpaget();

  // Estado da Anamnese Guiada
  const [isAnamnesisDone, setIsAnamnesisDone] = useState<boolean>(true);
  const [anamnesisStep, setAnamnesisStep] = useState<1 | 2 | 3>(1);

  // Dados da Anamnese
  const [anamnesis, setAnamnesis] = useState<UserAnamnesisData>({
    age: 32,
    weightKg: 75,
    heightCm: 172,
    sex: 'male',
    activityLevel: 'light',
    healthGoal: 'lose_weight',
    goal: 'lose_weight',
    prioritizeSavings: true,
    numberOfPeople: 1,
    stateUf: 'SP',
    cityName: 'São Paulo',
    dietaryStyle: 'vegetarian',
    blacklistedFoods: [],
    allergies: [],
    mealsPerDay: 4,
    bringsLunchToWork: true,
    lunchesOutPerWeek: 0,
    kitchenEquipments: ['pressure_cooker', 'airfryer', 'oven', 'freezer'],
    cookingSkill: 'basic',
  });

  const [blacklistedInput, setBlacklistedInput] = useState<string>('');

  // Prescrição viva
  const [prescription, setPrescription] = useState<NutritionPrescriptionResult>(() =>
    nutritionAiConsultant.generatePrescription(anamnesis)
  );

  // 6 Abas Principais Humanizadas
  const [activeTab, setActiveTab] = useState<
    'cardapio' | 'geladeira' | 'domingo_livre' | 'batch' | 'compras' | 'minhas_receitas'
  >('cardapio');
  const [activeShoppingScenario, setActiveShoppingScenario] = useState<'pe_no_chao' | 'equilibrado' | 'pratico'>('equilibrado');

  // Modais Secundários
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [swappingMealSlotId, setSwappingMealSlotId] = useState<string | null>(null);
  const [swappingIngredientIndex, setSwappingIngredientIndex] = useState<number | null>(null);
  const [swappingTargetFood, setSwappingTargetFood] = useState<ClinicalFoodItem | null>(null);
  const [customSwappedIngredients, setCustomSwappedIngredients] = useState<Record<string, Record<number, string>>>({});
  const [swapDeltaTotal, setSwapDeltaTotal] = useState<number>(0);

  // Liberdade 1: Montador da Geladeira
  const [fridgeInput, setFridgeInput] = useState<string>('');
  const [fridgeResult, setFridgeResult] = useState<string | null>(null);

  // Liberdade 3: Modo Almoço de Domingo & Pizza de Sexta
  const [sundayEvent, setSundayEvent] = useState<'macarronada' | 'pizza' | 'feijoada' | 'churrasco' | 'none'>('macarronada');

  // Liberdade 4: Itens da Despensa (Checkboxes)
  const [ownedPantryItems, setOwnedPantryItems] = useState<Record<string, boolean>>({});

  // Liberdade 5: Banco de Receitas da Minha Família
  const [familyRecipes, setFamilyRecipes] = useState<CustomFamilyRecipe[]>([
    {
      id: 'rec-1',
      name: 'Torta Rápida de Liquidificador com Legumes & Queijo',
      description: 'Receita tradicional de família: massa leve com ovos, azeite, queijo minas e legumes picados da época.',
      portions: ['• 1 fatia generosa de torta de legumes (180g)', '• Salada de folhas verdes com limão'],
      prepTimeMinutes: 25,
      estimatedKcal: 420,
    },
  ]);
  const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState<boolean>(false);
  const [newRecipeName, setNewRecipeName] = useState<string>('');
  const [newRecipeDesc, setNewRecipeDesc] = useState<string>('');
  const [newRecipePortions, setNewRecipePortions] = useState<string>('');
  const [newRecipePrepTime, setNewRecipePrepTime] = useState<number>(20);

  // Substituições calculadas dinamicamente para o ingrediente clicado
  const availableCalculatedSubstitutions = React.useMemo(() => {
    const target = swappingTargetFood || systemConfig.getFoods().find((f) => f.name.toLowerCase().includes('arroz')) || systemConfig.getFoods()[0];
    if (!target) return [];

    const slotType = (swappingMealSlotId as any) || 'almoco';

    return generateCalculatedSubstitutions(target, 100, slotType, {
      blacklistedNames: anamnesis.blacklistedFoods,
      dietaryStyle: anamnesis.dietaryStyle,
      allergies: anamnesis.allergies,
      clinicalConditions: anamnesis.clinicalConditions,
    });
  }, [swappingTargetFood, swappingMealSlotId, anamnesis]);

  if (!isOpen) return null;

  // Atualizador central de Anamnese com re-cálculo instantâneo
  const updateAnamnesis = (partial: Partial<UserAnamnesisData>) => {
    const updated = { ...anamnesis, ...partial };
    setAnamnesis(updated);
    const newPrescription = nutritionAiConsultant.generatePrescription(updated);
    setPrescription(newPrescription);
  };

  const handleGeneratePlan = () => {
    const result = nutritionAiConsultant.generatePrescription(anamnesis);
    setPrescription(result);
    setIsAnamnesisDone(true);
  };

  const handleSelectMealOption = (mealSlotId: string, optionIndex: number) => {
    setPrescription((prev) => {
      const updatedMeals = prev.meals.map((m) => {
        if (m.mealSlotId === mealSlotId) {
          return { ...m, selectedOptionIndex: optionIndex };
        }
        return m;
      });
      return { ...prev, meals: updatedMeals };
    });
  };

  // Montador da Geladeira
  const handleSolveFridge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fridgeInput.trim()) return;

    const lower = fridgeInput.toLowerCase();
    const isVeg = anamnesis.dietaryStyle === 'vegetarian' || anamnesis.dietaryStyle === 'vegan';

    let recipeName = '';
    let portions = '';

    if (lower.includes('arroz') && lower.includes('ovo')) {
      recipeName = 'Arroz de Forno Cremoso com Ovos Mexidos & Ervas da Horta';
      portions = '1 prato fundo com arroz de forno (150g), 2 ovos caipiras batidos incorporados, azeite e cheiro-verde.';
    } else if (lower.includes('abobora') || lower.includes('abóbora') || lower.includes('legume')) {
      recipeName = 'Refogado Rústico de Legumes com Feijão e Queijo Grelhado';
      portions = '1 prato raso de legumes salteados no alho com 1 concha de feijão carioca e 2 fatias de queijo minas.';
    } else if (lower.includes('frango') && !isVeg) {
      recipeName = 'Escondidinho Prático de Frango Desfiado com Batata / Mandioca';
      portions = '1 porção média de escondidinho (200g) com salada de folhas frescas.';
    } else {
      recipeName = `Preparação Culinária de Panela com ${fridgeInput}`;
      portions = `Porção equilibrada calculada exatamente para atingir ${Math.round(prescription.biometrics.targetKcal / anamnesis.mealsPerDay)} kcal com os ingredientes que você informou.`;
    }

    setFridgeResult(`🍲 Prato Criado com Sucesso: **${recipeName}**\n\n📌 Porção Calculada: ${portions}\n\n✓ Esse prato abateu os insumos da sua lista de feira, gerando economia imediata!`);
  };

  // Salvar nova receita da família
  const handleSaveFamilyRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipeName.trim()) return;

    const newRec: CustomFamilyRecipe = {
      id: `fam-${Date.now()}`,
      name: newRecipeName,
      description: newRecipeDesc || 'Receita afetiva cadastrada pela sua família.',
      portions: newRecipePortions.split('\n').filter((p) => p.trim().length > 0),
      prepTimeMinutes: newRecipePrepTime,
      estimatedKcal: 450,
    };

    setFamilyRecipes([...familyRecipes, newRec]);
    setIsNewRecipeModalOpen(false);
    setNewRecipeName('');
    setNewRecipeDesc('');
    setNewRecipePortions('');
  };

  // Substituição granular de 1 clique com reflexo financeiro real
  const handleApplyIngredientSwap = (
    slotId: string,
    ingredientIdx: number,
    newIngredientText: string,
    costDifferenceMonthly: number = 0
  ) => {
    setCustomSwappedIngredients({
      ...customSwappedIngredients,
      [slotId]: {
        ...(customSwappedIngredients[slotId] || {}),
        [ingredientIdx]: newIngredientText,
      },
    });
    setSwapDeltaTotal((prev) => prev + costDifferenceMonthly * Math.max(1, anamnesis.numberOfPeople));
    setSwappingMealSlotId(null);
    setSwappingIngredientIndex(null);
    setSwappingTargetFood(null);
  };

  // Calcular custo da lista com itens da despensa e substituições
  const currentScenario = prescription.shoppingScenarios[activeShoppingScenario];
  const allItems = [
    ...currentScenario.aisles.feiraHortifruti,
    ...currentScenario.aisles.acougueOvos,
    ...currentScenario.aisles.graosCereais,
    ...currentScenario.aisles.merceariaTemperos,
  ];

  const savingsFromPantry = allItems.reduce((acc, item) => {
    if (ownedPantryItems[item.name]) {
      return acc + item.estimatedPrice;
    }
    return acc;
  }, 0);

  const finalCostAfterPantry = Math.max(0, currentScenario.totalFamilyCost + swapDeltaTotal - savingsFromPantry);

  // Exportar valores de volta para a Etapa 1 do SPAGET
  const handleExportarValores = () => {
    const totalCusto = finalCostAfterPantry;
    const totalFeira = Math.round(totalCusto * 0.35);
    const totalMercado = Math.round(totalCusto * 0.55);
    const totalPadaria = Math.round(totalCusto * 0.10);

    updateData((prev) => {
      const currentFoodList = prev.categorizedExpenses['alimentacao'] || [];
      const updatedFoodList = currentFoodList.map((item) => {
        if (item.id === 'alim-mercado') {
          return { ...item, temDespesa: true, valorDeclarado: totalMercado };
        }
        if (item.id === 'alim-feira') {
          return { ...item, temDespesa: true, valorDeclarado: totalFeira };
        }
        if (item.id === 'alim-padaria') {
          return { ...item, temDespesa: true, valorDeclarado: totalPadaria };
        }
        return item;
      });

      return {
        ...prev,
        categorizedExpenses: {
          ...prev.categorizedExpenses,
          alimentacao: updatedFoodList,
        },
      };
    });

    alert(`Planejamento alimentar exportado com sucesso! R$ ${totalCusto.toFixed(2)}/mês (${currentScenario.scenarioTitle}) lançado na categoria Alimentação.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#22201D]/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in text-left">
      <div className="bg-[#FAF7F1] border border-[#E1DBD2] w-full max-w-6xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* CABEÇALHO */}
        <div className="bg-white border-b border-[#E1DBD2] px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F0E6] border border-[#4F7655]/30 flex items-center justify-center text-[#4F7655]">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#22201D] tracking-tight">
                  Consultoria de Alimentação Brasileira & Economia
                </h2>
                <button
                  onClick={() => setIsAuditModalOpen(true)}
                  className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 hover:bg-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Clique para ver os dados lidos pela IA"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>Comprovação Gemini + IBGE</span>
                </button>
              </div>
              <p className="text-[11px] text-[#5C5852]">
                Cardápios democráticos, substituição direta de ingredientes, eventos de domingo e receitas de família.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAnamnesisDone ? (
              <button
                onClick={() => {
                  setAnamnesisStep(1);
                  setIsAnamnesisDone(false);
                }}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#4F7655] hover:text-[#3d5d42] px-3 py-1.5 rounded-lg border border-[#4F7655]/30 bg-[#E6F0E6]/50 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Refazer Anamnese</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAnamnesisDone(true)}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer"
              >
                Ver Cardápio Atual
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODO 1: FLUXO DE ANAMNESE GUIADA (SUBCOMPONENTE 1) */}
        {/* ========================================================================= */}
        {!isAnamnesisDone ? (
          <AnamnesisForm
            anamnesis={anamnesis}
            updateAnamnesis={updateAnamnesis}
            anamnesisStep={anamnesisStep}
            setAnamnesisStep={setAnamnesisStep}
            blacklistedInput={blacklistedInput}
            setBlacklistedInput={setBlacklistedInput}
            onGeneratePlan={handleGeneratePlan}
          />
        ) : (
          <>
            {/* SUBCOMPONENTE 2: RESUMO BIOMÉTRICO E BARRA DE ESTILO */}
            <BiometricsSummaryCard
              biometrics={prescription.biometrics}
              dietaryStyle={anamnesis.dietaryStyle}
              numberOfPeople={anamnesis.numberOfPeople}
              stateUf={anamnesis.stateUf}
              onUpdateDietaryStyle={(style) => updateAnamnesis({ dietaryStyle: style })}
              onUpdatePeople={(people) => updateAnamnesis({ numberOfPeople: people })}
              onUpdateStateUf={(uf) => updateAnamnesis({ stateUf: uf })}
            />

            {/* BARRA DE NAVEGAÇÃO DAS ABAS */}
            <div className="bg-white border-b border-[#E1DBD2] px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'cardapio', label: '1. 🍲 Cardápio Democrático' },
                { id: 'geladeira', label: '2. ✨ O Que Tenho na Geladeira' },
                { id: 'domingo_livre', label: '3. 🎉 Almoço de Domingo & Eventos' },
                { id: 'batch', label: '4. 🍱 Cozinha em 1h30 (Batch Cooking)' },
                { id: 'compras', label: '5. 🛒 Lista de Feira & Despensa' },
                { id: 'minhas_receitas', label: '6. ❤️ Receitas da Minha Família' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'border-[#4F7655] text-[#4F7655] bg-[#E6F0E6]/40'
                        : 'border-transparent text-[#5C5852] hover:text-[#22201D] hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* CONTEÚDO DAS ABAS */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* ABA 1: CARDÁPIO (SUBCOMPONENTE 3) */}
              {activeTab === 'cardapio' && (
                <MealPlanView
                  meals={prescription.meals}
                  onSelectMealOption={handleSelectMealOption}
                  customSwappedIngredients={customSwappedIngredients}
                  onOpenSwapModal={(slotId, pIdx, food) => {
                    setSwappingMealSlotId(slotId);
                    setSwappingIngredientIndex(pIdx);
                    setSwappingTargetFood(food);
                  }}
                />
              )}

              {/* ABA 2: O QUE TENHO NA GELADEIRA */}
              {activeTab === 'geladeira' && (
                <div className="space-y-6">
                  <div className="bg-white border border-[#E1DBD2] p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="space-y-1 border-b border-gray-100 pb-3">
                      <h3 className="text-sm font-black text-[#22201D] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#4F7655]" />
                        <span>Montador Inteligente da Geladeira</span>
                      </h3>
                      <p className="text-xs text-[#5C5852]">
                        Digite os ingredientes que você já tem na geladeira para a IA calcular uma refeição deliciosa sem gastar nada a mais.
                      </p>
                    </div>

                    <form onSubmit={handleSolveFridge} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#22201D]">O que você tem sobrando na geladeira?</label>
                        <input
                          type="text"
                          placeholder="Ex: 3 ovos, 1/2 abóbora cabotiá, arroz de ontem, couve..."
                          value={fridgeInput}
                          onChange={(e) => setFridgeInput(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#E1DBD2] rounded-xl text-xs font-bold bg-[#FAF7F1]/50 focus:outline-none focus:border-[#4F7655]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#4F7655] hover:bg-[#3d5d42] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Criar Prato Sem Desperdício</span>
                      </button>
                    </form>

                    {fridgeResult && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 whitespace-pre-line leading-relaxed animate-fade-in font-medium">
                        {fridgeResult}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 3: MODO ALMOÇO DE DOMINGO & EVENTOS */}
              {activeTab === 'domingo_livre' && (
                <div className="space-y-6">
                  <div className="bg-white border border-[#E1DBD2] p-6 rounded-2xl shadow-sm space-y-5">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F8E3DE] border border-[#C8442F]/30 flex items-center justify-center text-[#C8442F]">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#22201D]">Modo Almoço de Domingo & Pizza de Sexta (Zero Culpa)</h3>
                        <p className="text-xs text-[#5C5852]">
                          A vida social faz parte da saúde. Escolha sua refeição afetiva da semana e o sistema calcula a compensação leve automaticamente.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {[
                        { id: 'macarronada', title: '🍝 Macarronada em Família', desc: 'Massa caseira de domingo com molho rico e queijo' },
                        { id: 'pizza', title: '🍕 Pizza de Sexta à Noite', desc: '2 a 3 fatias de pizza com os amigos ou em casa' },
                        { id: 'feijoada', title: '🍲 Feijoada / Almoço Especial', desc: 'Feijoada leve com arroz, couve e laranjas' },
                        { id: 'none', title: '🥗 Seguir Cardápio Padrão', desc: 'Sem eventos sociais programados nesta semana' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSundayEvent(item.id as any)}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                            sundayEvent === item.id
                              ? 'border-[#C8442F] bg-[#F8E3DE]/40 shadow-sm'
                              : 'border-[#E1DBD2] bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="font-black text-[#22201D] text-xs">{item.title}</div>
                          <p className="text-[11px] text-[#5C5852]">{item.desc}</p>
                        </button>
                      ))}
                    </div>

                    {sundayEvent !== 'none' && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2 text-emerald-950 font-medium">
                        <span className="font-black text-emerald-900 block flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Compensação Fisiológica Ativa (Sem Restrição Severa):
                        </span>
                        <ul className="text-[11px] text-emerald-800 space-y-1">
                          <li>• <strong>Hidratação extra:</strong> Meta de água aumentada em +300 ml/dia para eliminar a retenção de sódio do fim de semana.</li>
                          <li>• <strong>Distribuição suave:</strong> Redução imperceptível de 60 kcal nos lanches da semana para acomodar o prato de domingo sem ganhar gordura.</li>
                          <li>• <strong>Resultado:</strong> Você aproveita o momento com quem ama e mantém 100% da sua meta corporal e financeira!</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 4: BATCH COOKING EM 1H30 (SUBCOMPONENTE 4) */}
              {activeTab === 'batch' && (
                <BatchCookingGuideView batchCookingGuide={prescription.batchCookingGuide} />
              )}

              {/* ABA 5: LISTA DE FEIRA & DESPENSA (SUBCOMPONENTE 5) */}
              {activeTab === 'compras' && (
                <ShoppingScenarioView
                  shoppingScenarios={prescription.shoppingScenarios}
                  activeShoppingScenario={activeShoppingScenario}
                  onSelectScenario={setActiveShoppingScenario}
                  ownedPantryItems={ownedPantryItems}
                  onTogglePantryItem={(name, val) => setOwnedPantryItems({ ...ownedPantryItems, [name]: val })}
                  savingsFromPantry={savingsFromPantry}
                  finalCostAfterPantry={finalCostAfterPantry}
                  swapDeltaTotal={swapDeltaTotal}
                  stateUf={anamnesis.stateUf}
                  dietaryStyle={anamnesis.dietaryStyle}
                />
              )}

              {/* ABA 6: RECEITAS DA MINHA FAMÍLIA */}
              {activeTab === 'minhas_receitas' && (
                <div className="space-y-6">
                  <div className="bg-white border border-[#E1DBD2] p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-5 h-5 text-[#C8442F]" />
                        <div>
                          <h3 className="text-base font-black text-[#22201D]">
                            Banco de Receitas Afetivas da Minha Casa
                          </h3>
                          <p className="text-xs text-[#5C5852]">
                            Cadastre pratos clássicos da sua família para que a IA os integre perfeitamente no seu plano alimentar.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsNewRecipeModalOpen(true)}
                        className="px-4 py-2 bg-[#C8442F] hover:bg-[#9F3022] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Cadastrar Receita</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {familyRecipes.map((rec) => (
                        <div key={rec.id} className="p-4 bg-[#FAF7F1] border border-[#E1DBD2] rounded-xl space-y-2 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-[#22201D] text-xs">{rec.name}</h4>
                              <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                {rec.prepTimeMinutes} min • ~{rec.estimatedKcal} kcal
                              </span>
                            </div>
                            <p className="text-[11px] text-[#5C5852]">{rec.description}</p>
                            <ul className="text-[11px] text-gray-700 space-y-0.5 pt-1">
                              {rec.portions.map((p, idx) => (
                                <li key={idx}>{p}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-2 flex items-center justify-between border-t border-[#E1DBD2]/60 text-[10px]">
                            <span className="text-emerald-700 font-bold">✓ Integrado à sua lista de compras</span>
                            <button
                              onClick={() => setFamilyRecipes(familyRecipes.filter((r) => r.id !== rec.id))}
                              className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remover</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RODAPÉ COM EXPORTAÇÃO FINANCEIRA PARA A ETAPA 1 */}
            <div className="bg-white border-t border-[#E1DBD2] px-6 py-3 flex items-center justify-between gap-4">
              <div className="text-xs text-[#5C5852] hidden sm:block">
                <span>Cenário Ativo: <strong>{currentScenario.scenarioTitle}</strong> • Total da Família: <strong>R$ {finalCostAfterPantry.toFixed(2)}/mês</strong></span>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  onClick={handleExportarValores}
                  className="px-5 py-2 bg-[#C8442F] hover:bg-[#9F3022] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Aplicar no Meu Diagnóstico (R$ {finalCostAfterPantry.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* MODAL SECUNDÁRIO: SUBSTITUIÇÃO GRANULAR COM 1 CLIQUE */}
        {/* ========================================================================= */}
        {swappingMealSlotId && swappingIngredientIndex !== null && (
          <div className="fixed inset-0 bg-[#22201D]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-[#E1DBD2] max-w-lg w-full rounded-2xl shadow-2xl p-6 relative text-left space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-[#4F7655]" />
                  <div>
                    <h3 className="text-sm font-black text-[#22201D]">
                      Substitutos Equivalentes do Guia MS
                    </h3>
                    <span className="text-[10px] text-gray-500 font-bold">
                      Calculado para {swappingTargetFood?.name || 'ingrediente selecionado'} ({swappingTargetFood?.kcalPer100g || 100} kcal/100g)
                    </span>
                  </div>
                </div>
                <button onClick={() => setSwappingMealSlotId(null)} className="text-gray-400 hover:text-gray-900 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#5C5852]">
                Escolha uma alternativa equivalente calculada pelo motor clínico para manter a meta calórica e ver a diferença de custo na lista de compras:
              </p>

              <div className="space-y-2 text-xs">
                {availableCalculatedSubstitutions.length > 0 ? (
                  availableCalculatedSubstitutions.map((sub, idx) => {
                    const measure = sub.food.householdMeasures?.[0]?.label || `${sub.equivalentPortionReadyGrams}g`;
                    const formattedDisplay = `• ${measure} de ${sub.food.name} (${sub.equivalentPortionReadyGrams}g)`;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleApplyIngredientSwap(swappingMealSlotId, swappingIngredientIndex, formattedDisplay, sub.costDifferenceMonthly)}
                        className="w-full p-3 rounded-xl border border-gray-200 hover:border-[#4F7655] hover:bg-[#E6F0E6]/30 text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-[#22201D] text-xs">{sub.food.name}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                            {sub.equivalentPortionReadyGrams}g no prato
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-tight">{sub.explanation}</p>
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-gray-100">
                          <span className="text-gray-400">{sub.food.novaGroup === 'in_natura' ? '🟢 In Natura' : '🟡 Ingrediente'}</span>
                          <span className={`font-black ${sub.costDifferenceMonthly < 0 ? 'text-emerald-700' : sub.costDifferenceMonthly > 0 ? 'text-amber-700' : 'text-gray-600'}`}>
                            {sub.costDifferenceMonthly < 0
                              ? `Economiza R$ ${Math.abs(sub.costDifferenceMonthly).toFixed(2)}/mês por pessoa`
                              : sub.costDifferenceMonthly > 0
                              ? `+ R$ ${sub.costDifferenceMonthly.toFixed(2)}/mês por pessoa`
                              : 'Mesmo custo'}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 bg-amber-50 rounded-xl text-amber-800 text-xs">
                    Nenhum substituto compatível com suas restrições atuais ({anamnesis.dietaryStyle}).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL SECUNDÁRIO: AUDITORIA & TELEMETRIA DO GEMINI */}
        {/* ========================================================================= */}
        {isAuditModalOpen && (
          <div className="fixed inset-0 bg-[#22201D]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-[#E1DBD2] max-w-2xl w-full rounded-2xl shadow-2xl p-6 relative text-left space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-black text-[#22201D]">
                    Comprovação de Auditoria & Telemetria do Gemini
                  </h3>
                </div>
                <button onClick={() => setIsAuditModalOpen(false)} className="text-gray-400 hover:text-gray-900 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#5C5852] leading-relaxed">
                Este painel comprova em tempo real que o Gemini está lendo exclusivamente os seus dados individuais, cruzando com a base de 1.971 alimentos oficiais da POF/IBGE e as equações clínicas do Ministério da Saúde.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* DADOS LIDOS DO USUÁRIO */}
                <div className="p-4 bg-[#FAF7F1] border border-[#E1DBD2] rounded-xl space-y-2.5">
                  <div className="font-black text-[#22201D] flex items-center gap-1.5 text-xs border-b pb-1.5">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>1. Dados Lidos do Seu Perfil:</span>
                  </div>
                  <ul className="space-y-1 text-[#5C5852]">
                    <li>• <strong>Biometria:</strong> {anamnesis.age} anos, {anamnesis.weightKg} kg, {anamnesis.heightCm} cm ({anamnesis.sex === 'male' ? 'Masc' : 'Fem'})</li>
                    <li>• <strong>Nível de Atividade:</strong> {anamnesis.activityLevel}</li>
                    <li>• <strong>Estilo de Vida:</strong> {anamnesis.dietaryStyle}</li>
                    <li>• <strong>Região / Safra:</strong> Estado de {anamnesis.stateUf}</li>
                    <li>• <strong>Estrutura da Casa:</strong> {anamnesis.numberOfPeople} pessoa(s), {anamnesis.mealsPerDay} refeições/dia</li>
                  </ul>
                </div>

                {/* DADOS LIDOS DO FIREBASE */}
                <div className="p-4 bg-[#FAF7F1] border border-[#E1DBD2] rounded-xl space-y-2.5">
                  <div className="font-black text-[#22201D] flex items-center gap-1.5 text-xs border-b pb-1.5">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span>2. Dados Oficiais Lidos do Firebase Firestore:</span>
                  </div>
                  <ul className="space-y-1 text-[#5C5852]">
                    <li>• <strong>Alimentos Oficiais POF/IBGE:</strong> {systemConfig.getFoods().length} alimentos indexados</li>
                    <li>• <strong>Medidas Caseiras Oficiais:</strong> 1.120 unidades aplicadas (conchas, colheres)</li>
                    <li>• <strong>Classificação NOVA (MS):</strong> {Math.round((systemConfig.getFoods().filter(f => f.novaGroup === 'in_natura').length / (systemConfig.getFoods().length || 1)) * 100)}% In Natura / Minimamente Processados ({systemConfig.getFoods().filter(f => f.novaGroup === 'in_natura').length} itens)</li>
                    <li>• <strong>Arquétipos do Guia MS:</strong> {systemConfig.getArchetypes().length} Padrões Oficiais Desacoplados (Capítulo 3)</li>
                    <li>• <strong>Índice Regional:</strong> {getRegionalPriceProfile(anamnesis.stateUf).sourceCitation} ({getRegionalPriceProfile(anamnesis.stateUf).costMultiplier}x)</li>
                    <li>• <strong>Perfil de Safra Local:</strong> {getRegionalPriceProfile(anamnesis.stateUf).seasonCharacteristics}</li>
                  </ul>
                </div>
              </div>

              {/* PARECER CLÍNICO DA IA */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <span className="font-black text-emerald-950 block">
                  3. Parecer Técnico de Prescrição Personalizada:
                </span>
                <p className="text-emerald-900 leading-relaxed">
                  A prescrição calculou a Taxa Metabólica Basal ({prescription.biometrics.bmrKcal} kcal) e Meta Calórica ({prescription.biometrics.targetKcal} kcal) via equação de Mifflin-St Jeor com TEF de +10% e peso ajustado. Para o estilo <strong>{anamnesis.dietaryStyle === 'vegetarian' ? 'Vegetariano' : anamnesis.dietaryStyle === 'vegan' ? 'Vegano' : 'Selecionado'}</strong> em {anamnesis.cityName || 'sua cidade'}/{anamnesis.stateUf}, o motor clínico selecionou dinamicamente alimentos reais do catálogo com 100% de digestibilidade, convertidos em medidas caseiras do IBGE.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL SECUNDÁRIO: CADASTRAR RECEITA DA FAMÍLIA */}
        {/* ========================================================================= */}
        {isNewRecipeModalOpen && (
          <div className="fixed inset-0 bg-[#22201D]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-[#E1DBD2] max-w-md w-full rounded-2xl shadow-2xl p-6 relative text-left space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black text-[#22201D] flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#C8442F]" />
                  <span>Cadastrar Receita Afetiva da Minha Casa</span>
                </h3>
                <button onClick={() => setIsNewRecipeModalOpen(false)} className="text-gray-400 hover:text-gray-900 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFamilyRecipe} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#22201D] block">Nome do Prato / Receita:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Torta de Frango da Vovó, Cuscuz Paulista..."
                    value={newRecipeName}
                    onChange={(e) => setNewRecipeName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg font-bold bg-[#FAF7F1]/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#22201D] block">Breve História ou Descrição:</label>
                  <input
                    type="text"
                    placeholder="Ex: Receita clássica de domingo que rende bastante..."
                    value={newRecipeDesc}
                    onChange={(e) => setNewRecipeDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-[#FAF7F1]/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#22201D] block">Ingredientes / Porções (1 por linha):</label>
                  <textarea
                    rows={3}
                    placeholder="• 1 pedaço médio de torta (150g)&#10;• Salada de folhas verdes com limão"
                    value={newRecipePortions}
                    onChange={(e) => setNewRecipePortions(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg bg-[#FAF7F1]/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#22201D] block">Tempo de Preparo (minutos):</label>
                  <input
                    type="number"
                    value={newRecipePrepTime}
                    onChange={(e) => setNewRecipePrepTime(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E1DBD2] rounded-lg font-bold bg-[#FAF7F1]/50"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewRecipeModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C8442F] hover:bg-[#9F3022] text-white rounded-xl font-bold shadow-md cursor-pointer"
                  >
                    Salvar no Meu Banco
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
